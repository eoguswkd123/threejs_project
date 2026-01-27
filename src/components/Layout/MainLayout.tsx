import { Outlet } from 'react-router-dom';

import { Footer } from './Footer';
import { MobileDrawer } from './MobileDrawer';
import { MobileHeader } from './MobileHeader';
import { SideBar } from './SideBar';

const MainLayout = (): JSX.Element => {
    return (
        <div className="flex h-screen flex-col bg-gray-50">
            {/* 모바일 헤더 (md 미만에서만 표시) */}
            <MobileHeader />

            {/* 모바일 드로어 (오버레이 메뉴) */}
            <MobileDrawer />

            {/* 상단 영역 (사이드바 + 메인 콘텐츠) */}
            <div className="flex flex-1 overflow-hidden">
                {/* 좌측 사이드바 (md 이상에서만 표시) */}
                <SideBar />

                {/* 우측 메인 콘텐츠 영역 */}
                <main className="flex-1 overflow-auto">
                    <Outlet />
                </main>
            </div>

            {/* 하단 푸터 (전체 너비) */}
            <Footer />
        </div>
    );
};

export default MainLayout;
