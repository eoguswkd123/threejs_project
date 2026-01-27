/**
 * SceneCanvas - 타입 정의
 *
 * @description
 * 원자 컴포넌트별 타입 정의
 * - SceneBaseProps: Canvas + Camera + Controls
 * - SceneLightingProps: 조명 설정
 * - SceneGridProps: 그리드 설정
 * - SceneEffectsProps: Postprocessing 효과
 * - PointLightConfig: PointLight 설정
 */

import type { RefObject, ReactNode } from 'react';

import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';

// ============================================================
// 공통 타입
// ============================================================

/** PointLight 설정 */
export interface PointLightConfig {
    /** 위치 [x, y, z] */
    position: [number, number, number];
    /** 강도 (0.0 - 2.0) */
    intensity: number;
    /** 색상 (hex string, 기본: #ffffff) */
    color?: string;
}

// ============================================================
// 원자 컴포넌트 타입
// ============================================================

/**
 * SceneBase Props
 *
 * Canvas + Camera + OrbitControls 설정
 */
export interface SceneBaseProps {
    /** 3D 콘텐츠 (Lighting, Grid, Mesh 등) */
    children: ReactNode;

    // 카메라
    /** 카메라 위치 [x, y, z] */
    cameraPosition: [number, number, number];
    /** Field of View (기본: 50) */
    cameraFov?: number;
    /** Near clipping plane (기본: 0.1) */
    cameraNear?: number;
    /** Far clipping plane (기본: 10000) */
    cameraFar?: number;

    // OrbitControls
    /** OrbitControls ref (선택적) */
    controlsRef?: RefObject<OrbitControlsImpl | null>;
    /** Damping 활성화 (기본: true) */
    enableDamping?: boolean;
    /** Damping factor (기본: 0.05) */
    dampingFactor?: number;
    /** 최소 줌 거리 (기본: 1) */
    minDistance?: number;
    /** 최대 줌 거리 (기본: 1000) */
    maxDistance?: number;
    /** 자동 회전 (기본: false) */
    autoRotate?: boolean;
    /** 회전 속도 (기본: 1) */
    rotateSpeed?: number;

    // Canvas
    /** 배경색 (CSS color string) */
    backgroundColor?: string;
    /** Alpha 채널 활성화 (투명 배경, 기본: false) */
    glAlpha?: boolean;
}

/**
 * SceneLighting Props
 *
 * Ambient + PointLights 설정
 */
export interface SceneLightingProps {
    /** Ambient light 강도 (기본: 0.8) */
    ambientIntensity?: number;
    /** Ambient light 색상 */
    ambientColor?: string;
    /** PointLight 배열 (추가 조명) */
    pointLights?: PointLightConfig[];
}

/**
 * SceneGrid Props
 *
 * GridHelper 설정
 */
export interface SceneGridProps {
    /** 그리드 크기 (기본: 100) */
    size?: number;
    /** 그리드 분할 수 (기본: 50) */
    divisions?: number;
    /** 중심선 색상 (기본: 0x444444) */
    colorCenterLine?: number;
    /** 그리드 색상 (기본: 0x222222) */
    colorGrid?: number;
    /** 그리드 회전 [x, y, z] (라디안) */
    rotation?: [number, number, number];
}

/**
 * SceneEffects Props (Postprocessing)
 */
export interface SceneEffectsProps {
    /** Bloom 효과 활성화 (기본: false) */
    enableBloom?: boolean;
    /** Bloom 강도 (기본: 0.5) */
    bloomIntensity?: number;
    /** Bloom 임계값 (기본: 0.6) */
    bloomThreshold?: number;
    /** Scanline 효과 활성화 (기본: false) */
    enableScanline?: boolean;
    /** Scanline 밀도 (기본: 1.25) */
    scanlineDensity?: number;
}
