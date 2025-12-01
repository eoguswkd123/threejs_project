/**
 * CAD Viewer - DXF to Three.js Geometry Converter
 * DXF 엔티티를 Three.js BufferGeometry로 변환
 */

import * as THREE from 'three';
import type {
    ParsedLine,
    ParsedCircle,
    ParsedArc,
    ParsedPolyline,
    ParsedCADData,
    BoundingBox,
    Point3D,
} from '../types';
import { DEFAULT_BOUNDS, getLODSegments } from '../constants';

/**
 * LINE 엔티티 배열을 Three.js BufferGeometry로 변환
 * LineSegments에서 사용할 수 있는 형태로 변환
 */
export function linesToGeometry(lines: ParsedLine[]): THREE.BufferGeometry {
    if (lines.length === 0) {
        return new THREE.BufferGeometry();
    }

    // 각 LINE은 2개의 정점 (start, end)
    const vertices: number[] = [];

    for (const line of lines) {
        // Start point
        vertices.push(line.start.x, line.start.y, line.start.z);
        // End point
        vertices.push(line.end.x, line.end.y, line.end.z);
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
        'position',
        new THREE.Float32BufferAttribute(vertices, 3)
    );

    // 바운딩 스피어 계산 (카메라 조정에 유용)
    geometry.computeBoundingSphere();

    return geometry;
}

/**
 * CIRCLE 엔티티 배열을 Three.js BufferGeometry로 변환
 */
export function circlesToGeometry(
    circles: ParsedCircle[],
    segments: number = 64
): THREE.BufferGeometry {
    if (circles.length === 0) {
        return new THREE.BufferGeometry();
    }

    const vertices: number[] = [];

    for (const circle of circles) {
        // EllipseCurve를 사용하여 원을 그림
        const curve = new THREE.EllipseCurve(
            circle.center.x,
            circle.center.y,
            circle.radius,
            circle.radius,
            0,
            Math.PI * 2,
            false,
            0
        );

        const points = curve.getPoints(segments);

        // 점들을 라인 세그먼트로 연결
        for (let i = 0; i < points.length - 1; i++) {
            const p1 = points[i]!;
            const p2 = points[i + 1]!;
            vertices.push(p1.x, p1.y, circle.center.z);
            vertices.push(p2.x, p2.y, circle.center.z);
        }
        // 마지막 점과 첫 점 연결 (원 닫기)
        const lastPt = points[points.length - 1]!;
        const firstPt = points[0]!;
        vertices.push(lastPt.x, lastPt.y, circle.center.z);
        vertices.push(firstPt.x, firstPt.y, circle.center.z);
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
        'position',
        new THREE.Float32BufferAttribute(vertices, 3)
    );
    geometry.computeBoundingSphere();

    return geometry;
}

/**
 * ARC 엔티티 배열을 Three.js BufferGeometry로 변환
 */
export function arcsToGeometry(
    arcs: ParsedArc[],
    segments: number = 32
): THREE.BufferGeometry {
    if (arcs.length === 0) {
        return new THREE.BufferGeometry();
    }

    const vertices: number[] = [];

    for (const arc of arcs) {
        // DXF는 degree, Three.js는 radian
        const startRad = (arc.startAngle * Math.PI) / 180;
        let endRad = (arc.endAngle * Math.PI) / 180;

        // DXF ARC는 반시계 방향, endAngle이 startAngle보다 작으면 360도 추가
        if (endRad < startRad) {
            endRad += Math.PI * 2;
        }

        const curve = new THREE.EllipseCurve(
            arc.center.x,
            arc.center.y,
            arc.radius,
            arc.radius,
            startRad,
            endRad,
            false,
            0
        );

        const points = curve.getPoints(segments);

        // 점들을 라인 세그먼트로 연결
        for (let i = 0; i < points.length - 1; i++) {
            const p1 = points[i]!;
            const p2 = points[i + 1]!;
            vertices.push(p1.x, p1.y, arc.center.z);
            vertices.push(p2.x, p2.y, arc.center.z);
        }
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
        'position',
        new THREE.Float32BufferAttribute(vertices, 3)
    );
    geometry.computeBoundingSphere();

    return geometry;
}

/**
 * POLYLINE 엔티티 배열을 Three.js BufferGeometry로 변환
 */
export function polylinesToGeometry(
    polylines: ParsedPolyline[]
): THREE.BufferGeometry {
    if (polylines.length === 0) {
        return new THREE.BufferGeometry();
    }

    const vertices: number[] = [];

    for (const polyline of polylines) {
        if (polyline.vertices.length < 2) continue;

        // 정점들을 라인 세그먼트로 연결
        for (let i = 0; i < polyline.vertices.length - 1; i++) {
            const v1 = polyline.vertices[i]!;
            const v2 = polyline.vertices[i + 1]!;
            vertices.push(v1.x, v1.y, v1.z);
            vertices.push(v2.x, v2.y, v2.z);
        }

        // 닫힌 폴리라인이면 마지막 점과 첫 점 연결
        if (polyline.closed && polyline.vertices.length > 2) {
            const first = polyline.vertices[0]!;
            const last = polyline.vertices[polyline.vertices.length - 1]!;
            vertices.push(last.x, last.y, last.z);
            vertices.push(first.x, first.y, first.z);
        }
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
        'position',
        new THREE.Float32BufferAttribute(vertices, 3)
    );
    geometry.computeBoundingSphere();

    return geometry;
}

/**
 * ParsedCADData를 Three.js BufferGeometry로 변환 (모든 엔티티 통합)
 * LOD 지원: 엔티티 수에 따라 자동으로 세그먼트 수 조절
 * @param data 파싱된 CAD 데이터
 * @param segmentsOverride 세그먼트 수 직접 지정 (옵션)
 */
export function cadDataToGeometry(
    data: ParsedCADData,
    segmentsOverride?: number
): THREE.BufferGeometry {
    const geometries: THREE.BufferGeometry[] = [];

    // LOD: 엔티티 수에 따른 세그먼트 수 결정
    const totalEntities =
        data.lines.length +
        data.circles.length +
        data.arcs.length +
        data.polylines.length;
    const segments = segmentsOverride ?? getLODSegments(totalEntities);

    // LINE 지오메트리
    if (data.lines.length > 0) {
        geometries.push(linesToGeometry(data.lines));
    }

    // CIRCLE 지오메트리 (LOD 적용)
    if (data.circles.length > 0) {
        geometries.push(circlesToGeometry(data.circles, segments));
    }

    // ARC 지오메트리 (LOD 적용)
    if (data.arcs.length > 0) {
        geometries.push(arcsToGeometry(data.arcs, segments));
    }

    // POLYLINE 지오메트리
    if (data.polylines.length > 0) {
        geometries.push(polylinesToGeometry(data.polylines));
    }

    // 지오메트리가 없으면 빈 지오메트리 반환
    if (geometries.length === 0) {
        return new THREE.BufferGeometry();
    }

    // 모든 지오메트리를 하나로 병합
    const mergedGeometry = mergeBufferGeometries(geometries);
    mergedGeometry.computeBoundingSphere();

    // 메모리 효율: 개별 지오메트리 정리
    for (const geom of geometries) {
        if (geom !== mergedGeometry) {
            geom.dispose();
        }
    }

    return mergedGeometry;
}

/**
 * 여러 BufferGeometry를 하나로 병합
 */
function mergeBufferGeometries(
    geometries: THREE.BufferGeometry[]
): THREE.BufferGeometry {
    if (geometries.length === 0) {
        return new THREE.BufferGeometry();
    }

    if (geometries.length === 1) {
        return geometries[0]!;
    }

    // 모든 정점을 모음
    const allVertices: number[] = [];

    for (const geometry of geometries) {
        const positions = geometry.getAttribute('position');
        if (positions) {
            for (let i = 0; i < positions.count; i++) {
                allVertices.push(
                    positions.getX(i),
                    positions.getY(i),
                    positions.getZ(i)
                );
            }
        }
    }

    const merged = new THREE.BufferGeometry();
    merged.setAttribute(
        'position',
        new THREE.Float32BufferAttribute(allVertices, 3)
    );

    return merged;
}

/**
 * CAD 데이터에서 바운딩 박스 계산 (모든 엔티티 타입 포함)
 */
export function calculateBounds(
    lines: ParsedLine[],
    circles?: ParsedCircle[],
    arcs?: ParsedArc[],
    polylines?: ParsedPolyline[]
): BoundingBox {
    let minX = Infinity;
    let minY = Infinity;
    let minZ = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    let maxZ = -Infinity;

    // LINE 엔티티
    for (const line of lines) {
        minX = Math.min(minX, line.start.x, line.end.x);
        minY = Math.min(minY, line.start.y, line.end.y);
        minZ = Math.min(minZ, line.start.z, line.end.z);
        maxX = Math.max(maxX, line.start.x, line.end.x);
        maxY = Math.max(maxY, line.start.y, line.end.y);
        maxZ = Math.max(maxZ, line.start.z, line.end.z);
    }

    // CIRCLE 엔티티
    if (circles) {
        for (const circle of circles) {
            minX = Math.min(minX, circle.center.x - circle.radius);
            minY = Math.min(minY, circle.center.y - circle.radius);
            minZ = Math.min(minZ, circle.center.z);
            maxX = Math.max(maxX, circle.center.x + circle.radius);
            maxY = Math.max(maxY, circle.center.y + circle.radius);
            maxZ = Math.max(maxZ, circle.center.z);
        }
    }

    // ARC 엔티티
    if (arcs) {
        for (const arc of arcs) {
            minX = Math.min(minX, arc.center.x - arc.radius);
            minY = Math.min(minY, arc.center.y - arc.radius);
            minZ = Math.min(minZ, arc.center.z);
            maxX = Math.max(maxX, arc.center.x + arc.radius);
            maxY = Math.max(maxY, arc.center.y + arc.radius);
            maxZ = Math.max(maxZ, arc.center.z);
        }
    }

    // POLYLINE 엔티티
    if (polylines) {
        for (const polyline of polylines) {
            for (const vertex of polyline.vertices) {
                minX = Math.min(minX, vertex.x);
                minY = Math.min(minY, vertex.y);
                minZ = Math.min(minZ, vertex.z);
                maxX = Math.max(maxX, vertex.x);
                maxY = Math.max(maxY, vertex.y);
                maxZ = Math.max(maxZ, vertex.z);
            }
        }
    }

    // 엔티티가 없으면 기본 바운딩 박스 반환
    if (minX === Infinity) {
        return DEFAULT_BOUNDS;
    }

    return {
        min: { x: minX, y: minY, z: minZ },
        max: { x: maxX, y: maxY, z: maxZ },
    };
}

/**
 * 바운딩 박스의 중심점 계산
 */
export function getBoundsCenter(bounds: BoundingBox): Point3D {
    return {
        x: (bounds.min.x + bounds.max.x) / 2,
        y: (bounds.min.y + bounds.max.y) / 2,
        z: (bounds.min.z + bounds.max.z) / 2,
    };
}

/**
 * 바운딩 박스의 크기 계산
 */
export function getBoundsSize(bounds: BoundingBox): Point3D {
    return {
        x: bounds.max.x - bounds.min.x,
        y: bounds.max.y - bounds.min.y,
        z: bounds.max.z - bounds.min.z,
    };
}

/**
 * 바운딩 박스를 기준으로 카메라 거리 계산
 */
export function calculateCameraDistance(
    bounds: BoundingBox,
    fov: number = 45
): number {
    const size = getBoundsSize(bounds);
    const maxDimension = Math.max(size.x, size.y, size.z);

    // FOV를 라디안으로 변환하고 카메라 거리 계산
    const fovRad = (fov * Math.PI) / 180;
    const distance = maxDimension / 2 / Math.tan(fovRad / 2);

    // 약간의 여유 공간 추가
    return distance * 1.5;
}

/**
 * 지오메트리를 원점 중심으로 이동
 */
export function centerGeometry(geometry: THREE.BufferGeometry): void {
    geometry.computeBoundingBox();
    if (geometry.boundingBox) {
        const center = new THREE.Vector3();
        geometry.boundingBox.getCenter(center);
        geometry.translate(-center.x, -center.y, -center.z);
    }
}
