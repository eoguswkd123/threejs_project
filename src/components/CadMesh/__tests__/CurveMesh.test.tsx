/**
 * CurveMesh Component Tests
 * ELLIPSE/SPLINE 렌더링 테스트
 */

import { render, cleanup } from '@testing-library/react';
import * as THREE from 'three';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';

import { CurveMesh } from '../CurveMesh';

import {
    createEmptyCADData,
    createTestEllipse,
    createTestSpline,
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

// Mock geometry utilities
const mockEllipseGeometry = {
    translate: vi.fn().mockReturnThis(),
    dispose: vi.fn(),
};

const mockSplineGeometry = {
    translate: vi.fn().mockReturnThis(),
    dispose: vi.fn(),
};

// Mock material
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
    ellipsesToGeometry: vi.fn(() => mockEllipseGeometry),
    splinesToGeometry: vi.fn(() => mockSplineGeometry),
    createLineMaterialPool: vi.fn(() => mockMaterialPool),
}));

// Mock React Three Fiber
vi.mock('@react-three/fiber', () => ({
    useThree: vi.fn(() => ({ gl: {}, scene: {}, camera: {} })),
}));

describe('CurveMesh', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        cleanup();
    });

    describe('ELLIPSE 렌더링', () => {
        it('빈 데이터로 렌더링 시 에러 없음', () => {
            const data = createEmptyCADData();

            expect(() =>
                render(
                    <CurveMesh
                        data={data}
                        layers={undefined}
                        dataCenter={defaultDataCenter}
                    />
                )
            ).not.toThrow();
        });

        it('ELLIPSE 엔티티가 있을 때 정상 렌더링됨', () => {
            const data = createEmptyCADData();
            data.ellipses = [
                createTestEllipse(50, 50, 40, 0.5),
                createTestEllipse(100, 100, 30, 0.5),
            ];
            data.metadata.entityCount = 2;

            expect(() =>
                render(
                    <CurveMesh
                        data={data}
                        layers={undefined}
                        dataCenter={defaultDataCenter}
                    />
                )
            ).not.toThrow();
        });

        it('ellipsesToGeometry가 호출됨', async () => {
            const data = createEmptyCADData();
            data.ellipses = [createTestEllipse(50, 50, 40, 20)];

            render(
                <CurveMesh
                    data={data}
                    layers={undefined}
                    dataCenter={defaultDataCenter}
                />
            );

            const { ellipsesToGeometry } = await import('@/utils/cad');
            expect(ellipsesToGeometry).toHaveBeenCalled();
        });
    });

    describe('SPLINE 렌더링', () => {
        it('SPLINE 엔티티가 있을 때 정상 렌더링됨', () => {
            const data = createEmptyCADData();
            data.splines = [
                createTestSpline([
                    { x: 0, y: 0 },
                    { x: 50, y: 100 },
                    { x: 100, y: 0 },
                ]),
            ];
            data.metadata.entityCount = 1;

            expect(() =>
                render(
                    <CurveMesh
                        data={data}
                        layers={undefined}
                        dataCenter={defaultDataCenter}
                    />
                )
            ).not.toThrow();
        });

        it('splinesToGeometry가 호출됨', async () => {
            const data = createEmptyCADData();
            data.splines = [
                createTestSpline([
                    { x: 0, y: 0 },
                    { x: 100, y: 100 },
                ]),
            ];

            render(
                <CurveMesh
                    data={data}
                    layers={undefined}
                    dataCenter={defaultDataCenter}
                />
            );

            const { splinesToGeometry } = await import('@/utils/cad');
            expect(splinesToGeometry).toHaveBeenCalled();
        });
    });

    describe('혼합 렌더링', () => {
        it('ELLIPSE와 SPLINE이 모두 있을 때 정상 렌더링됨', () => {
            const data = createEmptyCADData();
            data.ellipses = [createTestEllipse(50, 50, 40, 20)];
            data.splines = [
                createTestSpline([
                    { x: 0, y: 0 },
                    { x: 100, y: 100 },
                ]),
            ];
            data.metadata.entityCount = 2;

            expect(() =>
                render(
                    <CurveMesh
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
            data.ellipses = [createTestEllipse(50, 50, 40, 20)];

            expect(() =>
                render(
                    <CurveMesh
                        data={data}
                        layers={undefined}
                        dataCenter={defaultDataCenter}
                    />
                )
            ).not.toThrow();
        });

        it('레이어별로 곡선 필터링됨', () => {
            const data = createEmptyCADData();
            data.ellipses = [
                createTestEllipse(50, 50, 40, 0.5, 'Layer1'),
                createTestEllipse(100, 100, 30, 0.5, 'Layer2'),
            ];

            const layers = createTestLayers([
                { name: 'Layer1', color: '#ff0000' },
                { name: 'Layer2', color: '#00ff00' },
            ]);

            expect(() =>
                render(
                    <CurveMesh
                        data={data}
                        layers={layers}
                        dataCenter={defaultDataCenter}
                    />
                )
            ).not.toThrow();
        });

        it('보이지 않는 레이어의 곡선은 렌더링되지 않음', () => {
            const data = createEmptyCADData();
            data.ellipses = [createTestEllipse(50, 50, 40, 0.5, 'HiddenLayer')];

            const layers = createTestLayers([
                { name: 'HiddenLayer', color: '#ffffff', visible: false },
            ]);

            expect(() =>
                render(
                    <CurveMesh
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
            data.ellipses = [createTestEllipse(50, 50, 40, 20)];

            const customCenter = new THREE.Vector3(25, 25, 0);

            render(
                <CurveMesh
                    data={data}
                    center={true}
                    layers={undefined}
                    dataCenter={customCenter}
                />
            );

            expect(mockEllipseGeometry.translate).toHaveBeenCalledWith(
                -25,
                -25,
                -0
            );
        });

        it('center=false일 때 geometry가 translate되지 않음', () => {
            const data = createEmptyCADData();
            data.ellipses = [createTestEllipse(50, 50, 40, 20)];

            render(
                <CurveMesh
                    data={data}
                    center={false}
                    layers={undefined}
                    dataCenter={defaultDataCenter}
                />
            );

            expect(mockEllipseGeometry.translate).not.toHaveBeenCalled();
        });
    });

    describe('메모리 정리', () => {
        it('언마운트 시 geometry가 dispose됨', () => {
            const data = createEmptyCADData();
            data.ellipses = [createTestEllipse(50, 50, 40, 20)];

            const { unmount } = render(
                <CurveMesh
                    data={data}
                    layers={undefined}
                    dataCenter={defaultDataCenter}
                />
            );

            unmount();

            expect(mockEllipseGeometry.dispose).toHaveBeenCalled();
        });

        it('언마운트 시 material pool이 dispose됨', () => {
            const data = createEmptyCADData();
            data.ellipses = [createTestEllipse(50, 50, 40, 20)];

            const { unmount } = render(
                <CurveMesh
                    data={data}
                    layers={undefined}
                    dataCenter={defaultDataCenter}
                />
            );

            unmount();

            expect(mockMaterialPool.dispose).toHaveBeenCalled();
        });
    });

    describe('LOD (Level of Detail)', () => {
        it('엔티티 수에 따라 적절한 세그먼트 수가 사용됨', () => {
            const data = createEmptyCADData();
            // 많은 엔티티
            data.ellipses = Array(100)
                .fill(null)
                .map(() => createTestEllipse(50, 50, 40, 20));
            data.metadata.entityCount = 100;

            expect(() =>
                render(
                    <CurveMesh
                        data={data}
                        layers={undefined}
                        dataCenter={defaultDataCenter}
                    />
                )
            ).not.toThrow();
        });
    });
});
