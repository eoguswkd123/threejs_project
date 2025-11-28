/**
 * 뷰어 관련 타입 정의
 */

import type { CADData, CADEntity, CADLayer, BoundingBox } from './cad';
import type { CameraState, SelectionState, VisibilityState } from './sync';

// ===== 렌더링 모드 =====
export type RenderMode = 'wireframe' | 'solid' | 'points' | 'mixed';
export type ProjectionMode = 'perspective' | 'orthographic';

// ===== 뷰어 설정 =====
export interface ViewerConfig {
    renderMode: RenderMode;
    projectionMode: ProjectionMode;
    backgroundColor: number;
    gridEnabled: boolean;
    axesEnabled: boolean;
    antialias: boolean;
    shadows: boolean;
}

export const DEFAULT_VIEWER_CONFIG: ViewerConfig = {
    renderMode: 'wireframe',
    projectionMode: 'perspective',
    backgroundColor: 0xf0f0f0,
    gridEnabled: true,
    axesEnabled: true,
    antialias: true,
    shadows: false,
};

// ===== 뷰어 상태 =====
export interface ViewerState {
    // 로딩 상태
    isLoading: boolean;
    loadProgress: number;
    error: string | null;

    // CAD 데이터
    cadData: CADData | null;

    // 렌더링 상태
    config: ViewerConfig;

    // 카메라 상태
    camera: CameraState;

    // 선택 상태
    selection: SelectionState;

    // 가시성 상태
    visibility: VisibilityState;

    // 뷰포트 정보
    viewport: ViewportInfo;
}

export interface ViewportInfo {
    width: number;
    height: number;
    pixelRatio: number;
}

// ===== 뷰어 액션 =====
export interface ViewerActions {
    // 데이터 로딩
    loadCADData: (data: CADData) => void;
    clearCADData: () => void;
    setLoading: (isLoading: boolean, progress?: number) => void;
    setError: (error: string | null) => void;

    // 설정
    setConfig: (config: Partial<ViewerConfig>) => void;
    setRenderMode: (mode: RenderMode) => void;
    toggleGrid: () => void;
    toggleAxes: () => void;

    // 카메라
    setCamera: (camera: Partial<CameraState>) => void;
    resetCamera: () => void;
    zoomToFit: (bounds?: BoundingBox) => void;

    // 선택
    selectEntity: (entityId: string) => void;
    selectEntities: (entityIds: string[]) => void;
    deselectAll: () => void;
    highlightEntity: (entityId: string | undefined) => void;

    // 레이어 가시성
    setLayerVisibility: (layerName: string, visible: boolean) => void;
    showAllLayers: () => void;
    hideAllLayers: () => void;
    toggleLayer: (layerName: string) => void;
}

// ===== 선택 이벤트 =====
export interface SelectionEvent {
    type: 'select' | 'deselect' | 'hover';
    entityId: string;
    entity?: CADEntity;
    position?: [number, number, number];
}

// ===== 카메라 프리셋 =====
export type CameraPreset = 'top' | 'bottom' | 'front' | 'back' | 'left' | 'right' | 'isometric';

export const CAMERA_PRESETS: Record<CameraPreset, Omit<CameraState, 'zoom' | 'fov'>> = {
    top: {
        position: [0, 100, 0],
        target: [0, 0, 0],
        up: [0, 0, -1],
    },
    bottom: {
        position: [0, -100, 0],
        target: [0, 0, 0],
        up: [0, 0, 1],
    },
    front: {
        position: [0, 0, 100],
        target: [0, 0, 0],
        up: [0, 1, 0],
    },
    back: {
        position: [0, 0, -100],
        target: [0, 0, 0],
        up: [0, 1, 0],
    },
    left: {
        position: [-100, 0, 0],
        target: [0, 0, 0],
        up: [0, 1, 0],
    },
    right: {
        position: [100, 0, 0],
        target: [0, 0, 0],
        up: [0, 1, 0],
    },
    isometric: {
        position: [70, 70, 70],
        target: [0, 0, 0],
        up: [0, 1, 0],
    },
};

// ===== 측정 도구 =====
export type MeasurementType = 'distance' | 'angle' | 'area';

export interface Measurement {
    id: string;
    type: MeasurementType;
    points: [number, number, number][];
    value: number;
    unit: string;
}

// ===== 주석 =====
export interface Annotation {
    id: string;
    type: 'text' | 'arrow' | 'callout';
    position: [number, number, number];
    content: string;
    color?: number;
    visible: boolean;
}

// ===== 레이어 패널 =====
export interface LayerPanelItem {
    layer: CADLayer;
    entityCount: number;
    isExpanded: boolean;
}
