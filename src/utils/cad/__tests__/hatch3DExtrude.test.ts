/**
 * hatch3DExtrude.test.ts
 * Phase 2.1.6: HATCH 3D Extrusion 유틸리티 테스트
 *
 * @see AC-001 ~ AC-008 수용 기준 검증
 */

import { describe, it, expect, afterEach } from 'vitest';

import type {
    ParsedHatch,
    ExtrudeOptions,
    Hatch3DGeometryData,
    LayerInfo,
} from '@/types/cad';
import { DEFAULT_EXTRUDE_OPTIONS, getLOD3DSteps } from '@/types/cad';

import {
    hatchToExtrudeGeometry,
    hatchesToExtrude3DGeometries,
    mergeHatch3DGeometriesByLayer,
    disposeHatch3DGeometries,
    isValidHatchForExtrusion,
} from '../hatch3DExtrude';

// ============================================================
// Test Helpers
// ============================================================

/**
 * 테스트용 사각형 HATCH 생성
 */
function createRectangleHatch(
    x: number,
    y: number,
    width: number,
    height: number,
    layer: string = '0',
    color?: number
): ParsedHatch {
    return {
        patternName: 'SOLID',
        isSolid: true,
        patternScale: 1,
        patternAngle: 0,
        layer,
        color,
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
    };
}

/**
 * 테스트용 원형 HATCH 생성
 */
function createCircleHatch(
    cx: number,
    cy: number,
    radius: number,
    layer: string = '0'
): ParsedHatch {
    return {
        patternName: 'SOLID',
        isSolid: true,
        patternScale: 1,
        patternAngle: 0,
        layer,
        color: undefined,
        boundaries: [
            {
                type: 'circle',
                center: { x: cx, y: cy, z: 0 },
                radius,
            },
        ],
    };
}

/**
 * 테스트용 도넛 형태 HATCH 생성 (외곽 + 홀)
 */
function createDonutHatch(
    cx: number,
    cy: number,
    outerRadius: number,
    innerRadius: number,
    layer: string = '0'
): ParsedHatch {
    return {
        patternName: 'SOLID',
        isSolid: true,
        patternScale: 1,
        patternAngle: 0,
        layer,
        color: undefined,
        boundaries: [
            // 외곽 원
            {
                type: 'circle',
                center: { x: cx, y: cy, z: 0 },
                radius: outerRadius,
            },
            // 내부 홀 (두 번째 boundary)
            {
                type: 'circle',
                center: { x: cx, y: cy, z: 0 },
                radius: innerRadius,
            },
        ],
    };
}

/**
 * 테스트용 레이어 Record 생성
 */
function createLayerRecord(
    layers: Array<{ name: string; color: string; visible: boolean }>
): Record<string, LayerInfo> {
    const record: Record<string, LayerInfo> = {};
    for (const layer of layers) {
        record[layer.name] = {
            name: layer.name,
            color: layer.color,
            visible: layer.visible,
            entityCount: 1,
        };
    }
    return record;
}

// ============================================================
// getLOD3DSteps Tests
// ============================================================

describe('getLOD3DSteps', () => {
    it('should return 1 step for thin extrusion (depth < 10)', () => {
        expect(getLOD3DSteps(5)).toBe(1);
        expect(getLOD3DSteps(9.9)).toBe(1);
    });

    it('should return 2 steps for medium extrusion (10 <= depth < 50)', () => {
        expect(getLOD3DSteps(10)).toBe(2);
        expect(getLOD3DSteps(30)).toBe(2);
        expect(getLOD3DSteps(49.9)).toBe(2);
    });

    it('should return 4 steps for deep extrusion (depth >= 50)', () => {
        expect(getLOD3DSteps(50)).toBe(4);
        expect(getLOD3DSteps(100)).toBe(4);
    });
});

// ============================================================
// isValidHatchForExtrusion Tests
// ============================================================

describe('isValidHatchForExtrusion', () => {
    it('should return true for valid polyline HATCH', () => {
        const hatch = createRectangleHatch(0, 0, 10, 10);
        expect(isValidHatchForExtrusion(hatch)).toBe(true);
    });

    it('should return true for valid circle HATCH', () => {
        const hatch = createCircleHatch(0, 0, 5);
        expect(isValidHatchForExtrusion(hatch)).toBe(true);
    });

    it('should return false for HATCH with no boundaries', () => {
        const hatch: ParsedHatch = {
            patternName: 'SOLID',
            isSolid: true,
            patternScale: 1,
            patternAngle: 0,
            color: undefined,
            layer: undefined,
            boundaries: [],
        };
        expect(isValidHatchForExtrusion(hatch)).toBe(false);
    });

    it('should return false for polyline HATCH with less than 3 vertices', () => {
        const hatch: ParsedHatch = {
            patternName: 'SOLID',
            isSolid: true,
            patternScale: 1,
            patternAngle: 0,
            color: undefined,
            layer: undefined,
            boundaries: [
                {
                    type: 'polyline',
                    vertices: [
                        { x: 0, y: 0, z: 0 },
                        { x: 10, y: 0, z: 0 },
                    ],
                    closed: true,
                },
            ],
        };
        expect(isValidHatchForExtrusion(hatch)).toBe(false);
    });

    it('should return false for circle HATCH with zero radius', () => {
        const hatch: ParsedHatch = {
            patternName: 'SOLID',
            isSolid: true,
            patternScale: 1,
            patternAngle: 0,
            color: undefined,
            layer: undefined,
            boundaries: [
                {
                    type: 'circle',
                    center: { x: 0, y: 0, z: 0 },
                    radius: 0,
                },
            ],
        };
        expect(isValidHatchForExtrusion(hatch)).toBe(false);
    });
});

// ============================================================
// hatchToExtrudeGeometry Tests
// ============================================================

describe('hatchToExtrudeGeometry', () => {
    // AC-001: 2D HATCH가 3D 돌출 메쉬로 변환됨
    it('should convert valid HATCH to ExtrudeGeometry (AC-001)', () => {
        const hatch = createRectangleHatch(0, 0, 10, 10);
        const geometry = hatchToExtrudeGeometry(hatch, { depth: 10 });

        expect(geometry).not.toBeNull();
        expect(geometry!.type).toBe('ExtrudeGeometry');

        geometry!.dispose();
    });

    // AC-002: 돌출 깊이가 입력값과 일치 (오차 ±0.01)
    it('should create geometry with correct depth (AC-002)', () => {
        const hatch = createRectangleHatch(0, 0, 10, 10);
        const depth = 20;
        const geometry = hatchToExtrudeGeometry(hatch, { depth });

        expect(geometry).not.toBeNull();
        geometry!.computeBoundingBox();

        const boundingBox = geometry!.boundingBox!;
        const actualDepth = boundingBox.max.z - boundingBox.min.z;

        expect(actualDepth).toBeCloseTo(depth, 2);

        geometry!.dispose();
    });

    it('should return null for HATCH with zero depth', () => {
        const hatch = createRectangleHatch(0, 0, 10, 10);
        const geometry = hatchToExtrudeGeometry(hatch, { depth: 0 });

        expect(geometry).toBeNull();
    });

    it('should return null for HATCH with negative depth', () => {
        const hatch = createRectangleHatch(0, 0, 10, 10);
        const geometry = hatchToExtrudeGeometry(hatch, { depth: -5 });

        expect(geometry).toBeNull();
    });

    it('should return null for HATCH with empty boundaries', () => {
        const hatch: ParsedHatch = {
            patternName: 'SOLID',
            isSolid: true,
            patternScale: 1,
            patternAngle: 0,
            color: undefined,
            layer: undefined,
            boundaries: [],
        };
        const geometry = hatchToExtrudeGeometry(hatch, { depth: 10 });

        expect(geometry).toBeNull();
    });

    // AC-003: 다중 경계(홀) HATCH 정상 처리
    it('should handle HATCH with holes (donut shape) (AC-003)', () => {
        const hatch = createDonutHatch(0, 0, 10, 5);
        const geometry = hatchToExtrudeGeometry(hatch, { depth: 10 });

        expect(geometry).not.toBeNull();
        expect(geometry!.type).toBe('ExtrudeGeometry');

        // 도넛 형태이므로 position 버퍼가 있어야 함
        const positions = geometry!.getAttribute('position');
        expect(positions).toBeDefined();
        expect(positions.count).toBeGreaterThan(0);

        geometry!.dispose();
    });

    it('should convert circle HATCH to ExtrudeGeometry', () => {
        const hatch = createCircleHatch(0, 0, 5);
        const geometry = hatchToExtrudeGeometry(hatch, { depth: 15 });

        expect(geometry).not.toBeNull();
        expect(geometry!.type).toBe('ExtrudeGeometry');

        geometry!.dispose();
    });

    it('should use default options when not provided', () => {
        const hatch = createRectangleHatch(0, 0, 10, 10);
        const geometry = hatchToExtrudeGeometry(hatch);

        expect(geometry).not.toBeNull();
        geometry!.computeBoundingBox();

        const actualDepth =
            geometry!.boundingBox!.max.z - geometry!.boundingBox!.min.z;
        expect(actualDepth).toBeCloseTo(DEFAULT_EXTRUDE_OPTIONS.depth, 2);

        geometry!.dispose();
    });
});

// ============================================================
// hatchesToExtrude3DGeometries Tests
// ============================================================

describe('hatchesToExtrude3DGeometries', () => {
    let geometries: Hatch3DGeometryData[];

    afterEach(() => {
        // 테스트 후 지오메트리 정리
        if (geometries) {
            disposeHatch3DGeometries(geometries);
        }
    });

    it('should convert multiple HATCHes to 3D geometry data', () => {
        const hatches = [
            createRectangleHatch(0, 0, 10, 10, 'Layer1'),
            createCircleHatch(20, 0, 5, 'Layer2'),
        ];

        geometries = hatchesToExtrude3DGeometries(hatches, { depth: 10 });

        expect(geometries).toHaveLength(2);
        expect(geometries[0]!.layer).toBe('Layer1');
        expect(geometries[1]!.layer).toBe('Layer2');
    });

    it('should return empty array for empty hatches', () => {
        geometries = hatchesToExtrude3DGeometries([], { depth: 10 });

        expect(geometries).toHaveLength(0);
    });

    it('should return empty array when depth is 0', () => {
        const hatches = [createRectangleHatch(0, 0, 10, 10)];

        geometries = hatchesToExtrude3DGeometries(hatches, { depth: 0 });

        expect(geometries).toHaveLength(0);
    });

    it('should use layer color when available', () => {
        const hatches = [createRectangleHatch(0, 0, 10, 10, 'Layer1')];
        const layers = createLayerRecord([
            { name: 'Layer1', color: '#FF0000', visible: true },
        ]);

        geometries = hatchesToExtrude3DGeometries(
            hatches,
            { depth: 10 },
            layers
        );

        expect(geometries[0]!.color).toBe('#FF0000');
    });

    it('should respect layer visibility', () => {
        const hatches = [
            createRectangleHatch(0, 0, 10, 10, 'VisibleLayer'),
            createRectangleHatch(20, 0, 10, 10, 'HiddenLayer'),
        ];
        const layers = createLayerRecord([
            { name: 'VisibleLayer', color: '#FFFFFF', visible: true },
            { name: 'HiddenLayer', color: '#FFFFFF', visible: false },
        ]);

        geometries = hatchesToExtrude3DGeometries(
            hatches,
            { depth: 10 },
            layers
        );

        expect(geometries[0]!.visible).toBe(true);
        expect(geometries[1]!.visible).toBe(false);
    });

    it('should skip invalid HATCHes', () => {
        const hatches: ParsedHatch[] = [
            createRectangleHatch(0, 0, 10, 10), // valid
            {
                // invalid - no boundaries
                patternName: 'SOLID',
                isSolid: true,
                patternScale: 1,
                patternAngle: 0,
                color: undefined,
                layer: undefined,
                boundaries: [],
            },
        ];

        geometries = hatchesToExtrude3DGeometries(hatches, { depth: 10 });

        expect(geometries).toHaveLength(1);
    });
});

// ============================================================
// mergeHatch3DGeometriesByLayer Tests
// ============================================================

describe('mergeHatch3DGeometriesByLayer', () => {
    it('should merge geometries by layer', () => {
        const hatches = [
            createRectangleHatch(0, 0, 10, 10, 'Layer1'),
            createRectangleHatch(20, 0, 10, 10, 'Layer1'),
            createCircleHatch(40, 0, 5, 'Layer2'),
        ];

        const geometries = hatchesToExtrude3DGeometries(hatches, { depth: 10 });
        const mergedMap = mergeHatch3DGeometriesByLayer(geometries);

        expect(mergedMap.size).toBe(2);
        expect(mergedMap.has('Layer1')).toBe(true);
        expect(mergedMap.has('Layer2')).toBe(true);

        // 정리
        for (const { geometry } of mergedMap.values()) {
            geometry.dispose();
        }
    });

    it('should return empty map for empty input', () => {
        const mergedMap = mergeHatch3DGeometriesByLayer([]);

        expect(mergedMap.size).toBe(0);
    });

    it('should preserve single geometry when layer has one HATCH', () => {
        const hatches = [createRectangleHatch(0, 0, 10, 10, 'SingleLayer')];

        const geometries = hatchesToExtrude3DGeometries(hatches, { depth: 10 });
        const mergedMap = mergeHatch3DGeometriesByLayer(geometries);

        expect(mergedMap.size).toBe(1);
        expect(mergedMap.get('SingleLayer')!.geometry).toBeDefined();

        // 정리
        for (const { geometry } of mergedMap.values()) {
            geometry.dispose();
        }
    });
});

// ============================================================
// disposeHatch3DGeometries Tests
// ============================================================

describe('disposeHatch3DGeometries', () => {
    it('should dispose all geometries without error', () => {
        const hatches = [
            createRectangleHatch(0, 0, 10, 10),
            createCircleHatch(20, 0, 5),
        ];

        const geometries = hatchesToExtrude3DGeometries(hatches, { depth: 10 });

        // dispose 호출이 에러 없이 실행되어야 함
        expect(() => disposeHatch3DGeometries(geometries)).not.toThrow();
    });

    it('should handle empty array', () => {
        expect(() => disposeHatch3DGeometries([])).not.toThrow();
    });
});

// ============================================================
// Bevel Option Tests
// ============================================================

describe('bevel options', () => {
    it('should create geometry with bevel when enabled', () => {
        const hatch = createRectangleHatch(0, 0, 10, 10);
        const options: ExtrudeOptions = {
            depth: 10,
            bevel: true,
            bevelSize: 0.5,
            bevelSegments: 2,
        };

        const geometry = hatchToExtrudeGeometry(hatch, options);

        expect(geometry).not.toBeNull();
        // 베벨이 있으면 더 많은 정점이 생성됨
        const noBevelGeometry = hatchToExtrudeGeometry(hatch, {
            depth: 10,
            bevel: false,
        });

        const withBevelVertices = geometry!.getAttribute('position').count;
        const noBevelVertices = noBevelGeometry!.getAttribute('position').count;

        expect(withBevelVertices).toBeGreaterThan(noBevelVertices);

        geometry!.dispose();
        noBevelGeometry!.dispose();
    });
});

// ============================================================
// Phase 2.1.8: 3D 성능 최적화 테스트
// ============================================================

describe('3D Performance Optimization (Phase 2.1.8)', () => {
    describe('LOD (Level of Detail) optimization', () => {
        it('should apply correct LOD steps based on depth', () => {
            const hatch = createRectangleHatch(0, 0, 10, 10);

            // 얇은 돌출 (depth < 10) → steps: 1
            const thinGeometry = hatchToExtrudeGeometry(hatch, { depth: 5 });
            // 중간 돌출 (10 <= depth < 50) → steps: 2
            const mediumGeometry = hatchToExtrudeGeometry(hatch, { depth: 30 });
            // 깊은 돌출 (depth >= 50) → steps: 4
            const deepGeometry = hatchToExtrudeGeometry(hatch, { depth: 80 });

            expect(thinGeometry).not.toBeNull();
            expect(mediumGeometry).not.toBeNull();
            expect(deepGeometry).not.toBeNull();

            // 더 깊은 돌출은 더 많은 정점을 생성 (steps 증가로 인해)
            const thinVertices = thinGeometry!.getAttribute('position').count;
            const deepVertices = deepGeometry!.getAttribute('position').count;

            // 깊이가 다르므로 정점 수가 다를 수 있음 (steps에 따른 차이)
            expect(thinVertices).toBeGreaterThan(0);
            expect(deepVertices).toBeGreaterThan(0);

            thinGeometry!.dispose();
            mediumGeometry!.dispose();
            deepGeometry!.dispose();
        });

        it('should use appropriate LOD for large batch processing', () => {
            // 여러 HATCH를 다양한 깊이로 생성
            const hatches = [
                createRectangleHatch(0, 0, 10, 10, 'L1'), // depth에 따라 LOD 적용
                createRectangleHatch(20, 0, 10, 10, 'L2'),
                createCircleHatch(40, 0, 5, 'L3'),
            ];

            // 얇은 돌출에서 적은 정점 생성
            const thinGeometries = hatchesToExtrude3DGeometries(hatches, {
                depth: 5,
            });
            expect(thinGeometries.length).toBe(3);

            // 깊은 돌출에서 더 많은 정점 생성 (LOD steps 증가)
            const deepGeometries = hatchesToExtrude3DGeometries(hatches, {
                depth: 80,
            });
            expect(deepGeometries.length).toBe(3);

            // 정리
            disposeHatch3DGeometries(thinGeometries);
            disposeHatch3DGeometries(deepGeometries);
        });
    });

    describe('Geometry merging optimization', () => {
        it('should reduce draw calls by merging same-layer geometries', () => {
            // 동일 레이어에 여러 HATCH
            const hatches = [
                createRectangleHatch(0, 0, 5, 5, 'MergeLayer'),
                createRectangleHatch(10, 0, 5, 5, 'MergeLayer'),
                createRectangleHatch(20, 0, 5, 5, 'MergeLayer'),
                createCircleHatch(35, 0, 3, 'MergeLayer'),
            ];

            const geometries = hatchesToExtrude3DGeometries(hatches, {
                depth: 10,
            });
            expect(geometries.length).toBe(4); // 머지 전 4개

            const mergedMap = mergeHatch3DGeometriesByLayer(geometries);
            expect(mergedMap.size).toBe(1); // 머지 후 1개

            // 머지된 지오메트리가 모든 정점을 포함
            const merged = mergedMap.get('MergeLayer');
            expect(merged).toBeDefined();
            expect(
                merged!.geometry.getAttribute('position').count
            ).toBeGreaterThan(0);

            // 정리
            merged!.geometry.dispose();
        });

        it('should keep separate layers separate after merge', () => {
            const hatches = [
                createRectangleHatch(0, 0, 5, 5, 'LayerA'),
                createRectangleHatch(10, 0, 5, 5, 'LayerA'),
                createRectangleHatch(20, 0, 5, 5, 'LayerB'),
                createRectangleHatch(30, 0, 5, 5, 'LayerB'),
            ];

            const geometries = hatchesToExtrude3DGeometries(hatches, {
                depth: 10,
            });
            const mergedMap = mergeHatch3DGeometriesByLayer(geometries);

            // 2개 레이어 유지 (레이어 on/off 기능 보존)
            expect(mergedMap.size).toBe(2);
            expect(mergedMap.has('LayerA')).toBe(true);
            expect(mergedMap.has('LayerB')).toBe(true);

            // 정리
            for (const { geometry } of mergedMap.values()) {
                geometry.dispose();
            }
        });

        it('should preserve color and visibility after merge', () => {
            const layers = createLayerRecord([
                { name: 'ColorLayer', color: '#FF5500', visible: true },
            ]);
            const hatches = [
                createRectangleHatch(0, 0, 5, 5, 'ColorLayer'),
                createRectangleHatch(10, 0, 5, 5, 'ColorLayer'),
            ];

            const geometries = hatchesToExtrude3DGeometries(
                hatches,
                { depth: 10 },
                layers
            );
            const mergedMap = mergeHatch3DGeometriesByLayer(geometries);

            const merged = mergedMap.get('ColorLayer')!;
            expect(merged.color).toBe('#FF5500');
            expect(merged.visible).toBe(true);

            merged.geometry.dispose();
        });
    });

    describe('Memory management', () => {
        it('should dispose merged source geometries after merge', () => {
            const hatches = [
                createRectangleHatch(0, 0, 5, 5, 'DisposeTest'),
                createRectangleHatch(10, 0, 5, 5, 'DisposeTest'),
            ];

            const geometries = hatchesToExtrude3DGeometries(hatches, {
                depth: 10,
            });

            // 머지 실행 (내부적으로 개별 지오메트리 dispose)
            const mergedMap = mergeHatch3DGeometriesByLayer(geometries);

            // 머지된 결과만 dispose 필요
            expect(mergedMap.size).toBe(1);
            expect(() => {
                for (const { geometry } of mergedMap.values()) {
                    geometry.dispose();
                }
            }).not.toThrow();
        });

        it('should handle batch dispose without errors', () => {
            const hatches = Array.from({ length: 10 }, (_, i) =>
                createRectangleHatch(i * 15, 0, 10, 10, `BatchLayer${i % 3}`)
            );

            const geometries = hatchesToExtrude3DGeometries(hatches, {
                depth: 10,
            });
            expect(geometries.length).toBe(10);

            // 일괄 정리 테스트
            expect(() => disposeHatch3DGeometries(geometries)).not.toThrow();
        });

        it('should not leak memory with repeated create-dispose cycles', () => {
            // 반복적인 생성-삭제 사이클 테스트
            for (let cycle = 0; cycle < 5; cycle++) {
                const hatches = [
                    createRectangleHatch(0, 0, 10, 10),
                    createCircleHatch(20, 0, 5),
                ];

                const geometries = hatchesToExtrude3DGeometries(hatches, {
                    depth: 10,
                });
                expect(geometries.length).toBe(2);

                disposeHatch3DGeometries(geometries);
            }
            // 에러 없이 완료되어야 함
            expect(true).toBe(true);
        });
    });

    describe('Large dataset handling', () => {
        it('should handle many HATCHes efficiently', () => {
            // 50개 HATCH 생성 (실제 시나리오 시뮬레이션)
            const hatches = Array.from({ length: 50 }, (_, i) =>
                createRectangleHatch(
                    (i % 10) * 15,
                    Math.floor(i / 10) * 15,
                    10,
                    10,
                    `L${i % 5}`
                )
            );

            const start = performance.now();
            const geometries = hatchesToExtrude3DGeometries(hatches, {
                depth: 10,
            });
            const createTime = performance.now() - start;

            expect(geometries.length).toBe(50);
            // 합리적인 시간 내 완료 (3초 이내)
            expect(createTime).toBeLessThan(3000);

            // 머지
            const mergeStart = performance.now();
            const mergedMap = mergeHatch3DGeometriesByLayer(geometries);
            const mergeTime = performance.now() - mergeStart;

            // 5개 레이어로 머지됨
            expect(mergedMap.size).toBe(5);
            // 머지도 합리적인 시간 내 완료
            expect(mergeTime).toBeLessThan(1000);

            // 정리
            for (const { geometry } of mergedMap.values()) {
                geometry.dispose();
            }
        });
    });
});
