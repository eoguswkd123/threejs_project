/**
 * CAD Viewer - CAD Mesh Component
 * 파싱된 CAD 데이터를 Three.js LineSegments로 렌더링
 * 레이어별 색상 지원
 */

import { useMemo, useEffect, memo } from 'react';

import * as THREE from 'three';

import { DEFAULT_LAYER_COLOR } from '../constants';
import { cadDataToGeometry } from '../utils/dxfToGeometry';

import type { ParsedCADData, LayerInfo } from '../types';

interface CADMeshProps {
    /** 파싱된 CAD 데이터 */
    data: ParsedCADData;
    /** 기본 와이어프레임 색상 (레이어 색상이 없을 때 사용) */
    color?: string;
    /** 중심 정렬 여부 */
    center?: boolean;
    /** 레이어 정보 (가시성 및 색상용) */
    layers?: Map<string, LayerInfo>;
}

/**
 * 특정 레이어의 데이터만 필터링
 */
function filterDataByLayerName(
    data: ParsedCADData,
    layerName: string
): ParsedCADData {
    const matchLayer = (entityLayer: string | undefined): boolean => {
        return (entityLayer ?? '0') === layerName;
    };

    return {
        ...data,
        lines: data.lines.filter((e) => matchLayer(e.layer)),
        circles: data.circles.filter((e) => matchLayer(e.layer)),
        arcs: data.arcs.filter((e) => matchLayer(e.layer)),
        polylines: data.polylines.filter((e) => matchLayer(e.layer)),
    };
}

/**
 * 바운딩 박스 중심점 계산
 */
function calculateDataCenter(data: ParsedCADData): THREE.Vector3 {
    let minX = Infinity,
        minY = Infinity,
        minZ = Infinity;
    let maxX = -Infinity,
        maxY = -Infinity,
        maxZ = -Infinity;

    for (const line of data.lines) {
        minX = Math.min(minX, line.start.x, line.end.x);
        minY = Math.min(minY, line.start.y, line.end.y);
        minZ = Math.min(minZ, line.start.z, line.end.z);
        maxX = Math.max(maxX, line.start.x, line.end.x);
        maxY = Math.max(maxY, line.start.y, line.end.y);
        maxZ = Math.max(maxZ, line.start.z, line.end.z);
    }

    if (minX === Infinity) {
        return new THREE.Vector3(0, 0, 0);
    }

    return new THREE.Vector3(
        (minX + maxX) / 2,
        (minY + maxY) / 2,
        (minZ + maxZ) / 2
    );
}

interface LayerMeshData {
    layerName: string;
    geometry: THREE.BufferGeometry;
    material: THREE.LineBasicMaterial;
    visible: boolean;
}

/**
 * CAD Mesh 컴포넌트
 * 레이어별로 분리 렌더링하여 각 레이어 색상 적용
 */
function CADMeshComponent({
    data,
    color = DEFAULT_LAYER_COLOR,
    center = true,
    layers,
}: CADMeshProps) {
    // 전체 데이터의 중심점 계산 (한 번만)
    const dataCenter = useMemo(() => {
        if (!center) return new THREE.Vector3(0, 0, 0);
        return calculateDataCenter(data);
    }, [data, center]);

    // 레이어별 메시 데이터 생성
    const layerMeshes = useMemo((): LayerMeshData[] => {
        if (!layers || layers.size === 0) {
            // 레이어 정보 없으면 단일 메시로 렌더링
            const geom = cadDataToGeometry(data);
            if (center) {
                geom.translate(-dataCenter.x, -dataCenter.y, -dataCenter.z);
            }
            const mat = new THREE.LineBasicMaterial({
                color: new THREE.Color(color),
                linewidth: 1,
            });
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

        for (const [layerName, layerInfo] of layers) {
            // 해당 레이어의 데이터만 필터링
            const layerData = filterDataByLayerName(data, layerName);

            // 엔티티가 없으면 스킵
            const entityCount =
                layerData.lines.length +
                layerData.circles.length +
                layerData.arcs.length +
                layerData.polylines.length;

            if (entityCount === 0) continue;

            // geometry 생성
            const geom = cadDataToGeometry(layerData);

            // 중심 정렬 (전체 데이터 기준)
            if (center) {
                geom.translate(-dataCenter.x, -dataCenter.y, -dataCenter.z);
            }

            // 레이어 색상으로 material 생성
            const mat = new THREE.LineBasicMaterial({
                color: new THREE.Color(layerInfo.color),
                linewidth: 1,
            });

            meshes.push({
                layerName,
                geometry: geom,
                material: mat,
                visible: layerInfo.visible,
            });
        }

        return meshes;
    }, [data, layers, color, center, dataCenter]);

    // Geometry 및 Material 정리 (메모리 누수 방지)
    useEffect(() => {
        return () => {
            for (const mesh of layerMeshes) {
                mesh.geometry.dispose();
                mesh.material.dispose();
            }
        };
    }, [layerMeshes]);

    return (
        <group>
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
        </group>
    );
}

export const CADMesh = memo(CADMeshComponent);
