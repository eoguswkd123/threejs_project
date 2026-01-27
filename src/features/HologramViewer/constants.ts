/**
 * HologramViewer - Constants
 *
 * Iron Man 스타일 AR 홀로그램 뷰어 상수 정의
 */

import type {
    FileUploadConfig,
    FileUploadMessages,
} from '@/components/FilePanel';
import { createUrlSecurityConfig } from '@/config/urlSecurity';
import { DEFAULT_HOLOGRAM_SETTINGS } from '@/types/cad';

import type { HologramCameraConfig, HologramViewerConfig } from './types';

// 공통 상수 re-export (하위 호환성 유지)
export { DEFAULT_HOLOGRAM_SETTINGS, HOLOGRAM_COLOR_PRESETS } from '@/types/cad';

/** 기본 뷰어 설정 */
export const DEFAULT_HOLOGRAM_CONFIG: HologramViewerConfig = {
    showGrid: false, // 홀로그램에는 그리드 OFF가 더 어울림
    autoRotate: true,
    rotateSpeed: 0.5,
    backgroundColor: '#000000', // 검은 배경
    shadingMode: 'hologram', // 기본값: 홀로그램 효과
    // Postprocessing
    enableBloom: true,
    bloomIntensity: 0.5,
    bloomThreshold: 0.6,
    enableScanline: true,
    scanlineDensity: 1.25,
    // Hologram Material
    hologramSettings: DEFAULT_HOLOGRAM_SETTINGS,
};

/** 카메라 설정 */
export const HOLOGRAM_CAMERA_CONFIG: HologramCameraConfig = {
    fov: 45,
    defaultPosition: [0, 2, 5] as const,
    near: 0.1,
    far: 1000,
};

/** OrbitControls 설정 */
export const HOLOGRAM_ORBIT_CONTROLS_CONFIG = {
    enableDamping: true,
    dampingFactor: 0.05,
    minDistance: 0.5,
    maxDistance: 100,
} as const;

/** GLTF 파일 업로드 설정 */
export const HOLOGRAM_UPLOAD_CONFIG: FileUploadConfig = {
    accept: {
        extensions: ['.glb', '.gltf'],
        mimeTypes: [
            'model/gltf-binary',
            'model/gltf+json',
            'application/octet-stream',
        ],
    },
    limits: {
        maxSize: 50 * 1024 * 1024, // 50MB
        warnSize: 10 * 1024 * 1024, // 10MB
    },
};

/** 업로드 메시지 */
export const HOLOGRAM_UPLOAD_MESSAGES: FileUploadMessages = {
    dragPrompt: 'GLB/GLTF 파일을 드래그하거나 클릭',
    maxSizeText: '최대 50MB',
    loadingText: '홀로그램 로딩 중...',
};

/** URL 보안 설정 */
export const HOLOGRAM_URL_SECURITY_CONFIG = createUrlSecurityConfig({
    additionalHosts: ['khronos.org', 'model-viewer.glitch.me'],
    maxResponseSize: 50 * 1024 * 1024,
});
