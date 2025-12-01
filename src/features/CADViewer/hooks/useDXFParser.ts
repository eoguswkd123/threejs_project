/**
 * CAD Viewer - DXF Parser Hook
 * DXF 파일을 파싱하여 Three.js에서 사용할 수 있는 데이터로 변환
 */

import { useState, useCallback } from 'react';
import DxfParser from 'dxf-parser';
import type {
    ParsedCADData,
    ParsedLine,
    ParsedCircle,
    ParsedArc,
    ParsedPolyline,
    LayerInfo,
    UploadError,
    Point3D,
    DXFRawEntity,
    DXFRawPoint,
    DXFRawLayer,
} from '../types';
import { calculateBounds } from '../utils/dxfToGeometry';
import { ERROR_MESSAGES, aciToHex, DEFAULT_LAYER_COLOR } from '../constants';

interface UseDXFParserReturn {
    /** DXF 파일 파싱 함수 */
    parse: (file: File) => Promise<ParsedCADData>;
    /** 로딩 상태 */
    isLoading: boolean;
    /** 에러 상태 */
    error: UploadError | null;
    /** 에러 초기화 */
    clearError: () => void;
}

/**
 * DXF 파일 파싱 훅
 */
export function useDXFParser(): UseDXFParserReturn {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<UploadError | null>(null);

    const clearError = useCallback(() => {
        setError(null);
    }, []);

    const parse = useCallback(async (file: File): Promise<ParsedCADData> => {
        setIsLoading(true);
        setError(null);

        const startTime = performance.now();

        try {
            // 파일 내용 읽기
            const text = await file.text();

            // DXF 파싱
            const parser = new DxfParser();
            const dxf = parser.parseSync(text);

            if (!dxf || !dxf.entities) {
                throw new Error('Invalid DXF structure');
            }

            // LINE 엔티티 추출
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

                    return {
                        start,
                        end,
                        layer: entity.layer,
                    };
                });

            // CIRCLE 엔티티 추출
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

            // ARC 엔티티 추출
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

            // POLYLINE / LWPOLYLINE 엔티티 추출
            const polylines: ParsedPolyline[] = (dxf.entities as DXFRawEntity[])
                .filter(
                    (entity) =>
                        entity.type === 'LWPOLYLINE' ||
                        entity.type === 'POLYLINE'
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
                .filter(
                    (polyline: ParsedPolyline) => polyline.vertices.length >= 2
                );

            // 전체 엔티티 수 계산
            const totalEntityCount =
                lines.length + circles.length + arcs.length + polylines.length;

            // 레이어 정보 구축
            const layers = new Map<string, LayerInfo>();

            // DXF 테이블에서 레이어 정보 추출
            const dxfLayers = dxf.tables?.layer?.layers ?? {};
            for (const [layerName, layerData] of Object.entries(dxfLayers)) {
                const layer = layerData as DXFRawLayer;
                // dxf-parser는 color를 10진수 RGB로 반환 (예: 16777215 = 흰색)
                let hexColor: string;
                if (typeof layer.color === 'number') {
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

            // 엔티티에서 레이어 카운트 및 누락된 레이어 추가
            const allEntities = [
                ...lines.map((e) => e.layer),
                ...circles.map((e) => e.layer),
                ...arcs.map((e) => e.layer),
                ...polylines.map((e) => e.layer),
            ];

            for (const layerName of allEntities) {
                const name = layerName ?? '0';
                if (!layers.has(name)) {
                    // 테이블에 없는 레이어 추가
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

            // 엔티티가 없으면 에러
            if (totalEntityCount === 0) {
                const parseError: UploadError = {
                    code: 'EMPTY_FILE',
                    message: ERROR_MESSAGES.EMPTY_FILE,
                };
                setError(parseError);
                throw parseError;
            }

            const endTime = performance.now();

            const result: ParsedCADData = {
                lines,
                circles,
                arcs,
                polylines,
                bounds: calculateBounds(lines, circles, arcs, polylines),
                metadata: {
                    fileName: file.name,
                    fileSize: file.size,
                    entityCount: totalEntityCount,
                    parseTime: Math.round(endTime - startTime),
                },
                layers,
            };

            setIsLoading(false);
            return result;
        } catch (err) {
            setIsLoading(false);

            // 이미 UploadError인 경우
            if (err && typeof err === 'object' && 'code' in err) {
                throw err;
            }

            // 일반 에러를 UploadError로 변환
            const parseError: UploadError = {
                code: 'PARSE_ERROR',
                message: ERROR_MESSAGES.PARSE_ERROR,
            };
            setError(parseError);
            throw parseError;
        }
    }, []);

    return {
        parse,
        isLoading,
        error,
        clearError,
    };
}
