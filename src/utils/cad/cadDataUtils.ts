/**
 * CAD Data Utilities
 *
 * CAD 데이터 처리를 위한 순수 유틸리티 함수
 * - 레이어 필터링
 * - 텍스트 앵커 변환
 * - 엔티티 집계
 *
 * @module utils/cad/cadDataUtils
 */

import type { ParsedCADData, ParsedHatch, MTextAttachment } from '@/types/cad';

/**
 * 특정 레이어의 데이터만 필터링
 *
 * @param data - 파싱된 CAD 데이터
 * @param layerName - 대상 레이어 이름
 * @returns 해당 레이어의 필터링된 CAD 데이터
 */
export function filterDataByLayerName(
    data: ParsedCADData,
    layerName: string
): ParsedCADData {
    const matchLayer = (entityLayer: string | undefined): boolean => {
        return (entityLayer ?? '0') === layerName;
    };

    return {
        ...data,
        lines: data.lines.filter((e) => matchLayer(e.layer)),
        circles: data.circles.filter((e) => matchLayer(e.layer)),
        arcs: data.arcs.filter((e) => matchLayer(e.layer)),
        polylines: data.polylines.filter((e) => matchLayer(e.layer)),
        hatches: data.hatches.filter((e) => matchLayer(e.layer)),
        texts: data.texts.filter((e) => matchLayer(e.layer)),
        mtexts: data.mtexts.filter((e) => matchLayer(e.layer)),
        ellipses: data.ellipses.filter((e) => matchLayer(e.layer)),
        splines: data.splines.filter((e) => matchLayer(e.layer)),
        dimensions: data.dimensions.filter((e) => matchLayer(e.layer)),
    };
}

/**
 * 특정 레이어의 HATCH만 필터링
 */
export function filterHatchesByLayerName(
    hatches: ParsedHatch[],
    layerName: string
): ParsedHatch[] {
    return hatches.filter((h) => (h.layer ?? '0') === layerName);
}

/**
 * MTextAttachment를 drei Text anchorX/anchorY로 변환
 */
export function getTextAnchors(attachment: MTextAttachment): {
    anchorX: 'left' | 'center' | 'right';
    anchorY: 'top' | 'middle' | 'bottom';
} {
    const parts = attachment.split('-');
    const vertical = parts[0] as 'top' | 'middle' | 'bottom';
    const horizontal = parts[1] as 'left' | 'center' | 'right';
    return {
        anchorX: horizontal,
        anchorY: vertical,
    };
}

/**
 * 레이어의 엔티티 개수 계산 (LINE, CIRCLE, ARC, POLYLINE)
 */
export function getWireframeEntityCount(data: ParsedCADData): number {
    return (
        data.lines.length +
        data.circles.length +
        data.arcs.length +
        data.polylines.length
    );
}
