import { Scene, Box } from '@features/three-core';

export default function ThreeDemo() {
  return (
    <div className="flex flex-col h-full">
      <div className="p-4 bg-gray-100 border-b">
        <h1 className="text-2xl font-bold">Three.js 3D 이미지 테스트</h1>
        <p className="text-gray-600 mt-1">
          회전하는 3D 박스들과 상호작용할 수 있습니다. 클릭하면 크기가 변하고, 마우스를 올리면 색상이 변합니다.
        </p>
      </div>

      <div className="flex-1">
        <Scene>
          <Box position={[-1.5, 0, 0]} color="#ff6b6b" />
          <Box position={[0, 0, 0]} color="#4ecdc4" />
          <Box position={[1.5, 0, 0]} color="#ffe66d" />
        </Scene>
      </div>
    </div>
  );
}
