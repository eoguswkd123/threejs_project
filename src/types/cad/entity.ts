/**
 * CAD Types - Entity Definitions
 *
 * CAD 데이터 모델 타입 정의
 * utils/cad, components/CadMesh 등에서 공유
 */

// ========================================
// Base Types
// ========================================

/** 3D 좌표 */
export interface Point3D {
    x: number;
    y: number;
    z: number;
}

/** 바운딩 박스 */
export interface BoundingBox {
    min: Point3D;
    max: Point3D;
}

/** 레이어 정보 */
export interface LayerInfo {
    /** 레이어 이름 */
    name: string;
    /** 레이어 색상 (hex) */
    color: string;
    /** 가시성 여부 */
    visible: boolean;
    /** 해당 레이어의 엔티티 수 */
    entityCount: number;
}

/** CAD 파일 메타데이터 */
export interface CADMetadata {
    /** 파일명 */
    fileName: string;
    /** 파일 크기 (bytes) */
    fileSize: number;
    /** 엔티티 수 */
    entityCount: number;
    /** 파싱 시간 (ms) */
    parseTime: number;
}

// ========================================
// Parsed Entity Types
// ========================================

/** 파싱된 LINE 엔티티 */
export interface ParsedLine {
    /** 시작점 */
    start: Point3D;
    /** 끝점 */
    end: Point3D;
    /** 레이어 이름 */
    layer: string | undefined;
}

/** 파싱된 CIRCLE 엔티티 */
export interface ParsedCircle {
    /** 중심점 */
    center: Point3D;
    /** 반지름 */
    radius: number;
    /** 레이어 이름 */
    layer: string | undefined;
}

/** 파싱된 ARC 엔티티 */
export interface ParsedArc {
    /** 중심점 */
    center: Point3D;
    /** 반지름 */
    radius: number;
    /** 시작 각도 (degree) */
    startAngle: number;
    /** 끝 각도 (degree) */
    endAngle: number;
    /** 레이어 이름 */
    layer: string | undefined;
}

/** 파싱된 POLYLINE 엔티티 */
export interface ParsedPolyline {
    /** 정점 배열 */
    vertices: Point3D[];
    /** 닫힌 폴리라인 여부 */
    closed: boolean;
    /** 레이어 이름 */
    layer: string | undefined;
}

// ========================================
// HATCH Types
// ========================================

/** HATCH 경계 경로 타입 */
export type HatchBoundaryType = 'polyline' | 'circle' | 'arc' | 'ellipse';

/** HATCH Polyline 경계 경로 */
export interface HatchBoundaryPolyline {
    /** 경계 타입 */
    type: 'polyline';
    /** 정점 배열 */
    vertices: Point3D[];
    /** 닫힘 여부 */
    closed: boolean;
}

/** HATCH Circle 경계 경로 */
export interface HatchBoundaryCircle {
    /** 경계 타입 */
    type: 'circle';
    /** 중심점 */
    center: Point3D;
    /** 반지름 */
    radius: number;
}

/** HATCH Arc 경계 경로 */
export interface HatchBoundaryArc {
    /** 경계 타입 */
    type: 'arc';
    /** 중심점 */
    center: Point3D;
    /** 반지름 */
    radius: number;
    /** 시작 각도 (degree) */
    startAngle: number;
    /** 끝 각도 (degree) */
    endAngle: number;
}

/** HATCH Ellipse 경계 경로 */
export interface HatchBoundaryEllipse {
    /** 경계 타입 */
    type: 'ellipse';
    /** 중심점 */
    center: Point3D;
    /** 장축 끝점 (중심 기준 상대 좌표) */
    majorAxisEndPoint: Point3D;
    /** 단축/장축 비율 */
    axisRatio: number;
    /** 시작 각도 (radian) */
    startAngle: number;
    /** 끝 각도 (radian) */
    endAngle: number;
}

/** HATCH 경계 경로 (Discriminated Union) */
export type HatchBoundaryPath =
    | HatchBoundaryPolyline
    | HatchBoundaryCircle
    | HatchBoundaryArc
    | HatchBoundaryEllipse;

/** 파싱된 HATCH 엔티티 */
export interface ParsedHatch {
    /** 경계 경로 배열 (첫 번째는 외곽, 나머지는 홀) */
    boundaries: HatchBoundaryPath[];
    /** 패턴 이름 (SOLID, ANSI31, ACAD_ISO02W100 등) */
    patternName: string;
    /** 솔리드 채우기 여부 */
    isSolid: boolean;
    /** 패턴 스케일 */
    patternScale: number;
    /** 패턴 각도 (degree) */
    patternAngle: number;
    /** 색상 인덱스 (ACI) */
    color: number | undefined;
    /** 레이어 이름 */
    layer: string | undefined;
}

/** HATCH 채움 모드 */
export type HatchFillMode = 'outline' | 'solid' | 'pattern';

// ========================================
// Text Types
// ========================================

/** TEXT 수평 정렬 */
export type TextHorizontalAlignment = 'left' | 'center' | 'right';

/** 파싱된 TEXT 엔티티 */
export interface ParsedText {
    /** 텍스트 내용 */
    content: string;
    /** 삽입점 */
    position: Point3D;
    /** 텍스트 높이 */
    height: number;
    /** 회전 각도 (degree) */
    rotation: number;
    /** 수평 정렬 */
    alignment: TextHorizontalAlignment;
    /** 텍스트 스타일 이름 */
    styleName: string | undefined;
    /** 레이어 이름 */
    layer: string | undefined;
}

/** MTEXT Attachment Point (1-9) */
export type MTextAttachment =
    | 'top-left'
    | 'top-center'
    | 'top-right'
    | 'middle-left'
    | 'middle-center'
    | 'middle-right'
    | 'bottom-left'
    | 'bottom-center'
    | 'bottom-right';

/** 파싱된 MTEXT 엔티티 */
export interface ParsedMText {
    /** 텍스트 내용 (서식 코드 파싱됨) */
    content: string;
    /** 원본 텍스트 (서식 코드 포함) */
    rawContent: string;
    /** 삽입점 */
    position: Point3D;
    /** 텍스트 높이 */
    height: number;
    /** 참조 사각형 너비 (텍스트 래핑용) */
    width: number;
    /** 회전 각도 (degree) */
    rotation: number;
    /** 기준점 (Attachment Point) */
    attachment: MTextAttachment;
    /** 레이어 이름 */
    layer: string | undefined;
}

// ========================================
// Curve Types
// ========================================

/** 파싱된 ELLIPSE 엔티티 */
export interface ParsedEllipse {
    /** 중심점 */
    center: Point3D;
    /** 장축 끝점 (중심 기준 상대 좌표) */
    majorAxisEnd: Point3D;
    /** 단축/장축 비율 (0 < ratio <= 1) */
    minorAxisRatio: number;
    /** 시작 파라미터 (radian, 0=전체 타원 시작) */
    startParam: number;
    /** 끝 파라미터 (radian, 2π=전체 타원 끝) */
    endParam: number;
    /** 레이어 이름 */
    layer: string | undefined;
}

/** 파싱된 SPLINE 엔티티 */
export interface ParsedSpline {
    /** 제어점 배열 */
    controlPoints: Point3D[];
    /** 스플라인 차수 (보통 3 = cubic) */
    degree: number;
    /** 노트 벡터 (옵션) */
    knots: number[] | undefined;
    /** 가중치 (NURBS용, 옵션) */
    weights: number[] | undefined;
    /** 닫힌 스플라인 여부 */
    closed: boolean;
    /** 레이어 이름 */
    layer: string | undefined;
}

// ========================================
// Dimension Types
// ========================================

/** DIMENSION 유형 */
export type DimensionType =
    | 'linear'
    | 'aligned'
    | 'angular'
    | 'diameter'
    | 'radius'
    | 'angular3'
    | 'ordinate';

/** 파싱된 DIMENSION 엔티티 */
export interface ParsedDimension {
    /** 치수 유형 */
    dimensionType: DimensionType;
    /** 정의점 1 (치수선 시작) */
    defPoint1: Point3D;
    /** 정의점 2 (치수선 끝) */
    defPoint2: Point3D;
    /** 정의점 3 (각도 치수용 정점) */
    defPoint3: Point3D | undefined;
    /** 정의점 4 (각도 치수용 보조점) */
    defPoint4: Point3D | undefined;
    /** 텍스트 중간점 */
    textMidPoint: Point3D;
    /** 치수 텍스트 (빈 문자열이면 자동 계산) */
    text: string;
    /** 회전 각도 (degree, linear only) */
    rotation: number;
    /** 치수 스타일 이름 */
    styleName: string | undefined;
    /** 레이어 이름 */
    layer: string | undefined;
}

// ========================================
// Aggregate Type
// ========================================

/** 파싱된 CAD 데이터 */
export interface ParsedCADData {
    /** LINE 엔티티 배열 */
    lines: ParsedLine[];
    /** CIRCLE 엔티티 배열 */
    circles: ParsedCircle[];
    /** ARC 엔티티 배열 */
    arcs: ParsedArc[];
    /** POLYLINE 엔티티 배열 */
    polylines: ParsedPolyline[];
    /** HATCH 엔티티 배열 */
    hatches: ParsedHatch[];
    /** TEXT 엔티티 배열 */
    texts: ParsedText[];
    /** MTEXT 엔티티 배열 */
    mtexts: ParsedMText[];
    /** ELLIPSE 엔티티 배열 */
    ellipses: ParsedEllipse[];
    /** SPLINE 엔티티 배열 */
    splines: ParsedSpline[];
    /** DIMENSION 엔티티 배열 */
    dimensions: ParsedDimension[];
    /** 전체 도면의 바운딩 박스 */
    bounds: BoundingBox;
    /** 파일 메타데이터 */
    metadata: CADMetadata;
    /** 레이어 정보 (JSON 직렬화 호환) */
    layers: Record<string, LayerInfo>;
}
