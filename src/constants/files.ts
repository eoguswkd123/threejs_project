/**
 * 파일 관련 상수
 *
 * @module constants/files
 *
 * @description
 * 지원하는 파일 확장자 및 파일 검증 관련 상수 정의
 */

/**
 * 지원하는 3D 모델 확장자
 *
 * glTF (GL Transmission Format) 기반 3D 모델 파일
 * - .glb: Binary glTF (단일 파일)
 * - .gltf: JSON glTF (외부 리소스 참조 가능)
 */
export const SUPPORTED_MODEL_EXTENSIONS = ['.glb', '.gltf'] as const;

/**
 * 지원하는 CAD 파일 확장자
 *
 * - .dxf: Drawing Exchange Format (AutoCAD 호환)
 */
export const SUPPORTED_CAD_EXTENSIONS = ['.dxf'] as const;

/**
 * 지원하는 모든 파일 확장자
 */
export const SUPPORTED_EXTENSIONS = [
    ...SUPPORTED_MODEL_EXTENSIONS,
    ...SUPPORTED_CAD_EXTENSIONS,
] as const;

// Type exports
export type SupportedModelExtension =
    (typeof SUPPORTED_MODEL_EXTENSIONS)[number];
export type SupportedCadExtension = (typeof SUPPORTED_CAD_EXTENSIONS)[number];
export type SupportedExtension = (typeof SUPPORTED_EXTENSIONS)[number];
