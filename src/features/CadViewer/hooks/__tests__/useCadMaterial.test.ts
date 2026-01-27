/**
 * useCadMaterial.test.ts
 * Phase 2.1.7: useCadMaterial Hook 테스트
 */

import { renderHook, cleanup } from '@testing-library/react';
import * as THREE from 'three';
import { describe, it, expect, vi, afterEach } from 'vitest';

import {
    useCadMaterial,
    useCadMaterialMap,
    disposeCadMaterial,
} from '../useCadMaterial';

// Cleanup after each test
afterEach(() => {
    cleanup();
});

describe('useCadMaterial', () => {
    describe('default behavior', () => {
        it('should return smooth material by default', () => {
            const { result } = renderHook(() => useCadMaterial());

            expect(result.current.material).toBeInstanceOf(
                THREE.MeshLambertMaterial
            );
        });

        it('should return material and dispose function', () => {
            const { result } = renderHook(() => useCadMaterial());

            expect(result.current.material).toBeDefined();
            expect(result.current.dispose).toBeInstanceOf(Function);
        });
    });

    describe('shading modes', () => {
        it('should create wireframe material for "wireframe" mode', () => {
            const { result } = renderHook(() =>
                useCadMaterial({ mode: 'wireframe' })
            );

            const material = result.current.material as THREE.MeshBasicMaterial;
            expect(material).toBeInstanceOf(THREE.MeshBasicMaterial);
            expect(material.wireframe).toBe(true);
        });

        it('should create flat shading material for "flat" mode', () => {
            const { result } = renderHook(() =>
                useCadMaterial({ mode: 'flat' })
            );

            const material = result.current.material as THREE.MeshPhongMaterial;
            expect(material).toBeInstanceOf(THREE.MeshPhongMaterial);
            expect(material.flatShading).toBe(true);
        });

        it('should create lambert material for "smooth" mode', () => {
            const { result } = renderHook(() =>
                useCadMaterial({ mode: 'smooth' })
            );

            expect(result.current.material).toBeInstanceOf(
                THREE.MeshLambertMaterial
            );
        });

        it('should create glossy material for "glossy" mode', () => {
            const { result } = renderHook(() =>
                useCadMaterial({ mode: 'glossy' })
            );

            const material = result.current.material as THREE.MeshPhongMaterial;
            expect(material).toBeInstanceOf(THREE.MeshPhongMaterial);
            expect(material.shininess).toBe(150);
        });
    });

    describe('color option', () => {
        it('should apply custom color', () => {
            const { result } = renderHook(() =>
                useCadMaterial({ color: '#ff0000' })
            );

            const material = result.current
                .material as THREE.MeshLambertMaterial;
            expect(material.color.getHexString()).toBe('ff0000');
        });

        it('should use default color when not specified', () => {
            const { result } = renderHook(() => useCadMaterial());

            const material = result.current
                .material as THREE.MeshLambertMaterial;
            expect(material.color.getHexString()).toBe('1e88e5');
        });
    });

    describe('opacity option', () => {
        it('should apply custom opacity', () => {
            const { result } = renderHook(() =>
                useCadMaterial({ options: { opacity: 0.5 } })
            );

            const material = result.current
                .material as THREE.MeshLambertMaterial;
            expect(material.opacity).toBe(0.5);
            expect(material.transparent).toBe(true);
        });

        it('should not be transparent when opacity is 1', () => {
            const { result } = renderHook(() =>
                useCadMaterial({ options: { opacity: 1 } })
            );

            const material = result.current
                .material as THREE.MeshLambertMaterial;
            expect(material.transparent).toBe(false);
        });
    });

    describe('material disposal', () => {
        it('should dispose material on unmount', () => {
            const { result, unmount } = renderHook(() => useCadMaterial());

            const material = result.current.material;
            const disposeSpy = vi.spyOn(material, 'dispose');

            unmount();

            expect(disposeSpy).toHaveBeenCalled();
        });

        it('should dispose material when mode changes', () => {
            type TestMode = 'smooth' | 'glossy';
            const { result, rerender } = renderHook(
                ({ mode }: { mode: TestMode }) => useCadMaterial({ mode }),
                { initialProps: { mode: 'smooth' satisfies TestMode } }
            );

            const firstMaterial = result.current.material;
            const disposeSpy = vi.spyOn(firstMaterial, 'dispose');

            rerender({ mode: 'glossy' satisfies TestMode });

            expect(disposeSpy).toHaveBeenCalled();
        });
    });
});

describe('useCadMaterialMap', () => {
    it('should create materials for all colors', () => {
        const colors = ['#ff0000', '#00ff00', '#0000ff'];

        const { result } = renderHook(() => useCadMaterialMap(colors));

        expect(result.current.size).toBe(3);
        expect(result.current.has('#ff0000')).toBe(true);
        expect(result.current.has('#00ff00')).toBe(true);
        expect(result.current.has('#0000ff')).toBe(true);
    });

    it('should deduplicate colors', () => {
        const colors = ['#ff0000', '#ff0000', '#00ff00'];

        const { result } = renderHook(() => useCadMaterialMap(colors));

        expect(result.current.size).toBe(2);
    });

    it('should apply shading mode to all materials', () => {
        const colors = ['#ff0000'];

        const { result } = renderHook(() =>
            useCadMaterialMap(colors, 'wireframe')
        );

        const material = result.current.get(
            '#ff0000'
        ) as THREE.MeshBasicMaterial;
        expect(material).toBeInstanceOf(THREE.MeshBasicMaterial);
        expect(material.wireframe).toBe(true);
    });

    it('should dispose all materials on unmount', () => {
        const colors = ['#ff0000', '#00ff00'];

        const { result, unmount } = renderHook(() => useCadMaterialMap(colors));

        const spies = Array.from(result.current.values()).map((m) =>
            vi.spyOn(m, 'dispose')
        );

        unmount();

        spies.forEach((spy) => {
            expect(spy).toHaveBeenCalled();
        });
    });

    it('should return empty map for empty colors array', () => {
        const { result } = renderHook(() => useCadMaterialMap([]));

        expect(result.current.size).toBe(0);
    });
});

describe('disposeCadMaterial', () => {
    it('should dispose material', () => {
        const material = new THREE.MeshLambertMaterial();
        const disposeSpy = vi.spyOn(material, 'dispose');

        disposeCadMaterial(material);

        expect(disposeSpy).toHaveBeenCalled();
    });

    it('should dispose texture if present', () => {
        const texture = new THREE.Texture();
        const material = new THREE.MeshPhongMaterial({ map: texture });

        const materialDisposeSpy = vi.spyOn(material, 'dispose');
        const textureDisposeSpy = vi.spyOn(texture, 'dispose');

        disposeCadMaterial(material);

        expect(materialDisposeSpy).toHaveBeenCalled();
        expect(textureDisposeSpy).toHaveBeenCalled();
    });

    it('should handle materials without textures', () => {
        const material = new THREE.MeshBasicMaterial({ wireframe: true });
        const disposeSpy = vi.spyOn(material, 'dispose');

        // Should not throw
        expect(() => disposeCadMaterial(material)).not.toThrow();
        expect(disposeSpy).toHaveBeenCalled();
    });
});
