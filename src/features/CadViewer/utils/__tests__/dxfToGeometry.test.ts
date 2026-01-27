/**
 * dxfToGeometry.test.ts
 * CADViewer 지오메트리 변환 함수 테스트
 */

import { describe, it, expect } from 'vitest';

import {
    linesToGeometry,
    circlesToGeometry,
    arcsToGeometry,
    polylinesToGeometry,
    hatchBoundariesToWireframe,
    hatchesToSolidGeometries,
    createPatternTexture,
    cadDataToGeometry,
    calculateBounds,
    calculateCameraDistance,
} from '@/utils/cad';

import { DEFAULT_BOUNDS } from '../../constants';

import type {
    ParsedLine,
    ParsedCircle,
    ParsedArc,
    ParsedPolyline,
    ParsedHatch,
    ParsedCADData,
    BoundingBox,
} from '../../types';

// 테스트용 헬퍼: 빈 ParsedCADData 생성
function createEmptyCADData(): ParsedCADData {
    return {
        lines: [],
        circles: [],
        arcs: [],
        polylines: [],
        hatches: [],
        // Phase 2.1.4: 추가 엔티티
        texts: [],
        mtexts: [],
        ellipses: [],
        splines: [],
        dimensions: [],
        bounds: DEFAULT_BOUNDS,
        metadata: {
            fileName: 'test.dxf',
            fileSize: 100,
            entityCount: 0,
            parseTime: 10,
        },
        layers: {},
    };
}

// 테스트용 헬퍼: 사각형 HATCH 생성
function createRectangleHatch(
    x: number,
    y: number,
    width: number,
    height: number,
    isSolid = true
): ParsedHatch {
    return {
        boundaries: [
            {
                type: 'polyline',
                vertices: [
                    { x, y, z: 0 },
                    { x: x + width, y, z: 0 },
                    { x: x + width, y: y + height, z: 0 },
                    { x, y: y + height, z: 0 },
                ],
                closed: true,
            },
        ],
        patternName: isSolid ? 'SOLID' : 'ANSI31',
        isSolid,
        patternScale: 1,
        patternAngle: 0,
        color: undefined,
        layer: '0',
    };
}

// 테스트용 헬퍼: 원형 HATCH 생성
function createCircleHatch(
    cx: number,
    cy: number,
    radius: number
): ParsedHatch {
    return {
        boundaries: [
            {
                type: 'circle',
                center: { x: cx, y: cy, z: 0 },
                radius,
            },
        ],
        patternName: 'SOLID',
        isSolid: true,
        patternScale: 1,
        patternAngle: 0,
        color: undefined,
        layer: '0',
    };
}

describe('dxfToGeometry', () => {
    describe('linesToGeometry', () => {
        it('빈 배열이면 position 속성이 없는 BufferGeometry 반환', () => {
            const geometry = linesToGeometry([]);
            expect(geometry.attributes.position).toBeUndefined();
        });

        it('단일 라인이면 2개의 정점 생성', () => {
            const lines: ParsedLine[] = [
                {
                    start: { x: 0, y: 0, z: 0 },
                    end: { x: 10, y: 0, z: 0 },
                    layer: undefined,
                },
            ];
            const geometry = linesToGeometry(lines);

            expect(geometry.attributes.position).toBeDefined();
            expect(geometry.attributes.position!.count).toBe(2);
        });

        it('복수 라인 - 인덱스 버퍼로 정점 중복 제거', () => {
            const lines: ParsedLine[] = [
                {
                    start: { x: 0, y: 0, z: 0 },
                    end: { x: 10, y: 0, z: 0 },
                    layer: undefined,
                },
                {
                    start: { x: 10, y: 0, z: 0 },
                    end: { x: 10, y: 10, z: 0 },
                    layer: undefined,
                },
                {
                    start: { x: 10, y: 10, z: 0 },
                    end: { x: 0, y: 10, z: 0 },
                    layer: undefined,
                },
            ];
            const geometry = linesToGeometry(lines);

            // 인덱스 버퍼: 공유 정점 중복 제거
            // 고유 정점: (0,0,0), (10,0,0), (10,10,0), (0,10,0) = 4개
            expect(geometry.attributes.position!.count).toBe(4);
            // 인덱스 배열: 6개 (3 lines * 2 indices)
            expect(geometry.index!.count).toBe(6);
        });

        it('3D 좌표가 정확히 변환됨', () => {
            const lines: ParsedLine[] = [
                {
                    start: { x: 1, y: 2, z: 3 },
                    end: { x: 4, y: 5, z: 6 },
                    layer: undefined,
                },
            ];
            const geometry = linesToGeometry(lines);
            const positions = geometry.attributes.position!;

            // Start point
            expect(positions.getX(0)).toBe(1);
            expect(positions.getY(0)).toBe(2);
            expect(positions.getZ(0)).toBe(3);

            // End point
            expect(positions.getX(1)).toBe(4);
            expect(positions.getY(1)).toBe(5);
            expect(positions.getZ(1)).toBe(6);
        });
    });

    describe('circlesToGeometry', () => {
        it('빈 배열이면 position 속성이 없는 BufferGeometry 반환', () => {
            const geometry = circlesToGeometry([]);
            expect(geometry.attributes.position).toBeUndefined();
        });

        it('단일 원이면 세그먼트 수에 따른 정점 생성', () => {
            const circles: ParsedCircle[] = [
                { center: { x: 0, y: 0, z: 0 }, radius: 10, layer: undefined },
            ];
            const segments = 8;
            const geometry = circlesToGeometry(circles, segments);

            // 각 세그먼트는 2개의 정점 (라인 세그먼트)
            // segments + 1개의 점 → segments개의 라인 + 닫기 라인 1개 = (segments + 1) * 2
            expect(geometry.attributes.position).toBeDefined();
            expect(geometry.attributes.position!.count).toBeGreaterThan(0);
        });

        it('원 중심 Z 좌표가 유지됨', () => {
            const circles: ParsedCircle[] = [
                { center: { x: 0, y: 0, z: 5 }, radius: 10, layer: undefined },
            ];
            const geometry = circlesToGeometry(circles, 4);
            const positions = geometry.attributes.position!;

            // 모든 정점의 Z 좌표가 5여야 함
            for (let i = 0; i < positions.count; i++) {
                expect(positions.getZ(i)).toBe(5);
            }
        });
    });

    describe('arcsToGeometry', () => {
        it('빈 배열이면 position 속성이 없는 BufferGeometry 반환', () => {
            const geometry = arcsToGeometry([]);
            expect(geometry.attributes.position).toBeUndefined();
        });

        it('0도에서 90도 호 변환', () => {
            const arcs: ParsedArc[] = [
                {
                    center: { x: 0, y: 0, z: 0 },
                    radius: 10,
                    startAngle: 0,
                    endAngle: 90,
                    layer: undefined,
                },
            ];
            const geometry = arcsToGeometry(arcs, 4);

            expect(geometry.attributes.position).toBeDefined();
            expect(geometry.attributes.position!.count).toBeGreaterThan(0);
        });

        it('270도에서 90도 호 (wrap-around) 변환', () => {
            const arcs: ParsedArc[] = [
                {
                    center: { x: 0, y: 0, z: 0 },
                    radius: 10,
                    startAngle: 270,
                    endAngle: 90, // 270 → 90 = 180도 호
                    layer: undefined,
                },
            ];
            const geometry = arcsToGeometry(arcs, 4);

            expect(geometry.attributes.position).toBeDefined();
            expect(geometry.attributes.position!.count).toBeGreaterThan(0);
        });

        it('호 중심 Z 좌표가 유지됨', () => {
            const arcs: ParsedArc[] = [
                {
                    center: { x: 0, y: 0, z: 3 },
                    radius: 10,
                    startAngle: 0,
                    endAngle: 90,
                    layer: undefined,
                },
            ];
            const geometry = arcsToGeometry(arcs, 4);
            const positions = geometry.attributes.position!;

            for (let i = 0; i < positions.count; i++) {
                expect(positions.getZ(i)).toBe(3);
            }
        });
    });

    describe('polylinesToGeometry', () => {
        it('빈 배열이면 position 속성이 없는 BufferGeometry 반환', () => {
            const geometry = polylinesToGeometry([]);
            expect(geometry.attributes.position).toBeUndefined();
        });

        it('열린 폴리라인 (3개 정점) - 인덱스 버퍼로 정점 재사용', () => {
            const polylines: ParsedPolyline[] = [
                {
                    vertices: [
                        { x: 0, y: 0, z: 0 },
                        { x: 10, y: 0, z: 0 },
                        { x: 10, y: 10, z: 0 },
                    ],
                    closed: false,
                    layer: undefined,
                },
            ];
            const geometry = polylinesToGeometry(polylines);

            // 인덱스 버퍼: 3개 고유 정점
            expect(geometry.attributes.position!.count).toBe(3);
            // 인덱스: 2개 세그먼트 * 2 = 4
            expect(geometry.index!.count).toBe(4);
        });

        it('닫힌 폴리라인 (3개 정점) - 인덱스 버퍼로 정점 재사용', () => {
            const polylines: ParsedPolyline[] = [
                {
                    vertices: [
                        { x: 0, y: 0, z: 0 },
                        { x: 10, y: 0, z: 0 },
                        { x: 10, y: 10, z: 0 },
                    ],
                    closed: true,
                    layer: undefined,
                },
            ];
            const geometry = polylinesToGeometry(polylines);

            // 인덱스 버퍼: 3개 고유 정점 (닫힌 폴리라인도 정점은 3개)
            expect(geometry.attributes.position!.count).toBe(3);
            // 인덱스: 3개 세그먼트 * 2 = 6
            expect(geometry.index!.count).toBe(6);
        });

        it('2점 미만 폴리라인은 무시됨 (빈 정점 배열 반환)', () => {
            const polylines: ParsedPolyline[] = [
                {
                    vertices: [{ x: 0, y: 0, z: 0 }], // 1점만
                    closed: false,
                    layer: undefined,
                },
            ];
            const geometry = polylinesToGeometry(polylines);

            // 빈 지오메트리가 생성되지만 position 속성은 있을 수 있음 (count=0)
            if (geometry.attributes.position) {
                expect(geometry.attributes.position.count).toBe(0);
            } else {
                expect(geometry.attributes.position).toBeUndefined();
            }
        });
    });

    describe('cadDataToGeometry', () => {
        it('빈 데이터면 position 속성이 없는 BufferGeometry 반환', () => {
            const data = createEmptyCADData();
            const geometry = cadDataToGeometry(data);

            expect(geometry.attributes.position).toBeUndefined();
        });

        it('LOD 자동 적용: 엔티티 < 1000 → HIGH_QUALITY_SEGMENTS', () => {
            const data = createEmptyCADData();
            // 100개 라인 추가 (연결된 라인들)
            for (let i = 0; i < 100; i++) {
                data.lines.push({
                    start: { x: i, y: 0, z: 0 },
                    end: { x: i + 1, y: 0, z: 0 },
                    layer: undefined,
                });
            }
            data.metadata.entityCount = 100;

            const geometry = cadDataToGeometry(data);
            expect(geometry.attributes.position).toBeDefined();
            // 인덱스 버퍼: 연결된 라인은 정점 공유
            // 고유 정점: 101개 (0~100)
            expect(geometry.attributes.position!.count).toBe(101);
        });

        it('segmentsOverride 적용 확인', () => {
            const data = createEmptyCADData();
            data.circles.push({
                center: { x: 0, y: 0, z: 0 },
                radius: 10,
                layer: undefined,
            });
            data.metadata.entityCount = 1;

            // 다른 세그먼트 수로 생성
            const geom1 = cadDataToGeometry(data, 8);
            const geom2 = cadDataToGeometry(data, 16);

            // 세그먼트 수가 다르면 정점 수도 다름
            expect(geom1.attributes.position!.count).not.toBe(
                geom2.attributes.position!.count
            );
        });

        it('여러 엔티티 타입 병합', () => {
            const data = createEmptyCADData();
            data.lines.push({
                start: { x: 0, y: 0, z: 0 },
                end: { x: 10, y: 0, z: 0 },
                layer: undefined,
            });
            data.circles.push({
                center: { x: 20, y: 0, z: 0 },
                radius: 5,
                layer: undefined,
            });
            data.metadata.entityCount = 2;

            const geometry = cadDataToGeometry(data, 8);
            expect(geometry.attributes.position).toBeDefined();
            // 라인 2정점 + 원 정점들
            expect(geometry.attributes.position!.count).toBeGreaterThan(2);
        });

        it('polylines 포함 데이터 병합', () => {
            const data = createEmptyCADData();
            data.polylines.push({
                vertices: [
                    { x: 0, y: 0, z: 0 },
                    { x: 10, y: 0, z: 0 },
                    { x: 10, y: 10, z: 0 },
                ],
                closed: false,
                layer: undefined,
            });
            data.metadata.entityCount = 1;

            const geometry = cadDataToGeometry(data);
            expect(geometry.attributes.position).toBeDefined();
            // 인덱스 버퍼: 3개 고유 정점
            expect(geometry.attributes.position!.count).toBe(3);
        });

        it('arcs 포함 데이터 병합', () => {
            const data = createEmptyCADData();
            data.arcs.push({
                center: { x: 0, y: 0, z: 0 },
                radius: 10,
                startAngle: 0,
                endAngle: 90,
                layer: undefined,
            });
            data.metadata.entityCount = 1;

            const geometry = cadDataToGeometry(data, 8);
            expect(geometry.attributes.position).toBeDefined();
            expect(geometry.attributes.position!.count).toBeGreaterThan(0);
        });
    });

    describe('calculateBounds', () => {
        it('빈 데이터면 DEFAULT_BOUNDS 반환', () => {
            const bounds = calculateBounds([]);
            expect(bounds).toEqual(DEFAULT_BOUNDS);
        });

        it('LINE 엔티티 바운딩 박스 계산', () => {
            const lines: ParsedLine[] = [
                {
                    start: { x: 0, y: 0, z: 0 },
                    end: { x: 100, y: 50, z: 10 },
                    layer: undefined,
                },
            ];
            const bounds = calculateBounds(lines);

            expect(bounds.min).toEqual({ x: 0, y: 0, z: 0 });
            expect(bounds.max).toEqual({ x: 100, y: 50, z: 10 });
        });

        it('CIRCLE 엔티티 바운딩 박스 계산', () => {
            const lines: ParsedLine[] = [];
            const circles: ParsedCircle[] = [
                {
                    center: { x: 50, y: 50, z: 0 },
                    radius: 25,
                    layer: undefined,
                },
            ];
            const bounds = calculateBounds(lines, circles);

            expect(bounds.min).toEqual({ x: 25, y: 25, z: 0 });
            expect(bounds.max).toEqual({ x: 75, y: 75, z: 0 });
        });

        it('ARC 엔티티 바운딩 박스 계산', () => {
            const lines: ParsedLine[] = [];
            const circles: ParsedCircle[] = [];
            const arcs: ParsedArc[] = [
                {
                    center: { x: 100, y: 100, z: 5 },
                    radius: 50,
                    startAngle: 0,
                    endAngle: 90,
                    layer: undefined,
                },
            ];
            const bounds = calculateBounds(lines, circles, arcs);

            expect(bounds.min).toEqual({ x: 50, y: 50, z: 5 });
            expect(bounds.max).toEqual({ x: 150, y: 150, z: 5 });
        });

        it('POLYLINE 엔티티 바운딩 박스 계산', () => {
            const lines: ParsedLine[] = [];
            const polylines: ParsedPolyline[] = [
                {
                    vertices: [
                        { x: -10, y: -20, z: -5 },
                        { x: 30, y: 40, z: 15 },
                    ],
                    closed: false,
                    layer: undefined,
                },
            ];
            const bounds = calculateBounds(lines, [], [], polylines);

            expect(bounds.min).toEqual({ x: -10, y: -20, z: -5 });
            expect(bounds.max).toEqual({ x: 30, y: 40, z: 15 });
        });

        it('모든 엔티티 타입 종합 바운딩 박스', () => {
            const lines: ParsedLine[] = [
                {
                    start: { x: 0, y: 0, z: 0 },
                    end: { x: 10, y: 10, z: 0 },
                    layer: undefined,
                },
            ];
            const circles: ParsedCircle[] = [
                {
                    center: { x: 100, y: 100, z: 0 },
                    radius: 20,
                    layer: undefined,
                },
            ];
            const arcs: ParsedArc[] = [
                {
                    center: { x: -50, y: 0, z: 0 },
                    radius: 10,
                    startAngle: 0,
                    endAngle: 180,
                    layer: undefined,
                },
            ];
            const polylines: ParsedPolyline[] = [
                {
                    vertices: [
                        { x: 0, y: 200, z: 0 },
                        { x: 50, y: 250, z: 0 },
                    ],
                    closed: false,
                    layer: undefined,
                },
            ];

            const bounds = calculateBounds(lines, circles, arcs, polylines);

            expect(bounds.min.x).toBe(-60); // arc center -50 - radius 10
            expect(bounds.max.x).toBe(120); // circle center 100 + radius 20
            expect(bounds.min.y).toBe(-10); // arc center 0 - radius 10
            expect(bounds.max.y).toBe(250); // polyline vertex
        });
    });

    describe('calculateCameraDistance', () => {
        it('기본 FOV(45도)로 카메라 거리 계산', () => {
            const bounds: BoundingBox = {
                min: { x: 0, y: 0, z: 0 },
                max: { x: 100, y: 100, z: 0 },
            };
            const distance = calculateCameraDistance(bounds);

            // maxDimension = 100, FOV = 45
            // distance = 100 / 2 / tan(22.5deg) * 1.5
            expect(distance).toBeGreaterThan(100);
        });

        it('커스텀 FOV로 카메라 거리 계산', () => {
            const bounds: BoundingBox = {
                min: { x: 0, y: 0, z: 0 },
                max: { x: 100, y: 100, z: 0 },
            };

            const distance45 = calculateCameraDistance(bounds, 45);
            const distance90 = calculateCameraDistance(bounds, 90);

            // 넓은 FOV는 더 가까운 거리 필요
            expect(distance90).toBeLessThan(distance45);
        });
    });

    describe('hatchBoundariesToWireframe', () => {
        it('빈 배열이면 position 속성이 없는 BufferGeometry 반환', () => {
            const geometry = hatchBoundariesToWireframe([]);
            expect(geometry.attributes.position).toBeUndefined();
        });

        it('사각형 폴리라인 경계 → 8개 정점 (4 세그먼트)', () => {
            const hatches: ParsedHatch[] = [
                createRectangleHatch(0, 0, 100, 50),
            ];
            const geometry = hatchBoundariesToWireframe(hatches);

            expect(geometry.attributes.position).toBeDefined();
            // 4개 정점 + 닫기 = 4개 세그먼트 = 8개 정점
            expect(geometry.attributes.position!.count).toBe(8);
        });

        it('원형 경계 와이어프레임 생성', () => {
            const hatches: ParsedHatch[] = [createCircleHatch(50, 50, 25)];
            const geometry = hatchBoundariesToWireframe(hatches, 8);

            expect(geometry.attributes.position).toBeDefined();
            expect(geometry.attributes.position!.count).toBeGreaterThan(0);
        });

        it('복수 HATCH 경계 병합', () => {
            const hatches: ParsedHatch[] = [
                createRectangleHatch(0, 0, 100, 50),
                createRectangleHatch(200, 0, 50, 50),
            ];
            const geometry = hatchBoundariesToWireframe(hatches);

            expect(geometry.attributes.position).toBeDefined();
            // 두 사각형: 8 + 8 = 16 정점
            expect(geometry.attributes.position!.count).toBe(16);
        });
    });

    describe('hatchesToSolidGeometries', () => {
        it('빈 배열이면 빈 결과 반환', () => {
            const result = hatchesToSolidGeometries([]);
            expect(result).toHaveLength(0);
        });

        it('사각형 HATCH → ShapeGeometry 생성', () => {
            const hatches: ParsedHatch[] = [
                createRectangleHatch(0, 0, 100, 50),
            ];
            const result = hatchesToSolidGeometries(hatches);

            expect(result).toHaveLength(1);
            expect(result[0]!.geometry).toBeDefined();
            expect(result[0]!.hatch).toBe(hatches[0]);
        });

        it('원형 HATCH → ShapeGeometry 생성', () => {
            const hatches: ParsedHatch[] = [createCircleHatch(50, 50, 25)];
            const result = hatchesToSolidGeometries(hatches, 16);

            expect(result).toHaveLength(1);
            expect(result[0]!.geometry).toBeDefined();
        });

        it('경계 없는 HATCH는 무시됨', () => {
            const hatches: ParsedHatch[] = [
                {
                    boundaries: [],
                    patternName: 'SOLID',
                    isSolid: true,
                    patternScale: 1,
                    patternAngle: 0,
                    color: undefined,
                    layer: '0',
                },
            ];
            const result = hatchesToSolidGeometries(hatches);

            expect(result).toHaveLength(0);
        });

        it('Z 위치에 오프셋 적용됨', () => {
            const hatches: ParsedHatch[] = [
                createRectangleHatch(0, 0, 100, 50),
            ];
            const result = hatchesToSolidGeometries(hatches);

            // zOffset이 적용되어 0보다 작아야 함
            expect(result[0]!.zPosition).toBeLessThan(0);
        });
    });

    describe('createPatternTexture', () => {
        it('패턴 텍스처 생성', () => {
            const hatch = createRectangleHatch(0, 0, 100, 50, false);
            const texture = createPatternTexture(hatch, '#ff0000');

            expect(texture).toBeDefined();
            expect(texture.image).toBeDefined();
        });

        it('패턴 각도 적용', () => {
            const hatch = createRectangleHatch(0, 0, 100, 50, false);
            hatch.patternAngle = 45;

            const texture = createPatternTexture(hatch, '#00ff00');
            expect(texture).toBeDefined();
        });

        it('패턴 스케일 적용', () => {
            const hatch = createRectangleHatch(0, 0, 100, 50, false);
            hatch.patternScale = 2;

            const texture = createPatternTexture(hatch, '#0000ff');
            expect(texture.repeat.x).not.toBe(0);
            expect(texture.repeat.y).not.toBe(0);
        });
    });

    describe('calculateBounds with HATCH', () => {
        it('HATCH 폴리라인 경계 바운딩 박스 계산', () => {
            const hatches: ParsedHatch[] = [
                createRectangleHatch(10, 20, 80, 60),
            ];
            const bounds = calculateBounds([], [], [], [], hatches);

            expect(bounds.min.x).toBe(10);
            expect(bounds.min.y).toBe(20);
            expect(bounds.max.x).toBe(90);
            expect(bounds.max.y).toBe(80);
        });

        it('HATCH 원형 경계 바운딩 박스 계산', () => {
            const hatches: ParsedHatch[] = [createCircleHatch(100, 100, 50)];
            const bounds = calculateBounds([], [], [], [], hatches);

            expect(bounds.min.x).toBe(50);
            expect(bounds.min.y).toBe(50);
            expect(bounds.max.x).toBe(150);
            expect(bounds.max.y).toBe(150);
        });

        it('LINE + HATCH 통합 바운딩 박스', () => {
            const lines: ParsedLine[] = [
                {
                    start: { x: 0, y: 0, z: 0 },
                    end: { x: 10, y: 10, z: 0 },
                    layer: undefined,
                },
            ];
            const hatches: ParsedHatch[] = [
                createRectangleHatch(100, 100, 50, 50),
            ];
            const bounds = calculateBounds(lines, [], [], [], hatches);

            expect(bounds.min.x).toBe(0);
            expect(bounds.min.y).toBe(0);
            expect(bounds.max.x).toBe(150);
            expect(bounds.max.y).toBe(150);
        });
    });
});
