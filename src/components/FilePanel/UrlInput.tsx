/**
 * UrlInput - URL 입력 컴포넌트
 *
 * 외부 URL로 모델 로드 기능 제공
 * 텍스트 입력 + 로드 버튼 구성
 * URL 유효성 검사는 useUrlInput 훅에서 처리
 */

import { memo } from 'react';

import { Link, Loader2, AlertCircle } from 'lucide-react';

import { ACCENT_CLASSES } from '@/components/Common/constants';
import { useUrlInput } from '@/hooks';
import { MESSAGES } from '@/locales';

import type { UrlInputProps } from './types';

// ============================================================
// Styles
// ============================================================

const styles = {
    container: 'rounded-lg bg-gray-900/90 p-3 backdrop-blur-sm',
    header: 'mb-2 flex items-center gap-2',
    headerIcon: 'h-4 w-4',
    headerText: 'text-xs text-gray-400',
    inputWrapper: 'flex gap-2',
    input: 'flex-1 rounded bg-gray-700 px-2 py-1.5 text-sm text-gray-200 placeholder:text-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500 disabled:opacity-50',
    button: 'rounded px-3 py-1.5 text-sm font-medium text-white transition-colors disabled:opacity-50',
};

function UrlInputComponent({
    onUrlSubmit,
    isLoading = false,
    placeholder = 'https://example.com/model.glb',
    accentColor = 'green',
    validationConfig,
}: UrlInputProps) {
    const { url, error, canSubmit, handleChange, handleSubmit, handleKeyDown } =
        useUrlInput({
            onSubmit: onUrlSubmit,
            validationConfig,
            isLoading,
        });

    const colors = ACCENT_CLASSES[accentColor];

    const buttonColorClass =
        accentColor === 'blue'
            ? 'bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800'
            : 'bg-green-600 hover:bg-green-500 disabled:bg-green-800';

    return (
        <div className={styles.container}>
            {/* 헤더 */}
            <div className={styles.header}>
                <Link className={`${styles.headerIcon} ${colors.icon}`} />
                <span className={styles.headerText}>
                    {MESSAGES.filePanel.urlHeader}
                </span>
            </div>

            {/* 입력 영역 */}
            <div className={styles.inputWrapper}>
                <input
                    type="url"
                    value={url}
                    onChange={handleChange}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder}
                    className={`${styles.input} ${error ? 'ring-1 ring-red-500' : ''}`}
                    disabled={isLoading}
                    aria-invalid={!!error}
                    aria-describedby={error ? 'url-error' : undefined}
                />
                <button
                    onClick={handleSubmit}
                    disabled={!canSubmit}
                    className={`${styles.button} ${buttonColorClass}`}
                >
                    {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        MESSAGES.filePanel.loadButton
                    )}
                </button>
            </div>

            {/* 에러 메시지 */}
            {error && (
                <div
                    id="url-error"
                    className="mt-2 flex items-center gap-1.5 text-xs text-red-400"
                    role="alert"
                >
                    <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
                    <span>{error}</span>
                </div>
            )}
        </div>
    );
}

export const UrlInput = memo(UrlInputComponent);
