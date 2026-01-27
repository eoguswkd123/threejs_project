/**
 * HATCH Parser - dxf-parser가 지원하지 않는 HATCH 엔티티 파싱
 *
 * dxf-parser 라이브러리는 HATCH 엔티티를 지원하지 않으므로
 * raw DXF 텍스트에서 직접 HATCH를 추출하는 커스텀 파서
 *
 * @see https://help.autodesk.com/view/OARX/2024/ENU/?guid=GUID-A85E8E67-27CD-4C59-BE61-4DC9FADBE74A
 */

import type { ParsedHatch, HatchBoundaryPath, Point3D } from '@/types/cad';

/**
 * DXF 그룹 코드 상수
 */
const GROUP_CODES = {
    ENTITY_TYPE: 0,
    LAYER: 8,
    PATTERN_NAME: 2,
    SOLID_FLAG: 70,
    BOUNDARY_COUNT: 91,
    BOUNDARY_TYPE: 92,
    HAS_BULGE: 72,
    IS_CLOSED: 73,
    VERTEX_COUNT: 93,
    X_COORD: 10,
    Y_COORD: 20,
    COLOR_INDEX: 62,
    PATTERN_SCALE: 41,
    PATTERN_ANGLE: 52,
} as const;

/**
 * DXF 라인 파서 (그룹 코드 + 값 쌍)
 */
interface DxfLine {
    code: number;
    value: string;
}

/**
 * Raw DXF 텍스트를 그룹 코드/값 쌍으로 파싱
 */
function parseDxfLines(content: string): DxfLine[] {
    const lines = content.split(/\r?\n/);
    const result: DxfLine[] = [];

    for (let i = 0; i < lines.length - 1; i += 2) {
        const codeLine = lines[i];
        const valueLine = lines[i + 1];

        if (!codeLine || !valueLine) continue;

        const trimmedCode = codeLine.trim();
        if (trimmedCode === '') continue;

        const code = parseInt(trimmedCode, 10);
        if (isNaN(code)) continue;

        result.push({
            code,
            value: valueLine.trim(),
        });
    }

    return result;
}

/**
 * HATCH 엔티티 블록의 시작/끝 인덱스 찾기
 */
function findHatchBlocks(
    dxfLines: DxfLine[]
): Array<{ start: number; end: number }> {
    const blocks: Array<{ start: number; end: number }> = [];
    let currentStart = -1;

    for (let i = 0; i < dxfLines.length; i++) {
        const line = dxfLines[i];
        if (!line) continue;

        // 엔티티 시작
        if (line.code === GROUP_CODES.ENTITY_TYPE) {
            // 이전 HATCH 블록 종료
            if (currentStart !== -1) {
                blocks.push({ start: currentStart, end: i - 1 });
                currentStart = -1;
            }

            // 새 HATCH 블록 시작
            if (line.value === 'HATCH') {
                currentStart = i;
            }
        }
    }

    // 마지막 HATCH 블록
    if (currentStart !== -1) {
        blocks.push({ start: currentStart, end: dxfLines.length - 1 });
    }

    return blocks;
}

/**
 * 단일 HATCH 블록 파싱
 */
function parseHatchBlock(
    dxfLines: DxfLine[],
    startIdx: number,
    endIdx: number
): ParsedHatch | null {
    let layer: string | undefined;
    let patternName = 'SOLID';
    let isSolid = true;
    let colorIndex: number | undefined;
    let patternScale = 1;
    let patternAngle = 0;

    const boundaries: HatchBoundaryPath[] = [];
    let currentBoundaryVertexCount = 0;
    let currentVertices: Point3D[] = [];
    let isClosed = true;
    let inBoundaryPath = false;
    let lastX: number | null = null;

    for (let i = startIdx; i <= endIdx; i++) {
        const line = dxfLines[i];
        if (!line) continue;

        const { code, value } = line;

        switch (code) {
            case GROUP_CODES.LAYER:
                layer = value;
                break;

            case GROUP_CODES.PATTERN_NAME:
                patternName = value;
                isSolid = value.toUpperCase() === 'SOLID';
                break;

            case GROUP_CODES.SOLID_FLAG:
                // 70: 0=pattern, 1=solid (outer most)
                // 실제로는 patternName으로 판단하는 것이 더 정확
                break;

            case GROUP_CODES.COLOR_INDEX:
                colorIndex = parseInt(value, 10);
                break;

            case GROUP_CODES.PATTERN_SCALE:
                patternScale = parseFloat(value) || 1;
                break;

            case GROUP_CODES.PATTERN_ANGLE:
                patternAngle = parseFloat(value) || 0;
                break;

            case GROUP_CODES.BOUNDARY_TYPE:
                // 92: 경계 타입 (7 = polyline boundary path)
                inBoundaryPath = true;
                break;

            case GROUP_CODES.IS_CLOSED:
                isClosed = value === '1';
                break;

            case GROUP_CODES.VERTEX_COUNT:
                // 93: 정점 수
                currentBoundaryVertexCount = parseInt(value, 10);
                currentVertices = [];
                break;

            case GROUP_CODES.X_COORD:
                // 10: X 좌표 (다음에 20이 와야 함)
                lastX = parseFloat(value);
                break;

            case GROUP_CODES.Y_COORD:
                // 20: Y 좌표
                if (lastX !== null && inBoundaryPath) {
                    const y = parseFloat(value);
                    currentVertices.push({ x: lastX, y, z: 0 });
                    lastX = null;

                    // 정점 수 채워지면 경계 완성
                    if (
                        currentBoundaryVertexCount > 0 &&
                        currentVertices.length === currentBoundaryVertexCount
                    ) {
                        if (currentVertices.length >= 3) {
                            boundaries.push({
                                type: 'polyline',
                                vertices: [...currentVertices],
                                closed: isClosed,
                            });
                        }
                        currentVertices = [];
                        currentBoundaryVertexCount = 0;
                        inBoundaryPath = false;
                    }
                }
                break;
        }
    }

    // 유효한 경계가 없으면 null
    if (boundaries.length === 0) {
        return null;
    }

    return {
        boundaries,
        patternName,
        isSolid,
        patternScale,
        patternAngle,
        color: colorIndex,
        layer,
    };
}

/**
 * Raw DXF 텍스트에서 HATCH 엔티티 추출
 *
 * @param dxfContent - DXF 파일 텍스트 내용
 * @returns 파싱된 HATCH 배열
 */
export function parseHatchesFromDxf(dxfContent: string): ParsedHatch[] {
    const dxfLines = parseDxfLines(dxfContent);
    const hatchBlocks = findHatchBlocks(dxfLines);

    const hatches: ParsedHatch[] = [];

    for (const block of hatchBlocks) {
        const hatch = parseHatchBlock(dxfLines, block.start, block.end);
        if (hatch) {
            hatches.push(hatch);
        }
    }

    return hatches;
}
