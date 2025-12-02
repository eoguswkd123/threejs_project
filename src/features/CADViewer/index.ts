/**
 * CAD Viewer - Feature Module
 * DXF 파일 업로드 및 3D 와이어프레임 렌더링
 */

// Components
export { CADScene, CADMesh, CADControls, FileUpload } from './components';

// Hooks
export { useDXFParser } from './hooks';

// Utils
export {
    validateFile,
    validateFileExtension,
    validateFileSize,
    formatFileSize,
    linesToGeometry,
    cadDataToGeometry,
    calculateBounds,
    getBoundsCenter,
    getBoundsSize,
    calculateCameraDistance,
    centerGeometry,
} from './utils';

// Types
export type {
    Point3D,
    ParsedLine,
    BoundingBox,
    ParsedCADData,
    CADMetadata,
    CADViewerConfig,
    UploadStatus,
    UploadError,
    ValidationResult,
} from './types';

// Constants
export {
    FILE_LIMITS,
    DEFAULT_CAD_CONFIG,
    DEFAULT_BOUNDS,
    CAMERA_CONFIG,
    ORBIT_CONTROLS_CONFIG,
    GRID_CONFIG,
    ERROR_MESSAGES,
} from './constants';
