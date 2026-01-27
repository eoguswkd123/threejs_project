/**
 * fileValidator - 파일 유효성 검사 유틸리티
 *
 * 파일 업로드 관련 검증 로직
 * - 확장자 검사
 * - 파일 크기 검사
 * - 빈 파일 검사
 * - DXF 매직 바이트 검증
 * - 파일 크기 포맷팅
 */

import { MESSAGES } from '@/locales';

// ============================================================================
// 파일 크기 포맷팅
// ============================================================================

/**
 * 파일 크기를 읽기 쉬운 형식으로 변환
 *
 * @param bytes 파일 크기 (bytes)
 * @returns 포맷된 문자열 (예: "1.5 MB")
 *
 * @example
 * formatFileSize(0)         // "0 B"
 * formatFileSize(1024)      // "1.0 KB"
 * formatFileSize(1536)      // "1.5 KB"
 * formatFileSize(1048576)   // "1.00 MB"
 * formatFileSize(2621440)   // "2.50 MB"
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

// ============================================================================
// DXF 매직 바이트 검증
// ============================================================================

/**
 * DXF 파일 매직 바이트 패턴
 * DXF 파일은 ASCII 형식으로 "0\nSECTION" 또는 공백/주석으로 시작
 */
const DXF_MAGIC_PATTERNS = [
    /^\s*0\s*\n/, // 표준 DXF 시작: "0\nSECTION"
    /^\s*999\s*\n/, // 주석으로 시작하는 경우
] as const;

/**
 * DXF 파일 내용 매직 바이트 검증
 * 파일 시작 부분을 읽어 DXF 형식인지 확인
 *
 * @param file 검사할 파일
 * @returns 유효성 검사 결과 (Promise)
 *
 * @example
 * ```ts
 * const result = await validateDXFMagicBytes(file);
 * if (!result.valid) {
 *     console.error(result.error?.message);
 * }
 * ```
 */
export async function validateDXFMagicBytes(
    file: File
): Promise<FileValidationResult> {
    try {
        // 파일의 처음 100바이트만 읽어서 검사 (효율성)
        const slice = file.slice(0, 100);
        const text = await slice.text();

        // DXF 매직 패턴 검사
        const isValidDXF = DXF_MAGIC_PATTERNS.some((pattern) =>
            pattern.test(text)
        );

        if (!isValidDXF) {
            return {
                valid: false,
                error: {
                    code: 'INVALID_DXF_FORMAT',
                    message:
                        '유효한 DXF 파일 형식이 아닙니다. 파일 내용을 확인해주세요.',
                },
            };
        }

        return { valid: true };
    } catch {
        return {
            valid: false,
            error: {
                code: 'FILE_READ_ERROR',
                message: '파일을 읽는 중 오류가 발생했습니다.',
            },
        };
    }
}

// ============================================================================
// 인터페이스 정의
// ============================================================================

/**
 * 유효성 검사 결과
 */
export interface FileValidationResult {
    valid: boolean;
    error?: {
        code: string;
        message: string;
    };
}

/**
 * 파일 업로드 설정
 */
export interface FileUploadConfig {
    /** 허용 파일 타입 */
    accept: {
        /** 허용 확장자 (예: ['.dxf'], ['.gltf', '.glb']) */
        extensions: readonly string[];
        /** 허용 MIME 타입 (선택) */
        mimeTypes?: readonly string[];
    };
    /** 파일 크기 제한 */
    limits: {
        /** 최대 파일 크기 (bytes) */
        maxSize: number;
        /** 경고 표시 임계값 (bytes, 선택) */
        warnSize?: number;
    };
    /** 커스텀 유효성 검사 함수 (선택) */
    validate?: (file: File) => FileValidationResult;
}

/**
 * 파일 확장자 검사
 */
function validateFileExtension(
    file: File,
    extensions: readonly string[]
): FileValidationResult {
    const fileName = file.name.toLowerCase();
    const isValidExtension = extensions.some((ext) =>
        fileName.endsWith(ext.toLowerCase())
    );

    if (!isValidExtension) {
        const extList = extensions.join(', ');
        return {
            valid: false,
            error: {
                code: 'INVALID_TYPE',
                message: MESSAGES.errors.invalidType(extList),
            },
        };
    }

    return { valid: true };
}

/**
 * 파일 크기 검사
 */
function validateFileSize(file: File, maxSize: number): FileValidationResult {
    if (file.size > maxSize) {
        return {
            valid: false,
            error: {
                code: 'FILE_TOO_LARGE',
                message: MESSAGES.errors.fileTooLarge(formatFileSize(maxSize)),
            },
        };
    }

    return { valid: true };
}

/**
 * 빈 파일 검사
 */
function validateFileNotEmpty(file: File): FileValidationResult {
    if (file.size === 0) {
        return {
            valid: false,
            error: {
                code: 'EMPTY_FILE',
                message: MESSAGES.errors.emptyFile,
            },
        };
    }

    return { valid: true };
}

/**
 * 파일 유효성 검사 (config 기반)
 * @param file 검사할 파일
 * @param config 파일 업로드 설정
 * @returns 유효성 결과
 */
export function validateFile(
    file: File,
    config: FileUploadConfig
): FileValidationResult {
    // 1. 빈 파일 검사
    const emptyResult = validateFileNotEmpty(file);
    if (!emptyResult.valid) {
        return emptyResult;
    }

    // 2. 확장자 검사
    const extensionResult = validateFileExtension(
        file,
        config.accept.extensions
    );
    if (!extensionResult.valid) {
        return extensionResult;
    }

    // 3. 파일 크기 검사
    const sizeResult = validateFileSize(file, config.limits.maxSize);
    if (!sizeResult.valid) {
        return sizeResult;
    }

    // 4. 커스텀 검증 (있는 경우)
    if (config.validate) {
        const customResult = config.validate(file);
        if (!customResult.valid) {
            return customResult;
        }
    }

    return { valid: true };
}

/**
 * 파일 크기 경고 여부 확인
 */
export function shouldShowSizeWarning(
    file: File,
    warnSize: number | undefined
): boolean {
    if (warnSize === undefined) {
        return false;
    }
    return file.size > warnSize;
}

/**
 * 확장자 검증 (파일명 또는 URL pathname)
 * @param filename 파일명 또는 URL pathname
 * @param allowedExtensions 허용 확장자 목록
 * @returns 유효성 결과
 *
 * @example
 * ```ts
 * // 파일 업로드 시
 * validateExtension(file.name, ['.dxf']);
 *
 * // URL 다운로드 시
 * const pathname = new URL(url).pathname;
 * validateExtension(pathname, ['.glb', '.gltf']);
 * ```
 */
export function validateExtension(
    filename: string,
    allowedExtensions: readonly string[]
): FileValidationResult {
    const lowerFilename = filename.toLowerCase();
    const isValidExtension = allowedExtensions.some((ext) =>
        lowerFilename.endsWith(ext.toLowerCase())
    );

    if (!isValidExtension) {
        const extList = allowedExtensions.join(', ');
        return {
            valid: false,
            error: {
                code: 'INVALID_EXTENSION',
                message: MESSAGES.errors.invalidExtension(extList),
            },
        };
    }

    return { valid: true };
}

// ============================================================================
// GLTF/GLB 파일 형식 감지
// ============================================================================

/** GLTF 허용 확장자 */
export const GLTF_ALLOWED_EXTENSIONS = ['.glb', '.gltf'] as const;

/**
 * GLTF/GLB 파일 형식 추출
 *
 * @param filenameOrUrl 파일명 또는 URL
 * @returns 'gltf' | 'glb'
 *
 * @example
 * detectGltfFormat('model.gltf');              // 'gltf'
 * detectGltfFormat('/path/to/model.glb');      // 'glb'
 * detectGltfFormat('https://x.com/a.GLTF');    // 'gltf' (대소문자 무관)
 */
export function detectGltfFormat(filenameOrUrl: string): 'gltf' | 'glb' {
    return filenameOrUrl.toLowerCase().endsWith('.gltf') ? 'gltf' : 'glb';
}
