/**
 * WorkerViewer - Type Definitions
 * glTF/glb 파일 렌더링 타입 정의
 */

import type { CadShadingMode } from '@/types/cad';
import type { CommonErrorCode } from '@/utils';

/** 모델 정보 (Mock/Real API 공통) */
export interface ModelInfo {
    /** 모델 ID */
    id: string;
    /** 모델 이름 */
    name: string;
    /** 모델 파일 URL */
    url: string;
    /** 모델 설명 */
    description?: string;
    /** 파일 크기 (bytes) */
    fileSize?: number;
    /** 파일 형식 */
    format?: 'gltf' | 'glb';
}

/** Worker Viewer 설정 */
export interface WorkerViewerConfig {
    /** 그리드 표시 여부 */
    showGrid: boolean;
    /** 자동 회전 */
    autoRotate: boolean;
    /** 회전 속도 */
    rotateSpeed: number;
    /** 쉐이딩 모드 */
    shadingMode: CadShadingMode;
    /** 배경색 */
    backgroundColor: string;
    /** 카메라 자동 조정 */
    autoFitCamera: boolean;
}

/** 로딩 상태 */
export type LoadingStatus = 'idle' | 'loading' | 'success' | 'error';

/** 로드 에러 */
export interface LoadError {
    code: CommonErrorCode;
    message: string;
}

/** 모델 메타데이터 (glTF에서 추출) */
export interface ModelMetadata {
    /** 모델 이름 */
    name: string;
    /** 정점 수 */
    vertexCount: number;
    /** 삼각형 수 */
    triangleCount: number;
    /** 머티리얼 수 */
    materialCount: number;
    /** 애니메이션 수 */
    animationCount: number;
}
