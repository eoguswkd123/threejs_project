/**
 * 뷰어 상태 관리 Store (Zustand)
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { CADLayer, BoundingBox } from '@types/cad';
import type {
    ViewerConfig,
    RenderMode,
    CameraState,
    SelectionState,
    VisibilityState,
} from '@types/viewer';
import { DEFAULT_VIEWER_CONFIG, CAMERA_PRESETS, type CameraPreset } from '@types/viewer';

// ===== 상태 타입 =====
export interface ViewerState {
    // 설정
    config: ViewerConfig;

    // 카메라
    camera: CameraState;

    // 선택
    selection: SelectionState;

    // 레이어 가시성
    visibility: VisibilityState;

    // 뷰포트
    viewportSize: { width: number; height: number };

    // 상태
    isReady: boolean;
}

export interface ViewerActions {
    // 설정
    setConfig: (config: Partial<ViewerConfig>) => void;
    setRenderMode: (mode: RenderMode) => void;
    toggleGrid: () => void;
    toggleAxes: () => void;

    // 카메라
    setCamera: (camera: Partial<CameraState>) => void;
    setCameraPreset: (preset: CameraPreset) => void;
    resetCamera: () => void;
    zoomToFit: (bounds: BoundingBox) => void;

    // 선택
    selectEntity: (entityId: string) => void;
    selectEntities: (entityIds: string[]) => void;
    toggleSelection: (entityId: string) => void;
    deselectAll: () => void;
    highlightEntity: (entityId: string | undefined) => void;

    // 레이어 가시성
    setLayerVisibility: (layerName: string, visible: boolean) => void;
    toggleLayer: (layerName: string) => void;
    showAllLayers: () => void;
    hideAllLayers: () => void;
    setVisibleLayers: (layerNames: string[]) => void;
    initializeLayers: (layers: CADLayer[]) => void;

    // 엔티티 가시성
    hideEntity: (entityId: string) => void;
    showEntity: (entityId: string) => void;
    showAllEntities: () => void;

    // 뷰포트
    setViewportSize: (width: number, height: number) => void;

    // 상태
    setReady: (ready: boolean) => void;
    reset: () => void;
}

// 초기 카메라 상태
const initialCamera: CameraState = {
    position: [0, 0, 100],
    target: [0, 0, 0],
    up: [0, 1, 0],
    zoom: 1,
    fov: 75,
};

// 초기 상태
const initialState: ViewerState = {
    config: DEFAULT_VIEWER_CONFIG,
    camera: initialCamera,
    selection: {
        selectedIds: [],
        highlightedId: undefined,
    },
    visibility: {
        visibleLayers: [],
        hiddenEntityIds: [],
    },
    viewportSize: { width: 800, height: 600 },
    isReady: false,
};

// Store 생성
export const useViewerStore = create<ViewerState & ViewerActions>()(
    devtools(
        (set, get) => ({
            // 초기 상태
            ...initialState,

            // ===== 설정 =====
            setConfig: (config) => {
                set((state) => ({
                    config: { ...state.config, ...config },
                }));
            },

            setRenderMode: (mode) => {
                set((state) => ({
                    config: { ...state.config, renderMode: mode },
                }));
            },

            toggleGrid: () => {
                set((state) => ({
                    config: { ...state.config, gridEnabled: !state.config.gridEnabled },
                }));
            },

            toggleAxes: () => {
                set((state) => ({
                    config: { ...state.config, axesEnabled: !state.config.axesEnabled },
                }));
            },

            // ===== 카메라 =====
            setCamera: (camera) => {
                set((state) => ({
                    camera: { ...state.camera, ...camera },
                }));
            },

            setCameraPreset: (preset) => {
                const presetCamera = CAMERA_PRESETS[preset];
                set((state) => ({
                    camera: {
                        ...state.camera,
                        ...presetCamera,
                    },
                }));
            },

            resetCamera: () => {
                set({ camera: initialCamera });
            },

            zoomToFit: (bounds) => {
                // 바운딩 박스 중심 계산
                const centerX = (bounds.min[0] + bounds.max[0]) / 2;
                const centerY = (bounds.min[1] + bounds.max[1]) / 2;
                const centerZ = (bounds.min[2] + bounds.max[2]) / 2;

                // 바운딩 박스 크기 계산
                const sizeX = bounds.max[0] - bounds.min[0];
                const sizeY = bounds.max[1] - bounds.min[1];
                const sizeZ = bounds.max[2] - bounds.min[2];
                const maxSize = Math.max(sizeX, sizeY, sizeZ);

                // 카메라 거리 계산 (FOV 기반)
                const fov = get().camera.fov ?? 75;
                const distance = maxSize / (2 * Math.tan((fov * Math.PI) / 360));

                set({
                    camera: {
                        ...get().camera,
                        position: [centerX, centerY, centerZ + distance * 1.5],
                        target: [centerX, centerY, centerZ],
                    },
                });
            },

            // ===== 선택 =====
            selectEntity: (entityId) => {
                set({
                    selection: {
                        ...get().selection,
                        selectedIds: [entityId],
                    },
                });
            },

            selectEntities: (entityIds) => {
                set({
                    selection: {
                        ...get().selection,
                        selectedIds: entityIds,
                    },
                });
            },

            toggleSelection: (entityId) => {
                set((state) => {
                    const { selectedIds } = state.selection;
                    const isSelected = selectedIds.includes(entityId);
                    return {
                        selection: {
                            ...state.selection,
                            selectedIds: isSelected
                                ? selectedIds.filter((id) => id !== entityId)
                                : [...selectedIds, entityId],
                        },
                    };
                });
            },

            deselectAll: () => {
                set({
                    selection: {
                        ...get().selection,
                        selectedIds: [],
                    },
                });
            },

            highlightEntity: (entityId) => {
                set({
                    selection: {
                        ...get().selection,
                        highlightedId: entityId,
                    },
                });
            },

            // ===== 레이어 가시성 =====
            setLayerVisibility: (layerName, visible) => {
                set((state) => {
                    const { visibleLayers } = state.visibility;
                    const newVisibleLayers = visible
                        ? [...new Set([...visibleLayers, layerName])]
                        : visibleLayers.filter((l) => l !== layerName);
                    return {
                        visibility: {
                            ...state.visibility,
                            visibleLayers: newVisibleLayers,
                        },
                    };
                });
            },

            toggleLayer: (layerName) => {
                const { visibleLayers } = get().visibility;
                const isVisible = visibleLayers.includes(layerName);
                get().setLayerVisibility(layerName, !isVisible);
            },

            showAllLayers: () => {
                // 현재 가시성 상태의 모든 레이어를 표시
                // 실제로는 cadData의 레이어 목록을 참조해야 함
            },

            hideAllLayers: () => {
                set({
                    visibility: {
                        ...get().visibility,
                        visibleLayers: [],
                    },
                });
            },

            setVisibleLayers: (layerNames) => {
                set({
                    visibility: {
                        ...get().visibility,
                        visibleLayers: layerNames,
                    },
                });
            },

            initializeLayers: (layers) => {
                const visibleLayers = layers
                    .filter((l) => l.visible)
                    .map((l) => l.name);
                set({
                    visibility: {
                        ...get().visibility,
                        visibleLayers,
                    },
                });
            },

            // ===== 엔티티 가시성 =====
            hideEntity: (entityId) => {
                set((state) => ({
                    visibility: {
                        ...state.visibility,
                        hiddenEntityIds: [...new Set([...state.visibility.hiddenEntityIds, entityId])],
                    },
                }));
            },

            showEntity: (entityId) => {
                set((state) => ({
                    visibility: {
                        ...state.visibility,
                        hiddenEntityIds: state.visibility.hiddenEntityIds.filter(
                            (id) => id !== entityId
                        ),
                    },
                }));
            },

            showAllEntities: () => {
                set({
                    visibility: {
                        ...get().visibility,
                        hiddenEntityIds: [],
                    },
                });
            },

            // ===== 뷰포트 =====
            setViewportSize: (width, height) => {
                set({ viewportSize: { width, height } });
            },

            // ===== 상태 =====
            setReady: (ready) => {
                set({ isReady: ready });
            },

            reset: () => {
                set(initialState);
            },
        }),
        { name: 'ViewerStore' }
    )
);

// 선택자
export const selectIsEntitySelected = (entityId: string) => (state: ViewerState) =>
    state.selection.selectedIds.includes(entityId);

export const selectIsLayerVisible = (layerName: string) => (state: ViewerState) =>
    state.visibility.visibleLayers.includes(layerName);

export const selectIsEntityHidden = (entityId: string) => (state: ViewerState) =>
    state.visibility.hiddenEntityIds.includes(entityId);
