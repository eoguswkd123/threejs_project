/**
 * Entity Parser Utilities
 * 공통 변환 함수들
 */

import type { Point3D } from '@/types/cad';

import type { DXFLibPoint } from '../../types/dxfEntity/library';

/**
 * DXFLibPoint를 Point3D로 변환
 * 누락된 좌표는 0으로 기본값 설정
 */
export function toPoint3D(point: DXFLibPoint | undefined): Point3D {
    return {
        x: point?.x ?? 0,
        y: point?.y ?? 0,
        z: point?.z ?? 0,
    };
}

/**
 * DXFLibPoint 배열을 Point3D 배열로 변환
 */
export function toPoint3DArray(points: DXFLibPoint[] | undefined): Point3D[] {
    return (points ?? []).map(toPoint3D);
}
