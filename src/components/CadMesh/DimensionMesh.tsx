/**
 * DimensionMesh - DIMENSION 렌더링 컴포넌트
 *
 * DXF DIMENSION 엔티티를 치수선 + 텍스트로 렌더링
 */

import { useMemo, useEffect, useRef, memo } from 'react';

import { Text } from '@react-three/drei';
import * as THREE from 'three';

import { DEFAULT_LAYER_COLOR } from '@/constants/cad';
import type { ParsedDimension } from '@/types/cad';
import { createLineMaterialPool, type MaterialPool } from '@/utils/cad';

import type { CadMeshBaseProps, DimensionRenderData } from './types';

/**
 * DimensionMesh 컴포넌트
 * DIMENSION 엔티티를 치수선과 텍스트로 렌더링
 */
function DimensionMeshComponent({
    data,
    center = true,
    layers,
    dataCenter,
}: CadMeshBaseProps) {
    // Material Pool - 색상별 LineBasicMaterial 재사용
    const lineMatPoolRef = useRef<MaterialPool<THREE.LineBasicMaterial> | null>(
        null
    );
    if (!lineMatPoolRef.current) {
        lineMatPoolRef.current = createLineMaterialPool();
    }

    // DIMENSION을 레이어별로 사전 그룹핑 (O(D) - 한 번만 실행)
    const dimensionsByLayer = useMemo(() => {
        const map = new Map<string, ParsedDimension[]>();
        for (const dim of data.dimensions ?? []) {
            const layer = dim.layer ?? '0';
            if (!map.has(layer)) map.set(layer, []);
            map.get(layer)!.push(dim);
        }
        return map;
    }, [data.dimensions]);

    // DIMENSION 렌더링 데이터 생성
    const dimensionRenderData = useMemo((): DimensionRenderData[] => {
        if (!data.dimensions || data.dimensions.length === 0) {
            return [];
        }

        const results: DimensionRenderData[] = [];
        const pool = lineMatPoolRef.current!;

        const processDimension = (
            dim: ParsedDimension,
            index: number,
            color: string,
            visible: boolean
        ) => {
            // 치수선 geometry 생성 (간단한 linear dimension 구현)
            const vertices: number[] = [];
            const p1 = dim.defPoint1;
            const p2 = dim.defPoint2;
            const textPos = dim.textMidPoint;

            // 치수선: defPoint1 → textMidPoint → defPoint2 방향
            vertices.push(
                p1.x - (center ? dataCenter.x : 0),
                p1.y - (center ? dataCenter.y : 0),
                p1.z - (center ? dataCenter.z : 0)
            );
            vertices.push(
                textPos.x - (center ? dataCenter.x : 0),
                textPos.y - (center ? dataCenter.y : 0),
                textPos.z - (center ? dataCenter.z : 0)
            );
            vertices.push(
                textPos.x - (center ? dataCenter.x : 0),
                textPos.y - (center ? dataCenter.y : 0),
                textPos.z - (center ? dataCenter.z : 0)
            );
            vertices.push(
                p2.x - (center ? dataCenter.x : 0),
                p2.y - (center ? dataCenter.y : 0),
                p2.z - (center ? dataCenter.z : 0)
            );

            const lineGeom = new THREE.BufferGeometry();
            lineGeom.setAttribute(
                'position',
                new THREE.Float32BufferAttribute(vertices, 3)
            );

            // Material Pool에서 가져오기 (색상별 재사용)
            const lineMat = pool.get(color);

            // 텍스트: 빈 문자열이면 거리 자동 계산
            let text = dim.text;
            if (!text || text.trim() === '') {
                const distance = Math.sqrt(
                    (p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2 + (p2.z - p1.z) ** 2
                );
                text = distance.toFixed(2);
            }

            // 텍스트 높이 추정 (치수선 길이의 일정 비율)
            const dimLength = Math.sqrt(
                (p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2
            );
            const fontSize = Math.max(dimLength * 0.05, 1);

            results.push({
                key: `dimension-${index}`,
                lineGeometry: lineGeom,
                lineMaterial: lineMat,
                text: {
                    key: `dimension-text-${index}`,
                    content: text,
                    position: [
                        textPos.x - (center ? dataCenter.x : 0),
                        textPos.y - (center ? dataCenter.y : 0),
                        textPos.z - (center ? dataCenter.z : 0),
                    ],
                    rotation: (dim.rotation * Math.PI) / 180,
                    fontSize,
                    color,
                    anchorX: 'center',
                    anchorY: 'bottom',
                    maxWidth: undefined,
                    visible,
                },
                visible,
            });
        };

        if (!layers || layers.size === 0) {
            data.dimensions.forEach((dim, idx) => {
                processDimension(dim, idx, DEFAULT_LAYER_COLOR, true);
            });
        } else {
            let globalIndex = 0;
            for (const [layerName, layerInfo] of layers.entries()) {
                // O(1) 조회로 변경 (기존: O(D) filter)
                const layerDims = dimensionsByLayer.get(layerName) ?? [];
                for (const dim of layerDims) {
                    processDimension(
                        dim,
                        globalIndex++,
                        layerInfo.color,
                        layerInfo.visible
                    );
                }
            }
        }

        return results;
    }, [data.dimensions, layers, center, dataCenter, dimensionsByLayer]);

    // Geometry 정리 (Material은 풀에서 관리)
    useEffect(() => {
        return () => {
            for (const dim of dimensionRenderData) {
                dim.lineGeometry.dispose();
                // lineMaterial은 pool에서 관리되므로 개별 dispose 하지 않음
            }
        };
    }, [dimensionRenderData]);

    // Material Pool 정리 (컴포넌트 언마운트 시)
    useEffect(() => {
        return () => {
            lineMatPoolRef.current?.dispose();
            lineMatPoolRef.current = null;
        };
    }, []);

    return (
        <>
            {dimensionRenderData.map(
                (dimData) =>
                    dimData.visible && (
                        <group key={dimData.key}>
                            <lineSegments
                                geometry={dimData.lineGeometry}
                                material={dimData.lineMaterial}
                            />
                            <Text
                                position={dimData.text.position}
                                rotation={[0, 0, dimData.text.rotation]}
                                fontSize={dimData.text.fontSize}
                                color={dimData.text.color}
                                anchorX={dimData.text.anchorX}
                                anchorY={dimData.text.anchorY}
                            >
                                {dimData.text.content}
                            </Text>
                        </group>
                    )
            )}
        </>
    );
}

export const DimensionMesh = memo(DimensionMeshComponent);
