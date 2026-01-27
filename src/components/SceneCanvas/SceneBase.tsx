/**
 * SceneCanvas - SceneBase Component
 *
 * 3D 캔버스의 기본 구조 담당
 * - Canvas (R3F)
 * - PerspectiveCamera
 * - OrbitControls
 *
 * @description
 * 원자 컴포넌트로서 조명, 그리드, 이펙트 없이 순수 캔버스 기능만 제공
 * SceneCanvasViewer에서 다른 원자 컴포넌트들과 조합하여 사용
 *
 * @see {@link SceneCanvasViewer} - 조합된 Viewer 컴포넌트
 */

import React, { memo, forwardRef, useMemo } from 'react';

import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';

import type { SceneBaseProps } from './types';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';

/**
 * 3D 캔버스 기본 컴포넌트
 *
 * Canvas + Camera + Controls만 담당하는 원자 컴포넌트
 *
 * @example
 * ```tsx
 * <SceneBase cameraPosition={[0, 0, 100]}>
 *   <SceneLighting />
 *   <SceneGrid />
 *   <MyMesh />
 * </SceneBase>
 * ```
 */
const SceneBaseComponent = forwardRef<HTMLCanvasElement, SceneBaseProps>(
    function SceneBaseComponent(
        {
            children,
            // Camera props
            cameraPosition,
            cameraFov = 50,
            cameraNear = 0.1,
            cameraFar = 10000,
            // Controls props
            controlsRef,
            enableDamping = true,
            dampingFactor = 0.05,
            minDistance = 1,
            maxDistance = 1000,
            autoRotate = false,
            rotateSpeed = 1,
            // Canvas props
            backgroundColor,
            glAlpha = false,
        },
        ref
    ) {
        // Canvas 스타일 결정
        const canvasStyle = useMemo<React.CSSProperties>(
            () => (backgroundColor ? { background: backgroundColor } : {}),
            [backgroundColor]
        );

        const canvasClassName = useMemo(
            () =>
                backgroundColor
                    ? 'h-full w-full'
                    : 'h-full w-full bg-gradient-to-b from-gray-900 to-gray-800',
            [backgroundColor]
        );

        return (
            <Canvas
                ref={ref}
                className={canvasClassName}
                style={canvasStyle}
                gl={{
                    antialias: true,
                    powerPreference: 'high-performance',
                    alpha: glAlpha,
                }}
                dpr={[1, 2]}
            >
                {/* 카메라 */}
                <PerspectiveCamera
                    makeDefault
                    position={cameraPosition}
                    fov={cameraFov}
                    near={cameraNear}
                    far={cameraFar}
                />

                {/* 컨트롤 */}
                <OrbitControls
                    ref={controlsRef as React.RefObject<OrbitControlsImpl>}
                    enableDamping={enableDamping}
                    dampingFactor={dampingFactor}
                    minDistance={minDistance}
                    maxDistance={maxDistance}
                    autoRotate={autoRotate}
                    autoRotateSpeed={rotateSpeed}
                />

                {/* 자식 컴포넌트 (조명, 그리드, 메시 등) */}
                {children}
            </Canvas>
        );
    }
);

export const SceneBase = memo(SceneBaseComponent);
