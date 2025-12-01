/**
 * CAD Viewer Page
 * DXF 파일 업로드 및 3D 와이어프레임 렌더링 페이지
 */

import { CADScene } from '@/features/CADViewer';

export default function CADViewerPage() {
    return (
        <div className="h-screen w-full">
            <CADScene />
        </div>
    );
}
