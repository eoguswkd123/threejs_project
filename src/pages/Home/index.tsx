/**
 * Home Page
 * 대시보드 - 각 데모 페이지로 이동하는 카드 링크
 */
import { Coffee } from 'lucide-react';
import { Link } from 'react-router-dom';

import { ROUTES } from '@/constants/routes';

interface DemoCardProps {
    to: string;
    title: string;
    description: string;
    icon: React.ReactNode;
}

function DemoCard({ to, title, description, icon }: DemoCardProps) {
    return (
        <Link
            to={to}
            className="group hover:bg-gray-750 block rounded-lg border border-gray-700 bg-gray-800 p-6 transition-all duration-200 hover:border-blue-500"
        >
            <div className="mb-3 flex items-center gap-4">
                <div className="rounded-lg bg-blue-600/20 p-3 text-blue-400 transition-colors group-hover:bg-blue-600/30">
                    {icon}
                </div>
                <h3 className="text-lg font-semibold text-white transition-colors group-hover:text-blue-400">
                    {title}
                </h3>
            </div>
            <p className="text-sm text-gray-400">{description}</p>
        </Link>
    );
}

export default function HomePage() {
    return (
        <div className="min-h-full bg-gray-900 p-8">
            {/* Header */}
            <div className="mb-8">
                <h1 className="mb-2 text-3xl font-bold text-white">
                    Three.js 3D Viewer
                </h1>
                <p className="text-gray-400">3D 그래픽 데모 프로젝트</p>
            </div>

            {/* Demo Cards */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                <DemoCard
                    to={ROUTES.TEAPOT_DEMO}
                    title="Teapot Demo"
                    description="Utah Teapot 와이어프레임 예제. 6가지 쉐이딩 모드와 테셀레이션 조절을 지원합니다."
                    icon={<Coffee size={24} />}
                />
            </div>

            {/* Footer Info */}
            <div className="mt-12 border-t border-gray-800 pt-6">
                <p className="text-sm text-gray-500">
                    React Three Fiber 기반 3D 뷰어 프로젝트
                </p>
            </div>
        </div>
    );
}
