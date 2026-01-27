/**
 * HologramScene Component Tests
 * 홀로그램 뷰어 메인 컨테이너 컴포넌트 테스트
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock React.lazy와 Suspense
vi.mock('react', async () => {
    const actual = await vi.importActual('react');
    return {
        ...actual,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        lazy: (_fn: () => Promise<{ default: React.ComponentType }>) => {
            const LazyComponent = (props: Record<string, unknown>) => {
                const Component = vi.fn(() => (
                    <div data-testid="scene-canvas">
                        {props.children as React.ReactNode}
                    </div>
                ));
                return <Component {...props} />;
            };
            return LazyComponent;
        },
    };
});

// Mock useHologramLoader hook
const mockLoadModelFromUrl = vi.fn();
const mockLoadModelFromFile = vi.fn().mockResolvedValue('blob:test-url');
const mockClearModel = vi.fn();

const mockUseHologramLoader = vi.fn();

vi.mock('../../hooks/useHologramLoader', () => ({
    useHologramLoader: () => mockUseHologramLoader(),
}));

// Mock useSceneControls hook
const mockHandleConfigChange = vi.fn();
const mockHandleResetView = vi.fn();
const mockControlsRef = { current: { reset: vi.fn() } };

vi.mock('@/hooks/useSceneControls', () => ({
    useSceneControls: () => ({
        config: {
            autoRotate: false,
            rotateSpeed: 1,
            showGrid: true,
            backgroundColor: '#000000',
            enableBloom: true,
            bloomIntensity: 1.5,
            bloomThreshold: 0.5,
            enableScanline: true,
            scanlineDensity: 2,
            shadingMode: 'hologram',
            hologramSettings: {
                color: '#00ffff',
                opacity: 0.8,
            },
        },
        controlsRef: mockControlsRef,
        handleConfigChange: mockHandleConfigChange,
        handleResetView: mockHandleResetView,
    }),
}));

// Mock SceneCanvasViewer
vi.mock('@/components/SceneCanvasViewer', () => ({
    SceneCanvasViewer: ({ children }: { children: React.ReactNode }) => (
        <div data-testid="scene-canvas">{children}</div>
    ),
}));

// Mock ModelMesh
vi.mock('@/components/ModelMesh', () => ({
    ModelMesh: () => <div data-testid="model-mesh" />,
}));

// Mock UI 컴포넌트
vi.mock('@/components/Common', () => ({
    LoadingSpinner: () => <div data-testid="loading-spinner">Loading...</div>,
    PanelErrorBoundary: ({ children }: { children: React.ReactNode }) => (
        <div>{children}</div>
    ),
}));

vi.mock('@/components/ControlPanelViewer', () => ({
    ControlPanelViewer: ({
        onResetView,
        onClear,
    }: {
        onResetView: () => void;
        onClear: () => void;
    }) => (
        <div data-testid="control-panel">
            <button onClick={onResetView} data-testid="reset-view-btn">
                Reset View
            </button>
            <button onClick={onClear} data-testid="clear-btn">
                Clear
            </button>
        </div>
    ),
}));

vi.mock('@/components/FilePanelViewer', () => ({
    FilePanelViewer: ({
        onFileSelect,
        onSelectSample,
        onUrlSubmit,
        isLoading,
        error,
    }: {
        onFileSelect: (file: File) => void;
        onSelectSample: (sample: { path: string }) => void;
        onUrlSubmit: (url: string) => void;
        isLoading: boolean;
        error: { message: string } | null;
    }) => (
        <div data-testid="file-panel">
            <button
                onClick={() =>
                    onFileSelect(
                        new File(['test'], 'model.glb', {
                            type: 'model/gltf-binary',
                        })
                    )
                }
                data-testid="file-select-btn"
            >
                Select File
            </button>
            <button
                onClick={() => onSelectSample({ path: '/samples/test.glb' })}
                data-testid="sample-select-btn"
            >
                Select Sample
            </button>
            <button
                onClick={() => onUrlSubmit('https://example.com/model.glb')}
                data-testid="url-submit-btn"
            >
                Submit URL
            </button>
            {isLoading && <span data-testid="loading-state">Loading...</span>}
            {error && <span data-testid="error-state">{error.message}</span>}
        </div>
    ),
}));

// Import component after all mocks
import { HologramScene } from '../HologramScene';

describe('HologramScene', () => {
    beforeEach(() => {
        vi.clearAllMocks();

        // URL 모킹 - global에 정의
        global.URL.createObjectURL = vi.fn().mockReturnValue('blob:test-url');
        global.URL.revokeObjectURL = vi.fn();

        // 기본 mock 상태: idle
        mockUseHologramLoader.mockReturnValue({
            selectedModel: null,
            status: 'idle',
            error: null,
            loadModelFromUrl: mockLoadModelFromUrl,
            loadModelFromFile: mockLoadModelFromFile,
            clearModel: mockClearModel,
        });
    });

    describe('렌더링', () => {
        it('초기 상태에서 올바르게 렌더링', () => {
            render(<HologramScene />);

            expect(screen.getByTestId('scene-canvas')).toBeInTheDocument();
            expect(screen.getByTestId('file-panel')).toBeInTheDocument();
            expect(screen.getByTestId('control-panel')).toBeInTheDocument();
        });

        it('모델이 없을 때 ModelMesh는 렌더링되지 않음', () => {
            render(<HologramScene />);

            expect(screen.queryByTestId('model-mesh')).not.toBeInTheDocument();
        });

        it('모델 로드 성공 시 ModelMesh 렌더링', () => {
            mockUseHologramLoader.mockReturnValue({
                selectedModel: { url: 'test.glb', name: 'Test Model' },
                status: 'success',
                error: null,
                loadModelFromUrl: mockLoadModelFromUrl,
                loadModelFromFile: mockLoadModelFromFile,
                clearModel: mockClearModel,
            });

            render(<HologramScene />);

            expect(screen.getByTestId('model-mesh')).toBeInTheDocument();
        });
    });

    describe('파일 로딩', () => {
        it('샘플 파일 선택 시 loadModelFromUrl 호출', () => {
            render(<HologramScene />);

            const sampleBtn = screen.getByTestId('sample-select-btn');
            fireEvent.click(sampleBtn);

            expect(mockLoadModelFromUrl).toHaveBeenCalledWith(
                '/samples/test.glb'
            );
        });

        it('URL 제출 시 loadModelFromUrl 호출', () => {
            render(<HologramScene />);

            const urlBtn = screen.getByTestId('url-submit-btn');
            fireEvent.click(urlBtn);

            expect(mockLoadModelFromUrl).toHaveBeenCalledWith(
                'https://example.com/model.glb'
            );
        });

        it('로컬 파일 선택 시 loadModelFromFile 호출', () => {
            render(<HologramScene />);

            const fileBtn = screen.getByTestId('file-select-btn');
            fireEvent.click(fileBtn);

            expect(mockLoadModelFromFile).toHaveBeenCalled();
        });

        it('로딩 상태 표시', () => {
            mockUseHologramLoader.mockReturnValue({
                selectedModel: null,
                status: 'loading',
                error: null,
                loadModelFromUrl: mockLoadModelFromUrl,
                loadModelFromFile: mockLoadModelFromFile,
                clearModel: mockClearModel,
            });

            render(<HologramScene />);

            expect(screen.getByTestId('loading-state')).toBeInTheDocument();
        });
    });

    describe('에러 처리', () => {
        it('에러 상태에서 에러 메시지 표시', () => {
            mockUseHologramLoader.mockReturnValue({
                selectedModel: null,
                status: 'error',
                error: new Error('모델 로드 실패'),
                loadModelFromUrl: mockLoadModelFromUrl,
                loadModelFromFile: mockLoadModelFromFile,
                clearModel: mockClearModel,
            });

            render(<HologramScene />);

            expect(screen.getByTestId('error-state')).toHaveTextContent(
                '모델 로드 실패'
            );
        });
    });

    describe('모델 초기화', () => {
        it('초기화 버튼 클릭 시 clearModel 호출', () => {
            mockUseHologramLoader.mockReturnValue({
                selectedModel: { url: 'test.glb', name: 'Test' },
                status: 'success',
                error: null,
                loadModelFromUrl: mockLoadModelFromUrl,
                loadModelFromFile: mockLoadModelFromFile,
                clearModel: mockClearModel,
            });

            render(<HologramScene />);

            const clearBtn = screen.getByTestId('clear-btn');
            fireEvent.click(clearBtn);

            expect(mockClearModel).toHaveBeenCalled();
        });

        it('초기화 시 OrbitControls도 리셋', () => {
            mockUseHologramLoader.mockReturnValue({
                selectedModel: { url: 'test.glb', name: 'Test' },
                status: 'success',
                error: null,
                loadModelFromUrl: mockLoadModelFromUrl,
                loadModelFromFile: mockLoadModelFromFile,
                clearModel: mockClearModel,
            });

            render(<HologramScene />);

            const clearBtn = screen.getByTestId('clear-btn');
            fireEvent.click(clearBtn);

            expect(mockControlsRef.current.reset).toHaveBeenCalled();
        });
    });

    describe('뷰 리셋', () => {
        it('뷰 리셋 버튼 클릭 시 handleResetView 호출', () => {
            render(<HologramScene />);

            const resetBtn = screen.getByTestId('reset-view-btn');
            fireEvent.click(resetBtn);

            expect(mockHandleResetView).toHaveBeenCalled();
        });
    });

    describe('메모리 관리', () => {
        it('컴포넌트가 올바르게 마운트/언마운트', () => {
            const { unmount } = render(<HologramScene />);

            expect(screen.getByTestId('scene-canvas')).toBeInTheDocument();

            // 언마운트 시 에러 없이 처리
            expect(() => unmount()).not.toThrow();
        });
    });
});
