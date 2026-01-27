/**
 * CAD Shading Types
 *
 * Phase 2.1.7: 3D 메쉬 쉐이딩 모드 타입 정의
 *
 * @module types/cad/shading
 */

import { DoubleSide, type Side } from 'three';

// ============================================================
// Shading Mode Types
// ============================================================

/**
 * CAD 3D 쉐이딩 모드
 *
 * | Mode | Material | 시각적 특성 |
 * |------|----------|-------------|
 * | wireframe | MeshBasicMaterial | 뼈대만 표시, 면 없음 |
 * | flat | MeshPhongMaterial | 면 단위 음영, 각진 느낌 |
 * | smooth | MeshLambertMaterial | 부드러운 음영 (기본값) |
 * | glossy | MeshPhongMaterial | 광택 있는 하이라이트 |
 * | hologram | HologramMaterial | 홀로그램 효과 (시안 글로우) |
 */
export type CadShadingMode =
    | 'wireframe'
    | 'flat'
    | 'smooth'
    | 'glossy'
    | 'hologram';

/**
 * CAD Material 옵션
 */
export interface CadMaterialOptions {
    /** 기본 색상 (기본값: '#1e88e5') */
    color?: string;
    /** 투명도 (기본값: 1.0) */
    opacity?: number;
    /** 면 렌더링 방향 (기본값: THREE.DoubleSide) */
    side?: Side;
}

// ============================================================
// Default Values
// ============================================================

/** 기본 Material 옵션 */
export const DEFAULT_MATERIAL_OPTIONS: Required<CadMaterialOptions> = {
    color: '#1e88e5',
    opacity: 1.0,
    side: DoubleSide,
};

/** 기본 ShadingMode */
export const DEFAULT_SHADING_MODE: CadShadingMode = 'smooth';

/** ShadingMode 표시 라벨 */
export const SHADING_MODE_LABELS: Record<CadShadingMode, string> = {
    wireframe: 'Wireframe',
    flat: 'Flat',
    smooth: 'Smooth',
    glossy: 'Glossy',
    hologram: 'Hologram',
};

/** ShadingMode 설명 */
export const SHADING_MODE_DESCRIPTIONS: Record<CadShadingMode, string> = {
    wireframe: '뼈대만 표시 (면 없음)',
    flat: '면 단위 음영 (각진 느낌)',
    smooth: '부드러운 음영',
    glossy: '광택 있는 하이라이트',
    hologram: '홀로그램 효과 (시안 글로우)',
};

// ============================================================
// Utility Functions
// ============================================================

/**
 * 유효한 CadShadingMode인지 확인
 */
export function isValidShadingMode(value: string): value is CadShadingMode {
    return ['wireframe', 'flat', 'smooth', 'glossy', 'hologram'].includes(
        value
    );
}
