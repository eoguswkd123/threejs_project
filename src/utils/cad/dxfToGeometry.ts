/**
 * CAD Viewer - DXF to Three.js Geometry Converter
 * DXF 엔티티를 Three.js BufferGeometry로 변환
 *
 * 메모리 최적화: 인덱스 버퍼를 사용하여 정점 중복 제거
 * - 원/호: ~49% 메모리 절감
 * - 폴리라인: ~44% 메모리 절감
 * - 전체 평균: ~33% 메모리 절감
 */

import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

import {
    DEFAULT_BOUNDS,
    getLODSegments,
    HATCH_CONFIG,
    TEXTURE_CACHE_CONFIG,
} from '@/constants/cad';
import type {
    ParsedLine,
    ParsedCircle,
    ParsedArc,
    ParsedPolyline,
    ParsedHatch,
    ParsedEllipse,
    ParsedSpline,
    HatchBoundaryPath,
    ParsedCADData,
    BoundingBox,
    Point3D,
} from '@/types/cad';

import {
    getPatternTextureCache,
    resetPatternTextureCache,
} from './TextureCacheManager';

// ============================================================
// 인덱스 버퍼 유틸리티 (메모리 최적화)
// ============================================================

/**
 * 정점 맵 인터페이스
 * 정점 중복 제거를 위한 자료구조
 */
interface VertexMap {
    /** 고유 정점 좌표 배열 [x1, y1, z1, x2, y2, z2, ...] */
    positions: number[];
    /** 정점 인덱스 배열 */
    indices: number[];
    /** 좌표 → 인덱스 매핑 */
    map: Map<string, number>;
}

/**
 * 새 정점 맵 생성
 */
function createVertexMap(): VertexMap {
    return { positions: [], indices: [], map: new Map() };
}

/**
 * 정점 추가 (중복 검사)
 * @returns 해당 정점의 인덱스
 */
function addVertex(vm: VertexMap, x: number, y: number, z: number): number {
    // 소수점 6자리로 정규화하여 부동소수점 오차 방지
    const key = `${x.toFixed(6)},${y.toFixed(6)},${z.toFixed(6)}`;

    let index = vm.map.get(key);
    if (index === undefined) {
        index = vm.positions.length / 3;
        vm.positions.push(x, y, z);
        vm.map.set(key, index);
    }
    return index;
}

/**
 * 엣지(라인 세그먼트) 추가
 * 두 정점을 인덱스로 연결
 */
function addEdge(
    vm: VertexMap,
    x1: number,
    y1: number,
    z1: number,
    x2: number,
    y2: number,
    z2: number
): void {
    vm.indices.push(addVertex(vm, x1, y1, z1));
    vm.indices.push(addVertex(vm, x2, y2, z2));
}

/**
 * 정점 맵을 BufferGeometry로 변환
 */
function vertexMapToGeometry(vm: VertexMap): THREE.BufferGeometry {
    const geometry = new THREE.BufferGeometry();

    geometry.setAttribute(
        'position',
        new THREE.Float32BufferAttribute(vm.positions, 3)
    );
    geometry.setIndex(vm.indices);
    geometry.computeBoundingSphere();

    return geometry;
}

/**
 * LINE 엔티티 배열을 Three.js BufferGeometry로 변환
 * LineSegments에서 사용할 수 있는 형태로 변환
 * 인덱스 버퍼를 사용하여 정점 중복 제거
 */
export function linesToGeometry(lines: ParsedLine[]): THREE.BufferGeometry {
    if (lines.length === 0) {
        return new THREE.BufferGeometry();
    }

    const vm = createVertexMap();

    for (const line of lines) {
        addEdge(
            vm,
            line.start.x,
            line.start.y,
            line.start.z,
            line.end.x,
            line.end.y,
            line.end.z
        );
    }

    return vertexMapToGeometry(vm);
}

/**
 * CIRCLE 엔티티 배열을 Three.js BufferGeometry로 변환
 * 인덱스 버퍼를 사용하여 정점 중복 제거 (~49% 메모리 절감)
 */
export function circlesToGeometry(
    circles: ParsedCircle[],
    segments: number = 64
): THREE.BufferGeometry {
    if (circles.length === 0) {
        return new THREE.BufferGeometry();
    }

    const vm = createVertexMap();

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
        const z = circle.center.z;

        // 점들을 라인 세그먼트로 연결
        for (let i = 0; i < points.length - 1; i++) {
            const p1 = points[i]!;
            const p2 = points[i + 1]!;
            addEdge(vm, p1.x, p1.y, z, p2.x, p2.y, z);
        }
        // 마지막 점과 첫 점 연결 (원 닫기)
        const lastPt = points[points.length - 1]!;
        const firstPt = points[0]!;
        addEdge(vm, lastPt.x, lastPt.y, z, firstPt.x, firstPt.y, z);
    }

    return vertexMapToGeometry(vm);
}

/**
 * ARC 엔티티 배열을 Three.js BufferGeometry로 변환
 * 인덱스 버퍼를 사용하여 정점 중복 제거 (~49% 메모리 절감)
 */
export function arcsToGeometry(
    arcs: ParsedArc[],
    segments: number = 32
): THREE.BufferGeometry {
    if (arcs.length === 0) {
        return new THREE.BufferGeometry();
    }

    const vm = createVertexMap();

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
        const z = arc.center.z;

        // 점들을 라인 세그먼트로 연결
        for (let i = 0; i < points.length - 1; i++) {
            const p1 = points[i]!;
            const p2 = points[i + 1]!;
            addEdge(vm, p1.x, p1.y, z, p2.x, p2.y, z);
        }
    }

    return vertexMapToGeometry(vm);
}

/**
 * POLYLINE 엔티티 배열을 Three.js BufferGeometry로 변환
 * 인덱스 버퍼를 사용하여 정점 중복 제거 (~44% 메모리 절감)
 */
export function polylinesToGeometry(
    polylines: ParsedPolyline[]
): THREE.BufferGeometry {
    if (polylines.length === 0) {
        return new THREE.BufferGeometry();
    }

    const vm = createVertexMap();

    for (const polyline of polylines) {
        if (polyline.vertices.length < 2) continue;

        // 정점들을 라인 세그먼트로 연결
        for (let i = 0; i < polyline.vertices.length - 1; i++) {
            const v1 = polyline.vertices[i]!;
            const v2 = polyline.vertices[i + 1]!;
            addEdge(vm, v1.x, v1.y, v1.z, v2.x, v2.y, v2.z);
        }

        // 닫힌 폴리라인이면 마지막 점과 첫 점 연결
        if (polyline.closed && polyline.vertices.length > 2) {
            const first = polyline.vertices[0]!;
            const last = polyline.vertices[polyline.vertices.length - 1]!;
            addEdge(vm, last.x, last.y, last.z, first.x, first.y, first.z);
        }
    }

    return vertexMapToGeometry(vm);
}

/**
 * HATCH 경계를 와이어프레임 지오메트리로 변환
 */
export function hatchBoundariesToWireframe(
    hatches: ParsedHatch[],
    segments: number = 32
): THREE.BufferGeometry {
    if (hatches.length === 0) {
        return new THREE.BufferGeometry();
    }

    const vertices: number[] = [];

    for (const hatch of hatches) {
        for (const boundary of hatch.boundaries) {
            if (boundary.type === 'polyline' && boundary.vertices) {
                // 폴리라인 경계
                for (let i = 0; i < boundary.vertices.length - 1; i++) {
                    const v1 = boundary.vertices[i]!;
                    const v2 = boundary.vertices[i + 1]!;
                    vertices.push(v1.x, v1.y, v1.z);
                    vertices.push(v2.x, v2.y, v2.z);
                }
                // 닫힌 경계
                if (boundary.closed !== false && boundary.vertices.length > 2) {
                    const first = boundary.vertices[0]!;
                    const last =
                        boundary.vertices[boundary.vertices.length - 1]!;
                    vertices.push(last.x, last.y, last.z);
                    vertices.push(first.x, first.y, first.z);
                }
            } else if (
                boundary.type === 'circle' &&
                boundary.center &&
                boundary.radius
            ) {
                // 원형 경계
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
                for (let i = 0; i < points.length - 1; i++) {
                    vertices.push(
                        points[i]!.x,
                        points[i]!.y,
                        boundary.center.z
                    );
                    vertices.push(
                        points[i + 1]!.x,
                        points[i + 1]!.y,
                        boundary.center.z
                    );
                }
                vertices.push(
                    points[points.length - 1]!.x,
                    points[points.length - 1]!.y,
                    boundary.center.z
                );
                vertices.push(points[0]!.x, points[0]!.y, boundary.center.z);
            } else if (
                boundary.type === 'arc' &&
                boundary.center &&
                boundary.radius
            ) {
                // 호형 경계
                const startRad = ((boundary.startAngle ?? 0) * Math.PI) / 180;
                let endRad = ((boundary.endAngle ?? 360) * Math.PI) / 180;
                if (endRad < startRad) endRad += Math.PI * 2;

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
                for (let i = 0; i < points.length - 1; i++) {
                    vertices.push(
                        points[i]!.x,
                        points[i]!.y,
                        boundary.center.z
                    );
                    vertices.push(
                        points[i + 1]!.x,
                        points[i + 1]!.y,
                        boundary.center.z
                    );
                }
            }
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
 * HATCH 경계 경로를 THREE.Shape으로 변환
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
        boundary.radius
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
        shape.moveTo(points[0]!.x, points[0]!.y);
        for (let i = 1; i < points.length; i++) {
            shape.lineTo(points[i]!.x, points[i]!.y);
        }
        shape.closePath();
        return shape;
    }
    return null;
}

/**
 * HATCH 엔티티에서 개별 솔리드 지오메트리 생성
 * @returns 각 HATCH에 대한 지오메트리와 메타데이터 배열
 */
export interface HatchGeometryData {
    geometry: THREE.ShapeGeometry;
    hatch: ParsedHatch;
    zPosition: number;
}

export function hatchesToSolidGeometries(
    hatches: ParsedHatch[],
    segments: number = 32
): HatchGeometryData[] {
    const results: HatchGeometryData[] = [];

    for (const hatch of hatches) {
        if (hatch.boundaries.length === 0) continue;

        // 첫 번째 경계는 외곽
        const outerBoundary = hatch.boundaries[0]!;
        const shape = boundaryToShape(outerBoundary, segments);

        if (!shape) continue;

        // 나머지 경계는 홀(구멍)
        for (let i = 1; i < hatch.boundaries.length; i++) {
            const holeBoundary = hatch.boundaries[i]!;
            if (
                holeBoundary.type === 'polyline' &&
                holeBoundary.vertices &&
                holeBoundary.vertices.length >= 3
            ) {
                const hole = new THREE.Path();
                hole.moveTo(
                    holeBoundary.vertices[0]!.x,
                    holeBoundary.vertices[0]!.y
                );
                for (let j = 1; j < holeBoundary.vertices.length; j++) {
                    hole.lineTo(
                        holeBoundary.vertices[j]!.x,
                        holeBoundary.vertices[j]!.y
                    );
                }
                hole.closePath();
                shape.holes.push(hole);
            }
        }

        const geometry = new THREE.ShapeGeometry(shape);

        // Z 위치 계산 (첫 번째 정점 기준)
        let zPos = 0;
        if (outerBoundary.type === 'polyline' && outerBoundary.vertices[0]) {
            zPos = outerBoundary.vertices[0].z;
        } else if (
            outerBoundary.type === 'circle' ||
            outerBoundary.type === 'arc' ||
            outerBoundary.type === 'ellipse'
        ) {
            zPos = outerBoundary.center.z;
        }

        results.push({
            geometry,
            hatch,
            zPosition: zPos + HATCH_CONFIG.zOffset,
        });
    }

    return results;
}

/**
 * 패턴 텍스처 캐시 키 생성
 */
function getPatternCacheKey(
    angle: number,
    scale: number,
    color: string
): string {
    return `${angle.toFixed(2)}_${scale.toFixed(4)}_${color}`;
}

/**
 * 패턴 텍스처 내부 생성 함수
 */
function createPatternTextureInternal(
    hatch: ParsedHatch,
    color: string
): THREE.CanvasTexture {
    const size = HATCH_CONFIG.patternTextureSize;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
        // 캔버스 컨텍스트 생성 실패 시 빈 텍스처 반환
        return new THREE.CanvasTexture(canvas);
    }

    // 투명 배경
    ctx.clearRect(0, 0, size, size);

    // 패턴 라인 그리기
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;

    const angleRad = (hatch.patternAngle * Math.PI) / 180;
    const spacing = Math.max(
        8,
        HATCH_CONFIG.defaultPatternSpacing / hatch.patternScale
    );

    ctx.save();
    ctx.translate(size / 2, size / 2);
    ctx.rotate(angleRad);
    ctx.translate(-size / 2, -size / 2);

    // 대각선 패턴 (ANSI31 스타일)
    ctx.beginPath();
    for (let i = -size * 2; i < size * 2; i += spacing) {
        ctx.moveTo(i, 0);
        ctx.lineTo(i + size, size);
    }
    ctx.stroke();

    ctx.restore();

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(0.01 * hatch.patternScale, 0.01 * hatch.patternScale);

    return texture;
}

/**
 * HATCH 패턴 텍스처 생성 (LRU 캐시 적용)
 * - 동일 패턴 파라미터에 대해 캐시된 텍스처 반환
 * - 캐시 미스 시 새로 생성하고 캐시에 저장
 * - LRU 기반 자동 eviction (수동 cleanup 불필요)
 *
 * @see {@link getPatternTextureCache} LRU 캐시 구현
 */
export function createPatternTexture(
    hatch: ParsedHatch,
    color: string = HATCH_CONFIG.defaultColor
): THREE.CanvasTexture {
    const cacheKey = getPatternCacheKey(
        hatch.patternAngle,
        hatch.patternScale,
        color
    );

    // LRU 캐시 조회 (히트 시 MRU로 이동)
    const cache = getPatternTextureCache(TEXTURE_CACHE_CONFIG);
    const cached = cache.get(cacheKey);
    if (cached) {
        return cached as THREE.CanvasTexture;
    }

    // 캐시 미스 - 새 텍스처 생성
    const texture = createPatternTextureInternal(hatch, color);

    // LRU 캐시에 저장 (용량 초과 시 자동 eviction)
    const textureMemory =
        HATCH_CONFIG.patternTextureSize * HATCH_CONFIG.patternTextureSize * 4; // RGBA
    cache.set(cacheKey, texture, textureMemory);

    return texture;
}

/**
 * 패턴 텍스처 캐시 클리어
 * - LRU 캐시 기반 자동 관리로 일반적으로 호출 불필요
 * - 강제 초기화가 필요한 경우에만 사용 (예: 테스트, 메모리 긴급 해제)
 *
 * @deprecated LRU 캐시 자동 관리로 수동 호출 불필요
 */
export function clearPatternTextureCache(): void {
    resetPatternTextureCache();
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
        data.polylines.length +
        data.ellipses.length +
        data.splines.length;
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

    // Phase 2.1.4: ELLIPSE 지오메트리 (LOD 적용)
    if (data.ellipses.length > 0) {
        geometries.push(ellipsesToGeometry(data.ellipses, segments));
    }

    // Phase 2.1.4: SPLINE 지오메트리 (LOD 적용)
    if (data.splines.length > 0) {
        geometries.push(splinesToGeometry(data.splines, segments));
    }

    // 지오메트리가 없으면 빈 지오메트리 반환
    if (geometries.length === 0) {
        return new THREE.BufferGeometry();
    }

    // 모든 지오메트리를 하나로 병합 (Three.js 공식 유틸리티 사용)
    const mergedGeometry =
        mergeGeometries(geometries) ?? new THREE.BufferGeometry();
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
 * CAD 데이터에서 바운딩 박스 계산 (모든 엔티티 타입 포함)
 */
export function calculateBounds(
    lines: ParsedLine[],
    circles?: ParsedCircle[],
    arcs?: ParsedArc[],
    polylines?: ParsedPolyline[],
    hatches?: ParsedHatch[]
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

    // HATCH 엔티티
    if (hatches) {
        for (const hatch of hatches) {
            for (const boundary of hatch.boundaries) {
                if (boundary.type === 'polyline') {
                    for (const vertex of boundary.vertices) {
                        minX = Math.min(minX, vertex.x);
                        minY = Math.min(minY, vertex.y);
                        minZ = Math.min(minZ, vertex.z);
                        maxX = Math.max(maxX, vertex.x);
                        maxY = Math.max(maxY, vertex.y);
                        maxZ = Math.max(maxZ, vertex.z);
                    }
                } else if (
                    boundary.type === 'circle' ||
                    boundary.type === 'arc'
                ) {
                    minX = Math.min(minX, boundary.center.x - boundary.radius);
                    minY = Math.min(minY, boundary.center.y - boundary.radius);
                    minZ = Math.min(minZ, boundary.center.z);
                    maxX = Math.max(maxX, boundary.center.x + boundary.radius);
                    maxY = Math.max(maxY, boundary.center.y + boundary.radius);
                    maxZ = Math.max(maxZ, boundary.center.z);
                } else if (boundary.type === 'ellipse') {
                    // ellipse: 장축 길이로 대략적인 바운딩 계산
                    const majorLength = Math.sqrt(
                        boundary.majorAxisEndPoint.x ** 2 +
                            boundary.majorAxisEndPoint.y ** 2
                    );
                    minX = Math.min(minX, boundary.center.x - majorLength);
                    minY = Math.min(minY, boundary.center.y - majorLength);
                    minZ = Math.min(minZ, boundary.center.z);
                    maxX = Math.max(maxX, boundary.center.x + majorLength);
                    maxY = Math.max(maxY, boundary.center.y + majorLength);
                    maxZ = Math.max(maxZ, boundary.center.z);
                }
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
 * 바운딩 박스의 크기 계산 (내부 사용)
 */
function getBoundsSize(bounds: BoundingBox): Point3D {
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

// ============================================================
// Phase 2.1.4: 추가 엔티티 지오메트리 변환
// ============================================================

/**
 * ELLIPSE 엔티티 배열을 Three.js BufferGeometry로 변환
 * DXF 타원은 중심, 장축 끝점(상대 좌표), 단축/장축 비율로 정의
 *
 * @param ellipses 파싱된 ELLIPSE 배열
 * @param segments 곡선 세그먼트 수 (기본값: 64)
 */
export function ellipsesToGeometry(
    ellipses: ParsedEllipse[],
    segments: number = 64
): THREE.BufferGeometry {
    if (ellipses.length === 0) {
        return new THREE.BufferGeometry();
    }

    const vm = createVertexMap();

    for (const ellipse of ellipses) {
        // 장축 길이 및 회전 각도 계산
        const majorLength = Math.sqrt(
            ellipse.majorAxisEnd.x ** 2 + ellipse.majorAxisEnd.y ** 2
        );
        const minorLength = majorLength * ellipse.minorAxisRatio;
        const rotation = Math.atan2(
            ellipse.majorAxisEnd.y,
            ellipse.majorAxisEnd.x
        );

        // 전체 타원인지 부분 호인지 확인
        const isFullEllipse =
            Math.abs(ellipse.endParam - ellipse.startParam - Math.PI * 2) <
            0.001;

        // EllipseCurve 생성
        const curve = new THREE.EllipseCurve(
            0, // 중심에서 시작 (나중에 변환)
            0,
            majorLength,
            minorLength,
            ellipse.startParam,
            ellipse.endParam,
            false,
            rotation
        );

        const points = curve.getPoints(segments);
        const z = ellipse.center.z;
        const cx = ellipse.center.x;
        const cy = ellipse.center.y;

        // 점들을 중심 기준으로 변환하여 라인 세그먼트로 연결
        for (let i = 0; i < points.length - 1; i++) {
            const p1 = points[i]!;
            const p2 = points[i + 1]!;
            addEdge(vm, p1.x + cx, p1.y + cy, z, p2.x + cx, p2.y + cy, z);
        }

        // 전체 타원이면 마지막 점과 첫 점 연결
        if (isFullEllipse && points.length > 1) {
            const lastPt = points[points.length - 1]!;
            const firstPt = points[0]!;
            addEdge(
                vm,
                lastPt.x + cx,
                lastPt.y + cy,
                z,
                firstPt.x + cx,
                firstPt.y + cy,
                z
            );
        }
    }

    return vertexMapToGeometry(vm);
}

/**
 * SPLINE 엔티티 배열을 Three.js BufferGeometry로 변환
 * CatmullRomCurve3을 사용하여 부드러운 곡선 생성
 *
 * @param splines 파싱된 SPLINE 배열
 * @param segments 곡선 세그먼트 수 (기본값: 50)
 */
export function splinesToGeometry(
    splines: ParsedSpline[],
    segments: number = 50
): THREE.BufferGeometry {
    if (splines.length === 0) {
        return new THREE.BufferGeometry();
    }

    const vm = createVertexMap();

    for (const spline of splines) {
        if (spline.controlPoints.length < 2) continue;

        // 제어점을 THREE.Vector3로 변환
        const controlVectors = spline.controlPoints.map(
            (p) => new THREE.Vector3(p.x, p.y, p.z)
        );

        // CatmullRomCurve3으로 부드러운 곡선 생성
        // centripetal 타입이 일반적으로 가장 자연스러운 결과 제공
        const curve = new THREE.CatmullRomCurve3(
            controlVectors,
            spline.closed,
            'centripetal',
            0.5
        );

        // 세그먼트 수는 제어점 수에 비례하여 조절
        const adaptiveSegments = Math.max(
            segments,
            spline.controlPoints.length * 10
        );
        const points = curve.getPoints(adaptiveSegments);

        // 점들을 라인 세그먼트로 연결
        for (let i = 0; i < points.length - 1; i++) {
            const p1 = points[i]!;
            const p2 = points[i + 1]!;
            addEdge(vm, p1.x, p1.y, p1.z, p2.x, p2.y, p2.z);
        }
    }

    return vertexMapToGeometry(vm);
}
