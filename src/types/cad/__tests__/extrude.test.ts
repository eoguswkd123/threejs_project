/**
 * extrude.test.ts
 * Phase 2.1.6: Extrude 타입 및 함수 테스트
 */

import { describe, it, expect } from 'vitest';

import {
    DEFAULT_EXTRUDE_OPTIONS,
    DEFAULT_3D_LOD_CONFIG,
    getLOD3DSteps,
} from '../extrude';

import type { ExtrudeOptions, Extrude3DLODConfig } from '../extrude';

describe('ExtrudeOptions', () => {
    it('DEFAULT_EXTRUDE_OPTIONS should have correct default values', () => {
        expect(DEFAULT_EXTRUDE_OPTIONS.depth).toBe(10);
        expect(DEFAULT_EXTRUDE_OPTIONS.bevel).toBe(false);
        expect(DEFAULT_EXTRUDE_OPTIONS.bevelSize).toBe(0.1);
        expect(DEFAULT_EXTRUDE_OPTIONS.bevelSegments).toBe(1);
    });

    it('ExtrudeOptions type should allow partial options', () => {
        const options: ExtrudeOptions = {
            depth: 20,
            // bevel, bevelSize, bevelSegments are optional
        };

        expect(options.depth).toBe(20);
        expect(options.bevel).toBeUndefined();
    });
});

describe('Extrude3DLODConfig', () => {
    it('DEFAULT_3D_LOD_CONFIG should have correct default values', () => {
        expect(DEFAULT_3D_LOD_CONFIG.thinThreshold).toBe(10);
        expect(DEFAULT_3D_LOD_CONFIG.mediumThreshold).toBe(50);
        expect(DEFAULT_3D_LOD_CONFIG.thinSteps).toBe(1);
        expect(DEFAULT_3D_LOD_CONFIG.mediumSteps).toBe(2);
        expect(DEFAULT_3D_LOD_CONFIG.deepSteps).toBe(4);
    });

    it('should allow custom LOD config', () => {
        const customConfig: Extrude3DLODConfig = {
            thinThreshold: 5,
            mediumThreshold: 25,
            thinSteps: 1,
            mediumSteps: 3,
            deepSteps: 6,
        };

        expect(getLOD3DSteps(3, customConfig)).toBe(1); // < 5
        expect(getLOD3DSteps(10, customConfig)).toBe(3); // 5-25
        expect(getLOD3DSteps(30, customConfig)).toBe(6); // >= 25
    });
});

describe('getLOD3DSteps', () => {
    it('should use default config when not provided', () => {
        expect(getLOD3DSteps(5)).toBe(DEFAULT_3D_LOD_CONFIG.thinSteps);
        expect(getLOD3DSteps(30)).toBe(DEFAULT_3D_LOD_CONFIG.mediumSteps);
        expect(getLOD3DSteps(80)).toBe(DEFAULT_3D_LOD_CONFIG.deepSteps);
    });

    it('should handle edge cases at threshold boundaries', () => {
        // Exactly at thin threshold
        expect(getLOD3DSteps(10)).toBe(2); // >= thinThreshold, < mediumThreshold

        // Exactly at medium threshold
        expect(getLOD3DSteps(50)).toBe(4); // >= mediumThreshold
    });

    it('should handle zero depth', () => {
        expect(getLOD3DSteps(0)).toBe(1);
    });

    it('should handle very large depth', () => {
        expect(getLOD3DSteps(1000)).toBe(4);
    });
});
