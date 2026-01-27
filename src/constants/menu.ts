import { Coffee, Home, FileBox, Box, Scan } from 'lucide-react';

import type { MenuItem } from '@/types/menu';

import { ROUTES } from './routes';

export const MENU_ITEMS: MenuItem[] = [
    {
        path: ROUTES.HOME,
        icon: Home,
        label: '홈',
        description: '메인 페이지',
    },
    {
        path: ROUTES.TEAPOT_DEMO,
        icon: Coffee,
        label: 'Teapot Demo',
        description: 'Teapot 와이어프레임 예제',
    },
    {
        path: ROUTES.CAD_VIEWER,
        icon: FileBox,
        label: 'Cad Viewer',
        description: 'DXF 파일 3D 뷰어',
    },
    {
        path: ROUTES.WORKER_VIEWER,
        icon: Box,
        label: 'Worker Viewer',
        description: 'glTF/glb 3D 모델 뷰어',
    },
    {
        path: ROUTES.HOLOGRAM_VIEWER,
        icon: Scan,
        label: 'Hologram Viewer',
        description: 'Iron Man 스타일 홀로그램 뷰어',
    },
];
