/**
 * dxfToGeometry.test.ts
 * DXF to Three.js Geometry 변환 테스트
 *
 * 테스트 범위:
 * - linesToGeometry: LINE 엔티티 변환
 * - circlesToGeometry: CIRCLE 엔티티 변환
 * - arcsToGeometry: ARC 엔티티 변환
 * - polylinesToGeometry: POLYLINE 엔티티 변환
 * - ellipsesToGeometry: ELLIPSE 엔티티 변환
 * - splinesToGeometry: SPLINE 엔티티 변환
 * - calculateBounds: 바운딩 박스 계산
 * - calculateCameraDistance: 카메라 거리 계산
 * - hatchBoundariesToWireframe: HATCH 경계 와이어프레임
 * - hatchesToSolidGeometries: HATCH 솔리드 지오메트리
 * - cadDataToGeometry: 전체 CAD 데이터 변환
 */

import { describe, it, expect, afterEach } from 'vitest';

import type {
    ParsedLine,
    ParsedCircle,
    ParsedArc,
    ParsedPolyline,
    ParsedHatch,
    ParsedEllipse,
    ParsedSpline,
    ParsedCADData,
    BoundingBox,
} from '@/types/cad';

import {
    linesToGeometry,
    circlesToGeometry,
    arcsToGeometry,
    polylinesToGeometry,
    ellipsesToGeometry,
    splinesToGeometry,
    calculateBounds,
    calculateCameraDistance,
    hatchBoundariesToWireframe,
    hatchesToSolidGeometries,
    cadDataToGeometry,
    type HatchGeometryData,
} from '../dxfToGeometry';

import type * as THREE from 'three';

// ============================================================
// Test Helpers
// ============================================================

/** 생성된 지오메트리 추적 (cleanup용) */
const createdGeometries: THREE.BufferGeometry[] = [];

/** 지오메트리 생성 후 추적 */
function trackGeometry<T extends THREE.BufferGeometry>(geometry: T): T {
    createdGeometries.push(geometry);
    return geometry;
}

/** 테스트 후 지오메트리 정리 */
afterEach(() => {
    for (const geom of createdGeometries) {
        geom.dispose();
    }
    createdGeometries.length = 0;
});

/** 지오메트리 정점 수 반환 */
function getVertexCount(geometry: THREE.BufferGeometry): number {
    const position = geometry.getAttribute('position');
    return position ? position.count : 0;
}

/** 지오메트리 인덱스 수 반환 */
function getIndexCount(geometry: THREE.BufferGeometry): number {
    const index = geometry.getIndex();
    return index ? index.count : 0;
}

// ============================================================
// linesToGeometry Tests
// ============================================================

describe('linesToGeometry', () => {
    it('should return empty geometry for empty array', () => {
        const geometry = trackGeometry(linesToGeometry([]));

        expect(getVertexCount(geometry)).toBe(0);
    });

    it('should convert single line to geometry', () => {
        const lines: ParsedLine[] = [
            {
                start: { x: 0, y: 0, z: 0 },
                end: { x: 10, y: 0, z: 0 },
                layer: '0',
            },
        ];

        const geometry = trackGeometry(linesToGeometry(lines));

        // 2 unique vertices
        expect(getVertexCount(geometry)).toBe(2);
        // 2 indices (1 edge = 2 vertices)
        expect(getIndexCount(geometry)).toBe(2);
    });

    it('should convert multiple lines to geometry', () => {
        const lines: ParsedLine[] = [
            {
                start: { x: 0, y: 0, z: 0 },
                end: { x: 10, y: 0, z: 0 },
                layer: '0',
            },
            {
                start: { x: 0, y: 0, z: 0 },
                end: { x: 0, y: 10, z: 0 },
                layer: '0',
            },
            {
                start: { x: 10, y: 0, z: 0 },
                end: { x: 10, y: 10, z: 0 },
                layer: '0',
            },
        ];

        const geometry = trackGeometry(linesToGeometry(lines));

        // Should have indexed vertices (duplicates removed)
        expect(getVertexCount(geometry)).toBeGreaterThan(0);
        expect(getIndexCount(geometry)).toBe(6); // 3 edges * 2 indices
    });

    it('should deduplicate shared vertices', () => {
        // Square with shared corners
        const lines: ParsedLine[] = [
            {
                start: { x: 0, y: 0, z: 0 },
                end: { x: 10, y: 0, z: 0 },
                layer: '0',
            },
            {
                start: { x: 10, y: 0, z: 0 },
                end: { x: 10, y: 10, z: 0 },
                layer: '0',
            },
            {
                start: { x: 10, y: 10, z: 0 },
                end: { x: 0, y: 10, z: 0 },
                layer: '0',
            },
            {
                start: { x: 0, y: 10, z: 0 },
                end: { x: 0, y: 0, z: 0 },
                layer: '0',
            },
        ];

        const geometry = trackGeometry(linesToGeometry(lines));

        // 4 unique vertices (corners), 8 indices (4 edges * 2)
        expect(getVertexCount(geometry)).toBe(4);
        expect(getIndexCount(geometry)).toBe(8);
    });

    it('should preserve Z coordinates', () => {
        const lines: ParsedLine[] = [
            {
                start: { x: 0, y: 0, z: 5 },
                end: { x: 10, y: 0, z: 5 },
                layer: '0',
            },
        ];

        const geometry = trackGeometry(linesToGeometry(lines));
        const positions = geometry.getAttribute('position');

        // Check Z values
        expect(positions.getZ(0)).toBe(5);
        expect(positions.getZ(1)).toBe(5);
    });

    it('should have bounding sphere computed', () => {
        const lines: ParsedLine[] = [
            {
                start: { x: 0, y: 0, z: 0 },
                end: { x: 10, y: 0, z: 0 },
                layer: '0',
            },
        ];

        const geometry = trackGeometry(linesToGeometry(lines));

        expect(geometry.boundingSphere).not.toBeNull();
    });
});

// ============================================================
// circlesToGeometry Tests
// ============================================================

describe('circlesToGeometry', () => {
    it('should return empty geometry for empty array', () => {
        const geometry = trackGeometry(circlesToGeometry([]));

        expect(getVertexCount(geometry)).toBe(0);
    });

    it('should convert single circle to geometry', () => {
        const circles: ParsedCircle[] = [
            { center: { x: 0, y: 0, z: 0 }, radius: 5, layer: '0' },
        ];

        const geometry = trackGeometry(circlesToGeometry(circles, 32));

        // Circle should have vertices
        expect(getVertexCount(geometry)).toBeGreaterThan(0);
        // Should be indexed
        expect(getIndexCount(geometry)).toBeGreaterThan(0);
    });

    it('should use custom segments', () => {
        const circles: ParsedCircle[] = [
            { center: { x: 0, y: 0, z: 0 }, radius: 5, layer: '0' },
        ];

        const geom16 = trackGeometry(circlesToGeometry(circles, 16));
        const geom64 = trackGeometry(circlesToGeometry(circles, 64));

        // More segments = more vertices
        expect(getVertexCount(geom64)).toBeGreaterThan(getVertexCount(geom16));
    });

    it('should preserve Z coordinate', () => {
        const circles: ParsedCircle[] = [
            { center: { x: 0, y: 0, z: 10 }, radius: 5, layer: '0' },
        ];

        const geometry = trackGeometry(circlesToGeometry(circles, 8));
        const positions = geometry.getAttribute('position');

        // All Z values should be 10
        for (let i = 0; i < positions.count; i++) {
            expect(positions.getZ(i)).toBe(10);
        }
    });

    it('should handle multiple circles', () => {
        const circles: ParsedCircle[] = [
            { center: { x: 0, y: 0, z: 0 }, radius: 5, layer: '0' },
            { center: { x: 20, y: 0, z: 0 }, radius: 3, layer: '0' },
        ];

        const geometry = trackGeometry(circlesToGeometry(circles, 16));

        // Should have vertices from both circles
        expect(getVertexCount(geometry)).toBeGreaterThan(16);
    });
});

// ============================================================
// arcsToGeometry Tests
// ============================================================

describe('arcsToGeometry', () => {
    it('should return empty geometry for empty array', () => {
        const geometry = trackGeometry(arcsToGeometry([]));

        expect(getVertexCount(geometry)).toBe(0);
    });

    it('should convert single arc to geometry', () => {
        const arcs: ParsedArc[] = [
            {
                center: { x: 0, y: 0, z: 0 },
                radius: 5,
                startAngle: 0,
                endAngle: 90,
                layer: '0',
            },
        ];

        const geometry = trackGeometry(arcsToGeometry(arcs, 16));

        expect(getVertexCount(geometry)).toBeGreaterThan(0);
    });

    it('should handle arc crossing 0 degrees', () => {
        const arcs: ParsedArc[] = [
            {
                center: { x: 0, y: 0, z: 0 },
                radius: 5,
                startAngle: 270,
                endAngle: 90,
                layer: '0',
            },
        ];

        const geometry = trackGeometry(arcsToGeometry(arcs, 16));

        // Should handle wrap-around correctly
        expect(getVertexCount(geometry)).toBeGreaterThan(0);
    });

    it('should preserve Z coordinate', () => {
        const arcs: ParsedArc[] = [
            {
                center: { x: 0, y: 0, z: 7 },
                radius: 5,
                startAngle: 0,
                endAngle: 180,
                layer: '0',
            },
        ];

        const geometry = trackGeometry(arcsToGeometry(arcs, 8));
        const positions = geometry.getAttribute('position');

        for (let i = 0; i < positions.count; i++) {
            expect(positions.getZ(i)).toBe(7);
        }
    });
});

// ============================================================
// polylinesToGeometry Tests
// ============================================================

describe('polylinesToGeometry', () => {
    it('should return empty geometry for empty array', () => {
        const geometry = trackGeometry(polylinesToGeometry([]));

        expect(getVertexCount(geometry)).toBe(0);
    });

    it('should convert simple polyline', () => {
        const polylines: ParsedPolyline[] = [
            {
                vertices: [
                    { x: 0, y: 0, z: 0 },
                    { x: 10, y: 0, z: 0 },
                    { x: 10, y: 10, z: 0 },
                ],
                closed: false,
                layer: '0',
            },
        ];

        const geometry = trackGeometry(polylinesToGeometry(polylines));

        // 3 unique vertices, 4 indices (2 edges)
        expect(getVertexCount(geometry)).toBe(3);
        expect(getIndexCount(geometry)).toBe(4);
    });

    it('should close polyline when closed=true', () => {
        const polylines: ParsedPolyline[] = [
            {
                vertices: [
                    { x: 0, y: 0, z: 0 },
                    { x: 10, y: 0, z: 0 },
                    { x: 10, y: 10, z: 0 },
                ],
                closed: true,
                layer: '0',
            },
        ];

        const geometry = trackGeometry(polylinesToGeometry(polylines));

        // 3 unique vertices, 6 indices (3 edges - including closing edge)
        expect(getVertexCount(geometry)).toBe(3);
        expect(getIndexCount(geometry)).toBe(6);
    });

    it('should skip polyline with less than 2 vertices', () => {
        const polylines: ParsedPolyline[] = [
            {
                vertices: [{ x: 0, y: 0, z: 0 }],
                closed: false,
                layer: '0',
            },
        ];

        const geometry = trackGeometry(polylinesToGeometry(polylines));

        expect(getVertexCount(geometry)).toBe(0);
    });

    it('should handle multiple polylines', () => {
        const polylines: ParsedPolyline[] = [
            {
                vertices: [
                    { x: 0, y: 0, z: 0 },
                    { x: 10, y: 0, z: 0 },
                ],
                closed: false,
                layer: '0',
            },
            {
                vertices: [
                    { x: 20, y: 0, z: 0 },
                    { x: 30, y: 0, z: 0 },
                ],
                closed: false,
                layer: '0',
            },
        ];

        const geometry = trackGeometry(polylinesToGeometry(polylines));

        // 4 unique vertices (no overlap)
        expect(getVertexCount(geometry)).toBe(4);
    });
});

// ============================================================
// ellipsesToGeometry Tests
// ============================================================

describe('ellipsesToGeometry', () => {
    it('should return empty geometry for empty array', () => {
        const geometry = trackGeometry(ellipsesToGeometry([]));

        expect(getVertexCount(geometry)).toBe(0);
    });

    it('should convert full ellipse', () => {
        const ellipses: ParsedEllipse[] = [
            {
                center: { x: 0, y: 0, z: 0 },
                majorAxisEnd: { x: 10, y: 0, z: 0 },
                minorAxisRatio: 0.5,
                startParam: 0,
                endParam: Math.PI * 2,
                layer: '0',
            },
        ];

        const geometry = trackGeometry(ellipsesToGeometry(ellipses, 32));

        expect(getVertexCount(geometry)).toBeGreaterThan(0);
    });

    it('should convert partial ellipse arc', () => {
        const ellipses: ParsedEllipse[] = [
            {
                center: { x: 0, y: 0, z: 0 },
                majorAxisEnd: { x: 10, y: 0, z: 0 },
                minorAxisRatio: 0.5,
                startParam: 0,
                endParam: Math.PI, // Half ellipse
                layer: '0',
            },
        ];

        const geometry = trackGeometry(ellipsesToGeometry(ellipses, 32));

        expect(getVertexCount(geometry)).toBeGreaterThan(0);
    });

    it('should handle rotated ellipse', () => {
        const ellipses: ParsedEllipse[] = [
            {
                center: { x: 0, y: 0, z: 0 },
                majorAxisEnd: { x: 7.07, y: 7.07, z: 0 }, // 45 degrees
                minorAxisRatio: 0.5,
                startParam: 0,
                endParam: Math.PI * 2,
                layer: '0',
            },
        ];

        const geometry = trackGeometry(ellipsesToGeometry(ellipses, 32));

        expect(getVertexCount(geometry)).toBeGreaterThan(0);
    });
});

// ============================================================
// splinesToGeometry Tests
// ============================================================

describe('splinesToGeometry', () => {
    it('should return empty geometry for empty array', () => {
        const geometry = trackGeometry(splinesToGeometry([]));

        expect(getVertexCount(geometry)).toBe(0);
    });

    it('should convert simple spline', () => {
        const splines: ParsedSpline[] = [
            {
                controlPoints: [
                    { x: 0, y: 0, z: 0 },
                    { x: 5, y: 10, z: 0 },
                    { x: 10, y: 0, z: 0 },
                ],
                degree: 3,
                knots: undefined,
                weights: undefined,
                closed: false,
                layer: '0',
            },
        ];

        const geometry = trackGeometry(splinesToGeometry(splines, 20));

        expect(getVertexCount(geometry)).toBeGreaterThan(0);
    });

    it('should skip spline with less than 2 control points', () => {
        const splines: ParsedSpline[] = [
            {
                controlPoints: [{ x: 0, y: 0, z: 0 }],
                degree: 3,
                knots: undefined,
                weights: undefined,
                closed: false,
                layer: '0',
            },
        ];

        const geometry = trackGeometry(splinesToGeometry(splines, 20));

        expect(getVertexCount(geometry)).toBe(0);
    });

    it('should handle closed spline', () => {
        const splines: ParsedSpline[] = [
            {
                controlPoints: [
                    { x: 0, y: 0, z: 0 },
                    { x: 10, y: 0, z: 0 },
                    { x: 10, y: 10, z: 0 },
                    { x: 0, y: 10, z: 0 },
                ],
                degree: 3,
                knots: undefined,
                weights: undefined,
                closed: true,
                layer: '0',
            },
        ];

        const geometry = trackGeometry(splinesToGeometry(splines, 20));

        expect(getVertexCount(geometry)).toBeGreaterThan(0);
    });
});

// ============================================================
// calculateBounds Tests
// ============================================================

describe('calculateBounds', () => {
    it('should return default bounds for empty lines', () => {
        const bounds = calculateBounds([]);

        expect(bounds.min.x).toBe(0);
        expect(bounds.max.x).toBe(100);
    });

    it('should calculate bounds from lines', () => {
        const lines: ParsedLine[] = [
            {
                start: { x: 0, y: 0, z: 0 },
                end: { x: 10, y: 20, z: 5 },
                layer: '0',
            },
        ];

        const bounds = calculateBounds(lines);

        expect(bounds.min.x).toBe(0);
        expect(bounds.min.y).toBe(0);
        expect(bounds.min.z).toBe(0);
        expect(bounds.max.x).toBe(10);
        expect(bounds.max.y).toBe(20);
        expect(bounds.max.z).toBe(5);
    });

    it('should include circles in bounds', () => {
        const lines: ParsedLine[] = [];
        const circles: ParsedCircle[] = [
            { center: { x: 10, y: 10, z: 0 }, radius: 5, layer: '0' },
        ];

        const bounds = calculateBounds(lines, circles);

        expect(bounds.min.x).toBe(5);
        expect(bounds.min.y).toBe(5);
        expect(bounds.max.x).toBe(15);
        expect(bounds.max.y).toBe(15);
    });

    it('should include arcs in bounds', () => {
        const lines: ParsedLine[] = [];
        const arcs: ParsedArc[] = [
            {
                center: { x: 0, y: 0, z: 0 },
                radius: 10,
                startAngle: 0,
                endAngle: 90,
                layer: '0',
            },
        ];

        const bounds = calculateBounds(lines, undefined, arcs);

        expect(bounds.min.x).toBe(-10);
        expect(bounds.min.y).toBe(-10);
        expect(bounds.max.x).toBe(10);
        expect(bounds.max.y).toBe(10);
    });

    it('should include polylines in bounds', () => {
        const lines: ParsedLine[] = [];
        const polylines: ParsedPolyline[] = [
            {
                vertices: [
                    { x: -5, y: -5, z: 0 },
                    { x: 15, y: 15, z: 10 },
                ],
                closed: false,
                layer: '0',
            },
        ];

        const bounds = calculateBounds(lines, undefined, undefined, polylines);

        expect(bounds.min.x).toBe(-5);
        expect(bounds.min.y).toBe(-5);
        expect(bounds.min.z).toBe(0);
        expect(bounds.max.x).toBe(15);
        expect(bounds.max.y).toBe(15);
        expect(bounds.max.z).toBe(10);
    });

    it('should include hatches in bounds', () => {
        const lines: ParsedLine[] = [];
        const hatches: ParsedHatch[] = [
            {
                patternName: 'SOLID',
                isSolid: true,
                patternScale: 1,
                patternAngle: 0,
                color: undefined,
                layer: '0',
                boundaries: [
                    {
                        type: 'polyline',
                        vertices: [
                            { x: 0, y: 0, z: 0 },
                            { x: 20, y: 0, z: 0 },
                            { x: 20, y: 20, z: 0 },
                            { x: 0, y: 20, z: 0 },
                        ],
                        closed: true,
                    },
                ],
            },
        ];

        const bounds = calculateBounds(
            lines,
            undefined,
            undefined,
            undefined,
            hatches
        );

        expect(bounds.min.x).toBe(0);
        expect(bounds.min.y).toBe(0);
        expect(bounds.max.x).toBe(20);
        expect(bounds.max.y).toBe(20);
    });

    it('should handle hatch with circle boundary', () => {
        const lines: ParsedLine[] = [];
        const hatches: ParsedHatch[] = [
            {
                patternName: 'SOLID',
                isSolid: true,
                patternScale: 1,
                patternAngle: 0,
                color: undefined,
                layer: '0',
                boundaries: [
                    {
                        type: 'circle',
                        center: { x: 10, y: 10, z: 0 },
                        radius: 5,
                    },
                ],
            },
        ];

        const bounds = calculateBounds(
            lines,
            undefined,
            undefined,
            undefined,
            hatches
        );

        expect(bounds.min.x).toBe(5);
        expect(bounds.max.x).toBe(15);
    });

    it('should combine all entity types', () => {
        const lines: ParsedLine[] = [
            {
                start: { x: 0, y: 0, z: 0 },
                end: { x: 5, y: 5, z: 0 },
                layer: '0',
            },
        ];
        const circles: ParsedCircle[] = [
            { center: { x: 50, y: 50, z: 0 }, radius: 10, layer: '0' },
        ];

        const bounds = calculateBounds(lines, circles);

        expect(bounds.min.x).toBe(0);
        expect(bounds.min.y).toBe(0);
        expect(bounds.max.x).toBe(60); // 50 + 10
        expect(bounds.max.y).toBe(60);
    });
});

// ============================================================
// calculateCameraDistance Tests
// ============================================================

describe('calculateCameraDistance', () => {
    it('should calculate distance for unit bounds', () => {
        const bounds: BoundingBox = {
            min: { x: 0, y: 0, z: 0 },
            max: { x: 10, y: 10, z: 0 },
        };

        const distance = calculateCameraDistance(bounds, 45);

        expect(distance).toBeGreaterThan(0);
    });

    it('should increase distance for larger bounds', () => {
        const smallBounds: BoundingBox = {
            min: { x: 0, y: 0, z: 0 },
            max: { x: 10, y: 10, z: 0 },
        };
        const largeBounds: BoundingBox = {
            min: { x: 0, y: 0, z: 0 },
            max: { x: 100, y: 100, z: 0 },
        };

        const smallDist = calculateCameraDistance(smallBounds, 45);
        const largeDist = calculateCameraDistance(largeBounds, 45);

        expect(largeDist).toBeGreaterThan(smallDist);
    });

    it('should decrease distance for larger FOV', () => {
        const bounds: BoundingBox = {
            min: { x: 0, y: 0, z: 0 },
            max: { x: 50, y: 50, z: 0 },
        };

        const dist45 = calculateCameraDistance(bounds, 45);
        const dist90 = calculateCameraDistance(bounds, 90);

        expect(dist45).toBeGreaterThan(dist90);
    });

    it('should use default FOV of 45', () => {
        const bounds: BoundingBox = {
            min: { x: 0, y: 0, z: 0 },
            max: { x: 50, y: 50, z: 0 },
        };

        const distDefault = calculateCameraDistance(bounds);
        const dist45 = calculateCameraDistance(bounds, 45);

        expect(distDefault).toBe(dist45);
    });
});

// ============================================================
// hatchBoundariesToWireframe Tests
// ============================================================

describe('hatchBoundariesToWireframe', () => {
    it('should return empty geometry for empty array', () => {
        const geometry = trackGeometry(hatchBoundariesToWireframe([]));

        expect(getVertexCount(geometry)).toBe(0);
    });

    it('should convert polyline boundary to wireframe', () => {
        const hatches: ParsedHatch[] = [
            {
                patternName: 'SOLID',
                isSolid: true,
                patternScale: 1,
                patternAngle: 0,
                color: undefined,
                layer: '0',
                boundaries: [
                    {
                        type: 'polyline',
                        vertices: [
                            { x: 0, y: 0, z: 0 },
                            { x: 10, y: 0, z: 0 },
                            { x: 10, y: 10, z: 0 },
                            { x: 0, y: 10, z: 0 },
                        ],
                        closed: true,
                    },
                ],
            },
        ];

        const geometry = trackGeometry(hatchBoundariesToWireframe(hatches));

        // Should have vertices for the boundary edges
        expect(getVertexCount(geometry)).toBeGreaterThan(0);
    });

    it('should convert circle boundary to wireframe', () => {
        const hatches: ParsedHatch[] = [
            {
                patternName: 'SOLID',
                isSolid: true,
                patternScale: 1,
                patternAngle: 0,
                color: undefined,
                layer: '0',
                boundaries: [
                    {
                        type: 'circle',
                        center: { x: 5, y: 5, z: 0 },
                        radius: 5,
                    },
                ],
            },
        ];

        const geometry = trackGeometry(hatchBoundariesToWireframe(hatches, 16));

        expect(getVertexCount(geometry)).toBeGreaterThan(0);
    });

    it('should convert arc boundary to wireframe', () => {
        const hatches: ParsedHatch[] = [
            {
                patternName: 'SOLID',
                isSolid: true,
                patternScale: 1,
                patternAngle: 0,
                color: undefined,
                layer: '0',
                boundaries: [
                    {
                        type: 'arc',
                        center: { x: 0, y: 0, z: 0 },
                        radius: 5,
                        startAngle: 0,
                        endAngle: 180,
                    },
                ],
            },
        ];

        const geometry = trackGeometry(hatchBoundariesToWireframe(hatches, 16));

        expect(getVertexCount(geometry)).toBeGreaterThan(0);
    });
});

// ============================================================
// hatchesToSolidGeometries Tests
// ============================================================

describe('hatchesToSolidGeometries', () => {
    let geometryData: HatchGeometryData[] = [];

    afterEach(() => {
        for (const data of geometryData) {
            data.geometry.dispose();
        }
        geometryData = [];
    });

    it('should return empty array for empty hatches', () => {
        geometryData = hatchesToSolidGeometries([]);

        expect(geometryData.length).toBe(0);
    });

    it('should skip hatch with no boundaries', () => {
        const hatches: ParsedHatch[] = [
            {
                patternName: 'SOLID',
                isSolid: true,
                patternScale: 1,
                patternAngle: 0,
                color: undefined,
                layer: '0',
                boundaries: [],
            },
        ];

        geometryData = hatchesToSolidGeometries(hatches);

        expect(geometryData.length).toBe(0);
    });

    it('should convert solid hatch with polyline boundary', () => {
        const hatches: ParsedHatch[] = [
            {
                patternName: 'SOLID',
                isSolid: true,
                patternScale: 1,
                patternAngle: 0,
                color: undefined,
                layer: '0',
                boundaries: [
                    {
                        type: 'polyline',
                        vertices: [
                            { x: 0, y: 0, z: 0 },
                            { x: 10, y: 0, z: 0 },
                            { x: 10, y: 10, z: 0 },
                            { x: 0, y: 10, z: 0 },
                        ],
                        closed: true,
                    },
                ],
            },
        ];

        geometryData = hatchesToSolidGeometries(hatches);

        expect(geometryData.length).toBe(1);
        expect(geometryData[0]!.geometry).toBeDefined();
        expect(geometryData[0]!.hatch).toBe(hatches[0]);
    });

    it('should include Z offset in zPosition', () => {
        const hatches: ParsedHatch[] = [
            {
                patternName: 'SOLID',
                isSolid: true,
                patternScale: 1,
                patternAngle: 0,
                color: undefined,
                layer: '0',
                boundaries: [
                    {
                        type: 'polyline',
                        vertices: [
                            { x: 0, y: 0, z: 5 },
                            { x: 10, y: 0, z: 5 },
                            { x: 10, y: 10, z: 5 },
                        ],
                        closed: true,
                    },
                ],
            },
        ];

        geometryData = hatchesToSolidGeometries(hatches);

        // zPosition = vertex.z + HATCH_CONFIG.zOffset (-0.01)
        expect(geometryData[0]!.zPosition).toBeCloseTo(4.99, 2);
    });
});

// ============================================================
// cadDataToGeometry Tests
// ============================================================

describe('cadDataToGeometry', () => {
    it('should return empty geometry for empty data', () => {
        const data: ParsedCADData = {
            lines: [],
            circles: [],
            arcs: [],
            polylines: [],
            hatches: [],
            texts: [],
            mtexts: [],
            ellipses: [],
            splines: [],
            dimensions: [],
            layers: {},
            bounds: { min: { x: 0, y: 0, z: 0 }, max: { x: 0, y: 0, z: 0 } },
            metadata: {
                fileName: 'test.dxf',
                fileSize: 0,
                entityCount: 0,
                parseTime: 0,
            },
        };

        const geometry = trackGeometry(cadDataToGeometry(data));

        expect(getVertexCount(geometry)).toBe(0);
    });

    it('should merge multiple entity types', () => {
        const data: ParsedCADData = {
            lines: [
                {
                    start: { x: 0, y: 0, z: 0 },
                    end: { x: 10, y: 0, z: 0 },
                    layer: '0',
                },
            ],
            circles: [{ center: { x: 20, y: 0, z: 0 }, radius: 5, layer: '0' }],
            arcs: [],
            polylines: [],
            hatches: [],
            texts: [],
            mtexts: [],
            ellipses: [],
            splines: [],
            dimensions: [],
            layers: {},
            bounds: { min: { x: 0, y: 0, z: 0 }, max: { x: 25, y: 5, z: 0 } },
            metadata: {
                fileName: 'test.dxf',
                fileSize: 100,
                entityCount: 2,
                parseTime: 1,
            },
        };

        const geometry = trackGeometry(cadDataToGeometry(data));

        expect(getVertexCount(geometry)).toBeGreaterThan(0);
        expect(geometry.boundingSphere).not.toBeNull();
    });

    it('should use custom segments override', () => {
        const data: ParsedCADData = {
            lines: [],
            circles: [{ center: { x: 0, y: 0, z: 0 }, radius: 5, layer: '0' }],
            arcs: [],
            polylines: [],
            hatches: [],
            texts: [],
            mtexts: [],
            ellipses: [],
            splines: [],
            dimensions: [],
            layers: {},
            bounds: { min: { x: -5, y: -5, z: 0 }, max: { x: 5, y: 5, z: 0 } },
            metadata: {
                fileName: 'test.dxf',
                fileSize: 100,
                entityCount: 1,
                parseTime: 1,
            },
        };

        const geom16 = trackGeometry(cadDataToGeometry(data, 16));
        const geom64 = trackGeometry(cadDataToGeometry(data, 64));

        expect(getVertexCount(geom64)).toBeGreaterThan(getVertexCount(geom16));
    });

    it('should include ellipses and splines', () => {
        const data: ParsedCADData = {
            lines: [],
            circles: [],
            arcs: [],
            polylines: [],
            hatches: [],
            texts: [],
            mtexts: [],
            ellipses: [
                {
                    center: { x: 0, y: 0, z: 0 },
                    majorAxisEnd: { x: 10, y: 0, z: 0 },
                    minorAxisRatio: 0.5,
                    startParam: 0,
                    endParam: Math.PI * 2,
                    layer: '0',
                },
            ],
            splines: [
                {
                    controlPoints: [
                        { x: 20, y: 0, z: 0 },
                        { x: 25, y: 10, z: 0 },
                        { x: 30, y: 0, z: 0 },
                    ],
                    degree: 3,
                    knots: undefined,
                    weights: undefined,
                    closed: false,
                    layer: '0',
                },
            ],
            dimensions: [],
            layers: {},
            bounds: {
                min: { x: -5, y: -5, z: 0 },
                max: { x: 30, y: 10, z: 0 },
            },
            metadata: {
                fileName: 'test.dxf',
                fileSize: 100,
                entityCount: 2,
                parseTime: 1,
            },
        };

        const geometry = trackGeometry(cadDataToGeometry(data));

        expect(getVertexCount(geometry)).toBeGreaterThan(0);
    });
});

// ============================================================
// Memory Efficiency Tests
// ============================================================

describe('Memory Efficiency', () => {
    it('should use indexed geometry for lines', () => {
        // Square - 4 unique vertices, 8 indices
        const lines: ParsedLine[] = [
            {
                start: { x: 0, y: 0, z: 0 },
                end: { x: 10, y: 0, z: 0 },
                layer: '0',
            },
            {
                start: { x: 10, y: 0, z: 0 },
                end: { x: 10, y: 10, z: 0 },
                layer: '0',
            },
            {
                start: { x: 10, y: 10, z: 0 },
                end: { x: 0, y: 10, z: 0 },
                layer: '0',
            },
            {
                start: { x: 0, y: 10, z: 0 },
                end: { x: 0, y: 0, z: 0 },
                layer: '0',
            },
        ];

        const geometry = trackGeometry(linesToGeometry(lines));

        // Without indexing: 8 vertices (4 edges * 2)
        // With indexing: 4 unique vertices
        expect(getVertexCount(geometry)).toBe(4);
        expect(getIndexCount(geometry)).toBe(8);
    });

    it('should deduplicate vertices with floating point precision', () => {
        // Same vertex with slight floating point differences
        const lines: ParsedLine[] = [
            {
                start: { x: 0.0000001, y: 0.0000002, z: 0 },
                end: { x: 10, y: 0, z: 0 },
                layer: '0',
            },
            {
                start: { x: 0, y: 0, z: 0 },
                end: { x: 0, y: 10, z: 0 },
                layer: '0',
            },
        ];

        const geometry = trackGeometry(linesToGeometry(lines));

        // Should deduplicate near-zero vertices
        // 0.0000001 rounded to 6 decimals = 0.000000 = "0"
        expect(getVertexCount(geometry)).toBe(3);
    });
});

// ============================================================
// Edge Cases
// ============================================================

describe('Edge Cases', () => {
    it('should handle negative coordinates', () => {
        const lines: ParsedLine[] = [
            {
                start: { x: -10, y: -20, z: -5 },
                end: { x: 10, y: 20, z: 5 },
                layer: '0',
            },
        ];

        const geometry = trackGeometry(linesToGeometry(lines));
        const bounds = calculateBounds(lines);

        expect(getVertexCount(geometry)).toBe(2);
        expect(bounds.min.x).toBe(-10);
        expect(bounds.min.y).toBe(-20);
        expect(bounds.min.z).toBe(-5);
    });

    it('should handle very small values', () => {
        const lines: ParsedLine[] = [
            {
                start: { x: 0.000001, y: 0.000001, z: 0 },
                end: { x: 0.000002, y: 0.000002, z: 0 },
                layer: '0',
            },
        ];

        const geometry = trackGeometry(linesToGeometry(lines));

        expect(getVertexCount(geometry)).toBeGreaterThan(0);
    });

    it('should handle very large values', () => {
        const lines: ParsedLine[] = [
            {
                start: { x: 1000000, y: 1000000, z: 0 },
                end: { x: 1000001, y: 1000001, z: 0 },
                layer: '0',
            },
        ];

        const geometry = trackGeometry(linesToGeometry(lines));
        const bounds = calculateBounds(lines);

        expect(getVertexCount(geometry)).toBe(2);
        expect(bounds.max.x).toBe(1000001);
    });

    it('should handle zero-length line', () => {
        const lines: ParsedLine[] = [
            {
                start: { x: 5, y: 5, z: 0 },
                end: { x: 5, y: 5, z: 0 },
                layer: '0',
            },
        ];

        const geometry = trackGeometry(linesToGeometry(lines));

        // Zero-length line still creates geometry (same vertex twice in index)
        expect(getVertexCount(geometry)).toBe(1);
        expect(getIndexCount(geometry)).toBe(2);
    });

    it('should handle zero-radius circle', () => {
        const circles: ParsedCircle[] = [
            { center: { x: 0, y: 0, z: 0 }, radius: 0, layer: '0' },
        ];

        const geometry = trackGeometry(circlesToGeometry(circles, 16));

        // Zero radius still creates degenerate geometry
        expect(geometry).toBeDefined();
    });
});
