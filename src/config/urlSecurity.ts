/**
 * URL 보안 설정
 * SSRF 방지를 위한 화이트리스트 기반 URL 검증
 *
 * ## 개요
 * 모든 Feature에서 공통으로 사용하는 URL 보안 설정입니다.
 * 외부 URL 로딩 시 SSRF(Server-Side Request Forgery) 공격을 방지합니다.
 *
 * ## 보안 계층
 * 1. **프로토콜 제한**: HTTPS만 허용 (개발 환경에서는 HTTP도 허용)
 * 2. **호스트 화이트리스트**: 신뢰할 수 있는 도메인만 허용
 * 3. **응답 크기 제한**: 서비스 거부 공격 방지
 * 4. **타임아웃 설정**: 무한 대기 방지
 *
 * ## 사용법
 * ```typescript
 * import { createUrlSecurityConfig } from '@/config/urlSecurity';
 *
 * const MY_FEATURE_CONFIG = createUrlSecurityConfig({
 *     additionalHosts: ['example.com'],
 *     maxResponseSize: 10 * 1024 * 1024, // 10MB
 * });
 * ```
 *
 * ## 호스트 추가 가이드라인
 * 새 호스트 추가 시 다음을 확인하세요:
 * 1. 공식/신뢰할 수 있는 서비스인지 확인
 * 2. 해당 도메인이 필요한 최소 기능만 제공하는지 확인
 * 3. Feature별 설정에 추가 (BASE_ALLOWED_HOSTS 수정은 신중히)
 *
 * @see validateSecureUrl - URL 검증 함수 (/src/utils/urlValidator.ts)
 */

/**
 * 기본 허용 호스트 (공통)
 *
 * | 호스트 | 용도 |
 * |--------|------|
 * | localhost, 127.0.0.1 | 로컬 개발 환경 |
 * | github.com | GitHub 저장소 파일 (웹 UI) |
 * | raw.githubusercontent.com | GitHub Raw 파일 (직접 다운로드) |
 * | gitlab.com | GitLab 저장소 파일 |
 * | bitbucket.org | Bitbucket 저장소 파일 |
 */
export const BASE_ALLOWED_HOSTS = [
    // 로컬 개발 환경
    'localhost',
    '127.0.0.1',
    // GitHub (세계 최대 코드 호스팅)
    'github.com',
    'raw.githubusercontent.com',
    // GitLab (자체 호스팅 가능)
    'gitlab.com',
    // Bitbucket (Atlassian 제공)
    'bitbucket.org',
] as const;

/**
 * 기본 URL 보안 설정
 *
 * 이 설정은 모든 Feature에서 공통으로 적용됩니다.
 * Feature별 커스텀 설정은 createUrlSecurityConfig()를 사용하세요.
 */
export const BASE_URL_SECURITY_CONFIG = {
    /**
     * 허용된 프로토콜
     * - 프로덕션: HTTPS만 허용 (보안 통신 필수)
     * - 개발: HTTP도 허용 (로컬 개발 편의)
     */
    allowedProtocols: (import.meta.env.PROD
        ? ['https:']
        : ['https:', 'http:']) as readonly string[],
    /** 기본 허용 호스트 */
    allowedHosts: BASE_ALLOWED_HOSTS,
    /**
     * fetch 타임아웃 (ms)
     * 네트워크 지연이나 서버 무응답 시 연결을 끊는 시간
     */
    fetchTimeout: 30000,
} as const;

/** URL 보안 설정 타입 */
export interface UrlSecurityConfigType {
    allowedProtocols: readonly string[];
    allowedHosts: readonly string[];
    fetchTimeout: number;
    maxResponseSize: number;
}

/**
 * Feature별 URL 보안 설정 생성 헬퍼
 *
 * 각 Feature에서 필요한 추가 호스트와 응답 크기 제한을 설정합니다.
 *
 * @param options - 설정 옵션
 * @param options.additionalHosts - Feature에서 추가로 허용할 호스트 목록
 * @param options.maxResponseSize - 최대 응답 크기 (bytes)
 * @returns Feature별 URL 보안 설정
 *
 * @example
 * ```typescript
 * // CadViewer: DXF 파일 로딩용 (20MB 제한)
 * export const CAD_URL_SECURITY_CONFIG = createUrlSecurityConfig({
 *     maxResponseSize: 20 * 1024 * 1024,
 * });
 *
 * // WorkerViewer: glTF 모델 로딩용 (50MB, 추가 호스트)
 * export const GLTF_URL_SECURITY_CONFIG = createUrlSecurityConfig({
 *     additionalHosts: ['khronos.org', 'model-viewer.glitch.me'],
 *     maxResponseSize: 50 * 1024 * 1024,
 * });
 * ```
 */
export function createUrlSecurityConfig(options: {
    additionalHosts?: readonly string[];
    maxResponseSize: number;
}): UrlSecurityConfigType {
    return {
        ...BASE_URL_SECURITY_CONFIG,
        allowedHosts: [
            ...BASE_ALLOWED_HOSTS,
            ...(options.additionalHosts ?? []),
        ] as readonly string[],
        maxResponseSize: options.maxResponseSize,
    } as const;
}
