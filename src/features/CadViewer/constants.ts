/**
 * CAD Viewer - Constants
 * DXF 파일 파싱 및 3D 렌더링 상수
 */

import type {
    FileUploadConfig,
    FileUploadMessages,
} from '@/components/FilePanel';
import { createUrlSecurityConfig } from '@/config/urlSecurity';
import { DEFAULT_EXTRUDE_OPTIONS, DEFAULT_SHADING_MODE } from '@/types/cad';

import type { CadViewerConfig } from './types';

/** 파일 제한 설정 */
export const FILE_LIMITS = {
    /** 최대 파일 크기 (20MB) */
    MAX_SIZE_BYTES: 20 * 1024 * 1024,
    /** 경고 표시 파일 크기 (5MB) */
    WARNING_SIZE_BYTES: 5 * 1024 * 1024,
    /** 허용 확장자 */
    ACCEPTED_EXTENSIONS: ['.dxf'] as const,
    /** 허용 MIME 타입 (빈 MIME 타입 제거 - 보안 강화) */
    ACCEPTED_MIME_TYPES: [
        'application/dxf',
        'application/x-dxf',
        'image/vnd.dxf',
        'image/x-dxf',
        'application/octet-stream', // 일부 서버에서 DXF를 바이너리로 전송
    ] as const,
} as const;

/**
 * DXF 파일용 URL 보안 설정
 * 공통 설정은 @/config/urlSecurity에서 관리
 */
export const URL_SECURITY_CONFIG = createUrlSecurityConfig({
    maxResponseSize: FILE_LIMITS.MAX_SIZE_BYTES, // 20MB
});

/** CAD Viewer 기본 설정 */
export const DEFAULT_CAD_CONFIG: CadViewerConfig = {
    showGrid: true,
    autoRotate: true,
    rotateSpeed: 1,
    backgroundColor: '#1a1a2e',
    autoFitCamera: true,
    renderMode: 'outline',
    enable3DExtrude: false,
    extrudeOptions: DEFAULT_EXTRUDE_OPTIONS,
    shadingMode: DEFAULT_SHADING_MODE,
};

/** 렌더링 모드 옵션 */
export const RENDER_MODE_OPTIONS = [
    { value: 'outline', label: 'Outline' },
    { value: 'solid', label: 'Solid Fill' },
    { value: 'pattern', label: 'Pattern Fill' },
] as const;

// ============================================================
// 공유 CAD 상수 re-export (src/constants/cad/)
// 후방 호환성을 위해 유지 - 새 코드는 @/constants/cad 직접 사용 권장
// ============================================================
export {
    DEFAULT_BOUNDS,
    DEFAULT_LAYER_COLOR,
    DXF_COLOR_MAP,
    getLODSegments,
    HATCH_CONFIG,
    LOD_CONFIG,
    TEXTURE_CACHE_CONFIG,
} from '@/constants/cad';

/** 카메라 설정 */
export const CAMERA_CONFIG = {
    /** 기본 FOV */
    fov: 45,
    /** 기본 위치 (Z 방향에서 바라봄 - 평면도 뷰) */
    defaultPosition: [0, 0, 200] as const,
    /** 근거리 클리핑 */
    near: 0.1,
    /** 원거리 클리핑 */
    far: 10000,
} as const;

/** OrbitControls 설정 */
export const ORBIT_CONTROLS_CONFIG = {
    enableDamping: true,
    dampingFactor: 0.05,
    minDistance: 10,
    maxDistance: 5000,
} as const;

/** 그리드 설정 */
export const GRID_CONFIG = {
    size: 1000,
    divisions: 50,
    colorCenterLine: 0x444444,
    colorGrid: 0x222222,
} as const;

/** WebWorker 사용 임계값 (2MB 이상 파일에서 Worker 사용) */
export const WORKER_THRESHOLD_BYTES = 2 * 1024 * 1024;

/** Worker 타임아웃 (60초) - 대용량 파일 파싱 시간 고려 */
export const WORKER_TIMEOUT_MS = 60_000;

/**
 * Worker 재시도 설정
 * 지수 백오프 전략으로 재시도 간격 증가
 */
export const WORKER_RETRY_CONFIG = {
    /** 최대 재시도 횟수 */
    maxRetries: 3,
    /** 기본 대기 시간 (ms) */
    baseDelayMs: 1000,
    /** 최대 대기 시간 (ms) */
    maxDelayMs: 8000,
    /** 백오프 배수 */
    backoffMultiplier: 2,
    /** 재시도 가능한 에러 코드 */
    retryableErrors: ['WORKER_ERROR', 'TIMEOUT'] as const,
} as const;

/**
 * Worker Pool 설정
 * Worker 재사용으로 생성 오버헤드 제거
 */
export const WORKER_POOL_CONFIG = {
    /** 최소 Worker 수 (항상 유지) */
    minWorkers: 2,
    /** 최대 Worker 수 (CPU 코어 수 기반) */
    maxWorkers:
        typeof navigator !== 'undefined'
            ? navigator.hardwareConcurrency || 4
            : 4,
    /** 유휴 Worker 타임아웃 (30초) */
    idleTimeoutMs: 30_000,
    /** 작업 타임아웃 (60초) */
    taskTimeoutMs: WORKER_TIMEOUT_MS,
    /** 정리 타이머 간격 (10초) */
    cleanupIntervalMs: 10_000,
} as const;

// aciToHex는 entityMath.ts에서 정의 (순수 함수)
export { aciToHex } from './services/entityMath';

// ============================================================
// FileUpload Config (공유 컴포넌트에 주입)
// ============================================================

/**
 * DXF 파일 업로드 설정
 * FileUpload 공유 컴포넌트에 주입
 */
export const DXF_UPLOAD_CONFIG: FileUploadConfig = {
    accept: {
        extensions: FILE_LIMITS.ACCEPTED_EXTENSIONS,
        mimeTypes: FILE_LIMITS.ACCEPTED_MIME_TYPES,
    },
    limits: {
        maxSize: FILE_LIMITS.MAX_SIZE_BYTES,
        warnSize: FILE_LIMITS.WARNING_SIZE_BYTES,
    },
};

/**
 * DXF 파일 업로드 UI 메시지
 * FileUploadBox 컴포넌트에 주입
 */
export const DXF_UPLOAD_MESSAGES: FileUploadMessages = {
    dragPrompt: 'DXF 파일을 드래그하거나 클릭',
    maxSizeText: `최대 ${FILE_LIMITS.MAX_SIZE_BYTES / 1024 / 1024}MB`,
    loadingText: '파싱 중...',
};

// ============================================================
// Sample Files - utils/dxfSamples.ts로 이동
// ============================================================
// DXF_SAMPLES는 동적으로 생성되는 데이터이므로
// constants.ts가 아닌 utils/dxfSamples.ts에서 export
// import { DXF_SAMPLES } from './utils/dxfSamples';
