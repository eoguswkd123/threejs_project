/**
 * HologramViewer - Feature Barrel Export
 *
 * Iron Man 스타일 AR 홀로그램 3D 뷰어
 *
 * @note HologramMesh, HologramMaterial은 @/components/ModelMesh로 이동됨
 */

// Components
export { HologramScene } from './components';

// Hooks
export { useHologramLoader } from './hooks';

// Constants
export {
    DEFAULT_HOLOGRAM_CONFIG,
    DEFAULT_HOLOGRAM_SETTINGS,
    HOLOGRAM_CAMERA_CONFIG,
    HOLOGRAM_COLOR_PRESETS,
} from './constants';

// Types
export type {
    HologramSettings,
    HologramViewerConfig,
    HologramModelInfo,
    HologramLoadingStatus,
    HologramLoadError,
    HologramCameraConfig,
} from './types';
