/**
 * DXF File Loader Hook
 * DXF 파일 로딩 전용 훅
 *
 * SRP 분리: useDxfLoader에서 파일 로딩 책임 분리
 */

import { useState, useCallback } from 'react';

import type { SampleInfo, UploadError } from '@/components/FilePanel';
import type { ParsedCADData } from '@/types/cad';
import { validateSecureUrl, validateExtension } from '@/utils';

import { URL_SECURITY_CONFIG } from '../constants';

import { useDxfWorker } from './useDxfWorker';

/** useDxfFileLoader 옵션 */
export interface UseDxfFileLoaderOptions {
    /** 파싱 완료 시 콜백 (레이어/카메라 연동용) */
    onDataLoaded?: (data: ParsedCADData) => void;
}

/** useDxfFileLoader 반환 타입 */
export interface UseDxfFileLoaderReturn {
    /** 파싱된 CAD 데이터 */
    cadData: ParsedCADData | null;
    /** 로딩 상태 */
    isLoading: boolean;
    /** 진행률 (0-100) */
    progress: number;
    /** 진행 단계 */
    progressStage: string;
    /** 에러 정보 */
    error: UploadError | null;
    /** 파일 선택 핸들러 */
    handleFileSelect: (file: File) => Promise<void>;
    /** 샘플 파일 선택 핸들러 */
    handleSelectSample: (sample: SampleInfo) => Promise<void>;
    /** URL 로드 핸들러 */
    handleUrlSubmit: (url: string) => Promise<void>;
    /** 파일 리셋 핸들러 */
    handleResetFile: () => void;
    /** 에러 초기화 */
    clearError: () => void;
}

/**
 * DXF 파일 로딩 훅
 * @param options 훅 옵션
 * @returns 파일 상태 및 제어 함수
 */
export function useDxfFileLoader(
    options: UseDxfFileLoaderOptions = {}
): UseDxfFileLoaderReturn {
    const { onDataLoaded } = options;

    // DXF 파서 훅
    const { parse, isLoading, progress, progressStage, error, clearError } =
        useDxfWorker();

    // 상태
    const [cadData, setCadData] = useState<ParsedCADData | null>(null);

    /** 파일 선택 핸들러 */
    const handleFileSelect = useCallback(
        async (file: File) => {
            clearError();
            try {
                const data = await parse(file);
                setCadData(data);

                // 콜백 호출 (레이어/카메라 연동)
                if (onDataLoaded) {
                    onDataLoaded(data);
                }
            } catch (err) {
                // 에러는 useDxfWorker에서 처리됨
                if (import.meta.env.DEV) {
                    console.error('Failed to parse DXF:', err);
                }
            }
        },
        [parse, clearError, onDataLoaded]
    );

    /** 샘플 파일 선택 핸들러 */
    const handleSelectSample = useCallback(
        async (sample: SampleInfo) => {
            try {
                const response = await fetch(sample.path);
                if (!response.ok) {
                    throw new Error('샘플 파일을 불러올 수 없습니다.');
                }
                const text = await response.text();
                const file = new File([text], sample.name + '.dxf', {
                    type: 'application/dxf',
                });
                await handleFileSelect(file);
            } catch (err) {
                if (import.meta.env.DEV) {
                    console.error('Failed to load sample:', err);
                }
            }
        },
        [handleFileSelect]
    );

    /** URL 로드 핸들러 (보안 강화) */
    const handleUrlSubmit = useCallback(
        async (url: string) => {
            clearError();

            // 1. URL 보안 검증
            const urlValidation = validateSecureUrl(url, {
                allowedProtocols: URL_SECURITY_CONFIG.allowedProtocols,
                allowedHosts: URL_SECURITY_CONFIG.allowedHosts,
            });
            if (!urlValidation.valid) {
                if (import.meta.env.DEV) {
                    console.error(
                        'URL validation failed:',
                        urlValidation.error?.message
                    );
                }
                return;
            }

            // 2. 확장자 검증
            const pathname = new URL(url).pathname;
            const extValidation = validateExtension(pathname, ['.dxf']);
            if (!extValidation.valid) {
                if (import.meta.env.DEV) {
                    console.error(
                        'Extension validation failed:',
                        extValidation.error?.message
                    );
                }
                return;
            }

            try {
                // 3. AbortController로 타임아웃 설정
                const controller = new AbortController();
                const timeoutId = setTimeout(
                    () => controller.abort(),
                    URL_SECURITY_CONFIG.fetchTimeout
                );

                const response = await fetch(url, {
                    signal: controller.signal,
                    headers: {
                        Accept: 'application/dxf, text/plain, */*',
                    },
                });
                clearTimeout(timeoutId);

                if (!response.ok) {
                    throw new Error('URL에서 파일을 불러올 수 없습니다.');
                }

                // 4. 응답 크기 검증
                const contentLength = response.headers.get('content-length');
                if (
                    contentLength &&
                    parseInt(contentLength) >
                        URL_SECURITY_CONFIG.maxResponseSize
                ) {
                    throw new Error('파일 크기가 너무 큽니다.');
                }

                const text = await response.text();

                // 5. 응답 크기 재검증 (Content-Length 헤더가 없는 경우)
                if (text.length > URL_SECURITY_CONFIG.maxResponseSize) {
                    throw new Error('파일 크기가 너무 큽니다.');
                }

                // URL에서 파일명 추출 (경로 탐색 방지)
                const pathParts = new URL(url).pathname.split('/');
                const rawFileName =
                    pathParts[pathParts.length - 1] || 'remote.dxf';
                // 파일명 정제 (경로 구분자 제거)
                const fileName = rawFileName.replace(/[/\\]/g, '_');

                const file = new File([text], fileName, {
                    type: 'application/dxf',
                });
                await handleFileSelect(file);
            } catch (err) {
                if (import.meta.env.DEV) {
                    if (err instanceof Error && err.name === 'AbortError') {
                        console.error('URL fetch timeout');
                    } else {
                        console.error('Failed to load from URL:', err);
                    }
                }
            }
        },
        [handleFileSelect, clearError]
    );

    /** 파일 리셋 핸들러 */
    const handleResetFile = useCallback(() => {
        setCadData(null);
        clearError();
    }, [clearError]);

    return {
        cadData,
        isLoading,
        progress,
        progressStage,
        error,
        handleFileSelect,
        handleSelectSample,
        handleUrlSubmit,
        handleResetFile,
        clearError,
    };
}
