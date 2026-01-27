/**
 * CurveMesh - ELLIPSE/SPLINE 렌더링 컴포넌트
 *
 * ELLIPSE 및 SPLINE 엔티티를 레이어별 색상으로 렌더링
 *
 * ## Material Pooling
 * 50+ 레이어 시 성능을 위해 색상별 Material을 풀링합니다.
 * 동일 색상의 레이어는 같은 Material 인스턴스를 공유합니다.
 */

import { useMemo, useEffect, memo, useRef } from 'react';

import { DEFAULT_LAYER_COLOR, getLODSegments } from '@/constants/cad';
import type { ParsedEllipse, ParsedSpline } from '@/types/cad';
import {
    ellipsesToGeometry,
    splinesToGeometry,
    createLineMaterialPool,
} from '@/utils/cad';
import type { MaterialPool } from '@/utils/cad';

import type { CadMeshBaseProps, LayerMeshData } from './types';
import type { LineBasicMaterial } from 'three';

/**
 * CurveMesh 컴포넌트
 * ELLIPSE 및 SPLINE 엔티티를 레이어별로 렌더링
 *
 * Material Pooling으로 50+ 레이어에서도 효율적으로 렌더링
 */
function CurveMeshComponent({
    data,
    center = true,
    layers,
    dataCenter,
}: CadMeshBaseProps) {
    const totalEntities = data.metadata.entityCount;
    const segments = getLODSegments(totalEntities);

    // Material Pool (컴포넌트 수명 동안 유지)
    const materialPoolRef = useRef<MaterialPool<LineBasicMaterial> | null>(
        null
    );

    // Pool 초기화 (최초 한 번)
    if (!materialPoolRef.current) {
        materialPoolRef.current = createLineMaterialPool();
    }

    // ELLIPSE를 레이어별로 사전 그룹핑 (O(E) - 한 번만 실행)
    const ellipsesByLayer = useMemo(() => {
        const map = new Map<string, ParsedEllipse[]>();
        for (const ellipse of data.ellipses ?? []) {
            const layer = ellipse.layer ?? '0';
            if (!map.has(layer)) map.set(layer, []);
            map.get(layer)!.push(ellipse);
        }
        return map;
    }, [data.ellipses]);

    // SPLINE를 레이어별로 사전 그룹핑 (O(S) - 한 번만 실행)
    const splinesByLayer = useMemo(() => {
        const map = new Map<string, ParsedSpline[]>();
        for (const spline of data.splines ?? []) {
            const layer = spline.layer ?? '0';
            if (!map.has(layer)) map.set(layer, []);
            map.get(layer)!.push(spline);
        }
        return map;
    }, [data.splines]);

    // ELLIPSE/SPLINE 지오메트리 생성
    const ellipseSplineMeshes = useMemo((): LayerMeshData[] => {
        const pool = materialPoolRef.current!;
        const hasEllipses = data.ellipses && data.ellipses.length > 0;
        const hasSplines = data.splines && data.splines.length > 0;

        if (!hasEllipses && !hasSplines) {
            return [];
        }

        const meshes: LayerMeshData[] = [];

        if (!layers || layers.size === 0) {
            // 레이어 정보 없으면 단일 메시
            // Material Pool에서 가져오기
            const mat = pool.get(DEFAULT_LAYER_COLOR);

            if (hasEllipses) {
                const ellipseGeom = ellipsesToGeometry(data.ellipses, segments);
                if (center) {
                    ellipseGeom.translate(
                        -dataCenter.x,
                        -dataCenter.y,
                        -dataCenter.z
                    );
                }
                meshes.push({
                    layerName: 'ellipse-spline-default-ellipse',
                    geometry: ellipseGeom,
                    material: mat,
                    visible: true,
                });
            }

            if (hasSplines) {
                const splineGeom = splinesToGeometry(data.splines, segments);
                if (center) {
                    splineGeom.translate(
                        -dataCenter.x,
                        -dataCenter.y,
                        -dataCenter.z
                    );
                }
                meshes.push({
                    layerName: 'ellipse-spline-default-spline',
                    geometry: splineGeom,
                    material: mat,
                    visible: true,
                });
            }
        } else {
            for (const [layerName, layerInfo] of layers.entries()) {
                // O(1) 조회로 변경 (기존: O(E), O(S) filter)
                const layerEllipses = ellipsesByLayer.get(layerName) ?? [];
                const layerSplines = splinesByLayer.get(layerName) ?? [];

                if (layerEllipses.length === 0 && layerSplines.length === 0) {
                    continue;
                }

                // Material Pool에서 가져오기 (같은 색상은 재사용)
                const mat = pool.get(layerInfo.color);

                if (layerEllipses.length > 0) {
                    const ellipseGeom = ellipsesToGeometry(
                        layerEllipses,
                        segments
                    );
                    if (center) {
                        ellipseGeom.translate(
                            -dataCenter.x,
                            -dataCenter.y,
                            -dataCenter.z
                        );
                    }
                    meshes.push({
                        layerName: `ellipse-spline-${layerName}-ellipse`,
                        geometry: ellipseGeom,
                        material: mat,
                        visible: layerInfo.visible,
                    });
                }

                if (layerSplines.length > 0) {
                    const splineGeom = splinesToGeometry(
                        layerSplines,
                        segments
                    );
                    if (center) {
                        splineGeom.translate(
                            -dataCenter.x,
                            -dataCenter.y,
                            -dataCenter.z
                        );
                    }
                    meshes.push({
                        layerName: `ellipse-spline-${layerName}-spline`,
                        geometry: splineGeom,
                        material: mat,
                        visible: layerInfo.visible,
                    });
                }
            }
        }

        return meshes;
    }, [
        data.ellipses,
        data.splines,
        layers,
        center,
        dataCenter,
        segments,
        ellipsesByLayer,
        splinesByLayer,
    ]);

    // Geometry 정리 (Material은 Pool에서 관리)
    useEffect(() => {
        return () => {
            for (const mesh of ellipseSplineMeshes) {
                mesh.geometry.dispose();
                // Material은 pool에서 관리하므로 개별 dispose 안 함
            }
        };
    }, [ellipseSplineMeshes]);

    // 컴포넌트 언마운트 시 Material Pool 정리
    useEffect(() => {
        return () => {
            materialPoolRef.current?.dispose();
            materialPoolRef.current = null;
        };
    }, []);

    return (
        <>
            {ellipseSplineMeshes.map(
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

export const CurveMesh = memo(CurveMeshComponent);
