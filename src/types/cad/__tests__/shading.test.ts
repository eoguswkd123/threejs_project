/**
 * shading.test.ts
 * Phase 2.1.7: Shading 타입 및 함수 테스트
 */

import { DoubleSide } from 'three';
import { describe, it, expect } from 'vitest';

import {
    DEFAULT_MATERIAL_OPTIONS,
    DEFAULT_SHADING_MODE,
    SHADING_MODE_LABELS,
    SHADING_MODE_DESCRIPTIONS,
    isValidShadingMode,
} from '../shading';

import type { CadShadingMode, CadMaterialOptions } from '../shading';

describe('CadShadingMode', () => {
    it('should have 5 valid shading modes', () => {
        const validModes: CadShadingMode[] = [
            'wireframe',
            'flat',
            'smooth',
            'glossy',
            'hologram',
        ];

        validModes.forEach((mode) => {
            expect(isValidShadingMode(mode)).toBe(true);
        });
    });

    it('should reject invalid shading modes', () => {
        expect(isValidShadingMode('invalid')).toBe(false);
        expect(isValidShadingMode('')).toBe(false);
        expect(isValidShadingMode('textured')).toBe(false);
        expect(isValidShadingMode('reflective')).toBe(false);
    });
});

describe('DEFAULT_MATERIAL_OPTIONS', () => {
    it('should have correct default values', () => {
        expect(DEFAULT_MATERIAL_OPTIONS.color).toBe('#1e88e5');
        expect(DEFAULT_MATERIAL_OPTIONS.opacity).toBe(1.0);
        expect(DEFAULT_MATERIAL_OPTIONS.side).toBe(DoubleSide);
    });

    it('should be a complete Required<CadMaterialOptions> object', () => {
        const options: Required<CadMaterialOptions> = DEFAULT_MATERIAL_OPTIONS;

        expect(options.color).toBeDefined();
        expect(options.opacity).toBeDefined();
        expect(options.side).toBeDefined();
    });
});

describe('DEFAULT_SHADING_MODE', () => {
    it('should be "smooth"', () => {
        expect(DEFAULT_SHADING_MODE).toBe('smooth');
    });

    it('should be a valid CadShadingMode', () => {
        expect(isValidShadingMode(DEFAULT_SHADING_MODE)).toBe(true);
    });
});

describe('SHADING_MODE_LABELS', () => {
    it('should have labels for all shading modes', () => {
        expect(SHADING_MODE_LABELS.wireframe).toBe('Wireframe');
        expect(SHADING_MODE_LABELS.flat).toBe('Flat');
        expect(SHADING_MODE_LABELS.smooth).toBe('Smooth');
        expect(SHADING_MODE_LABELS.glossy).toBe('Glossy');
        expect(SHADING_MODE_LABELS.hologram).toBe('Hologram');
    });

    it('should have exactly 5 labels', () => {
        expect(Object.keys(SHADING_MODE_LABELS)).toHaveLength(5);
    });
});

describe('SHADING_MODE_DESCRIPTIONS', () => {
    it('should have descriptions for all shading modes', () => {
        expect(SHADING_MODE_DESCRIPTIONS.wireframe).toBeDefined();
        expect(SHADING_MODE_DESCRIPTIONS.flat).toBeDefined();
        expect(SHADING_MODE_DESCRIPTIONS.smooth).toBeDefined();
        expect(SHADING_MODE_DESCRIPTIONS.glossy).toBeDefined();
        expect(SHADING_MODE_DESCRIPTIONS.hologram).toBeDefined();
    });

    it('should have Korean descriptions', () => {
        // Descriptions are in Korean
        expect(SHADING_MODE_DESCRIPTIONS.wireframe).toContain('뼈대');
        expect(SHADING_MODE_DESCRIPTIONS.flat).toContain('면');
        expect(SHADING_MODE_DESCRIPTIONS.smooth).toContain('부드러운');
        expect(SHADING_MODE_DESCRIPTIONS.glossy).toContain('광택');
        expect(SHADING_MODE_DESCRIPTIONS.hologram).toContain('홀로그램');
    });
});

describe('isValidShadingMode', () => {
    it('should return true for valid modes', () => {
        expect(isValidShadingMode('wireframe')).toBe(true);
        expect(isValidShadingMode('flat')).toBe(true);
        expect(isValidShadingMode('smooth')).toBe(true);
        expect(isValidShadingMode('glossy')).toBe(true);
        expect(isValidShadingMode('hologram')).toBe(true);
    });

    it('should return false for invalid modes', () => {
        expect(isValidShadingMode('unknown')).toBe(false);
        expect(isValidShadingMode('basic')).toBe(false);
        expect(isValidShadingMode('phong')).toBe(false);
        expect(isValidShadingMode('')).toBe(false);
    });

    it('should work as type guard', () => {
        const mode = 'smooth';
        if (isValidShadingMode(mode)) {
            // TypeScript should narrow the type to CadShadingMode
            const shadingMode: CadShadingMode = mode;
            expect(shadingMode).toBe('smooth');
        }
    });
});
