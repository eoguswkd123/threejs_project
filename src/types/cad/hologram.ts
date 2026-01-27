/**
 * Hologram Types - 홀로그램 관련 공통 타입 정의
 *
 * Iron Man 스타일 AR 홀로그램 효과 파라미터
 * HologramViewer, ModelMesh 등 여러 모듈에서 공통으로 사용
 *
 * @module types/cad/hologram
 */

// ============================================================
// Hologram Settings Interface
// ============================================================

/**
 * 홀로그램 머티리얼 설정
 *
 * WebGL 셰이더에서 사용하는 홀로그램 효과 파라미터
 */
export interface HologramSettings {
    /** 프레넬 효과 강도 (0.0 - 1.0) */
    fresnelAmount: number;
    /** 프레넬 불투명도 (0.0 - 1.0) */
    fresnelOpacity: number;
    /** 홀로그램 밝기 (0.0 - 2.0) */
    hologramBrightness: number;
    /** 스캔라인 크기 (1 - 15) */
    scanlineSize: number;
    /** 스캔라인 속도 (0.0 - 2.0) */
    signalSpeed: number;
    /** 홀로그램 색상 (hex) */
    hologramColor: string;
    /** 홀로그램 불투명도 (0.0 - 1.0) */
    hologramOpacity: number;
    /** 깜빡임 효과 활성화 */
    enableBlinking: boolean;
    /** 프레넬에만 깜빡임 적용 */
    blinkFresnelOnly: boolean;
    /** Additive 블렌딩 활성화 */
    enableAdditive: boolean;
}

// ============================================================
// Default Settings
// ============================================================

/**
 * 기본 홀로그램 설정값
 *
 * Iron Man / JARVIS 스타일 시안(cyan) 색상 기본값
 */
export const DEFAULT_HOLOGRAM_SETTINGS: Readonly<HologramSettings> = {
    fresnelAmount: 0.2,
    fresnelOpacity: 0.15,
    hologramBrightness: 0.7,
    scanlineSize: 6,
    signalSpeed: 2.3,
    hologramColor: '#00ffff',
    hologramOpacity: 1.0,
    enableBlinking: true,
    blinkFresnelOnly: true,
    enableAdditive: true,
} as const;

// ============================================================
// Color Presets
// ============================================================

/**
 * 홀로그램 색상 프리셋
 */
export const HOLOGRAM_COLOR_PRESETS = {
    /** Iron Man 기본 시안 */
    ironMan: '#00ffff',
    /** JARVIS 밝은 시안 */
    jarvis: '#00e5ff',
    /** 매트릭스 그린 */
    matrix: '#00ff41',
    /** 경고 오렌지 */
    warning: '#ff6b00',
    /** 위험 레드 */
    danger: '#ff0040',
} as const;

export type HologramColorPreset = keyof typeof HOLOGRAM_COLOR_PRESETS;
