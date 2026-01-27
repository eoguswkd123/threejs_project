/**
 * SceneCanvas - SceneEffects Component
 *
 * 공통 Postprocessing 효과 컴포넌트
 * - Bloom: 과노출 영역 글로우 효과
 * - Scanline: CRT 스캔라인 효과
 *
 * @see {@link SceneCanvasViewer} - 이 컴포넌트와 함께 사용
 */

import { memo } from 'react';

import { EffectComposer, Bloom, Scanline } from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';

import type { SceneEffectsProps } from './types';

/**
 * Postprocessing 효과 컴포넌트
 *
 * @example
 * ```tsx
 * <Canvas>
 *   <mesh />
 *   <SceneEffects enableBloom bloomIntensity={0.8} />
 * </Canvas>
 * ```
 *
 * @example
 * ```tsx
 * // Hologram 스타일 (Bloom + Scanline)
 * <Canvas>
 *   <mesh />
 *   <SceneEffects
 *     enableBloom
 *     bloomIntensity={0.5}
 *     bloomThreshold={0.6}
 *     enableScanline
 *     scanlineDensity={1.25}
 *   />
 * </Canvas>
 * ```
 */
function SceneEffectsComponent({
    enableBloom = false,
    enableScanline = false,
    bloomIntensity = 0.5,
    bloomThreshold = 0.6,
    scanlineDensity = 1.25,
}: SceneEffectsProps) {
    // Bloom + Scanline 모두 활성화
    if (enableBloom && enableScanline) {
        return (
            <EffectComposer>
                <Bloom
                    luminanceThreshold={bloomThreshold}
                    luminanceSmoothing={0.9}
                    intensity={bloomIntensity}
                    mipmapBlur
                />
                <Scanline
                    blendFunction={BlendFunction.OVERLAY}
                    density={scanlineDensity}
                />
            </EffectComposer>
        );
    }

    // Bloom만 활성화
    if (enableBloom) {
        return (
            <EffectComposer>
                <Bloom
                    luminanceThreshold={bloomThreshold}
                    luminanceSmoothing={0.9}
                    intensity={bloomIntensity}
                    mipmapBlur
                />
            </EffectComposer>
        );
    }

    // Scanline만 활성화
    if (enableScanline) {
        return (
            <EffectComposer>
                <Scanline
                    blendFunction={BlendFunction.OVERLAY}
                    density={scanlineDensity}
                />
            </EffectComposer>
        );
    }

    // 모든 효과 비활성화
    return null;
}

export const SceneEffects = memo(SceneEffectsComponent);
