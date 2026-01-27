/**
 * CadMesh Test Helpers
 * 테스트용 헬퍼 함수 및 Mock 데이터
 */

import * as THREE from 'three';

import { DEFAULT_BOUNDS } from '@/constants/cad';
import type {
    ParsedCADData,
    ParsedLine,
    ParsedCircle,
    ParsedArc,
    ParsedPolyline,
    ParsedEllipse,
    ParsedSpline,
    ParsedText,
    ParsedMText,
    ParsedDimension,
    ParsedHatch,
    LayerInfo,
} from '@/types/cad';

/**
 * 빈 ParsedCADData 생성
 */
export function createEmptyCADData(): ParsedCADData {
    return {
        lines: [],
        circles: [],
        arcs: [],
        polylines: [],
        hatches: [],
        texts: [],
        mtexts: [],
        ellipses: [],
        splines: [],
        dimensions: [],
        bounds: DEFAULT_BOUNDS,
        metadata: {
            fileName: 'test.dxf',
            fileSize: 100,
            entityCount: 0,
            parseTime: 10,
        },
        layers: {},
    };
}

/**
 * 테스트용 LINE 엔티티 생성
 */
export function createTestLine(
    startX: number,
    startY: number,
    endX: number,
    endY: number,
    layer = '0'
): ParsedLine {
    return {
        start: { x: startX, y: startY, z: 0 },
        end: { x: endX, y: endY, z: 0 },
        layer,
    };
}

/**
 * 테스트용 CIRCLE 엔티티 생성
 */
export function createTestCircle(
    centerX: number,
    centerY: number,
    radius: number,
    layer = '0'
): ParsedCircle {
    return {
        center: { x: centerX, y: centerY, z: 0 },
        radius,
        layer,
    };
}

/**
 * 테스트용 ARC 엔티티 생성
 */
export function createTestArc(
    centerX: number,
    centerY: number,
    radius: number,
    startAngle: number,
    endAngle: number,
    layer = '0'
): ParsedArc {
    return {
        center: { x: centerX, y: centerY, z: 0 },
        radius,
        startAngle,
        endAngle,
        layer,
    };
}

/**
 * 테스트용 POLYLINE 엔티티 생성
 */
export function createTestPolyline(
    vertices: Array<{ x: number; y: number }>,
    closed = false,
    layer = '0'
): ParsedPolyline {
    return {
        vertices: vertices.map((v) => ({ ...v, z: 0 })),
        closed,
        layer,
    };
}

/**
 * 테스트용 ELLIPSE 엔티티 생성
 */
export function createTestEllipse(
    centerX: number,
    centerY: number,
    majorRadius: number,
    minorAxisRatio = 0.5,
    layer = '0'
): ParsedEllipse {
    return {
        center: { x: centerX, y: centerY, z: 0 },
        majorAxisEnd: { x: majorRadius, y: 0, z: 0 },
        minorAxisRatio,
        startParam: 0,
        endParam: Math.PI * 2,
        layer,
    };
}

/**
 * 테스트용 SPLINE 엔티티 생성
 */
export function createTestSpline(
    controlPoints: Array<{ x: number; y: number }>,
    layer = '0'
): ParsedSpline {
    return {
        controlPoints: controlPoints.map((p) => ({ ...p, z: 0 })),
        degree: 3,
        knots: undefined,
        weights: undefined,
        closed: false,
        layer,
    };
}

/**
 * 테스트용 TEXT 엔티티 생성
 */
export function createTestText(
    content: string,
    x: number,
    y: number,
    height = 10,
    layer = '0'
): ParsedText {
    return {
        content,
        position: { x, y, z: 0 },
        height,
        rotation: 0,
        alignment: 'left',
        styleName: undefined,
        layer,
    };
}

/**
 * 테스트용 MTEXT 엔티티 생성
 */
export function createTestMText(
    content: string,
    x: number,
    y: number,
    height = 10,
    layer = '0'
): ParsedMText {
    return {
        content,
        rawContent: content,
        position: { x, y, z: 0 },
        height,
        rotation: 0,
        attachment: 'top-left',
        width: 100,
        layer,
    };
}

/**
 * 테스트용 DIMENSION 엔티티 생성
 */
export function createTestDimension(
    p1: { x: number; y: number },
    p2: { x: number; y: number },
    layer = '0'
): ParsedDimension {
    return {
        dimensionType: 'linear',
        defPoint1: { ...p1, z: 0 },
        defPoint2: { ...p2, z: 0 },
        defPoint3: undefined,
        defPoint4: undefined,
        textMidPoint: {
            x: (p1.x + p2.x) / 2,
            y: (p1.y + p2.y) / 2 + 10,
            z: 0,
        },
        text: '',
        rotation: 0,
        styleName: undefined,
        layer,
    };
}

/**
 * 테스트용 HATCH 엔티티 생성
 */
export function createTestHatch(
    x: number,
    y: number,
    width: number,
    height: number,
    isSolid = true,
    layer = '0'
): ParsedHatch {
    return {
        boundaries: [
            {
                type: 'polyline',
                vertices: [
                    { x, y, z: 0 },
                    { x: x + width, y, z: 0 },
                    { x: x + width, y: y + height, z: 0 },
                    { x, y: y + height, z: 0 },
                ],
                closed: true,
            },
        ],
        patternName: isSolid ? 'SOLID' : 'ANSI31',
        isSolid,
        patternScale: 1,
        patternAngle: 0,
        color: undefined,
        layer,
    };
}

/**
 * 테스트용 레이어 Map 생성
 */
export function createTestLayers(
    layerConfigs: Array<{
        name: string;
        color: string;
        visible?: boolean;
    }>
): Map<string, LayerInfo> {
    const layers = new Map<string, LayerInfo>();
    for (const config of layerConfigs) {
        layers.set(config.name, {
            name: config.name,
            color: config.color,
            visible: config.visible ?? true,
            entityCount: 0,
        });
    }
    return layers;
}

/**
 * 기본 dataCenter (원점)
 */
export const defaultDataCenter = new THREE.Vector3(0, 0, 0);

/**
 * 테스트용 CAD 데이터 생성 (모든 엔티티 타입 포함)
 */
export function createFullCADData(): ParsedCADData {
    const data = createEmptyCADData();

    data.lines = [
        createTestLine(0, 0, 100, 0),
        createTestLine(100, 0, 100, 100),
    ];
    data.circles = [createTestCircle(50, 50, 20)];
    data.arcs = [createTestArc(50, 50, 30, 0, 90)];
    data.polylines = [
        createTestPolyline([
            { x: 0, y: 0 },
            { x: 50, y: 0 },
            { x: 50, y: 50 },
        ]),
    ];
    data.ellipses = [createTestEllipse(50, 50, 40, 20)];
    data.splines = [
        createTestSpline([
            { x: 0, y: 0 },
            { x: 25, y: 50 },
            { x: 75, y: 50 },
            { x: 100, y: 0 },
        ]),
    ];
    data.texts = [createTestText('Hello', 10, 10)];
    data.mtexts = [createTestMText('World', 50, 50)];
    data.dimensions = [createTestDimension({ x: 0, y: 0 }, { x: 100, y: 0 })];
    data.hatches = [createTestHatch(10, 10, 30, 30)];

    data.metadata.entityCount =
        data.lines.length +
        data.circles.length +
        data.arcs.length +
        data.polylines.length +
        data.ellipses.length +
        data.splines.length +
        data.texts.length +
        data.mtexts.length +
        data.dimensions.length +
        data.hatches.length;

    return data;
}
