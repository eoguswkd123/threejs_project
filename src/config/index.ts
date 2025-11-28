/**
 * Global Configuration
 * 애플리케이션 전역 설정
 */

// 앱 기본 정보
export const APP_CONFIG = {
  name: 'CAD Viewer',
  version: '1.0.0',
  description: 'CAD 파일 3D 뷰어 및 키오스크 동기화',
} as const

// 환경 설정
export const ENV_CONFIG = {
  isDev: import.meta.env.DEV,
  isProd: import.meta.env.PROD,
  mode: import.meta.env.MODE,
} as const

// 파일 업로드 설정
export const UPLOAD_CONFIG = {
  maxFileSize: 50 * 1024 * 1024, // 50MB
  supportedFormats: ['.dxf', '.dwg'] as const,
  chunkSize: 1024 * 1024, // 1MB (대용량 파일 청크 업로드용)
} as const

// 동기화 설정
export const SYNC_CONFIG = {
  reconnectAttempts: 5,
  reconnectDelay: 3000, // ms
  heartbeatInterval: 30000, // ms
} as const

// 성능 설정
export const PERFORMANCE_CONFIG = {
  // 복잡도 임계값 (이상이면 백엔드 변환)
  complexityThreshold: 10000,
  // 렌더링 FPS 제한
  maxFps: 60,
  // 디바운스 딜레이
  debounceDelay: 300,
} as const
