/**
 * DXF Types - Library Output Definitions
 * dxf-parser npm 패키지가 반환하는 타입 정의
 *
 * 모든 필드가 옵셔널인 이유: 라이브러리 출력이 불안정할 수 있음
 * 파싱 후 정제된 타입은 ./parsed.ts 참조
 */

/** DXF 지원 엔티티 타입 */
export type DXFEntityType =
    | 'LINE'
    | 'CIRCLE'
    | 'ARC'
    | 'LWPOLYLINE'
    | 'POLYLINE'
    | 'HATCH'
    | 'POINT'
    | 'TEXT'
    | 'MTEXT'
    | 'SPLINE'
    | 'ELLIPSE'
    | 'INSERT'
    | 'DIMENSION'
    | 'SOLID'
    | '3DFACE'
    | (string & {}); // 알 수 없는 타입 허용 (확장성)

/** dxf-parser 라이브러리 포인트 */
export interface DXFLibPoint {
    x?: number;
    y?: number;
    z?: number;
}

/** dxf-parser 라이브러리 HATCH 경계 정보 */
export interface DXFLibHatchBoundary {
    type?: number;
    vertices?: DXFLibPoint[];
    center?: DXFLibPoint;
    radius?: number;
    startAngle?: number;
    endAngle?: number;
}

/** dxf-parser 라이브러리 엔티티 */
export interface DXFLibEntity {
    type: DXFEntityType;
    layer?: string;
    vertices?: DXFLibPoint[];
    start?: DXFLibPoint;
    end?: DXFLibPoint;
    center?: DXFLibPoint;
    radius?: number;
    startAngle?: number;
    endAngle?: number;
    shape?: boolean;
    /** HATCH 엔티티용 필드 */
    boundary?: DXFLibHatchBoundary[];
    patternName?: string;
    solidFill?: number;
    patternScale?: number;
    patternAngle?: number;
    colorIndex?: number;

    // ========================================
    // Phase 2.1.4: 추가 엔티티 필드
    // ========================================

    // TEXT/MTEXT 공통 필드
    /** TEXT/MTEXT 내용 (그룹 코드 1) */
    text?: string;
    /** TEXT/MTEXT 높이 (그룹 코드 40) */
    textHeight?: number;
    /** TEXT 회전 (그룹 코드 50) */
    textRotation?: number;
    /** TEXT 수평 정렬 (그룹 코드 72: 0=left, 1=center, 2=right) */
    horizontalJustification?: number;
    /** TEXT 스타일 (그룹 코드 7) */
    textStyleName?: string;

    // MTEXT 전용 필드
    /** MTEXT 참조 사각형 너비 (그룹 코드 41) */
    referenceRectangleWidth?: number;
    /** MTEXT attachment point (그룹 코드 71: 1-9) */
    attachmentPoint?: number;
    /** MTEXT drawing direction (그룹 코드 72) */
    drawingDirection?: number;

    // ELLIPSE 필드
    /** ELLIPSE 장축 끝점 (그룹 코드 11/21/31) */
    majorAxisEndPoint?: DXFLibPoint;
    /** ELLIPSE 단축/장축 비율 (그룹 코드 40) */
    axisRatio?: number;
    /** ELLIPSE 시작 파라미터 (그룹 코드 41) */
    startParameter?: number;
    /** ELLIPSE 끝 파라미터 (그룹 코드 42) */
    endParameter?: number;

    // SPLINE 필드
    /** SPLINE 차수 (그룹 코드 71) */
    degreeOfSplineCurve?: number;
    /** SPLINE 제어점 배열 */
    controlPoints?: DXFLibPoint[];
    /** SPLINE 노트 벡터 (그룹 코드 40) */
    knotValues?: number[];
    /** SPLINE 가중치 (그룹 코드 41) */
    weights?: number[];
    /** SPLINE/POLYLINE 플래그 (그룹 코드 70) */
    flag?: number;

    // DIMENSION 필드
    /** DIMENSION 타입 (그룹 코드 70: 0-6) */
    dimensionType?: number;
    /** 정의점 2 (그룹 코드 13/23/33) */
    defPoint2?: DXFLibPoint;
    /** 정의점 3 (그룹 코드 14/24/34) */
    defPoint3?: DXFLibPoint;
    /** 정의점 4 (그룹 코드 15/25/35) */
    defPoint4?: DXFLibPoint;
    /** 텍스트 중간점 (그룹 코드 11/21/31) */
    textMidPoint?: DXFLibPoint;
    /** 치수 텍스트 오버라이드 (그룹 코드 1) */
    dimensionText?: string;
    /** DIMENSION 스타일 (그룹 코드 3) */
    dimensionStyleName?: string;
}

/** dxf-parser 라이브러리 레이어 */
export interface DXFLibLayer {
    name?: string;
    color?: number;
    colorIndex?: number;
}
