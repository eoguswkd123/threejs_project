/**
 * SceneCanvas - SceneLighting Component
 *
 * 3D 씬의 조명 담당
 * - AmbientLight (전역 조명)
 * - PointLights (점 조명 배열)
 *
 * @description
 * 원자 컴포넌트로서 조명 기능만 제공
 * SceneCanvasViewer에서 SceneBase 내부에 배치하여 사용
 *
 * @see {@link SceneCanvasViewer} - 조합된 Viewer 컴포넌트
 */

import { memo } from 'react';

import type { SceneLightingProps } from './types';

/**
 * 조명 컴포넌트
 *
 * Ambient + PointLights 조합
 *
 * @example
 * ```tsx
 * // 기본 사용
 * <SceneLighting ambientIntensity={0.8} />
 *
 * // PointLights 추가
 * <SceneLighting
 *   ambientIntensity={0.2}
 *   pointLights={[
 *     { position: [10, 10, 10], intensity: 0.5, color: '#ffffff' },
 *     { position: [-10, -10, -10], intensity: 0.3, color: '#00ffff' },
 *   ]}
 * />
 * ```
 */
function SceneLightingComponent({
    ambientIntensity = 0.8,
    ambientColor,
    pointLights,
}: SceneLightingProps) {
    return (
        <>
            {/* Ambient Light (전역 조명) */}
            <ambientLight
                intensity={ambientIntensity}
                {...(ambientColor && { color: ambientColor })}
            />

            {/* Point Lights (점 조명) */}
            {pointLights?.map((light) => (
                <pointLight
                    key={`pl-${light.position.join(',')}-${light.color ?? 'default'}`}
                    position={light.position}
                    intensity={light.intensity}
                    {...(light.color && { color: light.color })}
                />
            ))}
        </>
    );
}

export const SceneLighting = memo(SceneLightingComponent);
