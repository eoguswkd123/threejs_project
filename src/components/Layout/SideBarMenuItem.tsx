import { NavLink } from 'react-router-dom';
import type { MenuItem as MenuItemType } from '@constants/menu';

interface SideBarMenuItemProps {
    item: MenuItemType;
}

const SideBarMenuItem = ({ item }: SideBarMenuItemProps) => {
    return (
        <li>
            <NavLink
                to={item.path}
                className={({ isActive }) =>
                    `flex items-center px-4 py-3 rounded-lg transition-colors ${
                        isActive
                            ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                            : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                    }`
                }
            >
                <item.icon className="w-5 h-5 mr-3" />
                <div>
                    <div className="font-medium">{item.label}</div>
                    <div className="text-xs text-gray-500">{item.description}</div>
                </div>
            </NavLink>
        </li>
    );
};

export default SideBarMenuItem;
