/**
 * DXF 파서 내부 타입 정의
 */

// DXF 섹션 타입
export type DXFSectionType =
    | 'HEADER'
    | 'CLASSES'
    | 'TABLES'
    | 'BLOCKS'
    | 'ENTITIES'
    | 'OBJECTS';

// DXF 그룹 코드 (key-value 쌍)
export interface DXFGroupCode {
    code: number;
    value: string | number;
}

// DXF 헤더 변수
export interface DXFHeader {
    $ACADVER?: string;
    $INSUNITS?: number;
    $EXTMIN?: [number, number, number];
    $EXTMAX?: [number, number, number];
    [key: string]: unknown;
}

// DXF 레이어 테이블 엔트리
export interface DXFLayerEntry {
    name: string;
    color: number;
    lineType: string;
    flags: number;
    frozen: boolean;
    locked: boolean;
}

// DXF 엔티티 기본
export interface DXFEntityBase {
    type: string;
    handle?: string;
    layer: string;
    color?: number;
    lineWeight?: number;
}

// DXF LINE 엔티티
export interface DXFLine extends DXFEntityBase {
    type: 'LINE';
    startX: number;
    startY: number;
    startZ: number;
    endX: number;
    endY: number;
    endZ: number;
}

// DXF CIRCLE 엔티티
export interface DXFCircle extends DXFEntityBase {
    type: 'CIRCLE';
    centerX: number;
    centerY: number;
    centerZ: number;
    radius: number;
}

// DXF ARC 엔티티
export interface DXFArc extends DXFEntityBase {
    type: 'ARC';
    centerX: number;
    centerY: number;
    centerZ: number;
    radius: number;
    startAngle: number;
    endAngle: number;
}

// DXF LWPOLYLINE 엔티티
export interface DXFPolylineVertex {
    x: number;
    y: number;
    z?: number;
    bulge?: number;
}

export interface DXFPolyline extends DXFEntityBase {
    type: 'LWPOLYLINE' | 'POLYLINE';
    vertices: DXFPolylineVertex[];
    closed: boolean;
}

// DXF POINT 엔티티
export interface DXFPoint extends DXFEntityBase {
    type: 'POINT';
    x: number;
    y: number;
    z: number;
}

// DXF TEXT 엔티티
export interface DXFText extends DXFEntityBase {
    type: 'TEXT' | 'MTEXT';
    x: number;
    y: number;
    z: number;
    text: string;
    height: number;
    rotation?: number;
}

// DXF SPLINE 엔티티
export interface DXFSpline extends DXFEntityBase {
    type: 'SPLINE';
    degree: number;
    closed: boolean;
    controlPoints: { x: number; y: number; z: number }[];
    fitPoints?: { x: number; y: number; z: number }[];
    knots?: number[];
}

// DXF ELLIPSE 엔티티
export interface DXFEllipse extends DXFEntityBase {
    type: 'ELLIPSE';
    centerX: number;
    centerY: number;
    centerZ: number;
    majorAxisX: number;
    majorAxisY: number;
    majorAxisZ: number;
    minorAxisRatio: number;
    startParam: number;
    endParam: number;
}

// 모든 DXF 엔티티 유니온 타입
export type DXFEntity =
    | DXFLine
    | DXFCircle
    | DXFArc
    | DXFPolyline
    | DXFPoint
    | DXFText
    | DXFSpline
    | DXFEllipse;

// 파싱된 DXF 문서
export interface DXFDocument {
    header: DXFHeader;
    layers: DXFLayerEntry[];
    entities: DXFEntity[];
}

// 그룹 코드 매핑
export const GROUP_CODES = {
    // 공통
    ENTITY_TYPE: 0,
    LAYER_NAME: 8,
    COLOR: 62,
    LINE_TYPE: 6,
    HANDLE: 5,

    // 좌표
    X: 10,
    Y: 20,
    Z: 30,
    X2: 11,
    Y2: 21,
    Z2: 31,

    // 원/호
    RADIUS: 40,
    START_ANGLE: 50,
    END_ANGLE: 51,

    // 텍스트
    TEXT_VALUE: 1,
    TEXT_HEIGHT: 40,
    ROTATION: 50,

    // 폴리라인
    VERTEX_COUNT: 90,
    BULGE: 42,
    CLOSED_FLAG: 70,

    // 스플라인
    DEGREE: 71,
    KNOT_COUNT: 72,
    CONTROL_POINT_COUNT: 73,

    // 타원
    MAJOR_AXIS_X: 11,
    MAJOR_AXIS_Y: 21,
    MAJOR_AXIS_Z: 31,
    MINOR_AXIS_RATIO: 40,
    START_PARAM: 41,
    END_PARAM: 42,
} as const;
