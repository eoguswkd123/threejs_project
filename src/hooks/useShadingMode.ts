/**
 * useShadingMode - Material 모드 전환 훅
 *
 * wireframe, flat, smooth, glossy 모드 Material 적용
 * (hologram 모드는 별도 HologramMaterial 사용)
 *
 * @module hooks/useShadingMode
 */

import { useEffect, useRef, useMemo } from 'react';

import * as THREE from 'three';

import type { CadShadingMode } from '@/types/cad';
import {
    createMeshWireframeMaterial,
    WIREFRAME_DEFAULT_COLOR,
} from '@/utils/cad';

// ============================================================
// Types
// ============================================================

/** 원본 Material 저장 타입 */
type OriginalMaterialStore = THREE.Material | THREE.Material[];

/** flatShading 속성을 가진 Material 타입 */
type FlatShadingMaterial =
    | THREE.MeshStandardMaterial
    | THREE.MeshPhongMaterial
    | THREE.MeshLambertMaterial;

/** PBR 속성(roughness, metalness)을 가진 Material 타입 */
type PBRMaterial = THREE.MeshStandardMaterial | THREE.MeshPhysicalMaterial;

// ============================================================
// Helpers
// ============================================================

/**
 * flatShading 속성 지원 여부 확인
 * MeshStandardMaterial, MeshPhongMaterial, MeshLambertMaterial 지원
 */
function supportsFlatShading(
    material: THREE.Material
): material is FlatShadingMaterial {
    return (
        material instanceof THREE.MeshStandardMaterial ||
        material instanceof THREE.MeshPhongMaterial ||
        material instanceof THREE.MeshLambertMaterial
    );
}

/**
 * PBR 속성(roughness, metalness) 지원 여부 확인
 * MeshStandardMaterial, MeshPhysicalMaterial 지원
 */
function supportsPBR(material: THREE.Material): material is PBRMaterial {
    return (
        material instanceof THREE.MeshStandardMaterial ||
        material instanceof THREE.MeshPhysicalMaterial
    );
}

export interface UseShadingModeOptions {
    /** hologram 모드 스킵 여부 (기본값: true) */
    skipHologram?: boolean;
}

// ============================================================
// Hook
// ============================================================

/**
 * Shading Mode에 따른 Material 적용 훅
 *
 * @param meshes - THREE.Mesh 배열
 * @param shadingMode - 쉐이딩 모드
 * @param options - 옵션
 *
 * @description
 * - 원본 Material을 클론하여 보관
 * - 모드 변경 시 새 Material 생성 및 적용
 * - cleanup 시 모든 Material dispose
 *
 * @example
 * ```tsx
 * useShadingMode(meshes, 'smooth');
 * useShadingMode(meshes, 'wireframe');
 * ```
 */
export function useShadingMode(
    meshes: THREE.Mesh[],
    shadingMode: CadShadingMode,
    options: UseShadingModeOptions = {}
): void {
    const { skipHologram = true } = options;

    // 원본 material 저장 (clone하여 보관)
    const originalMaterialsRef = useRef<Map<THREE.Mesh, OriginalMaterialStore>>(
        new Map()
    );
    // 현재 적용된 material 추적 (dispose용)
    const appliedMaterialsRef = useRef<THREE.Material[]>([]);

    // meshes 배열 안정화: UUID 기반 키로 실제 변경만 감지
    // 동일한 mesh 객체들이면 동일한 키 → 불필요한 리렌더 방지
    const meshesKey = useMemo(
        () => meshes.map((m) => m.uuid).join(','),
        [meshes]
    );

    // meshes 참조 안정화
    const meshesRef = useRef(meshes);
    useEffect(() => {
        meshesRef.current = meshes;
    }, [meshes]);

    // 원본 material 저장 (meshes 실제 변경 시에만)
    useEffect(() => {
        const currentMeshes = meshesRef.current;
        currentMeshes.forEach((mesh) => {
            if (!originalMaterialsRef.current.has(mesh)) {
                const mat = mesh.material;
                const clonedMat = Array.isArray(mat)
                    ? mat.map((m) => m.clone())
                    : mat.clone();
                originalMaterialsRef.current.set(mesh, clonedMat);
            }
        });
    }, [meshesKey]);

    // Shading Mode 적용 (meshes 실제 변경 또는 모드 변경 시에만)
    useEffect(() => {
        // hologram 모드는 별도 처리 (HologramMaterial 사용)
        if (skipHologram && shadingMode === 'hologram') return;

        // 이전에 적용된 material 정리 (원본 제외)
        appliedMaterialsRef.current.forEach((m) => m.dispose());
        appliedMaterialsRef.current = [];

        const currentMeshes = meshesRef.current;
        currentMeshes.forEach((mesh) => {
            const originalMat = originalMaterialsRef.current.get(mesh);
            if (!originalMat) return;

            // 원본 material 배열로 정규화
            const originals = Array.isArray(originalMat)
                ? originalMat
                : [originalMat];

            // 각 모드별 새 material 생성
            const processedMaterials = originals.map((orig) => {
                switch (shadingMode) {
                    case 'wireframe': {
                        const wireframeMat = createMeshWireframeMaterial(
                            WIREFRAME_DEFAULT_COLOR
                        );
                        appliedMaterialsRef.current.push(wireframeMat);
                        return wireframeMat;
                    }

                    case 'flat': {
                        // 원본 clone 후 flatShading 적용
                        const cloned = orig.clone();
                        if (supportsFlatShading(cloned)) {
                            cloned.flatShading = true;
                            cloned.needsUpdate = true;
                        }
                        appliedMaterialsRef.current.push(cloned);
                        return cloned;
                    }

                    case 'smooth': {
                        // 원본 clone (기본 상태)
                        const cloned = orig.clone();
                        if (supportsFlatShading(cloned)) {
                            cloned.flatShading = false;
                            cloned.needsUpdate = true;
                        }
                        appliedMaterialsRef.current.push(cloned);
                        return cloned;
                    }

                    case 'glossy': {
                        // 원본 clone 후 광택 적용
                        const cloned = orig.clone();
                        if (supportsFlatShading(cloned)) {
                            cloned.flatShading = false;
                            cloned.needsUpdate = true;
                        }
                        if (supportsPBR(cloned)) {
                            cloned.roughness = 0.1;
                            cloned.metalness = 0.9;
                            cloned.needsUpdate = true;
                        }
                        appliedMaterialsRef.current.push(cloned);
                        return cloned;
                    }

                    default: {
                        const cloned = orig.clone();
                        appliedMaterialsRef.current.push(cloned);
                        return cloned;
                    }
                }
            });

            // 빈 배열 체크 (Guard Clause)
            if (processedMaterials.length === 0) return;

            // 단일 material 타입 가드
            const firstMaterial = processedMaterials[0];
            if (!firstMaterial) return;

            mesh.material = Array.isArray(originalMat)
                ? processedMaterials
                : firstMaterial;
        });
    }, [meshesKey, shadingMode, skipHologram]);

    // 메모리 정리 (meshes 실제 변경 시에만)
    useEffect(() => {
        // cleanup 시점에 ref가 변경될 수 있으므로 현재 값을 캡처
        const appliedMaterials = appliedMaterialsRef.current;
        const originalMaterials = originalMaterialsRef.current;

        return () => {
            // 적용된 material 정리
            appliedMaterials.forEach((m) => m.dispose());
            appliedMaterialsRef.current = [];

            // 원본 clone material 정리
            originalMaterials.forEach((mat) => {
                if (Array.isArray(mat)) {
                    mat.forEach((m) => m.dispose());
                } else {
                    mat.dispose();
                }
            });
            originalMaterials.clear();
        };
    }, [meshesKey]);
}
