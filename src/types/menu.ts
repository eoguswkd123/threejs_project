/**
 * 메뉴 관련 타입 정의
 */
import type { LucideIcon } from 'lucide-react';

export interface MenuItem {
    path: string;
    icon: LucideIcon;
    label: string;
    description: string;
}
