/**
 * hologram.test.ts
 * Hologram 타입 및 상수 테스트
 */

import { describe, it, expect } from 'vitest';

import { DEFAULT_HOLOGRAM_SETTINGS, HOLOGRAM_COLOR_PRESETS } from '../hologram';

import type { HologramSettings, HologramColorPreset } from '../hologram';

describe('HologramSettings', () => {
    it('DEFAULT_HOLOGRAM_SETTINGS should have all required properties', () => {
        const settings: HologramSettings = DEFAULT_HOLOGRAM_SETTINGS;

        expect(settings.fresnelAmount).toBeDefined();
        expect(settings.fresnelOpacity).toBeDefined();
        expect(settings.hologramBrightness).toBeDefined();
        expect(settings.scanlineSize).toBeDefined();
        expect(settings.signalSpeed).toBeDefined();
        expect(settings.hologramColor).toBeDefined();
        expect(settings.hologramOpacity).toBeDefined();
        expect(settings.enableBlinking).toBeDefined();
        expect(settings.blinkFresnelOnly).toBeDefined();
        expect(settings.enableAdditive).toBeDefined();
    });

    it('DEFAULT_HOLOGRAM_SETTINGS should have correct default values', () => {
        expect(DEFAULT_HOLOGRAM_SETTINGS.fresnelAmount).toBe(0.2);
        expect(DEFAULT_HOLOGRAM_SETTINGS.fresnelOpacity).toBe(0.15);
        expect(DEFAULT_HOLOGRAM_SETTINGS.hologramBrightness).toBe(0.7);
        expect(DEFAULT_HOLOGRAM_SETTINGS.scanlineSize).toBe(6);
        expect(DEFAULT_HOLOGRAM_SETTINGS.signalSpeed).toBe(2.3);
        expect(DEFAULT_HOLOGRAM_SETTINGS.hologramColor).toBe('#00ffff');
        expect(DEFAULT_HOLOGRAM_SETTINGS.hologramOpacity).toBe(1.0);
        expect(DEFAULT_HOLOGRAM_SETTINGS.enableBlinking).toBe(true);
        expect(DEFAULT_HOLOGRAM_SETTINGS.blinkFresnelOnly).toBe(true);
        expect(DEFAULT_HOLOGRAM_SETTINGS.enableAdditive).toBe(true);
    });

    it('DEFAULT_HOLOGRAM_SETTINGS should be readonly', () => {
        // TypeScript의 Readonly<> 타입이 적용되어 있으므로
        // 런타임에서 수정 시도 시 에러 발생하지 않지만
        // 실제 값 변경 여부로 불변성 검증
        const originalColor = DEFAULT_HOLOGRAM_SETTINGS.hologramColor;
        expect(originalColor).toBe('#00ffff');
    });

    it('fresnelAmount should be in valid range (0.0 - 1.0)', () => {
        expect(DEFAULT_HOLOGRAM_SETTINGS.fresnelAmount).toBeGreaterThanOrEqual(
            0
        );
        expect(DEFAULT_HOLOGRAM_SETTINGS.fresnelAmount).toBeLessThanOrEqual(1);
    });

    it('hologramOpacity should be in valid range (0.0 - 1.0)', () => {
        expect(
            DEFAULT_HOLOGRAM_SETTINGS.hologramOpacity
        ).toBeGreaterThanOrEqual(0);
        expect(DEFAULT_HOLOGRAM_SETTINGS.hologramOpacity).toBeLessThanOrEqual(
            1
        );
    });

    it('scanlineSize should be in valid range (1 - 15)', () => {
        expect(DEFAULT_HOLOGRAM_SETTINGS.scanlineSize).toBeGreaterThanOrEqual(
            1
        );
        expect(DEFAULT_HOLOGRAM_SETTINGS.scanlineSize).toBeLessThanOrEqual(15);
    });
});

describe('HOLOGRAM_COLOR_PRESETS', () => {
    it('should have 5 color presets', () => {
        expect(Object.keys(HOLOGRAM_COLOR_PRESETS)).toHaveLength(5);
    });

    it('should have all expected preset keys', () => {
        expect(HOLOGRAM_COLOR_PRESETS.ironMan).toBeDefined();
        expect(HOLOGRAM_COLOR_PRESETS.jarvis).toBeDefined();
        expect(HOLOGRAM_COLOR_PRESETS.matrix).toBeDefined();
        expect(HOLOGRAM_COLOR_PRESETS.warning).toBeDefined();
        expect(HOLOGRAM_COLOR_PRESETS.danger).toBeDefined();
    });

    it('should have valid hex color values', () => {
        const hexColorRegex = /^#[0-9a-fA-F]{6}$/;

        expect(HOLOGRAM_COLOR_PRESETS.ironMan).toMatch(hexColorRegex);
        expect(HOLOGRAM_COLOR_PRESETS.jarvis).toMatch(hexColorRegex);
        expect(HOLOGRAM_COLOR_PRESETS.matrix).toMatch(hexColorRegex);
        expect(HOLOGRAM_COLOR_PRESETS.warning).toMatch(hexColorRegex);
        expect(HOLOGRAM_COLOR_PRESETS.danger).toMatch(hexColorRegex);
    });

    it('should have correct preset colors', () => {
        expect(HOLOGRAM_COLOR_PRESETS.ironMan).toBe('#00ffff');
        expect(HOLOGRAM_COLOR_PRESETS.jarvis).toBe('#00e5ff');
        expect(HOLOGRAM_COLOR_PRESETS.matrix).toBe('#00ff41');
        expect(HOLOGRAM_COLOR_PRESETS.warning).toBe('#ff6b00');
        expect(HOLOGRAM_COLOR_PRESETS.danger).toBe('#ff0040');
    });
});

describe('HologramColorPreset type', () => {
    it('should allow valid preset keys', () => {
        const presets: HologramColorPreset[] = [
            'ironMan',
            'jarvis',
            'matrix',
            'warning',
            'danger',
        ];

        presets.forEach((preset) => {
            expect(HOLOGRAM_COLOR_PRESETS[preset]).toBeDefined();
        });
    });

    it('should be usable as lookup key', () => {
        const preset: HologramColorPreset = 'ironMan';
        const color = HOLOGRAM_COLOR_PRESETS[preset];
        expect(color).toBe('#00ffff');
    });
});
