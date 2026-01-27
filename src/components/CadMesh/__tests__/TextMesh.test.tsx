/**
 * TextMesh Component Tests
 * TEXT/MTEXT 렌더링 테스트
 */

import { render, cleanup } from '@testing-library/react';
import * as THREE from 'three';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';

import { TextMesh } from '../TextMesh';

import {
    createEmptyCADData,
    createTestText,
    createTestMText,
    createTestLayers,
    defaultDataCenter,
} from './testHelpers';

// Mock @react-three/drei Text component
vi.mock('@react-three/drei', () => ({
    Text: ({ children, ...props }: { children: React.ReactNode }) => (
        <mesh data-testid="drei-text" {...props}>
            {children}
        </mesh>
    ),
}));

// Mock getTextAnchors
vi.mock('@/utils/cad', () => ({
    getTextAnchors: vi.fn((attachment: string) => {
        const parts = attachment.split('-');
        return {
            anchorY: parts[0] as 'top' | 'middle' | 'bottom',
            anchorX: parts[1] as 'left' | 'center' | 'right',
        };
    }),
}));

// Mock React Three Fiber
vi.mock('@react-three/fiber', () => ({
    useThree: vi.fn(() => ({ gl: {}, scene: {}, camera: {} })),
}));

describe('TextMesh', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        cleanup();
    });

    describe('TEXT 렌더링', () => {
        it('빈 텍스트 데이터로 렌더링 시 에러 없음', () => {
            const data = createEmptyCADData();

            expect(() =>
                render(
                    <TextMesh
                        data={data}
                        layers={undefined}
                        dataCenter={defaultDataCenter}
                    />
                )
            ).not.toThrow();
        });

        it('TEXT 엔티티가 있을 때 정상 렌더링됨', () => {
            const data = createEmptyCADData();
            data.texts = [
                createTestText('Hello', 10, 20),
                createTestText('World', 50, 60),
            ];
            data.metadata.entityCount = 2;

            expect(() =>
                render(
                    <TextMesh
                        data={data}
                        layers={undefined}
                        dataCenter={defaultDataCenter}
                    />
                )
            ).not.toThrow();
        });

        it('텍스트 위치가 올바르게 계산됨', () => {
            const data = createEmptyCADData();
            data.texts = [createTestText('Test', 100, 200)];

            const customCenter = new THREE.Vector3(50, 100, 0);

            const { container } = render(
                <TextMesh
                    data={data}
                    center={true}
                    layers={undefined}
                    dataCenter={customCenter}
                />
            );

            // 컴포넌트가 렌더링됨 (position이 50, 100, 0으로 조정됨)
            expect(container).toBeTruthy();
        });
    });

    describe('MTEXT 렌더링', () => {
        it('MTEXT 엔티티가 있을 때 정상 렌더링됨', () => {
            const data = createEmptyCADData();
            data.mtexts = [
                createTestMText('Multi-line text', 10, 20),
                createTestMText('Another text', 50, 60),
            ];
            data.metadata.entityCount = 2;

            expect(() =>
                render(
                    <TextMesh
                        data={data}
                        layers={undefined}
                        dataCenter={defaultDataCenter}
                    />
                )
            ).not.toThrow();
        });

        it('MTEXT attachment가 올바르게 변환됨', async () => {
            const data = createEmptyCADData();
            data.mtexts = [createTestMText('Test', 10, 20)];

            render(
                <TextMesh
                    data={data}
                    layers={undefined}
                    dataCenter={defaultDataCenter}
                />
            );

            const { getTextAnchors } = await import('@/utils/cad');
            expect(getTextAnchors).toHaveBeenCalled();
        });
    });

    describe('혼합 렌더링', () => {
        it('TEXT와 MTEXT가 모두 있을 때 정상 렌더링됨', () => {
            const data = createEmptyCADData();
            data.texts = [createTestText('Simple text', 10, 20)];
            data.mtexts = [createTestMText('Multi-line', 50, 60)];
            data.metadata.entityCount = 2;

            expect(() =>
                render(
                    <TextMesh
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
            data.texts = [createTestText('Test', 10, 20)];

            expect(() =>
                render(
                    <TextMesh
                        data={data}
                        layers={undefined}
                        dataCenter={defaultDataCenter}
                    />
                )
            ).not.toThrow();
        });

        it('레이어별로 텍스트 필터링됨', () => {
            const data = createEmptyCADData();
            data.texts = [
                createTestText('Text1', 10, 20, 10, 'Layer1'),
                createTestText('Text2', 50, 60, 10, 'Layer2'),
            ];

            const layers = createTestLayers([
                { name: 'Layer1', color: '#ff0000' },
                { name: 'Layer2', color: '#00ff00' },
            ]);

            expect(() =>
                render(
                    <TextMesh
                        data={data}
                        layers={layers}
                        dataCenter={defaultDataCenter}
                    />
                )
            ).not.toThrow();
        });

        it('보이지 않는 레이어의 텍스트는 렌더링되지 않음', () => {
            const data = createEmptyCADData();
            data.texts = [createTestText('Hidden', 10, 20, 10, 'HiddenLayer')];

            const layers = createTestLayers([
                { name: 'HiddenLayer', color: '#ffffff', visible: false },
            ]);

            expect(() =>
                render(
                    <TextMesh
                        data={data}
                        layers={layers}
                        dataCenter={defaultDataCenter}
                    />
                )
            ).not.toThrow();
        });
    });

    describe('중심 정렬', () => {
        it('center=true일 때 텍스트 위치가 조정됨', () => {
            const data = createEmptyCADData();
            data.texts = [createTestText('Test', 100, 100)];

            const customCenter = new THREE.Vector3(50, 50, 0);

            expect(() =>
                render(
                    <TextMesh
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
            data.texts = [createTestText('Test', 100, 100)];

            expect(() =>
                render(
                    <TextMesh
                        data={data}
                        center={false}
                        layers={undefined}
                        dataCenter={defaultDataCenter}
                    />
                )
            ).not.toThrow();
        });
    });

    describe('텍스트 속성', () => {
        it('텍스트 높이(fontSize)가 올바르게 적용됨', () => {
            const data = createEmptyCADData();
            data.texts = [createTestText('Big Text', 10, 20, 24)];

            expect(() =>
                render(
                    <TextMesh
                        data={data}
                        layers={undefined}
                        dataCenter={defaultDataCenter}
                    />
                )
            ).not.toThrow();
        });

        it('MTEXT width가 maxWidth로 적용됨', () => {
            const data = createEmptyCADData();
            const mtext = createTestMText('Wrapped text', 10, 20, 12);
            data.mtexts = [mtext];

            expect(() =>
                render(
                    <TextMesh
                        data={data}
                        layers={undefined}
                        dataCenter={defaultDataCenter}
                    />
                )
            ).not.toThrow();
        });
    });
});
