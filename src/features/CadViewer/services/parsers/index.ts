/**
 * Entity Parsers - Barrel Export
 *
 * entityParsers.ts를 분할한 모듈들의 재export
 * 기존 import 경로와의 호환성 유지
 */

// Types
export type { ParsedEntities } from './types';

// Utils
export { toPoint3D, toPoint3DArray } from './utils';

// Individual Parsers
export { parseLine } from './lineParser';
export { parseCircle } from './circleParser';
export { parseArc } from './arcParser';
export { parsePolyline } from './polylineParser';
export { parseHatch, parseHatchBoundary } from './hatchEntityParser';
export { parseText } from './textParser';
export { parseMText, parseMTextFormatting } from './mtextParser';
export { parseEllipse } from './ellipseParser';
export { parseSpline } from './splineParser';
export { parseDimension } from './dimensionParser';

// Batch Parser
export { parseAllEntities, getTotalEntityCount } from './batchParser';
