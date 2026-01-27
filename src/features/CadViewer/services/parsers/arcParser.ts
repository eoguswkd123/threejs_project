/**
 * ARC Entity Parser
 */

import type { ParsedArc } from '@/types/cad';

import { toPoint3D } from './utils';

import type { DXFLibEntity } from '../../types';

/**
 * ARC 엔티티 파싱
 * @param entity DXF 라이브러리 엔티티
 * @returns 파싱된 ARC 또는 유효하지 않으면 null
 */
export function parseArc(entity: DXFLibEntity): ParsedArc | null {
    const radius = entity.radius ?? 1;

    // 유효하지 않은 radius 검증 (음수, 0, NaN, Infinity)
    if (radius <= 0 || !isFinite(radius)) {
        if (import.meta.env?.DEV) {
            console.warn('Invalid ARC entity: invalid radius', {
                radius,
                entity,
            });
        }
        return null;
    }

    return {
        center: toPoint3D(entity.center),
        radius,
        startAngle: entity.startAngle ?? 0,
        endAngle: entity.endAngle ?? 360,
        layer: entity.layer,
    };
}
