/**
 * HologramViewer - useHologramLoader Hook
 *
 * glTF/glb 모델 로딩 및 상태 관리
 * WorkerViewer의 useGltfLoader 패턴 기반
 */

import { useState, useCallback } from 'react';

import {
    validateSecureUrl,
    validateExtension,
    isInternalResource,
    extractFileName,
    detectGltfFormat,
    GLTF_ALLOWED_EXTENSIONS,
} from '@/utils';

import { HOLOGRAM_URL_SECURITY_CONFIG } from '../constants';

import type {
    HologramModelInfo,
    HologramLoadingStatus,
    HologramLoadError,
} from '../types';

interface UseHologramLoaderReturn {
    /** 현재 선택된 모델 */
    selectedModel: HologramModelInfo | null;
    /** 로딩 상태 */
    status: HologramLoadingStatus;
    /** 에러 정보 */
    error: HologramLoadError | null;
    /** URL에서 모델 로드 */
    loadModelFromUrl: (url: string, name?: string) => Promise<void>;
    /** File 객체에서 모델 로드 */
    loadModelFromFile: (file: File) => Promise<string | null>;
    /** 모델 클리어 */
    clearModel: () => void;
}

/**
 * 홀로그램 모델 로더 훅
 *
 * @example
 * const { selectedModel, status, loadModelFromUrl } = useHologramLoader();
 * await loadModelFromUrl('https://example.com/model.glb');
 */
export function useHologramLoader(): UseHologramLoaderReturn {
    const [selectedModel, setSelectedModel] =
        useState<HologramModelInfo | null>(null);
    const [status, setStatus] = useState<HologramLoadingStatus>('idle');
    const [error, setError] = useState<HologramLoadError | null>(null);

    /**
     * URL에서 모델 로드
     */
    const loadModelFromUrl = useCallback(
        async (url: string, name?: string): Promise<void> => {
            setStatus('loading');
            setError(null);

            // 내부 리소스가 아닌 경우에만 검증
            if (!isInternalResource(url)) {
                // 1. URL 보안 검증 (SSRF 방지)
                const urlValidation = validateSecureUrl(
                    url,
                    HOLOGRAM_URL_SECURITY_CONFIG
                );
                if (!urlValidation.valid && urlValidation.error) {
                    setError({
                        code: 'INVALID_URL',
                        message: urlValidation.error.message,
                    });
                    setStatus('error');
                    return;
                }

                // 2. 확장자 검증
                const extValidation = validateExtension(
                    url,
                    GLTF_ALLOWED_EXTENSIONS
                );
                if (!extValidation.valid && extValidation.error) {
                    setError({
                        code: 'INVALID_EXTENSION',
                        message: extValidation.error.message,
                    });
                    setStatus('error');
                    return;
                }
            }

            const fileName = name || extractFileName(url, 'model');
            const format = detectGltfFormat(url);

            setSelectedModel({
                id: crypto.randomUUID(),
                name: fileName,
                url,
                format,
            });
            setStatus('success');
        },
        []
    );

    /**
     * File 객체에서 모델 로드
     * @returns ObjectURL 또는 null
     */
    const loadModelFromFile = useCallback(
        async (file: File): Promise<string | null> => {
            setStatus('loading');
            setError(null);

            // 확장자 검증
            const extValidation = validateExtension(
                file.name,
                GLTF_ALLOWED_EXTENSIONS
            );
            if (!extValidation.valid && extValidation.error) {
                setError({
                    code: 'INVALID_EXTENSION',
                    message: extValidation.error.message,
                });
                setStatus('error');
                return null;
            }

            // ObjectURL 생성
            const objectUrl = URL.createObjectURL(file);
            const format = detectGltfFormat(file.name);

            setSelectedModel({
                id: crypto.randomUUID(),
                name: file.name,
                url: objectUrl,
                fileSize: file.size,
                format,
            });
            setStatus('success');

            return objectUrl;
        },
        []
    );

    /**
     * 모델 클리어
     */
    const clearModel = useCallback(() => {
        setSelectedModel(null);
        setStatus('idle');
        setError(null);
    }, []);

    return {
        selectedModel,
        status,
        error,
        loadModelFromUrl,
        loadModelFromFile,
        clearModel,
    };
}
