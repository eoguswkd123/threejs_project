/**
 * CAD Constants - Barrel Export
 *
 * 공유 CAD 상수
 * - rendering.ts: 렌더링/기하학 설정
 * - colors.ts: DXF 색상 맵
 */

// Rendering constants
export {
    HATCH_CONFIG,
    TEXTURE_CACHE_CONFIG,
    LOD_CONFIG,
    getLODSegments,
} from './rendering';

// Color constants
export { DXF_COLOR_MAP, DEFAULT_LAYER_COLOR, DEFAULT_BOUNDS } from './colors';
