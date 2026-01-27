/**
 * Cad Viewer - Type Definitions
 * DXF Viewer Feature 전용 타입 정의
 */

import type {
    HatchFillMode,
    CadShadingMode,
    ExtrudeOptions,
} from '@/types/cad';

// ============================================================
// 공유 CAD 타입 (re-export for convenience)
// ============================================================
export type {
    BoundingBox,
    LayerInfo,
    ParsedArc,
    ParsedCADData,
    ParsedCircle,
    ParsedHatch,
    ParsedLine,
    ParsedPolyline,
} from '@/types/cad';

// ============================================================
// DXF 라이브러리 타입
// ============================================================
export type {
    DXFLibEntity,
    DXFLibHatchBoundary,
    DXFLibLayer,
} from './dxfEntity/library';

// ============================================================
// DXF Worker 메시지 타입 (외부 공개 API)
// ============================================================
export type {
    WorkerErrorCode,
    WorkerErrorPayload,
    WorkerProgressPayload,
    WorkerRequest,
    WorkerResponse,
    WorkerSuccessPayload,
} from './dxfWorkerMsg';

// ============================================================
// Feature 내부용 타입 (외부 공개 API 아님)
// ============================================================

/** Cad Viewer 설정 */
export interface CadViewerConfig {
    /** 그리드 표시 여부 */
    showGrid: boolean;
    /** 자동 회전 여부 */
    autoRotate: boolean;
    /** 회전 속도 */
    rotateSpeed: number;
    /** 배경색 */
    backgroundColor: string;
    /** 자동 카메라 조정 */
    autoFitCamera: boolean;
    /** 렌더링 모드 (outline/solid/pattern) */
    renderMode: HatchFillMode;
    /** 3D 돌출 모드 활성화 (Phase 2.1.6) */
    enable3DExtrude: boolean;
    /** 3D 돌출 옵션 (Phase 2.1.6) */
    extrudeOptions: ExtrudeOptions;
    /** 3D 쉐이딩 모드 (Phase 2.1.7) */
    shadingMode: CadShadingMode;
}

/** 파일 업로드 에러 */
export interface UploadError {
    code:
        | 'INVALID_TYPE'
        | 'FILE_TOO_LARGE'
        | 'PARSE_ERROR'
        | 'EMPTY_FILE'
        | 'WORKER_ERROR'
        | 'TIMEOUT'
        | 'INVALID_DXF_FORMAT'
        | 'FILE_READ_ERROR';
    message: string;
}
