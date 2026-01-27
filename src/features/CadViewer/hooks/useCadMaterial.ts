/**
 * useCadMaterial Hook
 *
 * Phase 2.1.7: 쉐이딩 모드에 따른 3D Material 생성
 *
 * @module features/CadViewer/hooks/useCadMaterial
 */

import { useEffect, useMemo } from 'react';

import * as THREE from 'three';

import type { CadMaterialOptions, CadShadingMode } from '@/types/cad';
import { DEFAULT_MATERIAL_OPTIONS, DEFAULT_SHADING_MODE } from '@/types/cad';

/**
 * useCadMaterial Props
 */
export interface UseCadMaterialProps {
    /** 쉐이딩 모드 */
    mode?: CadShadingMode;
    /** 색상 (기본값: #1e88e5) */
    color?: string;
    /** Material 옵션 */
    options?: CadMaterialOptions;
}

/**
 * useCadMaterial 반환 타입
 */
export interface UseCadMaterialResult {
    /** 생성된 Material */
    material: THREE.Material;
    /** Material dispose 함수 */
    dispose: () => void;
}

/**
 * 쉐이딩 모드에 따른 Material 생성 Hook
 *
 * @param props - Material 생성 옵션
 * @returns Material 및 dispose 함수
 *
 * @example
 * ```tsx
 * const { material } = useCadMaterial({
 *   mode: 'glossy',
 *   color: '#ff0000'
 * });
 *
 * return <mesh material={material} />;
 * ```
 */
export function useCadMaterial({
    mode = DEFAULT_SHADING_MODE,
    color,
    options = {},
}: UseCadMaterialProps = {}): UseCadMaterialResult {
    const mergedOptions = {
        ...DEFAULT_MATERIAL_OPTIONS,
        ...options,
        color: color ?? options.color ?? DEFAULT_MATERIAL_OPTIONS.color,
    };

    const material = useMemo(() => {
        const threeColor = new THREE.Color(mergedOptions.color);
        const side = mergedOptions.side;
        const opacity = mergedOptions.opacity;
        const transparent = opacity < 1;

        switch (mode) {
            case 'wireframe':
                return new THREE.MeshBasicMaterial({
                    color: threeColor,
                    wireframe: true,
                    transparent,
                    opacity,
                });

            case 'flat':
                return new THREE.MeshPhongMaterial({
                    color: threeColor,
                    flatShading: true,
                    side,
                    transparent,
                    opacity,
                });

            case 'smooth':
                return new THREE.MeshLambertMaterial({
                    color: threeColor,
                    side,
                    transparent,
                    opacity,
                });

            case 'glossy':
                return new THREE.MeshPhongMaterial({
                    color: threeColor,
                    specular: new THREE.Color(0x222222),
                    shininess: 150,
                    side,
                    transparent,
                    opacity,
                });

            default:
                // Default to smooth (MeshLambertMaterial)
                return new THREE.MeshLambertMaterial({
                    color: threeColor,
                    side,
                    transparent,
                    opacity,
                });
        }
    }, [mode, mergedOptions.color, mergedOptions.side, mergedOptions.opacity]);

    // Cleanup on unmount or material change
    useEffect(() => {
        return () => {
            material.dispose();
        };
    }, [material]);

    const dispose = useMemo(
        () => () => {
            material.dispose();
        },
        [material]
    );

    return { material, dispose };
}

/**
 * 색상별 Material Map 생성 Hook
 *
 * 여러 색상의 메쉬를 렌더링할 때 Material 캐싱에 유용
 *
 * @param colors - 색상 배열
 * @param mode - 쉐이딩 모드
 * @returns 색상별 Material Map
 */
export function useCadMaterialMap(
    colors: string[],
    mode: CadShadingMode = DEFAULT_SHADING_MODE
): Map<string, THREE.Material> {
    const materialMap = useMemo(() => {
        const map = new Map<string, THREE.Material>();

        for (const color of colors) {
            if (map.has(color)) continue;

            const threeColor = new THREE.Color(color);
            let material: THREE.Material;

            switch (mode) {
                case 'wireframe':
                    material = new THREE.MeshBasicMaterial({
                        color: threeColor,
                        wireframe: true,
                    });
                    break;

                case 'flat':
                    material = new THREE.MeshPhongMaterial({
                        color: threeColor,
                        flatShading: true,
                        side: THREE.DoubleSide,
                    });
                    break;

                case 'smooth':
                    material = new THREE.MeshLambertMaterial({
                        color: threeColor,
                        side: THREE.DoubleSide,
                    });
                    break;

                case 'glossy':
                    material = new THREE.MeshPhongMaterial({
                        color: threeColor,
                        specular: new THREE.Color(0x222222),
                        shininess: 150,
                        side: THREE.DoubleSide,
                    });
                    break;

                default:
                    material = new THREE.MeshLambertMaterial({
                        color: threeColor,
                        side: THREE.DoubleSide,
                    });
            }

            map.set(color, material);
        }

        return map;
    }, [colors, mode]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            for (const material of materialMap.values()) {
                material.dispose();
            }
        };
    }, [materialMap]);

    return materialMap;
}

/**
 * Material 정리 유틸리티
 *
 * @param material - 정리할 Material
 */
export function disposeCadMaterial(material: THREE.Material): void {
    // Dispose textures if present
    if ('map' in material && material.map instanceof THREE.Texture) {
        material.map.dispose();
    }
    material.dispose();
}
