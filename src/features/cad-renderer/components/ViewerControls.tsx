/**
 * 뷰어 컨트롤 컴포넌트
 * 카메라 프리셋, 줌, 렌더 모드 등 제어
 */

import { useCallback } from 'react';
import { useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import * as THREE from 'three';
import { useViewerStore, useCADStore } from '@stores';
import type { CameraPreset } from '@types/viewer';
import { CAMERA_PRESETS } from '@types/viewer';

interface ViewerControlsProps {
    enableDamping?: boolean;
    dampingFactor?: number;
    enableZoom?: boolean;
    enableRotate?: boolean;
    enablePan?: boolean;
    minDistance?: number;
    maxDistance?: number;
    onCameraChange?: () => void;
}

export function ViewerControls({
    enableDamping = true,
    dampingFactor = 0.05,
    enableZoom = true,
    enableRotate = true,
    enablePan = true,
    minDistance = 1,
    maxDistance = 10000,
    onCameraChange,
}: ViewerControlsProps) {
    const { camera } = useThree();
    const setCamera = useViewerStore((state) => state.setCamera);

    // 카메라 변경 시 스토어 업데이트
    const handleChange = useCallback(() => {
        if (camera instanceof THREE.PerspectiveCamera) {
            const position = camera.position.toArray() as [number, number, number];
            setCamera({ position });
        }
        onCameraChange?.();
    }, [camera, setCamera, onCameraChange]);

    return (
        <OrbitControls
            enableDamping={enableDamping}
            dampingFactor={dampingFactor}
            enableZoom={enableZoom}
            enableRotate={enableRotate}
            enablePan={enablePan}
            minDistance={minDistance}
            maxDistance={maxDistance}
            onChange={handleChange}
        />
    );
}

// 카메라 제어 훅
export function useCameraControls() {
    const setCamera = useViewerStore((state) => state.setCamera);
    const setCameraPreset = useViewerStore((state) => state.setCameraPreset);
    const resetCamera = useViewerStore((state) => state.resetCamera);
    const zoomToFit = useViewerStore((state) => state.zoomToFit);
    const cadData = useCADStore((state) => state.cadData);

    // 프리셋 적용
    const applyPreset = useCallback(
        (preset: CameraPreset) => {
            setCameraPreset(preset);
        },
        [setCameraPreset]
    );

    // 전체 보기
    const fitToView = useCallback(() => {
        if (cadData?.bounds) {
            zoomToFit(cadData.bounds);
        }
    }, [cadData, zoomToFit]);

    // 카메라 리셋
    const reset = useCallback(() => {
        resetCamera();
    }, [resetCamera]);

    // 줌 인/아웃
    const zoom = useCallback(
        (factor: number) => {
            setCamera((prev) => ({
                zoom: (prev.zoom ?? 1) * factor,
            }));
        },
        [setCamera]
    );

    return {
        applyPreset,
        fitToView,
        reset,
        zoomIn: () => zoom(1.2),
        zoomOut: () => zoom(0.8),
        presets: Object.keys(CAMERA_PRESETS) as CameraPreset[],
    };
}
