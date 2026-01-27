/**
 * SceneCanvas - SceneGrid Component
 *
 * 3D 씬의 그리드 담당
 * - GridHelper (Three.js)
 *
 * @description
 * 원자 컴포넌트로서 그리드 기능만 제공
 * SceneCanvasViewer에서 SceneBase 내부에 배치하여 사용
 *
 * @see {@link SceneCanvasViewer} - 조합된 Viewer 컴포넌트
 */

import { memo } from 'react';

import type { SceneGridProps } from './types';

/**
 * 그리드 컴포넌트
 *
 * GridHelper wrapper
 *
 * @example
 * ```tsx
 * // 기본 사용
 * <SceneGrid />
 *
 * // 커스텀 설정
 * <SceneGrid
 *   size={200}
 *   divisions={100}
 *   colorCenterLine={0x00ffff}
 *   colorGrid={0x004444}
 * />
 * ```
 */
function SceneGridComponent({
    size = 100,
    divisions = 50,
    colorCenterLine = 0x444444,
    colorGrid = 0x222222,
    rotation,
}: SceneGridProps) {
    return (
        <gridHelper
            args={[size, divisions, colorCenterLine, colorGrid]}
            {...(rotation && { rotation })}
        />
    );
}

export const SceneGrid = memo(SceneGridComponent);
