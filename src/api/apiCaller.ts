/**
 * API Caller
 * Axios 인스턴스 - 백엔드 API 호출용
 */

import axios from 'axios'

export const apiCaller = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})
