/**
 * Layer Manager Hook
 * 레이어 상태 관리 전용 훅
 *
 * SRP 분리: useDxfLoader에서 레이어 관리 책임 분리
 */

import { useState, useCallback } from 'react';

import type { LayerInfo } from '@/types/cad';

/** useLayerManager 옵션 */
export interface UseLayerManagerOptions {
    /** 초기 레이어 데이터 */
    initialLayers?: Map<string, LayerInfo>;
}

/** useLayerManager 반환 타입 */
export interface UseLayerManagerReturn {
    /** 레이어 정보 맵 */
    layers: Map<string, LayerInfo>;
    /** 레이어 데이터 설정 (Map 또는 Record 지원) */
    setLayers: (
        layers: Map<string, LayerInfo> | Record<string, LayerInfo>
    ) => void;
    /** 개별 레이어 토글 */
    handleToggleLayer: (layerName: string) => void;
    /** 전체 레이어 토글 */
    handleToggleAllLayers: (visible: boolean) => void;
    /** 레이어 초기화 */
    resetLayers: () => void;
}

/**
 * 레이어 상태 관리 훅
 * @param options 훅 옵션
 * @returns 레이어 상태 및 제어 함수
 */
export function useLayerManager(
    options: UseLayerManagerOptions = {}
): UseLayerManagerReturn {
    const { initialLayers = new Map() } = options;

    const [layers, setLayersState] =
        useState<Map<string, LayerInfo>>(initialLayers);

    /** 레이어 데이터 설정 (Map 또는 Record 지원) */
    const setLayers = useCallback(
        (newLayers: Map<string, LayerInfo> | Record<string, LayerInfo>) => {
            if (newLayers instanceof Map) {
                setLayersState(new Map(newLayers));
            } else {
                // Record를 Map으로 변환
                setLayersState(new Map(Object.entries(newLayers)));
            }
        },
        []
    );

    /** 개별 레이어 토글 */
    const handleToggleLayer = useCallback((layerName: string) => {
        setLayersState((prev) => {
            const newLayers = new Map(prev);
            const layer = newLayers.get(layerName);
            if (layer) {
                newLayers.set(layerName, { ...layer, visible: !layer.visible });
            }
            return newLayers;
        });
    }, []);

    /** 전체 레이어 토글 */
    const handleToggleAllLayers = useCallback((visible: boolean) => {
        setLayersState((prev) => {
            const newLayers = new Map(prev);
            for (const [name, layer] of newLayers) {
                newLayers.set(name, { ...layer, visible });
            }
            return newLayers;
        });
    }, []);

    /** 레이어 초기화 */
    const resetLayers = useCallback(() => {
        setLayersState(new Map());
    }, []);

    return {
        layers,
        setLayers,
        handleToggleLayer,
        handleToggleAllLayers,
        resetLayers,
    };
}
