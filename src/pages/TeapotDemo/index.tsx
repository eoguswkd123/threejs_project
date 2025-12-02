/**
 * TeapotDemo Page
 * Three.js Teapot 와이어프레임 예제 페이지
 */
import { TeapotScene } from '@/features/TeapotDemo';

export default function TeapotDemoPage() {
    return (
        <div className="w-full h-screen">
            <TeapotScene />
        </div>
    );
}
