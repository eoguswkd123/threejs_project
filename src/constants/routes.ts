export const ROUTES = {
  HOME: '/',
  CAD_VIEWER: '/cad-viewer',
  THREE_DEMO: '/three-demo',
} as const

export type RouteKey = keyof typeof ROUTES
export type RoutePath = typeof ROUTES[RouteKey]
