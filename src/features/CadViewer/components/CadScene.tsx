/**
 * Cad Viewer - Main Scene Container
 *
 * 3D 캔버스, 파일 업로드, 컨트롤, 레이어 패널을 오케스트레이션하는 메인 컨테이너
 *
 * @see {@link CadMeshViewer} - 3D 렌더링 오케스트레이터
 * @see {@link SceneCanvasViewer} - 공통 3D 캔버스 Viewer
 * @see {@link ControlPanelViewer} - 통합 컨트롤 패널 (Extrude 포함, Phase 2.1.6)
 */

import { useCallback, lazy, Suspense } from 'react';

import { FileText } from 'lucide-react';

import { CadMeshViewer } from '@/components/CadMeshViewer';
import { LoadingSpinner, PanelErrorBoundary } from '@/components/Common';
import { ControlPanelViewer } from '@/components/ControlPanelViewer';
import { formatFileSize } from '@/components/FilePanel';
import { FilePanelViewer } from '@/components/FilePanelViewer';
import { useSceneControls } from '@/hooks/useSceneControls';
import type { ParsedCADData, HatchFillMode, ExtrudeOptions } from '@/types/cad';

// React.lazy - SceneCanvasViewer (Three.js 무거운 의존성)
const SceneCanvasViewer = lazy(() =>
    import('@/components/SceneCanvasViewer').then((m) => ({
        default: m.SceneCanvasViewer,
    }))
);

import {
    DEFAULT_CAD_CONFIG,
    CAMERA_CONFIG,
    ORBIT_CONTROLS_CONFIG,
    GRID_CONFIG,
    DXF_UPLOAD_CONFIG,
    DXF_UPLOAD_MESSAGES,
} from '../constants';
import { useDxfLoader } from '../hooks/useDxfLoader';
import { DXF_SAMPLES } from '../utils/dxfSamples';

import { LayerPanel } from './LayerPanel';

import type { CadViewerConfig } from '../types';

export function CadScene() {
    // 공통 훅 사용
    const { config, controlsRef, handleConfigChange } =
        useSceneControls<CadViewerConfig>(DEFAULT_CAD_CONFIG);

    // DXF 파일 관리 훅 (상태 + 핸들러 위임)
    const {
        cadData,
        layers,
        cameraPosition,
        isLoading,
        progress,
        progressStage,
        error,
        handleFileSelect,
        handleSelectSample,
        handleUrlSubmit,
        handleResetFile,
        handleToggleLayer,
        handleToggleAllLayers,
        resetCameraPosition,
    } = useDxfLoader({ autoFitCamera: config.autoFitCamera });

    // 뷰 리셋 핸들러 (CadScene 전용 - OrbitControls 리셋 포함)
    const handleResetView = useCallback(() => {
        controlsRef.current?.reset();
        resetCameraPosition();
    }, [controlsRef, resetCameraPosition]);

    // 파일 초기화 + 컨트롤 리셋
    const handleClear = useCallback(() => {
        handleResetFile();
        controlsRef.current?.reset();
    }, [handleResetFile, controlsRef]);

    // 3D 모드 토글 핸들러 (Phase 2.1.6)
    const handleToggle3D = useCallback(
        (enabled: boolean) => {
            handleConfigChange({ enable3DExtrude: enabled });
        },
        [handleConfigChange]
    );

    // Extrude 옵션 변경 핸들러 (Phase 2.1.6)
    const handleExtrudeOptionsChange = useCallback(
        (options: ExtrudeOptions) => {
            handleConfigChange({ extrudeOptions: options });
        },
        [handleConfigChange]
    );

    // RenderMode 변경 핸들러
    const handleRenderModeChange = useCallback(
        (mode: HatchFillMode) => {
            handleConfigChange({ renderMode: mode });
        },
        [handleConfigChange]
    );

    // HATCH 엔티티 존재 여부
    const hasHatches = cadData?.hatches && cadData.hatches.length > 0;

    return (
        <div className="relative h-full w-full overflow-hidden">
            {/* 3D Canvas - 공통 컴포넌트 사용 */}
            <Suspense fallback={<LoadingSpinner size="lg" />}>
                <SceneCanvasViewer
                    camera={{
                        position: cameraPosition,
                        fov: CAMERA_CONFIG.fov,
                        near: CAMERA_CONFIG.near,
                        far: CAMERA_CONFIG.far,
                    }}
                    controls={{
                        ref: controlsRef,
                        enableDamping: ORBIT_CONTROLS_CONFIG.enableDamping,
                        dampingFactor: ORBIT_CONTROLS_CONFIG.dampingFactor,
                        minDistance: ORBIT_CONTROLS_CONFIG.minDistance,
                        maxDistance: ORBIT_CONTROLS_CONFIG.maxDistance,
                        autoRotate: config.autoRotate,
                        rotateSpeed: config.rotateSpeed,
                    }}
                    grid={{
                        show: config.showGrid,
                        size: GRID_CONFIG.size,
                        divisions: GRID_CONFIG.divisions,
                        colorCenterLine: GRID_CONFIG.colorCenterLine,
                        colorGrid: GRID_CONFIG.colorGrid,
                        rotation: [Math.PI / 2, 0, 0],
                    }}
                >
                    {/* Cad 모델 */}
                    {cadData && (
                        <CadMeshViewer
                            data={cadData}
                            center={true}
                            layers={layers}
                            renderMode={config.renderMode}
                            enable3DExtrude={config.enable3DExtrude}
                            extrudeOptions={config.extrudeOptions}
                            shadingMode={config.shadingMode}
                        />
                    )}
                </SceneCanvasViewer>
            </Suspense>

            {/* HTML Overlay - 파일 패널 */}
            <PanelErrorBoundary panelName="파일">
                <FilePanelViewer
                    uploadConfig={DXF_UPLOAD_CONFIG}
                    uploadMessages={DXF_UPLOAD_MESSAGES}
                    onFileSelect={handleFileSelect}
                    samples={DXF_SAMPLES}
                    onSelectSample={handleSelectSample}
                    isLoading={isLoading}
                    progress={progress}
                    progressStage={progressStage}
                    error={error}
                    hasData={!!cadData}
                    accentColor="green"
                    onUrlSubmit={handleUrlSubmit}
                    urlPlaceholder="https://example.com/drawing.dxf"
                />
            </PanelErrorBoundary>

            {/* HTML Overlay - 컨트롤 패널 */}
            <PanelErrorBoundary panelName="컨트롤">
                <ControlPanelViewer
                    config={config}
                    onConfigChange={handleConfigChange}
                    onResetView={handleResetView}
                    onClear={handleClear}
                    metadata={{
                        data: cadData,
                        render: (data: ParsedCADData) => (
                            <>
                                {/* 헤더: 이름 + 포맷 뱃지 */}
                                <div className="mb-2 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <FileText className="h-4 w-4 text-green-400" />
                                        <span
                                            className="max-w-[120px] truncate text-sm font-medium text-gray-200"
                                            title={data.metadata.fileName}
                                        >
                                            {data.metadata.fileName}
                                        </span>
                                    </div>
                                    <span className="rounded bg-green-900/50 px-1.5 py-0.5 text-[10px] text-green-400">
                                        DXF
                                    </span>
                                </div>

                                {/* P0: 핵심 정보 */}
                                <div className="mb-2 space-y-1 text-xs text-gray-400">
                                    <p>
                                        {formatFileSize(data.metadata.fileSize)}
                                    </p>
                                    <p>
                                        {data.metadata.entityCount.toLocaleString()}{' '}
                                        entities
                                    </p>
                                </div>

                                {/* P2: 성능 (작게) */}
                                <p className="text-[10px] text-gray-500">
                                    Parsed in {data.metadata.parseTime}ms
                                </p>
                            </>
                        ),
                    }}
                    extrude={{
                        showControls: !!hasHatches,
                        enabled: config.enable3DExtrude ?? false,
                        options: config.extrudeOptions!,
                        onToggle: handleToggle3D,
                        onOptionsChange: handleExtrudeOptionsChange,
                    }}
                    renderMode={{
                        mode: config.renderMode ?? 'outline',
                        onModeChange: handleRenderModeChange,
                    }}
                    ui={{
                        accentColor: 'green',
                        helpText:
                            'DXF 파일을 업로드하면 3D 와이어프레임으로 표시됩니다.',
                    }}
                />
            </PanelErrorBoundary>

            {/* HTML Overlay - 레이어 패널 */}
            {cadData && layers.size > 0 && (
                <PanelErrorBoundary panelName="레이어">
                    <LayerPanel
                        layers={layers}
                        onToggleLayer={handleToggleLayer}
                        onToggleAll={handleToggleAllLayers}
                    />
                </PanelErrorBoundary>
            )}
        </div>
    );
}
