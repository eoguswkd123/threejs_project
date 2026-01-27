/**
 * DIMENSION Entity Parser
 */

import type { DimensionType, ParsedDimension } from '@/types/cad';

import { toPoint3D } from './utils';

import type { DXFLibEntity } from '../../types';

/**
 * DIMENSION 타입 매핑
 * DXF 그룹 코드 70: 0-6 (하위 비트만 사용)
 */
function mapDimensionType(code: number | undefined): DimensionType {
    const dimType = (code ?? 0) & 0x0f; // 하위 4비트만 사용
    switch (dimType) {
        case 0:
            return 'linear';
        case 1:
            return 'aligned';
        case 2:
            return 'angular';
        case 3:
            return 'diameter';
        case 4:
            return 'radius';
        case 5:
            return 'angular3';
        case 6:
            return 'ordinate';
        default:
            return 'linear';
    }
}

/**
 * DIMENSION 엔티티 파싱
 * @param entity DXF 라이브러리 엔티티
 * @returns 파싱된 DIMENSION 또는 유효하지 않으면 null
 */
export function parseDimension(entity: DXFLibEntity): ParsedDimension | null {
    // 정의점 1은 center 또는 start에서 가져옴
    const defPoint1 = entity.center ?? entity.start;
    const defPoint2 = entity.defPoint2;

    // 최소 2개의 정의점 필요
    if (!defPoint1 || !defPoint2) {
        if (import.meta.env?.DEV) {
            console.warn(
                'Invalid DIMENSION entity: missing definition points',
                entity
            );
        }
        return null;
    }

    return {
        dimensionType: mapDimensionType(entity.dimensionType),
        defPoint1: toPoint3D(defPoint1),
        defPoint2: toPoint3D(defPoint2),
        defPoint3: entity.defPoint3 ? toPoint3D(entity.defPoint3) : undefined,
        defPoint4: entity.defPoint4 ? toPoint3D(entity.defPoint4) : undefined,
        textMidPoint: toPoint3D(entity.textMidPoint),
        text: entity.dimensionText ?? '',
        rotation: entity.textRotation ?? 0,
        styleName: entity.dimensionStyleName,
        layer: entity.layer,
    };
}
