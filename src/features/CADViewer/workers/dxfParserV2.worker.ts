/**
 * CAD Viewer - DXF Parser Web Worker
 * 대용량 DXF 파일을 메인 스레드 블로킹 없이 파싱
 * @version 2 - 레이어 색상 수정
 */

import DxfParser from 'dxf-parser';
import type {
    ParsedLine,
    ParsedCircle,
    ParsedArc,
    ParsedPolyline,
    LayerInfo,
    Point3D,
    BoundingBox,
    DXFRawEntity,
    DXFRawPoint,
    DXFRawLayer,
} from '../types';

// Worker 메시지 타입
export interface WorkerRequest {
    type: 'parse';
    payload: {
        text: string;
        fileName: string;
        fileSize: number;
    };
}

export interface WorkerResponse {
    type: 'success' | 'error' | 'progress';
    payload: WorkerSuccessPayload | WorkerErrorPayload | WorkerProgressPayload;
}

export interface WorkerSuccessPayload {
    lines: ParsedLine[];
    circles: ParsedCircle[];
    arcs: ParsedArc[];
    polylines: ParsedPolyline[];
    bounds: BoundingBox;
    layers: [string, LayerInfo][];
    metadata: {
        fileName: string;
        fileSize: number;
        entityCount: number;
        parseTime: number;
    };
}

export interface WorkerErrorPayload {
    code: string;
    message: string;
}

export interface WorkerProgressPayload {
    stage: string;
    percent: number;
}

// DXF 색상 매핑 (constants에서 복사 - worker는 별도 번들)
const DXF_COLOR_MAP: Record<number, string> = {
    0: '#ffffff',
    1: '#ff0000',
    2: '#ffff00',
    3: '#00ff00',
    4: '#00ffff',
    5: '#0000ff',
    6: '#ff00ff',
    7: '#ffffff',
    8: '#808080',
    9: '#c0c0c0',
    256: '#ffffff',
};

const DEFAULT_LAYER_COLOR = '#00ff00';

function aciToHex(aciColor: number | undefined): string {
    if (aciColor === undefined || aciColor === null) {
        return DEFAULT_LAYER_COLOR;
    }
    return DXF_COLOR_MAP[aciColor] ?? DEFAULT_LAYER_COLOR;
}

// 바운딩 박스 계산 (모든 엔티티 타입 포함)
function calculateBounds(
    lines: ParsedLine[],
    circles?: ParsedCircle[],
    arcs?: ParsedArc[],
    polylines?: ParsedPolyline[]
): BoundingBox {
    let minX = Infinity,
        minY = Infinity,
        minZ = Infinity;
    let maxX = -Infinity,
        maxY = -Infinity,
        maxZ = -Infinity;

    // LINE 엔티티
    for (const line of lines) {
        minX = Math.min(minX, line.start.x, line.end.x);
        minY = Math.min(minY, line.start.y, line.end.y);
        minZ = Math.min(minZ, line.start.z, line.end.z);
        maxX = Math.max(maxX, line.start.x, line.end.x);
        maxY = Math.max(maxY, line.start.y, line.end.y);
        maxZ = Math.max(maxZ, line.start.z, line.end.z);
    }

    // CIRCLE 엔티티
    if (circles) {
        for (const circle of circles) {
            minX = Math.min(minX, circle.center.x - circle.radius);
            minY = Math.min(minY, circle.center.y - circle.radius);
            minZ = Math.min(minZ, circle.center.z);
            maxX = Math.max(maxX, circle.center.x + circle.radius);
            maxY = Math.max(maxY, circle.center.y + circle.radius);
            maxZ = Math.max(maxZ, circle.center.z);
        }
    }

    // ARC 엔티티
    if (arcs) {
        for (const arc of arcs) {
            minX = Math.min(minX, arc.center.x - arc.radius);
            minY = Math.min(minY, arc.center.y - arc.radius);
            minZ = Math.min(minZ, arc.center.z);
            maxX = Math.max(maxX, arc.center.x + arc.radius);
            maxY = Math.max(maxY, arc.center.y + arc.radius);
            maxZ = Math.max(maxZ, arc.center.z);
        }
    }

    // POLYLINE 엔티티
    if (polylines) {
        for (const polyline of polylines) {
            for (const vertex of polyline.vertices) {
                minX = Math.min(minX, vertex.x);
                minY = Math.min(minY, vertex.y);
                minZ = Math.min(minZ, vertex.z);
                maxX = Math.max(maxX, vertex.x);
                maxY = Math.max(maxY, vertex.y);
                maxZ = Math.max(maxZ, vertex.z);
            }
        }
    }

    // 엔티티가 없으면 기본 바운딩 박스 반환
    if (minX === Infinity) {
        return {
            min: { x: 0, y: 0, z: 0 },
            max: { x: 100, y: 100, z: 0 },
        };
    }

    return {
        min: { x: minX, y: minY, z: minZ },
        max: { x: maxX, y: maxY, z: maxZ },
    };
}

// 진행률 전송
function sendProgress(stage: string, percent: number): void {
    self.postMessage({
        type: 'progress',
        payload: { stage, percent },
    } as WorkerResponse);
}

// 메인 파싱 함수
function parseDXF(text: string, fileName: string, fileSize: number): void {
    const startTime = performance.now();

    try {
        sendProgress('DXF 파싱 중...', 10);

        const parser = new DxfParser();
        const dxf = parser.parseSync(text);

        if (!dxf || !dxf.entities) {
            throw new Error('Invalid DXF structure');
        }

        sendProgress('엔티티 추출 중...', 30);

        // LINE 추출
        const lines: ParsedLine[] = (dxf.entities as DXFRawEntity[])
            .filter((entity) => entity.type === 'LINE')
            .map((entity) => {
                const start: Point3D = {
                    x: entity.vertices?.[0]?.x ?? entity.start?.x ?? 0,
                    y: entity.vertices?.[0]?.y ?? entity.start?.y ?? 0,
                    z: entity.vertices?.[0]?.z ?? entity.start?.z ?? 0,
                };
                const end: Point3D = {
                    x: entity.vertices?.[1]?.x ?? entity.end?.x ?? 0,
                    y: entity.vertices?.[1]?.y ?? entity.end?.y ?? 0,
                    z: entity.vertices?.[1]?.z ?? entity.end?.z ?? 0,
                };
                return { start, end, layer: entity.layer };
            });

        sendProgress('CIRCLE/ARC 추출 중...', 50);

        // CIRCLE 추출
        const circles: ParsedCircle[] = (dxf.entities as DXFRawEntity[])
            .filter((entity) => entity.type === 'CIRCLE')
            .map((entity) => ({
                center: {
                    x: entity.center?.x ?? 0,
                    y: entity.center?.y ?? 0,
                    z: entity.center?.z ?? 0,
                },
                radius: entity.radius ?? 1,
                layer: entity.layer,
            }));

        // ARC 추출
        const arcs: ParsedArc[] = (dxf.entities as DXFRawEntity[])
            .filter((entity) => entity.type === 'ARC')
            .map((entity) => ({
                center: {
                    x: entity.center?.x ?? 0,
                    y: entity.center?.y ?? 0,
                    z: entity.center?.z ?? 0,
                },
                radius: entity.radius ?? 1,
                startAngle: entity.startAngle ?? 0,
                endAngle: entity.endAngle ?? 360,
                layer: entity.layer,
            }));

        sendProgress('POLYLINE 추출 중...', 70);

        // POLYLINE 추출
        const polylines: ParsedPolyline[] = (dxf.entities as DXFRawEntity[])
            .filter(
                (entity) =>
                    entity.type === 'LWPOLYLINE' || entity.type === 'POLYLINE'
            )
            .map((entity) => {
                const vertices: Point3D[] = (entity.vertices ?? []).map(
                    (v: DXFRawPoint) => ({
                        x: v.x ?? 0,
                        y: v.y ?? 0,
                        z: v.z ?? 0,
                    })
                );
                return {
                    vertices,
                    closed: entity.shape ?? false,
                    layer: entity.layer,
                };
            })
            .filter((p: ParsedPolyline) => p.vertices.length >= 2);

        sendProgress('레이어 처리 중...', 85);

        // 레이어 정보 구축
        const layers = new Map<string, LayerInfo>();
        const dxfLayers = dxf.tables?.layer?.layers ?? {};

        for (const [layerName, layerData] of Object.entries(dxfLayers)) {
            const layer = layerData as DXFRawLayer;
            // dxf-parser는 colorIndex(ACI)와 color(10진수 RGB)를 별도로 반환
            // colorIndex를 사용하거나, color를 직접 hex로 변환
            let hexColor: string;
            if (typeof layer.color === 'number') {
                // color는 10진수 RGB (예: 16777215 = 0xFFFFFF = white)
                hexColor = '#' + layer.color.toString(16).padStart(6, '0');
            } else {
                hexColor = aciToHex(layer.colorIndex);
            }
            layers.set(layerName, {
                name: layerName,
                color: hexColor,
                visible: true,
                entityCount: 0,
            });
        }

        // 엔티티 카운트
        const allLayerNames = [
            ...lines.map((e) => e.layer),
            ...circles.map((e) => e.layer),
            ...arcs.map((e) => e.layer),
            ...polylines.map((e) => e.layer),
        ];

        for (const layerName of allLayerNames) {
            const name = layerName ?? '0';
            if (!layers.has(name)) {
                layers.set(name, {
                    name,
                    color: DEFAULT_LAYER_COLOR,
                    visible: true,
                    entityCount: 0,
                });
            }
            const layer = layers.get(name)!;
            layer.entityCount++;
        }

        const totalEntityCount =
            lines.length + circles.length + arcs.length + polylines.length;

        if (totalEntityCount === 0) {
            throw new Error('EMPTY_FILE');
        }

        sendProgress('완료!', 100);

        const endTime = performance.now();

        // Map을 배열로 변환 (직렬화 가능)
        const layersArray: [string, LayerInfo][] = Array.from(layers.entries());

        self.postMessage({
            type: 'success',
            payload: {
                lines,
                circles,
                arcs,
                polylines,
                bounds: calculateBounds(lines, circles, arcs, polylines),
                layers: layersArray,
                metadata: {
                    fileName,
                    fileSize,
                    entityCount: totalEntityCount,
                    parseTime: Math.round(endTime - startTime),
                },
            },
        } as WorkerResponse);
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        const code = message === 'EMPTY_FILE' ? 'EMPTY_FILE' : 'PARSE_ERROR';

        self.postMessage({
            type: 'error',
            payload: { code, message },
        } as WorkerResponse);
    }
}

// 메시지 핸들러
self.onmessage = (event: MessageEvent<WorkerRequest>) => {
    const { type, payload } = event.data;

    if (type === 'parse') {
        parseDXF(payload.text, payload.fileName, payload.fileSize);
    }
};

export {};
