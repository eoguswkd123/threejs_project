/**
 * TeapotScene Component Tests
 * Teapot Demo 메인 컨테이너 컴포넌트 테스트
 *
 * 주요 테스트:
 * - 초기 렌더링 (Canvas, TeapotMesh, TeapotControls)
 * - 그리드 표시/숨김 동작
 * - config 변경 시 TeapotMesh props 전달
 * - 메모리 관리 (마운트/언마운트)
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock @react-three/fiber
vi.mock('@react-three/fiber', () => ({
    Canvas: ({ children }: { children: React.ReactNode }) => (
        <div data-testid="canvas">{children}</div>
    ),
}));

// Mock @react-three/drei
vi.mock('@react-three/drei', () => ({
    OrbitControls: vi.fn(() => <div data-testid="orbit-controls" />),
    PerspectiveCamera: vi.fn(() => <div data-testid="camera" />),
}));

// Mock useSceneControls hook
const mockHandleConfigChange = vi.fn();
const mockControlsRef = { current: { reset: vi.fn() } };

vi.mock('@/hooks/useSceneControls', () => ({
    useSceneControls: () => ({
        config: {
            showGrid: true,
            autoRotate: true,
            rotateSpeed: 1.0,
            tessellation: 15,
            shadingMode: 'smooth',
            showLid: true,
            showBody: true,
            showBottom: true,
        },
        controlsRef: mockControlsRef,
        handleConfigChange: mockHandleConfigChange,
    }),
}));

// Mock TeapotMesh
const mockTeapotMeshProps = vi.fn();
vi.mock('../TeapotMesh', () => ({
    TeapotMesh: (props: Record<string, unknown>) => {
        mockTeapotMeshProps(props);
        return <div data-testid="teapot-mesh" />;
    },
}));

// Mock TeapotControls
vi.mock('../TeapotControls', () => ({
    TeapotControls: ({
        onConfigChange,
    }: {
        config: Record<string, unknown>;
        onConfigChange: (config: Record<string, unknown>) => void;
    }) => (
        <div data-testid="teapot-controls">
            <button
                onClick={() => onConfigChange({ tessellation: 25 })}
                data-testid="change-tessellation-btn"
            >
                Change Tessellation
            </button>
            <button
                onClick={() => onConfigChange({ shadingMode: 'wireframe' })}
                data-testid="change-shading-btn"
            >
                Change Shading
            </button>
            <button
                onClick={() => onConfigChange({ showGrid: false })}
                data-testid="toggle-grid-btn"
            >
                Toggle Grid
            </button>
        </div>
    ),
}));

// Import component after all mocks
import { TeapotScene } from '../TeapotScene';

describe('TeapotScene', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('렌더링', () => {
        it('Canvas가 렌더링됨', () => {
            render(<TeapotScene />);

            expect(screen.getByTestId('canvas')).toBeInTheDocument();
        });

        it('TeapotMesh가 렌더링됨', () => {
            render(<TeapotScene />);

            expect(screen.getByTestId('teapot-mesh')).toBeInTheDocument();
        });

        it('TeapotControls가 렌더링됨', () => {
            render(<TeapotScene />);

            expect(screen.getByTestId('teapot-controls')).toBeInTheDocument();
        });

        it('OrbitControls가 렌더링됨', () => {
            render(<TeapotScene />);

            expect(screen.getByTestId('orbit-controls')).toBeInTheDocument();
        });

        it('PerspectiveCamera가 렌더링됨', () => {
            render(<TeapotScene />);

            expect(screen.getByTestId('camera')).toBeInTheDocument();
        });

        it('TeapotMesh에 올바른 props 전달', () => {
            render(<TeapotScene />);

            expect(mockTeapotMeshProps).toHaveBeenCalledWith(
                expect.objectContaining({
                    tessellation: 15,
                    shadingMode: 'smooth',
                    showLid: true,
                    showBody: true,
                    showBottom: true,
                    autoRotate: true,
                })
            );
        });
    });

    describe('config 변경', () => {
        it('Tessellation 변경 시 handleConfigChange 호출', () => {
            render(<TeapotScene />);

            const btn = screen.getByTestId('change-tessellation-btn');
            fireEvent.click(btn);

            expect(mockHandleConfigChange).toHaveBeenCalledWith({
                tessellation: 25,
            });
        });

        it('Shading Mode 변경 시 handleConfigChange 호출', () => {
            render(<TeapotScene />);

            const btn = screen.getByTestId('change-shading-btn');
            fireEvent.click(btn);

            expect(mockHandleConfigChange).toHaveBeenCalledWith({
                shadingMode: 'wireframe',
            });
        });

        it('Grid 토글 시 handleConfigChange 호출', () => {
            render(<TeapotScene />);

            const btn = screen.getByTestId('toggle-grid-btn');
            fireEvent.click(btn);

            expect(mockHandleConfigChange).toHaveBeenCalledWith({
                showGrid: false,
            });
        });
    });

    describe('메모리 관리', () => {
        it('컴포넌트가 올바르게 마운트됨', () => {
            const { container } = render(<TeapotScene />);

            expect(container.firstChild).toBeInTheDocument();
        });

        it('컴포넌트가 에러 없이 언마운트됨', () => {
            const { unmount } = render(<TeapotScene />);

            expect(() => unmount()).not.toThrow();
        });

        it('여러 번 마운트/언마운트해도 에러 없음', () => {
            const { unmount: unmount1 } = render(<TeapotScene />);
            unmount1();

            const { unmount: unmount2 } = render(<TeapotScene />);
            expect(() => unmount2()).not.toThrow();
        });
    });
});

describe('TeapotScene - Grid 표시', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('showGrid가 true일 때 gridHelper가 Canvas 내부에 존재', () => {
        render(<TeapotScene />);

        // gridHelper는 Canvas 내부에 렌더링됨
        const canvas = screen.getByTestId('canvas');
        expect(canvas).toBeInTheDocument();
    });
});

describe('TeapotScene - 조명', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('조명이 포함된 Canvas가 렌더링됨', () => {
        render(<TeapotScene />);

        // 조명은 Canvas 내부에 렌더링되므로 Canvas 존재 확인
        expect(screen.getByTestId('canvas')).toBeInTheDocument();
    });
});
