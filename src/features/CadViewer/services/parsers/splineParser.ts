/**
 * SPLINE Entity Parser
 */

import type { ParsedSpline } from '@/types/cad';

import { toPoint3DArray } from './utils';

import type { DXFLibEntity } from '../../types';

/**
 * SPLINE 엔티티 파싱
 * @param entity DXF 라이브러리 엔티티
 * @returns 파싱된 SPLINE 또는 유효하지 않으면 null
 */
export function parseSpline(entity: DXFLibEntity): ParsedSpline | null {
    const controlPoints = toPoint3DArray(entity.controlPoints);

    // 최소 2개의 제어점 필요
    if (controlPoints.length < 2) {
        if (import.meta.env?.DEV) {
            console.warn('Invalid SPLINE entity: insufficient control points', {
                count: controlPoints.length,
                entity,
            });
        }
        return null;
    }

    const degree = entity.degreeOfSplineCurve ?? 3;

    // 유효하지 않은 차수 검증
    if (degree < 1 || !Number.isInteger(degree)) {
        if (import.meta.env?.DEV) {
            console.warn('Invalid SPLINE entity: invalid degree', {
                degree,
                entity,
            });
        }
        return null;
    }

    // 플래그에서 닫힘 여부 확인 (bit 0)
    const closed = ((entity.flag ?? 0) & 1) === 1;

    return {
        controlPoints,
        degree,
        knots: entity.knotValues,
        weights: entity.weights,
        closed,
        layer: entity.layer,
    };
}
