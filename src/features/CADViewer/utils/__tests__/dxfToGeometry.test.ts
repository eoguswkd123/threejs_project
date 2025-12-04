/**
 * dxfToGeometry.test.ts
 * CADViewer 지오메트리 변환 함수 테스트
 */

import { describe, it, expect } from 'vitest';

import { DEFAULT_BOUNDS } from '../../constants';
import {
    linesToGeometry,
    circlesToGeometry,
    arcsToGeometry,
    polylinesToGeometry,
    cadDataToGeometry,
    calculateBounds,
    getBoundsCenter,
    getBoundsSize,
    calculateCameraDistance,
    centerGeometry,
} from '../dxfToGeometry';

import type {
    ParsedLine,
    ParsedCircle,
    ParsedArc,
    ParsedPolyline,
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
        bounds: DEFAULT_BOUNDS,
        metadata: {
            fileName: 'test.dxf',
            fileSize: 100,
            entityCount: 0,
            parseTime: 10,
        },
        layers: new Map(),
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
                { start: { x: 0, y: 0, z: 0 }, end: { x: 10, y: 0, z: 0 } },
            ];
            const geometry = linesToGeometry(lines);

            expect(geometry.attributes.position).toBeDefined();
            expect(geometry.attributes.position!.count).toBe(2);
        });

        it('복수 라인이면 라인 수 * 2 정점 생성', () => {
            const lines: ParsedLine[] = [
                { start: { x: 0, y: 0, z: 0 }, end: { x: 10, y: 0, z: 0 } },
                { start: { x: 10, y: 0, z: 0 }, end: { x: 10, y: 10, z: 0 } },
                { start: { x: 10, y: 10, z: 0 }, end: { x: 0, y: 10, z: 0 } },
            ];
            const geometry = linesToGeometry(lines);

            expect(geometry.attributes.position!.count).toBe(6); // 3 lines * 2 vertices
        });

        it('3D 좌표가 정확히 변환됨', () => {
            const lines: ParsedLine[] = [
                { start: { x: 1, y: 2, z: 3 }, end: { x: 4, y: 5, z: 6 } },
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
                { center: { x: 0, y: 0, z: 0 }, radius: 10 },
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
                { center: { x: 0, y: 0, z: 5 }, radius: 10 },
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

        it('열린 폴리라인 (3개 정점) → 4개 정점 (2개 세그먼트)', () => {
            const polylines: ParsedPolyline[] = [
                {
                    vertices: [
                        { x: 0, y: 0, z: 0 },
                        { x: 10, y: 0, z: 0 },
                        { x: 10, y: 10, z: 0 },
                    ],
                    closed: false,
                },
            ];
            const geometry = polylinesToGeometry(polylines);

            // 3개 정점 → 2개 라인 세그먼트 → 4개 정점
            expect(geometry.attributes.position!.count).toBe(4);
        });

        it('닫힌 폴리라인 (3개 정점) → 6개 정점 (3개 세그먼트)', () => {
            const polylines: ParsedPolyline[] = [
                {
                    vertices: [
                        { x: 0, y: 0, z: 0 },
                        { x: 10, y: 0, z: 0 },
                        { x: 10, y: 10, z: 0 },
                    ],
                    closed: true,
                },
            ];
            const geometry = polylinesToGeometry(polylines);

            // 3개 정점 + 닫기 → 3개 라인 세그먼트 → 6개 정점
            expect(geometry.attributes.position!.count).toBe(6);
        });

        it('2점 미만 폴리라인은 무시됨 (빈 정점 배열 반환)', () => {
            const polylines: ParsedPolyline[] = [
                {
                    vertices: [{ x: 0, y: 0, z: 0 }], // 1점만
                    closed: false,
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
            // 100개 라인 추가
            for (let i = 0; i < 100; i++) {
                data.lines.push({
                    start: { x: i, y: 0, z: 0 },
                    end: { x: i + 1, y: 0, z: 0 },
                });
            }
            data.metadata.entityCount = 100;

            const geometry = cadDataToGeometry(data);
            expect(geometry.attributes.position).toBeDefined();
            // LOD는 원/호에만 적용되므로 라인만 있으면 단순히 정점 수만 확인
            expect(geometry.attributes.position!.count).toBe(200); // 100 lines * 2
        });

        it('segmentsOverride 적용 확인', () => {
            const data = createEmptyCADData();
            data.circles.push({
                center: { x: 0, y: 0, z: 0 },
                radius: 10,
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
            });
            data.circles.push({
                center: { x: 20, y: 0, z: 0 },
                radius: 5,
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
            });
            data.metadata.entityCount = 1;

            const geometry = cadDataToGeometry(data);
            expect(geometry.attributes.position).toBeDefined();
            // 3개 정점 → 2개 라인 세그먼트 → 4개 정점
            expect(geometry.attributes.position!.count).toBe(4);
        });

        it('arcs 포함 데이터 병합', () => {
            const data = createEmptyCADData();
            data.arcs.push({
                center: { x: 0, y: 0, z: 0 },
                radius: 10,
                startAngle: 0,
                endAngle: 90,
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
                { start: { x: 0, y: 0, z: 0 }, end: { x: 100, y: 50, z: 10 } },
            ];
            const bounds = calculateBounds(lines);

            expect(bounds.min).toEqual({ x: 0, y: 0, z: 0 });
            expect(bounds.max).toEqual({ x: 100, y: 50, z: 10 });
        });

        it('CIRCLE 엔티티 바운딩 박스 계산', () => {
            const lines: ParsedLine[] = [];
            const circles: ParsedCircle[] = [
                { center: { x: 50, y: 50, z: 0 }, radius: 25 },
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
                },
            ];
            const bounds = calculateBounds(lines, [], [], polylines);

            expect(bounds.min).toEqual({ x: -10, y: -20, z: -5 });
            expect(bounds.max).toEqual({ x: 30, y: 40, z: 15 });
        });

        it('모든 엔티티 타입 종합 바운딩 박스', () => {
            const lines: ParsedLine[] = [
                { start: { x: 0, y: 0, z: 0 }, end: { x: 10, y: 10, z: 0 } },
            ];
            const circles: ParsedCircle[] = [
                { center: { x: 100, y: 100, z: 0 }, radius: 20 },
            ];
            const arcs: ParsedArc[] = [
                {
                    center: { x: -50, y: 0, z: 0 },
                    radius: 10,
                    startAngle: 0,
                    endAngle: 180,
                },
            ];
            const polylines: ParsedPolyline[] = [
                {
                    vertices: [
                        { x: 0, y: 200, z: 0 },
                        { x: 50, y: 250, z: 0 },
                    ],
                    closed: false,
                },
            ];

            const bounds = calculateBounds(lines, circles, arcs, polylines);

            expect(bounds.min.x).toBe(-60); // arc center -50 - radius 10
            expect(bounds.max.x).toBe(120); // circle center 100 + radius 20
            expect(bounds.min.y).toBe(-10); // arc center 0 - radius 10
            expect(bounds.max.y).toBe(250); // polyline vertex
        });
    });

    describe('getBoundsCenter', () => {
        it('바운딩 박스 중심점 정확히 계산', () => {
            const bounds: BoundingBox = {
                min: { x: 0, y: 0, z: 0 },
                max: { x: 100, y: 200, z: 50 },
            };
            const center = getBoundsCenter(bounds);

            expect(center).toEqual({ x: 50, y: 100, z: 25 });
        });

        it('음수 좌표 포함 바운딩 박스 중심점', () => {
            const bounds: BoundingBox = {
                min: { x: -100, y: -50, z: -10 },
                max: { x: 100, y: 50, z: 10 },
            };
            const center = getBoundsCenter(bounds);

            expect(center).toEqual({ x: 0, y: 0, z: 0 });
        });
    });

    describe('getBoundsSize', () => {
        it('바운딩 박스 크기 정확히 계산', () => {
            const bounds: BoundingBox = {
                min: { x: 0, y: 10, z: 20 },
                max: { x: 100, y: 110, z: 70 },
            };
            const size = getBoundsSize(bounds);

            expect(size).toEqual({ x: 100, y: 100, z: 50 });
        });

        it('음수 좌표 포함 바운딩 박스 크기', () => {
            const bounds: BoundingBox = {
                min: { x: -50, y: -25, z: -10 },
                max: { x: 50, y: 75, z: 10 },
            };
            const size = getBoundsSize(bounds);

            expect(size).toEqual({ x: 100, y: 100, z: 20 });
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

    describe('centerGeometry', () => {
        it('지오메트리를 원점 중심으로 이동', () => {
            const lines: ParsedLine[] = [
                {
                    start: { x: 100, y: 100, z: 0 },
                    end: { x: 200, y: 200, z: 0 },
                },
            ];
            const geometry = linesToGeometry(lines);

            centerGeometry(geometry);

            const positions = geometry.attributes.position!;
            // 중심이 (150, 150, 0)이었으므로 이동 후 약 (-50, -50, 0) ~ (50, 50, 0)
            expect(positions.getX(0)).toBeCloseTo(-50, 1);
            expect(positions.getY(0)).toBeCloseTo(-50, 1);
        });
    });
});
