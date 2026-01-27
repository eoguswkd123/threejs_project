/**
 * LINE Entity Parser
 */

import type { ParsedLine, Point3D } from '@/types/cad';

import type { DXFLibEntity } from '../../types';

/**
 * LINE 엔티티 파싱
 * @param entity DXF 라이브러리 엔티티
 * @returns 파싱된 LINE 또는 유효하지 않으면 null
 */
export function parseLine(entity: DXFLibEntity): ParsedLine | null {
    const hasVertices = entity.vertices && entity.vertices.length >= 2;
    const hasStartEnd = entity.start && entity.end;

    if (!hasVertices && !hasStartEnd) {
        if (import.meta.env?.DEV) {
            console.warn('Invalid LINE entity: missing coordinates', entity);
        }
        return null;
    }

    const start: Point3D = {
        x: entity.vertices?.[0]?.x ?? entity.start?.x ?? 0,
        y: entity.vertices?.[0]?.y ?? entity.start?.y ?? 0,
        z: entity.vertices?.[0]?.z ?? entity.start?.z ?? 0,
    };
    const end: Point3D = {
        x: entity.vertices?.[1]?.x ?? entity.end?.x ?? 0,
        y: entity.vertices?.[1]?.y ?? entity.end?.y ?? 0,
        z: entity.vertices?.[1]?.z ?? entity.end?.z ?? 0,
    };

    return { start, end, layer: entity.layer };
}
