/**
 * 선택 관리 훅
 * 엔티티 선택, 다중 선택, 선택 정보 조회
 */

import { useCallback, useMemo } from 'react';
import { useViewerStore, useCADStore } from '@stores';
import type { CADEntity } from '@types/cad';

export function useSelection() {
    const selectedIds = useViewerStore((state) => state.selection.selectedIds);
    const highlightedId = useViewerStore((state) => state.selection.highlightedId);
    const selectEntity = useViewerStore((state) => state.selectEntity);
    const selectEntities = useViewerStore((state) => state.selectEntities);
    const toggleSelection = useViewerStore((state) => state.toggleSelection);
    const deselectAll = useViewerStore((state) => state.deselectAll);
    const highlightEntity = useViewerStore((state) => state.highlightEntity);
    const cadData = useCADStore((state) => state.cadData);

    // 선택된 엔티티 조회
    const selectedEntities = useMemo<CADEntity[]>(() => {
        if (!cadData) return [];
        return cadData.entities.filter((e) => selectedIds.includes(e.id));
    }, [cadData, selectedIds]);

    // 하이라이트된 엔티티 조회
    const highlightedEntity = useMemo<CADEntity | null>(() => {
        if (!cadData || !highlightedId) return null;
        return cadData.entities.find((e) => e.id === highlightedId) ?? null;
    }, [cadData, highlightedId]);

    // 단일 선택
    const select = useCallback(
        (entityId: string) => {
            selectEntity(entityId);
        },
        [selectEntity]
    );

    // 다중 선택
    const selectMultiple = useCallback(
        (entityIds: string[]) => {
            selectEntities(entityIds);
        },
        [selectEntities]
    );

    // 토글 선택 (Ctrl+클릭)
    const toggle = useCallback(
        (entityId: string) => {
            toggleSelection(entityId);
        },
        [toggleSelection]
    );

    // 전체 선택 해제
    const clearSelection = useCallback(() => {
        deselectAll();
    }, [deselectAll]);

    // 하이라이트
    const highlight = useCallback(
        (entityId: string | undefined) => {
            highlightEntity(entityId);
        },
        [highlightEntity]
    );

    // 레이어별 선택
    const selectByLayer = useCallback(
        (layerName: string) => {
            if (!cadData) return;
            const ids = cadData.entities
                .filter((e) => e.layer === layerName)
                .map((e) => e.id);
            selectEntities(ids);
        },
        [cadData, selectEntities]
    );

    // 타입별 선택
    const selectByType = useCallback(
        (type: CADEntity['type']) => {
            if (!cadData) return;
            const ids = cadData.entities.filter((e) => e.type === type).map((e) => e.id);
            selectEntities(ids);
        },
        [cadData, selectEntities]
    );

    // 선택 상태 확인
    const isSelected = useCallback(
        (entityId: string) => selectedIds.includes(entityId),
        [selectedIds]
    );

    const isHighlighted = useCallback(
        (entityId: string) => highlightedId === entityId,
        [highlightedId]
    );

    return {
        // 상태
        selectedIds,
        highlightedId,
        selectedEntities,
        highlightedEntity,
        selectionCount: selectedIds.length,
        hasSelection: selectedIds.length > 0,

        // 액션
        select,
        selectMultiple,
        toggle,
        clearSelection,
        highlight,
        selectByLayer,
        selectByType,

        // 유틸리티
        isSelected,
        isHighlighted,
    };
}
