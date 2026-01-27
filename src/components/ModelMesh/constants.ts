/**
 * ModelMesh - Constants
 *
 * 3D 모델 렌더링 관련 기본 설정값
 *
 * @module components/ModelMesh/constants
 */

import type { HologramSettings } from './types';

// ============================================================
// Default Configs
// ============================================================

/** 기본 홀로그램 설정 */
export const DEFAULT_HOLOGRAM_CONFIG: HologramSettings = {
    fresnelAmount: 0.45,
    fresnelOpacity: 1.0,
    hologramBrightness: 0.5,
    scanlineSize: 8.0,
    signalSpeed: 0.45,
    hologramColor: '#00d5ff',
    hologramOpacity: 1.0,
    enableBlinking: true,
    blinkFresnelOnly: true,
    enableAdditive: true,
};
