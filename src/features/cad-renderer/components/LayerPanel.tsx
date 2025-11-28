/**
 * 레이어 패널 컴포넌트
 * CAD 레이어 가시성 및 정보 표시
 */

import { useMemo, useCallback } from 'react';
import { useViewerStore, useCADStore } from '@stores';
import type { CADLayer } from '@types/cad';

interface LayerPanelProps {
    className?: string;
    onLayerClick?: (layer: CADLayer) => void;
}

interface LayerItemProps {
    layer: CADLayer;
    entityCount: number;
    isVisible: boolean;
    onToggle: () => void;
    onClick?: () => void;
}

function LayerItem({ layer, entityCount, isVisible, onToggle, onClick }: LayerItemProps) {
    const colorHex = `#${layer.color.toString(16).padStart(6, '0')}`;

    return (
        <div
            className={`
                flex items-center gap-2 px-3 py-2
                hover:bg-gray-100 dark:hover:bg-gray-700
                cursor-pointer transition-colors
                ${!isVisible ? 'opacity-50' : ''}
            `}
            onClick={onClick}
        >
            {/* 가시성 토글 */}
            <button
                className="w-5 h-5 flex items-center justify-center"
                onClick={(e) => {
                    e.stopPropagation();
                    onToggle();
                }}
                title={isVisible ? '레이어 숨기기' : '레이어 표시'}
            >
                {isVisible ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        />
                    </svg>
                ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                        />
                    </svg>
                )}
            </button>

            {/* 레이어 색상 */}
            <div
                className="w-4 h-4 rounded border border-gray-300"
                style={{ backgroundColor: colorHex }}
            />

            {/* 레이어 이름 */}
            <span className="flex-1 text-sm truncate">{layer.name}</span>

            {/* 엔티티 개수 */}
            <span className="text-xs text-gray-500">{entityCount}</span>
        </div>
    );
}

export function LayerPanel({ className = '', onLayerClick }: LayerPanelProps) {
    const cadData = useCADStore((state) => state.cadData);
    const visibleLayers = useViewerStore((state) => state.visibility.visibleLayers);
    const toggleLayer = useViewerStore((state) => state.toggleLayer);
    const showAllLayers = useViewerStore((state) => state.setVisibleLayers);

    // 레이어별 엔티티 개수 계산
    const layerStats = useMemo(() => {
        if (!cadData) return new Map<string, number>();

        const stats = new Map<string, number>();
        cadData.entities.forEach((entity) => {
            const count = stats.get(entity.layer) ?? 0;
            stats.set(entity.layer, count + 1);
        });
        return stats;
    }, [cadData]);

    // 전체 표시/숨기기
    const handleShowAll = useCallback(() => {
        if (cadData) {
            showAllLayers(cadData.layers.map((l) => l.name));
        }
    }, [cadData, showAllLayers]);

    const handleHideAll = useCallback(() => {
        showAllLayers([]);
    }, [showAllLayers]);

    if (!cadData) {
        return (
            <div className={`p-4 text-center text-gray-500 ${className}`}>
                CAD 파일을 불러와주세요
            </div>
        );
    }

    return (
        <div className={`flex flex-col h-full ${className}`}>
            {/* 헤더 */}
            <div className="flex items-center justify-between px-3 py-2 border-b">
                <h3 className="font-medium text-sm">레이어</h3>
                <div className="flex gap-1">
                    <button
                        className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded"
                        onClick={handleShowAll}
                    >
                        전체 표시
                    </button>
                    <button
                        className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded"
                        onClick={handleHideAll}
                    >
                        전체 숨김
                    </button>
                </div>
            </div>

            {/* 레이어 목록 */}
            <div className="flex-1 overflow-y-auto">
                {cadData.layers.map((layer) => (
                    <LayerItem
                        key={layer.name}
                        layer={layer}
                        entityCount={layerStats.get(layer.name) ?? 0}
                        isVisible={visibleLayers.includes(layer.name)}
                        onToggle={() => toggleLayer(layer.name)}
                        onClick={() => onLayerClick?.(layer)}
                    />
                ))}
            </div>

            {/* 푸터 - 통계 */}
            <div className="px-3 py-2 border-t text-xs text-gray-500">
                {cadData.layers.length}개 레이어, {cadData.entities.length}개 엔티티
            </div>
        </div>
    );
}
