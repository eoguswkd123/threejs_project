/**
 * TeapotMesh Component
 * Three.js TeapotGeometry 렌더링 컴포넌트
 */
import { useRef, useMemo, useEffect, memo } from 'react';

import { useFrame } from '@react-three/fiber';
import { TeapotGeometry } from 'three/addons/geometries/TeapotGeometry.js';

import { useTeapotMaterial, disposeMaterial } from '../hooks/useTeapotMaterial';

import type { ShadingMode } from '../types';
import type * as THREE from 'three';

interface TeapotMeshProps {
    /** 테셀레이션 레벨 (2-50) */
    tessellation?: number;
    /** 쉐이딩 모드 */
    shadingMode?: ShadingMode;
    /** 뚜껑 표시 */
    showLid?: boolean;
    /** 몸체 표시 */
    showBody?: boolean;
    /** 밑바닥 표시 */
    showBottom?: boolean;
    /** 자동 회전 */
    autoRotate?: boolean;
    /** 크기 */
    size?: number;
}

function TeapotMeshComponent({
    tessellation = 15,
    shadingMode = 'smooth',
    showLid = true,
    showBody = true,
    showBottom = true,
    autoRotate = true,
    size = 50,
}: TeapotMeshProps) {
    const meshRef = useRef<THREE.Mesh>(null);
    const material = useTeapotMaterial(shadingMode);
    const prevMaterialRef = useRef<THREE.Material | null>(null);

    // TeapotGeometry 생성 (useMemo로 최적화)
    const geometry = useMemo(() => {
        return new TeapotGeometry(
            size,
            tessellation,
            showBody,
            showLid,
            showBottom,
            true,
            true
        );
    }, [size, tessellation, showBody, showLid, showBottom]);

    // 자동 회전
    useFrame((_, delta) => {
        if (meshRef.current && autoRotate) {
            meshRef.current.rotation.y += delta * 0.3;
        }
    });

    // Material 정리 (메모리 누수 방지)
    useEffect(() => {
        if (prevMaterialRef.current && prevMaterialRef.current !== material) {
            disposeMaterial(prevMaterialRef.current);
        }
        prevMaterialRef.current = material;

        return () => {
            if (prevMaterialRef.current) {
                disposeMaterial(prevMaterialRef.current);
            }
        };
    }, [material]);

    // Geometry 정리
    useEffect(() => {
        return () => {
            geometry.dispose();
        };
    }, [geometry]);

    return (
        <mesh
            ref={meshRef}
            geometry={geometry}
            material={material}
            castShadow
            receiveShadow
        />
    );
}

export const TeapotMesh = memo(TeapotMeshComponent);
