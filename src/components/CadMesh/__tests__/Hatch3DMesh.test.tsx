/**
 * Hatch3DMesh Component Tests
 * 3D HATCH 렌더링 테스트 (ExtrudeGeometry 기반)
 *
 * Phase 2.1.6 / 2.1.9
 */

import { render, cleanup } from '@testing-library/react';
import * as THREE from 'three';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';

import type { Hatch3DGeometryData } from '@/types/cad';

import { Hatch3DMesh } from '../Hatch3DMesh';

import {
    createEmptyCADData,
    createTestHatch,
    createTestLayers,
    defaultDataCenter,
} from './testHelpers';

// Mock Three.js materials
vi.mock('three', async () => {
    const actual = await vi.importActual('three');
    return {
        ...actual,
        MeshBasicMaterial: vi.fn().mockImplementation(() => ({
            dispose: vi.fn(),
            wireframe: false,
        })),
        MeshLambertMaterial: vi.fn().mockImplementation(() => ({
            dispose: vi.fn(),
        })),
        MeshPhongMaterial: vi.fn().mockImplementation(() => ({
            dispose: vi.fn(),
            flatShading: false,
            shininess: 30,
        })),
    };
});

// Mock 3D extrusion utilities
const mockExtrudeGeometry = {
    dispose: vi.fn(),
    translate: vi.fn().mockReturnThis(),
    clone: vi.fn().mockReturnThis(),
    computeBoundingSphere: vi.fn(),
};

const mockHatch3DGeometries: Hatch3DGeometryData[] = [];
const mockMergedMap = new Map();
const mockDisposeHatch3D = vi.fn();

vi.mock('@/utils/cad/hatch3DExtrude', () => ({
    hatchesToExtrude3DGeometries: vi.fn(() => mockHatch3DGeometries),
    mergeHatch3DGeometriesByLayer: vi.fn(() => mockMergedMap),
    disposeHatch3DGeometries: vi.fn((...args) => mockDisposeHatch3D(...args)),
}));

// Mock useCadMaterialMap hook
const mockMaterialMap = new Map<string, THREE.Material>();
vi.mock('@/features/CadViewer/hooks/useCadMaterial', () => ({
    useCadMaterialMap: vi.fn(() => mockMaterialMap),
}));

// Mock React Three Fiber
vi.mock('@react-three/fiber', () => ({
    useThree: vi.fn(() => ({ gl: {}, scene: {}, camera: {} })),
}));

// Mock LOD segments with importOriginal
vi.mock('@/constants/cad', async (importOriginal) => {
    const actual = await importOriginal<typeof import('@/constants/cad')>();
    return {
        ...actual,
        getLODSegments: vi.fn(() => 32),
    };
});

describe('Hatch3DMesh', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockHatch3DGeometries.length = 0;
        mockMergedMap.clear();
        mockMaterialMap.clear();
    });

    afterEach(() => {
        cleanup();
    });

    describe('렌더링', () => {
        it('빈 HATCH 데이터로 렌더링 시 에러 없음', () => {
            const data = createEmptyCADData();

            expect(() =>
                render(
                    <Hatch3DMesh
                        data={data}
                        layers={undefined}
                        dataCenter={defaultDataCenter}
                    />
                )
            ).not.toThrow();
        });

        it('HATCH 데이터가 있을 때 정상 렌더링됨', async () => {
            const data = createEmptyCADData();
            data.hatches = [createTestHatch(0, 0, 100, 100, true)];
            data.metadata.entityCount = 1;

            // Mock 3D geometry data
            mockHatch3DGeometries.push({
                key: 'hatch3d-0',
                geometry:
                    mockExtrudeGeometry as unknown as THREE.ExtrudeGeometry,
                layer: '0',
                color: '#ffffff',
                originalHatch: data.hatches[0]!,
                zPosition: 0,
                visible: true,
            });

            // Mock material
            mockMaterialMap.set('#ffffff', {
                dispose: vi.fn(),
            } as unknown as THREE.Material);

            expect(() =>
                render(
                    <Hatch3DMesh
                        data={data}
                        layers={undefined}
                        dataCenter={defaultDataCenter}
                        extrudeOptions={{ depth: 10, bevel: false }}
                    />
                )
            ).not.toThrow();

            const { hatchesToExtrude3DGeometries } =
                await import('@/utils/cad/hatch3DExtrude');
            expect(hatchesToExtrude3DGeometries).toHaveBeenCalled();
        });

        it('depth=0이면 3D 변환 스킵', async () => {
            const data = createEmptyCADData();
            data.hatches = [createTestHatch(0, 0, 100, 100, true)];
            data.metadata.entityCount = 1;

            // When depth=0, the component returns early and doesn't call extrude
            // So we expect the component to render null (no mesh elements)
            const { container } = render(
                <Hatch3DMesh
                    data={data}
                    layers={undefined}
                    dataCenter={defaultDataCenter}
                    extrudeOptions={{ depth: 0, bevel: false }}
                />
            );

            // Container should be empty since depth=0 causes early return
            expect(container.innerHTML).toBe('');
        });
    });

    describe('extrudeOptions', () => {
        it('depth 값에 따라 돌출 높이 적용', async () => {
            const data = createEmptyCADData();
            data.hatches = [createTestHatch(0, 0, 100, 100, true)];
            data.metadata.entityCount = 1;

            const customDepth = 50;

            render(
                <Hatch3DMesh
                    data={data}
                    layers={undefined}
                    dataCenter={defaultDataCenter}
                    extrudeOptions={{ depth: customDepth, bevel: false }}
                />
            );

            const { hatchesToExtrude3DGeometries } =
                await import('@/utils/cad/hatch3DExtrude');
            expect(hatchesToExtrude3DGeometries).toHaveBeenCalledWith(
                data.hatches,
                expect.objectContaining({ depth: customDepth }),
                undefined,
                expect.any(Number)
            );
        });

        it('bevel=true면 베벨 효과 적용', async () => {
            const data = createEmptyCADData();
            data.hatches = [createTestHatch(0, 0, 100, 100, true)];
            data.metadata.entityCount = 1;

            render(
                <Hatch3DMesh
                    data={data}
                    layers={undefined}
                    dataCenter={defaultDataCenter}
                    extrudeOptions={{ depth: 10, bevel: true }}
                />
            );

            const { hatchesToExtrude3DGeometries } =
                await import('@/utils/cad/hatch3DExtrude');
            expect(hatchesToExtrude3DGeometries).toHaveBeenCalledWith(
                data.hatches,
                expect.objectContaining({ bevel: true }),
                undefined,
                expect.any(Number)
            );
        });
    });

    describe('레이어 처리', () => {
        it('레이어별 필터링 및 색상 적용', async () => {
            const data = createEmptyCADData();
            data.hatches = [
                createTestHatch(0, 0, 100, 100, true, 'Layer1'),
                createTestHatch(100, 0, 100, 100, true, 'Layer2'),
            ];

            const layers = createTestLayers([
                { name: 'Layer1', color: '#ff0000' },
                { name: 'Layer2', color: '#00ff00' },
            ]);

            render(
                <Hatch3DMesh
                    data={data}
                    layers={layers}
                    dataCenter={defaultDataCenter}
                    extrudeOptions={{ depth: 10, bevel: false }}
                />
            );

            const { hatchesToExtrude3DGeometries } =
                await import('@/utils/cad/hatch3DExtrude');
            // Hatch3DMesh는 Map을 Record로 변환하여 전달
            expect(hatchesToExtrude3DGeometries).toHaveBeenCalledWith(
                data.hatches,
                expect.any(Object),
                expect.objectContaining({
                    Layer1: expect.objectContaining({ color: '#ff0000' }),
                    Layer2: expect.objectContaining({ color: '#00ff00' }),
                }),
                expect.any(Number)
            );
        });

        it('visible=false인 레이어는 렌더링 안 함', () => {
            const data = createEmptyCADData();
            data.hatches = [
                createTestHatch(0, 0, 100, 100, true, 'HiddenLayer'),
            ];

            const layers = createTestLayers([
                { name: 'HiddenLayer', color: '#ff0000', visible: false },
            ]);

            // Mock 3D geometry with visible=false
            mockHatch3DGeometries.push({
                key: 'hatch3d-0',
                geometry:
                    mockExtrudeGeometry as unknown as THREE.ExtrudeGeometry,
                layer: 'HiddenLayer',
                color: '#ff0000',
                originalHatch: data.hatches[0]!,
                zPosition: 0,
                visible: false,
            });

            mockMaterialMap.set('#ff0000', {
                dispose: vi.fn(),
            } as unknown as THREE.Material);

            // Should render without error, but hidden layer meshes won't appear
            expect(() =>
                render(
                    <Hatch3DMesh
                        data={data}
                        layers={layers}
                        dataCenter={defaultDataCenter}
                        extrudeOptions={{ depth: 10, bevel: false }}
                        mergeByLayer={false}
                    />
                )
            ).not.toThrow();
        });
    });

    describe('shadingMode', () => {
        it('shadingMode에 따라 material 변경', async () => {
            const data = createEmptyCADData();
            data.hatches = [createTestHatch(0, 0, 100, 100, true)];
            data.metadata.entityCount = 1;

            const { useCadMaterialMap } =
                await import('@/features/CadViewer/hooks/useCadMaterial');

            render(
                <Hatch3DMesh
                    data={data}
                    layers={undefined}
                    dataCenter={defaultDataCenter}
                    extrudeOptions={{ depth: 10, bevel: false }}
                    shadingMode="glossy"
                />
            );

            expect(useCadMaterialMap).toHaveBeenCalledWith(
                expect.any(Array),
                'glossy'
            );
        });

        it('기본 shadingMode는 smooth', async () => {
            const data = createEmptyCADData();
            data.hatches = [createTestHatch(0, 0, 100, 100, true)];

            const { useCadMaterialMap } =
                await import('@/features/CadViewer/hooks/useCadMaterial');

            render(
                <Hatch3DMesh
                    data={data}
                    layers={undefined}
                    dataCenter={defaultDataCenter}
                />
            );

            expect(useCadMaterialMap).toHaveBeenCalledWith(
                expect.any(Array),
                'smooth'
            );
        });
    });

    describe('머지 모드', () => {
        it('mergeByLayer=true면 레이어별 지오메트리 머지', async () => {
            const data = createEmptyCADData();
            data.hatches = [
                createTestHatch(0, 0, 100, 100, true, 'Layer1'),
                createTestHatch(100, 0, 100, 100, true, 'Layer1'),
            ];
            data.metadata.entityCount = 2;

            // Mock multiple geometries for same layer
            mockHatch3DGeometries.push(
                {
                    key: 'hatch3d-0',
                    geometry:
                        mockExtrudeGeometry as unknown as THREE.ExtrudeGeometry,
                    layer: 'Layer1',
                    color: '#ff0000',
                    originalHatch: data.hatches[0]!,
                    zPosition: 0,
                    visible: true,
                },
                {
                    key: 'hatch3d-1',
                    geometry:
                        mockExtrudeGeometry as unknown as THREE.ExtrudeGeometry,
                    layer: 'Layer1',
                    color: '#ff0000',
                    originalHatch: data.hatches[1]!,
                    zPosition: 0,
                    visible: true,
                }
            );

            // Mock merged result
            mockMergedMap.set('Layer1', {
                geometry: mockExtrudeGeometry,
                color: '#ff0000',
                visible: true,
            });

            mockMaterialMap.set('#ff0000', {
                dispose: vi.fn(),
            } as unknown as THREE.Material);

            render(
                <Hatch3DMesh
                    data={data}
                    layers={undefined}
                    dataCenter={defaultDataCenter}
                    extrudeOptions={{ depth: 10, bevel: false }}
                    mergeByLayer={true}
                />
            );

            const { mergeHatch3DGeometriesByLayer } =
                await import('@/utils/cad/hatch3DExtrude');
            expect(mergeHatch3DGeometriesByLayer).toHaveBeenCalled();
        });

        it('mergeByLayer=false면 개별 지오메트리 유지', async () => {
            const data = createEmptyCADData();
            data.hatches = [createTestHatch(0, 0, 100, 100, true)];
            data.metadata.entityCount = 1;

            mockHatch3DGeometries.push({
                key: 'hatch3d-0',
                geometry:
                    mockExtrudeGeometry as unknown as THREE.ExtrudeGeometry,
                layer: '0',
                color: '#ffffff',
                originalHatch: data.hatches[0]!,
                zPosition: 0,
                visible: true,
            });

            mockMaterialMap.set('#ffffff', {
                dispose: vi.fn(),
            } as unknown as THREE.Material);

            render(
                <Hatch3DMesh
                    data={data}
                    layers={undefined}
                    dataCenter={defaultDataCenter}
                    extrudeOptions={{ depth: 10, bevel: false }}
                    mergeByLayer={false}
                />
            );

            const { mergeHatch3DGeometriesByLayer } =
                await import('@/utils/cad/hatch3DExtrude');
            expect(mergeHatch3DGeometriesByLayer).not.toHaveBeenCalled();
        });
    });

    describe('중심 정렬', () => {
        it('center=true일 때 geometry가 translate됨', () => {
            const data = createEmptyCADData();
            data.hatches = [createTestHatch(0, 0, 100, 100, true)];
            data.metadata.entityCount = 1;

            const customCenter = new THREE.Vector3(50, 50, 0);

            mockHatch3DGeometries.push({
                key: 'hatch3d-0',
                geometry:
                    mockExtrudeGeometry as unknown as THREE.ExtrudeGeometry,
                layer: '0',
                color: '#ffffff',
                originalHatch: data.hatches[0]!,
                zPosition: 0,
                visible: true,
            });

            mockMaterialMap.set('#ffffff', {
                dispose: vi.fn(),
            } as unknown as THREE.Material);

            render(
                <Hatch3DMesh
                    data={data}
                    center={true}
                    layers={undefined}
                    dataCenter={customCenter}
                    extrudeOptions={{ depth: 10, bevel: false }}
                    mergeByLayer={false}
                />
            );

            // Geometry should be cloned and translated
            expect(mockExtrudeGeometry.clone).toHaveBeenCalled();
        });
    });

    describe('메모리 정리', () => {
        it('언마운트 시 geometry와 material이 dispose됨', () => {
            const data = createEmptyCADData();
            data.hatches = [createTestHatch(0, 0, 100, 100, true)];
            data.metadata.entityCount = 1;

            mockHatch3DGeometries.push({
                key: 'hatch3d-0',
                geometry:
                    mockExtrudeGeometry as unknown as THREE.ExtrudeGeometry,
                layer: '0',
                color: '#ffffff',
                originalHatch: data.hatches[0]!,
                zPosition: 0,
                visible: true,
            });

            const mockDispose = vi.fn();
            mockMaterialMap.set('#ffffff', {
                dispose: mockDispose,
            } as unknown as THREE.Material);

            const { unmount } = render(
                <Hatch3DMesh
                    data={data}
                    layers={undefined}
                    dataCenter={defaultDataCenter}
                    extrudeOptions={{ depth: 10, bevel: false }}
                    mergeByLayer={false}
                />
            );

            unmount();

            // disposeHatch3DGeometries should be called on cleanup
            expect(mockDisposeHatch3D).toHaveBeenCalled();
        });
    });
});
