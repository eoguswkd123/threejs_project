/**
 * TEXT Entity Parser
 */

import type { ParsedText, TextHorizontalAlignment } from '@/types/cad';

import { toPoint3D } from './utils';

import type { DXFLibEntity } from '../../types';

/**
 * TEXT 수평 정렬 매핑
 * DXF 그룹 코드 72: 0=left, 1=center, 2=right
 */
function mapTextAlignment(code: number | undefined): TextHorizontalAlignment {
    switch (code) {
        case 1:
            return 'center';
        case 2:
            return 'right';
        default:
            return 'left';
    }
}

/**
 * TEXT 엔티티 파싱
 * @param entity DXF 라이브러리 엔티티
 * @returns 파싱된 TEXT 또는 유효하지 않으면 null
 */
export function parseText(entity: DXFLibEntity): ParsedText | null {
    const content = entity.text;

    // 빈 텍스트 검증
    if (!content || content.trim() === '') {
        if (import.meta.env?.DEV) {
            console.warn('Invalid TEXT entity: empty content', entity);
        }
        return null;
    }

    const height = entity.textHeight ?? 1;

    // 유효하지 않은 height 검증 (음수, 0, NaN, Infinity)
    if (height <= 0 || !isFinite(height)) {
        if (import.meta.env?.DEV) {
            console.warn('Invalid TEXT entity: invalid height', {
                height,
                entity,
            });
        }
        return null;
    }

    return {
        content,
        position: toPoint3D(entity.center ?? entity.start),
        height,
        rotation: entity.textRotation ?? 0,
        alignment: mapTextAlignment(entity.horizontalJustification),
        styleName: entity.textStyleName,
        layer: entity.layer,
    };
}
