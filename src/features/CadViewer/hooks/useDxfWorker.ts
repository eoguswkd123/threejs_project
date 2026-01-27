/**
 * CAD Viewer - DXF Worker Hook
 * WebWorker를 사용한 대용량 DXF 파싱 훅
 *
 * Phase 2.1.5: 재시도 로직 및 Fallback 메커니즘 추가
 * - 지수 백오프 재시도 (WORKER_ERROR, TIMEOUT)
 * - Main Thread 파서로 Fallback
 *
 * Phase 2.2.0: Worker Pool 사용
 * - Worker 재사용으로 생성 오버헤드 제거
 * - Pool 기반 병렬 처리 지원
 */

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';

import { MESSAGES } from '@/locales';
import type { ParsedCADData } from '@/types/cad';

import { WORKER_THRESHOLD_BYTES, WORKER_RETRY_CONFIG } from '../constants';
import { DxfWorkerPool } from '../services/workerPool';

import type { UploadError } from '../types';

/** 재시도 상태 */
export interface RetryState {
    /** 현재 시도 횟수 (0부터 시작) */
    attempt: number;
    /** 최대 시도 횟수 */
    maxAttempts: number;
    /** 재시도 중 여부 */
    isRetrying: boolean;
    /** 마지막 에러 코드 */
    lastErrorCode: UploadError['code'] | null;
}

interface UseDxfWorkerReturn {
    /** DXF 파일 파싱 함수 */
    parse: (file: File) => Promise<ParsedCADData>;
    /** 로딩 상태 */
    isLoading: boolean;
    /** 진행률 (0-100) */
    progress: number;
    /** 진행 단계 메시지 */
    progressStage: string;
    /** 에러 상태 */
    error: UploadError | null;
    /** 에러 초기화 */
    clearError: () => void;
    /** 파싱 취소 */
    cancel: () => void;
    /** 재시도 상태 */
    retryState: RetryState;
}

/** 초기 재시도 상태 */
const INITIAL_RETRY_STATE: RetryState = {
    attempt: 0,
    maxAttempts: WORKER_RETRY_CONFIG.maxRetries + 1, // 초기 시도 포함
    isRetrying: false,
    lastErrorCode: null,
};

/**
 * 에러 코드가 재시도 가능한지 확인
 */
function isRetryableError(code: UploadError['code']): boolean {
    return (WORKER_RETRY_CONFIG.retryableErrors as readonly string[]).includes(
        code
    );
}

/**
 * 지수 백오프 딜레이 계산
 * @param attempt 현재 시도 횟수 (0부터 시작)
 * @returns 대기 시간 (ms)
 */
function calculateBackoffDelay(attempt: number): number {
    const delay =
        WORKER_RETRY_CONFIG.baseDelayMs *
        Math.pow(WORKER_RETRY_CONFIG.backoffMultiplier, attempt);
    return Math.min(delay, WORKER_RETRY_CONFIG.maxDelayMs);
}

/**
 * WebWorker를 사용한 DXF 파싱 훅
 * Worker Pool 사용으로 생성 오버헤드 제거
 *
 * 재시도 전략:
 * - WORKER_ERROR, TIMEOUT: 지수 백오프로 최대 3회 재시도
 * - PARSE_ERROR, EMPTY_FILE: 즉시 실패 (재시도 불가)
 */
export function useDxfWorker(): UseDxfWorkerReturn {
    const [isLoading, setIsLoading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [progressStage, setProgressStage] = useState('');
    const [error, setError] = useState<UploadError | null>(null);
    const [retryState, setRetryState] =
        useState<RetryState>(INITIAL_RETRY_STATE);
    const cancelledRef = useRef(false);

    // Worker Pool (Singleton) - 재사용으로 생성 오버헤드 제거
    const pool = useMemo(() => DxfWorkerPool.getInstance(), []);

    // Pool은 Singleton이므로 컴포넌트 언마운트 시 정리 불필요
    // Pool 자체의 정리는 앱 종료 시에만 수행
    useEffect(() => {
        return () => {
            // 컴포넌트 언마운트 시 진행 중인 작업 취소 플래그만 설정
            cancelledRef.current = true;
        };
    }, []);

    const clearError = useCallback(() => {
        setError(null);
        setProgress(0);
        setProgressStage('');
        setRetryState(INITIAL_RETRY_STATE);
    }, []);

    const cancel = useCallback(() => {
        cancelledRef.current = true;
        setIsLoading(false);
        setProgress(0);
        setProgressStage('');
        setRetryState(INITIAL_RETRY_STATE);
    }, []);

    /**
     * Pool을 통한 단일 파싱 시도
     * @param text DXF 파일 텍스트
     * @param fileName 파일명
     * @param fileSize 파일 크기
     * @returns 파싱된 CAD 데이터
     */
    const attemptPoolParse = useCallback(
        async (
            text: string,
            fileName: string,
            fileSize: number
        ): Promise<ParsedCADData> => {
            try {
                const result = await pool.execute({
                    text,
                    fileName,
                    fileSize,
                    onProgress: (stage, percent) => {
                        setProgress(percent);
                        setProgressStage(stage);
                    },
                });
                return result;
            } catch (err) {
                const uploadError = err as UploadError;
                // 에러 메시지 로컬라이즈
                if (uploadError.code === 'EMPTY_FILE') {
                    throw {
                        code: 'EMPTY_FILE',
                        message: MESSAGES.cadViewer.errors.emptyFile,
                    } as UploadError;
                }
                throw uploadError;
            }
        },
        [pool]
    );

    const parse = useCallback(
        async (file: File): Promise<ParsedCADData> => {
            cancelledRef.current = false;
            setIsLoading(true);
            setError(null);
            setProgress(0);
            setProgressStage('파일 읽는 중...');
            setRetryState(INITIAL_RETRY_STATE);

            let text: string;
            try {
                text = await file.text();
            } catch {
                const readError: UploadError = {
                    code: 'FILE_READ_ERROR',
                    message: '파일을 읽을 수 없습니다.',
                };
                setError(readError);
                setIsLoading(false);
                throw readError;
            }

            let lastError: UploadError | null = null;
            const maxAttempts = WORKER_RETRY_CONFIG.maxRetries + 1;

            // 재시도 루프
            for (let attempt = 0; attempt < maxAttempts; attempt++) {
                // 취소 확인
                if (cancelledRef.current) {
                    const cancelError: UploadError = {
                        code: 'PARSE_ERROR',
                        message: '파싱이 취소되었습니다.',
                    };
                    throw cancelError;
                }

                // 재시도 상태 업데이트
                setRetryState({
                    attempt,
                    maxAttempts,
                    isRetrying: attempt > 0,
                    lastErrorCode: lastError?.code ?? null,
                });

                // 재시도 시 진행 상태 메시지 업데이트
                if (attempt > 0) {
                    const delay = calculateBackoffDelay(attempt - 1);
                    setProgressStage(
                        `재시도 중... (${attempt}/${WORKER_RETRY_CONFIG.maxRetries})`
                    );
                    setProgress(0);

                    // 지수 백오프 대기
                    await new Promise((resolve) => setTimeout(resolve, delay));

                    // 대기 후 취소 확인
                    if (cancelledRef.current) {
                        const cancelError: UploadError = {
                            code: 'PARSE_ERROR',
                            message: '파싱이 취소되었습니다.',
                        };
                        throw cancelError;
                    }
                }

                try {
                    // Pool을 통한 파싱 (Worker 재사용)
                    const result = await attemptPoolParse(
                        text,
                        file.name,
                        file.size
                    );

                    // 성공
                    setIsLoading(false);
                    setProgress(100);
                    setRetryState({
                        attempt,
                        maxAttempts,
                        isRetrying: false,
                        lastErrorCode: null,
                    });
                    return result;
                } catch (err) {
                    lastError = err as UploadError;

                    // 재시도 불가능한 에러는 즉시 실패
                    if (!isRetryableError(lastError.code)) {
                        setError(lastError);
                        setIsLoading(false);
                        setRetryState({
                            attempt,
                            maxAttempts,
                            isRetrying: false,
                            lastErrorCode: lastError.code,
                        });
                        throw lastError;
                    }

                    // 마지막 시도가 아니면 계속 재시도
                    if (attempt < maxAttempts - 1) {
                        continue;
                    }
                }
            }

            // 모든 재시도 실패 시 최종 에러
            const finalError: UploadError = lastError ?? {
                code: 'WORKER_ERROR',
                message: `Worker 파싱 실패 (${maxAttempts}회 시도)`,
            };
            setError(finalError);
            setIsLoading(false);
            setRetryState({
                attempt: maxAttempts - 1,
                maxAttempts,
                isRetrying: false,
                lastErrorCode: finalError.code,
            });
            throw finalError;
        },
        [attemptPoolParse]
    );

    return {
        parse,
        isLoading,
        progress,
        progressStage,
        error,
        clearError,
        cancel,
        retryState,
    };
}

/**
 * 파일 크기에 따라 적절한 파서 선택
 */
export function shouldUseWorker(fileSize: number): boolean {
    return fileSize > WORKER_THRESHOLD_BYTES;
}
