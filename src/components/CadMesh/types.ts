/**
 * CadMesh - Shared Types
 *
 * 개별 메시 컴포넌트에서 공유하는 타입 정의
 *
 * @see {@link WireframeMesh} - LINE/CIRCLE/ARC/POLYLINE 렌더링
 * @see {@link HatchMesh} - HATCH 렌더링
 * @see {@link TextMesh} - TEXT/MTEXT 렌더링
 * @see {@link CurveMesh} - ELLIPSE/SPLINE 렌더링
 * @see {@link DimensionMesh} - DIMENSION 렌더링
 */

import type { HatchFillMode, LayerInfo, ParsedCADData } from '@/types/cad';

import type * as THREE from 'three';

/**
 * CadMesh 공통 Props
 */
export interface CadMeshBaseProps {
    /** 파싱된 CAD 데이터 */
    data: ParsedCADData;
    /** 중심 정렬 여부 */
    center?: boolean;
    /** 레이어 정보 (가시성 및 색상용) - undefined면 단일 색상 */
    layers: Map<string, LayerInfo> | undefined;
    /** 데이터 중심점 (전체 데이터 기준) */
    dataCenter: THREE.Vector3;
}

/**
 * 레이어별 LineSegments 메시 데이터
 */
export interface LayerMeshData {
    layerName: string;
    geometry: THREE.BufferGeometry;
    material: THREE.LineBasicMaterial;
    visible: boolean;
}

/**
 * HATCH 채우기 메시 데이터
 */
export interface HatchMeshData {
    key: string;
    geometry: THREE.ShapeGeometry;
    material: THREE.MeshBasicMaterial;
    zPosition: number;
    visible: boolean;
}

/**
 * TEXT/MTEXT 렌더링 데이터
 */
export interface TextRenderData {
    key: string;
    content: string;
    position: [number, number, number];
    rotation: number;
    fontSize: number;
    color: string;
    anchorX: 'left' | 'center' | 'right';
    anchorY: 'top' | 'middle' | 'bottom';
    maxWidth: number | undefined;
    visible: boolean;
}

/**
 * DIMENSION 렌더링 데이터
 */
export interface DimensionRenderData {
    key: string;
    lineGeometry: THREE.BufferGeometry;
    lineMaterial: THREE.LineBasicMaterial;
    text: TextRenderData;
    visible: boolean;
}

/**
 * HatchMesh 전용 Props
 */
export interface HatchMeshProps extends CadMeshBaseProps {
    /** 렌더링 모드 */
    renderMode: HatchFillMode;
}
