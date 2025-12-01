import { lazy } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import { ROUTES } from '@/constants/routes';

const MainLayout = lazy(() => import('@/components/Layout/MainLayout'));
const Home = lazy(() => import('@/pages/Home'));
const TeapotDemo = lazy(() => import('@/pages/TeapotDemo'));
const CADViewer = lazy(() => import('@/pages/CADViewer'));

export const router = createBrowserRouter([
    {
        path: '/',
        element: <MainLayout />,
        children: [
            {
                index: true,
                element: <Home />,
            },
            {
                path: ROUTES.TEAPOT_DEMO,
                element: <TeapotDemo />,
            },
            {
                path: ROUTES.CAD_VIEWER,
                element: <CADViewer />,
            },
        ],
    },
]);

export default router;
