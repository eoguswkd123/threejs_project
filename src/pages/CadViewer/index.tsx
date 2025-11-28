/**
 * CAD 뷰어 페이지
 * CAD 파일 업로드 및 3D 렌더링
 */

import { useCallback, useState, useRef } from 'react';
import { CadScene, LayerPanel, useCADLoader, useSelection, useCameraControls } from '@features/cad-renderer';
import { useCADStore, useViewerStore, selectIsLoading, selectHasData } from '@stores';
import type { CADLayer } from '@types/cad';

// 파일 업로드 영역
function FileUploadArea({ onFileSelect }: { onFileSelect: (file: File) => void }) {
    const [isDragging, setIsDragging] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleDrop = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault();
            setIsDragging(false);
            const file = e.dataTransfer.files[0];
            if (file && (file.name.endsWith('.dxf') || file.name.endsWith('.DXF'))) {
                onFileSelect(file);
            }
        },
        [onFileSelect]
    );

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback(() => {
        setIsDragging(false);
    }, []);

    const handleClick = useCallback(() => {
        inputRef.current?.click();
    }, []);

    const handleChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const file = e.target.files?.[0];
            if (file) {
                onFileSelect(file);
            }
        },
        [onFileSelect]
    );

    return (
        <div
            className={`
                flex flex-col items-center justify-center
                h-full border-2 border-dashed rounded-lg
                cursor-pointer transition-colors
                ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
            `}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={handleClick}
        >
            <input
                ref={inputRef}
                type="file"
                accept=".dxf,.DXF"
                className="hidden"
                onChange={handleChange}
            />
            <svg className="w-16 h-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
            </svg>
            <p className="text-lg font-medium text-gray-600">DXF 파일을 끌어다 놓거나 클릭하세요</p>
            <p className="text-sm text-gray-400 mt-2">지원 형식: DXF</p>
        </div>
    );
}

// 도구 모음
function Toolbar() {
    const { fitToView, reset, presets, applyPreset } = useCameraControls();
    const config = useViewerStore((state) => state.config);
    const setRenderMode = useViewerStore((state) => state.setRenderMode);
    const toggleGrid = useViewerStore((state) => state.toggleGrid);
    const toggleAxes = useViewerStore((state) => state.toggleAxes);

    return (
        <div className="flex items-center gap-2 p-2 bg-white border-b">
            {/* 카메라 프리셋 */}
            <div className="flex gap-1">
                {presets.map((preset) => (
                    <button
                        key={preset}
                        className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded"
                        onClick={() => applyPreset(preset)}
                    >
                        {preset}
                    </button>
                ))}
            </div>

            <div className="w-px h-6 bg-gray-300" />

            {/* 전체 보기 */}
            <button
                className="px-3 py-1 text-sm bg-blue-500 text-white hover:bg-blue-600 rounded"
                onClick={fitToView}
            >
                전체 보기
            </button>

            <button
                className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded"
                onClick={reset}
            >
                리셋
            </button>

            <div className="w-px h-6 bg-gray-300" />

            {/* 렌더 모드 */}
            <select
                className="px-2 py-1 text-sm border rounded"
                value={config.renderMode}
                onChange={(e) => setRenderMode(e.target.value as any)}
            >
                <option value="wireframe">와이어프레임</option>
                <option value="solid">솔리드</option>
                <option value="points">포인트</option>
                <option value="mixed">혼합</option>
            </select>

            <div className="w-px h-6 bg-gray-300" />

            {/* 헬퍼 토글 */}
            <label className="flex items-center gap-1 text-sm">
                <input
                    type="checkbox"
                    checked={config.gridEnabled}
                    onChange={toggleGrid}
                />
                그리드
            </label>

            <label className="flex items-center gap-1 text-sm">
                <input
                    type="checkbox"
                    checked={config.axesEnabled}
                    onChange={toggleAxes}
                />
                축
            </label>
        </div>
    );
}

// 상태 표시 바
function StatusBar() {
    const currentFile = useCADStore((state) => state.currentFile);
    const conversionStatus = useCADStore((state) => state.conversionStatus);
    const conversionProgress = useCADStore((state) => state.conversionProgress);
    const conversionSource = useCADStore((state) => state.conversionSource);
    const conversionTime = useCADStore((state) => state.conversionTime);
    const { selectionCount, selectedEntities } = useSelection();
    const cadData = useCADStore((state) => state.cadData);

    return (
        <div className="flex items-center justify-between px-3 py-1 bg-gray-100 border-t text-xs text-gray-600">
            <div className="flex items-center gap-4">
                {currentFile && <span>파일: {currentFile.name}</span>}
                {cadData && (
                    <>
                        <span>엔티티: {cadData.entities.length}</span>
                        <span>레이어: {cadData.layers.length}</span>
                    </>
                )}
            </div>

            <div className="flex items-center gap-4">
                {selectionCount > 0 && (
                    <span>선택됨: {selectionCount}개</span>
                )}
                {conversionStatus !== 'idle' && conversionStatus !== 'success' && (
                    <span>
                        {conversionStatus === 'analyzing' && '분석 중...'}
                        {conversionStatus === 'parsing' && '파싱 중...'}
                        {conversionStatus === 'converting' && `변환 중... ${conversionProgress.toFixed(0)}%`}
                        {conversionStatus === 'error' && '오류 발생'}
                    </span>
                )}
                {conversionSource && conversionTime && (
                    <span>
                        변환: {conversionSource === 'frontend' ? '로컬' : '서버'} ({conversionTime}ms)
                    </span>
                )}
            </div>
        </div>
    );
}

// 선택 정보 패널
function SelectionPanel() {
    const { selectedEntities, clearSelection } = useSelection();

    if (selectedEntities.length === 0) {
        return (
            <div className="p-4 text-center text-gray-500">
                엔티티를 선택하세요
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full">
            <div className="flex items-center justify-between px-3 py-2 border-b">
                <h3 className="font-medium text-sm">선택됨 ({selectedEntities.length})</h3>
                <button
                    className="text-xs text-blue-500 hover:underline"
                    onClick={clearSelection}
                >
                    선택 해제
                </button>
            </div>

            <div className="flex-1 overflow-y-auto">
                {selectedEntities.map((entity) => (
                    <div
                        key={entity.id}
                        className="px-3 py-2 border-b text-sm"
                    >
                        <div className="font-medium">{entity.type}</div>
                        <div className="text-xs text-gray-500">
                            레이어: {entity.layer}
                        </div>
                        <div className="text-xs text-gray-500">
                            ID: {entity.id.slice(0, 8)}...
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// 메인 컴포넌트
export default function CadViewer() {
    const { loadFile, isLoading } = useCADLoader();
    const hasData = useCADStore(selectHasData);
    const isConverting = useCADStore(selectIsLoading);
    const conversionError = useCADStore((state) => state.conversionError);
    const reset = useCADStore((state) => state.reset);

    const [activePanel, setActivePanel] = useState<'layers' | 'selection'>('layers');

    const handleFileSelect = useCallback(
        async (file: File) => {
            await loadFile(file);
        },
        [loadFile]
    );

    const handleLayerClick = useCallback((layer: CADLayer) => {
        // 레이어 클릭 시 해당 레이어의 엔티티들 선택
        console.log('Layer clicked:', layer.name);
    }, []);

    return (
        <div className="flex flex-col h-full">
            {/* 헤더 */}
            <div className="flex items-center justify-between p-4 bg-white border-b">
                <div>
                    <h1 className="text-2xl font-bold">CAD 뷰어</h1>
                    <p className="text-gray-600 mt-1">
                        DXF 파일을 업로드하여 3D로 확인하세요
                    </p>
                </div>

                {hasData && (
                    <button
                        className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded"
                        onClick={reset}
                    >
                        새 파일 열기
                    </button>
                )}
            </div>

            {/* 도구 모음 */}
            {hasData && <Toolbar />}

            {/* 메인 콘텐츠 */}
            <div className="flex-1 flex overflow-hidden">
                {!hasData ? (
                    // 파일 업로드 영역
                    <div className="flex-1 p-8">
                        {conversionError ? (
                            <div className="flex flex-col items-center justify-center h-full">
                                <div className="text-red-500 text-lg mb-4">오류: {conversionError}</div>
                                <button
                                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                                    onClick={reset}
                                >
                                    다시 시도
                                </button>
                            </div>
                        ) : isConverting ? (
                            <div className="flex flex-col items-center justify-center h-full">
                                <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mb-4" />
                                <div className="text-gray-600">파일 처리 중...</div>
                            </div>
                        ) : (
                            <FileUploadArea onFileSelect={handleFileSelect} />
                        )}
                    </div>
                ) : (
                    <>
                        {/* 3D 뷰어 */}
                        <div className="flex-1">
                            <CadScene
                                showGrid
                                showAxes
                                showGizmo
                            />
                        </div>

                        {/* 사이드 패널 */}
                        <div className="w-64 bg-white border-l flex flex-col">
                            {/* 패널 탭 */}
                            <div className="flex border-b">
                                <button
                                    className={`flex-1 px-4 py-2 text-sm ${
                                        activePanel === 'layers'
                                            ? 'bg-white border-b-2 border-blue-500'
                                            : 'bg-gray-50'
                                    }`}
                                    onClick={() => setActivePanel('layers')}
                                >
                                    레이어
                                </button>
                                <button
                                    className={`flex-1 px-4 py-2 text-sm ${
                                        activePanel === 'selection'
                                            ? 'bg-white border-b-2 border-blue-500'
                                            : 'bg-gray-50'
                                    }`}
                                    onClick={() => setActivePanel('selection')}
                                >
                                    선택
                                </button>
                            </div>

                            {/* 패널 내용 */}
                            <div className="flex-1 overflow-hidden">
                                {activePanel === 'layers' ? (
                                    <LayerPanel onLayerClick={handleLayerClick} />
                                ) : (
                                    <SelectionPanel />
                                )}
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* 상태 바 */}
            <StatusBar />
        </div>
    );
}
