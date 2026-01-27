/**
 * useMobileDrawer - 모바일 드로어 상태 관리 훅
 *
 * MobileDrawer의 복잡한 부수 효과들을 통합 관리:
 * - 키보드 이벤트 (ESC 닫기, Tab 포커스 트랩)
 * - 포커스 관리 (열기/닫기 시 포커스 이동)
 * - 라우트 변경 감지 (자동 닫기)
 * - 스크롤 잠금 (body overflow 제어)
 *
 * @example
 * ```tsx
 * const { drawerRef } = useMobileDrawer(isOpen, close);
 * return <aside ref={drawerRef}>...</aside>;
 * ```
 */

import { useCallback, useEffect, useRef, useLayoutEffect } from 'react';

import { useLocation } from 'react-router-dom';

import { FOCUSABLE_SELECTOR, FOCUS_DELAY_MS } from './constants';

interface UseMobileDrawerReturn {
    /** 드로어 요소에 연결할 ref */
    drawerRef: React.RefObject<HTMLElement>;
}

/**
 * 모바일 드로어 상태 관리 훅
 *
 * @param isOpen - 드로어 열림 상태
 * @param close - 드로어 닫기 함수
 * @returns drawerRef - 드로어 요소 ref
 */
export function useMobileDrawer(
    isOpen: boolean,
    close: () => void
): UseMobileDrawerReturn {
    const location = useLocation();
    const drawerRef = useRef<HTMLElement>(null);
    const previousActiveElement = useRef<HTMLElement | null>(null);
    const previousPathnameRef = useRef(location.pathname);

    // close 함수 참조 안정화 (ESLint deps 경고 해결)
    const closeRef = useRef(close);
    useLayoutEffect(() => {
        closeRef.current = close;
    }, [close]);

    /**
     * 드로어 내부의 포커스 가능한 요소들 반환
     */
    const getFocusableElements = useCallback((): HTMLElement[] => {
        if (!drawerRef.current) return [];
        return Array.from(
            drawerRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
        );
    }, []);

    /**
     * 키보드 이벤트 핸들러
     * - ESC: 드로어 닫기
     * - Tab: 포커스 트랩 (모달 내부에서만 순환)
     */
    const handleKeyDown = useCallback(
        (e: KeyboardEvent) => {
            if (!isOpen) return;

            // ESC 키로 닫기
            if (e.key === 'Escape') {
                close();
                return;
            }

            // Tab 키 포커스 트랩
            if (e.key === 'Tab') {
                const focusableElements = getFocusableElements();
                if (focusableElements.length === 0) return;

                const firstElement = focusableElements[0];
                const lastElement =
                    focusableElements[focusableElements.length - 1];
                const activeElement = document.activeElement as HTMLElement;

                // Shift+Tab: 첫 번째 요소에서 마지막으로 이동
                if (e.shiftKey) {
                    if (
                        activeElement === firstElement ||
                        !drawerRef.current?.contains(activeElement)
                    ) {
                        e.preventDefault();
                        lastElement?.focus();
                    }
                } else {
                    // Tab: 마지막 요소에서 첫 번째로 이동
                    if (
                        activeElement === lastElement ||
                        !drawerRef.current?.contains(activeElement)
                    ) {
                        e.preventDefault();
                        firstElement?.focus();
                    }
                }
            }
        },
        [isOpen, close, getFocusableElements]
    );

    // =========================================================================
    // Effect 1: 키보드 이벤트 등록
    // =========================================================================
    useEffect(() => {
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);

    // =========================================================================
    // Effect 2: 포커스 관리 (열기/닫기 시)
    // =========================================================================
    useEffect(() => {
        if (isOpen) {
            // 이전 활성 요소 저장 (닫을 때 복원용)
            previousActiveElement.current =
                document.activeElement as HTMLElement;

            // 드로어 내 첫 번째 포커스 가능 요소로 포커스 이동
            // 약간의 지연을 두어 애니메이션 후 포커스 설정
            const timer = setTimeout(() => {
                const focusableElements = getFocusableElements();
                if (focusableElements.length > 0) {
                    focusableElements[0]?.focus();
                }
            }, FOCUS_DELAY_MS);

            return () => clearTimeout(timer);
        } else {
            // 드로어 닫힐 때 이전 활성 요소로 포커스 복원
            if (previousActiveElement.current) {
                previousActiveElement.current.focus();
                previousActiveElement.current = null;
            }
        }
    }, [isOpen, getFocusableElements]);

    // =========================================================================
    // Effect 3: 라우트 변경 시 자동 닫기
    // =========================================================================
    useEffect(() => {
        // 실제 라우트 변경 시에만 드로어 닫기
        // (isOpen 변경만으로는 닫지 않음 - 드로어 열릴 때 바로 닫히는 버그 방지)
        const hasPathnameChanged =
            previousPathnameRef.current !== location.pathname;

        if (hasPathnameChanged && isOpen) {
            closeRef.current();
        }

        // 현재 pathname 저장
        previousPathnameRef.current = location.pathname;
    }, [location.pathname, isOpen]);

    // =========================================================================
    // Effect 4: 스크롤 잠금
    // =========================================================================
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    return { drawerRef };
}
