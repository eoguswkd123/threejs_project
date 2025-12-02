import { Outlet } from 'react-router-dom';

import Footer from './Footer';
import SideBar from './SideBar';

const MainLayout = () => {
    return (
        <div className="flex h-screen flex-col bg-gray-50">
            {/* 상단 영역 (사이드바 + 메인 콘텐츠) */}
            <div className="flex flex-1">
                {/* 좌측 사이드바 */}
                <SideBar />

                {/* 우측 메인 콘텐츠 영역 */}
                <main className="flex-1 overflow-auto">
                    <div className="p-6">
                        <Outlet />
                    </div>
                </main>
            </div>

            {/* 하단 푸터 (전체 너비) */}
            <Footer />
        </div>
    );
};

export default MainLayout;
