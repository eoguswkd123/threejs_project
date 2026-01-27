import { lazy } from 'react';

import { createBrowserRouter } from 'react-router-dom';

import { ROUTES } from '@/constants/routes';
import ErrorPage from '@/pages/Error';

const MainLayout = lazy(() => import('@/components/Layout/MainLayout'));
const Home = lazy(() => import('@/pages/Home'));
const TeapotDemo = lazy(() => import('@/pages/TeapotDemo'));
const CadViewer = lazy(() => import('@/pages/CadViewer'));
const WorkerViewer = lazy(() => import('@/pages/WorkerViewer'));
const HologramViewer = lazy(() => import('@/pages/HologramViewer'));

export const router = createBrowserRouter([
    {
        path: '/',
        element: <MainLayout />,
        errorElement: <ErrorPage />,
        children: [
            { index: true, element: <Home /> },
            { path: ROUTES.TEAPOT_DEMO, element: <TeapotDemo /> },
            { path: ROUTES.CAD_VIEWER, element: <CadViewer /> },
            { path: ROUTES.WORKER_VIEWER, element: <WorkerViewer /> },
            { path: ROUTES.HOLOGRAM_VIEWER, element: <HologramViewer /> },
        ],
    },
]);

export default router;
