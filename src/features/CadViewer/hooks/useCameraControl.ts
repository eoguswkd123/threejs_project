/**
 * Camera Control Hook
 * 카메라 위치 상태 관리 전용 훅
 *
 * SRP 분리: useDxfLoader에서 카메라 제어 책임 분리
 */

import { useState, useCallback } from 'react';

import type { BoundingBox } from '@/types/cad';
import { calculateCameraDistance } from '@/utils/cad';

import { CAMERA_CONFIG } from '../constants';

/** useCameraControl 옵션 */
export interface UseCameraControlOptions {
    /** 카메라 자동 맞춤 여부 (기본값: true) */
    autoFitCamera?: boolean;
    /** 초기 카메라 위치 */
    initialPosition?: [number, number, number];
}

/** useCameraControl 반환 타입 */
export interface UseCameraControlReturn {
    /** 현재 카메라 위치 [x, y, z] */
    cameraPosition: [number, number, number];
    /** 카메라 위치 직접 설정 */
    setCameraPosition: (position: [number, number, number]) => void;
    /** BoundingBox 기반으로 카메라 위치 자동 조정 */
    updateFromBounds: (bounds: BoundingBox) => void;
    /** 카메라 위치 리셋 (autoFit 옵션, bounds 제공 시 자동 맞춤) */
    resetCameraPosition: (
        autoFit?: boolean,
        bounds?: BoundingBox | null
    ) => void;
}

/**
 * 카메라 위치 제어 훅
 * @param options 훅 옵션
 * @returns 카메라 상태 및 제어 함수
 */
export function useCameraControl(
    options: UseCameraControlOptions = {}
): UseCameraControlReturn {
    const {
        autoFitCamera = true,
        initialPosition = [...CAMERA_CONFIG.defaultPosition] as [
            number,
            number,
            number,
        ],
    } = options;

    const [cameraPosition, setCameraPositionState] =
        useState<[number, number, number]>(initialPosition);

    /** 카메라 위치 직접 설정 */
    const setCameraPosition = useCallback(
        (position: [number, number, number]) => {
            setCameraPositionState([...position]);
        },
        []
    );

    /** BoundingBox 기반 카메라 위치 계산 및 설정 */
    const updateFromBounds = useCallback((bounds: BoundingBox) => {
        const distance = calculateCameraDistance(bounds, CAMERA_CONFIG.fov);
        setCameraPositionState([0, 0, distance]);
    }, []);

    /** 카메라 위치 리셋 */
    const resetCameraPosition = useCallback(
        (autoFit?: boolean, bounds?: BoundingBox | null) => {
            const shouldAutoFit = autoFit ?? autoFitCamera;

            if (shouldAutoFit && bounds) {
                const distance = calculateCameraDistance(
                    bounds,
                    CAMERA_CONFIG.fov
                );
                setCameraPositionState([0, 0, distance]);
            } else {
                setCameraPositionState([...CAMERA_CONFIG.defaultPosition]);
            }
        },
        [autoFitCamera]
    );

    return {
        cameraPosition,
        setCameraPosition,
        updateFromBounds,
        resetCameraPosition,
    };
}
