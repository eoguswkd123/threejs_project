/**
 * useMobileDrawer.test.ts
 * 모바일 드로어 상태 관리 훅 테스트
 *
 * 주요 테스트:
 * - ESC 닫기: Escape 키 → close() 호출
 * - Tab 트랩: 첫/마지막 요소 순환
 * - Shift+Tab: 역방향 순환
 * - 포커스 저장: 열릴 때 이전 요소 저장
 * - 포커스 복원: 닫힐 때 이전 요소로 복원
 * - 라우트 변경: pathname 변경 → 자동 닫기
 * - 스크롤 잠금: isOpen=true → overflow:hidden
 * - 스크롤 해제: isOpen=false → overflow 복원
 * - cleanup: 이벤트 리스너 해제
 */

import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// location mock 값
let mockPathname = '/initial';

// react-router-dom mock
vi.mock('react-router-dom', () => ({
    useLocation: () => ({ pathname: mockPathname }),
}));

// Import after mock
import { useMobileDrawer } from '../useMobileDrawer';

// Wrapper 없이 테스트 (useLocation은 mock됨)
const renderUseMobileDrawer = (isOpen: boolean, close: () => void) => {
    return renderHook(() => useMobileDrawer(isOpen, close));
};

describe('useMobileDrawer', () => {
    let originalBodyOverflow: string;
    let mockClose: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        mockClose = vi.fn();
        vi.useFakeTimers();
        mockPathname = '/initial';
        originalBodyOverflow = document.body.style.overflow;
        document.body.style.overflow = '';
    });

    afterEach(() => {
        vi.useRealTimers();
        document.body.style.overflow = originalBodyOverflow;
        // cleanup any added elements
        document.body.innerHTML = '';
    });

    describe('반환값', () => {
        it('drawerRef를 반환한다', () => {
            const { result } = renderUseMobileDrawer(false, mockClose);

            expect(result.current.drawerRef).toBeDefined();
            expect(result.current.drawerRef.current).toBeNull();
        });
    });

    describe('ESC 키 닫기', () => {
        it('isOpen=true일 때 ESC 키로 close가 호출된다', () => {
            renderUseMobileDrawer(true, mockClose);

            // 초기 호출 횟수 기록 (라우트 변경 감지로 인한 호출 있을 수 있음)
            const initialCallCount = mockClose.mock.calls.length;

            act(() => {
                const event = new KeyboardEvent('keydown', { key: 'Escape' });
                document.dispatchEvent(event);
            });

            // ESC로 인해 1번 더 호출됨
            expect(mockClose).toHaveBeenCalledTimes(initialCallCount + 1);
        });

        it('isOpen=false일 때 ESC 키는 무시된다', () => {
            renderUseMobileDrawer(false, mockClose);

            act(() => {
                const event = new KeyboardEvent('keydown', { key: 'Escape' });
                document.dispatchEvent(event);
            });

            expect(mockClose).not.toHaveBeenCalled();
        });

        it('다른 키는 close를 호출하지 않는다', () => {
            renderUseMobileDrawer(true, mockClose);

            // 초기 호출 횟수 기록
            const initialCallCount = mockClose.mock.calls.length;

            act(() => {
                const event = new KeyboardEvent('keydown', { key: 'Enter' });
                document.dispatchEvent(event);
            });

            // Enter 키로는 추가 호출 없음
            expect(mockClose).toHaveBeenCalledTimes(initialCallCount);
        });
    });

    describe('Tab 포커스 트랩', () => {
        it('Tab 키로 마지막 요소에서 첫 번째 요소로 순환한다', () => {
            const { result } = renderUseMobileDrawer(true, mockClose);

            // 드로어 요소 생성
            const drawer = document.createElement('aside');
            const button1 = document.createElement('button');
            const button2 = document.createElement('button');
            button1.textContent = 'First';
            button2.textContent = 'Last';
            drawer.appendChild(button1);
            drawer.appendChild(button2);
            document.body.appendChild(drawer);

            // ref 연결
            Object.defineProperty(result.current.drawerRef, 'current', {
                value: drawer,
                writable: true,
            });

            // 마지막 요소에 포커스
            button2.focus();

            act(() => {
                const event = new KeyboardEvent('keydown', {
                    key: 'Tab',
                    shiftKey: false,
                });
                // preventDefault mock
                Object.defineProperty(event, 'preventDefault', {
                    value: vi.fn(),
                    writable: true,
                });
                document.dispatchEvent(event);
            });

            // 첫 번째 요소로 포커스 이동 확인
            expect(document.activeElement).toBe(button1);
        });

        it('Shift+Tab으로 첫 번째 요소에서 마지막 요소로 순환한다', () => {
            const { result } = renderUseMobileDrawer(true, mockClose);

            // 드로어 요소 생성
            const drawer = document.createElement('aside');
            const button1 = document.createElement('button');
            const button2 = document.createElement('button');
            button1.textContent = 'First';
            button2.textContent = 'Last';
            drawer.appendChild(button1);
            drawer.appendChild(button2);
            document.body.appendChild(drawer);

            // ref 연결
            Object.defineProperty(result.current.drawerRef, 'current', {
                value: drawer,
                writable: true,
            });

            // 첫 번째 요소에 포커스
            button1.focus();

            act(() => {
                const event = new KeyboardEvent('keydown', {
                    key: 'Tab',
                    shiftKey: true,
                });
                Object.defineProperty(event, 'preventDefault', {
                    value: vi.fn(),
                    writable: true,
                });
                document.dispatchEvent(event);
            });

            // 마지막 요소로 포커스 이동 확인
            expect(document.activeElement).toBe(button2);
        });

        it('포커스 가능한 요소가 없으면 에러 없이 동작한다', () => {
            const { result } = renderUseMobileDrawer(true, mockClose);

            // 빈 드로어
            const drawer = document.createElement('aside');
            document.body.appendChild(drawer);

            Object.defineProperty(result.current.drawerRef, 'current', {
                value: drawer,
                writable: true,
            });

            expect(() => {
                act(() => {
                    const event = new KeyboardEvent('keydown', { key: 'Tab' });
                    document.dispatchEvent(event);
                });
            }).not.toThrow();
        });
    });

    describe('포커스 관리', () => {
        it('열릴 때 드로어 내 첫 번째 요소로 포커스 이동한다', () => {
            const { result, rerender } = renderHook(
                ({ isOpen }) => useMobileDrawer(isOpen, mockClose),
                { initialProps: { isOpen: false } }
            );

            // 드로어 요소 생성
            const drawer = document.createElement('aside');
            const button = document.createElement('button');
            button.textContent = 'Focus me';
            drawer.appendChild(button);
            document.body.appendChild(drawer);

            Object.defineProperty(result.current.drawerRef, 'current', {
                value: drawer,
                writable: true,
            });

            // 드로어 열기
            rerender({ isOpen: true });

            // 타이머 실행 (FOCUS_DELAY_MS = 100)
            act(() => {
                vi.advanceTimersByTime(100);
            });

            expect(document.activeElement).toBe(button);
        });

        it('닫힐 때 이전 활성 요소로 포커스 복원한다', () => {
            // 이전 활성 요소
            const previousButton = document.createElement('button');
            previousButton.textContent = 'Previous';
            document.body.appendChild(previousButton);
            previousButton.focus();

            const { result, rerender } = renderHook(
                ({ isOpen }) => useMobileDrawer(isOpen, mockClose),
                { initialProps: { isOpen: false } }
            );

            // 드로어 요소
            const drawer = document.createElement('aside');
            const drawerButton = document.createElement('button');
            drawer.appendChild(drawerButton);
            document.body.appendChild(drawer);

            Object.defineProperty(result.current.drawerRef, 'current', {
                value: drawer,
                writable: true,
            });

            // 드로어 열기
            rerender({ isOpen: true });
            act(() => {
                vi.advanceTimersByTime(100);
            });

            // 드로어 닫기
            rerender({ isOpen: false });

            expect(document.activeElement).toBe(previousButton);
        });
    });

    describe('라우트 변경 감지', () => {
        it('pathname 변경 시 close가 호출된다', () => {
            const { rerender } = renderHook(
                ({ isOpen }) => useMobileDrawer(isOpen, mockClose),
                { initialProps: { isOpen: true } }
            );

            // pathname 변경 시뮬레이션
            mockPathname = '/new-route';
            rerender({ isOpen: true });

            expect(mockClose).toHaveBeenCalled();
        });

        it('isOpen=false일 때는 pathname 변경해도 close 호출 안함', () => {
            const { rerender } = renderHook(
                ({ isOpen }) => useMobileDrawer(isOpen, mockClose),
                { initialProps: { isOpen: false } }
            );

            mockPathname = '/new-route';
            rerender({ isOpen: false });

            expect(mockClose).not.toHaveBeenCalled();
        });
    });

    describe('스크롤 잠금', () => {
        it('isOpen=true면 body.style.overflow가 hidden이 된다', () => {
            renderUseMobileDrawer(true, mockClose);

            expect(document.body.style.overflow).toBe('hidden');
        });

        it('isOpen=false면 body.style.overflow가 빈 문자열이 된다', () => {
            document.body.style.overflow = 'hidden';

            renderUseMobileDrawer(false, mockClose);

            expect(document.body.style.overflow).toBe('');
        });

        it('열렸다 닫히면 overflow가 복원된다', () => {
            const { rerender } = renderHook(
                ({ isOpen }) => useMobileDrawer(isOpen, mockClose),
                { initialProps: { isOpen: false } }
            );

            // 열기
            rerender({ isOpen: true });
            expect(document.body.style.overflow).toBe('hidden');

            // 닫기
            rerender({ isOpen: false });
            expect(document.body.style.overflow).toBe('');
        });
    });

    describe('cleanup', () => {
        it('언마운트 시 body.style.overflow가 복원된다', () => {
            const { unmount } = renderUseMobileDrawer(true, mockClose);

            expect(document.body.style.overflow).toBe('hidden');

            unmount();

            expect(document.body.style.overflow).toBe('');
        });

        it('언마운트 시 이벤트 리스너가 제거된다', () => {
            const removeEventListenerSpy = vi.spyOn(
                document,
                'removeEventListener'
            );

            const { unmount } = renderUseMobileDrawer(true, mockClose);

            unmount();

            expect(removeEventListenerSpy).toHaveBeenCalledWith(
                'keydown',
                expect.any(Function)
            );

            removeEventListenerSpy.mockRestore();
        });
    });

    describe('엣지 케이스', () => {
        it('drawerRef.current가 null이면 포커스 트랩이 동작하지 않는다', () => {
            renderUseMobileDrawer(true, mockClose);

            // drawerRef.current는 null 상태

            expect(() => {
                act(() => {
                    const event = new KeyboardEvent('keydown', { key: 'Tab' });
                    document.dispatchEvent(event);
                });
            }).not.toThrow();
        });

        it('disabled 버튼은 포커스 가능 요소에서 제외된다', () => {
            const { result } = renderUseMobileDrawer(true, mockClose);

            const drawer = document.createElement('aside');
            const enabledButton = document.createElement('button');
            const disabledButton = document.createElement('button');
            disabledButton.disabled = true;
            drawer.appendChild(enabledButton);
            drawer.appendChild(disabledButton);
            document.body.appendChild(drawer);

            Object.defineProperty(result.current.drawerRef, 'current', {
                value: drawer,
                writable: true,
            });

            enabledButton.focus();

            act(() => {
                const event = new KeyboardEvent('keydown', { key: 'Tab' });
                Object.defineProperty(event, 'preventDefault', {
                    value: vi.fn(),
                    writable: true,
                });
                document.dispatchEvent(event);
            });

            // disabled 버튼은 순환에서 제외되어 첫 번째로 돌아감
            expect(document.activeElement).toBe(enabledButton);
        });
    });
});
