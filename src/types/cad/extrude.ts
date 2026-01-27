/**
 * CAD Types - 3D Extrusion Definitions
 *
 * Phase 2.1.6: HATCH 3D Extrusion 관련 타입 정의
 */

import type { ParsedHatch } from './entity';
import type * as THREE from 'three';

// ========================================
// Extrude Options
// ========================================

/**
 * 3D 돌출 옵션
 *
 * @example
 * const options: ExtrudeOptions = {
 *   depth: 10,
 *   bevel: false,
 * };
 */
export interface ExtrudeOptions {
    /** 돌출 깊이 (0-100, 기본값: 10) */
    depth: number;
    /** 베벨 여부 (기본값: false) */
    bevel?: boolean;
    /** 베벨 크기 (기본값: 0.1) */
    bevelSize?: number;
    /** 베벨 세그먼트 수 (기본값: 1) */
    bevelSegments?: number;
}

/** 기본 돌출 옵션 */
export const DEFAULT_EXTRUDE_OPTIONS: ExtrudeOptions = {
    depth: 10,
    bevel: false,
    bevelSize: 0.1,
    bevelSegments: 1,
};

// ========================================
// 3D Geometry Data
// ========================================

/**
 * HATCH 3D 지오메트리 데이터
 *
 * 돌출된 HATCH의 렌더링 정보를 담는 인터페이스
 */
export interface Hatch3DGeometryData {
    /** 고유 키 (렌더링용) */
    key: string;
    /** THREE.js ExtrudeGeometry */
    geometry: THREE.ExtrudeGeometry;
    /** 레이어 이름 */
    layer: string;
    /** 레이어 색상 (hex) */
    color: string;
    /** 원본 HATCH 데이터 */
    originalHatch: ParsedHatch;
    /** 기준 Z 위치 */
    zPosition: number;
    /** 가시성 여부 */
    visible: boolean;
}

// ========================================
// Extrude Result
// ========================================

/**
 * 돌출 변환 결과
 */
export interface ExtrudeResult {
    /** 성공 여부 */
    success: boolean;
    /** 생성된 지오메트리 (성공 시) */
    geometry?: THREE.ExtrudeGeometry;
    /** 에러 메시지 (실패 시) */
    error?: string;
}

// ========================================
// LOD Configuration
// ========================================

/**
 * 3D LOD (Level of Detail) 설정
 *
 * 깊이에 따른 ExtrudeGeometry steps 값
 */
export interface Extrude3DLODConfig {
    /** 얇은 돌출 임계값 (< threshold → steps: 1) */
    thinThreshold: number;
    /** 중간 돌출 임계값 (< threshold → steps: 2) */
    mediumThreshold: number;
    /** 얇은 돌출 steps */
    thinSteps: number;
    /** 중간 돌출 steps */
    mediumSteps: number;
    /** 깊은 돌출 steps */
    deepSteps: number;
}

/** 기본 3D LOD 설정 */
export const DEFAULT_3D_LOD_CONFIG: Extrude3DLODConfig = {
    thinThreshold: 10,
    mediumThreshold: 50,
    thinSteps: 1,
    mediumSteps: 2,
    deepSteps: 4,
};

/**
 * 깊이에 따른 LOD steps 계산
 *
 * @param depth - 돌출 깊이
 * @param config - LOD 설정 (기본값 사용 가능)
 * @returns ExtrudeGeometry steps 값
 *
 * @example
 * getLOD3DSteps(5);  // → 1 (얇은 돌출)
 * getLOD3DSteps(30); // → 2 (중간 돌출)
 * getLOD3DSteps(80); // → 4 (깊은 돌출)
 */
export function getLOD3DSteps(
    depth: number,
    config: Extrude3DLODConfig = DEFAULT_3D_LOD_CONFIG
): number {
    if (depth < config.thinThreshold) return config.thinSteps;
    if (depth < config.mediumThreshold) return config.mediumSteps;
    return config.deepSteps;
}
