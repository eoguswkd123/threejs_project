/**
 * WireframeMesh - LINE/CIRCLE/ARC/POLYLINE 렌더링 컴포넌트
 *
 * 기본 와이어프레임 엔티티를 레이어별 색상으로 렌더링
 *
 * ## Material Pooling
 * 50+ 레이어 시 성능을 위해 색상별 Material을 풀링합니다.
 * 동일 색상의 레이어는 같은 Material 인스턴스를 공유합니다.
 */

import { useMemo, useEffect, memo, useRef } from 'react';

import { DEFAULT_LAYER_COLOR } from '@/constants/cad';
import {
    cadDataToGeometry,
    filterDataByLayerName,
    getWireframeEntityCount,
    createLineMaterialPool,
    translateToCenter,
} from '@/utils/cad';
import type { MaterialPool } from '@/utils/cad';

import type { CadMeshBaseProps, LayerMeshData } from './types';
import type { LineBasicMaterial } from 'three';

/**
 * WireframeMesh 컴포넌트
 * LINE, CIRCLE, ARC, POLYLINE 엔티티를 레이어별로 렌더링
 *
 * Material Pooling으로 50+ 레이어에서도 효율적으로 렌더링
 */
function WireframeMeshComponent({
    data,
    center = true,
    layers,
    dataCenter,
}: CadMeshBaseProps) {
    // Material Pool (컴포넌트 수명 동안 유지)
    const materialPoolRef = useRef<MaterialPool<LineBasicMaterial> | null>(
        null
    );

    // Pool 초기화 (최초 한 번)
    if (!materialPoolRef.current) {
        materialPoolRef.current = createLineMaterialPool();
    }

    // 레이어별 메시 데이터 생성
    const layerMeshes = useMemo((): LayerMeshData[] => {
        const pool = materialPoolRef.current!;

        if (!layers || layers.size === 0) {
            // 레이어 정보 없으면 단일 메시로 렌더링
            const geom = cadDataToGeometry(data);
            translateToCenter(geom, dataCenter, center);
            const mat = pool.get(DEFAULT_LAYER_COLOR);
            return [
                {
                    layerName: 'default',
                    geometry: geom,
                    material: mat,
                    visible: true,
                },
            ];
        }

        const meshes: LayerMeshData[] = [];

        for (const [layerName, layerInfo] of layers.entries()) {
            // 해당 레이어의 데이터만 필터링
            const layerData = filterDataByLayerName(data, layerName);

            // 엔티티가 없으면 스킵
            const entityCount = getWireframeEntityCount(layerData);
            if (entityCount === 0) continue;

            // geometry 생성
            const geom = cadDataToGeometry(layerData);

            // 중심 정렬 (전체 데이터 기준)
            translateToCenter(geom, dataCenter, center);

            // 레이어 색상으로 material 가져오기 (풀에서)
            const mat = pool.get(layerInfo.color);

            meshes.push({
                layerName,
                geometry: geom,
                material: mat,
                visible: layerInfo.visible,
            });
        }

        return meshes;
    }, [data, layers, center, dataCenter]);

    // Geometry 정리 (Material은 Pool에서 관리)
    useEffect(() => {
        return () => {
            for (const mesh of layerMeshes) {
                mesh.geometry.dispose();
                // Material은 pool에서 관리하므로 개별 dispose 안 함
            }
        };
    }, [layerMeshes]);

    // 컴포넌트 언마운트 시 Material Pool 정리
    useEffect(() => {
        return () => {
            materialPoolRef.current?.dispose();
            materialPoolRef.current = null;
        };
    }, []);

    return (
        <>
            {layerMeshes.map(
                (mesh) =>
                    mesh.visible && (
                        <lineSegments
                            key={mesh.layerName}
                            geometry={mesh.geometry}
                            material={mesh.material}
                        />
                    )
            )}
        </>
    );
}

export const WireframeMesh = memo(WireframeMeshComponent);
