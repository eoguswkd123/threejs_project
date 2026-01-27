/**
 * CAD Constants - Rendering Settings
 *
 * 렌더링 및 기하학 관련 상수
 * utils/cad, components/CadMesh 등에서 공유
 */

/** HATCH 렌더링 설정 */
export const HATCH_CONFIG = {
    /** 솔리드 채우기 투명도 */
    solidOpacity: 0.7,
    /** Z축 오프셋 (와이어프레임 뒤에 렌더링) */
    zOffset: -0.01,
    /** 기본 HATCH 색상 */
    defaultColor: '#00ff00',
    /** 패턴 텍스처 크기 */
    patternTextureSize: 128,
    /** 기본 패턴 라인 간격 */
    defaultPatternSpacing: 16,
} as const;

/**
 * 텍스처 캐시 설정
 * LRU(Least Recently Used) 기반 자동 메모리 관리
 */
export const TEXTURE_CACHE_CONFIG = {
    /** 최대 캐시 항목 수 */
    maxSize: 100,
    /** 최대 메모리 사용량 (50MB) */
    maxMemory: 50 * 1024 * 1024,
    /** 텍스처당 기본 메모리 크기 (128x128 RGBA) */
    defaultTextureMemory: 128 * 128 * 4,
} as const;

/**
 * LOD (Level of Detail) 설정
 * 엔티티 수에 따른 세그먼트 수 조절
 */
export const LOD_CONFIG = {
    /** 고품질 세그먼트 수 (엔티티 < 1000) */
    HIGH_QUALITY_SEGMENTS: 64,
    /** 중간 품질 세그먼트 수 (엔티티 1000-5000) */
    MEDIUM_QUALITY_SEGMENTS: 32,
    /** 저품질 세그먼트 수 (엔티티 > 5000) */
    LOW_QUALITY_SEGMENTS: 16,
    /** 고품질 임계값 */
    HIGH_QUALITY_THRESHOLD: 1000,
    /** 중간 품질 임계값 */
    MEDIUM_QUALITY_THRESHOLD: 5000,
} as const;

/**
 * 엔티티 수에 따른 LOD 세그먼트 수 계산
 * @param entityCount 전체 엔티티 수
 * @returns 원/호에 사용할 세그먼트 수
 */
export function getLODSegments(entityCount: number): number {
    if (entityCount < LOD_CONFIG.HIGH_QUALITY_THRESHOLD) {
        return LOD_CONFIG.HIGH_QUALITY_SEGMENTS;
    }
    if (entityCount < LOD_CONFIG.MEDIUM_QUALITY_THRESHOLD) {
        return LOD_CONFIG.MEDIUM_QUALITY_SEGMENTS;
    }
    return LOD_CONFIG.LOW_QUALITY_SEGMENTS;
}
