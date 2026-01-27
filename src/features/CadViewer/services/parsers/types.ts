/**
 * Entity Parser Types
 * 파싱 결과 타입 정의
 */

import type {
    ParsedArc,
    ParsedCircle,
    ParsedDimension,
    ParsedEllipse,
    ParsedHatch,
    ParsedLine,
    ParsedMText,
    ParsedPolyline,
    ParsedSpline,
    ParsedText,
} from '@/types/cad';

/**
 * 엔티티 배열에서 특정 타입 추출 및 파싱 결과
 */
export interface ParsedEntities {
    lines: ParsedLine[];
    circles: ParsedCircle[];
    arcs: ParsedArc[];
    polylines: ParsedPolyline[];
    hatches: ParsedHatch[];
    // Phase 2.1.4: 추가 엔티티
    texts: ParsedText[];
    mtexts: ParsedMText[];
    ellipses: ParsedEllipse[];
    splines: ParsedSpline[];
    dimensions: ParsedDimension[];
}
