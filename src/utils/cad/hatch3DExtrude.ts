/**
 * CAD Viewer - HATCH 3D Extrusion Utilities
 *
 * Phase 2.1.6: 2D HATCH를 3D ExtrudeGeometry로 변환
 *
 * @module utils/cad/hatch3DExtrude
 */

import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

import { DXF_COLOR_MAP, DEFAULT_LAYER_COLOR } from '@/constants/cad';
import type {
    ParsedHatch,
    HatchBoundaryPath,
    ExtrudeOptions,
    Hatch3DGeometryData,
    LayerInfo,
} from '@/types/cad';
import { DEFAULT_EXTRUDE_OPTIONS, getLOD3DSteps } from '@/types/cad';

// ============================================================
// Shape Conversion (Boundary → THREE.Shape)
// ============================================================

/**
 * HATCH 경계 경로를 THREE.Shape으로 변환
 *
 * @param boundary - HATCH 경계 경로
 * @param segments - 곡선 세그먼트 수 (기본: 32)
 * @returns THREE.Shape 또는 null (변환 실패 시)
 */
function boundaryToShape(
    boundary: HatchBoundaryPath,
    segments: number = 32
): THREE.Shape | null {
    if (
        boundary.type === 'polyline' &&
        boundary.vertices &&
        boundary.vertices.length >= 3
    ) {
        const shape = new THREE.Shape();
        shape.moveTo(boundary.vertices[0]!.x, boundary.vertices[0]!.y);
        for (let i = 1; i < boundary.vertices.length; i++) {
            shape.lineTo(boundary.vertices[i]!.x, boundary.vertices[i]!.y);
        }
        shape.closePath();
        return shape;
    } else if (
        boundary.type === 'circle' &&
        boundary.center &&
        boundary.radius > 0
    ) {
        const shape = new THREE.Shape();
        const curve = new THREE.EllipseCurve(
            boundary.center.x,
            boundary.center.y,
            boundary.radius,
            boundary.radius,
            0,
            Math.PI * 2,
            false,
            0
        );
        const points = curve.getPoints(segments);
        if (points.length < 3) return null;

        shape.moveTo(points[0]!.x, points[0]!.y);
        for (let i = 1; i < points.length; i++) {
            shape.lineTo(points[i]!.x, points[i]!.y);
        }
        shape.closePath();
        return shape;
    } else if (boundary.type === 'ellipse' && boundary.center) {
        const shape = new THREE.Shape();
        const majorLength = Math.sqrt(
            boundary.majorAxisEndPoint.x ** 2 +
                boundary.majorAxisEndPoint.y ** 2
        );
        const minorLength = majorLength * boundary.axisRatio;
        const rotation = Math.atan2(
            boundary.majorAxisEndPoint.y,
            boundary.majorAxisEndPoint.x
        );

        const curve = new THREE.EllipseCurve(
            boundary.center.x,
            boundary.center.y,
            majorLength,
            minorLength,
            boundary.startAngle,
            boundary.endAngle,
            false,
            rotation
        );
        const points = curve.getPoints(segments);
        if (points.length < 3) return null;

        shape.moveTo(points[0]!.x, points[0]!.y);
        for (let i = 1; i < points.length; i++) {
            shape.lineTo(points[i]!.x, points[i]!.y);
        }
        shape.closePath();
        return shape;
    } else if (
        boundary.type === 'arc' &&
        boundary.center &&
        boundary.radius > 0
    ) {
        // Arc는 닫힌 형태가 아니므로 Shape으로 변환 시 주의
        // 여기서는 arc를 포함한 shape 생성 (완전한 원호 영역)
        const shape = new THREE.Shape();
        const startRad = (boundary.startAngle * Math.PI) / 180;
        let endRad = (boundary.endAngle * Math.PI) / 180;
        if (endRad <= startRad) endRad += Math.PI * 2;

        const curve = new THREE.EllipseCurve(
            boundary.center.x,
            boundary.center.y,
            boundary.radius,
            boundary.radius,
            startRad,
            endRad,
            false,
            0
        );
        const points = curve.getPoints(segments);
        if (points.length < 2) return null;

        // Arc 시작점에서 중심으로, 중심에서 끝점으로 연결하여 닫힌 부채꼴 형태
        shape.moveTo(boundary.center.x, boundary.center.y);
        shape.lineTo(points[0]!.x, points[0]!.y);
        for (let i = 1; i < points.length; i++) {
            shape.lineTo(points[i]!.x, points[i]!.y);
        }
        shape.closePath();
        return shape;
    }

    return null;
}

/**
 * HATCH 경계를 THREE.Path로 변환 (홀용)
 *
 * @param boundary - HATCH 경계 경로
 * @param segments - 곡선 세그먼트 수
 * @returns THREE.Path 또는 null
 */
function boundaryToPath(
    boundary: HatchBoundaryPath,
    segments: number = 32
): THREE.Path | null {
    if (
        boundary.type === 'polyline' &&
        boundary.vertices &&
        boundary.vertices.length >= 3
    ) {
        const path = new THREE.Path();
        path.moveTo(boundary.vertices[0]!.x, boundary.vertices[0]!.y);
        for (let i = 1; i < boundary.vertices.length; i++) {
            path.lineTo(boundary.vertices[i]!.x, boundary.vertices[i]!.y);
        }
        path.closePath();
        return path;
    } else if (
        boundary.type === 'circle' &&
        boundary.center &&
        boundary.radius > 0
    ) {
        const path = new THREE.Path();
        const curve = new THREE.EllipseCurve(
            boundary.center.x,
            boundary.center.y,
            boundary.radius,
            boundary.radius,
            0,
            Math.PI * 2,
            false,
            0
        );
        const points = curve.getPoints(segments);
        if (points.length < 3) return null;

        path.moveTo(points[0]!.x, points[0]!.y);
        for (let i = 1; i < points.length; i++) {
            path.lineTo(points[i]!.x, points[i]!.y);
        }
        path.closePath();
        return path;
    }

    return null;
}

// ============================================================
// 3D Extrusion
// ============================================================

/**
 * 단일 HATCH를 ExtrudeGeometry로 변환
 *
 * @param hatch - 파싱된 HATCH 엔티티
 * @param options - 돌출 옵션
 * @param segments - 곡선 세그먼트 수
 * @returns ExtrudeGeometry 또는 null (변환 실패 시)
 *
 * @example
 * const geometry = hatchToExtrudeGeometry(hatch, { depth: 10 });
 * if (geometry) {
 *   const mesh = new THREE.Mesh(geometry, material);
 * }
 */
export function hatchToExtrudeGeometry(
    hatch: ParsedHatch,
    options: ExtrudeOptions = DEFAULT_EXTRUDE_OPTIONS,
    segments: number = 32
): THREE.ExtrudeGeometry | null {
    if (hatch.boundaries.length === 0) {
        if (process.env.NODE_ENV === 'development') {
            console.warn('[hatch3DExtrude] Empty boundaries in HATCH');
        }
        return null;
    }

    // depth가 0이면 돌출하지 않음 (2D 유지)
    if (options.depth <= 0) {
        return null;
    }

    // 첫 번째 경계는 외곽
    const outerBoundary = hatch.boundaries[0]!;
    const shape = boundaryToShape(outerBoundary, segments);

    if (!shape) {
        if (process.env.NODE_ENV === 'development') {
            console.warn(
                '[hatch3DExtrude] Failed to convert boundary to shape:',
                outerBoundary.type
            );
        }
        return null;
    }

    // 나머지 경계는 홀(구멍)
    for (let i = 1; i < hatch.boundaries.length; i++) {
        const holeBoundary = hatch.boundaries[i]!;
        const holePath = boundaryToPath(holeBoundary, segments);
        if (holePath) {
            shape.holes.push(holePath);
        }
    }

    // LOD 기반 steps 계산
    const steps = getLOD3DSteps(options.depth);

    // ExtrudeGeometry 생성
    const extrudeSettings: THREE.ExtrudeGeometryOptions = {
        depth: options.depth,
        bevelEnabled: options.bevel ?? false,
        bevelSize: options.bevelSize ?? 0.1,
        bevelSegments: options.bevelSegments ?? 1,
        steps: steps,
    };

    try {
        const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
        geometry.computeBoundingSphere();
        geometry.computeVertexNormals();
        return geometry;
    } catch (error) {
        if (process.env.NODE_ENV === 'development') {
            console.error(
                '[hatch3DExtrude] ExtrudeGeometry creation failed:',
                error
            );
        }
        return null;
    }
}

/**
 * HATCH 배열을 3D 지오메트리 데이터로 변환
 *
 * @param hatches - HATCH 엔티티 배열
 * @param options - 돌출 옵션
 * @param layers - 레이어 정보 (색상/가시성용)
 * @param segments - 곡선 세그먼트 수
 * @returns 3D 지오메트리 데이터 배열
 */
export function hatchesToExtrude3DGeometries(
    hatches: ParsedHatch[],
    options: ExtrudeOptions = DEFAULT_EXTRUDE_OPTIONS,
    layers?: Record<string, LayerInfo>,
    segments: number = 32
): Hatch3DGeometryData[] {
    const results: Hatch3DGeometryData[] = [];

    for (let idx = 0; idx < hatches.length; idx++) {
        const hatch = hatches[idx]!;

        // 레이어 가시성 체크
        const layerName = hatch.layer ?? '0';
        const layerInfo = layers?.[layerName];
        const visible = layerInfo?.visible ?? true;

        // 지오메트리 생성
        const geometry = hatchToExtrudeGeometry(hatch, options, segments);
        if (!geometry) continue;

        // 색상 결정 (레이어 색상 > HATCH 색상 > 기본 색상)
        let color = DEFAULT_LAYER_COLOR;
        if (layerInfo?.color) {
            color = layerInfo.color;
        } else if (hatch.color !== undefined && DXF_COLOR_MAP[hatch.color]) {
            color = DXF_COLOR_MAP[hatch.color]!;
        }

        // Z 위치 계산
        let zPosition = 0;
        const outerBoundary = hatch.boundaries[0];
        if (outerBoundary) {
            if (
                outerBoundary.type === 'polyline' &&
                outerBoundary.vertices[0]
            ) {
                zPosition = outerBoundary.vertices[0].z;
            } else if (
                outerBoundary.type === 'circle' ||
                outerBoundary.type === 'arc' ||
                outerBoundary.type === 'ellipse'
            ) {
                zPosition = outerBoundary.center.z;
            }
        }

        results.push({
            key: `hatch-3d-${idx}`,
            geometry,
            layer: layerName,
            color,
            originalHatch: hatch,
            zPosition,
            visible,
        });
    }

    return results;
}

/**
 * 레이어별로 HATCH 3D 지오메트리 머징
 *
 * 동일 레이어의 지오메트리를 하나로 합쳐 렌더링 성능 최적화
 *
 * @param geometryDataList - 3D 지오메트리 데이터 배열
 * @returns 레이어별 머지된 지오메트리 맵
 */
export function mergeHatch3DGeometriesByLayer(
    geometryDataList: Hatch3DGeometryData[]
): Map<
    string,
    { geometry: THREE.BufferGeometry; color: string; visible: boolean }
> {
    const layerGeometries = new Map<
        string,
        { geometries: THREE.ExtrudeGeometry[]; color: string; visible: boolean }
    >();

    // 레이어별로 그룹화
    for (const data of geometryDataList) {
        const existing = layerGeometries.get(data.layer);
        if (existing) {
            existing.geometries.push(data.geometry);
        } else {
            layerGeometries.set(data.layer, {
                geometries: [data.geometry],
                color: data.color,
                visible: data.visible,
            });
        }
    }

    // 머지 실행
    const mergedMap = new Map<
        string,
        { geometry: THREE.BufferGeometry; color: string; visible: boolean }
    >();

    for (const [layer, { geometries, color, visible }] of layerGeometries) {
        if (geometries.length === 0) continue;

        if (geometries.length === 1) {
            mergedMap.set(layer, {
                geometry: geometries[0]!,
                color,
                visible,
            });
        } else {
            const merged = mergeGeometries(geometries);
            if (merged) {
                merged.computeBoundingSphere();
                merged.computeVertexNormals();
                mergedMap.set(layer, { geometry: merged, color, visible });

                // 개별 지오메트리 메모리 해제
                geometries.forEach((g) => g.dispose());
            }
        }
    }

    return mergedMap;
}

/**
 * 3D 지오메트리 데이터 배열 메모리 해제
 *
 * @param dataList - 해제할 지오메트리 데이터 배열
 */
export function disposeHatch3DGeometries(
    dataList: Hatch3DGeometryData[]
): void {
    for (const data of dataList) {
        data.geometry.dispose();
    }
}

/**
 * HATCH 경계가 유효한지 검증
 *
 * @param hatch - 검증할 HATCH
 * @returns 유효 여부
 */
export function isValidHatchForExtrusion(hatch: ParsedHatch): boolean {
    if (!hatch.boundaries || hatch.boundaries.length === 0) {
        return false;
    }

    const outerBoundary = hatch.boundaries[0]!;

    if (outerBoundary.type === 'polyline') {
        return (
            outerBoundary.vertices !== undefined &&
            outerBoundary.vertices.length >= 3
        );
    } else if (outerBoundary.type === 'circle') {
        return outerBoundary.center !== undefined && outerBoundary.radius > 0;
    } else if (outerBoundary.type === 'ellipse') {
        return (
            outerBoundary.center !== undefined &&
            outerBoundary.axisRatio > 0 &&
            outerBoundary.axisRatio <= 1
        );
    } else if (outerBoundary.type === 'arc') {
        return outerBoundary.center !== undefined && outerBoundary.radius > 0;
    }

    return false;
}
