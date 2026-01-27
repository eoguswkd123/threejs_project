/**
 * DXF Worker Message Types
 *
 * DXF Parser Worker 통신 메시지 타입
 */

import type {
    BoundingBox,
    CADMetadata,
    LayerInfo,
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

/** Worker 요청 메시지 */
export interface WorkerRequest {
    type: 'parse';
    payload: {
        text: string;
        fileName: string;
        fileSize: number;
    };
}

/** Worker 응답 메시지 */
export interface WorkerResponse {
    type: 'success' | 'error' | 'progress';
    payload: WorkerSuccessPayload | WorkerErrorPayload | WorkerProgressPayload;
}

/** 파싱 성공 페이로드 */
export interface WorkerSuccessPayload {
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
    bounds: BoundingBox;
    /** 레이어 정보 (JSON 직렬화 호환) */
    layers: Record<string, LayerInfo>;
    metadata: CADMetadata;
}

/** Worker 에러 코드 */
export type WorkerErrorCode =
    | 'EMPTY_FILE'
    | 'INVALID_FORMAT'
    | 'PARSE_ERROR'
    | 'UNKNOWN_ERROR';

/** 파싱 에러 페이로드 */
export interface WorkerErrorPayload {
    code: WorkerErrorCode;
    message: string;
}

/** 진행률 페이로드 */
export interface WorkerProgressPayload {
    stage: string;
    percent: number;
}
