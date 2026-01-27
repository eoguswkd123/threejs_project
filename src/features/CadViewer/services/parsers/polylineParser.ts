/**
 * POLYLINE/LWPOLYLINE Entity Parser
 */

import type { ParsedPolyline } from '@/types/cad';

import { toPoint3DArray } from './utils';

import type { DXFLibEntity } from '../../types';

/**
 * POLYLINE/LWPOLYLINE 엔티티 파싱
 * @param entity DXF 라이브러리 엔티티
 * @returns 파싱된 POLYLINE 또는 유효하지 않으면 null
 */
export function parsePolyline(entity: DXFLibEntity): ParsedPolyline | null {
    const vertices = toPoint3DArray(entity.vertices);

    if (vertices.length < 2) {
        return null;
    }

    return {
        vertices,
        closed: entity.shape ?? false,
        layer: entity.layer,
    };
}
