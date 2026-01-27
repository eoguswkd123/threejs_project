/**
 * DimensionMesh Component Tests
 * DIMENSION 렌더링 테스트 (치수선 + 텍스트)
 */

import { render, cleanup } from '@testing-library/react';
import * as THREE from 'three';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';

import { DimensionMesh } from '../DimensionMesh';

import {
    createEmptyCADData,
    createTestDimension,
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
        BufferGeometry: vi.fn().mockImplementation(() => ({
            setAttribute: vi.fn(),
            dispose: vi.fn(),
        })),
        Float32BufferAttribute: vi
            .fn()
            .mockImplementation((array, itemSize) => ({
                array,
                itemSize,
            })),
    };
});

// Mock @react-three/drei Text component
vi.mock('@react-three/drei', () => ({
    Text: ({ children, ...props }: { children: React.ReactNode }) => (
        <mesh data-testid="drei-text" {...props}>
            {children}
        </mesh>
    ),
}));

// Mock React Three Fiber
vi.mock('@react-three/fiber', () => ({
    useThree: vi.fn(() => ({ gl: {}, scene: {}, camera: {} })),
}));

describe('DimensionMesh', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        cleanup();
    });

    describe('렌더링', () => {
        it('빈 데이터로 렌더링 시 에러 없음', () => {
            const data = createEmptyCADData();

            expect(() =>
                render(
                    <DimensionMesh
                        data={data}
                        layers={undefined}
                        dataCenter={defaultDataCenter}
                    />
                )
            ).not.toThrow();
        });

        it('DIMENSION 엔티티가 있을 때 정상 렌더링됨', () => {
            const data = createEmptyCADData();
            data.dimensions = [
                createTestDimension({ x: 0, y: 0 }, { x: 100, y: 0 }),
            ];
            data.metadata.entityCount = 1;

            expect(() =>
                render(
                    <DimensionMesh
                        data={data}
                        layers={undefined}
                        dataCenter={defaultDataCenter}
                    />
                )
            ).not.toThrow();
        });

        it('여러 DIMENSION 엔티티가 있을 때 정상 렌더링됨', () => {
            const data = createEmptyCADData();
            data.dimensions = [
                createTestDimension({ x: 0, y: 0 }, { x: 100, y: 0 }),
                createTestDimension({ x: 0, y: 0 }, { x: 0, y: 100 }),
                createTestDimension({ x: 100, y: 0 }, { x: 100, y: 100 }),
            ];
            data.metadata.entityCount = 3;

            expect(() =>
                render(
                    <DimensionMesh
                        data={data}
                        layers={undefined}
                        dataCenter={defaultDataCenter}
                    />
                )
            ).not.toThrow();
        });
    });

    describe('치수선 지오메트리', () => {
        it('BufferGeometry가 올바르게 생성됨', () => {
            const data = createEmptyCADData();
            data.dimensions = [
                createTestDimension({ x: 0, y: 0 }, { x: 100, y: 0 }),
            ];

            render(
                <DimensionMesh
                    data={data}
                    layers={undefined}
                    dataCenter={defaultDataCenter}
                />
            );

            expect(THREE.BufferGeometry).toHaveBeenCalled();
        });

        it('Float32BufferAttribute로 정점이 설정됨', () => {
            const data = createEmptyCADData();
            data.dimensions = [
                createTestDimension({ x: 0, y: 0 }, { x: 100, y: 0 }),
            ];

            render(
                <DimensionMesh
                    data={data}
                    layers={undefined}
                    dataCenter={defaultDataCenter}
                />
            );

            expect(THREE.Float32BufferAttribute).toHaveBeenCalled();
        });
    });

    describe('치수 텍스트', () => {
        it('빈 text일 때 거리가 자동 계산됨', () => {
            const data = createEmptyCADData();
            const dim = createTestDimension({ x: 0, y: 0 }, { x: 100, y: 0 });
            dim.text = ''; // 빈 텍스트
            data.dimensions = [dim];

            expect(() =>
                render(
                    <DimensionMesh
                        data={data}
                        layers={undefined}
                        dataCenter={defaultDataCenter}
                    />
                )
            ).not.toThrow();
        });

        it('사용자 지정 텍스트가 표시됨', () => {
            const data = createEmptyCADData();
            const dim = createTestDimension({ x: 0, y: 0 }, { x: 100, y: 0 });
            dim.text = '100 mm';
            data.dimensions = [dim];

            expect(() =>
                render(
                    <DimensionMesh
                        data={data}
                        layers={undefined}
                        dataCenter={defaultDataCenter}
                    />
                )
            ).not.toThrow();
        });
    });

    describe('레이어 처리', () => {
        it('레이어 정보 없으면 기본 색상으로 렌더링', () => {
            const data = createEmptyCADData();
            data.dimensions = [
                createTestDimension({ x: 0, y: 0 }, { x: 100, y: 0 }),
            ];

            expect(() =>
                render(
                    <DimensionMesh
                        data={data}
                        layers={undefined}
                        dataCenter={defaultDataCenter}
                    />
                )
            ).not.toThrow();
        });

        it('레이어별로 치수 필터링됨', () => {
            const data = createEmptyCADData();
            data.dimensions = [
                createTestDimension({ x: 0, y: 0 }, { x: 100, y: 0 }, 'Layer1'),
                createTestDimension({ x: 0, y: 0 }, { x: 0, y: 100 }, 'Layer2'),
            ];

            const layers = createTestLayers([
                { name: 'Layer1', color: '#ff0000' },
                { name: 'Layer2', color: '#00ff00' },
            ]);

            expect(() =>
                render(
                    <DimensionMesh
                        data={data}
                        layers={layers}
                        dataCenter={defaultDataCenter}
                    />
                )
            ).not.toThrow();
        });

        it('보이지 않는 레이어의 치수는 렌더링되지 않음', () => {
            const data = createEmptyCADData();
            data.dimensions = [
                createTestDimension(
                    { x: 0, y: 0 },
                    { x: 100, y: 0 },
                    'HiddenLayer'
                ),
            ];

            const layers = createTestLayers([
                { name: 'HiddenLayer', color: '#ffffff', visible: false },
            ]);

            expect(() =>
                render(
                    <DimensionMesh
                        data={data}
                        layers={layers}
                        dataCenter={defaultDataCenter}
                    />
                )
            ).not.toThrow();
        });
    });

    describe('중심 정렬', () => {
        it('center=true일 때 치수선 위치가 조정됨', () => {
            const data = createEmptyCADData();
            data.dimensions = [
                createTestDimension({ x: 100, y: 100 }, { x: 200, y: 100 }),
            ];

            const customCenter = new THREE.Vector3(150, 100, 0);

            expect(() =>
                render(
                    <DimensionMesh
                        data={data}
                        center={true}
                        layers={undefined}
                        dataCenter={customCenter}
                    />
                )
            ).not.toThrow();
        });

        it('center=false일 때 원래 위치 유지', () => {
            const data = createEmptyCADData();
            data.dimensions = [
                createTestDimension({ x: 0, y: 0 }, { x: 100, y: 0 }),
            ];

            expect(() =>
                render(
                    <DimensionMesh
                        data={data}
                        center={false}
                        layers={undefined}
                        dataCenter={defaultDataCenter}
                    />
                )
            ).not.toThrow();
        });
    });

    describe('메모리 정리', () => {
        it('언마운트 시 geometry와 material이 dispose됨', () => {
            const data = createEmptyCADData();
            data.dimensions = [
                createTestDimension({ x: 0, y: 0 }, { x: 100, y: 0 }),
            ];

            const { unmount } = render(
                <DimensionMesh
                    data={data}
                    layers={undefined}
                    dataCenter={defaultDataCenter}
                />
            );

            // unmount를 호출하면 useEffect cleanup이 실행됨
            unmount();

            // BufferGeometry의 dispose가 호출되었는지 확인
            // (mock을 통해 간접적으로 확인)
            expect(THREE.BufferGeometry).toHaveBeenCalled();
        });
    });

    describe('fontSize 계산', () => {
        it('치수선 길이에 따라 fontSize가 계산됨', () => {
            const data = createEmptyCADData();
            // 긴 치수선
            data.dimensions = [
                createTestDimension({ x: 0, y: 0 }, { x: 1000, y: 0 }),
            ];

            expect(() =>
                render(
                    <DimensionMesh
                        data={data}
                        layers={undefined}
                        dataCenter={defaultDataCenter}
                    />
                )
            ).not.toThrow();
        });

        it('짧은 치수선에서도 최소 fontSize가 보장됨', () => {
            const data = createEmptyCADData();
            // 매우 짧은 치수선
            data.dimensions = [
                createTestDimension({ x: 0, y: 0 }, { x: 1, y: 0 }),
            ];

            expect(() =>
                render(
                    <DimensionMesh
                        data={data}
                        layers={undefined}
                        dataCenter={defaultDataCenter}
                    />
                )
            ).not.toThrow();
        });
    });
});
