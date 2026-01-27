/**
 * HATCH Entity Parser
 * entityParsers.ts에서 사용하는 HATCH 파싱 로직
 * (services/hatchParser.ts는 raw DXF 텍스트 파싱용)
 */

import type { HatchBoundaryPath, ParsedHatch } from '@/types/cad';

import { toPoint3D, toPoint3DArray } from './utils';

import type { DXFLibEntity } from '../../types';
import type { DXFLibHatchBoundary } from '../../types/dxfEntity/library';

/**
 * HATCH 경계 경로 파싱
 * @param boundary DXF 라이브러리 HATCH 경계
 * @returns 파싱된 경계 경로 또는 유효하지 않으면 null
 */
export function parseHatchBoundary(
    boundary: DXFLibHatchBoundary
): HatchBoundaryPath | null {
    // 폴리라인 경계
    if (boundary.vertices && boundary.vertices.length >= 3) {
        return {
            type: 'polyline',
            vertices: toPoint3DArray(boundary.vertices),
            closed: true,
        };
    }

    // 원형 경계 (startAngle이 없으면 완전한 원)
    if (
        boundary.center &&
        boundary.radius !== undefined &&
        boundary.startAngle === undefined
    ) {
        return {
            type: 'circle',
            center: toPoint3D(boundary.center),
            radius: boundary.radius,
        };
    }

    // 호형 경계
    if (
        boundary.center &&
        boundary.radius !== undefined &&
        boundary.startAngle !== undefined
    ) {
        return {
            type: 'arc',
            center: toPoint3D(boundary.center),
            radius: boundary.radius,
            startAngle: boundary.startAngle,
            endAngle: boundary.endAngle ?? 360,
        };
    }

    return null;
}

/**
 * HATCH 엔티티 파싱
 * @param entity DXF 라이브러리 엔티티
 * @returns 파싱된 HATCH 또는 유효하지 않으면 null
 */
export function parseHatch(entity: DXFLibEntity): ParsedHatch | null {
    const boundaries: HatchBoundaryPath[] = [];

    if (entity.boundary && Array.isArray(entity.boundary)) {
        for (const b of entity.boundary as DXFLibHatchBoundary[]) {
            const parsed = parseHatchBoundary(b);
            if (parsed) {
                boundaries.push(parsed);
            }
        }
    }

    if (boundaries.length === 0) {
        return null;
    }

    const patternName = entity.patternName ?? 'SOLID';

    return {
        boundaries,
        patternName,
        isSolid:
            entity.solidFill === 1 || patternName.toUpperCase() === 'SOLID',
        patternScale: entity.patternScale ?? 1,
        patternAngle: entity.patternAngle ?? 0,
        color: entity.colorIndex,
        layer: entity.layer,
    };
}
