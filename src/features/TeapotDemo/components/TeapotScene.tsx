/**
 * TeapotScene Component
 * Teapot 데모 최상위 Scene 래퍼
 */
import { useState, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { TeapotMesh } from './TeapotMesh';
import { TeapotControls } from './TeapotControls';
import {
    DEFAULT_TEAPOT_CONFIG,
    TEAPOT_CAMERA_CONFIG,
    TEAPOT_ORBIT_CONTROLS_CONFIG,
    TEAPOT_GRID_CONFIG,
} from '../constants';
import type { TeapotConfig } from '../types';

export function TeapotScene() {
    const [config, setConfig] = useState<TeapotConfig>(DEFAULT_TEAPOT_CONFIG);

    const handleConfigChange = useCallback(
        (newConfig: Partial<TeapotConfig>) => {
            setConfig((prev) => ({ ...prev, ...newConfig }));
        },
        []
    );

    return (
        <div className="relative h-full w-full">
            {/* 3D Canvas */}
            <Canvas
                shadows
                className="bg-gradient-to-b from-gray-900 to-gray-800"
            >
                <PerspectiveCamera
                    makeDefault
                    position={[...TEAPOT_CAMERA_CONFIG.position]}
                    fov={TEAPOT_CAMERA_CONFIG.fov}
                />
                <OrbitControls
                    enableDamping={TEAPOT_ORBIT_CONTROLS_CONFIG.enableDamping}
                    dampingFactor={TEAPOT_ORBIT_CONTROLS_CONFIG.dampingFactor}
                    minDistance={TEAPOT_ORBIT_CONTROLS_CONFIG.minDistance}
                    maxDistance={TEAPOT_ORBIT_CONTROLS_CONFIG.maxDistance}
                />

                {/* 조명 */}
                <ambientLight intensity={0.4} />
                <directionalLight
                    position={[100, 100, 50]}
                    intensity={1}
                    castShadow
                    shadow-mapSize={[1024, 1024]}
                />
                <directionalLight
                    position={[-100, -100, -50]}
                    intensity={0.3}
                />

                {/* Teapot */}
                <TeapotMesh
                    tessellation={config.tessellation}
                    shadingMode={config.shadingMode}
                    showLid={config.showLid}
                    showBody={config.showBody}
                    showBottom={config.showBottom}
                    autoRotate={config.autoRotate}
                />

                {/* 바닥 그리드 (시각적 참조용) */}
                <gridHelper
                    args={[
                        TEAPOT_GRID_CONFIG.size,
                        TEAPOT_GRID_CONFIG.divisions,
                        TEAPOT_GRID_CONFIG.colorCenterLine,
                        TEAPOT_GRID_CONFIG.colorGrid,
                    ]}
                    rotation={[0, 0, 0]}
                />
            </Canvas>

            {/* HTML Overlay 컨트롤 */}
            <TeapotControls
                config={config}
                onConfigChange={handleConfigChange}
            />
        </div>
    );
}
