/**
 * TextMesh - TEXT/MTEXT 렌더링 컴포넌트
 *
 * DXF TEXT 및 MTEXT 엔티티를 drei Text 컴포넌트로 렌더링
 */

import { useMemo, memo } from 'react';

import { Text } from '@react-three/drei';

import { DEFAULT_LAYER_COLOR } from '@/constants/cad';
import type { ParsedMText, ParsedText } from '@/types/cad';
import { getTextAnchors } from '@/utils/cad';

import type { CadMeshBaseProps, TextRenderData } from './types';

/**
 * TextMesh 컴포넌트
 * TEXT 및 MTEXT 엔티티를 레이어별 색상으로 렌더링
 */
function TextMeshComponent({
    data,
    center = true,
    layers,
    dataCenter,
}: CadMeshBaseProps) {
    // TEXT를 레이어별로 사전 그룹핑 (O(T) - 한 번만 실행)
    const textsByLayer = useMemo(() => {
        const map = new Map<string, ParsedText[]>();
        for (const text of data.texts ?? []) {
            const layer = text.layer ?? '0';
            if (!map.has(layer)) map.set(layer, []);
            map.get(layer)!.push(text);
        }
        return map;
    }, [data.texts]);

    // TEXT 렌더링 데이터 생성
    const textRenderData = useMemo((): TextRenderData[] => {
        if (!data.texts || data.texts.length === 0) {
            return [];
        }

        const results: TextRenderData[] = [];

        const processText = (
            text: ParsedText,
            index: number,
            color: string,
            visible: boolean
        ) => {
            const position: [number, number, number] = [
                text.position.x - (center ? dataCenter.x : 0),
                text.position.y - (center ? dataCenter.y : 0),
                text.position.z - (center ? dataCenter.z : 0),
            ];

            results.push({
                key: `text-${index}`,
                content: text.content,
                position,
                rotation: (text.rotation * Math.PI) / 180,
                fontSize: text.height,
                color,
                anchorX: text.alignment,
                anchorY: 'bottom',
                maxWidth: undefined,
                visible,
            });
        };

        if (!layers || layers.size === 0) {
            data.texts.forEach((text, idx) => {
                processText(text, idx, DEFAULT_LAYER_COLOR, true);
            });
        } else {
            let globalIndex = 0;
            for (const [layerName, layerInfo] of layers.entries()) {
                // O(1) 조회로 변경 (기존: O(T) filter)
                const layerTexts = textsByLayer.get(layerName) ?? [];
                for (const text of layerTexts) {
                    processText(
                        text,
                        globalIndex++,
                        layerInfo.color,
                        layerInfo.visible
                    );
                }
            }
        }

        return results;
    }, [data.texts, layers, center, dataCenter, textsByLayer]);

    // MTEXT를 레이어별로 사전 그룹핑 (O(M) - 한 번만 실행)
    const mtextsByLayer = useMemo(() => {
        const map = new Map<string, ParsedMText[]>();
        for (const mtext of data.mtexts ?? []) {
            const layer = mtext.layer ?? '0';
            if (!map.has(layer)) map.set(layer, []);
            map.get(layer)!.push(mtext);
        }
        return map;
    }, [data.mtexts]);

    // MTEXT 렌더링 데이터 생성
    const mtextRenderData = useMemo((): TextRenderData[] => {
        if (!data.mtexts || data.mtexts.length === 0) {
            return [];
        }

        const results: TextRenderData[] = [];

        const processMText = (
            mtext: ParsedMText,
            index: number,
            color: string,
            visible: boolean
        ) => {
            const position: [number, number, number] = [
                mtext.position.x - (center ? dataCenter.x : 0),
                mtext.position.y - (center ? dataCenter.y : 0),
                mtext.position.z - (center ? dataCenter.z : 0),
            ];

            const anchors = getTextAnchors(mtext.attachment);

            results.push({
                key: `mtext-${index}`,
                content: mtext.content,
                position,
                rotation: (mtext.rotation * Math.PI) / 180,
                fontSize: mtext.height,
                color,
                anchorX: anchors.anchorX,
                anchorY: anchors.anchorY,
                maxWidth: mtext.width > 0 ? mtext.width : undefined,
                visible,
            });
        };

        if (!layers || layers.size === 0) {
            data.mtexts.forEach((mtext, idx) => {
                processMText(mtext, idx, DEFAULT_LAYER_COLOR, true);
            });
        } else {
            let globalIndex = 0;
            for (const [layerName, layerInfo] of layers.entries()) {
                // O(1) 조회로 변경 (기존: O(M) filter)
                const layerMTexts = mtextsByLayer.get(layerName) ?? [];
                for (const mtext of layerMTexts) {
                    processMText(
                        mtext,
                        globalIndex++,
                        layerInfo.color,
                        layerInfo.visible
                    );
                }
            }
        }

        return results;
    }, [data.mtexts, layers, center, dataCenter, mtextsByLayer]);

    return (
        <>
            {/* TEXT 렌더링 */}
            {textRenderData.map(
                (textData) =>
                    textData.visible && (
                        <Text
                            key={textData.key}
                            position={textData.position}
                            rotation={[0, 0, textData.rotation]}
                            fontSize={textData.fontSize}
                            color={textData.color}
                            anchorX={textData.anchorX}
                            anchorY={textData.anchorY}
                        >
                            {textData.content}
                        </Text>
                    )
            )}

            {/* MTEXT 렌더링 */}
            {mtextRenderData.map(
                (textData) =>
                    textData.visible && (
                        <Text
                            key={textData.key}
                            position={textData.position}
                            rotation={[0, 0, textData.rotation]}
                            fontSize={textData.fontSize}
                            color={textData.color}
                            anchorX={textData.anchorX}
                            anchorY={textData.anchorY}
                            {...(textData.maxWidth !== undefined && {
                                maxWidth: textData.maxWidth,
                            })}
                        >
                            {textData.content}
                        </Text>
                    )
            )}
        </>
    );
}

export const TextMesh = memo(TextMeshComponent);
