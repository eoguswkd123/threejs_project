/**
 * Hooks - 접근성 상수 모듈
 *
 * @module hooks/constants
 *
 * @description
 * useMobileDrawer 등 접근성 관련 훅에서 사용하는 상수 정의
 *
 * @see 파일 확장자 상수는 src/constants/files.ts 참조
 */

// ============================================================
// Accessibility (접근성) 관련 상수
// ============================================================

/**
 * 포커스 가능한 요소 CSS 선택자
 *
 * 포커스 트랩, 포커스 관리 등에서 사용
 * - a[href]: 링크
 * - button:not([disabled]): 활성화된 버튼
 * - textarea, input, select: 폼 요소
 * - [tabindex]: 명시적 tabindex 설정 요소
 */
export const FOCUSABLE_SELECTOR =
    'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * 포커스 설정 지연 시간 (ms)
 *
 * 모달/드로어 열림 애니메이션 완료 후 포커스 이동
 * CSS transition 시간과 맞춰야 함
 */
export const FOCUS_DELAY_MS = 100;
