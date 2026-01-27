/**
 * ModelMesh - Type Definitions
 *
 * glTF/glb 3D 모델 렌더링 컴포넌트 타입 정의
 *
 * @module components/ModelMesh/types
 */

import type { CadShadingMode, HologramSettings } from '@/types/cad';

// 공통 타입 re-export (하위 호환성 유지)
export type { HologramSettings } from '@/types/cad';

// ============================================================
// ModelMesh Props
// ============================================================

/**
 * ModelMesh 컴포넌트 Props
 *
 * WorkerMesh + HologramMesh 통합
 */
export interface ModelMeshProps {
    /** 모델 파일 URL (glTF/glb) */
    url: string;

    /** 쉐이딩 모드 (기본값: 'smooth') */
    shadingMode?: CadShadingMode;

    /** 홀로그램 설정 (shadingMode='hologram'일 때 필수) */
    hologramSettings?: HologramSettings;

    /** 모델 중앙 정렬 (기본값: true) */
    center?: boolean;

    /** 추가 스케일 배율 (기본값: 1) */
    scale?: number;

    /** 자동 스케일 정규화 (기본값: true) */
    normalizeScale?: boolean;

    /** 정규화 목표 크기 (기본값: 2) */
    targetSize?: number;

    /** 자동 회전 (기본값: false) */
    autoRotate?: boolean;

    /** 회전 속도 (기본값: 0.5) */
    rotateSpeed?: number;
}
