/**
 * Teapot Demo - Constants
 * Three.js TeapotGeometry 렌더링 예제 상수
 */

import type { ShadingMode, TeapotConfig } from './types';

/** Teapot 설정 기본값 */
export const DEFAULT_TEAPOT_CONFIG: TeapotConfig = {
    tessellation: 15,
    shadingMode: 'smooth',
    showLid: true,
    showBody: true,
    showBottom: true,
    autoRotate: true,
};

/** 쉐이딩 모드 옵션 */
export const SHADING_MODE_OPTIONS: { value: ShadingMode; label: string }[] = [
    { value: 'wireframe', label: 'Wireframe' },
    { value: 'flat', label: 'Flat' },
    { value: 'smooth', label: 'Smooth' },
    { value: 'glossy', label: 'Glossy' },
    { value: 'textured', label: 'Textured' },
    { value: 'reflective', label: 'Reflective' },
];

/** 테셀레이션 범위 */
export const TESSELLATION_RANGE = {
    min: 2,
    max: 50,
    step: 1,
} as const;

/** 카메라 설정 */
export const TEAPOT_CAMERA_CONFIG = {
    position: [0, 100, 200] as const,
    fov: 45,
} as const;

/** OrbitControls 설정 */
export const TEAPOT_ORBIT_CONTROLS_CONFIG = {
    enableDamping: true,
    dampingFactor: 0.05,
    minDistance: 50,
    maxDistance: 500,
} as const;

/** 그리드 설정 */
export const TEAPOT_GRID_CONFIG = {
    size: 400,
    divisions: 40,
    colorCenterLine: 0x444444,
    colorGrid: 0x222222,
} as const;
