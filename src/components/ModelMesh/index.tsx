/**
 * ModelMesh - glTF/glb 3D 모델 렌더링 컴포넌트
 *
 * WorkerMesh + HologramMesh 통합
 *
 * @module components/ModelMesh
 *
 * @example
 * ```tsx
 * // 기본 사용 (smooth 모드)
 * <ModelMesh url="/model.glb" />
 *
 * // 홀로그램 모드
 * <ModelMesh
 *   url="/model.glb"
 *   shadingMode="hologram"
 *   hologramSettings={settings}
 * />
 *
 * // 자동 회전
 * <ModelMesh url="/model.glb" autoRotate rotateSpeed={0.5} />
 * ```
 */

import { memo, useRef, useEffect } from 'react';

import * as THREE from 'three';

import { useModelLoader, useShadingMode, useAutoRotate } from '@/hooks';

import { DEFAULT_HOLOGRAM_CONFIG } from './constants';
import { HologramMaterial } from './HologramMaterial';

import type { ModelMeshProps } from './types';

// ============================================================
// Component
// ============================================================

function ModelMeshComponent({
    url,
    shadingMode = 'smooth',
    hologramSettings,
    center = true,
    scale = 1,
    normalizeScale = true,
    targetSize = 2,
    autoRotate = false,
    rotateSpeed = 0.5,
}: ModelMeshProps) {
    const groupRef = useRef<THREE.Group>(null);

    // 모델 로딩 (클론, 바운딩박스, 스케일, 센터)
    const { clonedScene, meshes, normalizedScale, centerOffset } =
        useModelLoader(url, {
            center,
            normalizeScale,
            targetSize,
            scale,
        });

    // Shading Mode 적용 (hologram 모드 제외)
    useShadingMode(meshes, shadingMode, { skipHologram: true });

    // 자동 회전
    useAutoRotate(groupRef, {
        enabled: autoRotate,
        speed: rotateSpeed,
    });

    // 메모리 정리 (geometry)
    useEffect(() => {
        return () => {
            clonedScene.traverse((child) => {
                if (child instanceof THREE.Mesh) {
                    child.geometry?.dispose();
                }
            });
        };
    }, [clonedScene]);

    // Hologram 모드: HologramMaterial을 JSX로 적용
    if (shadingMode === 'hologram') {
        const settings = hologramSettings ?? DEFAULT_HOLOGRAM_CONFIG;

        return (
            <group ref={groupRef} scale={normalizedScale}>
                <group position={centerOffset}>
                    {meshes.length > 0 ? (
                        meshes.map((mesh, index) => (
                            <mesh
                                key={`hologram-mesh-${index}`}
                                geometry={mesh.geometry}
                                position={mesh.position}
                                rotation={mesh.rotation}
                                scale={mesh.scale}
                            >
                                <HologramMaterial
                                    {...settings}
                                    side="DoubleSide"
                                />
                            </mesh>
                        ))
                    ) : (
                        <primitive object={clonedScene} />
                    )}
                </group>
            </group>
        );
    }

    // 표준 Shading 모드: primitive로 렌더링 (material은 useShadingMode에서 적용)
    return (
        <group ref={groupRef} scale={normalizedScale}>
            <group position={centerOffset}>
                <primitive object={clonedScene} />
            </group>
        </group>
    );
}

// ============================================================
// Exports
// ============================================================

export const ModelMesh = memo(ModelMeshComponent);

// Re-export types only (constants should be imported from './types' directly)
export type { ModelMeshProps, HologramSettings } from './types';
export { HologramMaterial } from './HologramMaterial';
