/**
 * API 설정
 * Single Source of Truth - 모든 API 설정은 여기서 관리
 *
 * ## 보안 헤더 설명
 * - X-Requested-With: CSRF 방지 (서버에서 XMLHttpRequest 여부 확인)
 * - X-Content-Type-Options: MIME 스니핑 방지
 *
 * ## CSRF 토큰 처리
 * - 서버에서 쿠키로 전달된 CSRF 토큰을 읽어서 헤더에 포함
 * - 쿠키 이름: XSRF-TOKEN (Spring Security 기본값)
 * - 헤더 이름: X-XSRF-TOKEN
 */

/** CSRF 토큰 쿠키 이름 */
export const CSRF_COOKIE_NAME = 'XSRF-TOKEN';

/** CSRF 토큰 헤더 이름 */
export const CSRF_HEADER_NAME = 'X-XSRF-TOKEN';

export const API_CONFIG = {
    BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api',
    TIMEOUT: 30000,
    HEADERS: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        'X-Content-Type-Options': 'nosniff',
    },
    /** 쿠키 전송 설정 (CORS 환경에서 필요) */
    WITH_CREDENTIALS: true,
} as const;
