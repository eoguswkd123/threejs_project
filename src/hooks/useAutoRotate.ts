/**
 * useAutoRotate - 자동 회전 애니메이션 훅
 *
 * useFrame 기반 Y축 회전 애니메이션
 *
 * @module hooks/useAutoRotate
 */

import type { RefObject } from 'react';

import { useFrame } from '@react-three/fiber';

import type * as THREE from 'three';

// ============================================================
// Types
// ============================================================

export interface UseAutoRotateOptions {
    /** 자동 회전 활성화 (기본값: false) */
    enabled?: boolean;
    /** 회전 속도 (기본값: 0.5) */
    speed?: number;
    /** 회전 축 (기본값: 'y') */
    axis?: 'x' | 'y' | 'z';
}

// ============================================================
// Hook
// ============================================================

/**
 * 자동 회전 애니메이션 훅
 *
 * @param groupRef - THREE.Group RefObject
 * @param options - 회전 옵션
 *
 * @description
 * useFrame을 사용하여 delta time 기반 부드러운 회전
 * requestAnimationFrame 대비 R3F 렌더 루프와 동기화됨
 *
 * @example
 * ```tsx
 * const groupRef = useRef<THREE.Group>(null);
 * useAutoRotate(groupRef, { enabled: true, speed: 0.5 });
 *
 * return <group ref={groupRef}>...</group>;
 * ```
 */
export function useAutoRotate(
    groupRef: RefObject<THREE.Group | null>,
    options: UseAutoRotateOptions = {}
): void {
    const { enabled = false, speed = 0.5, axis = 'y' } = options;

    useFrame((_, delta) => {
        if (!enabled || !groupRef.current) return;

        switch (axis) {
            case 'x':
                groupRef.current.rotation.x += delta * speed;
                break;
            case 'y':
                groupRef.current.rotation.y += delta * speed;
                break;
            case 'z':
                groupRef.current.rotation.z += delta * speed;
                break;
        }
    });
}
