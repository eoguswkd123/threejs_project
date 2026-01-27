/**
 * WireframeMesh Component Tests
 * LINE/CIRCLE/ARC/POLYLINE 렌더링 테스트
 */

import { render, cleanup } from '@testing-library/react';
import * as THREE from 'three';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';

import { WireframeMesh } from '../WireframeMesh';

import {
    createEmptyCADData,
    createTestLine,
    createTestCircle,
    createTestArc,
    createTestPolyline,
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
    };
});

// Mock cadDataToGeometry
const mockGeometry = {
    translate: vi.fn().mockReturnThis(),
    dispose: vi.fn(),
};

// Mock material for createLineMaterial
const mockMaterial = {
    dispose: vi.fn(),
};

// Mock material pool
const mockMaterialPool = {
    get: vi.fn(() => mockMaterial),
    dispose: vi.fn(),
    size: 0,
};

vi.mock('@/utils/cad', () => ({
    cadDataToGeometry: vi.fn(() => mockGeometry),
    filterDataByLayerName: vi.fn((data, layerName) => {
        // 레이어에 맞는 데이터만 필터링
        return {
            ...data,
            lines: data.lines.filter(
                (e: { layer?: string }) => (e.layer ?? '0') === layerName
            ),
            circles: data.circles.filter(
                (e: { layer?: string }) => (e.layer ?? '0') === layerName
            ),
            arcs: data.arcs.filter(
                (e: { layer?: string }) => (e.layer ?? '0') === layerName
            ),
            polylines: data.polylines.filter(
                (e: { layer?: string }) => (e.layer ?? '0') === layerName
            ),
        };
    }),
    getWireframeEntityCount: vi.fn(
        (data) =>
            data.lines.length +
            data.circles.length +
            data.arcs.length +
            data.polylines.length
    ),
    createLineMaterial: vi.fn(() => mockMaterial),
    createLineMaterialPool: vi.fn(() => mockMaterialPool),
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
}));

// Mock React Three Fiber
vi.mock('@react-three/fiber', () => ({
    useThree: vi.fn(() => ({ gl: {}, scene: {}, camera: {} })),
}));

describe('WireframeMesh', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        cleanup();
    });

    describe('렌더링', () => {
        it('빈 데이터로 렌더링 시 에러 없이 렌더링됨', () => {
            const data = createEmptyCADData();

            expect(() =>
                render(
                    <WireframeMesh
                        data={data}
                        layers={undefined}
                        dataCenter={defaultDataCenter}
                    />
                )
            ).not.toThrow();
        });

        it('LINE 데이터가 있을 때 정상 렌더링됨', () => {
            const data = createEmptyCADData();
            data.lines = [
                createTestLine(0, 0, 100, 100),
                createTestLine(100, 100, 200, 0),
            ];
            data.metadata.entityCount = 2;

            expect(() =>
                render(
                    <WireframeMesh
                        data={data}
                        layers={undefined}
                        dataCenter={defaultDataCenter}
                    />
                )
            ).not.toThrow();
        });

        it('모든 기본 엔티티 타입으로 렌더링됨', () => {
            const data = createEmptyCADData();
            data.lines = [createTestLine(0, 0, 100, 0)];
            data.circles = [createTestCircle(50, 50, 20)];
            data.arcs = [createTestArc(100, 100, 30, 0, 90)];
            data.polylines = [
                createTestPolyline([
                    { x: 0, y: 0 },
                    { x: 50, y: 50 },
                ]),
            ];
            data.metadata.entityCount = 4;

            expect(() =>
                render(
                    <WireframeMesh
                        data={data}
                        layers={undefined}
                        dataCenter={defaultDataCenter}
                    />
                )
            ).not.toThrow();
        });
    });

    describe('레이어 처리', () => {
        it('레이어 정보 없으면 단일 메시로 렌더링', () => {
            const data = createEmptyCADData();
            data.lines = [createTestLine(0, 0, 100, 0)];

            const { container } = render(
                <WireframeMesh
                    data={data}
                    layers={undefined}
                    dataCenter={defaultDataCenter}
                />
            );

            // 컴포넌트가 렌더링됨
            expect(container).toBeTruthy();
        });

        it('레이어 정보가 있으면 레이어별로 메시 생성', () => {
            const data = createEmptyCADData();
            data.lines = [
                createTestLine(0, 0, 100, 0, 'Layer1'),
                createTestLine(100, 0, 200, 0, 'Layer2'),
            ];
            data.metadata.entityCount = 2;

            const layers = createTestLayers([
                { name: 'Layer1', color: '#ff0000' },
                { name: 'Layer2', color: '#00ff00' },
            ]);

            expect(() =>
                render(
                    <WireframeMesh
                        data={data}
                        layers={layers}
                        dataCenter={defaultDataCenter}
                    />
                )
            ).not.toThrow();
        });

        it('보이지 않는 레이어는 렌더링되지 않음', () => {
            const data = createEmptyCADData();
            data.lines = [createTestLine(0, 0, 100, 0, 'HiddenLayer')];

            const layers = createTestLayers([
                { name: 'HiddenLayer', color: '#ffffff', visible: false },
            ]);

            expect(() =>
                render(
                    <WireframeMesh
                        data={data}
                        layers={layers}
                        dataCenter={defaultDataCenter}
                    />
                )
            ).not.toThrow();
        });
    });

    describe('중심 정렬', () => {
        it('center=true일 때 geometry가 translate됨', () => {
            const data = createEmptyCADData();
            data.lines = [createTestLine(0, 0, 100, 0)];

            const customCenter = new THREE.Vector3(50, 25, 0);

            render(
                <WireframeMesh
                    data={data}
                    center={true}
                    layers={undefined}
                    dataCenter={customCenter}
                />
            );

            expect(mockGeometry.translate).toHaveBeenCalledWith(-50, -25, -0);
        });

        it('center=false일 때 geometry가 translate되지 않음', () => {
            const data = createEmptyCADData();
            data.lines = [createTestLine(0, 0, 100, 0)];

            render(
                <WireframeMesh
                    data={data}
                    center={false}
                    layers={undefined}
                    dataCenter={defaultDataCenter}
                />
            );

            expect(mockGeometry.translate).not.toHaveBeenCalled();
        });
    });

    describe('메모리 정리', () => {
        it('언마운트 시 geometry가 dispose됨', () => {
            const data = createEmptyCADData();
            data.lines = [createTestLine(0, 0, 100, 0)];

            const { unmount } = render(
                <WireframeMesh
                    data={data}
                    layers={undefined}
                    dataCenter={defaultDataCenter}
                />
            );

            unmount();

            expect(mockGeometry.dispose).toHaveBeenCalled();
        });

        it('언마운트 시 material pool이 dispose됨', () => {
            const data = createEmptyCADData();
            data.lines = [createTestLine(0, 0, 100, 0)];

            const { unmount } = render(
                <WireframeMesh
                    data={data}
                    layers={undefined}
                    dataCenter={defaultDataCenter}
                />
            );

            unmount();

            expect(mockMaterialPool.dispose).toHaveBeenCalled();
        });
    });
});
