# Three.js Teapot Demo Implementation

> Phase 1.5: Three.js Learning - Teapot Wireframe Example

## Overview

Three.js 공식 예제인 [webgl_geometry_teapot](https://threejs.org/examples/#webgl_geometry_teapot)을 React Three Fiber 기반으로 구현한 인터랙티브 Teapot 데모입니다.

## Implementation Summary

| 항목        | 결정 사항                                                     |
| ----------- | ------------------------------------------------------------- |
| 프레임워크  | React Three Fiber (R3F)                                       |
| GUI 방식    | HTML Overlay (Tailwind CSS)                                   |
| 상태 관리   | useState (로컬 상태)                                          |
| 폴더 규칙   | PascalCase (DEV_GUIDE.md 준수)                                |
| 쉐이딩 모드 | 6가지 (wireframe, flat, smooth, glossy, textured, reflective) |

## Architecture

### Directory Structure

```
src/
├── features/
│   └── TeapotDemo/
│       ├── components/
│       │   ├── TeapotMesh.tsx      # 3D 메시 렌더링
│       │   ├── TeapotControls.tsx  # HTML 오버레이 컨트롤
│       │   └── TeapotScene.tsx     # Scene 구성 래퍼
│       ├── hooks/
│       │   └── useTeapotMaterial.ts # Material 생성 훅
│       ├── types.ts                 # 타입 정의
│       ├── constants.ts             # 상수 정의
│       └── index.ts                 # Public exports
└── pages/
    └── TeapotDemo/
        └── index.tsx                # 페이지 컴포넌트
```

### 컴포넌트 계층 구조 (Component Hierarchy)

```
TeapotDemoPage                          [custom] 페이지 컴포넌트
└── TeapotScene                         [custom] 씬 컨테이너
    ├── Canvas                          [@react-three/fiber] 3D 캔버스
    │   ├── PerspectiveCamera           [@react-three/drei] 원근 카메라
    │   ├── OrbitControls               [@react-three/drei] 궤도 컨트롤
    │   ├── ambientLight                [R3F built-in] 환경광
    │   ├── directionalLight (x2)       [R3F built-in] 직사광
    │   ├── TeapotMesh                  [custom] 주전자 메시
    │   │   └── TeapotGeometry          [three/addons] 주전자 형상
    │   └── gridHelper                  [R3F built-in] 바닥 그리드
    └── TeapotControls                  [custom / HTML] UI 컨트롤 패널
```

**범례:**

- `[custom]` - 직접 구현한 컴포넌트
- `[@react-three/fiber]` - R3F 코어
- `[@react-three/drei]` - R3F 헬퍼 라이브러리
- `[R3F built-in]` - Three.js 객체 (R3F에서 JSX로 사용)
- `[three/addons]` - Three.js 확장 모듈

## Features

### 1. Shading Modes (6가지)

| 모드         | Material             | 설명                |
| ------------ | -------------------- | ------------------- |
| `wireframe`  | MeshBasicMaterial    | 와이어프레임만 표시 |
| `flat`       | MeshPhongMaterial    | Flat shading        |
| `smooth`     | MeshStandardMaterial | Smooth shading      |
| `glossy`     | MeshPhysicalMaterial | 광택 있는 표면      |
| `textured`   | MeshStandardMaterial | 체커보드 텍스처     |
| `reflective` | MeshStandardMaterial | 환경 반사           |

### 2. Interactive Controls

- **Tessellation**: 1-50 범위 슬라이더 (기본값: 15)
- **Shading Mode**: 6가지 모드 선택
- **Visibility**: Lid/Body/Bottom 개별 토글
- **Auto Rotate**: Y축 자동 회전

### 3. Camera & Navigation

- OrbitControls로 자유로운 카메라 조작
- 마우스 드래그: 회전
- 휠 스크롤: 줌
- 우클릭 드래그: 팬

## Key Implementation Details

### TeapotGeometry Import

```typescript
import { TeapotGeometry } from 'three/addons/geometries/TeapotGeometry.js';
```

### Material Optimization (useMemo)

```typescript
const material = useMemo(() => {
    switch (shadingMode) {
        case 'wireframe':
            return new THREE.MeshBasicMaterial({ wireframe: true });
        case 'smooth':
            return new THREE.MeshStandardMaterial({ roughness: 0.5 });
        // ... 기타 모드
    }
}, [shadingMode]);
```

### Performance Considerations

- `React.memo`로 불필요한 리렌더링 방지
- `useMemo`로 Material/Geometry 캐싱
- HTML Overlay로 3D 렌더링과 UI 분리

## Configuration

### Default Values

```typescript
export const DEFAULT_TEAPOT_CONFIG: TeapotConfig = {
    tessellation: 15,
    shadingMode: 'smooth',
    showLid: true,
    showBody: true,
    showBottom: true,
    autoRotate: true,
};
```

### Type Definitions

```typescript
export type ShadingMode =
    | 'wireframe'
    | 'flat'
    | 'smooth'
    | 'glossy'
    | 'textured'
    | 'reflective';

export interface TeapotConfig {
    tessellation: number;
    shadingMode: ShadingMode;
    showLid: boolean;
    showBody: boolean;
    showBottom: boolean;
    autoRotate: boolean;
}
```

## Routes

| Path           | Component      | Description        |
| -------------- | -------------- | ------------------ |
| `/teapot-demo` | TeapotDemoPage | Teapot 데모 페이지 |

## Dependencies

- `three` - TeapotGeometry 포함
- `@react-three/fiber` - React Three Fiber
- `@react-three/drei` - OrbitControls, PerspectiveCamera

## Testing Checklist

- ✅ 6가지 쉐이딩 모드 전환 확인
- ✅ Tessellation 슬라이더 동작 확인
- ✅ Lid/Body/Bottom 토글 동작 확인
- ✅ Auto Rotate 기능 확인
- ✅ OrbitControls 카메라 조작 확인
- ✅ 반응형 레이아웃 확인

## References

- [Three.js Teapot Example](https://threejs.org/examples/#webgl_geometry_teapot)
- [React Three Fiber Documentation](https://docs.pmnd.rs/react-three-fiber)
- [DEV_GUIDE.md](../DEV_GUIDE.md) - 폴더 명명 규칙

---

_Phase 2A Implementation - Created: 2025-12-01_
