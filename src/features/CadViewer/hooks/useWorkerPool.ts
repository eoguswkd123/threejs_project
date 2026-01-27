/**
 * CAD Viewer - Worker Pool Hook
 * Worker Pool 인스턴스 접근 및 라이프사이클 관리
 *
 * @description
 * - DxfWorkerPool Singleton 인스턴스 접근
 * - 파일 파싱 API 제공 (Pool 통해)
 * - Pool 상태 조회 기능
 */

import { useMemo, useCallback, useState } from 'react';

import type { ParsedCADData } from '@/types/cad';

import { DxfWorkerPool, type PoolStatus } from '../services/workerPool';

import type { UploadError } from '../types';

/** useWorkerPool 반환 타입 */
export interface UseWorkerPoolReturn {
    /** DXF 파일 파싱 (Pool 사용) */
    parse: (
        file: File,
        onProgress?: (stage: string, percent: number) => void
    ) => Promise<ParsedCADData>;
    /** Pool 상태 조회 */
    getStatus: () => PoolStatus;
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
}

/**
 * Worker Pool Hook
 * Pool 인스턴스 접근 및 라이프사이클 관리
 *
 * @example
 * ```tsx
 * const { parse, getStatus, isLoading, progress } = useWorkerPool();
 *
 * const handleFileSelect = async (file: File) => {
 *     const data = await parse(file, (stage, percent) => {
 *         console.log(`${stage}: ${percent}%`);
 *     });
 *     setCadData(data);
 * };
 *
 * // Pool 상태 확인
 * const status = getStatus();
 * console.log(`Workers: ${status.idle}/${status.total}, Queue: ${status.queued}`);
 * ```
 */
export function useWorkerPool(): UseWorkerPoolReturn {
    const [isLoading, setIsLoading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [progressStage, setProgressStage] = useState('');
    const [error, setError] = useState<UploadError | null>(null);

    // Pool은 Singleton이므로 useMemo로 한 번만 획득
    const pool = useMemo(() => DxfWorkerPool.getInstance(), []);

    const clearError = useCallback(() => {
        setError(null);
        setProgress(0);
        setProgressStage('');
    }, []);

    const parse = useCallback(
        async (
            file: File,
            onProgress?: (stage: string, percent: number) => void
        ): Promise<ParsedCADData> => {
            setIsLoading(true);
            setError(null);
            setProgress(0);
            setProgressStage('파일 읽는 중...');

            try {
                // 파일 텍스트 읽기
                const text = await file.text();

                // Pool에서 파싱 실행
                const result = await pool.execute({
                    text,
                    fileName: file.name,
                    fileSize: file.size,
                    onProgress: (stage, percent) => {
                        setProgress(percent);
                        setProgressStage(stage);
                        onProgress?.(stage, percent);
                    },
                });

                setIsLoading(false);
                setProgress(100);
                return result;
            } catch (err) {
                const uploadError = err as UploadError;
                setError(uploadError);
                setIsLoading(false);
                throw uploadError;
            }
        },
        [pool]
    );

    const getStatus = useCallback(() => pool.getStatus(), [pool]);

    return {
        parse,
        getStatus,
        isLoading,
        progress,
        progressStage,
        error,
        clearError,
    };
}
