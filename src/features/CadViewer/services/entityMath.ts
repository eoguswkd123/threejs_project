/**
 * CadViewer Services - Utility Functions
 * Worker에서 사용하는 순수 함수들
 */

import type { ParsedArc, Point3D } from '@/types/cad';

import { DEFAULT_LAYER_COLOR, DXF_COLOR_MAP } from '../constants';

/** ACI 색상을 HEX로 변환 */
export function aciToHex(aciColor: number | undefined): string {
    if (aciColor === undefined) {
        return DEFAULT_LAYER_COLOR;
    }
    return DXF_COLOR_MAP[aciColor] ?? DEFAULT_LAYER_COLOR;
}

/** 각도가 호 범위 내에 있는지 확인 */
export function isAngleInArc(
    angle: number,
    startAngle: number,
    endAngle: number
): boolean {
    // 각도 정규화 (0-360)
    const normalize = (a: number) => ((a % 360) + 360) % 360;
    const normAngle = normalize(angle);
    const normStart = normalize(startAngle);
    const normEnd = normalize(endAngle);

    if (normStart <= normEnd) {
        return normAngle >= normStart && normAngle <= normEnd;
    } else {
        // 호가 0°를 지나는 경우
        return normAngle >= normStart || normAngle <= normEnd;
    }
}

/** ARC의 실제 바운딩박스 계산 (startAngle/endAngle 고려) */
export function getArcBounds(arc: ParsedArc): { min: Point3D; max: Point3D } {
    const { center, radius, startAngle, endAngle } = arc;

    // 각도를 라디안으로 변환 (DXF는 도 단위)
    const startRad = (startAngle * Math.PI) / 180;
    const endRad = (endAngle * Math.PI) / 180;

    // 시작점과 끝점
    const points: { x: number; y: number }[] = [
        {
            x: center.x + radius * Math.cos(startRad),
            y: center.y + radius * Math.sin(startRad),
        },
        {
            x: center.x + radius * Math.cos(endRad),
            y: center.y + radius * Math.sin(endRad),
        },
    ];

    // 0°, 90°, 180°, 270° 교차점 확인
    const cardinalAngles = [0, 90, 180, 270];
    for (const angle of cardinalAngles) {
        if (isAngleInArc(angle, startAngle, endAngle)) {
            const rad = (angle * Math.PI) / 180;
            points.push({
                x: center.x + radius * Math.cos(rad),
                y: center.y + radius * Math.sin(rad),
            });
        }
    }

    // 최소/최대 계산
    let minX = Infinity,
        minY = Infinity;
    let maxX = -Infinity,
        maxY = -Infinity;

    for (const p of points) {
        minX = Math.min(minX, p.x);
        minY = Math.min(minY, p.y);
        maxX = Math.max(maxX, p.x);
        maxY = Math.max(maxY, p.y);
    }

    return {
        min: { x: minX, y: minY, z: center.z },
        max: { x: maxX, y: maxY, z: center.z },
    };
}
