/**
 * HologramViewer - HologramScene Component
 *
 * 홀로그램 뷰어 메인 컨테이너
 * 파일 업로드 + 3D 캔버스 + 컨트롤 패널 통합
 *
 * @see {@link SceneCanvasViewer} - Bloom/Scanline 효과 지원 캔버스 Viewer
 * @see {@link ControlPanelViewer} - 공통 컨트롤 패널
 */

import { Suspense, useCallback, useRef, useEffect } from 'react';

import { Box } from 'lucide-react';

import { LoadingSpinner, PanelErrorBoundary } from '@/components/Common';
import { ControlPanelViewer } from '@/components/ControlPanelViewer';
import { formatFileSize, type SampleInfo } from '@/components/FilePanel';
import { FilePanelViewer } from '@/components/FilePanelViewer';
import { ModelMesh } from '@/components/ModelMesh';
import { SceneCanvasViewer } from '@/components/SceneCanvasViewer';
import type { PointLightConfig } from '@/components/SceneCanvasViewer';
import { GLTF_SAMPLES } from '@/features/WorkerViewer/utils/gltfSamples';
import { useSceneControls } from '@/hooks/useSceneControls';

import {
    DEFAULT_HOLOGRAM_CONFIG,
    HOLOGRAM_CAMERA_CONFIG,
    HOLOGRAM_ORBIT_CONTROLS_CONFIG,
    HOLOGRAM_UPLOAD_CONFIG,
    HOLOGRAM_UPLOAD_MESSAGES,
} from '../constants';
import { useHologramLoader } from '../hooks/useHologramLoader';

import type { HologramViewerConfig, HologramModelInfo } from '../types';

/** 홀로그램용 PointLight 설정 (시안 색상) */
const HOLOGRAM_POINT_LIGHTS: PointLightConfig[] = [
    { position: [10, 10, 10], intensity: 0.3, color: '#00ffff' },
    { position: [-10, -10, -10], intensity: 0.1, color: '#00ffff' },
];

/**
 * 홀로그램 뷰어 메인 Scene
 *
 * 특징:
 * - glTF/glb 파일 업로드 지원
 * - 홀로그램 스타일 렌더링 (Bloom + Scanline)
 * - 표준 컨트롤 패널 UI
 */
export function HologramScene() {
    // 공통 훅 사용
    const { config, controlsRef, handleConfigChange, handleResetView } =
        useSceneControls<HologramViewerConfig>(DEFAULT_HOLOGRAM_CONFIG);

    const objectUrlRef = useRef<string | null>(null);

    const {
        selectedModel,
        status,
        error,
        loadModelFromUrl,
        loadModelFromFile,
        clearModel,
    } = useHologramLoader();

    /**
     * 이전 ObjectURL 정리
     */
    const cleanupObjectUrl = useCallback(() => {
        if (objectUrlRef.current) {
            URL.revokeObjectURL(objectUrlRef.current);
            objectUrlRef.current = null;
        }
    }, []);

    /**
     * 로컬 파일 선택 핸들러
     */
    const handleFileSelect = useCallback(
        async (file: File) => {
            cleanupObjectUrl();
            const newUrl = await loadModelFromFile(file);
            if (newUrl) {
                objectUrlRef.current = newUrl;
            }
        },
        [cleanupObjectUrl, loadModelFromFile]
    );

    /**
     * 샘플 파일 선택 핸들러
     */
    const handleSelectSample = useCallback(
        (sample: SampleInfo) => {
            cleanupObjectUrl();
            loadModelFromUrl(sample.path);
        },
        [cleanupObjectUrl, loadModelFromUrl]
    );

    /**
     * URL 입력 핸들러
     */
    const handleUrlSubmit = useCallback(
        async (url: string) => {
            cleanupObjectUrl();
            await loadModelFromUrl(url);
        },
        [cleanupObjectUrl, loadModelFromUrl]
    );

    /**
     * 모델 클리어 핸들러
     */
    const handleClearModel = useCallback(() => {
        cleanupObjectUrl();
        clearModel();
        // OrbitControls 리셋
        if (controlsRef.current) {
            controlsRef.current.reset();
        }
    }, [cleanupObjectUrl, clearModel, controlsRef]);

    // 컴포넌트 언마운트 시 정리
    useEffect(() => {
        return () => {
            cleanupObjectUrl();
        };
    }, [cleanupObjectUrl]);

    return (
        <div className="relative h-full w-full overflow-hidden bg-black">
            <PanelErrorBoundary panelName="HologramScene">
                {/* 3D Canvas + Postprocessing */}
                <Suspense fallback={<LoadingSpinner size="lg" />}>
                    <SceneCanvasViewer
                        camera={{
                            position: [
                                ...HOLOGRAM_CAMERA_CONFIG.defaultPosition,
                            ],
                            fov: HOLOGRAM_CAMERA_CONFIG.fov,
                            near: HOLOGRAM_CAMERA_CONFIG.near,
                            far: HOLOGRAM_CAMERA_CONFIG.far,
                        }}
                        controls={{
                            ref: controlsRef,
                            enableDamping:
                                HOLOGRAM_ORBIT_CONTROLS_CONFIG.enableDamping,
                            dampingFactor:
                                HOLOGRAM_ORBIT_CONTROLS_CONFIG.dampingFactor,
                            minDistance:
                                HOLOGRAM_ORBIT_CONTROLS_CONFIG.minDistance,
                            maxDistance:
                                HOLOGRAM_ORBIT_CONTROLS_CONFIG.maxDistance,
                            autoRotate: config.autoRotate,
                            rotateSpeed: config.rotateSpeed,
                        }}
                        canvas={{
                            backgroundColor: config.backgroundColor,
                            glAlpha: true,
                        }}
                        lighting={{
                            ambientIntensity: 0.2,
                            pointLights: HOLOGRAM_POINT_LIGHTS,
                        }}
                        grid={{
                            show: config.showGrid,
                            size: 20,
                            divisions: 20,
                            colorCenterLine: 0x00ffff,
                            colorGrid: 0x004444,
                        }}
                        effects={{
                            enableBloom: config.enableBloom,
                            bloomIntensity: config.bloomIntensity,
                            bloomThreshold: config.bloomThreshold,
                            enableScanline: config.enableScanline,
                            scanlineDensity: config.scanlineDensity,
                        }}
                    >
                        {selectedModel && status === 'success' && (
                            <Suspense fallback={null}>
                                <ModelMesh
                                    url={selectedModel.url}
                                    hologramSettings={config.hologramSettings}
                                    shadingMode={config.shadingMode}
                                    autoRotate={config.autoRotate}
                                    rotateSpeed={config.rotateSpeed}
                                />
                            </Suspense>
                        )}
                    </SceneCanvasViewer>
                </Suspense>

                {/* HTML Overlay - 파일 패널 */}
                <PanelErrorBoundary panelName="파일">
                    <FilePanelViewer
                        uploadConfig={HOLOGRAM_UPLOAD_CONFIG}
                        uploadMessages={HOLOGRAM_UPLOAD_MESSAGES}
                        samples={GLTF_SAMPLES}
                        onFileSelect={handleFileSelect}
                        onSelectSample={handleSelectSample}
                        onUrlSubmit={handleUrlSubmit}
                        isLoading={status === 'loading'}
                        error={
                            error
                                ? { code: 'LOAD_ERROR', message: error.message }
                                : null
                        }
                        hasData={!!selectedModel}
                        accentColor="blue"
                        urlPlaceholder="https://example.com/model.glb"
                    />
                </PanelErrorBoundary>

                {/* HTML Overlay - 컨트롤 패널 */}
                <PanelErrorBoundary panelName="컨트롤">
                    <ControlPanelViewer
                        config={config}
                        onConfigChange={handleConfigChange}
                        onResetView={handleResetView}
                        onClear={handleClearModel}
                        showShadingSelect={true}
                        includeHologramOption={true}
                        metadata={{
                            data: selectedModel,
                            render: (data: HologramModelInfo) => (
                                <>
                                    {/* 헤더: 이름 + 포맷 뱃지 */}
                                    <div className="mb-2 flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Box className="h-4 w-4 text-cyan-400" />
                                            <span
                                                className="max-w-[120px] truncate text-sm font-medium text-gray-200"
                                                title={data.name}
                                            >
                                                {data.name}
                                            </span>
                                        </div>
                                        {data.format && (
                                            <span className="rounded bg-cyan-900/50 px-1.5 py-0.5 text-[10px] text-cyan-400">
                                                {data.format.toUpperCase()}
                                            </span>
                                        )}
                                    </div>

                                    {/* 파일 크기 */}
                                    {data.fileSize && (
                                        <p className="mb-2 text-xs text-gray-400">
                                            {formatFileSize(data.fileSize)}
                                        </p>
                                    )}

                                    {/* 설명 */}
                                    {data.description && (
                                        <p className="line-clamp-2 text-[10px] text-gray-500">
                                            {data.description}
                                        </p>
                                    )}
                                </>
                            ),
                        }}
                        ui={{ accentColor: 'blue' }}
                    />
                </PanelErrorBoundary>
            </PanelErrorBoundary>
        </div>
    );
}
