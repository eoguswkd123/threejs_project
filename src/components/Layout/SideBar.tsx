import { Link } from 'react-router-dom';

import { APP_CONFIG, MENU_ITEMS, ROUTES } from '@/constants';

import SideBarMenuItem from './SideBarMenuItem';

const SideBar = () => {
    return (
        <aside className="w-64 border-r border-gray-200 bg-white shadow-lg">
            {/* 로고 섹션 */}
            <Link
                to={ROUTES.HOME}
                className="block border-b border-gray-200 p-6 transition-colors hover:bg-gray-50"
            >
                <h1 className="text-xl font-bold text-gray-800">
                    {APP_CONFIG.NAME}
                </h1>
                <p className="text-sm text-gray-600">
                    {APP_CONFIG.DESCRIPTION}
                </p>
            </Link>

            {/* 메뉴 섹션 */}
            <nav className="p-4">
                <ul className="space-y-2">
                    {MENU_ITEMS.map((item) => (
                        <SideBarMenuItem key={item.path} item={item} />
                    ))}
                </ul>
            </nav>
        </aside>
    );
};

export default SideBar;
