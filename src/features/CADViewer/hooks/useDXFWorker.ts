/**
 * CAD Viewer - DXF Worker Hook
 * WebWorker를 사용한 대용량 DXF 파싱 훅
 */

import { useState, useCallback, useRef, useEffect } from 'react';

import { ERROR_MESSAGES, WORKER_THRESHOLD_BYTES } from '../constants';

import type { ParsedCADData, LayerInfo, UploadError } from '../types';
import type {
    WorkerRequest,
    WorkerResponse,
    WorkerSuccessPayload,
} from '../workers/dxfParserV2.worker';

interface UseDXFWorkerReturn {
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
}

/**
 * WebWorker를 사용한 DXF 파싱 훅
 * 대용량 파일 (> 1MB)에서 자동으로 Worker 사용
 */
export function useDXFWorker(): UseDXFWorkerReturn {
    const [isLoading, setIsLoading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [progressStage, setProgressStage] = useState('');
    const [error, setError] = useState<UploadError | null>(null);
    const workerRef = useRef<Worker | null>(null);

    // Cleanup worker on unmount
    useEffect(() => {
        return () => {
            if (workerRef.current) {
                workerRef.current.terminate();
                workerRef.current = null;
            }
        };
    }, []);

    const clearError = useCallback(() => {
        setError(null);
        setProgress(0);
        setProgressStage('');
    }, []);

    const cancel = useCallback(() => {
        if (workerRef.current) {
            workerRef.current.terminate();
            workerRef.current = null;
        }
        setIsLoading(false);
        setProgress(0);
        setProgressStage('');
    }, []);

    const parse = useCallback(async (file: File): Promise<ParsedCADData> => {
        setIsLoading(true);
        setError(null);
        setProgress(0);
        setProgressStage('파일 읽는 중...');

        try {
            const text = await file.text();

            // Worker 생성 (v2: 레이어 색상 수정)
            const worker = new Worker(
                new URL('../workers/dxfParserV2.worker.ts', import.meta.url),
                { type: 'module' }
            );
            workerRef.current = worker;

            return new Promise<ParsedCADData>((resolve, reject) => {
                worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
                    const { type, payload } = event.data;

                    if (type === 'progress') {
                        const progressPayload = payload as {
                            stage: string;
                            percent: number;
                        };
                        setProgress(progressPayload.percent);
                        setProgressStage(progressPayload.stage);
                    } else if (type === 'success') {
                        const successPayload = payload as WorkerSuccessPayload;

                        // 배열을 다시 Map으로 변환
                        const layersMap = new Map<string, LayerInfo>(
                            successPayload.layers
                        );

                        const result: ParsedCADData = {
                            lines: successPayload.lines,
                            circles: successPayload.circles,
                            arcs: successPayload.arcs,
                            polylines: successPayload.polylines,
                            bounds: successPayload.bounds,
                            metadata: successPayload.metadata,
                            layers: layersMap,
                        };

                        setIsLoading(false);
                        setProgress(100);
                        worker.terminate();
                        workerRef.current = null;
                        resolve(result);
                    } else if (type === 'error') {
                        const errorPayload = payload as {
                            code: string;
                            message: string;
                        };
                        const parseError: UploadError = {
                            code: errorPayload.code,
                            message:
                                errorPayload.code === 'EMPTY_FILE'
                                    ? ERROR_MESSAGES.EMPTY_FILE
                                    : ERROR_MESSAGES.PARSE_ERROR,
                        };
                        setError(parseError);
                        setIsLoading(false);
                        worker.terminate();
                        workerRef.current = null;
                        reject(parseError);
                    }
                };

                worker.onerror = () => {
                    const parseError: UploadError = {
                        code: 'WORKER_ERROR',
                        message: 'Worker 오류가 발생했습니다.',
                    };
                    setError(parseError);
                    setIsLoading(false);
                    worker.terminate();
                    workerRef.current = null;
                    reject(parseError);
                };

                // Worker에 파싱 요청
                const request: WorkerRequest = {
                    type: 'parse',
                    payload: {
                        text,
                        fileName: file.name,
                        fileSize: file.size,
                    },
                };
                worker.postMessage(request);
            });
        } catch (err) {
            setIsLoading(false);

            if (err && typeof err === 'object' && 'code' in err) {
                throw err;
            }

            const parseError: UploadError = {
                code: 'PARSE_ERROR',
                message: ERROR_MESSAGES.PARSE_ERROR,
            };
            setError(parseError);
            throw parseError;
        }
    }, []);

    return {
        parse,
        isLoading,
        progress,
        progressStage,
        error,
        clearError,
        cancel,
    };
}

/**
 * 파일 크기에 따라 적절한 파서 선택
 */
export function shouldUseWorker(fileSize: number): boolean {
    return fileSize > WORKER_THRESHOLD_BYTES;
}
