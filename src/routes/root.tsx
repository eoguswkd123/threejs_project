import { lazy } from "react";
import { createBrowserRouter, Navigate } from "react-router-dom";
import { ROUTES } from "@/constants/routes";

const MainLayout = lazy(() => import("@/components/Layout/MainLayout"));
const CadViewer = lazy(() => import("@/pages/CadViewer"));
const ThreeDemo = lazy(() => import("@/pages/ThreeDemo"));

export const router = createBrowserRouter([
    {
        path: "/",
        element: <MainLayout />,
        children: [
            {
                index: true,
                element: <Navigate to={ROUTES.CAD_VIEWER} replace />,
            },
            {
                path: ROUTES.CAD_VIEWER,
                element: <CadViewer />,
            },
            {
                path: ROUTES.THREE_DEMO,
                element: <ThreeDemo />,
            },
        ],
    },
]);

export default router;