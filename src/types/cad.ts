/**
 * CAD 관련 타입 정의
 */

// ===== 기본 타입 =====
export type Vector2 = [number, number];
export type Vector3 = [number, number, number];
export type CADUnit = 'mm' | 'cm' | 'm' | 'inch' | 'ft';

// ===== 엔티티 타입 =====
export type EntityType =
    | 'LINE'
    | 'CIRCLE'
    | 'ARC'
    | 'POLYLINE'
    | 'LWPOLYLINE'
    | 'POINT'
    | 'TEXT'
    | 'MTEXT'
    | 'DIMENSION'
    | 'SPLINE'
    | 'ELLIPSE'
    | 'INSERT';

export interface BaseEntity {
    id: string;
    type: EntityType;
    layer: string;
    color?: number;
    lineWeight?: number;
    visible?: boolean;
}

export interface LineEntity extends BaseEntity {
    type: 'LINE';
    start: Vector3;
    end: Vector3;
}

export interface CircleEntity extends BaseEntity {
    type: 'CIRCLE';
    center: Vector3;
    radius: number;
}

export interface ArcEntity extends BaseEntity {
    type: 'ARC';
    center: Vector3;
    radius: number;
    startAngle: number;
    endAngle: number;
}

export interface PolylineVertex {
    position: Vector3;
    bulge?: number;
}

export interface PolylineEntity extends BaseEntity {
    type: 'POLYLINE' | 'LWPOLYLINE';
    vertices: PolylineVertex[];
    closed: boolean;
}

export interface PointEntity extends BaseEntity {
    type: 'POINT';
    position: Vector3;
}

export interface TextEntity extends BaseEntity {
    type: 'TEXT' | 'MTEXT';
    position: Vector3;
    text: string;
    height: number;
    rotation?: number;
}

export interface SplineEntity extends BaseEntity {
    type: 'SPLINE';
    controlPoints: Vector3[];
    degree: number;
    closed: boolean;
}

export interface EllipseEntity extends BaseEntity {
    type: 'ELLIPSE';
    center: Vector3;
    majorAxis: Vector3;
    minorAxisRatio: number;
    startAngle: number;
    endAngle: number;
}

export type CADEntity =
    | LineEntity
    | CircleEntity
    | ArcEntity
    | PolylineEntity
    | PointEntity
    | TextEntity
    | SplineEntity
    | EllipseEntity;

// ===== 레이어 =====
export interface CADLayer {
    name: string;
    color: number;
    visible: boolean;
    frozen: boolean;
    locked: boolean;
}

// ===== 바운딩 박스 =====
export interface BoundingBox {
    min: Vector3;
    max: Vector3;
}

// ===== CAD 데이터 =====
export interface CADData {
    entities: CADEntity[];
    layers: CADLayer[];
    bounds: BoundingBox;
    units: CADUnit;
    metadata?: CADMetadata;
}

export interface CADMetadata {
    filename?: string;
    fileSize?: number;
    createdAt?: string;
    modifiedAt?: string;
    author?: string;
    version?: string;
}

// ===== 파싱 관련 =====
export interface ParseOptions {
    precision?: number;
    layerFilter?: string[];
    scaleToUnit?: CADUnit;
    simplify?: boolean;
    maxEntities?: number;
}

export interface ParseError {
    code: string;
    message: string;
    line?: number;
    entity?: string;
}

export interface ParseResult {
    success: boolean;
    data?: CADData;
    errors?: ParseError[];
    warnings?: string[];
    parseTime: number;
}

// ===== 변환 관련 =====
export interface ConversionOptions {
    renderMode?: 'wireframe' | 'solid' | 'points';
    color?: number;
    lineWidth?: number;
    segmentsPerCircle?: number;
}

export interface ConversionResult {
    success: boolean;
    geometries: GeometryData[];
    materials: MaterialData[];
    bounds: BoundingBox;
    conversionTime: number;
    source: 'frontend' | 'backend';
}

export interface GeometryData {
    id: string;
    type: 'BufferGeometry' | 'LineGeometry';
    positions: Float32Array;
    indices?: Uint32Array;
    colors?: Float32Array;
    layer: string;
}

export interface MaterialData {
    id: string;
    type: 'LineBasicMaterial' | 'MeshBasicMaterial' | 'MeshStandardMaterial';
    color: number;
    opacity?: number;
    linewidth?: number;
}

// ===== 복잡도 분석 =====
export interface ComplexityScore {
    entityCount: number;
    layerCount: number;
    fileSize: number;
    score: number; // 0-100
    recommendation: 'frontend' | 'backend';
}

// ===== 파일 관련 =====
export interface CADFile {
    file: File;
    name: string;
    size: number;
    type: string;
    lastModified: number;
}

export type CADFileFormat = 'dxf' | 'dwg' | 'ifc' | 'step' | 'unknown';

export function detectFileFormat(filename: string): CADFileFormat {
    const ext = filename.toLowerCase().split('.').pop();
    switch (ext) {
        case 'dxf':
            return 'dxf';
        case 'dwg':
            return 'dwg';
        case 'ifc':
            return 'ifc';
        case 'step':
        case 'stp':
            return 'step';
        default:
            return 'unknown';
    }
}
