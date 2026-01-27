/**
 * SceneCanvas - 원자 컴포넌트 모듈
 *
 * @description
 * 3D 캔버스를 구성하는 원자 컴포넌트들
 * - SceneBase: Canvas + Camera + Controls
 * - SceneLighting: Ambient + PointLights
 * - SceneGrid: GridHelper
 * - SceneEffects: Postprocessing (Bloom, Scanline)
 *
 * @see {@link @/components/SceneCanvasViewer} - 조합된 Viewer 컴포넌트
 *
 * @example
 * // 개별 원자 컴포넌트 사용
 * import { SceneBase, SceneLighting, SceneGrid } from '@/components/SceneCanvas';
 *
 * @example
 * // 조합된 Viewer 사용 (권장)
 * import { SceneCanvasViewer } from '@/components/SceneCanvasViewer';
 */

// 원자 컴포넌트
export { SceneBase } from './SceneBase';
export { SceneLighting } from './SceneLighting';
export { SceneGrid } from './SceneGrid';
export { SceneEffects } from './SceneEffects';

// 원자 컴포넌트 타입
export type {
    SceneBaseProps,
    SceneLightingProps,
    SceneGridProps,
    SceneEffectsProps,
    PointLightConfig,
} from './types';
