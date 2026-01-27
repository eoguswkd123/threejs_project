/**
 * HologramViewer - Type Definitions
 *
 * Iron Man 스타일 AR 홀로그램 뷰어 타입 정의
 */

import type { CadShadingMode, HologramSettings } from '@/types/cad';
import type { CommonErrorCode } from '@/utils';

// 공통 타입 re-export (하위 호환성 유지)
export type { HologramSettings } from '@/types/cad';

/** Hologram Viewer 전체 설정 */
export interface HologramViewerConfig {
    /** 그리드 표시 */
    showGrid: boolean;
    /** 자동 회전 */
    autoRotate: boolean;
    /** 회전 속도 */
    rotateSpeed: number;
    /** 배경색 */
    backgroundColor: string;
    /** 쉐이딩 모드 */
    shadingMode: CadShadingMode;
    // Postprocessing
    /** Bloom 효과 활성화 */
    enableBloom: boolean;
    /** Bloom 강도 */
    bloomIntensity: number;
    /** Bloom 임계값 */
    bloomThreshold: number;
    /** Scanline 효과 활성화 */
    enableScanline: boolean;
    /** Scanline 밀도 */
    scanlineDensity: number;
    // Hologram Material
    /** 홀로그램 머티리얼 설정 */
    hologramSettings: HologramSettings;
}

/** 모델 정보 */
export interface HologramModelInfo {
    /** 고유 ID */
    id: string;
    /** 파일명 */
    name: string;
    /** 파일 URL */
    url: string;
    /** 설명 */
    description?: string;
    /** 파일 크기 (bytes) */
    fileSize?: number;
    /** 파일 형식 */
    format?: 'gltf' | 'glb';
}

/** 로딩 상태 */
export type HologramLoadingStatus = 'idle' | 'loading' | 'success' | 'error';

/** 로드 에러 */
export interface HologramLoadError {
    code: CommonErrorCode;
    message: string;
}

/** HologramMesh Props */
export interface HologramMeshProps {
    /** 모델 파일 URL */
    url: string;
    /** 홀로그램 설정 */
    hologramSettings: HologramSettings;
    /** 쉐이딩 모드 */
    shadingMode?: CadShadingMode;
    /** 모델 중앙 정렬 */
    center?: boolean;
    /** 자동 스케일 정규화 */
    normalizeScale?: boolean;
    /** 정규화 목표 크기 */
    targetSize?: number;
    /** 자동 회전 */
    autoRotate?: boolean;
    /** 회전 속도 */
    rotateSpeed?: number;
}

/** 카메라 설정 */
export interface HologramCameraConfig {
    fov: number;
    defaultPosition: readonly [number, number, number];
    near: number;
    far: number;
}
