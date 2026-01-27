/**
 * CadScene Component Tests
 * 메인 CadScene 컨테이너 컴포넌트 테스트
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { ParsedCADData, LayerInfo } from '../../types';

// Mock React.lazy와 Suspense
vi.mock('react', async () => {
    const actual = await vi.importActual('react');
    return {
        ...actual,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        lazy: (_fn: () => Promise<{ default: React.ComponentType }>) => {
            // lazy를 즉시 resolve하는 컴포넌트로 변환
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

// Mock useDxfLoader hook
const mockHandleFileSelect = vi.fn();
const mockHandleSelectSample = vi.fn();
const mockHandleUrlSubmit = vi.fn();
const mockHandleResetFile = vi.fn();
const mockHandleToggleLayer = vi.fn();
const mockHandleToggleAllLayers = vi.fn();
const mockResetCameraPosition = vi.fn();

const mockUseDxfLoader = vi.fn();

vi.mock('../../hooks/useDxfLoader', () => ({
    useDxfLoader: () => mockUseDxfLoader(),
}));

// Mock useSceneControls hook
const mockHandleConfigChange = vi.fn();
const mockControlsRef = { current: { reset: vi.fn() } };

vi.mock('@/hooks/useSceneControls', () => ({
    useSceneControls: () => ({
        config: {
            autoRotate: false,
            rotateSpeed: 1,
            showGrid: true,
            autoFitCamera: true,
            renderMode: 'outline',
            // Phase 2.1.6: 3D Extrude 옵션
            enable3DExtrude: false,
            extrudeOptions: {
                depth: 10,
                bevel: false,
                bevelSize: 0.1,
                bevelSegments: 1,
            },
        },
        controlsRef: mockControlsRef,
        handleConfigChange: mockHandleConfigChange,
    }),
}));

// Mock SceneCanvasViewer
vi.mock('@/components/SceneCanvasViewer', () => ({
    SceneCanvas: ({ children }: { children: React.ReactNode }) => (
        <div data-testid="scene-canvas">{children}</div>
    ),
}));

// Mock CadMeshViewer
vi.mock('@/components/CadMeshViewer', () => ({
    CadMeshViewer: () => <div data-testid="cad-mesh-viewer" />,
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
        extrude,
        renderMode,
        metadata,
    }: {
        onResetView: () => void;
        onClear: () => void;
        extrude?: {
            showControls: boolean;
            enabled: boolean;
        };
        renderMode?: {
            mode: string;
        };
        metadata?: {
            data: { hatches?: unknown[] } | null;
        };
    }) => (
        <div data-testid="control-panel">
            <button onClick={onResetView} data-testid="reset-view-btn">
                Reset View
            </button>
            <button onClick={onClear} data-testid="clear-btn">
                Clear
            </button>
            {/* Extrude controls with Render Mode (Phase 2.1.6) */}
            {extrude?.showControls && !extrude.enabled && renderMode && (
                <div data-testid="render-mode-section">
                    <span>Render Mode</span>
                    <span>{renderMode.mode}</span>
                </div>
            )}
            {/* HATCH count display */}
            {metadata?.data?.hatches && metadata.data.hatches.length > 0 && (
                <span>HATCH: {metadata.data.hatches.length}개</span>
            )}
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
        onSelectSample: (path: string) => void;
        onUrlSubmit: (url: string) => void;
        isLoading: boolean;
        error: string | null;
    }) => (
        <div data-testid="file-panel">
            <button
                onClick={() => onFileSelect(new File([], 'test.dxf'))}
                data-testid="file-select-btn"
            >
                Select File
            </button>
            <button
                onClick={() => onSelectSample('/samples/test.dxf')}
                data-testid="sample-select-btn"
            >
                Select Sample
            </button>
            <button
                onClick={() => onUrlSubmit('https://example.com/test.dxf')}
                data-testid="url-submit-btn"
            >
                Submit URL
            </button>
            {isLoading && <span data-testid="loading-indicator">Loading</span>}
            {error && <span data-testid="error-message">{error}</span>}
        </div>
    ),
}));

vi.mock('@/components/FilePanel', () => ({
    formatFileSize: (size: number) => `${size} bytes`,
}));

// lucide-react mock
vi.mock('lucide-react', () => ({
    FileText: () => <span data-testid="file-text-icon" />,
    Layers: () => <span data-testid="layers-icon" />,
    Eye: () => <span data-testid="eye-icon" />,
    EyeOff: () => <span data-testid="eye-off-icon" />,
    // Phase 2.1.6: DepthControl icons
    Box: () => <span data-testid="box-icon" />,
    RotateCcw: () => <span data-testid="rotate-ccw-icon" />,
    ChevronDown: () => <span data-testid="chevron-down-icon" />,
    ChevronUp: () => <span data-testid="chevron-up-icon" />,
}));

// Import CadScene after mocks
// eslint-disable-next-line import/order
import { CadScene } from '../CadScene';

// 테스트용 데이터 생성 헬퍼
const createMockCadData = (
    overrides: Partial<ParsedCADData> = {}
): ParsedCADData => ({
    lines: [
        {
            start: { x: 0, y: 0, z: 0 },
            end: { x: 100, y: 100, z: 0 },
            layer: 'Layer0',
        },
    ],
    circles: [],
    arcs: [],
    polylines: [],
    hatches: [],
    texts: [],
    mtexts: [],
    ellipses: [],
    splines: [],
    dimensions: [],
    bounds: {
        min: { x: 0, y: 0, z: 0 },
        max: { x: 100, y: 100, z: 0 },
    },
    layers: {
        Layer0: {
            name: 'Layer0',
            color: '#ffffff',
            visible: true,
            entityCount: 1,
        },
    },
    metadata: {
        fileName: 'test.dxf',
        fileSize: 1024,
        entityCount: 1,
        parseTime: 10,
    },
    ...overrides,
});

const createMockLayers = (): Map<string, LayerInfo> =>
    new Map([
        [
            'Layer0',
            { name: 'Layer0', color: '#ffffff', visible: true, entityCount: 5 },
        ],
        [
            'Layer1',
            { name: 'Layer1', color: '#ff0000', visible: true, entityCount: 3 },
        ],
    ]);

describe('CadScene', () => {
    beforeEach(() => {
        vi.clearAllMocks();

        // 기본 mock 반환값 설정
        mockUseDxfLoader.mockReturnValue({
            cadData: null,
            layers: new Map(),
            cameraPosition: [0, 0, 500],
            isLoading: false,
            progress: 0,
            progressStage: '',
            error: null,
            handleFileSelect: mockHandleFileSelect,
            handleSelectSample: mockHandleSelectSample,
            handleUrlSubmit: mockHandleUrlSubmit,
            handleResetFile: mockHandleResetFile,
            handleToggleLayer: mockHandleToggleLayer,
            handleToggleAllLayers: mockHandleToggleAllLayers,
            resetCameraPosition: mockResetCameraPosition,
        });
    });

    describe('초기 렌더링', () => {
        it('컴포넌트가 정상적으로 렌더링됨', () => {
            render(<CadScene />);

            expect(screen.getByTestId('file-panel')).toBeInTheDocument();
            expect(screen.getByTestId('control-panel')).toBeInTheDocument();
        });

        it('CAD 데이터가 없을 때 CadMeshViewer가 렌더링되지 않음', () => {
            render(<CadScene />);

            expect(
                screen.queryByTestId('cad-mesh-viewer')
            ).not.toBeInTheDocument();
        });

        it('레이어가 없을 때 LayerPanel이 렌더링되지 않음', () => {
            render(<CadScene />);

            expect(screen.queryByText('레이어')).not.toBeInTheDocument();
        });
    });

    describe('CAD 데이터 로딩 후', () => {
        it('CAD 데이터가 있을 때 CadMeshViewer가 렌더링됨', () => {
            mockUseDxfLoader.mockReturnValue({
                cadData: createMockCadData(),
                layers: createMockLayers(),
                cameraPosition: [0, 0, 500],
                isLoading: false,
                progress: 0,
                progressStage: '',
                error: null,
                handleFileSelect: mockHandleFileSelect,
                handleSelectSample: mockHandleSelectSample,
                handleUrlSubmit: mockHandleUrlSubmit,
                handleResetFile: mockHandleResetFile,
                handleToggleLayer: mockHandleToggleLayer,
                handleToggleAllLayers: mockHandleToggleAllLayers,
                resetCameraPosition: mockResetCameraPosition,
            });

            render(<CadScene />);

            expect(screen.getByTestId('cad-mesh-viewer')).toBeInTheDocument();
        });

        it('레이어가 있을 때 LayerPanel이 렌더링됨', () => {
            mockUseDxfLoader.mockReturnValue({
                cadData: createMockCadData(),
                layers: createMockLayers(),
                cameraPosition: [0, 0, 500],
                isLoading: false,
                progress: 0,
                progressStage: '',
                error: null,
                handleFileSelect: mockHandleFileSelect,
                handleSelectSample: mockHandleSelectSample,
                handleUrlSubmit: mockHandleUrlSubmit,
                handleResetFile: mockHandleResetFile,
                handleToggleLayer: mockHandleToggleLayer,
                handleToggleAllLayers: mockHandleToggleAllLayers,
                resetCameraPosition: mockResetCameraPosition,
            });

            render(<CadScene />);

            // LayerPanel은 모킹되지 않았으므로 실제 렌더링 확인
            expect(screen.getByText('레이어 (2)')).toBeInTheDocument();
        });
    });

    describe('HATCH 엔티티가 있을 때', () => {
        it('HATCH가 있으면 렌더 모드 패널이 표시됨', () => {
            const cadDataWithHatch = createMockCadData({
                hatches: [
                    {
                        boundaries: [
                            {
                                type: 'polyline' as const,
                                vertices: [
                                    { x: 0, y: 0, z: 0 },
                                    { x: 100, y: 0, z: 0 },
                                    { x: 100, y: 100, z: 0 },
                                    { x: 0, y: 100, z: 0 },
                                ],
                                closed: true,
                            },
                        ],
                        patternName: 'SOLID',
                        isSolid: true,
                        patternScale: 1,
                        patternAngle: 0,
                        color: undefined,
                        layer: 'Layer0',
                    },
                ],
            });

            mockUseDxfLoader.mockReturnValue({
                cadData: cadDataWithHatch,
                layers: createMockLayers(),
                cameraPosition: [0, 0, 500],
                isLoading: false,
                progress: 0,
                progressStage: '',
                error: null,
                handleFileSelect: mockHandleFileSelect,
                handleSelectSample: mockHandleSelectSample,
                handleUrlSubmit: mockHandleUrlSubmit,
                handleResetFile: mockHandleResetFile,
                handleToggleLayer: mockHandleToggleLayer,
                handleToggleAllLayers: mockHandleToggleAllLayers,
                resetCameraPosition: mockResetCameraPosition,
            });

            render(<CadScene />);

            expect(screen.getByText('Render Mode')).toBeInTheDocument();
            expect(screen.getByText('HATCH: 1개')).toBeInTheDocument();
        });

        it('HATCH가 없으면 렌더 모드 패널이 표시되지 않음', () => {
            mockUseDxfLoader.mockReturnValue({
                cadData: createMockCadData(),
                layers: createMockLayers(),
                cameraPosition: [0, 0, 500],
                isLoading: false,
                progress: 0,
                progressStage: '',
                error: null,
                handleFileSelect: mockHandleFileSelect,
                handleSelectSample: mockHandleSelectSample,
                handleUrlSubmit: mockHandleUrlSubmit,
                handleResetFile: mockHandleResetFile,
                handleToggleLayer: mockHandleToggleLayer,
                handleToggleAllLayers: mockHandleToggleAllLayers,
                resetCameraPosition: mockResetCameraPosition,
            });

            render(<CadScene />);

            expect(screen.queryByText('Render Mode')).not.toBeInTheDocument();
        });
    });

    describe('파일 핸들러 상호작용', () => {
        it('파일 선택 시 handleFileSelect가 호출됨', () => {
            render(<CadScene />);

            fireEvent.click(screen.getByTestId('file-select-btn'));

            expect(mockHandleFileSelect).toHaveBeenCalled();
        });

        it('샘플 선택 시 handleSelectSample이 호출됨', () => {
            render(<CadScene />);

            fireEvent.click(screen.getByTestId('sample-select-btn'));

            expect(mockHandleSelectSample).toHaveBeenCalledWith(
                '/samples/test.dxf'
            );
        });

        it('URL 제출 시 handleUrlSubmit이 호출됨', () => {
            render(<CadScene />);

            fireEvent.click(screen.getByTestId('url-submit-btn'));

            expect(mockHandleUrlSubmit).toHaveBeenCalledWith(
                'https://example.com/test.dxf'
            );
        });
    });

    describe('컨트롤 패널 상호작용', () => {
        it('뷰 리셋 시 OrbitControls와 카메라가 리셋됨', () => {
            render(<CadScene />);

            fireEvent.click(screen.getByTestId('reset-view-btn'));

            expect(mockControlsRef.current.reset).toHaveBeenCalled();
            expect(mockResetCameraPosition).toHaveBeenCalled();
        });

        it('클리어 시 파일 리셋과 컨트롤 리셋이 호출됨', () => {
            render(<CadScene />);

            fireEvent.click(screen.getByTestId('clear-btn'));

            expect(mockHandleResetFile).toHaveBeenCalled();
            expect(mockControlsRef.current.reset).toHaveBeenCalled();
        });
    });

    describe('로딩 상태', () => {
        it('로딩 중일 때 로딩 인디케이터가 표시됨', () => {
            mockUseDxfLoader.mockReturnValue({
                cadData: null,
                layers: new Map(),
                cameraPosition: [0, 0, 500],
                isLoading: true,
                progress: 50,
                progressStage: 'parsing',
                error: null,
                handleFileSelect: mockHandleFileSelect,
                handleSelectSample: mockHandleSelectSample,
                handleUrlSubmit: mockHandleUrlSubmit,
                handleResetFile: mockHandleResetFile,
                handleToggleLayer: mockHandleToggleLayer,
                handleToggleAllLayers: mockHandleToggleAllLayers,
                resetCameraPosition: mockResetCameraPosition,
            });

            render(<CadScene />);

            expect(screen.getByTestId('loading-indicator')).toBeInTheDocument();
        });
    });

    describe('에러 상태', () => {
        it('에러가 있을 때 에러 메시지가 표시됨', () => {
            mockUseDxfLoader.mockReturnValue({
                cadData: null,
                layers: new Map(),
                cameraPosition: [0, 0, 500],
                isLoading: false,
                progress: 0,
                progressStage: '',
                error: '파일 로딩 실패',
                handleFileSelect: mockHandleFileSelect,
                handleSelectSample: mockHandleSelectSample,
                handleUrlSubmit: mockHandleUrlSubmit,
                handleResetFile: mockHandleResetFile,
                handleToggleLayer: mockHandleToggleLayer,
                handleToggleAllLayers: mockHandleToggleAllLayers,
                resetCameraPosition: mockResetCameraPosition,
            });

            render(<CadScene />);

            expect(screen.getByTestId('error-message')).toHaveTextContent(
                '파일 로딩 실패'
            );
        });
    });

    describe('레이어 토글', () => {
        it('레이어 토글 시 handleToggleLayer가 호출됨', () => {
            mockUseDxfLoader.mockReturnValue({
                cadData: createMockCadData(),
                layers: createMockLayers(),
                cameraPosition: [0, 0, 500],
                isLoading: false,
                progress: 0,
                progressStage: '',
                error: null,
                handleFileSelect: mockHandleFileSelect,
                handleSelectSample: mockHandleSelectSample,
                handleUrlSubmit: mockHandleUrlSubmit,
                handleResetFile: mockHandleResetFile,
                handleToggleLayer: mockHandleToggleLayer,
                handleToggleAllLayers: mockHandleToggleAllLayers,
                resetCameraPosition: mockResetCameraPosition,
            });

            render(<CadScene />);

            // Layer0 클릭
            fireEvent.click(screen.getByText('Layer0'));

            expect(mockHandleToggleLayer).toHaveBeenCalledWith('Layer0');
        });

        it('전체 레이어 토글 시 handleToggleAllLayers가 호출됨', () => {
            mockUseDxfLoader.mockReturnValue({
                cadData: createMockCadData(),
                layers: createMockLayers(),
                cameraPosition: [0, 0, 500],
                isLoading: false,
                progress: 0,
                progressStage: '',
                error: null,
                handleFileSelect: mockHandleFileSelect,
                handleSelectSample: mockHandleSelectSample,
                handleUrlSubmit: mockHandleUrlSubmit,
                handleResetFile: mockHandleResetFile,
                handleToggleLayer: mockHandleToggleLayer,
                handleToggleAllLayers: mockHandleToggleAllLayers,
                resetCameraPosition: mockResetCameraPosition,
            });

            render(<CadScene />);

            // 전체 숨김 버튼 클릭
            fireEvent.click(screen.getByText('전체 숨김'));

            expect(mockHandleToggleAllLayers).toHaveBeenCalledWith(false);
        });
    });
});
