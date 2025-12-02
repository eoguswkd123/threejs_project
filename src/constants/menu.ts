import { Coffee, Home, FileBox } from 'lucide-react';

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
        label: 'CAD Viewer',
        description: 'DXF 파일 3D 뷰어',
    },
];
