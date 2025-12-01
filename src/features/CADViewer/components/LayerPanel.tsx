/**
 * CAD Viewer - Layer Panel Component
 * 레이어 가시성 토글 UI
 */

import { Layers, Eye, EyeOff } from 'lucide-react';
import type { LayerInfo } from '../types';

interface LayerPanelProps {
    /** 레이어 정보 맵 */
    layers: Map<string, LayerInfo>;
    /** 레이어 가시성 토글 콜백 */
    onToggleLayer: (layerName: string) => void;
    /** 전체 레이어 표시/숨김 */
    onToggleAll?: (visible: boolean) => void;
}

export function LayerPanel({
    layers,
    onToggleLayer,
    onToggleAll,
}: LayerPanelProps) {
    const layerArray = Array.from(layers.values());
    const visibleCount = layerArray.filter((l) => l.visible).length;
    const allVisible = visibleCount === layerArray.length;
    const noneVisible = visibleCount === 0;

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

            {/* 레이어 목록 */}
            <div className="max-h-[300px] space-y-1 overflow-y-auto">
                {layerArray.map((layer) => (
                    <button
                        key={layer.name}
                        onClick={() => onToggleLayer(layer.name)}
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
                        <span
                            className="flex-1 truncate text-left"
                            title={layer.name}
                        >
                            {layer.name}
                        </span>

                        {/* 엔티티 수 */}
                        <span className="flex-shrink-0 text-xs text-gray-500">
                            {layer.entityCount}
                        </span>
                    </button>
                ))}
            </div>
        </div>
    );
}
