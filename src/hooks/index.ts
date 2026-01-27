/**
 * Hooks - 전역 훅 모듈
 *
 * @module hooks
 *
 * @description
 * 여러 Feature에서 공통으로 사용하는 React 훅 모음
 *
 * - useSceneControls: 3D 씬 공통 컨트롤
 * - useUrlInput: URL 입력 상태 관리
 * - useModelLoader: glTF/glb 모델 로딩
 * - useShadingMode: Material 모드 전환
 * - useAutoRotate: 자동 회전 애니메이션
 */

// Accessibility Constants (접근성 상수)
export { FOCUSABLE_SELECTOR, FOCUS_DELAY_MS } from './constants';

// File Extension Constants - see @/constants for SUPPORTED_*_EXTENSIONS

// 3D Scene Controls
export { useSceneControls } from './useSceneControls';
export type { BaseViewerConfig } from './useSceneControls';

// URL Input
export { useUrlInput } from './useUrlInput';
export type { UseUrlInputOptions, UseUrlInputReturn } from './useUrlInput';

// Mobile Drawer
export { useMobileDrawer } from './useMobileDrawer';

// Model Loader (glTF/glb)
export { useModelLoader } from './useModelLoader';
export type {
    UseModelLoaderOptions,
    UseModelLoaderReturn,
} from './useModelLoader';

// Shading Mode
export { useShadingMode } from './useShadingMode';
export type { UseShadingModeOptions } from './useShadingMode';

// Auto Rotate
export { useAutoRotate } from './useAutoRotate';
export type { UseAutoRotateOptions } from './useAutoRotate';
