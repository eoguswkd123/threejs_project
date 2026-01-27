/**
 * useModelLoader - glTF/glb 모델 로딩 훅
 *
 * 모델 로딩, 클론, 바운딩박스, 스케일, 센터 계산을 담당
 *
 * @module hooks/useModelLoader
 */

import { useMemo } from 'react';

import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';

// ============================================================
// Types
// ============================================================

export interface UseModelLoaderOptions {
    /** 모델 중앙 정렬 (기본값: true) */
    center?: boolean;
    /** 자동 스케일 정규화 (기본값: true) */
    normalizeScale?: boolean;
    /** 정규화 목표 크기 (기본값: 2) */
    targetSize?: number;
    /** 추가 스케일 배율 (기본값: 1) */
    scale?: number;
}

export interface UseModelLoaderReturn {
    /** 클론된 씬 (원본 보존) */
    clonedScene: THREE.Group;
    /** 메쉬 배열 */
    meshes: THREE.Mesh[];
    /** 바운딩 박스 */
    boundingBox: THREE.Box3;
    /** 정규화된 스케일 */
    normalizedScale: number;
    /** 중앙 정렬 오프셋 */
    centerOffset: THREE.Vector3;
}

// ============================================================
// Hook
// ============================================================

/**
 * glTF/glb 모델 로딩 및 변환 훅
 *
 * @param url - 모델 파일 URL
 * @param options - 로딩 옵션
 * @returns 클론된 씬, 메쉬 배열, 바운딩박스, 스케일, 센터 오프셋
 *
 * @requires React.Suspense - 이 훅은 내부적으로 useGLTF를 사용하며,
 * 반드시 Suspense 경계 내에서 사용해야 합니다.
 * Suspense 없이 사용 시 "Suspended while rendering" 에러가 발생합니다.
 *
 * @example
 * ```tsx
 * // 반드시 Suspense로 감싸서 사용
 * <Suspense fallback={<LoadingSpinner />}>
 *   <ModelViewer url="/model.glb" />
 * </Suspense>
 *
 * // ModelViewer 내부
 * const { clonedScene, normalizedScale, centerOffset } = useModelLoader(url, {
 *   center: true,
 *   normalizeScale: true,
 *   targetSize: 2,
 * });
 * ```
 */
export function useModelLoader(
    url: string,
    options: UseModelLoaderOptions = {}
): UseModelLoaderReturn {
    const {
        center = true,
        normalizeScale = true,
        targetSize = 2,
        scale = 1,
    } = options;

    const { scene } = useGLTF(url);

    // 모델 클론 (원본 보존)
    const clonedScene = useMemo(() => scene.clone(), [scene]);

    // 메쉬 배열 추출
    const meshes = useMemo(() => {
        const result: THREE.Mesh[] = [];
        clonedScene.traverse((child) => {
            if (child instanceof THREE.Mesh) {
                result.push(child);
            }
        });
        return result;
    }, [clonedScene]);

    // 바운딩 박스 계산
    const boundingBox = useMemo(() => {
        return new THREE.Box3().setFromObject(clonedScene);
    }, [clonedScene]);

    // 자동 스케일 계산 (모델을 targetSize에 맞게 정규화)
    const normalizedScale = useMemo(() => {
        if (!normalizeScale) return scale;

        const size = boundingBox.getSize(new THREE.Vector3());
        const maxDimension = Math.max(size.x, size.y, size.z);

        if (maxDimension === 0) return scale;

        return (targetSize / maxDimension) * scale;
    }, [boundingBox, normalizeScale, targetSize, scale]);

    // 중앙 정렬 오프셋 계산
    const centerOffset = useMemo(() => {
        if (!center) return new THREE.Vector3(0, 0, 0);

        const centerPoint = boundingBox.getCenter(new THREE.Vector3());

        return new THREE.Vector3(
            -centerPoint.x,
            -centerPoint.y,
            -centerPoint.z
        );
    }, [boundingBox, center]);

    return {
        clonedScene,
        meshes,
        boundingBox,
        normalizedScale,
        centerOffset,
    };
}
