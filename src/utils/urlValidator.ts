/**
 * urlValidator - URL 검증 유틸리티
 *
 * 1. validateUrl: 기본 URL 형식 검증
 * 2. validateSecureUrl: SSRF 방지 화이트리스트 기반 보안 검증
 *
 * 확장자 검증은 fileValidator.validateExtension() 사용
 */

import { MESSAGES } from '@/locales';

/**
 * URL 검증 결과
 */
export interface UrlValidationResult {
    valid: boolean;
    error?: {
        code: string;
        message: string;
    };
}

/**
 * URL 보안 검증 설정
 */
export interface UrlSecurityConfig {
    /** 허용된 프로토콜 (예: ['https:']) */
    allowedProtocols: readonly string[];
    /** 허용된 호스트 목록 (서브도메인 포함) */
    allowedHosts: readonly string[];
}

/**
 * 기본 URL 형식 검증
 *
 * 1. 빈 URL 검사
 * 2. 프로토콜 검사 (http/https)
 * 3. URL 형식 검사
 *
 * @param url 검사할 URL
 * @returns 유효성 결과
 *
 * @example
 * ```ts
 * const result = validateUrl('https://example.com/file.dxf');
 * if (!result.valid) {
 *     console.error(result.error?.message);
 * }
 * ```
 */
export function validateUrl(url: string): UrlValidationResult {
    const trimmedUrl = url.trim();

    // 1. 빈 URL 검사
    if (!trimmedUrl) {
        return {
            valid: false,
            error: { code: 'EMPTY_URL', message: MESSAGES.errors.emptyUrl },
        };
    }

    // 2. 프로토콜 검사 (http:// 또는 https://)
    if (
        !trimmedUrl.startsWith('http://') &&
        !trimmedUrl.startsWith('https://')
    ) {
        return {
            valid: false,
            error: {
                code: 'INVALID_PROTOCOL',
                message: MESSAGES.errors.invalidProtocol,
            },
        };
    }

    // 3. URL 형식 검사
    try {
        new URL(trimmedUrl);
    } catch {
        return {
            valid: false,
            error: { code: 'INVALID_URL', message: MESSAGES.errors.invalidUrl },
        };
    }

    return { valid: true };
}

/**
 * 보안 강화 URL 검증 (SSRF 방지)
 *
 * 화이트리스트 기반 검증:
 * 1. 빈 URL 검사
 * 2. URL 형식 검사
 * 3. 프로토콜 화이트리스트 검사
 * 4. 호스트 화이트리스트 검사
 *
 * 확장자 검증이 필요한 경우 fileValidator.validateExtension() 사용
 *
 * @param url 검사할 URL
 * @param config 보안 설정
 * @returns 유효성 결과
 *
 * @example
 * ```ts
 * import { validateSecureUrl } from '@/utils';
 * import { validateExtension } from '@/utils';
 *
 * // 1. URL 보안 검증
 * const urlResult = validateSecureUrl(url, {
 *     allowedProtocols: ['https:'],
 *     allowedHosts: ['github.com', 'raw.githubusercontent.com'],
 * });
 *
 * // 2. 확장자 검증 (필요시)
 * if (urlResult.valid) {
 *     const pathname = new URL(url).pathname;
 *     const extResult = validateExtension(pathname, ['.dxf']);
 * }
 * ```
 */
export function validateSecureUrl(
    url: string,
    config: UrlSecurityConfig
): UrlValidationResult {
    const trimmedUrl = url.trim();

    // 1. 빈 URL 검사
    if (!trimmedUrl) {
        return {
            valid: false,
            error: { code: 'EMPTY_URL', message: MESSAGES.errors.emptyUrl },
        };
    }

    // 2. URL 형식 검사
    let parsedUrl: URL;
    try {
        parsedUrl = new URL(trimmedUrl);
    } catch {
        return {
            valid: false,
            error: { code: 'INVALID_URL', message: MESSAGES.errors.invalidUrl },
        };
    }

    // 3. 프로토콜 화이트리스트 검사
    if (!config.allowedProtocols.includes(parsedUrl.protocol)) {
        return {
            valid: false,
            error: {
                code: 'INVALID_PROTOCOL',
                message: MESSAGES.errors.invalidProtocol,
            },
        };
    }

    // 4. 호스트 화이트리스트 검사 (SSRF 방지)
    const isWhitelisted = config.allowedHosts.some(
        (host) =>
            parsedUrl.hostname === host ||
            parsedUrl.hostname.endsWith(`.${host}`)
    );
    if (!isWhitelisted) {
        return {
            valid: false,
            error: {
                code: 'INVALID_HOST',
                message: `허용되지 않은 호스트입니다. 허용 목록: ${config.allowedHosts.join(', ')}`,
            },
        };
    }

    return { valid: true };
}

// ============================================================================
// 내부 리소스 확인
// ============================================================================

/**
 * URL이 내부 리소스인지 확인 (외부 검증 스킵 대상)
 *
 * - blob: URL (로컬 파일 ObjectURL)
 * - / 경로 (내부 샘플 파일)
 *
 * @param url 검사할 URL
 * @returns 내부 리소스 여부
 *
 * @example
 * isInternalResource('blob:http://localhost/abc'); // true
 * isInternalResource('/samples/model.glb');        // true
 * isInternalResource('https://example.com/a.glb'); // false
 */
export function isInternalResource(url: string): boolean {
    return url.startsWith('blob:') || url.startsWith('/');
}

// ============================================================================
// URL 파일명 추출
// ============================================================================

/**
 * URL에서 파일명 추출
 *
 * @param url 파일 URL
 * @param fallback 기본값 (default: 'file')
 * @returns 파일명
 *
 * @example
 * extractFileName('/path/to/model.glb');      // 'model.glb'
 * extractFileName('https://x.com/a/b.gltf');  // 'b.gltf'
 * extractFileName('/');                        // 'file'
 */
export function extractFileName(url: string, fallback = 'file'): string {
    return url.split('/').pop() || fallback;
}
