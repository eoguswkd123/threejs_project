/**
 * Batch Entity Parser
 * 모든 엔티티를 한 번의 순회로 파싱
 */

import { parseArc } from './arcParser';
import { parseCircle } from './circleParser';
import { parseDimension } from './dimensionParser';
import { parseEllipse } from './ellipseParser';
import { parseHatch } from './hatchEntityParser';
import { parseLine } from './lineParser';
import { parseMText } from './mtextParser';
import { parsePolyline } from './polylineParser';
import { parseSpline } from './splineParser';
import { parseText } from './textParser';

import type { ParsedEntities } from './types';
import type { DXFLibEntity } from '../../types';

/**
 * 모든 엔티티를 한 번의 순회로 파싱
 * 성능 최적화: O(n) 단일 순회
 *
 * @param entities DXF 라이브러리 엔티티 배열
 * @param onEntity 각 엔티티 처리 후 콜백 (옵션, 진행률 표시용)
 * @returns 파싱된 엔티티 객체
 */
export function parseAllEntities(
    entities: DXFLibEntity[],
    onEntity?: (index: number, total: number) => void
): ParsedEntities {
    const result: ParsedEntities = {
        lines: [],
        circles: [],
        arcs: [],
        polylines: [],
        hatches: [],
        texts: [],
        mtexts: [],
        ellipses: [],
        splines: [],
        dimensions: [],
    };

    const total = entities.length;

    for (let i = 0; i < total; i++) {
        const entity = entities[i];
        if (!entity) continue;

        // 진행률 콜백
        if (onEntity) {
            onEntity(i, total);
        }

        switch (entity.type) {
            case 'LINE': {
                const line = parseLine(entity);
                if (line) result.lines.push(line);
                break;
            }
            case 'CIRCLE': {
                const circle = parseCircle(entity);
                if (circle) result.circles.push(circle);
                break;
            }
            case 'ARC': {
                const arc = parseArc(entity);
                if (arc) result.arcs.push(arc);
                break;
            }
            case 'LWPOLYLINE':
            case 'POLYLINE': {
                const polyline = parsePolyline(entity);
                if (polyline) result.polylines.push(polyline);
                break;
            }
            case 'HATCH': {
                const hatch = parseHatch(entity);
                if (hatch) result.hatches.push(hatch);
                break;
            }
            case 'TEXT': {
                const text = parseText(entity);
                if (text) result.texts.push(text);
                break;
            }
            case 'MTEXT': {
                const mtext = parseMText(entity);
                if (mtext) result.mtexts.push(mtext);
                break;
            }
            case 'ELLIPSE': {
                const ellipse = parseEllipse(entity);
                if (ellipse) result.ellipses.push(ellipse);
                break;
            }
            case 'SPLINE': {
                const spline = parseSpline(entity);
                if (spline) result.splines.push(spline);
                break;
            }
            case 'DIMENSION': {
                const dimension = parseDimension(entity);
                if (dimension) result.dimensions.push(dimension);
                break;
            }
            // 지원하지 않는 엔티티 타입은 무시
        }
    }

    return result;
}

/**
 * 파싱된 엔티티의 총 개수 계산
 */
export function getTotalEntityCount(entities: ParsedEntities): number {
    return (
        entities.lines.length +
        entities.circles.length +
        entities.arcs.length +
        entities.polylines.length +
        entities.hatches.length +
        entities.texts.length +
        entities.mtexts.length +
        entities.ellipses.length +
        entities.splines.length +
        entities.dimensions.length
    );
}
