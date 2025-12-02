/**
 * CAD Viewer - Scene Component
 * CAD 뷰어 최상위 Scene 래퍼
 */

import { useState, useCallback, useRef } from 'react';

import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';

import {
    DEFAULT_CAD_CONFIG,
    CAMERA_CONFIG,
    ORBIT_CONTROLS_CONFIG,
    GRID_CONFIG,
} from '../constants';
import { useDXFWorker } from '../hooks/useDXFWorker';
import { calculateCameraDistance } from '../utils/dxfToGeometry';

import { CADControls } from './CADControls';
import { CADMesh } from './CADMesh';
import { FileUpload } from './FileUpload';
import { LayerPanel } from './LayerPanel';

import type { ParsedCADData, CADViewerConfig, LayerInfo } from '../types';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';

export function CADScene() {
    const [cadData, setCadData] = useState<ParsedCADData | null>(null);
    const [config, setConfig] = useState<CADViewerConfig>(DEFAULT_CAD_CONFIG);
    const [layers, setLayers] = useState<Map<string, LayerInfo>>(new Map());
    const { parse, isLoading, progress, progressStage, error, clearError } =
        useDXFWorker();
    const controlsRef = useRef<OrbitControlsImpl>(null);
    const [cameraPosition, setCameraPosition] = useState<
        [number, number, number]
    >([...CAMERA_CONFIG.defaultPosition]);

    // 설정 변경 핸들러
    const handleConfigChange = useCallback(
        (newConfig: Partial<CADViewerConfig>) => {
            setConfig((prev) => ({ ...prev, ...newConfig }));
        },
        []
    );

    // 레이어 토글 핸들러
    const handleToggleLayer = useCallback((layerName: string) => {
        setLayers((prev) => {
            const newLayers = new Map(prev);
            const layer = newLayers.get(layerName);
            if (layer) {
                newLayers.set(layerName, { ...layer, visible: !layer.visible });
            }
            return newLayers;
        });
    }, []);

    // 전체 레이어 토글 핸들러
    const handleToggleAllLayers = useCallback((visible: boolean) => {
        setLayers((prev) => {
            const newLayers = new Map(prev);
            for (const [name, layer] of newLayers) {
                newLayers.set(name, { ...layer, visible });
            }
            return newLayers;
        });
    }, []);

    // 파일 선택 핸들러
    const handleFileSelect = useCallback(
        async (file: File) => {
            clearError();
            try {
                const data = await parse(file);
                setCadData(data);

                // 레이어 정보 설정
                setLayers(new Map(data.layers));

                // 카메라 위치 자동 조정
                if (config.autoFitCamera && data.bounds) {
                    const distance = calculateCameraDistance(
                        data.bounds,
                        CAMERA_CONFIG.fov
                    );
                    setCameraPosition([0, 0, distance]);
                }
            } catch (err) {
                // 에러는 useDXFParser에서 처리됨
                console.error('Failed to parse DXF:', err);
            }
        },
        [parse, clearError, config.autoFitCamera]
    );

    // 뷰 리셋 핸들러
    const handleResetView = useCallback(() => {
        if (controlsRef.current) {
            controlsRef.current.reset();
        }
        if (cadData && config.autoFitCamera) {
            const distance = calculateCameraDistance(
                cadData.bounds,
                CAMERA_CONFIG.fov
            );
            setCameraPosition([0, 0, distance]);
        } else {
            setCameraPosition([...CAMERA_CONFIG.defaultPosition]);
        }
    }, [cadData, config.autoFitCamera]);

    // 샘플 파일 로드 핸들러
    const handleLoadSample = useCallback(async () => {
        try {
            const response = await fetch('/samples/simple-room.dxf');
            if (!response.ok) {
                throw new Error('샘플 파일을 불러올 수 없습니다.');
            }
            const text = await response.text();
            const file = new File([text], 'simple-room.dxf', {
                type: 'application/dxf',
            });
            await handleFileSelect(file);
        } catch (err) {
            console.error('Failed to load sample:', err);
        }
    }, [handleFileSelect]);

    // 파일 리셋 핸들러 (초기 상태로)
    const handleResetFile = useCallback(() => {
        setCadData(null);
        setLayers(new Map());
        setCameraPosition([...CAMERA_CONFIG.defaultPosition]);
        clearError();
        if (controlsRef.current) {
            controlsRef.current.reset();
        }
    }, [clearError]);

    return (
        <div className="relative h-full w-full">
            {/* 3D Canvas */}
            <Canvas
                className="bg-gradient-to-b from-gray-900 to-gray-800"
                gl={{ antialias: true }}
            >
                <PerspectiveCamera
                    makeDefault
                    position={cameraPosition}
                    fov={CAMERA_CONFIG.fov}
                    near={CAMERA_CONFIG.near}
                    far={CAMERA_CONFIG.far}
                />
                <OrbitControls
                    ref={controlsRef}
                    enableDamping={ORBIT_CONTROLS_CONFIG.enableDamping}
                    dampingFactor={ORBIT_CONTROLS_CONFIG.dampingFactor}
                    minDistance={ORBIT_CONTROLS_CONFIG.minDistance}
                    maxDistance={ORBIT_CONTROLS_CONFIG.maxDistance}
                />

                {/* 조명 */}
                <ambientLight intensity={0.8} />

                {/* CAD 모델 */}
                {cadData && (
                    <CADMesh
                        data={cadData}
                        color={config.wireframeColor}
                        center={true}
                        layers={layers}
                    />
                )}

                {/* 바닥 그리드 */}
                {config.showGrid && (
                    <gridHelper
                        args={[
                            GRID_CONFIG.size,
                            GRID_CONFIG.divisions,
                            GRID_CONFIG.colorCenterLine,
                            GRID_CONFIG.colorGrid,
                        ]}
                        rotation={[Math.PI / 2, 0, 0]}
                    />
                )}
            </Canvas>

            {/* HTML Overlay - 파일 업로드 */}
            <FileUpload
                onFileSelect={handleFileSelect}
                onLoadSample={handleLoadSample}
                isLoading={isLoading}
                progress={progress}
                progressStage={progressStage}
                error={error}
                hasData={!!cadData}
            />

            {/* HTML Overlay - 컨트롤 패널 */}
            <CADControls
                data={cadData}
                config={config}
                onConfigChange={handleConfigChange}
                onResetView={handleResetView}
                onResetFile={handleResetFile}
            />

            {/* HTML Overlay - 레이어 패널 */}
            {cadData && layers.size > 0 && (
                <LayerPanel
                    layers={layers}
                    onToggleLayer={handleToggleLayer}
                    onToggleAll={handleToggleAllLayers}
                />
            )}
        </div>
    );
}
