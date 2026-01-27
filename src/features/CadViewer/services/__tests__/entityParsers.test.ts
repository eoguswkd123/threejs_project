/**
 * Entity Parsers Tests
 * DXF 엔티티 파싱 함수 테스트
 */

import { describe, expect, it } from 'vitest';

import {
    getTotalEntityCount,
    parseAllEntities,
    parseArc,
    parseCircle,
    parseHatch,
    parseHatchBoundary,
    parseLine,
    parsePolyline,
    toPoint3D,
    toPoint3DArray,
} from '../parsers';

import type { DXFLibEntity, DXFLibHatchBoundary } from '../../types';

// ============================================================
// 유틸리티 함수 테스트
// ============================================================

describe('toPoint3D', () => {
    it('유효한 포인트를 Point3D로 변환', () => {
        const point = { x: 10, y: 20, z: 30 };
        const result = toPoint3D(point);
        expect(result).toEqual({ x: 10, y: 20, z: 30 });
    });

    it('undefined 입력 시 원점 반환', () => {
        const result = toPoint3D(undefined);
        expect(result).toEqual({ x: 0, y: 0, z: 0 });
    });

    it('z 좌표 누락 시 0으로 기본값 설정', () => {
        const point = { x: 10, y: 20 };
        const result = toPoint3D(point);
        expect(result).toEqual({ x: 10, y: 20, z: 0 });
    });

    it('부분적 좌표 누락 시 0으로 기본값 설정', () => {
        const point = { x: 5 } as { x: number; y?: number; z?: number };
        const result = toPoint3D(point);
        expect(result).toEqual({ x: 5, y: 0, z: 0 });
    });
});

describe('toPoint3DArray', () => {
    it('포인트 배열을 Point3D 배열로 변환', () => {
        const points = [
            { x: 0, y: 0, z: 0 },
            { x: 10, y: 20, z: 30 },
        ];
        const result = toPoint3DArray(points);
        expect(result).toHaveLength(2);
        expect(result[0]).toEqual({ x: 0, y: 0, z: 0 });
        expect(result[1]).toEqual({ x: 10, y: 20, z: 30 });
    });

    it('undefined 입력 시 빈 배열 반환', () => {
        const result = toPoint3DArray(undefined);
        expect(result).toEqual([]);
    });

    it('빈 배열 입력 시 빈 배열 반환', () => {
        const result = toPoint3DArray([]);
        expect(result).toEqual([]);
    });
});

// ============================================================
// LINE 파싱 테스트
// ============================================================

describe('parseLine', () => {
    it('vertices가 있는 LINE 엔티티 파싱', () => {
        const entity: DXFLibEntity = {
            type: 'LINE',
            layer: 'Layer1',
            vertices: [
                { x: 0, y: 0, z: 0 },
                { x: 100, y: 100, z: 0 },
            ],
        };
        const result = parseLine(entity);
        expect(result).not.toBeNull();
        expect(result?.start).toEqual({ x: 0, y: 0, z: 0 });
        expect(result?.end).toEqual({ x: 100, y: 100, z: 0 });
        expect(result?.layer).toBe('Layer1');
    });

    it('start/end가 있는 LINE 엔티티 파싱', () => {
        const entity: DXFLibEntity = {
            type: 'LINE',
            layer: '0',
            start: { x: 50, y: 0, z: 0 },
            end: { x: 50, y: 100, z: 0 },
        };
        const result = parseLine(entity);
        expect(result).not.toBeNull();
        expect(result?.start).toEqual({ x: 50, y: 0, z: 0 });
        expect(result?.end).toEqual({ x: 50, y: 100, z: 0 });
    });

    it('vertices가 우선되어 사용됨', () => {
        const entity: DXFLibEntity = {
            type: 'LINE',
            layer: '0',
            vertices: [
                { x: 1, y: 1, z: 1 },
                { x: 2, y: 2, z: 2 },
            ],
            start: { x: 10, y: 10, z: 10 },
            end: { x: 20, y: 20, z: 20 },
        };
        const result = parseLine(entity);
        expect(result?.start).toEqual({ x: 1, y: 1, z: 1 });
        expect(result?.end).toEqual({ x: 2, y: 2, z: 2 });
    });

    it('유효하지 않은 LINE 엔티티는 null 반환', () => {
        const entity: DXFLibEntity = {
            type: 'LINE',
            layer: '0',
        };
        const result = parseLine(entity);
        expect(result).toBeNull();
    });

    it('vertices가 1개만 있으면 null 반환', () => {
        const entity: DXFLibEntity = {
            type: 'LINE',
            layer: '0',
            vertices: [{ x: 0, y: 0, z: 0 }],
        };
        const result = parseLine(entity);
        expect(result).toBeNull();
    });
});

// ============================================================
// CIRCLE 파싱 테스트
// ============================================================

describe('parseCircle', () => {
    it('CIRCLE 엔티티 파싱', () => {
        const entity: DXFLibEntity = {
            type: 'CIRCLE',
            layer: 'Circles',
            center: { x: 50, y: 50, z: 0 },
            radius: 25,
        };
        const result = parseCircle(entity);
        expect(result).not.toBeNull();
        expect(result!.center).toEqual({ x: 50, y: 50, z: 0 });
        expect(result!.radius).toBe(25);
        expect(result!.layer).toBe('Circles');
    });

    it('center 누락 시 원점 사용', () => {
        const entity: DXFLibEntity = {
            type: 'CIRCLE',
            layer: '0',
            radius: 10,
        };
        const result = parseCircle(entity);
        expect(result).not.toBeNull();
        expect(result!.center).toEqual({ x: 0, y: 0, z: 0 });
    });

    it('radius 누락 시 기본값 1 사용', () => {
        const entity: DXFLibEntity = {
            type: 'CIRCLE',
            layer: '0',
            center: { x: 0, y: 0, z: 0 },
        };
        const result = parseCircle(entity);
        expect(result).not.toBeNull();
        expect(result!.radius).toBe(1);
    });
});

// ============================================================
// ARC 파싱 테스트
// ============================================================

describe('parseArc', () => {
    it('ARC 엔티티 파싱', () => {
        const entity: DXFLibEntity = {
            type: 'ARC',
            layer: 'Arcs',
            center: { x: 100, y: 100, z: 0 },
            radius: 50,
            startAngle: 0,
            endAngle: 90,
        };
        const result = parseArc(entity);
        expect(result).not.toBeNull();
        expect(result!.center).toEqual({ x: 100, y: 100, z: 0 });
        expect(result!.radius).toBe(50);
        expect(result!.startAngle).toBe(0);
        expect(result!.endAngle).toBe(90);
        expect(result!.layer).toBe('Arcs');
    });

    it('각도 누락 시 기본값 사용', () => {
        const entity: DXFLibEntity = {
            type: 'ARC',
            layer: '0',
            center: { x: 0, y: 0, z: 0 },
            radius: 10,
        };
        const result = parseArc(entity);
        expect(result).not.toBeNull();
        expect(result!.startAngle).toBe(0);
        expect(result!.endAngle).toBe(360);
    });
});

// ============================================================
// POLYLINE 파싱 테스트
// ============================================================

describe('parsePolyline', () => {
    it('LWPOLYLINE 엔티티 파싱', () => {
        const entity: DXFLibEntity = {
            type: 'LWPOLYLINE',
            layer: '0',
            vertices: [
                { x: 0, y: 0, z: 0 },
                { x: 100, y: 0, z: 0 },
                { x: 100, y: 100, z: 0 },
            ],
            shape: true,
        };
        const result = parsePolyline(entity);
        expect(result).not.toBeNull();
        expect(result?.vertices).toHaveLength(3);
        expect(result?.closed).toBe(true);
        expect(result?.layer).toBe('0');
    });

    it('POLYLINE 엔티티 파싱', () => {
        const entity: DXFLibEntity = {
            type: 'POLYLINE',
            layer: 'Polylines',
            vertices: [
                { x: 0, y: 0, z: 0 },
                { x: 50, y: 50, z: 0 },
            ],
            shape: false,
        };
        const result = parsePolyline(entity);
        expect(result).not.toBeNull();
        expect(result?.vertices).toHaveLength(2);
        expect(result?.closed).toBe(false);
    });

    it('vertices가 2개 미만이면 null 반환', () => {
        const entity: DXFLibEntity = {
            type: 'LWPOLYLINE',
            layer: '0',
            vertices: [{ x: 0, y: 0, z: 0 }],
        };
        const result = parsePolyline(entity);
        expect(result).toBeNull();
    });

    it('vertices가 없으면 null 반환', () => {
        const entity: DXFLibEntity = {
            type: 'LWPOLYLINE',
            layer: '0',
        };
        const result = parsePolyline(entity);
        expect(result).toBeNull();
    });
});

// ============================================================
// HATCH 경계 파싱 테스트
// ============================================================

describe('parseHatchBoundary', () => {
    it('폴리라인 경계 파싱', () => {
        const boundary: DXFLibHatchBoundary = {
            vertices: [
                { x: 0, y: 0, z: 0 },
                { x: 100, y: 0, z: 0 },
                { x: 100, y: 100, z: 0 },
            ],
        };
        const result = parseHatchBoundary(boundary);
        expect(result).not.toBeNull();
        expect(result?.type).toBe('polyline');
        if (result?.type === 'polyline') {
            expect(result.vertices).toHaveLength(3);
            expect(result.closed).toBe(true);
        }
    });

    it('원형 경계 파싱', () => {
        const boundary: DXFLibHatchBoundary = {
            center: { x: 50, y: 50, z: 0 },
            radius: 25,
        };
        const result = parseHatchBoundary(boundary);
        expect(result).not.toBeNull();
        expect(result?.type).toBe('circle');
        if (result?.type === 'circle') {
            expect(result.center).toEqual({ x: 50, y: 50, z: 0 });
            expect(result.radius).toBe(25);
        }
    });

    it('호형 경계 파싱', () => {
        const boundary: DXFLibHatchBoundary = {
            center: { x: 50, y: 50, z: 0 },
            radius: 25,
            startAngle: 0,
            endAngle: 180,
        };
        const result = parseHatchBoundary(boundary);
        expect(result).not.toBeNull();
        expect(result?.type).toBe('arc');
        if (result?.type === 'arc') {
            expect(result.startAngle).toBe(0);
            expect(result.endAngle).toBe(180);
        }
    });

    it('유효하지 않은 경계는 null 반환', () => {
        const boundary: DXFLibHatchBoundary = {};
        const result = parseHatchBoundary(boundary);
        expect(result).toBeNull();
    });

    it('vertices가 3개 미만이면 null 반환', () => {
        const boundary: DXFLibHatchBoundary = {
            vertices: [
                { x: 0, y: 0, z: 0 },
                { x: 100, y: 0, z: 0 },
            ],
        };
        const result = parseHatchBoundary(boundary);
        expect(result).toBeNull();
    });
});

// ============================================================
// HATCH 파싱 테스트
// ============================================================

describe('parseHatch', () => {
    it('HATCH 엔티티 파싱', () => {
        const entity: DXFLibEntity = {
            type: 'HATCH',
            layer: 'Hatches',
            boundary: [
                {
                    vertices: [
                        { x: 0, y: 0, z: 0 },
                        { x: 100, y: 0, z: 0 },
                        { x: 100, y: 100, z: 0 },
                    ],
                },
            ],
            patternName: 'SOLID',
            solidFill: 1,
            patternScale: 1.5,
            patternAngle: 45,
            colorIndex: 1,
        };
        const result = parseHatch(entity);
        expect(result).not.toBeNull();
        expect(result?.boundaries).toHaveLength(1);
        expect(result?.patternName).toBe('SOLID');
        expect(result?.isSolid).toBe(true);
        expect(result?.patternScale).toBe(1.5);
        expect(result?.patternAngle).toBe(45);
        expect(result?.color).toBe(1);
        expect(result?.layer).toBe('Hatches');
    });

    it('경계가 없으면 null 반환', () => {
        const entity: DXFLibEntity = {
            type: 'HATCH',
            layer: '0',
        };
        const result = parseHatch(entity);
        expect(result).toBeNull();
    });

    it('유효한 경계가 없으면 null 반환', () => {
        const entity: DXFLibEntity = {
            type: 'HATCH',
            layer: '0',
            boundary: [{}],
        };
        const result = parseHatch(entity);
        expect(result).toBeNull();
    });

    it('patternName이 SOLID면 isSolid가 true', () => {
        const entity: DXFLibEntity = {
            type: 'HATCH',
            layer: '0',
            boundary: [
                {
                    vertices: [
                        { x: 0, y: 0, z: 0 },
                        { x: 100, y: 0, z: 0 },
                        { x: 100, y: 100, z: 0 },
                    ],
                },
            ],
            patternName: 'SOLID',
        };
        const result = parseHatch(entity);
        expect(result?.isSolid).toBe(true);
    });
});

// ============================================================
// 배치 파싱 테스트
// ============================================================

describe('parseAllEntities', () => {
    it('모든 엔티티 타입 파싱', () => {
        const entities: DXFLibEntity[] = [
            {
                type: 'LINE',
                layer: '0',
                vertices: [
                    { x: 0, y: 0, z: 0 },
                    { x: 100, y: 100, z: 0 },
                ],
            },
            {
                type: 'CIRCLE',
                layer: '0',
                center: { x: 50, y: 50, z: 0 },
                radius: 25,
            },
            {
                type: 'ARC',
                layer: '0',
                center: { x: 100, y: 100, z: 0 },
                radius: 30,
                startAngle: 0,
                endAngle: 90,
            },
            {
                type: 'LWPOLYLINE',
                layer: '0',
                vertices: [
                    { x: 0, y: 0, z: 0 },
                    { x: 50, y: 50, z: 0 },
                ],
            },
        ];

        const result = parseAllEntities(entities);
        expect(result.lines).toHaveLength(1);
        expect(result.circles).toHaveLength(1);
        expect(result.arcs).toHaveLength(1);
        expect(result.polylines).toHaveLength(1);
        expect(result.hatches).toHaveLength(0);
    });

    it('지원하지 않는 엔티티 무시', () => {
        const entities: DXFLibEntity[] = [
            {
                type: 'TEXT',
                layer: '0',
            } as DXFLibEntity,
            {
                type: 'DIMENSION',
                layer: '0',
            } as DXFLibEntity,
        ];

        const result = parseAllEntities(entities);
        expect(result.lines).toHaveLength(0);
        expect(result.circles).toHaveLength(0);
        expect(result.arcs).toHaveLength(0);
        expect(result.polylines).toHaveLength(0);
        expect(result.hatches).toHaveLength(0);
    });

    it('빈 배열 입력 처리', () => {
        const result = parseAllEntities([]);
        expect(result.lines).toHaveLength(0);
        expect(result.circles).toHaveLength(0);
        expect(result.arcs).toHaveLength(0);
        expect(result.polylines).toHaveLength(0);
        expect(result.hatches).toHaveLength(0);
    });

    it('콜백 함수 호출', () => {
        const entities: DXFLibEntity[] = [
            {
                type: 'LINE',
                layer: '0',
                vertices: [
                    { x: 0, y: 0, z: 0 },
                    { x: 100, y: 100, z: 0 },
                ],
            },
            {
                type: 'CIRCLE',
                layer: '0',
                center: { x: 50, y: 50, z: 0 },
                radius: 25,
            },
        ];

        const callbackCalls: Array<[number, number]> = [];
        parseAllEntities(entities, (index, total) => {
            callbackCalls.push([index, total]);
        });

        expect(callbackCalls).toHaveLength(2);
        expect(callbackCalls[0]).toEqual([0, 2]);
        expect(callbackCalls[1]).toEqual([1, 2]);
    });
});

describe('getTotalEntityCount', () => {
    it('총 엔티티 수 계산', () => {
        const entities = {
            lines: [
                {
                    start: { x: 0, y: 0, z: 0 },
                    end: { x: 1, y: 1, z: 1 },
                    layer: '0',
                },
            ],
            circles: [
                { center: { x: 0, y: 0, z: 0 }, radius: 1, layer: '0' },
                { center: { x: 1, y: 1, z: 1 }, radius: 2, layer: '0' },
            ],
            arcs: [],
            polylines: [{ vertices: [], closed: false, layer: '0' }],
            hatches: [],
            // Phase 2.1.4: 추가 엔티티
            texts: [],
            mtexts: [],
            ellipses: [],
            splines: [],
            dimensions: [],
        };

        const count = getTotalEntityCount(entities);
        expect(count).toBe(4);
    });

    it('빈 엔티티는 0 반환', () => {
        const entities = {
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
        };

        const count = getTotalEntityCount(entities);
        expect(count).toBe(0);
    });
});
