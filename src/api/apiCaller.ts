/**
 * API Caller
 * Axios 인스턴스 - 백엔드 API 호출용
 */

import axios from 'axios';

import { API_CONFIG } from '@/config/api';

export const apiCaller = axios.create({
    baseURL: API_CONFIG.BASE_URL,
    timeout: API_CONFIG.TIMEOUT,
    headers: API_CONFIG.HEADERS,
});
