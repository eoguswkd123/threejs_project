/**
 * ELLIPSE Entity Parser
 */

import type { ParsedEllipse } from '@/types/cad';

import { toPoint3D } from './utils';

import type { DXFLibEntity } from '../../types';

/**
 * ELLIPSE 엔티티 파싱
 * @param entity DXF 라이브러리 엔티티
 * @returns 파싱된 ELLIPSE 또는 유효하지 않으면 null
 */
export function parseEllipse(entity: DXFLibEntity): ParsedEllipse | null {
    const majorAxisEnd = entity.majorAxisEndPoint;

    // 장축 끝점 필수
    if (!majorAxisEnd) {
        if (import.meta.env?.DEV) {
            console.warn(
                'Invalid ELLIPSE entity: missing majorAxisEndPoint',
                entity
            );
        }
        return null;
    }

    const axisRatio = entity.axisRatio ?? 1;

    // 유효하지 않은 축 비율 검증 (0 < ratio <= 1)
    if (axisRatio <= 0 || axisRatio > 1 || !isFinite(axisRatio)) {
        if (import.meta.env?.DEV) {
            console.warn('Invalid ELLIPSE entity: invalid axisRatio', {
                axisRatio,
                entity,
            });
        }
        return null;
    }

    return {
        center: toPoint3D(entity.center),
        majorAxisEnd: toPoint3D(majorAxisEnd),
        minorAxisRatio: axisRatio,
        startParam: entity.startParameter ?? 0,
        endParam: entity.endParameter ?? Math.PI * 2,
        layer: entity.layer,
    };
}
