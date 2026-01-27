/**
 * TeapotMesh Component Tests
 * Teapot 3D Mesh 렌더링 컴포넌트 테스트
 *
 * 주요 테스트:
 * - 기본 props로 렌더링
 * - Props 변경 시 geometry/material 재생성
 * - shadingMode 전달 확인
 */

import { render } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// vi.hoisted로 mock 함수들을 호이스팅 이전에 선언
const mockTeapotGeometryInstance = vi.hoisted(() => ({
    dispose: vi.fn(),
}));

const mockTeapotGeometryConstructor = vi.hoisted(() =>
    vi.fn().mockImplementation(() => mockTeapotGeometryInstance)
);

const mockMaterial = vi.hoisted(() => ({
    dispose: vi.fn(),
    side: 2, // THREE.DoubleSide
}));

const mockUseTeapotMaterial = vi.hoisted(() => vi.fn(() => mockMaterial));

const mockDisposeMaterial = vi.hoisted(() => vi.fn());

// Mock useFrame hook
vi.mock('@react-three/fiber', () => ({
    useFrame: vi.fn(),
}));

// Mock TeapotGeometry
vi.mock('three/addons/geometries/TeapotGeometry.js', () => ({
    TeapotGeometry: mockTeapotGeometryConstructor,
}));

// Mock useTeapotMaterial
vi.mock('../../hooks/useTeapotMaterial', () => ({
    useTeapotMaterial: mockUseTeapotMaterial,
    disposeMaterial: mockDisposeMaterial,
}));

// Import after mocks
import { TeapotMesh } from '../TeapotMesh';

describe('TeapotMesh', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('렌더링', () => {
        it('기본 props로 렌더링됨', () => {
            const { container } = render(<TeapotMesh />);

            expect(container).toBeTruthy();
        });

        it('TeapotGeometry가 기본값으로 생성됨', () => {
            render(<TeapotMesh />);

            expect(mockTeapotGeometryConstructor).toHaveBeenCalledWith(
                50, // size (default)
                15, // tessellation (default)
                true, // showBody (default)
                true, // showLid (default)
                true, // showBottom (default)
                true, // blinn
                true // weld
            );
        });

        it('useTeapotMaterial이 기본 shadingMode로 호출됨', () => {
            render(<TeapotMesh />);

            expect(mockUseTeapotMaterial).toHaveBeenCalledWith('smooth');
        });
    });

    describe('Props 전달', () => {
        it('tessellation prop이 TeapotGeometry에 전달됨', () => {
            render(<TeapotMesh tessellation={25} />);

            expect(mockTeapotGeometryConstructor).toHaveBeenCalledWith(
                50,
                25, // custom tessellation
                true,
                true,
                true,
                true,
                true
            );
        });

        it('size prop이 TeapotGeometry에 전달됨', () => {
            render(<TeapotMesh size={100} />);

            expect(mockTeapotGeometryConstructor).toHaveBeenCalledWith(
                100, // custom size
                15,
                true,
                true,
                true,
                true,
                true
            );
        });

        it('showLid, showBody, showBottom props가 전달됨', () => {
            render(
                <TeapotMesh
                    showLid={false}
                    showBody={false}
                    showBottom={false}
                />
            );

            expect(mockTeapotGeometryConstructor).toHaveBeenCalledWith(
                50,
                15,
                false, // showBody
                false, // showLid
                false, // showBottom
                true,
                true
            );
        });

        it('shadingMode prop이 useTeapotMaterial에 전달됨', () => {
            render(<TeapotMesh shadingMode="wireframe" />);

            expect(mockUseTeapotMaterial).toHaveBeenCalledWith('wireframe');
        });

        it('모든 shadingMode 값이 올바르게 전달됨', () => {
            const modes = [
                'wireframe',
                'flat',
                'smooth',
                'glossy',
                'textured',
                'reflective',
            ] as const;

            modes.forEach((mode) => {
                vi.clearAllMocks();
                render(<TeapotMesh shadingMode={mode} />);
                expect(mockUseTeapotMaterial).toHaveBeenCalledWith(mode);
            });
        });
    });

    describe('Props 변경 시 재생성', () => {
        it('tessellation 변경 시 새 geometry 생성', () => {
            const { rerender } = render(<TeapotMesh tessellation={15} />);

            expect(mockTeapotGeometryConstructor).toHaveBeenCalledTimes(1);

            rerender(<TeapotMesh tessellation={25} />);

            // 새 geometry가 생성됨
            expect(mockTeapotGeometryConstructor).toHaveBeenCalledTimes(2);
        });

        it('shadingMode 변경 시 useTeapotMaterial 재호출', () => {
            const { rerender } = render(<TeapotMesh shadingMode="smooth" />);

            expect(mockUseTeapotMaterial).toHaveBeenLastCalledWith('smooth');

            rerender(<TeapotMesh shadingMode="wireframe" />);

            expect(mockUseTeapotMaterial).toHaveBeenLastCalledWith('wireframe');
        });

        it('size 변경 시 새 geometry 생성', () => {
            const { rerender } = render(<TeapotMesh size={50} />);

            expect(mockTeapotGeometryConstructor).toHaveBeenCalledTimes(1);

            rerender(<TeapotMesh size={100} />);

            expect(mockTeapotGeometryConstructor).toHaveBeenCalledTimes(2);
        });
    });

    describe('메모이제이션', () => {
        it('같은 props로 리렌더링 시 geometry 재생성 안됨', () => {
            const { rerender } = render(
                <TeapotMesh tessellation={15} shadingMode="smooth" />
            );

            const callCount = mockTeapotGeometryConstructor.mock.calls.length;

            // 같은 props로 리렌더링
            rerender(<TeapotMesh tessellation={15} shadingMode="smooth" />);

            // geometry 생성 횟수가 증가하지 않음 (useMemo)
            expect(mockTeapotGeometryConstructor.mock.calls.length).toBe(
                callCount
            );
        });
    });

    describe('메모리 관리', () => {
        it('언마운트 시 geometry.dispose 호출', () => {
            const { unmount } = render(<TeapotMesh />);

            expect(mockTeapotGeometryInstance.dispose).not.toHaveBeenCalled();

            unmount();

            expect(mockTeapotGeometryInstance.dispose).toHaveBeenCalled();
        });

        it('언마운트 시 disposeMaterial 호출', () => {
            const { unmount } = render(<TeapotMesh />);

            unmount();

            expect(mockDisposeMaterial).toHaveBeenCalled();
        });
    });
});

describe('TeapotMesh - Edge Cases', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('최소 tessellation 값 (2) 처리', () => {
        render(<TeapotMesh tessellation={2} />);

        expect(mockTeapotGeometryConstructor).toHaveBeenCalledWith(
            50,
            2,
            true,
            true,
            true,
            true,
            true
        );
    });

    it('최대 tessellation 값 (50) 처리', () => {
        render(<TeapotMesh tessellation={50} />);

        expect(mockTeapotGeometryConstructor).toHaveBeenCalledWith(
            50,
            50,
            true,
            true,
            true,
            true,
            true
        );
    });

    it('모든 부분 숨김 상태로 렌더링', () => {
        const { container } = render(
            <TeapotMesh showLid={false} showBody={false} showBottom={false} />
        );

        expect(container).toBeTruthy();
    });

    it('autoRotate false로 렌더링', () => {
        const { container } = render(<TeapotMesh autoRotate={false} />);

        expect(container).toBeTruthy();
    });
});
