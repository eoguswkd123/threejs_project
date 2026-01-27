/**
 * MTEXT Entity Parser
 */

import type { MTextAttachment, ParsedMText } from '@/types/cad';

import { toPoint3D } from './utils';

import type { DXFLibEntity } from '../../types';

/**
 * MTEXT Attachment Point 매핑
 * DXF 그룹 코드 71: 1-9 (3x3 grid)
 */
function mapMTextAttachment(code: number | undefined): MTextAttachment {
    switch (code) {
        case 1:
            return 'top-left';
        case 2:
            return 'top-center';
        case 3:
            return 'top-right';
        case 4:
            return 'middle-left';
        case 5:
            return 'middle-center';
        case 6:
            return 'middle-right';
        case 7:
            return 'bottom-left';
        case 8:
            return 'bottom-center';
        case 9:
            return 'bottom-right';
        default:
            return 'top-left';
    }
}

/**
 * MTEXT 서식 코드 파싱
 * DXF 특수 문자 및 서식 코드를 일반 텍스트로 변환
 */
export function parseMTextFormatting(rawContent: string): string {
    let content = rawContent;

    // DXF 특수 문자 변환
    content = content.replace(/%%c/gi, 'Ø'); // 지름 기호
    content = content.replace(/%%d/gi, '°'); // 도 기호
    content = content.replace(/%%p/gi, '±'); // 플러스마이너스 기호
    content = content.replace(/%%u/gi, ''); // 밑줄 시작 (제거)
    content = content.replace(/%%o/gi, ''); // 윗줄 시작 (제거)
    content = content.replace(/%%%/g, '%'); // 퍼센트 기호

    // MTEXT 서식 코드 제거/변환
    content = content.replace(/\\P/g, '\n'); // 줄바꿈
    content = content.replace(/\\~/g, ' '); // 비분리 공백
    content = content.replace(/\\\\/g, '\\'); // 백슬래시
    content = content.replace(/\\{/g, '{'); // 중괄호
    content = content.replace(/\\}/g, '}'); // 중괄호

    // 서식 코드 제거 (폰트, 색상, 높이 등)
    content = content.replace(/\\[fFcCHhWwQqAaTtLlOo][^;]*;/g, '');

    // 스택/분수 표현 단순화: \S1/2; → 1/2
    content = content.replace(/\\S([^;]*);/g, '$1');

    // 중괄호 그룹 제거 (서식 그룹)
    content = content.replace(/[{}]/g, '');

    return content.trim();
}

/**
 * MTEXT 엔티티 파싱
 * @param entity DXF 라이브러리 엔티티
 * @returns 파싱된 MTEXT 또는 유효하지 않으면 null
 */
export function parseMText(entity: DXFLibEntity): ParsedMText | null {
    const rawContent = entity.text;

    // 빈 텍스트 검증
    if (!rawContent || rawContent.trim() === '') {
        if (import.meta.env?.DEV) {
            console.warn('Invalid MTEXT entity: empty content', entity);
        }
        return null;
    }

    const height = entity.textHeight ?? 1;

    // 유효하지 않은 height 검증
    if (height <= 0 || !isFinite(height)) {
        if (import.meta.env?.DEV) {
            console.warn('Invalid MTEXT entity: invalid height', {
                height,
                entity,
            });
        }
        return null;
    }

    return {
        content: parseMTextFormatting(rawContent),
        rawContent,
        position: toPoint3D(entity.center ?? entity.start),
        height,
        width: entity.referenceRectangleWidth ?? 0,
        rotation: entity.textRotation ?? 0,
        attachment: mapMTextAttachment(entity.attachmentPoint),
        layer: entity.layer,
    };
}
