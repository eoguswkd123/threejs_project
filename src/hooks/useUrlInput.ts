/**
 * useUrlInput - URL 입력 상태 관리 훅
 *
 * URL 입력, 유효성 검사, 에러 상태를 캡슐화
 * FilePanel/UrlInput 컴포넌트에서 사용
 *
 * @example
 * const {
 *   url,
 *   error,
 *   canSubmit,
 *   handleChange,
 *   handleSubmit,
 *   handleKeyDown,
 * } = useUrlInput({
 *   onSubmit: (url) => console.log(url),
 *   validationConfig: { acceptExtensions: ['.glb', '.gltf'] },
 * });
 */

import { useState, useCallback } from 'react';

import type { UrlValidationConfig } from '@/components/FilePanel';
import { validateUrl, validateExtension } from '@/utils';

// ============================================================================
// Types
// ============================================================================

/** useUrlInput 옵션 */
export interface UseUrlInputOptions {
    /** URL 제출 콜백 */
    onSubmit: (url: string) => void;
    /** URL 검증 설정 */
    validationConfig?: UrlValidationConfig | undefined;
    /** 외부 로딩 상태 (제출 비활성화용) */
    isLoading?: boolean;
}

/** useUrlInput 반환 타입 */
export interface UseUrlInputReturn {
    /** 현재 URL 값 */
    url: string;
    /** 에러 메시지 (없으면 null) */
    error: string | null;
    /** URL이 비어있지 않은지 */
    isValid: boolean;
    /** 제출 가능 여부 (isValid && !isLoading) */
    canSubmit: boolean;
    /** 입력 변경 핸들러 */
    handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    /** 제출 핸들러 */
    handleSubmit: () => void;
    /** 키보드 이벤트 핸들러 (Enter 제출) */
    handleKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
    /** 에러 초기화 */
    clearError: () => void;
    /** 전체 상태 초기화 */
    reset: () => void;
}

// ============================================================================
// Hook Implementation
// ============================================================================

export function useUrlInput({
    onSubmit,
    validationConfig,
    isLoading = false,
}: UseUrlInputOptions): UseUrlInputReturn {
    const [url, setUrl] = useState('');
    const [error, setError] = useState<string | null>(null);

    // 계산된 값
    const isValid = url.trim().length > 0;
    const canSubmit = isValid && !isLoading;

    // 유틸리티 함수
    const clearError = useCallback(() => {
        setError(null);
    }, []);

    const reset = useCallback(() => {
        setUrl('');
        setError(null);
    }, []);

    // 이벤트 핸들러
    const handleChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            setUrl(e.target.value);
            setError(null); // 입력 시 에러 자동 초기화
        },
        []
    );

    const handleSubmit = useCallback(() => {
        const trimmedUrl = url.trim();

        // 1. URL 형식 검증
        const urlValidation = validateUrl(trimmedUrl);
        if (!urlValidation.valid && urlValidation.error) {
            setError(urlValidation.error.message);
            return;
        }

        // 2. 확장자 검증 (설정된 경우)
        if (
            validationConfig?.acceptExtensions &&
            validationConfig.acceptExtensions.length > 0
        ) {
            try {
                const pathname = new URL(trimmedUrl).pathname;
                const extValidation = validateExtension(
                    pathname,
                    validationConfig.acceptExtensions
                );
                if (!extValidation.valid && extValidation.error) {
                    setError(extValidation.error.message);
                    return;
                }
            } catch (e) {
                // URL 파싱 실패: validateUrl을 통과했지만 new URL() 실패하는 엣지 케이스
                // 예: 유효한 형식이지만 특수문자가 포함된 경우
                if (process.env.NODE_ENV === 'development') {
                    console.warn('[useUrlInput] URL parsing failed:', e);
                }
                setError('URL 형식이 올바르지 않습니다.');
                return;
            }
        }

        setError(null);
        onSubmit(trimmedUrl);
        setUrl(''); // 성공 시 입력 초기화
    }, [url, onSubmit, validationConfig]);

    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent<HTMLInputElement>) => {
            if (e.key === 'Enter' && canSubmit) {
                handleSubmit();
            }
        },
        [handleSubmit, canSubmit]
    );

    return {
        url,
        error,
        isValid,
        canSubmit,
        handleChange,
        handleSubmit,
        handleKeyDown,
        clearError,
        reset,
    };
}
