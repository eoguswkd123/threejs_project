/**
 * CAD Viewer - File Validators
 * 파일 유효성 검사 유틸리티
 */

import { FILE_LIMITS, ERROR_MESSAGES } from '../constants';
import type { ValidationResult } from '../types';

/**
 * 파일 확장자 검사
 */
export function validateFileExtension(file: File): ValidationResult {
    const fileName = file.name.toLowerCase();
    const isValidExtension = FILE_LIMITS.ACCEPTED_EXTENSIONS.some((ext) =>
        fileName.endsWith(ext)
    );

    if (!isValidExtension) {
        return {
            valid: false,
            error: {
                code: 'INVALID_TYPE',
                message: ERROR_MESSAGES.INVALID_TYPE,
            },
        };
    }

    return { valid: true };
}

/**
 * 파일 크기 검사
 */
export function validateFileSize(file: File): ValidationResult {
    if (file.size > FILE_LIMITS.MAX_SIZE_BYTES) {
        return {
            valid: false,
            error: {
                code: 'FILE_TOO_LARGE',
                message: ERROR_MESSAGES.FILE_TOO_LARGE,
            },
        };
    }

    return { valid: true };
}

/**
 * 파일 내용 기본 검사 (빈 파일 체크)
 */
export function validateFileContent(file: File): ValidationResult {
    if (file.size === 0) {
        return {
            valid: false,
            error: {
                code: 'EMPTY_FILE',
                message: ERROR_MESSAGES.EMPTY_FILE,
            },
        };
    }

    return { valid: true };
}

/**
 * 전체 파일 유효성 검사
 */
export function validateFile(file: File): ValidationResult {
    // 1. 확장자 검사
    const extensionResult = validateFileExtension(file);
    if (!extensionResult.valid) {
        return extensionResult;
    }

    // 2. 파일 크기 검사
    const sizeResult = validateFileSize(file);
    if (!sizeResult.valid) {
        return sizeResult;
    }

    // 3. 파일 내용 기본 검사
    const contentResult = validateFileContent(file);
    if (!contentResult.valid) {
        return contentResult;
    }

    return { valid: true };
}

/**
 * 파일 크기 경고 여부 확인
 */
export function shouldShowSizeWarning(file: File): boolean {
    return file.size > FILE_LIMITS.WARNING_SIZE_BYTES;
}

/**
 * 파일 크기를 읽기 쉬운 형식으로 변환
 */
export function formatFileSize(bytes: number): string {
    if (bytes < 1024) {
        return `${bytes} B`;
    }
    if (bytes < 1024 * 1024) {
        return `${(bytes / 1024).toFixed(1)} KB`;
    }
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}
