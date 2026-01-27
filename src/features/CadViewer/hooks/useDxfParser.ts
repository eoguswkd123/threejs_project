/**
 * CAD Viewer - DXF Parser Hook
 * DXF 파일을 파싱하여 Three.js에서 사용할 수 있는 데이터로 변환
 *
 * @see {@link parseAllEntities} - 공유 엔티티 파서 (services/entityParsers.ts)
 */

import { useState, useCallback } from 'react';

import DxfParser from 'dxf-parser';

import { MESSAGES } from '@/locales';
import type { ParsedCADData, LayerInfo } from '@/types/cad';
import { calculateBounds } from '@/utils/cad';

import { aciToHex, DEFAULT_LAYER_COLOR } from '../constants';
import { parseAllEntities, getTotalEntityCount } from '../services';

import type { UploadError, DXFLibEntity, DXFLibLayer } from '../types';

interface UseDxfParserReturn {
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
export function useDxfParser(): UseDxfParserReturn {
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

            // 공유 파서를 사용하여 모든 엔티티 추출 (단일 순회)
            const parsedEntities = parseAllEntities(
                dxf.entities as DXFLibEntity[]
            );
            const {
                lines,
                circles,
                arcs,
                polylines,
                hatches,
                texts,
                mtexts,
                ellipses,
                splines,
                dimensions,
            } = parsedEntities;

            // 전체 엔티티 수 계산
            const totalEntityCount = getTotalEntityCount(parsedEntities);

            // 레이어 정보 구축
            const layers = new Map<string, LayerInfo>();

            // DXF 테이블에서 레이어 정보 추출
            const dxfLayers = dxf.tables?.layer?.layers ?? {};
            for (const [layerName, layerData] of Object.entries(dxfLayers)) {
                const layer = layerData as DXFLibLayer;
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
                ...hatches.map((e) => e.layer),
                ...texts.map((e) => e.layer),
                ...mtexts.map((e) => e.layer),
                ...ellipses.map((e) => e.layer),
                ...splines.map((e) => e.layer),
                ...dimensions.map((e) => e.layer),
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
                    message: MESSAGES.cadViewer.errors.emptyFile,
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
                hatches,
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
                metadata: {
                    fileName: file.name,
                    fileSize: file.size,
                    entityCount: totalEntityCount,
                    parseTime: Math.round(endTime - startTime),
                },
                layers: Object.fromEntries(layers),
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
                message: MESSAGES.cadViewer.errors.parseError,
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
