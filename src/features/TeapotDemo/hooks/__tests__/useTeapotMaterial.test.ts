/**
 * useTeapotMaterial.test.ts
 * TeapotDemo Material 생성 훅 테스트
 *
 * 주요 테스트:
 * - 각 쉐이딩 모드별 Material 생성
 * - useMemo를 통한 메모이제이션 동작
 * - disposeMaterial 유틸리티 함수
 *
 * NOTE: Three.js Materials는 jsdom 환경에서도 정상 동작하며
 * 별도의 WebGL 모킹 없이 테스트 가능합니다.
 */

import { renderHook } from '@testing-library/react';
import * as THREE from 'three';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import type { ShadingMode } from '../../types';
import { useTeapotMaterial, disposeMaterial } from '../useTeapotMaterial';

beforeEach(() => {
    vi.clearAllMocks();
});

describe('useTeapotMaterial', () => {
    describe('쉐이딩 모드별 Material 생성', () => {
        it('wireframe 모드: MeshBasicMaterial with wireframe=true', () => {
            const { result } = renderHook(() =>
                useTeapotMaterial('wireframe')
            );

            expect(result.current).toBeInstanceOf(THREE.MeshBasicMaterial);
            expect((result.current as THREE.MeshBasicMaterial).wireframe).toBe(
                true
            );
        });

        it('flat 모드: MeshPhongMaterial with flatShading=true', () => {
            const { result } = renderHook(() => useTeapotMaterial('flat'));

            expect(result.current).toBeInstanceOf(THREE.MeshPhongMaterial);
            expect(
                (result.current as THREE.MeshPhongMaterial).flatShading
            ).toBe(true);
            expect(result.current.side).toBe(THREE.DoubleSide);
        });

        it('smooth 모드: MeshLambertMaterial', () => {
            const { result } = renderHook(() => useTeapotMaterial('smooth'));

            expect(result.current).toBeInstanceOf(THREE.MeshLambertMaterial);
            expect(result.current.side).toBe(THREE.DoubleSide);
        });

        it('glossy 모드: MeshPhongMaterial with shininess', () => {
            const { result } = renderHook(() => useTeapotMaterial('glossy'));

            expect(result.current).toBeInstanceOf(THREE.MeshPhongMaterial);
            expect((result.current as THREE.MeshPhongMaterial).shininess).toBe(
                150
            );
            expect(result.current.side).toBe(THREE.DoubleSide);
        });

        it('textured 모드: MeshPhongMaterial with map', () => {
            const { result } = renderHook(() => useTeapotMaterial('textured'));

            expect(result.current).toBeInstanceOf(THREE.MeshPhongMaterial);
            // textured 모드는 CanvasTexture를 생성하므로 map이 있어야 함
            expect((result.current as THREE.MeshPhongMaterial).map).not.toBeNull();
            expect(result.current.side).toBe(THREE.DoubleSide);
        });

        it('reflective 모드: MeshStandardMaterial with metalness', () => {
            const { result } = renderHook(() =>
                useTeapotMaterial('reflective')
            );

            expect(result.current).toBeInstanceOf(THREE.MeshStandardMaterial);
            expect(
                (result.current as THREE.MeshStandardMaterial).metalness
            ).toBe(1.0);
            expect(
                (result.current as THREE.MeshStandardMaterial).roughness
            ).toBe(0.1);
            expect(result.current.side).toBe(THREE.DoubleSide);
        });

        it('알 수 없는 모드: 기본 MeshLambertMaterial 반환', () => {
            // TypeScript는 이를 허용하지 않지만 런타임 안전성 테스트
            const { result } = renderHook(() =>
                useTeapotMaterial('unknown' as ShadingMode)
            );

            expect(result.current).toBeInstanceOf(THREE.MeshLambertMaterial);
        });
    });

    describe('메모이제이션 동작', () => {
        it('같은 모드로 리렌더링 시 동일 참조 유지', () => {
            const { result, rerender } = renderHook(
                ({ mode }) => useTeapotMaterial(mode),
                { initialProps: { mode: 'smooth' as ShadingMode } }
            );

            const firstMaterial = result.current;

            // 동일 모드로 리렌더링
            rerender({ mode: 'smooth' });

            expect(result.current).toBe(firstMaterial);
        });

        it('다른 모드로 변경 시 새 Material 생성', () => {
            const { result, rerender } = renderHook(
                ({ mode }) => useTeapotMaterial(mode),
                { initialProps: { mode: 'smooth' as ShadingMode } }
            );

            const firstMaterial = result.current;

            // 다른 모드로 변경
            rerender({ mode: 'wireframe' });

            expect(result.current).not.toBe(firstMaterial);
            expect(result.current).toBeInstanceOf(THREE.MeshBasicMaterial);
        });
    });

    describe('Material 속성 검증', () => {
        it('wireframe 모드 색상: 녹색 (0x00ff00)', () => {
            const { result } = renderHook(() =>
                useTeapotMaterial('wireframe')
            );

            const material = result.current as THREE.MeshBasicMaterial;
            expect(material.color.getHex()).toBe(0x00ff00);
        });

        it('flat 모드 색상: 파란색 계열 (0x156289)', () => {
            const { result } = renderHook(() => useTeapotMaterial('flat'));

            const material = result.current as THREE.MeshPhongMaterial;
            expect(material.color.getHex()).toBe(0x156289);
        });

        it('reflective 모드: metalness=1.0, roughness=0.1', () => {
            const { result } = renderHook(() =>
                useTeapotMaterial('reflective')
            );

            const material = result.current as THREE.MeshStandardMaterial;
            expect(material.metalness).toBe(1.0);
            expect(material.roughness).toBe(0.1);
            expect(material.color.getHex()).toBe(0x8b8b8b);
        });
    });
});

describe('disposeMaterial', () => {
    it('일반 Material dispose 호출', () => {
        const material = new THREE.MeshBasicMaterial();
        const disposeSpy = vi.spyOn(material, 'dispose');

        disposeMaterial(material);

        expect(disposeSpy).toHaveBeenCalled();
    });

    it('텍스처가 있는 MeshPhongMaterial: map과 material 모두 dispose', () => {
        const texture = new THREE.CanvasTexture(document.createElement('canvas'));
        const material = new THREE.MeshPhongMaterial({ map: texture });

        const materialDisposeSpy = vi.spyOn(material, 'dispose');
        const textureDisposeSpy = vi.spyOn(texture, 'dispose');

        disposeMaterial(material);

        expect(textureDisposeSpy).toHaveBeenCalled();
        expect(materialDisposeSpy).toHaveBeenCalled();
    });

    it('map이 없는 MeshPhongMaterial: material만 dispose', () => {
        const material = new THREE.MeshPhongMaterial();
        const disposeSpy = vi.spyOn(material, 'dispose');

        disposeMaterial(material);

        expect(disposeSpy).toHaveBeenCalled();
    });
});
