export const APP_CONFIG = {
  NAME: 'Three.js 3D',
  VERSION: '1.0.0',
  DESCRIPTION: '이미지 테스트',
  COPYRIGHT: '© 2024 All rights reserved',
} as const

export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api',
  TIMEOUT: 10000,
} as const
