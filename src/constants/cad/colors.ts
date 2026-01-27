/**
 * CAD Constants - Color Definitions
 *
 * DXF 색상 맵 및 기본 색상
 * utils/cad, components/CadMesh 등에서 공유
 */

/** DXF ACI(AutoCAD Color Index) to HEX 매핑 */
export const DXF_COLOR_MAP: Record<number, string> = {
    // 기본 색상 (0-9)
    0: '#ffffff', // ByBlock
    1: '#ff0000', // Red
    2: '#ffff00', // Yellow
    3: '#00ff00', // Green
    4: '#00ffff', // Cyan
    5: '#0000ff', // Blue
    6: '#ff00ff', // Magenta
    7: '#ffffff', // White/Black
    8: '#808080', // Dark Gray
    9: '#c0c0c0', // Light Gray
    // 확장 색상 (10-249 중 주요 색상)
    10: '#ff0000', // Red
    11: '#ff7f7f', // Light Red
    12: '#cc0000', // Dark Red
    20: '#ff7f00', // Orange
    30: '#ff7f00', // Orange
    40: '#ffff00', // Yellow
    50: '#7fff00', // Yellow-Green
    60: '#00ff00', // Green
    70: '#00ff7f', // Green-Cyan
    80: '#00ffff', // Cyan
    90: '#007fff', // Cyan-Blue
    100: '#0000ff', // Blue
    110: '#7f00ff', // Blue-Violet
    120: '#ff00ff', // Magenta
    130: '#ff007f', // Magenta-Red
    140: '#ff7f7f', // Light Pink
    150: '#ff7f00', // Orange
    160: '#7f7f00', // Olive
    170: '#007f00', // Dark Green
    180: '#007f7f', // Teal
    190: '#00007f', // Dark Blue
    200: '#7f007f', // Purple
    210: '#7f3f00', // Brown
    // 회색조 (250-255)
    250: '#333333', // Very Dark Gray
    251: '#505050', // Dark Gray
    252: '#696969', // Dim Gray
    253: '#808080', // Gray
    254: '#c0c0c0', // Silver
    255: '#ffffff', // White
    // ByLayer
    256: '#ffffff',
} as const;

/** 레이어 기본 색상 */
export const DEFAULT_LAYER_COLOR = '#00ff00';

/** 빈 도면 기본 바운딩 박스 */
export const DEFAULT_BOUNDS = {
    min: { x: 0, y: 0, z: 0 },
    max: { x: 100, y: 100, z: 0 },
} as const;
