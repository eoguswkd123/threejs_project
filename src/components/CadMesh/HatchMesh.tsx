/**
 * HatchMesh - HATCH 렌더링 컴포넌트
 *
 * HATCH 엔티티를 렌더링 모드에 따라 와이어프레임/솔리드/패턴으로 표시
 */

import { useMemo, useEffect, useRef, memo } from 'react';

import * as THREE from 'three';

import {
    DEFAULT_LAYER_COLOR,
    HATCH_CONFIG,
    getLODSegments,
} from '@/constants/cad';
import type { ParsedHatch } from '@/types/cad';
import {
    hatchBoundariesToWireframe,
    hatchesToSolidGeometries,
    createPatternTexture,
    filterHatchesByLayerName,
    translateToCenter,
    translateToCenterXY,
    calculateCenteredZPosition,
    createLineMaterialPool,
    type MaterialPool,
} from '@/utils/cad';

import type { HatchMeshProps, LayerMeshData, HatchMeshData } from './types';

/**
 * HatchMesh 컴포넌트
 * HATCH 엔티티를 와이어프레임/솔리드/패턴 모드로 렌더링
 */
function HatchMeshComponent({
    data,
    center = true,
    layers,
    dataCenter,
    renderMode,
}: HatchMeshProps) {
    const totalEntities = data.metadata.entityCount;
    const segments = getLODSegments(totalEntities);

    // Material Pool (outline 모드용) - 색상별 LineBasicMaterial 재사용
    const lineMatPoolRef = useRef<MaterialPool<THREE.LineBasicMaterial> | null>(
        null
    );
    if (!lineMatPoolRef.current) {
        lineMatPoolRef.current = createLineMaterialPool();
    }

    // HATCH 아웃라인 경계 (outline 모드용)
    const hatchWireframeMeshes = useMemo((): LayerMeshData[] => {
        if (
            renderMode !== 'outline' ||
            !data.hatches ||
            data.hatches.length === 0
        ) {
            return [];
        }

        const meshes: LayerMeshData[] = [];
        const pool = lineMatPoolRef.current!;

        if (!layers || layers.size === 0) {
            // 레이어 정보 없으면 단일 메시
            const geom = hatchBoundariesToWireframe(data.hatches, segments);
            translateToCenter(geom, dataCenter, center);
            const mat = pool.get(DEFAULT_LAYER_COLOR);
            meshes.push({
                layerName: 'hatch-default',
                geometry: geom,
                material: mat,
                visible: true,
            });
        } else {
            for (const [layerName, layerInfo] of layers.entries()) {
                const layerHatches = filterHatchesByLayerName(
                    data.hatches,
                    layerName
                );
                if (layerHatches.length === 0) continue;

                const geom = hatchBoundariesToWireframe(layerHatches, segments);
                translateToCenter(geom, dataCenter, center);
                const mat = pool.get(layerInfo.color);
                meshes.push({
                    layerName: `hatch-${layerName}`,
                    geometry: geom,
                    material: mat,
                    visible: layerInfo.visible,
                });
            }
        }

        return meshes;
    }, [data.hatches, layers, center, dataCenter, renderMode, segments]);

    // HATCH 솔리드/패턴 메시 (solid/pattern 모드용)
    // Material 풀링: 동일 색상의 solid 모드 Material 재사용
    const hatchFillMeshes = useMemo((): HatchMeshData[] => {
        if (
            renderMode === 'outline' ||
            !data.hatches ||
            data.hatches.length === 0
        ) {
            return [];
        }

        const meshes: HatchMeshData[] = [];
        // Material 캐시 (solid 모드용) - 색상별 재사용
        const solidMaterialCache = new Map<string, THREE.MeshBasicMaterial>();

        const getOrCreateSolidMaterial = (
            color: string
        ): THREE.MeshBasicMaterial => {
            const cached = solidMaterialCache.get(color);
            if (cached) return cached;

            const material = new THREE.MeshBasicMaterial({
                color: new THREE.Color(color),
                transparent: true,
                opacity: HATCH_CONFIG.solidOpacity,
                side: THREE.DoubleSide,
            });
            solidMaterialCache.set(color, material);
            return material;
        };

        const processHatch = (
            hatch: ParsedHatch,
            index: number,
            layerColor: string,
            visible: boolean
        ) => {
            const hatchGeomData = hatchesToSolidGeometries([hatch], segments);
            if (hatchGeomData.length === 0) return;

            const geomData = hatchGeomData[0]!;

            // 중심 정렬 (XY 평면만)
            translateToCenterXY(geomData.geometry, dataCenter, center);

            let material: THREE.MeshBasicMaterial;

            if (renderMode === 'solid' || hatch.isSolid) {
                // 솔리드 채우기 - Material 캐시 사용
                material = getOrCreateSolidMaterial(layerColor);
            } else {
                // 패턴 채우기 - 각 패턴마다 고유 texture 필요
                const texture = createPatternTexture(hatch, layerColor);
                material = new THREE.MeshBasicMaterial({
                    map: texture,
                    transparent: true,
                    opacity: HATCH_CONFIG.solidOpacity,
                    side: THREE.DoubleSide,
                });
            }

            meshes.push({
                key: `hatch-fill-${index}`,
                geometry: geomData.geometry,
                material,
                zPosition: calculateCenteredZPosition(
                    geomData.zPosition,
                    dataCenter,
                    center
                ),
                visible,
            });
        };

        if (!layers || layers.size === 0) {
            // 레이어 정보 없으면 전체 처리
            data.hatches.forEach((hatch, idx) => {
                processHatch(hatch, idx, DEFAULT_LAYER_COLOR, true);
            });
        } else {
            let globalIndex = 0;
            for (const [layerName, layerInfo] of layers.entries()) {
                const layerHatches = filterHatchesByLayerName(
                    data.hatches,
                    layerName
                );
                for (const hatch of layerHatches) {
                    processHatch(
                        hatch,
                        globalIndex++,
                        layerInfo.color,
                        layerInfo.visible
                    );
                }
            }
        }

        return meshes;
    }, [data.hatches, layers, center, dataCenter, renderMode, segments]);

    // Geometry 정리 (Material은 풀에서 관리)
    // Note: outline 모드 Material은 lineMatPoolRef에서 관리
    // Note: solid 모드 Material은 solidMaterialCache에서 관리
    useEffect(() => {
        return () => {
            // Outline 모드: Geometry만 정리 (Material은 풀에서 관리)
            for (const mesh of hatchWireframeMeshes) {
                mesh.geometry.dispose();
            }

            // Solid/Pattern 모드: 공유 Material 중복 dispose 방지
            const disposedMaterials = new Set<THREE.MeshBasicMaterial>();

            for (const mesh of hatchFillMeshes) {
                mesh.geometry.dispose();

                // Material이 이미 dispose되지 않은 경우에만 처리
                if (!disposedMaterials.has(mesh.material)) {
                    if (mesh.material.map) {
                        mesh.material.map.dispose();
                    }
                    mesh.material.dispose();
                    disposedMaterials.add(mesh.material);
                }
            }
        };
    }, [hatchWireframeMeshes, hatchFillMeshes]);

    // Material Pool 정리 (컴포넌트 언마운트 시)
    useEffect(() => {
        return () => {
            lineMatPoolRef.current?.dispose();
            lineMatPoolRef.current = null;
        };
    }, []);

    return (
        <>
            {/* HATCH 아웃라인 경계 (outline 모드) */}
            {hatchWireframeMeshes.map(
                (mesh) =>
                    mesh.visible && (
                        <lineSegments
                            key={mesh.layerName}
                            geometry={mesh.geometry}
                            material={mesh.material}
                        />
                    )
            )}

            {/* HATCH 솔리드/패턴 채우기 (solid/pattern 모드) */}
            {hatchFillMeshes.map(
                (mesh) =>
                    mesh.visible && (
                        <mesh
                            key={mesh.key}
                            geometry={mesh.geometry}
                            material={mesh.material}
                            position={[0, 0, mesh.zPosition]}
                        />
                    )
            )}
        </>
    );
}

export const HatchMesh = memo(HatchMeshComponent);
