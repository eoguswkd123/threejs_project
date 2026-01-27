/**
 * CAD Viewer - useDxfLoader Hook (Orchestrator)
 * DXF 파일 로딩, 레이어 관리, 카메라 제어를 조율하는 Orchestrator 훅
 *
 * SRP 리팩토링: 3개 훅을 조합하여 기존 API 100% 유지
 * - useDxfFileLoader: 파일 로딩 담당
 * - useLayerManager: 레이어 관리 담당
 * - useCameraControl: 카메라 제어 담당
 */

import { useCallback } from 'react';

import type { SampleInfo, UploadError } from '@/components/FilePanel';
import type { ParsedCADData, LayerInfo } from '@/types/cad';

import { useCameraControl } from './useCameraControl';
import { useDxfFileLoader } from './useDxfFileLoader';
import { useLayerManager } from './useLayerManager';

/** Hook 반환 타입 (기존 API 유지) */
export interface UseDxfLoaderReturn {
    /** 파싱된 CAD 데이터 */
    cadData: ParsedCADData | null;
    /** 레이어 정보 (Map) */
    layers: Map<string, LayerInfo>;
    /** 카메라 위치 */
    cameraPosition: [number, number, number];
    /** 로딩 상태 */
    isLoading: boolean;
    /** 진행률 (0-100) */
    progress: number;
    /** 진행 단계 */
    progressStage: string;
    /** 에러 정보 */
    error: UploadError | null;
    /** 파일 선택 핸들러 */
    handleFileSelect: (file: File) => Promise<void>;
    /** 샘플 파일 선택 핸들러 */
    handleSelectSample: (sample: SampleInfo) => Promise<void>;
    /** URL 로드 핸들러 */
    handleUrlSubmit: (url: string) => Promise<void>;
    /** 파일 리셋 핸들러 */
    handleResetFile: () => void;
    /** 레이어 토글 핸들러 */
    handleToggleLayer: (layerName: string) => void;
    /** 전체 레이어 토글 핸들러 */
    handleToggleAllLayers: (visible: boolean) => void;
    /** 카메라 위치 리셋 */
    resetCameraPosition: (autoFit?: boolean) => void;
    /** 에러 초기화 */
    clearError: () => void;
}

/** useDxfLoader 옵션 (기존 API 유지) */
export interface UseDxfLoaderOptions {
    /** 카메라 자동 맞춤 여부 */
    autoFitCamera?: boolean;
}

/**
 * DXF 파일 로딩 및 관리 훅 (Orchestrator)
 *
 * 내부적으로 3개의 SRP 훅을 조합:
 * - useDxfFileLoader: 파일 로딩
 * - useLayerManager: 레이어 관리
 * - useCameraControl: 카메라 제어
 *
 * @param options 훅 옵션
 * @returns 파일 상태 및 제어 함수
 */
export function useDxfLoader(
    options: UseDxfLoaderOptions = {}
): UseDxfLoaderReturn {
    const { autoFitCamera = true } = options;

    // SRP 훅 조합
    const {
        layers,
        setLayers,
        handleToggleLayer,
        handleToggleAllLayers,
        resetLayers,
    } = useLayerManager();

    const {
        cameraPosition,
        updateFromBounds,
        resetCameraPosition: resetCamera,
    } = useCameraControl({ autoFitCamera });

    // 파일 로드 시 레이어/카메라 연동
    const handleDataLoaded = useCallback(
        (data: ParsedCADData) => {
            // 레이어 데이터 설정 (setLayers가 Record → Map 변환 처리)
            setLayers(data.layers);

            // 카메라 위치 자동 조정
            if (autoFitCamera && data.bounds) {
                updateFromBounds(data.bounds);
            }
        },
        [setLayers, updateFromBounds, autoFitCamera]
    );

    const fileLoader = useDxfFileLoader({
        onDataLoaded: handleDataLoaded,
    });

    // fileLoader에서 안정적 참조를 위해 개별 함수 추출
    const { handleResetFile: fileLoaderReset } = fileLoader;

    // 파일 리셋 시 레이어/카메라도 리셋
    const handleResetFile = useCallback(() => {
        fileLoaderReset();
        resetLayers();
        resetCamera(false);
    }, [fileLoaderReset, resetLayers, resetCamera]);

    // 카메라 리셋 (기존 API 유지: cadData.bounds 참조)
    const resetCameraPosition = useCallback(
        (autoFit?: boolean) => {
            resetCamera(autoFit, fileLoader.cadData?.bounds);
        },
        [resetCamera, fileLoader.cadData?.bounds]
    );

    return {
        // File Loader
        cadData: fileLoader.cadData,
        isLoading: fileLoader.isLoading,
        progress: fileLoader.progress,
        progressStage: fileLoader.progressStage,
        error: fileLoader.error,
        handleFileSelect: fileLoader.handleFileSelect,
        handleSelectSample: fileLoader.handleSelectSample,
        handleUrlSubmit: fileLoader.handleUrlSubmit,
        handleResetFile,
        clearError: fileLoader.clearError,

        // Layer Manager
        layers,
        handleToggleLayer,
        handleToggleAllLayers,

        // Camera Control
        cameraPosition,
        resetCameraPosition,
    };
}
