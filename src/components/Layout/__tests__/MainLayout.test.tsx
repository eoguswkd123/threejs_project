/**
 * MainLayout.test.tsx
 * 메인 레이아웃 컴포넌트 테스트
 *
 * 주요 테스트:
 * - 모든 레이아웃 구성요소 렌더링
 * - Outlet을 통한 자식 라우트 렌더링
 * - CSS 클래스 적용 확인
 * - 반응형 레이아웃 구조
 */

import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';

// 자식 컴포넌트 모킹
vi.mock('../MobileHeader', () => ({
    MobileHeader: () => (
        <header data-testid="mobile-header">MobileHeader</header>
    ),
}));

vi.mock('../MobileDrawer', () => ({
    MobileDrawer: () => <div data-testid="mobile-drawer">MobileDrawer</div>,
}));

vi.mock('../SideBar', () => ({
    SideBar: () => <aside data-testid="sidebar">SideBar</aside>,
}));

vi.mock('../Footer', () => ({
    Footer: () => <footer data-testid="footer">Footer</footer>,
}));

import MainLayout from '../MainLayout';

describe('MainLayout', () => {
    const renderWithRouter = (initialRoute = '/') => {
        return render(
            <MemoryRouter initialEntries={[initialRoute]}>
                <Routes>
                    <Route element={<MainLayout />}>
                        <Route
                            path="/"
                            element={
                                <div data-testid="home-content">홈 콘텐츠</div>
                            }
                        />
                        <Route
                            path="/test"
                            element={
                                <div data-testid="test-content">
                                    테스트 콘텐츠
                                </div>
                            }
                        />
                    </Route>
                </Routes>
            </MemoryRouter>
        );
    };

    describe('레이아웃 구성요소', () => {
        it('MobileHeader를 렌더링한다', () => {
            renderWithRouter();

            expect(screen.getByTestId('mobile-header')).toBeInTheDocument();
        });

        it('MobileDrawer를 렌더링한다', () => {
            renderWithRouter();

            expect(screen.getByTestId('mobile-drawer')).toBeInTheDocument();
        });

        it('SideBar를 렌더링한다', () => {
            renderWithRouter();

            expect(screen.getByTestId('sidebar')).toBeInTheDocument();
        });

        it('Footer를 렌더링한다', () => {
            renderWithRouter();

            expect(screen.getByTestId('footer')).toBeInTheDocument();
        });

        it('모든 구성요소가 함께 렌더링된다', () => {
            renderWithRouter();

            expect(screen.getByTestId('mobile-header')).toBeInTheDocument();
            expect(screen.getByTestId('mobile-drawer')).toBeInTheDocument();
            expect(screen.getByTestId('sidebar')).toBeInTheDocument();
            expect(screen.getByTestId('footer')).toBeInTheDocument();
        });
    });

    describe('Outlet (자식 라우트)', () => {
        it('루트 경로에서 홈 콘텐츠를 렌더링한다', () => {
            renderWithRouter('/');

            expect(screen.getByTestId('home-content')).toBeInTheDocument();
            expect(screen.getByText('홈 콘텐츠')).toBeInTheDocument();
        });

        it('테스트 경로에서 테스트 콘텐츠를 렌더링한다', () => {
            renderWithRouter('/test');

            expect(screen.getByTestId('test-content')).toBeInTheDocument();
            expect(screen.getByText('테스트 콘텐츠')).toBeInTheDocument();
        });
    });

    describe('CSS 클래스', () => {
        it('h-screen 클래스가 적용된다', () => {
            const { container } = renderWithRouter();
            const wrapper = container.firstChild as HTMLElement;

            expect(wrapper).toHaveClass('h-screen');
        });

        it('flex flex-col 클래스가 적용된다', () => {
            const { container } = renderWithRouter();
            const wrapper = container.firstChild as HTMLElement;

            expect(wrapper).toHaveClass('flex');
            expect(wrapper).toHaveClass('flex-col');
        });

        it('bg-gray-50 클래스가 적용된다', () => {
            const { container } = renderWithRouter();
            const wrapper = container.firstChild as HTMLElement;

            expect(wrapper).toHaveClass('bg-gray-50');
        });
    });

    describe('레이아웃 구조', () => {
        it('main 요소가 존재한다', () => {
            renderWithRouter();

            expect(screen.getByRole('main')).toBeInTheDocument();
        });

        it('main 요소에 flex-1 클래스가 적용된다', () => {
            renderWithRouter();
            const main = screen.getByRole('main');

            expect(main).toHaveClass('flex-1');
        });

        it('main 요소에 overflow-auto 클래스가 적용된다', () => {
            renderWithRouter();
            const main = screen.getByRole('main');

            expect(main).toHaveClass('overflow-auto');
        });
    });
});
