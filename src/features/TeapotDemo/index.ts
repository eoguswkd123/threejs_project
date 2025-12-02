/**
 * TeapotDemo Feature Module
 * Three.js Teapot 와이어프레임 예제
 */

// Components
export { TeapotScene, TeapotMesh, TeapotControls } from './components';

// Hooks
export { useTeapotMaterial } from './hooks';

// Types
export type { ShadingMode, TeapotConfig } from './types';

// Constants
export {
    DEFAULT_TEAPOT_CONFIG,
    SHADING_MODE_OPTIONS,
    TESSELLATION_RANGE,
} from './constants';
