/**
 * HatchMesh Component Tests
 * HATCH 렌더링 테스트 (outline/solid/pattern 모드)
 */

import { render, cleanup } from '@testing-library/react';
import * as THREE from 'three';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';

import { HatchMesh } from '../HatchMesh';

import {
    createEmptyCADData,
    createTestHatch,
    createTestLayers,
    defaultDataCenter,
} from './testHelpers';

// Mock Three.js
vi.mock('three', async () => {
    const actual = await vi.importActual('three');
    return {
        ...actual,
        LineBasicMaterial: vi.fn().mockImplementation(() => ({
            dispose: vi.fn(),
        })),
        MeshBasicMaterial: vi.fn().mockImplementation(() => ({
            dispose: vi.fn(),
            map: null,
        })),
        ShapeGeometry: vi.fn().mockImplementation(() => ({
            dispose: vi.fn(),
            translate: vi.fn(),
        })),
    };
});

// Mock geometry utilities
const mockWireframeGeometry = {
    translate: vi.fn().mockReturnThis(),
    dispose: vi.fn(),
};

const mockSolidGeometry = {
    translate: vi.fn().mockReturnThis(),
    dispose: vi.fn(),
};

vi.mock('@/utils/cad', () => ({
    hatchBoundariesToWireframe: vi.fn(() => mockWireframeGeometry),
    hatchesToSolidGeometries: vi.fn((hatches) =>
        hatches.map((_: unknown, i: number) => ({
            geometry: { ...mockSolidGeometry },
            zPosition: i * 0.1,
        }))
    ),
    createPatternTexture: vi.fn(() => ({
        dispose: vi.fn(),
    })),
    filterHatchesByLayerName: vi.fn((hatches, layerName) =>
        hatches.filter(
            (h: { layer?: string }) => (h.layer ?? '0') === layerName
        )
    ),
    translateToCenter: vi.fn(
        (
            geom: { translate: (x: number, y: number, z: number) => void },
            center: { x: number; y: number; z: number },
            shouldCenter: boolean
        ) => {
            if (shouldCenter && center) {
                geom.translate(-center.x, -center.y, -center.z);
            }
        }
    ),
    translateToCenterXY: vi.fn(
        (
            geom: { translate: (x: number, y: number, z: number) => void },
            center: { x: number; y: number; z: number },
            shouldCenter: boolean
        ) => {
            if (shouldCenter && center) {
                geom.translate(-center.x, -center.y, 0);
            }
        }
    ),
    calculateCenteredZPosition: vi.fn(
        (zPosition: number, center: { z: number }, shouldCenter: boolean) =>
            shouldCenter ? zPosition - center.z : zPosition
    ),
    createLineMaterialPool: vi.fn(() => ({
        get: vi.fn(() => ({
            dispose: vi.fn(),
        })),
        dispose: vi.fn(),
        size: 0,
    })),
}));

// Mock React Three Fiber
vi.mock('@react-three/fiber', () => ({
    useThree: vi.fn(() => ({ gl: {}, scene: {}, camera: {} })),
}));

describe('HatchMesh', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        cleanup();
    });

    describe('렌더링', () => {
        it('빈 HATCH 데이터로 렌더링 시 에러 없음', () => {
            const data = createEmptyCADData();

            expect(() =>
                render(
                    <HatchMesh
                        data={data}
                        layers={undefined}
                        dataCenter={defaultDataCenter}
                        renderMode="outline"
                    />
                )
            ).not.toThrow();
        });

        it('HATCH 데이터가 있을 때 정상 렌더링됨', () => {
            const data = createEmptyCADData();
            data.hatches = [createTestHatch(0, 0, 100, 100, true)];
            data.metadata.entityCount = 1;

            expect(() =>
                render(
                    <HatchMesh
                        data={data}
                        layers={undefined}
                        dataCenter={defaultDataCenter}
                        renderMode="outline"
                    />
                )
            ).not.toThrow();
        });
    });

    describe('렌더 모드', () => {
        it('outline 모드에서 경계선만 렌더링', async () => {
            const data = createEmptyCADData();
            data.hatches = [createTestHatch(0, 0, 100, 100, true)];

            render(
                <HatchMesh
                    data={data}
                    layers={undefined}
                    dataCenter={defaultDataCenter}
                    renderMode="outline"
                />
            );

            const { hatchBoundariesToWireframe, hatchesToSolidGeometries } =
                await import('@/utils/cad');

            expect(hatchBoundariesToWireframe).toHaveBeenCalled();
            expect(hatchesToSolidGeometries).not.toHaveBeenCalled();
        });

        it('solid 모드에서 채우기 렌더링', async () => {
            const data = createEmptyCADData();
            data.hatches = [createTestHatch(0, 0, 100, 100, true)];

            render(
                <HatchMesh
                    data={data}
                    layers={undefined}
                    dataCenter={defaultDataCenter}
                    renderMode="solid"
                />
            );

            const { hatchesToSolidGeometries } = await import('@/utils/cad');
            expect(hatchesToSolidGeometries).toHaveBeenCalled();
        });

        it('pattern 모드에서 패턴 텍스처 사용', async () => {
            const data = createEmptyCADData();
            data.hatches = [createTestHatch(0, 0, 100, 100, false)]; // isSolid=false

            render(
                <HatchMesh
                    data={data}
                    layers={undefined}
                    dataCenter={defaultDataCenter}
                    renderMode="pattern"
                />
            );

            const { createPatternTexture } = await import('@/utils/cad');
            expect(createPatternTexture).toHaveBeenCalled();
        });
    });

    describe('레이어 처리', () => {
        it('레이어 정보 없으면 단일 메시로 렌더링', () => {
            const data = createEmptyCADData();
            data.hatches = [createTestHatch(0, 0, 100, 100, true)];

            expect(() =>
                render(
                    <HatchMesh
                        data={data}
                        layers={undefined}
                        dataCenter={defaultDataCenter}
                        renderMode="outline"
                    />
                )
            ).not.toThrow();
        });

        it('레이어별로 HATCH 필터링됨', async () => {
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
                <HatchMesh
                    data={data}
                    layers={layers}
                    dataCenter={defaultDataCenter}
                    renderMode="outline"
                />
            );

            const { filterHatchesByLayerName } = await import('@/utils/cad');
            expect(filterHatchesByLayerName).toHaveBeenCalled();
        });
    });

    describe('중심 정렬', () => {
        it('center=true일 때 outline geometry가 translate됨', () => {
            const data = createEmptyCADData();
            data.hatches = [createTestHatch(0, 0, 100, 100, true)];

            const customCenter = new THREE.Vector3(50, 50, 0);

            render(
                <HatchMesh
                    data={data}
                    center={true}
                    layers={undefined}
                    dataCenter={customCenter}
                    renderMode="outline"
                />
            );

            expect(mockWireframeGeometry.translate).toHaveBeenCalledWith(
                -50,
                -50,
                -0
            );
        });
    });

    describe('메모리 정리', () => {
        it('언마운트 시 geometry와 material이 dispose됨', () => {
            const data = createEmptyCADData();
            data.hatches = [createTestHatch(0, 0, 100, 100, true)];

            const { unmount } = render(
                <HatchMesh
                    data={data}
                    layers={undefined}
                    dataCenter={defaultDataCenter}
                    renderMode="outline"
                />
            );

            unmount();

            expect(mockWireframeGeometry.dispose).toHaveBeenCalled();
        });
    });

    describe('Solid/Pattern HATCH 구분', () => {
        it('isSolid=true인 HATCH는 solid 모드에서 단색 채우기', () => {
            const data = createEmptyCADData();
            data.hatches = [createTestHatch(0, 0, 100, 100, true)];

            expect(() =>
                render(
                    <HatchMesh
                        data={data}
                        layers={undefined}
                        dataCenter={defaultDataCenter}
                        renderMode="solid"
                    />
                )
            ).not.toThrow();
        });

        it('isSolid=false인 HATCH는 pattern 모드에서 패턴 적용', () => {
            const data = createEmptyCADData();
            data.hatches = [createTestHatch(0, 0, 100, 100, false)];

            expect(() =>
                render(
                    <HatchMesh
                        data={data}
                        layers={undefined}
                        dataCenter={defaultDataCenter}
                        renderMode="pattern"
                    />
                )
            ).not.toThrow();
        });
    });
});
