import SideBarMenuItem from './SideBarMenuItem';
import { APP_CONFIG } from '@constants/app';
import { MENU_ITEMS } from '@constants/menu';

const SideBar = () => {
  return (
    <aside className="w-64 bg-white shadow-lg border-r border-gray-200">
    {/* 로고 섹션 */}
    <div className="p-6 border-b border-gray-200">
      <h1 className="text-xl font-bold text-gray-800">{APP_CONFIG.NAME}</h1>
      <p className="text-sm text-gray-600">{APP_CONFIG.DESCRIPTION}</p>
    </div>

    {/* 메뉴 섹션 */}
    <nav className="p-4">
      <ul className="space-y-2">
        {MENU_ITEMS.map((item) => (
          <SideBarMenuItem key={item.path} item={item} />
        ))}
      </ul>
    </nav>
  </aside>
  )
}

export default SideBar;
