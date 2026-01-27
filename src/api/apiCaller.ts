/**
 * API Caller
 * Axios 인스턴스 - 백엔드 API 호출용
 *
 * ## 보안 기능
 * - CSRF 토큰 자동 처리 (쿠키 → 헤더)
 * - 보안 헤더 자동 추가
 * - 인증 오류 처리
 * - 에러 응답 정규화
 */

import axios from 'axios';

import { API_CONFIG, CSRF_COOKIE_NAME, CSRF_HEADER_NAME } from '@/config/api';

import type { AxiosError, InternalAxiosRequestConfig } from 'axios';

/**
 * 쿠키에서 값 읽기
 * @param name - 쿠키 이름
 * @returns 쿠키 값 또는 null
 */
function getCookie(name: string): string | null {
    const matches = document.cookie.match(
        new RegExp(
            `(?:^|; )${name.replace(/([.$?*|{}()[\]\\/+^])/g, '\\$1')}=([^;]*)`
        )
    );
    return matches ? decodeURIComponent(matches[1]!) : null;
}

/**
 * API 에러 응답 타입
 */
export interface ApiErrorResponse {
    status: number;
    message: string;
    code?: string;
    timestamp?: string;
}

/**
 * Axios 인스턴스 생성
 */
export const apiCaller = axios.create({
    baseURL: API_CONFIG.BASE_URL,
    timeout: API_CONFIG.TIMEOUT,
    headers: API_CONFIG.HEADERS,
    withCredentials: API_CONFIG.WITH_CREDENTIALS,
});

/**
 * 요청 인터셉터: CSRF 토큰 추가
 *
 * 상태 변경 요청(POST, PUT, DELETE, PATCH)에 CSRF 토큰을 자동으로 추가합니다.
 * 서버에서 XSRF-TOKEN 쿠키로 토큰을 제공해야 합니다.
 */
apiCaller.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        // 상태 변경 메서드에만 CSRF 토큰 추가
        const method = config.method?.toUpperCase();
        if (method && ['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
            const csrfToken = getCookie(CSRF_COOKIE_NAME);
            if (csrfToken && config.headers) {
                config.headers[CSRF_HEADER_NAME] = csrfToken;
            }
        }
        return config;
    },
    (error: AxiosError) => {
        return Promise.reject(error);
    }
);

/**
 * 응답 인터셉터: 에러 처리 및 인증 오류 감지
 *
 * - 401 Unauthorized: 세션 만료 감지
 * - 403 Forbidden: 권한 부족 감지
 * - 에러 응답 정규화
 */
apiCaller.interceptors.response.use(
    (response) => response,
    (error: AxiosError<ApiErrorResponse>) => {
        if (error.response) {
            const { status } = error.response;

            // 인증 오류 처리
            if (status === 401) {
                // 세션 만료 이벤트 발생 (앱에서 처리)
                window.dispatchEvent(new CustomEvent('auth:session-expired'));
            }

            // 권한 부족 처리
            if (status === 403) {
                window.dispatchEvent(new CustomEvent('auth:forbidden'));
            }
        }

        // 네트워크 오류 처리
        if (error.code === 'ERR_NETWORK') {
            window.dispatchEvent(new CustomEvent('network:error'));
        }

        return Promise.reject(error);
    }
);
