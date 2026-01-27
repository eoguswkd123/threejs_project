/**
 * CAD Types - Barrel Export
 *
 * 공유 CAD 타입 정의
 * - entity.ts: CAD 엔티티 데이터 모델
 */

export type {
    // Base types
    Point3D,
    BoundingBox,
    LayerInfo,
    CADMetadata,
    // Parsed entities
    ParsedLine,
    ParsedCircle,
    ParsedArc,
    ParsedPolyline,
    // Hatch types
    HatchBoundaryType,
    HatchBoundaryPolyline,
    HatchBoundaryCircle,
    HatchBoundaryArc,
    HatchBoundaryEllipse,
    HatchBoundaryPath,
    ParsedHatch,
    HatchFillMode,
    // Text types
    TextHorizontalAlignment,
    ParsedText,
    MTextAttachment,
    ParsedMText,
    // Curve types
    ParsedEllipse,
    ParsedSpline,
    // Dimension types
    DimensionType,
    ParsedDimension,
    // Aggregate
    ParsedCADData,
} from './entity';

// Extrude types (Phase 2.1.6)
export type {
    ExtrudeOptions,
    Hatch3DGeometryData,
    ExtrudeResult,
    Extrude3DLODConfig,
} from './extrude';

export {
    DEFAULT_EXTRUDE_OPTIONS,
    DEFAULT_3D_LOD_CONFIG,
    getLOD3DSteps,
} from './extrude';

// Hologram types (공통 홀로그램 설정)
export type { HologramSettings, HologramColorPreset } from './hologram';

export { DEFAULT_HOLOGRAM_SETTINGS, HOLOGRAM_COLOR_PRESETS } from './hologram';

// Shading types (Phase 2.1.7)
export type { CadShadingMode, CadMaterialOptions } from './shading';

export {
    DEFAULT_MATERIAL_OPTIONS,
    DEFAULT_SHADING_MODE,
    SHADING_MODE_LABELS,
    SHADING_MODE_DESCRIPTIONS,
    isValidShadingMode,
} from './shading';
