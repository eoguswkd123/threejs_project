/**
 * CAD Viewer - Constants
 * DXF 파일 파싱 및 3D 렌더링 상수
 */

import type { CADViewerConfig, BoundingBox } from './types';

/** 파일 제한 설정 */
export const FILE_LIMITS = {
    /** 최대 파일 크기 (20MB) */
    MAX_SIZE_BYTES: 20 * 1024 * 1024,
    /** 경고 표시 파일 크기 (5MB) */
    WARNING_SIZE_BYTES: 5 * 1024 * 1024,
    /** 허용 확장자 */
    ACCEPTED_EXTENSIONS: ['.dxf'] as const,
    /** 허용 MIME 타입 */
    ACCEPTED_MIME_TYPES: [
        'application/dxf',
        'application/x-dxf',
        'image/vnd.dxf',
        'image/x-dxf',
        '', // DXF 파일은 종종 빈 MIME 타입을 가짐
    ] as const,
} as const;

/** CAD Viewer 기본 설정 */
export const DEFAULT_CAD_CONFIG: CADViewerConfig = {
    showGrid: true,
    wireframeColor: '#00ff00',
    backgroundColor: '#1a1a2e',
    autoFitCamera: true,
};

/** 기본 바운딩 박스 */
export const DEFAULT_BOUNDS: BoundingBox = {
    min: { x: 0, y: 0, z: 0 },
    max: { x: 100, y: 100, z: 0 },
};

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

/** 에러 메시지 */
export const ERROR_MESSAGES = {
    INVALID_TYPE: 'DXF 파일만 업로드 가능합니다 (.dxf)',
    FILE_TOO_LARGE: `파일 크기가 너무 큽니다. 최대 ${FILE_LIMITS.MAX_SIZE_BYTES / 1024 / 1024}MB까지 지원합니다.`,
    PARSE_ERROR: 'DXF 파일 파싱 중 오류가 발생했습니다.',
    EMPTY_FILE: '빈 파일이거나 유효한 엔티티가 없습니다.',
} as const;

/** WebWorker 사용 임계값 (2MB 이상 파일에서 Worker 사용) */
export const WORKER_THRESHOLD_BYTES = 2 * 1024 * 1024;

/**
 * LOD (Level of Detail) 설정
 * 엔티티 수에 따른 세그먼트 수 조절
 */
export const LOD_CONFIG = {
    /** 고품질 세그먼트 수 (엔티티 < 1000) */
    HIGH_QUALITY_SEGMENTS: 64,
    /** 중간 품질 세그먼트 수 (엔티티 1000-5000) */
    MEDIUM_QUALITY_SEGMENTS: 32,
    /** 저품질 세그먼트 수 (엔티티 > 5000) */
    LOW_QUALITY_SEGMENTS: 16,
    /** 고품질 임계값 */
    HIGH_QUALITY_THRESHOLD: 1000,
    /** 중간 품질 임계값 */
    MEDIUM_QUALITY_THRESHOLD: 5000,
} as const;

/**
 * 엔티티 수에 따른 LOD 세그먼트 수 계산
 * @param entityCount 전체 엔티티 수
 * @returns 원/호에 사용할 세그먼트 수
 */
export function getLODSegments(entityCount: number): number {
    if (entityCount < LOD_CONFIG.HIGH_QUALITY_THRESHOLD) {
        return LOD_CONFIG.HIGH_QUALITY_SEGMENTS;
    }
    if (entityCount < LOD_CONFIG.MEDIUM_QUALITY_THRESHOLD) {
        return LOD_CONFIG.MEDIUM_QUALITY_SEGMENTS;
    }
    return LOD_CONFIG.LOW_QUALITY_SEGMENTS;
}

/**
 * AutoCAD Color Index (ACI) → Hex 색상 매핑
 * DXF 표준 색상 1-9 및 특수 색상
 */
export const DXF_COLOR_MAP: Record<number, string> = {
    0: '#ffffff', // ByBlock - 기본 흰색
    1: '#ff0000', // Red
    2: '#ffff00', // Yellow
    3: '#00ff00', // Green
    4: '#00ffff', // Cyan
    5: '#0000ff', // Blue
    6: '#ff00ff', // Magenta
    7: '#ffffff', // White (기본)
    8: '#808080', // Dark Gray
    9: '#c0c0c0', // Light Gray
    256: '#ffffff', // ByLayer - 기본 흰색
} as const;

/** 기본 레이어 색상 */
export const DEFAULT_LAYER_COLOR = '#00ff00';

/**
 * ACI 색상 값을 Hex 색상으로 변환
 * @param aciColor AutoCAD Color Index (0-256)
 * @returns Hex 색상 문자열
 */
export function aciToHex(aciColor: number | undefined): string {
    if (aciColor === undefined) {
        return DEFAULT_LAYER_COLOR;
    }
    return DXF_COLOR_MAP[aciColor] ?? DEFAULT_LAYER_COLOR;
}
