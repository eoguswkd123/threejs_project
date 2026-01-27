/**
 * CAD Viewer - DXF Parser Web Worker
 * 대용량 DXF 파일을 메인 스레드 블로킹 없이 파싱
 *
 * @version 4 - 공유 파서 모듈 사용 (DRY 원칙)
 * @see {@link entityParsers} - 공유 엔티티 파서
 */

import DxfParser from 'dxf-parser';

import type {
    BoundingBox,
    LayerInfo,
    ParsedArc,
    ParsedCircle,
    ParsedHatch,
    ParsedLine,
    ParsedPolyline,
    ParsedText,
    ParsedMText,
    ParsedEllipse,
    ParsedSpline,
    ParsedDimension,
} from '@/types/cad';

import { DEFAULT_BOUNDS, DEFAULT_LAYER_COLOR } from '../constants';

import { aciToHex, getArcBounds } from './entityMath';
import { parseHatchesFromDxf } from './hatchParser';
import {
    parseArc,
    parseCircle,
    parseLine,
    parsePolyline,
    parseText,
    parseMText,
    parseEllipse,
    parseSpline,
    parseDimension,
    getTotalEntityCount,
} from './parsers';

import type {
    DXFLibEntity,
    DXFLibLayer,
    WorkerErrorCode,
    WorkerRequest,
    WorkerResponse,
} from '../types';

/**
 * 레이어명 정제 (XSS 방지)
 * HTML 특수문자 이스케이프, 제어문자 제거 및 길이 제한
 */
function sanitizeLayerName(name: string | undefined): string {
    if (!name) return '0';

    // 제어문자 및 zero-width 문자 제거
    const cleaned = name.replace(
        // eslint-disable-next-line no-control-regex
        /[\u0000-\u001F\u007F\u200B-\u200D\uFEFF]/g,
        ''
    );

    // HTML 특수문자 이스케이프 (백틱 포함)
    const escaped = cleaned
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/`/g, '&#x60;');

    // 길이 제한 (최대 255자)
    return escaped.slice(0, 255);
}

/** 레이어 카운트 증가 */
function countLayer(
    layers: Map<string, LayerInfo>,
    layerName: string | undefined
): void {
    const name = sanitizeLayerName(layerName);
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

// NOTE: 엔티티 파싱 함수들은 entityParsers.ts에서 import
// parseLine, parseCircle, parseArc, parsePolyline, parseHatch

// ============================================================
// 바운딩 박스 계산
// ============================================================

/** 바운딩 박스 계산 (모든 엔티티 타입 포함) */
function calculateBounds(
    lines: ParsedLine[],
    circles: ParsedCircle[],
    arcs: ParsedArc[],
    polylines: ParsedPolyline[],
    hatches: ParsedHatch[]
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
    for (const circle of circles) {
        minX = Math.min(minX, circle.center.x - circle.radius);
        minY = Math.min(minY, circle.center.y - circle.radius);
        minZ = Math.min(minZ, circle.center.z);
        maxX = Math.max(maxX, circle.center.x + circle.radius);
        maxY = Math.max(maxY, circle.center.y + circle.radius);
        maxZ = Math.max(maxZ, circle.center.z);
    }

    // ARC 엔티티 (정확한 바운딩박스 계산)
    for (const arc of arcs) {
        const arcBounds = getArcBounds(arc);
        minX = Math.min(minX, arcBounds.min.x);
        minY = Math.min(minY, arcBounds.min.y);
        minZ = Math.min(minZ, arcBounds.min.z);
        maxX = Math.max(maxX, arcBounds.max.x);
        maxY = Math.max(maxY, arcBounds.max.y);
        maxZ = Math.max(maxZ, arcBounds.max.z);
    }

    // POLYLINE 엔티티
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

    // HATCH 엔티티
    for (const hatch of hatches) {
        for (const boundary of hatch.boundaries) {
            if (boundary.type === 'polyline') {
                for (const vertex of boundary.vertices) {
                    minX = Math.min(minX, vertex.x);
                    minY = Math.min(minY, vertex.y);
                    minZ = Math.min(minZ, vertex.z);
                    maxX = Math.max(maxX, vertex.x);
                    maxY = Math.max(maxY, vertex.y);
                    maxZ = Math.max(maxZ, vertex.z);
                }
            } else if (boundary.type === 'arc') {
                const arcBounds = getArcBounds({
                    center: boundary.center,
                    radius: boundary.radius,
                    startAngle: boundary.startAngle,
                    endAngle: boundary.endAngle,
                    layer: hatch.layer,
                });
                minX = Math.min(minX, arcBounds.min.x);
                minY = Math.min(minY, arcBounds.min.y);
                minZ = Math.min(minZ, arcBounds.min.z);
                maxX = Math.max(maxX, arcBounds.max.x);
                maxY = Math.max(maxY, arcBounds.max.y);
                maxZ = Math.max(maxZ, arcBounds.max.z);
            } else if (boundary.type === 'circle') {
                minX = Math.min(minX, boundary.center.x - boundary.radius);
                minY = Math.min(minY, boundary.center.y - boundary.radius);
                minZ = Math.min(minZ, boundary.center.z);
                maxX = Math.max(maxX, boundary.center.x + boundary.radius);
                maxY = Math.max(maxY, boundary.center.y + boundary.radius);
                maxZ = Math.max(maxZ, boundary.center.z);
            } else if (boundary.type === 'ellipse') {
                const majorLength = Math.sqrt(
                    boundary.majorAxisEndPoint.x ** 2 +
                        boundary.majorAxisEndPoint.y ** 2
                );
                minX = Math.min(minX, boundary.center.x - majorLength);
                minY = Math.min(minY, boundary.center.y - majorLength);
                minZ = Math.min(minZ, boundary.center.z);
                maxX = Math.max(maxX, boundary.center.x + majorLength);
                maxY = Math.max(maxY, boundary.center.y + majorLength);
                maxZ = Math.max(maxZ, boundary.center.z);
            }
        }
    }

    // 엔티티가 없으면 기본 바운딩 박스 반환
    if (minX === Infinity) {
        return DEFAULT_BOUNDS;
    }

    return {
        min: { x: minX, y: minY, z: minZ },
        max: { x: maxX, y: maxY, z: maxZ },
    };
}

// ============================================================
// 진행률 및 에러 처리
// ============================================================

/** 진행률 전송 */
function sendProgress(stage: string, percent: number): void {
    self.postMessage({
        type: 'progress',
        payload: { stage, percent },
    } as WorkerResponse);
}

/** 에러 코드 판별 */
function getErrorCode(err: unknown): WorkerErrorCode {
    if (err instanceof Error) {
        const msg = err.message.toLowerCase();
        if (msg === 'empty_file') return 'EMPTY_FILE';
        if (msg.includes('invalid') || msg.includes('unexpected'))
            return 'INVALID_FORMAT';
        if (msg.includes('parse') || msg.includes('syntax'))
            return 'PARSE_ERROR';
    }
    return 'UNKNOWN_ERROR';
}

// ============================================================
// 메인 파싱 함수
// ============================================================

/** DXF 파싱 메인 함수 */
function parseDXF(text: string, fileName: string, fileSize: number): void {
    const startTime = performance.now();

    try {
        sendProgress('DXF 파싱 중...', 10);

        const parser = new DxfParser();
        const dxf = parser.parseSync(text);

        if (!dxf || !dxf.entities) {
            throw new Error('INVALID_FORMAT');
        }

        sendProgress('엔티티 추출 중...', 30);

        // 레이어 정보 먼저 구축 (레이어명 정제 적용)
        const layers = new Map<string, LayerInfo>();
        const dxfLayers = dxf.tables?.layer?.layers ?? {};

        for (const [rawLayerName, layerData] of Object.entries(dxfLayers)) {
            const layer = layerData as DXFLibLayer;
            const sanitizedName = sanitizeLayerName(rawLayerName);
            let hexColor: string;

            if (typeof layer.color === 'number') {
                // color 범위 검증
                if (layer.color < 0 || layer.color > 0xffffff) {
                    hexColor = DEFAULT_LAYER_COLOR;
                } else {
                    hexColor = '#' + layer.color.toString(16).padStart(6, '0');
                }
            } else {
                hexColor = aciToHex(layer.colorIndex);
            }

            layers.set(sanitizedName, {
                name: sanitizedName,
                color: hexColor,
                visible: true,
                entityCount: 0,
            });
        }

        // 단일 순회로 모든 엔티티 분류 및 레이어 카운트
        const lines: ParsedLine[] = [];
        const circles: ParsedCircle[] = [];
        const arcs: ParsedArc[] = [];
        const polylines: ParsedPolyline[] = [];
        // Phase 2.1.4: 추가 엔티티 배열
        const texts: ParsedText[] = [];
        const mtexts: ParsedMText[] = [];
        const ellipses: ParsedEllipse[] = [];
        const splines: ParsedSpline[] = [];
        const dimensions: ParsedDimension[] = [];

        // HATCH: 커스텀 파서 사용 (dxf-parser가 HATCH를 지원하지 않음)
        const hatches = parseHatchesFromDxf(text);

        // HATCH 레이어 카운트 추가
        for (const hatch of hatches) {
            if (hatch.layer) {
                countLayer(layers, hatch.layer);
            }
        }

        const entities = dxf.entities as DXFLibEntity[];
        const totalEntities = entities.length;

        for (let i = 0; i < totalEntities; i++) {
            const entity = entities[i];
            if (!entity) continue;

            // 진행률 업데이트 (10% 단위)
            if (i % Math.max(1, Math.floor(totalEntities / 10)) === 0) {
                const progress = 30 + Math.floor((i / totalEntities) * 50);
                sendProgress('엔티티 추출 중...', progress);
            }

            switch (entity.type) {
                case 'LINE': {
                    const line = parseLine(entity);
                    if (line) {
                        lines.push(line);
                        countLayer(layers, entity.layer);
                    }
                    break;
                }
                case 'CIRCLE': {
                    const circle = parseCircle(entity);
                    if (circle) {
                        circles.push(circle);
                        countLayer(layers, entity.layer);
                    }
                    break;
                }
                case 'ARC': {
                    const arc = parseArc(entity);
                    if (arc) {
                        arcs.push(arc);
                        countLayer(layers, entity.layer);
                    }
                    break;
                }
                case 'LWPOLYLINE':
                case 'POLYLINE': {
                    const polyline = parsePolyline(entity);
                    if (polyline) {
                        polylines.push(polyline);
                        countLayer(layers, entity.layer);
                    }
                    break;
                }
                // HATCH: dxf-parser가 지원하지 않음 - parseHatchesFromDxf()로 별도 처리됨
                // Phase 2.1.4: 추가 엔티티 타입
                case 'TEXT': {
                    const text = parseText(entity);
                    if (text) {
                        texts.push(text);
                        countLayer(layers, entity.layer);
                    }
                    break;
                }
                case 'MTEXT': {
                    const mtext = parseMText(entity);
                    if (mtext) {
                        mtexts.push(mtext);
                        countLayer(layers, entity.layer);
                    }
                    break;
                }
                case 'ELLIPSE': {
                    const ellipse = parseEllipse(entity);
                    if (ellipse) {
                        ellipses.push(ellipse);
                        countLayer(layers, entity.layer);
                    }
                    break;
                }
                case 'SPLINE': {
                    const spline = parseSpline(entity);
                    if (spline) {
                        splines.push(spline);
                        countLayer(layers, entity.layer);
                    }
                    break;
                }
                case 'DIMENSION': {
                    const dimension = parseDimension(entity);
                    if (dimension) {
                        dimensions.push(dimension);
                        countLayer(layers, entity.layer);
                    }
                    break;
                }
                // 지원하지 않는 엔티티 타입은 무시
            }
        }

        const totalEntityCount = getTotalEntityCount({
            lines,
            circles,
            arcs,
            polylines,
            hatches,
            // Phase 2.1.4: 추가 엔티티
            texts,
            mtexts,
            ellipses,
            splines,
            dimensions,
        });

        if (totalEntityCount === 0) {
            throw new Error('EMPTY_FILE');
        }

        sendProgress('완료!', 100);

        const endTime = performance.now();

        // Map을 Record로 변환 (JSON 직렬화 호환)
        const layersRecord: Record<string, LayerInfo> =
            Object.fromEntries(layers);

        self.postMessage({
            type: 'success',
            payload: {
                lines,
                circles,
                arcs,
                polylines,
                hatches,
                // Phase 2.1.4: 추가 엔티티
                texts,
                mtexts,
                ellipses,
                splines,
                dimensions,
                bounds: calculateBounds(
                    lines,
                    circles,
                    arcs,
                    polylines,
                    hatches
                ),
                layers: layersRecord,
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
        const code = getErrorCode(err);

        self.postMessage({
            type: 'error',
            payload: { code, message },
        } as WorkerResponse);
    }
}

// ============================================================
// 메시지 검증 및 핸들러
// ============================================================

/**
 * Worker 요청 메시지 런타임 검증
 * 타입스크립트 컴파일 타임 검증 외에 런타임 검증 추가
 */
function validateWorkerRequest(data: unknown): data is WorkerRequest {
    if (!data || typeof data !== 'object') {
        return false;
    }

    const req = data as Record<string, unknown>;

    // type 필드 검증
    if (req.type !== 'parse') {
        return false;
    }

    // payload 검증
    if (!req.payload || typeof req.payload !== 'object') {
        return false;
    }

    const payload = req.payload as Record<string, unknown>;

    // 필수 필드 타입 검증
    if (typeof payload.text !== 'string') {
        return false;
    }
    if (typeof payload.fileName !== 'string') {
        return false;
    }
    if (typeof payload.fileSize !== 'number' || payload.fileSize < 0) {
        return false;
    }

    // 텍스트 길이 상한 검증 (20MB 텍스트 = 약 20M 문자)
    const MAX_TEXT_LENGTH = 20 * 1024 * 1024;
    if (payload.text.length > MAX_TEXT_LENGTH) {
        return false;
    }

    return true;
}

self.onmessage = (event: MessageEvent<WorkerRequest>) => {
    // 런타임 메시지 검증
    if (!validateWorkerRequest(event.data)) {
        self.postMessage({
            type: 'error',
            payload: {
                code: 'INVALID_FORMAT',
                message: '잘못된 Worker 요청 형식입니다.',
            },
        } as WorkerResponse);
        return;
    }

    const { type, payload } = event.data;

    if (type === 'parse') {
        parseDXF(payload.text, payload.fileName, payload.fileSize);
    }
};

export {};
