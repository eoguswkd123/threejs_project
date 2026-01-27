/**
 * cadDataUtils.test.ts
 * CAD 데이터 유틸리티 테스트
 *
 * 테스트 범위:
 * - filterDataByLayerName: 레이어 필터링
 * - filterHatchesByLayerName: HATCH 레이어 필터링
 * - getTextAnchors: MText 앵커 변환
 * - getWireframeEntityCount: 와이어프레임 엔티티 집계
 */

import { describe, it, expect } from 'vitest';

import type { ParsedCADData, ParsedHatch } from '@/types/cad';

import {
    filterDataByLayerName,
    filterHatchesByLayerName,
    getTextAnchors,
    getWireframeEntityCount,
} from '../cadDataUtils';

// ============================================================
// Test Helpers
// ============================================================

/**
 * 빈 ParsedCADData 생성
 */
function createEmptyCADData(): ParsedCADData {
    return {
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
}

/**
 * 테스트용 CAD 데이터 생성
 */
function createTestCADData(): ParsedCADData {
    return {
        lines: [
            {
                start: { x: 0, y: 0, z: 0 },
                end: { x: 10, y: 0, z: 0 },
                layer: 'Layer1',
            },
            {
                start: { x: 0, y: 0, z: 0 },
                end: { x: 0, y: 10, z: 0 },
                layer: 'Layer2',
            },
            {
                start: { x: 0, y: 0, z: 0 },
                end: { x: 10, y: 10, z: 0 },
                layer: undefined,
            },
        ],
        circles: [
            { center: { x: 5, y: 5, z: 0 }, radius: 3, layer: 'Layer1' },
            { center: { x: 15, y: 5, z: 0 }, radius: 2, layer: 'Layer2' },
        ],
        arcs: [
            {
                center: { x: 0, y: 0, z: 0 },
                radius: 5,
                startAngle: 0,
                endAngle: 90,
                layer: 'Layer1',
            },
        ],
        polylines: [
            {
                vertices: [
                    { x: 0, y: 0, z: 0 },
                    { x: 10, y: 0, z: 0 },
                    { x: 10, y: 10, z: 0 },
                ],
                closed: true,
                layer: 'Layer2',
            },
        ],
        hatches: [
            {
                patternName: 'SOLID',
                isSolid: true,
                patternScale: 1,
                patternAngle: 0,
                color: undefined,
                layer: 'Layer1',
                boundaries: [],
            },
            {
                patternName: 'ANSI31',
                isSolid: false,
                patternScale: 1,
                patternAngle: 45,
                color: undefined,
                layer: 'Layer2',
                boundaries: [],
            },
        ],
        texts: [
            {
                content: 'Test1',
                position: { x: 0, y: 0, z: 0 },
                height: 2.5,
                rotation: 0,
                alignment: 'left',
                styleName: undefined,
                layer: 'Layer1',
            },
        ],
        mtexts: [
            {
                content: 'MText1',
                rawContent: 'MText1',
                position: { x: 5, y: 5, z: 0 },
                height: 3,
                width: 20,
                rotation: 0,
                attachment: 'top-left',
                layer: 'Layer2',
            },
        ],
        ellipses: [
            {
                center: { x: 10, y: 10, z: 0 },
                majorAxisEnd: { x: 5, y: 0, z: 0 },
                minorAxisRatio: 0.5,
                startParam: 0,
                endParam: Math.PI * 2,
                layer: 'Layer1',
            },
        ],
        splines: [
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
                layer: 'Layer2',
            },
        ],
        dimensions: [
            {
                dimensionType: 'linear',
                defPoint1: { x: 0, y: 0, z: 0 },
                defPoint2: { x: 10, y: 0, z: 0 },
                defPoint3: undefined,
                defPoint4: undefined,
                textMidPoint: { x: 5, y: 2, z: 0 },
                text: '10',
                rotation: 0,
                styleName: undefined,
                layer: 'Layer1',
            },
        ],
        bounds: { min: { x: 0, y: 0, z: 0 }, max: { x: 20, y: 20, z: 0 } },
        metadata: {
            fileName: 'test.dxf',
            fileSize: 1000,
            entityCount: 12,
            parseTime: 10,
        },
        layers: {
            Layer1: {
                name: 'Layer1',
                color: '#FF0000',
                visible: true,
                entityCount: 5,
            },
            Layer2: {
                name: 'Layer2',
                color: '#00FF00',
                visible: true,
                entityCount: 5,
            },
        },
    };
}

// ============================================================
// filterDataByLayerName Tests
// ============================================================

describe('filterDataByLayerName', () => {
    it('should filter all entity types by layer name', () => {
        const data = createTestCADData();
        const filtered = filterDataByLayerName(data, 'Layer1');

        expect(filtered.lines.length).toBe(1);
        expect(filtered.circles.length).toBe(1);
        expect(filtered.arcs.length).toBe(1);
        expect(filtered.polylines.length).toBe(0);
        expect(filtered.hatches.length).toBe(1);
        expect(filtered.texts.length).toBe(1);
        expect(filtered.mtexts.length).toBe(0);
        expect(filtered.ellipses.length).toBe(1);
        expect(filtered.splines.length).toBe(0);
        expect(filtered.dimensions.length).toBe(1);
    });

    it('should filter entities for Layer2', () => {
        const data = createTestCADData();
        const filtered = filterDataByLayerName(data, 'Layer2');

        expect(filtered.lines.length).toBe(1);
        expect(filtered.circles.length).toBe(1);
        expect(filtered.arcs.length).toBe(0);
        expect(filtered.polylines.length).toBe(1);
        expect(filtered.hatches.length).toBe(1);
        expect(filtered.texts.length).toBe(0);
        expect(filtered.mtexts.length).toBe(1);
        expect(filtered.ellipses.length).toBe(0);
        expect(filtered.splines.length).toBe(1);
        expect(filtered.dimensions.length).toBe(0);
    });

    it('should treat undefined layer as "0"', () => {
        const data = createTestCADData();
        const filtered = filterDataByLayerName(data, '0');

        // data.lines[2] has layer: undefined
        expect(filtered.lines.length).toBe(1);
        expect(filtered.lines[0]!.layer).toBeUndefined();
    });

    it('should return empty arrays for non-existent layer', () => {
        const data = createTestCADData();
        const filtered = filterDataByLayerName(data, 'NonExistent');

        expect(filtered.lines.length).toBe(0);
        expect(filtered.circles.length).toBe(0);
        expect(filtered.arcs.length).toBe(0);
        expect(filtered.polylines.length).toBe(0);
        expect(filtered.hatches.length).toBe(0);
        expect(filtered.texts.length).toBe(0);
        expect(filtered.mtexts.length).toBe(0);
        expect(filtered.ellipses.length).toBe(0);
        expect(filtered.splines.length).toBe(0);
        expect(filtered.dimensions.length).toBe(0);
    });

    it('should handle empty CAD data', () => {
        const data = createEmptyCADData();
        const filtered = filterDataByLayerName(data, 'Layer1');

        expect(filtered.lines.length).toBe(0);
        expect(filtered.circles.length).toBe(0);
    });

    it('should preserve layers in filtered data', () => {
        const data = createTestCADData();
        const filtered = filterDataByLayerName(data, 'Layer1');

        expect(filtered.layers).toBe(data.layers);
        expect(Object.keys(filtered.layers).length).toBe(2);
    });
});

// ============================================================
// filterHatchesByLayerName Tests
// ============================================================

describe('filterHatchesByLayerName', () => {
    const hatches: ParsedHatch[] = [
        {
            patternName: 'SOLID',
            isSolid: true,
            patternScale: 1,
            patternAngle: 0,
            color: undefined,
            layer: 'Layer1',
            boundaries: [],
        },
        {
            patternName: 'ANSI31',
            isSolid: false,
            patternScale: 1,
            patternAngle: 45,
            color: undefined,
            layer: 'Layer2',
            boundaries: [],
        },
        {
            patternName: 'SOLID',
            isSolid: true,
            patternScale: 1,
            patternAngle: 0,
            color: undefined,
            layer: 'Layer1',
            boundaries: [],
        },
        {
            patternName: 'SOLID',
            isSolid: true,
            patternScale: 1,
            patternAngle: 0,
            color: undefined,
            layer: undefined,
            boundaries: [],
        },
    ];

    it('should filter hatches by Layer1', () => {
        const filtered = filterHatchesByLayerName(hatches, 'Layer1');

        expect(filtered.length).toBe(2);
        expect(filtered.every((h) => h.layer === 'Layer1')).toBe(true);
    });

    it('should filter hatches by Layer2', () => {
        const filtered = filterHatchesByLayerName(hatches, 'Layer2');

        expect(filtered.length).toBe(1);
        expect(filtered[0]!.patternName).toBe('ANSI31');
    });

    it('should treat undefined layer as "0"', () => {
        const filtered = filterHatchesByLayerName(hatches, '0');

        expect(filtered.length).toBe(1);
        expect(filtered[0]!.layer).toBeUndefined();
    });

    it('should return empty array for non-existent layer', () => {
        const filtered = filterHatchesByLayerName(hatches, 'NonExistent');

        expect(filtered.length).toBe(0);
    });

    it('should handle empty hatches array', () => {
        const filtered = filterHatchesByLayerName([], 'Layer1');

        expect(filtered.length).toBe(0);
    });
});

// ============================================================
// getTextAnchors Tests
// ============================================================

describe('getTextAnchors', () => {
    describe('top-* attachments', () => {
        it('should convert top-left', () => {
            const result = getTextAnchors('top-left');

            expect(result.anchorX).toBe('left');
            expect(result.anchorY).toBe('top');
        });

        it('should convert top-center', () => {
            const result = getTextAnchors('top-center');

            expect(result.anchorX).toBe('center');
            expect(result.anchorY).toBe('top');
        });

        it('should convert top-right', () => {
            const result = getTextAnchors('top-right');

            expect(result.anchorX).toBe('right');
            expect(result.anchorY).toBe('top');
        });
    });

    describe('middle-* attachments', () => {
        it('should convert middle-left', () => {
            const result = getTextAnchors('middle-left');

            expect(result.anchorX).toBe('left');
            expect(result.anchorY).toBe('middle');
        });

        it('should convert middle-center', () => {
            const result = getTextAnchors('middle-center');

            expect(result.anchorX).toBe('center');
            expect(result.anchorY).toBe('middle');
        });

        it('should convert middle-right', () => {
            const result = getTextAnchors('middle-right');

            expect(result.anchorX).toBe('right');
            expect(result.anchorY).toBe('middle');
        });
    });

    describe('bottom-* attachments', () => {
        it('should convert bottom-left', () => {
            const result = getTextAnchors('bottom-left');

            expect(result.anchorX).toBe('left');
            expect(result.anchorY).toBe('bottom');
        });

        it('should convert bottom-center', () => {
            const result = getTextAnchors('bottom-center');

            expect(result.anchorX).toBe('center');
            expect(result.anchorY).toBe('bottom');
        });

        it('should convert bottom-right', () => {
            const result = getTextAnchors('bottom-right');

            expect(result.anchorX).toBe('right');
            expect(result.anchorY).toBe('bottom');
        });
    });

    it('should return correct type structure', () => {
        const result = getTextAnchors('middle-center');

        expect(typeof result.anchorX).toBe('string');
        expect(typeof result.anchorY).toBe('string');
        expect(['left', 'center', 'right']).toContain(result.anchorX);
        expect(['top', 'middle', 'bottom']).toContain(result.anchorY);
    });
});

// ============================================================
// getWireframeEntityCount Tests
// ============================================================

describe('getWireframeEntityCount', () => {
    it('should count all wireframe entities', () => {
        const data = createTestCADData();
        const count = getWireframeEntityCount(data);

        // 3 lines + 2 circles + 1 arc + 1 polyline = 7
        expect(count).toBe(7);
    });

    it('should return 0 for empty data', () => {
        const data = createEmptyCADData();
        const count = getWireframeEntityCount(data);

        expect(count).toBe(0);
    });

    it('should only count LINE, CIRCLE, ARC, POLYLINE', () => {
        const data: ParsedCADData = {
            lines: [
                {
                    start: { x: 0, y: 0, z: 0 },
                    end: { x: 10, y: 0, z: 0 },
                    layer: 'L',
                },
            ],
            circles: [],
            arcs: [],
            polylines: [],
            hatches: [
                {
                    patternName: 'SOLID',
                    isSolid: true,
                    patternScale: 1,
                    patternAngle: 0,
                    color: undefined,
                    layer: 'L',
                    boundaries: [],
                },
            ],
            texts: [
                {
                    content: 'T',
                    position: { x: 0, y: 0, z: 0 },
                    height: 1,
                    rotation: 0,
                    alignment: 'left' as const,
                    styleName: undefined,
                    layer: 'L',
                },
            ],
            mtexts: [],
            ellipses: [
                {
                    center: { x: 0, y: 0, z: 0 },
                    majorAxisEnd: { x: 5, y: 0, z: 0 },
                    minorAxisRatio: 0.5,
                    startParam: 0,
                    endParam: Math.PI * 2,
                    layer: 'L',
                },
            ],
            splines: [],
            dimensions: [],
            layers: {},
            bounds: { min: { x: 0, y: 0, z: 0 }, max: { x: 10, y: 10, z: 0 } },
            metadata: {
                fileName: 'test.dxf',
                fileSize: 100,
                entityCount: 4,
                parseTime: 1,
            },
        };

        const count = getWireframeEntityCount(data);

        // Only 1 line should be counted
        // hatches, texts, ellipses are NOT counted
        expect(count).toBe(1);
    });

    it('should correctly sum multiple entity types', () => {
        const data: ParsedCADData = {
            lines: [
                {
                    start: { x: 0, y: 0, z: 0 },
                    end: { x: 1, y: 0, z: 0 },
                    layer: 'L',
                },
                {
                    start: { x: 0, y: 0, z: 0 },
                    end: { x: 0, y: 1, z: 0 },
                    layer: 'L',
                },
            ],
            circles: [
                { center: { x: 0, y: 0, z: 0 }, radius: 1, layer: 'L' },
                { center: { x: 5, y: 5, z: 0 }, radius: 2, layer: 'L' },
                { center: { x: 10, y: 10, z: 0 }, radius: 3, layer: 'L' },
            ],
            arcs: [
                {
                    center: { x: 0, y: 0, z: 0 },
                    radius: 1,
                    startAngle: 0,
                    endAngle: 90,
                    layer: 'L',
                },
            ],
            polylines: [],
            hatches: [],
            texts: [],
            mtexts: [],
            ellipses: [],
            splines: [],
            dimensions: [],
            layers: {},
            bounds: { min: { x: 0, y: 0, z: 0 }, max: { x: 10, y: 10, z: 0 } },
            metadata: {
                fileName: 'test.dxf',
                fileSize: 100,
                entityCount: 6,
                parseTime: 1,
            },
        };

        const count = getWireframeEntityCount(data);

        // 2 lines + 3 circles + 1 arc + 0 polylines = 6
        expect(count).toBe(6);
    });
});

// ============================================================
// Edge Cases
// ============================================================

describe('Edge Cases', () => {
    it('filterDataByLayerName should handle special characters in layer name', () => {
        const data = createEmptyCADData();
        data.lines = [
            {
                start: { x: 0, y: 0, z: 0 },
                end: { x: 1, y: 0, z: 0 },
                layer: 'Layer-1_Test',
            },
            {
                start: { x: 0, y: 0, z: 0 },
                end: { x: 0, y: 1, z: 0 },
                layer: 'Layer 2',
            },
        ];

        const filtered1 = filterDataByLayerName(data, 'Layer-1_Test');
        const filtered2 = filterDataByLayerName(data, 'Layer 2');

        expect(filtered1.lines.length).toBe(1);
        expect(filtered2.lines.length).toBe(1);
    });

    it('filterDataByLayerName should be case-sensitive', () => {
        const data = createEmptyCADData();
        data.lines = [
            {
                start: { x: 0, y: 0, z: 0 },
                end: { x: 1, y: 0, z: 0 },
                layer: 'Layer1',
            },
            {
                start: { x: 0, y: 0, z: 0 },
                end: { x: 0, y: 1, z: 0 },
                layer: 'LAYER1',
            },
            {
                start: { x: 0, y: 0, z: 0 },
                end: { x: 1, y: 1, z: 0 },
                layer: 'layer1',
            },
        ];

        expect(filterDataByLayerName(data, 'Layer1').lines.length).toBe(1);
        expect(filterDataByLayerName(data, 'LAYER1').lines.length).toBe(1);
        expect(filterDataByLayerName(data, 'layer1').lines.length).toBe(1);
    });

    it('filterDataByLayerName should handle empty string layer', () => {
        const data = createEmptyCADData();
        data.lines = [
            {
                start: { x: 0, y: 0, z: 0 },
                end: { x: 1, y: 0, z: 0 },
                layer: '',
            },
        ];

        const filtered = filterDataByLayerName(data, '');

        expect(filtered.lines.length).toBe(1);
    });
});
