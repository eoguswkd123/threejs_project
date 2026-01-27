/**
 * Layer Panel - Layer Visibility Control (Canvas-external)
 *
 * 레이어별 가시성 토글 UI (색상 인디케이터 포함)
 *
 * ## Virtual Scrolling
 * 50+ 레이어 시 자동으로 가상 스크롤링 활성화
 * @tanstack/react-virtual 사용
 *
 * @see {@link CADScene} - 부모 컨테이너
 */

import { useRef, useMemo } from 'react';

import { useVirtualizer } from '@tanstack/react-virtual';
import { Layers, Eye, EyeOff } from 'lucide-react';

import type { LayerInfo } from '@/types/cad';

/** 가상 스크롤링 활성화 임계값 */
const VIRTUAL_SCROLL_THRESHOLD = 50;

/** 레이어 아이템 높이 (px) */
const LAYER_ITEM_HEIGHT = 32;

interface LayerPanelProps {
    /** 레이어 정보 맵 */
    layers: Map<string, LayerInfo>;
    /** 레이어 가시성 토글 콜백 */
    onToggleLayer: (layerName: string) => void;
    /** 전체 레이어 표시/숨김 */
    onToggleAll?: (visible: boolean) => void;
}

/**
 * 개별 레이어 아이템 컴포넌트
 */
function LayerItem({
    layer,
    onToggle,
}: {
    layer: LayerInfo;
    onToggle: () => void;
}) {
    return (
        <button
            onClick={onToggle}
            className={`flex w-full items-center gap-2 rounded px-2 py-1.5 text-sm transition-colors ${
                layer.visible
                    ? 'bg-gray-800/50 hover:bg-gray-700/50'
                    : 'bg-gray-800/30 opacity-60 hover:opacity-80'
            }`}
        >
            {/* 가시성 아이콘 */}
            {layer.visible ? (
                <Eye className="h-3.5 w-3.5 flex-shrink-0 text-green-400" />
            ) : (
                <EyeOff className="h-3.5 w-3.5 flex-shrink-0 text-gray-500" />
            )}

            {/* 색상 인디케이터 */}
            <span
                className="h-3 w-3 flex-shrink-0 rounded-full border border-gray-600"
                style={{ backgroundColor: layer.color }}
            />

            {/* 레이어 이름 */}
            <span className="flex-1 truncate text-left" title={layer.name}>
                {layer.name}
            </span>

            {/* 엔티티 수 */}
            <span className="flex-shrink-0 text-xs text-gray-500">
                {layer.entityCount}
            </span>
        </button>
    );
}

/**
 * 가상 스크롤 레이어 목록
 */
function VirtualLayerList({
    layerArray,
    onToggleLayer,
}: {
    layerArray: LayerInfo[];
    onToggleLayer: (layerName: string) => void;
}) {
    const parentRef = useRef<HTMLDivElement>(null);

    const rowVirtualizer = useVirtualizer({
        count: layerArray.length,
        getScrollElement: () => parentRef.current,
        estimateSize: () => LAYER_ITEM_HEIGHT,
        overscan: 5, // 화면 밖 5개 항목 미리 렌더링
    });

    return (
        <div ref={parentRef} className="max-h-[300px] overflow-y-auto">
            <div
                style={{
                    height: `${rowVirtualizer.getTotalSize()}px`,
                    width: '100%',
                    position: 'relative',
                }}
            >
                {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                    const layer = layerArray[virtualRow.index];
                    if (!layer) return null;

                    return (
                        <div
                            key={virtualRow.key}
                            style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                width: '100%',
                                height: `${virtualRow.size}px`,
                                transform: `translateY(${virtualRow.start}px)`,
                            }}
                        >
                            <LayerItem
                                layer={layer}
                                onToggle={() => onToggleLayer(layer.name)}
                            />
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

/**
 * 일반 레이어 목록 (50개 미만)
 */
function SimpleLayerList({
    layerArray,
    onToggleLayer,
}: {
    layerArray: LayerInfo[];
    onToggleLayer: (layerName: string) => void;
}) {
    return (
        <div className="max-h-[300px] space-y-1 overflow-y-auto">
            {layerArray.map((layer) => (
                <LayerItem
                    key={layer.name}
                    layer={layer}
                    onToggle={() => onToggleLayer(layer.name)}
                />
            ))}
        </div>
    );
}

export function LayerPanel({
    layers,
    onToggleLayer,
    onToggleAll,
}: LayerPanelProps) {
    const layerArray = useMemo(() => Array.from(layers.values()), [layers]);
    const visibleCount = useMemo(
        () => layerArray.filter((l) => l.visible).length,
        [layerArray]
    );
    const allVisible = visibleCount === layerArray.length;
    const noneVisible = visibleCount === 0;

    // 50+ 레이어 시 가상 스크롤링 사용
    const useVirtualScroll = layerArray.length >= VIRTUAL_SCROLL_THRESHOLD;

    if (layerArray.length === 0) {
        return null;
    }

    return (
        <div className="absolute bottom-4 left-4 z-10 max-w-[250px] min-w-[180px] rounded-lg bg-gray-900/90 p-4 text-white backdrop-blur-sm">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
                <Layers className="h-4 w-4" />
                레이어 ({layerArray.length})
            </h3>

            {/* 전체 토글 */}
            {onToggleAll && layerArray.length > 1 && (
                <div className="mb-3 flex gap-2">
                    <button
                        onClick={() => onToggleAll(true)}
                        disabled={allVisible}
                        className="flex-1 rounded bg-gray-700 px-2 py-1 text-xs transition-colors hover:bg-gray-600 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        전체 표시
                    </button>
                    <button
                        onClick={() => onToggleAll(false)}
                        disabled={noneVisible}
                        className="flex-1 rounded bg-gray-700 px-2 py-1 text-xs transition-colors hover:bg-gray-600 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        전체 숨김
                    </button>
                </div>
            )}

            {/* 레이어 목록 - 50+ 레이어 시 가상 스크롤링 */}
            {useVirtualScroll ? (
                <VirtualLayerList
                    layerArray={layerArray}
                    onToggleLayer={onToggleLayer}
                />
            ) : (
                <SimpleLayerList
                    layerArray={layerArray}
                    onToggleLayer={onToggleLayer}
                />
            )}
        </div>
    );
}
