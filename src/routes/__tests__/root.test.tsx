/**
 * root.test.tsx
 * 라우터 설정 테스트
 *
 * 주요 테스트:
 * - 라우트 정의 존재
 * - 필수 경로 등록 확인
 * - 에러 요소 설정 확인
 * - 라우트 구조 검증
 */

import { describe, it, expect, vi } from 'vitest';

// React 컴포넌트 모킹 (lazy 로딩 방지)
vi.mock('react', async () => {
    const actual = await vi.importActual('react');
    return {
        ...actual,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        lazy: (fn: () => Promise<{ default: React.ComponentType }>) => {
            // lazy를 즉시 resolve하는 컴포넌트로 대체
            const Component = () => null;
            Component.displayName = 'LazyComponent';
            return Component;
        },
    };
});

// 라우트 상수 모킹
vi.mock('@/constants/routes', () => ({
    ROUTES: {
        HOME: '/',
        TEAPOT_DEMO: '/teapot-demo',
        CAD_VIEWER: '/cad-viewer',
        WORKER_VIEWER: '/worker-viewer',
        HOLOGRAM_VIEWER: '/hologram',
    },
}));

import { ROUTES } from '@/constants/routes';

import { router } from '../root';

describe('Router 설정', () => {
    describe('라우트 구조', () => {
        it('router가 정의되어 있다', () => {
            expect(router).toBeDefined();
        });

        it('routes 배열이 존재한다', () => {
            expect(router.routes).toBeDefined();
            expect(Array.isArray(router.routes)).toBe(true);
        });

        it('최소 1개 이상의 라우트가 정의되어 있다', () => {
            expect(router.routes.length).toBeGreaterThan(0);
        });
    });

    describe('루트 라우트', () => {
        it('루트 경로(/)가 정의되어 있다', () => {
            const rootRoute = router.routes[0];

            expect(rootRoute).toBeDefined();
            expect(rootRoute?.path).toBe('/');
        });

        it('루트 라우트에 element가 정의되어 있다 (MainLayout)', () => {
            const rootRoute = router.routes[0] as
                | { element?: unknown }
                | undefined;

            expect(rootRoute).toBeDefined();
            expect(rootRoute?.element).toBeDefined();
        });

        it('루트 라우트에 errorElement가 정의되어 있다', () => {
            const rootRoute = router.routes[0] as
                | { errorElement?: unknown }
                | undefined;

            expect(rootRoute).toBeDefined();
            expect(rootRoute?.errorElement).toBeDefined();
        });

        it('루트 라우트에 children이 정의되어 있다', () => {
            const rootRoute = router.routes[0];

            expect(rootRoute).toBeDefined();
            expect(rootRoute?.children).toBeDefined();
            expect(Array.isArray(rootRoute?.children)).toBe(true);
        });
    });

    describe('자식 라우트', () => {
        const getChildRoutes = () => {
            const rootRoute = router.routes[0];
            return rootRoute?.children || [];
        };

        it('홈 라우트(index)가 정의되어 있다', () => {
            const childRoutes = getChildRoutes();
            const homeRoute = childRoutes.find(
                (r: { index?: boolean }) => r.index === true
            );

            expect(homeRoute).toBeDefined();
        });

        it('TeapotDemo 라우트가 정의되어 있다', () => {
            const childRoutes = getChildRoutes();
            const teapotRoute = childRoutes.find(
                (r: { path?: string }) => r.path === ROUTES.TEAPOT_DEMO
            );

            expect(teapotRoute).toBeDefined();
        });

        it('CadViewer 라우트가 정의되어 있다', () => {
            const childRoutes = getChildRoutes();
            const cadRoute = childRoutes.find(
                (r: { path?: string }) => r.path === ROUTES.CAD_VIEWER
            );

            expect(cadRoute).toBeDefined();
        });

        it('WorkerViewer 라우트가 정의되어 있다', () => {
            const childRoutes = getChildRoutes();
            const workerRoute = childRoutes.find(
                (r: { path?: string }) => r.path === ROUTES.WORKER_VIEWER
            );

            expect(workerRoute).toBeDefined();
        });

        it('HologramViewer 라우트가 정의되어 있다', () => {
            const childRoutes = getChildRoutes();
            const hologramRoute = childRoutes.find(
                (r: { path?: string }) => r.path === ROUTES.HOLOGRAM_VIEWER
            );

            expect(hologramRoute).toBeDefined();
        });

        it('모든 필수 라우트가 등록되어 있다', () => {
            const childRoutes = getChildRoutes();
            const paths = childRoutes.map(
                (r: { path?: string; index?: boolean }) =>
                    r.index ? '/' : r.path
            );

            expect(paths).toContain('/'); // 홈 (index)
            expect(paths).toContain(ROUTES.TEAPOT_DEMO);
            expect(paths).toContain(ROUTES.CAD_VIEWER);
            expect(paths).toContain(ROUTES.WORKER_VIEWER);
            expect(paths).toContain(ROUTES.HOLOGRAM_VIEWER);
        });

        it('각 자식 라우트에 element가 정의되어 있다', () => {
            const childRoutes = getChildRoutes() as Array<{
                element?: unknown;
            }>;

            childRoutes.forEach((route) => {
                expect(route.element).toBeDefined();
            });
        });
    });

    describe('라우트 경로 상수', () => {
        it('ROUTES.HOME은 "/"이다', () => {
            expect(ROUTES.HOME).toBe('/');
        });

        it('ROUTES.TEAPOT_DEMO는 "/teapot-demo"이다', () => {
            expect(ROUTES.TEAPOT_DEMO).toBe('/teapot-demo');
        });

        it('ROUTES.CAD_VIEWER는 "/cad-viewer"이다', () => {
            expect(ROUTES.CAD_VIEWER).toBe('/cad-viewer');
        });

        it('ROUTES.WORKER_VIEWER는 "/worker-viewer"이다', () => {
            expect(ROUTES.WORKER_VIEWER).toBe('/worker-viewer');
        });

        it('ROUTES.HOLOGRAM_VIEWER는 "/hologram"이다', () => {
            expect(ROUTES.HOLOGRAM_VIEWER).toBe('/hologram');
        });
    });
});
