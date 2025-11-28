/**
 * CAD 파일 로더 훅
 * 파일 로드, 파싱, 변환을 통합 관리
 */

import { useCallback, useState } from 'react';
import { useCADStore, useViewerStore } from '@stores';
import { dxfParser, hybridConverter } from '@services/cad';
import type { CADFile } from '@types/cad';

interface UseCADLoaderOptions {
    onLoadStart?: () => void;
    onLoadComplete?: () => void;
    onError?: (error: string) => void;
}

export function useCADLoader(options: UseCADLoaderOptions = {}) {
    const [isLoading, setIsLoading] = useState(false);

    // Store actions
    const setCurrentFile = useCADStore((state) => state.setCurrentFile);
    const setConversionStatus = useCADStore((state) => state.setConversionStatus);
    const setConversionProgress = useCADStore((state) => state.setConversionProgress);
    const setConversionError = useCADStore((state) => state.setConversionError);
    const setParseResult = useCADStore((state) => state.setParseResult);
    const setComplexity = useCADStore((state) => state.setComplexity);
    const setConversionResult = useCADStore((state) => state.setConversionResult);
    const clearResults = useCADStore((state) => state.clearResults);
    const initializeLayers = useViewerStore((state) => state.initializeLayers);

    // 파일 로드 및 변환
    const loadFile = useCallback(
        async (file: File) => {
            try {
                setIsLoading(true);
                options.onLoadStart?.();
                clearResults();

                // 파일 정보 저장
                const cadFile: CADFile = {
                    name: file.name,
                    size: file.size,
                    type: file.type || 'application/octet-stream',
                    lastModified: file.lastModified,
                    file,
                };
                setCurrentFile(cadFile);

                // 1. 파일 읽기
                setConversionStatus('analyzing');
                setConversionProgress(10);

                const content = await file.text();

                // 2. 파싱
                setConversionStatus('parsing');
                setConversionProgress(30);

                const parseResult = dxfParser.parse(content);
                setParseResult(parseResult);

                if (!parseResult.success || !parseResult.data) {
                    throw new Error(parseResult.errors?.[0] ?? '파싱 실패');
                }

                setConversionProgress(50);

                // 3. 변환 (하이브리드 전략)
                setConversionStatus('converting');

                const conversionResult = await hybridConverter.convert(
                    cadFile,
                    parseResult.data,
                    (progress) => {
                        setConversionProgress(50 + progress * 0.5);
                    }
                );

                // 복잡도 저장
                setComplexity(conversionResult.complexity ?? null);

                if (!conversionResult.success) {
                    throw new Error(conversionResult.error ?? '변환 실패');
                }

                // 4. 결과 저장
                setConversionResult(conversionResult);

                // 5. 레이어 초기화
                if (parseResult.data.layers) {
                    initializeLayers(parseResult.data.layers);
                }

                setConversionProgress(100);
                options.onLoadComplete?.();
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
                setConversionError(errorMessage);
                options.onError?.(errorMessage);
            } finally {
                setIsLoading(false);
            }
        },
        [
            options,
            clearResults,
            setCurrentFile,
            setConversionStatus,
            setConversionProgress,
            setParseResult,
            setComplexity,
            setConversionResult,
            setConversionError,
            initializeLayers,
        ]
    );

    // ArrayBuffer로부터 로드
    const loadFromBuffer = useCallback(
        async (buffer: ArrayBuffer, filename: string) => {
            const file = new File([buffer], filename);
            return loadFile(file);
        },
        [loadFile]
    );

    // URL로부터 로드
    const loadFromUrl = useCallback(
        async (url: string, filename?: string) => {
            try {
                setIsLoading(true);
                options.onLoadStart?.();
                setConversionStatus('analyzing');
                setConversionProgress(5);

                const response = await fetch(url);
                if (!response.ok) {
                    throw new Error(`HTTP 오류: ${response.status}`);
                }

                const blob = await response.blob();
                const file = new File([blob], filename ?? url.split('/').pop() ?? 'file.dxf');

                await loadFile(file);
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
                setConversionError(errorMessage);
                options.onError?.(errorMessage);
                setIsLoading(false);
            }
        },
        [loadFile, options, setConversionStatus, setConversionProgress, setConversionError]
    );

    // 리셋
    const reset = useCallback(() => {
        clearResults();
        setCurrentFile(null);
    }, [clearResults, setCurrentFile]);

    return {
        loadFile,
        loadFromBuffer,
        loadFromUrl,
        reset,
        isLoading,
    };
}
