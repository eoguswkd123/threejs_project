/**
 * useTeapotMaterial Hook
 * 쉐이딩 모드에 따른 Material 생성 (useMemo 최적화)
 */
import { useMemo } from 'react';

import * as THREE from 'three';

import type { ShadingMode } from '../types';

/**
 * 쉐이딩 모드에 따른 Material 반환
 * @param mode - 쉐이딩 모드
 * @returns Three.js Material
 */
export function useTeapotMaterial(mode: ShadingMode): THREE.Material {
    return useMemo(() => {
        switch (mode) {
            case 'wireframe':
                return new THREE.MeshBasicMaterial({
                    color: 0x00ff00,
                    wireframe: true,
                });

            case 'flat':
                return new THREE.MeshPhongMaterial({
                    color: 0x156289,
                    flatShading: true,
                    side: THREE.DoubleSide,
                });

            case 'smooth':
                return new THREE.MeshLambertMaterial({
                    color: 0x156289,
                    side: THREE.DoubleSide,
                });

            case 'glossy':
                return new THREE.MeshPhongMaterial({
                    color: 0x156289,
                    specular: 0x222222,
                    shininess: 150,
                    side: THREE.DoubleSide,
                });

            case 'textured': {
                // UV 그리드 텍스처 생성 (프로시저럴)
                const canvas = document.createElement('canvas');
                canvas.width = 256;
                canvas.height = 256;
                const ctx = canvas.getContext('2d');
                if (ctx) {
                    ctx.fillStyle = '#ffffff';
                    ctx.fillRect(0, 0, 256, 256);
                    ctx.strokeStyle = '#156289';
                    ctx.lineWidth = 2;
                    for (let i = 0; i <= 16; i++) {
                        ctx.beginPath();
                        ctx.moveTo(i * 16, 0);
                        ctx.lineTo(i * 16, 256);
                        ctx.stroke();
                        ctx.beginPath();
                        ctx.moveTo(0, i * 16);
                        ctx.lineTo(256, i * 16);
                        ctx.stroke();
                    }
                }
                const texture = new THREE.CanvasTexture(canvas);
                texture.wrapS = THREE.RepeatWrapping;
                texture.wrapT = THREE.RepeatWrapping;
                texture.repeat.set(4, 4);

                return new THREE.MeshPhongMaterial({
                    map: texture,
                    side: THREE.DoubleSide,
                });
            }

            case 'reflective':
                return new THREE.MeshStandardMaterial({
                    color: 0x8b8b8b,
                    metalness: 1.0,
                    roughness: 0.1,
                    side: THREE.DoubleSide,
                });

            default:
                return new THREE.MeshLambertMaterial({
                    color: 0x156289,
                    side: THREE.DoubleSide,
                });
        }
    }, [mode]);
}

/** Material 정리 (메모리 누수 방지) */
export function disposeMaterial(material: THREE.Material): void {
    if (material instanceof THREE.MeshPhongMaterial && material.map) {
        material.map.dispose();
    }
    material.dispose();
}
