export const ROUTES = {
    HOME: '/',
    TEAPOT_DEMO: '/teapot-demo',
    CAD_VIEWER: '/cad-viewer',
} as const;

export type RouteKey = keyof typeof ROUTES;
export type RoutePath = (typeof ROUTES)[RouteKey];
