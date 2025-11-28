import {
  Box,
  FileBox,
  Home,
  type LucideIcon
} from 'lucide-react'
import { ROUTES } from './routes'

export interface MenuItem {
  path: string
  icon: LucideIcon
  label: string
  description: string
}

export const MENU_ITEMS: MenuItem[] = [
  {
    path: ROUTES.HOME,
    icon: Home,
    label: '홈',
    description: '메인 페이지'
  },
  {
    path: ROUTES.CAD_VIEWER,
    icon: FileBox,
    label: 'CAD 뷰어',
    description: 'CAD 파일 3D 뷰어'
  },
  {
    path: ROUTES.THREE_DEMO,
    icon: Box,
    label: 'Three.js Demo',
    description: '3D 그래픽 데모'
  }
]
