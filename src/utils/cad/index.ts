/**
 * CAD Utilities - Barrel Export
 *
 * CAD 관련 유틸리티 함수 및 클래스
 */

// Texture Cache Manager
export {
    LRUTextureCache,
    getPatternTextureCache,
    resetPatternTextureCache,
    DEFAULT_TEXTURE_CACHE_CONFIG,
} from './TextureCacheManager';

export type { CacheStats, TextureCacheConfig } from './TextureCacheManager';

// DXF to Geometry Converter
export {
    // Geometry 변환 함수
    linesToGeometry,
    circlesToGeometry,
    arcsToGeometry,
    polylinesToGeometry,
    hatchBoundariesToWireframe,
    hatchesToSolidGeometries,
    createPatternTexture,
    clearPatternTextureCache,
    cadDataToGeometry,
    calculateBounds,
    calculateCameraDistance,
    ellipsesToGeometry,
    splinesToGeometry,
} from './dxfToGeometry';

export type { HatchGeometryData } from './dxfToGeometry';

// CAD Data Utilities (순수 함수)
export {
    filterDataByLayerName,
    filterHatchesByLayerName,
    getTextAnchors,
    getWireframeEntityCount,
} from './cadDataUtils';

// Measure Utilities (Three.js 의존)
export { calculateDataCenter } from './measureUtils';

// HATCH 3D Extrusion (Phase 2.1.6)
export {
    hatchToExtrudeGeometry,
    hatchesToExtrude3DGeometries,
    mergeHatch3DGeometriesByLayer,
    disposeHatch3DGeometries,
    isValidHatchForExtrusion,
} from './hatch3DExtrude';

// Material Factory
export {
    WIREFRAME_DEFAULT_COLOR,
    createLineMaterial,
    createMeshWireframeMaterial,
    MaterialPool,
    createLineMaterialPool,
    createMeshWireframeMaterialPool,
} from './materialFactory';

// Geometry Utilities (공통 변환 함수)
export {
    translateToCenter,
    translateToCenterXY,
    calculateCenteredZPosition,
} from './geometryUtils';

export type { DataCenter } from './geometryUtils';
