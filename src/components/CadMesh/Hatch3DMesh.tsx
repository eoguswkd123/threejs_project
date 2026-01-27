/**
 * Hatch3DMesh - 3D HATCH Extrusion Rendering Component
 *
 * Phase 2.1.6: 2D HATCH를 3D ExtrudeGeometry로 변환하여 렌더링
 *
 * @module components/CadMesh/Hatch3DMesh
 */

import { useMemo, useEffect, memo } from 'react';

import { getLODSegments } from '@/constants/cad';
import { useCadMaterialMap } from '@/features/CadViewer/hooks/useCadMaterial';
import {
    DEFAULT_EXTRUDE_OPTIONS,
    DEFAULT_SHADING_MODE,
    type CadShadingMode,
    type ExtrudeOptions,
    type Hatch3DGeometryData,
} from '@/types/cad';
import { translateToCenter, calculateCenteredZPosition } from '@/utils/cad';
import {
    hatchesToExtrude3DGeometries,
    mergeHatch3DGeometriesByLayer,
    disposeHatch3DGeometries,
} from '@/utils/cad/hatch3DExtrude';

import type { CadMeshBaseProps } from './types';
import type * as THREE from 'three';

/**
 * Hatch3DMesh Props
 */
export interface Hatch3DMeshProps extends CadMeshBaseProps {
    /** 돌출 옵션 */
    extrudeOptions?: ExtrudeOptions;
    /** 레이어 머징 사용 여부 (성능 최적화) */
    mergeByLayer?: boolean;
    /** 3D 쉐이딩 모드 (Phase 2.1.7) */
    shadingMode?: CadShadingMode;
}

/**
 * 3D HATCH 메시 데이터
 */
interface Hatch3DMeshRenderData {
    key: string;
    geometry: THREE.BufferGeometry;
    color: string;
    zPosition: number;
    visible: boolean;
}

/**
 * Hatch3DMesh 컴포넌트
 *
 * 2D HATCH를 3D로 돌출하여 렌더링
 *
 * @example
 * <Hatch3DMesh
 *   data={cadData}
 *   layers={layerMap}
 *   dataCenter={center}
 *   extrudeOptions={{ depth: 20 }}
 * />
 */
function Hatch3DMeshComponent({
    data,
    center = true,
    layers,
    dataCenter,
    extrudeOptions = DEFAULT_EXTRUDE_OPTIONS,
    mergeByLayer = true,
    shadingMode = DEFAULT_SHADING_MODE,
}: Hatch3DMeshProps) {
    const totalEntities = data.metadata.entityCount;
    const segments = getLODSegments(totalEntities);

    // 3D HATCH 지오메트리 생성
    const hatch3DGeometries = useMemo((): Hatch3DGeometryData[] => {
        if (!data.hatches || data.hatches.length === 0) {
            return [];
        }

        // 돌출 깊이가 0이면 3D 변환 스킵
        if (extrudeOptions.depth <= 0) {
            return [];
        }

        // Map → Record 변환 (hatchesToExtrude3DGeometries는 Record 기대)
        const layersRecord = layers
            ? Object.fromEntries(layers.entries())
            : undefined;

        return hatchesToExtrude3DGeometries(
            data.hatches,
            extrudeOptions,
            layersRecord,
            segments
        );
    }, [data.hatches, layers, extrudeOptions, segments]);

    // 렌더링용 메시 데이터 (머지 여부에 따라 처리)
    const meshRenderData = useMemo((): Hatch3DMeshRenderData[] => {
        if (hatch3DGeometries.length === 0) {
            return [];
        }

        const renderData: Hatch3DMeshRenderData[] = [];

        if (mergeByLayer && hatch3DGeometries.length > 1) {
            // 레이어별 머지
            const mergedMap = mergeHatch3DGeometriesByLayer(hatch3DGeometries);

            for (const [layerName, { geometry, color, visible }] of mergedMap) {
                // 중심 정렬
                translateToCenter(geometry, dataCenter, center);

                renderData.push({
                    key: `hatch3d-merged-${layerName}`,
                    geometry,
                    color,
                    zPosition: 0, // 머지 시 z 위치는 지오메트리에 포함
                    visible,
                });
            }
        } else {
            // 개별 렌더링
            for (const geoData of hatch3DGeometries) {
                const geometry = geoData.geometry.clone();

                // 중심 정렬
                translateToCenter(geometry, dataCenter, center);

                renderData.push({
                    key: geoData.key,
                    geometry,
                    color: geoData.color,
                    zPosition: calculateCenteredZPosition(
                        geoData.zPosition,
                        dataCenter,
                        center
                    ),
                    visible: geoData.visible,
                });
            }
        }

        return renderData;
    }, [hatch3DGeometries, mergeByLayer, center, dataCenter]);

    // 색상 목록 추출
    const colors = useMemo(
        () => [...new Set(meshRenderData.map((m) => m.color))],
        [meshRenderData]
    );

    // Materials 캐싱 (useCadMaterialMap hook 사용)
    const materials = useCadMaterialMap(colors, shadingMode);

    // 메모리 정리 (Materials는 useCadMaterialMap에서 자동 정리)
    useEffect(() => {
        return () => {
            // 원본 지오메트리 정리 (머지하지 않은 경우에만)
            if (!mergeByLayer) {
                disposeHatch3DGeometries(hatch3DGeometries);
            }

            // 렌더 데이터 정리
            for (const mesh of meshRenderData) {
                mesh.geometry.dispose();
            }
        };
    }, [hatch3DGeometries, meshRenderData, mergeByLayer]);

    // 표시할 데이터가 없으면 null 반환
    if (meshRenderData.length === 0) {
        return null;
    }

    return (
        <group name="hatch3d-group">
            {meshRenderData.map((mesh) => {
                const material = materials.get(mesh.color);
                if (!mesh.visible || !material) return null;

                return (
                    <mesh
                        key={mesh.key}
                        geometry={mesh.geometry}
                        material={material}
                        position={[0, 0, mesh.zPosition]}
                        castShadow
                        receiveShadow
                    />
                );
            })}
        </group>
    );
}

export const Hatch3DMesh = memo(Hatch3DMeshComponent);
