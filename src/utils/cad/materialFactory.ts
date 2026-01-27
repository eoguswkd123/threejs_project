/**
 * Material Factory - Three.js Material 생성 유틸리티
 *
 * 와이어프레임 및 기타 Material을 한 곳에서 관리
 *
 * ## Material Pooling
 * 50+ 레이어 시 성능 향상을 위해 색상별 Material 풀링을 지원합니다.
 * 같은 색상의 Material을 재사용하여 메모리 사용량과 draw call을 줄입니다.
 */

import * as THREE from 'three';

/**
 * 와이어프레임 기본 색상
 */
export const WIREFRAME_DEFAULT_COLOR = '#00e5ff';

/**
 * Line Material 기본 옵션
 */
const LINE_MATERIAL_OPTIONS = {
    linewidth: 1,
} as const;

/**
 * Mesh Wireframe Material 기본 옵션
 */
const MESH_WIREFRAME_OPTIONS = {
    wireframe: true,
} as const;

/**
 * 색상 정규화 (대소문자 통일, 공백 제거)
 * @param color - 색상 문자열
 * @returns 정규화된 색상 키
 */
function normalizeColorKey(color: string | THREE.Color): string {
    if (color instanceof THREE.Color) {
        return '#' + color.getHexString().toLowerCase();
    }
    return color.trim().toLowerCase();
}

/**
 * Material Pool 클래스
 * 색상별 Material 캐싱으로 메모리 사용량 최적화
 *
 * @template T - Material 타입
 */
export class MaterialPool<T extends THREE.Material> {
    private cache: Map<string, T>;
    private factory: (color: THREE.Color) => T;

    /**
     * @param factory - Material 생성 함수
     */
    constructor(factory: (color: THREE.Color) => T) {
        this.cache = new Map();
        this.factory = factory;
    }

    /**
     * 색상에 해당하는 Material 가져오기 (없으면 생성)
     * @param color - 색상 (hex string 또는 THREE.Color)
     * @returns 캐시된 또는 새로 생성된 Material
     */
    get(color: string | THREE.Color): T {
        const key = normalizeColorKey(color);
        const cached = this.cache.get(key);
        if (cached) {
            return cached;
        }
        const threeColor =
            color instanceof THREE.Color ? color : new THREE.Color(color);
        const material = this.factory(threeColor);
        this.cache.set(key, material);
        return material;
    }

    /**
     * 캐시된 모든 Material 해제
     * 컴포넌트 언마운트 시 호출
     */
    dispose(): void {
        for (const material of this.cache.values()) {
            material.dispose();
        }
        this.cache.clear();
    }

    /**
     * 캐시된 Material 수
     */
    get size(): number {
        return this.cache.size;
    }
}

/**
 * LineBasicMaterial 풀 생성
 * WireframeMesh, CurveMesh 등에서 사용
 *
 * @returns LineBasicMaterial 풀 인스턴스
 *
 * @example
 * ```typescript
 * const pool = createLineMaterialPool();
 * const mat1 = pool.get('#ff0000');
 * const mat2 = pool.get('#ff0000'); // mat1과 동일 인스턴스
 *
 * // 컴포넌트 언마운트 시
 * pool.dispose();
 * ```
 */
export function createLineMaterialPool(): MaterialPool<THREE.LineBasicMaterial> {
    return new MaterialPool(
        (color) =>
            new THREE.LineBasicMaterial({
                color,
                ...LINE_MATERIAL_OPTIONS,
            })
    );
}

/**
 * MeshBasicMaterial (wireframe) 풀 생성
 * glTF 와이어프레임 모드에서 사용
 *
 * @returns MeshBasicMaterial 풀 인스턴스
 */
export function createMeshWireframeMaterialPool(): MaterialPool<THREE.MeshBasicMaterial> {
    return new MaterialPool(
        (color) =>
            new THREE.MeshBasicMaterial({
                color,
                ...MESH_WIREFRAME_OPTIONS,
            })
    );
}

/**
 * DXF 와이어프레임용 LineBasicMaterial 생성
 *
 * @param color - 색상 (hex string 또는 THREE.Color)
 * @returns LineBasicMaterial 인스턴스
 *
 * @example
 * ```typescript
 * const mat = createLineMaterial('#ff0000');
 * const mat2 = createLineMaterial(layerInfo.color);
 * ```
 *
 * @see createLineMaterialPool - 50+ 레이어 시 풀 사용 권장
 */
export function createLineMaterial(
    color: string | THREE.Color
): THREE.LineBasicMaterial {
    return new THREE.LineBasicMaterial({
        color: new THREE.Color(color),
        ...LINE_MATERIAL_OPTIONS,
    });
}

/**
 * glTF 와이어프레임용 MeshBasicMaterial 생성
 *
 * @param color - 색상 (hex string 또는 THREE.Color)
 * @returns MeshBasicMaterial 인스턴스 (wireframe: true)
 *
 * @example
 * ```typescript
 * const mat = createMeshWireframeMaterial('#888888');
 * const mat2 = createMeshWireframeMaterial(originalColor);
 * ```
 *
 * @see createMeshWireframeMaterialPool - 많은 메시 시 풀 사용 권장
 */
export function createMeshWireframeMaterial(
    color: string | THREE.Color
): THREE.MeshBasicMaterial {
    return new THREE.MeshBasicMaterial({
        color: new THREE.Color(color),
        ...MESH_WIREFRAME_OPTIONS,
    });
}
