/**
 * LoadingSpinnerCanvas - Canvas 내부용 로딩 스피너
 *
 * Three.js Canvas 내부에서 LoadingSpinner를 사용하기 위한 래퍼
 * Html 컴포넌트로 DOM을 3D 공간에 투영
 *
 * @example
 * ```tsx
 * <Canvas>
 *   <Suspense fallback={<LoadingSpinnerCanvas />}>
 *     <MyMesh />
 *   </Suspense>
 * </Canvas>
 * ```
 */

import { memo } from 'react';

import { Html } from '@react-three/drei';

import { LoadingSpinner } from './LoadingSpinner';

/**
 * Canvas 내부에서 사용하는 로딩 스피너
 *
 * LoadingSpinner를 Html 컴포넌트로 감싸서 3D 공간에 렌더링
 */
function LoadingSpinnerCanvasComponent() {
    return (
        <Html center>
            <LoadingSpinner size="md" />
        </Html>
    );
}

export const LoadingSpinnerCanvas = memo(LoadingSpinnerCanvasComponent);
