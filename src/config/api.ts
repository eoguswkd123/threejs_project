/**
 * API 설정
 * Single Source of Truth - 모든 API 설정은 여기서 관리
 */
export const API_CONFIG = {
    BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api',
    TIMEOUT: 30000,
    HEADERS: {
        'Content-Type': 'application/json',
    },
} as const;
