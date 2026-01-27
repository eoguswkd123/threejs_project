/**
 * CAD Viewer Hooks - Barrel Export
 *
 * DXF 파일 로딩, 파싱, 렌더링 관련 훅
 */

// Main Orchestrator Hook
export { useDxfLoader } from './useDxfLoader';
export type { UseDxfLoaderReturn, UseDxfLoaderOptions } from './useDxfLoader';

// SRP Separated Hooks (개별 사용 가능)
export { useLayerManager } from './useLayerManager';
export type {
    UseLayerManagerReturn,
    UseLayerManagerOptions,
} from './useLayerManager';

export { useCameraControl } from './useCameraControl';
export type {
    UseCameraControlReturn,
    UseCameraControlOptions,
} from './useCameraControl';

export { useDxfFileLoader } from './useDxfFileLoader';
export type {
    UseDxfFileLoaderReturn,
    UseDxfFileLoaderOptions,
} from './useDxfFileLoader';

// Worker & Parser Hooks
export { useDxfWorker } from './useDxfWorker';

export { useDxfParser } from './useDxfParser';

// Worker Pool Hook (Phase 2.2.0)
export { useWorkerPool } from './useWorkerPool';
export type { UseWorkerPoolReturn } from './useWorkerPool';

// Material Hook (Phase 2.1.7)
export { useCadMaterial } from './useCadMaterial';
export type {
    UseCadMaterialResult,
    UseCadMaterialProps,
} from './useCadMaterial';
