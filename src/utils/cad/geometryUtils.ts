/**
 * Geometry Utilities - 공통 지오메트리 변환 함수
 *
 * DRY 원칙: 중복 translate 로직 추상화
 *
 * @module utils/cad/geometryUtils
 */

import type * as THREE from 'three';

/**
 * 데이터 중심점 타입
 */
export interface DataCenter {
    x: number;
    y: number;
    z: number;
}

/**
 * Geometry를 데이터 중심으로 이동 (3D)
 *
 * 전달된 dataCenter의 반대 방향으로 geometry를 이동시켜
 * 원점 중심으로 정렬합니다.
 *
 * @param geometry - 변환할 BufferGeometry
 * @param dataCenter - 데이터 중심점 좌표
 * @param enabled - 활성화 여부 (기본값: true)
 * @returns 변환된 geometry (체이닝용)
 *
 * @example
 * const geom = cadDataToGeometry(data);
 * translateToCenter(geom, dataCenter, center);
 */
export function translateToCenter(
    geometry: THREE.BufferGeometry,
    dataCenter: DataCenter,
    enabled: boolean = true
): THREE.BufferGeometry {
    if (enabled) {
        geometry.translate(-dataCenter.x, -dataCenter.y, -dataCenter.z);
    }
    return geometry;
}

/**
 * Geometry를 데이터 중심으로 이동 (XY 평면만)
 *
 * Z축은 그대로 유지하고 X, Y만 중심으로 이동합니다.
 * 2D HATCH 솔리드 채우기 등에서 사용됩니다.
 *
 * @param geometry - 변환할 BufferGeometry
 * @param dataCenter - 데이터 중심점 좌표
 * @param enabled - 활성화 여부 (기본값: true)
 * @returns 변환된 geometry (체이닝용)
 *
 * @example
 * const geom = hatchesToSolidGeometries([hatch], segments)[0].geometry;
 * translateToCenterXY(geom, dataCenter, center);
 */
export function translateToCenterXY(
    geometry: THREE.BufferGeometry,
    dataCenter: DataCenter,
    enabled: boolean = true
): THREE.BufferGeometry {
    if (enabled) {
        geometry.translate(-dataCenter.x, -dataCenter.y, 0);
    }
    return geometry;
}

/**
 * Z 위치 오프셋 계산
 *
 * 중심 정렬이 활성화된 경우 z 위치에서 dataCenter.z를 차감합니다.
 *
 * @param zPosition - 원래 Z 위치
 * @param dataCenter - 데이터 중심점 좌표
 * @param centered - 중심 정렬 활성화 여부
 * @returns 조정된 Z 위치
 *
 * @example
 * const adjustedZ = calculateCenteredZPosition(geomData.zPosition, dataCenter, center);
 */
export function calculateCenteredZPosition(
    zPosition: number,
    dataCenter: DataCenter,
    centered: boolean
): number {
    return centered ? zPosition - dataCenter.z : zPosition;
}
