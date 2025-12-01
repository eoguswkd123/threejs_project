/**
 * CAD Viewer - Type Definitions
 * DXF 파일 파싱 및 3D 렌더링 타입 정의
 */

/** 3D 좌표 */
export interface Point3D {
    x: number;
    y: number;
    z: number;
}

/** 파싱된 LINE 엔티티 */
export interface ParsedLine {
    /** 시작점 */
    start: Point3D;
    /** 끝점 */
    end: Point3D;
    /** 레이어 이름 */
    layer?: string;
}

/** 파싱된 CIRCLE 엔티티 */
export interface ParsedCircle {
    /** 중심점 */
    center: Point3D;
    /** 반지름 */
    radius: number;
    /** 레이어 이름 */
    layer?: string;
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
    layer?: string;
}

/** 파싱된 POLYLINE 엔티티 */
export interface ParsedPolyline {
    /** 정점 배열 */
    vertices: Point3D[];
    /** 닫힌 폴리라인 여부 */
    closed: boolean;
    /** 레이어 이름 */
    layer?: string;
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
    /** 전체 도면의 바운딩 박스 */
    bounds: BoundingBox;
    /** 파일 메타데이터 */
    metadata: CADMetadata;
    /** 레이어 정보 맵 */
    layers: Map<string, LayerInfo>;
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

/** CAD Viewer 설정 */
export interface CADViewerConfig {
    /** 그리드 표시 여부 */
    showGrid: boolean;
    /** 와이어프레임 색상 */
    wireframeColor: string;
    /** 배경색 */
    backgroundColor: string;
    /** 자동 카메라 조정 */
    autoFitCamera: boolean;
}

/** 파일 업로드 상태 */
export type UploadStatus = 'idle' | 'loading' | 'success' | 'error';

/** 파일 업로드 에러 */
export interface UploadError {
    code: 'INVALID_TYPE' | 'FILE_TOO_LARGE' | 'PARSE_ERROR' | 'EMPTY_FILE';
    message: string;
}

/** 파일 유효성 검사 결과 */
export interface ValidationResult {
    valid: boolean;
    error?: UploadError;
}

/** DXF 파서 원본 포인트 (dxf-parser 라이브러리) */
export interface DXFRawPoint {
    x?: number;
    y?: number;
    z?: number;
}

/** DXF 파서 원본 엔티티 (dxf-parser 라이브러리) */
export interface DXFRawEntity {
    type: string;
    layer?: string;
    vertices?: DXFRawPoint[];
    start?: DXFRawPoint;
    end?: DXFRawPoint;
    center?: DXFRawPoint;
    radius?: number;
    startAngle?: number;
    endAngle?: number;
    shape?: boolean;
}

/** DXF 파서 원본 레이어 (dxf-parser 라이브러리) */
export interface DXFRawLayer {
    name?: string;
    color?: number;
    colorIndex?: number;
}
