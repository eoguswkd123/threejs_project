/**
 * CAD Viewer - Controls Panel Component
 * 뷰어 설정 컨트롤 UI (HTML Overlay)
 */

import { Info, RotateCcw, Trash2 } from 'lucide-react';

import { formatFileSize } from '../utils/validators';

import type { ParsedCADData, CADViewerConfig } from '../types';

interface CADControlsProps {
    /** 파싱된 CAD 데이터 (메타데이터 표시용) */
    data: ParsedCADData | null;
    /** 뷰어 설정 */
    config: CADViewerConfig;
    /** 설정 변경 콜백 */
    onConfigChange: (config: Partial<CADViewerConfig>) => void;
    /** 뷰 리셋 콜백 */
    onResetView?: () => void;
    /** 파일 리셋 콜백 */
    onResetFile?: () => void;
}

export function CADControls({
    data,
    config,
    onConfigChange,
    onResetView,
    onResetFile,
}: CADControlsProps) {
    return (
        <div className="absolute top-4 right-4 z-10 min-w-[200px] rounded-lg bg-gray-900/90 p-4 text-white backdrop-blur-sm">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
                <Info className="h-4 w-4" />
                CAD Viewer
            </h3>

            {/* 파일 정보 */}
            {data && (
                <div className="mb-4 space-y-1 rounded bg-gray-800/50 p-2 text-xs">
                    <p className="truncate" title={data.metadata.fileName}>
                        <span className="text-gray-400">파일:</span>{' '}
                        {data.metadata.fileName}
                    </p>
                    <p>
                        <span className="text-gray-400">크기:</span>{' '}
                        {formatFileSize(data.metadata.fileSize)}
                    </p>
                    <p>
                        <span className="text-gray-400">LINE 수:</span>{' '}
                        {data.metadata.entityCount.toLocaleString()}
                    </p>
                    <p>
                        <span className="text-gray-400">파싱 시간:</span>{' '}
                        {data.metadata.parseTime}ms
                    </p>
                </div>
            )}

            {/* 설정 컨트롤 */}
            <div className="space-y-3">
                {/* 그리드 표시 */}
                <label className="flex cursor-pointer items-center gap-2">
                    <input
                        type="checkbox"
                        checked={config.showGrid}
                        onChange={(e) =>
                            onConfigChange({ showGrid: e.target.checked })
                        }
                        className="h-4 w-4 rounded border-gray-600 bg-gray-700 text-green-500 focus:ring-green-500"
                    />
                    <span className="text-sm">그리드 표시</span>
                </label>

                {/* 와이어프레임 색상 */}
                <div className="flex items-center gap-2">
                    <label className="text-sm text-gray-400">색상:</label>
                    <input
                        type="color"
                        value={config.wireframeColor}
                        onChange={(e) =>
                            onConfigChange({ wireframeColor: e.target.value })
                        }
                        className="h-6 w-8 cursor-pointer rounded border border-gray-600 bg-transparent"
                    />
                    <span className="font-mono text-xs text-gray-500">
                        {config.wireframeColor}
                    </span>
                </div>

                {/* 버튼 그룹 */}
                <div className="mt-2 flex gap-2">
                    {/* 뷰 리셋 버튼 */}
                    {onResetView && (
                        <button
                            onClick={onResetView}
                            className="flex flex-1 items-center justify-center gap-2 rounded bg-gray-700 px-3 py-2 text-sm transition-colors hover:bg-gray-600"
                        >
                            <RotateCcw className="h-4 w-4" />뷰 리셋
                        </button>
                    )}

                    {/* 파일 리셋 버튼 */}
                    {onResetFile && (
                        <button
                            onClick={onResetFile}
                            className="flex flex-1 items-center justify-center gap-2 rounded bg-red-700 px-3 py-2 text-sm transition-colors hover:bg-red-600"
                        >
                            <Trash2 className="h-4 w-4" />
                            파일 리셋
                        </button>
                    )}
                </div>
            </div>

            {/* 사용 안내 */}
            {!data && (
                <p className="mt-3 text-xs text-gray-500">
                    DXF 파일을 업로드하면 3D 와이어프레임으로 표시됩니다.
                </p>
            )}
        </div>
    );
}
