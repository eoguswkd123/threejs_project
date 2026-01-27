/**
 * WorkerViewer - useGltfLoader Hook
 * glTF/glb 모델 로딩 및 상태 관리
 */

import { useState, useCallback } from 'react';

import { MESSAGES } from '@/locales';
import {
    classifyError,
    validateSecureUrl,
    validateExtension,
    isInternalResource,
    GLTF_ALLOWED_EXTENSIONS,
} from '@/utils';

import { URL_SECURITY_CONFIG } from '../constants';
import { workerService } from '../services';

import type { ModelInfo, LoadingStatus, LoadError } from '../types';

/** Hook 반환 타입 */
export interface UseGltfLoaderReturn {
    /** 사용 가능한 모델 목록 */
    models: ModelInfo[];
    /** 선택된 모델 */
    selectedModel: ModelInfo | null;
    /** 로딩 상태 */
    status: LoadingStatus;
    /** 에러 정보 */
    error: LoadError | null;
    /** 모델 목록 가져오기 */
    fetchModels: () => Promise<void>;
    /** ID로 모델 선택 */
    selectModel: (id: string) => Promise<void>;
    /** URL로 모델 로드 */
    loadModelFromUrl: (url: string) => void;
    /** 모델 초기화 */
    clearModel: () => void;
    /** 에러 초기화 */
    clearError: () => void;
}

/**
 * glTF/glb 모델 로딩 훅
 * @returns 모델 상태 및 제어 함수
 */
export function useGltfLoader(): UseGltfLoaderReturn {
    const [models, setModels] = useState<ModelInfo[]>([]);
    const [selectedModel, setSelectedModel] = useState<ModelInfo | null>(null);
    const [status, setStatus] = useState<LoadingStatus>('idle');
    const [error, setError] = useState<LoadError | null>(null);

    /** 모델 목록 가져오기 */
    const fetchModels = useCallback(async () => {
        setStatus('loading');
        setError(null);

        try {
            const result = await workerService.getAvailableModels();
            setModels(result);
            setStatus('success');
        } catch (e) {
            setError(classifyError(e));
            setStatus('error');
        }
    }, []);

    /** ID로 모델 선택 */
    const selectModel = useCallback(async (id: string) => {
        setStatus('loading');
        setError(null);

        try {
            const model = await workerService.fetchModelById(id);
            if (!model) {
                setError({
                    code: 'NOT_FOUND',
                    message: MESSAGES.workerViewer.errors.notFound,
                });
                setStatus('error');
                return;
            }
            setSelectedModel(model);
            setStatus('success');
        } catch (e) {
            setError(classifyError(e));
            setStatus('error');
        }
    }, []);

    /** URL로 모델 로드 (SSRF 방지 적용) */
    const loadModelFromUrl = useCallback((url: string) => {
        // 내부 리소스가 아닌 경우에만 검증
        if (!isInternalResource(url)) {
            // 1. SSRF 방지: 프로토콜 + 호스트 화이트리스트 검증
            const urlValidation = validateSecureUrl(url, URL_SECURITY_CONFIG);
            if (!urlValidation.valid && urlValidation.error) {
                setError({
                    code: 'INVALID_URL',
                    message: urlValidation.error.message,
                });
                setStatus('error');
                return;
            }

            // 2. 확장자 검증
            const pathname = new URL(url).pathname;
            const extValidation = validateExtension(
                pathname,
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

        setStatus('loading');
        setError(null);

        try {
            const model = workerService.createModelFromUrl(url);
            setSelectedModel(model);
            setStatus('success');
        } catch (e) {
            setError(classifyError(e));
            setStatus('error');
        }
    }, []);

    /** 모델 초기화 */
    const clearModel = useCallback(() => {
        setSelectedModel(null);
        setStatus('idle');
    }, []);

    /** 에러 초기화 */
    const clearError = useCallback(() => {
        setError(null);
    }, []);

    return {
        models,
        selectedModel,
        status,
        error,
        fetchModels,
        selectModel,
        loadModelFromUrl,
        clearModel,
        clearError,
    };
}
