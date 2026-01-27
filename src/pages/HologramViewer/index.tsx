/**
 * HologramViewer Page
 *
 * Iron Man 스타일 AR 홀로그램 3D 뷰어 페이지
 * glTF/glb 모델을 홀로그램 효과로 렌더링
 */

import { ViewerErrorBoundary } from '@/components/Common';
import { HologramScene } from '@/features/HologramViewer';

/**
 * 홀로그램 뷰어 페이지
 *
 * 라우트: /hologram
 */
export default function HologramViewerPage() {
    return (
        <ViewerErrorBoundary
            viewerName="Hologram"
            onError={(error) => {
                // 추후 에러 추적 서비스 연동 가능
                console.error('HologramViewer error:', error);
            }}
        >
            <div className="h-full w-full">
                <HologramScene />
            </div>
        </ViewerErrorBoundary>
    );
}
