# CAD Viewer Project

Three.js 기반 CAD 파일 3D 뷰어 및 키오스크 동기화 프로젝트

## 현재 단계

**Phase 2A: CAD Features (Frontend)** - 진행 중

- Phase 1 (Foundation) - 완료
- Phase 2A (CAD Features) - 진행 중
- Phase 2B~7 (Backend, Sync, Production) - 계획됨

## 기술 스택

| 영역      | 기술                                      |
| --------- | ----------------------------------------- |
| Framework | React 18.3 + TypeScript 5.6 (strict)      |
| 3D Engine | Three.js 0.181 + React Three Fiber + Drei |
| Build     | Vite 6                                    |
| State     | Zustand 5                                 |
| Styling   | Tailwind CSS 4 + PostCSS                  |
| Forms     | React Hook Form + Zod                     |
| API       | Axios + TanStack Query 5                  |
| Testing   | Vitest + Testing Library                  |
| Lint      | ESLint 9 + Prettier 3.6                   |

## 아키텍처

### Feature-First 구조

```
src/
├── features/           # 기능별 독립 모듈
│   ├── CADViewer/     # DXF 파일 뷰어 (주요 기능)
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── utils/
│   │   ├── workers/
│   │   ├── types.ts
│   │   └── constants.ts
│   └── TeapotDemo/    # Three.js 학습 예제
├── components/Layout/  # 공유 레이아웃 컴포넌트
├── pages/             # 페이지 컴포넌트
├── config/            # 설정 (API, 환경변수)
├── constants/         # 상수 (routes, menu, app)
├── hooks/             # 글로벌 훅
├── stores/            # Zustand 스토어
├── types/             # 글로벌 타입
└── utils/             # 글로벌 유틸리티
```

### Import Alias

```typescript
// vite.config.ts & tsconfig.app.json 정의
import '@/'; // src/*
import '@api'; // src/api
import '@config'; // src/config
import '@features/*'; // src/features/*
import '@components/*'; // src/components/*
import '@hooks/*'; // src/hooks/*
import '@types/*'; // src/types/*
import '@constants/*'; // src/constants/*
```

### Barrel Export 패턴

```typescript
// features/CADViewer/index.ts
export { CADScene, CADMesh, FileUpload } from './components';
export { useDXFParser } from './hooks';
export type { ParsedCADData } from './types';
```

## 코드 컨벤션

### 네이밍 규칙

| 대상        | 규칙               | 예시               |
| ----------- | ------------------ | ------------------ |
| 컴포넌트    | PascalCase.tsx     | `CADScene.tsx`     |
| 훅          | use + camelCase.ts | `useDXFParser.ts`  |
| 유틸리티    | camelCase.ts       | `dxfToGeometry.ts` |
| 상수        | UPPER_SNAKE_CASE   | `FILE_LIMITS`      |
| 폴더 (기능) | PascalCase         | `CADViewer/`       |
| URL 경로    | kebab-case         | `/cad-viewer`      |

### 변수 네이밍

```typescript
// Boolean
(isLoading, hasError, canEdit);

// Handlers
(handleClick, handleFileSelect);

// Callbacks (Props)
(onClick, onSubmit, onChange);

// State setters
(setIsLoading, setCadData);
```

### Import 순서

```typescript
// 1. React
import { useState, useCallback } from 'react';

// 2. 외부 라이브러리
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';

// 3. 내부 imports (@/)
import { calculateBounds } from '@/features/CADViewer/utils';

// 4. 상대 경로
import { FileUpload } from './FileUpload';

// 5. 타입 (마지막)
import type { ParsedCADData } from '@/features/CADViewer/types';
```

## Three.js / R3F 패턴

### Canvas 구조

```tsx
<Canvas shadows>
    <PerspectiveCamera makeDefault position={[0, 0, 200]} fov={45} />
    <OrbitControls enableDamping dampingFactor={0.05} />

    {/* Lighting */}
    <ambientLight intensity={0.4} />
    <directionalLight position={[100, 100, 50]} castShadow />

    {/* Meshes */}
    <CADMesh cadData={data} config={config} />
</Canvas>
```

### Geometry 변환

```typescript
// DXF Entity → Three.js BufferGeometry
// 지원: LINE, CIRCLE, ARC, POLYLINE
import { linesToGeometry, cadDataToGeometry } from '@/features/CADViewer/utils';
```

### 성능 최적화

- **WebWorker**: 대용량 파일 비동기 파싱 (>2MB)
- **LOD**: 엔티티 수 기반 세그먼트 조절
- **Instancing**: 동일 지오메트리 재사용

## 개발 명령어

```bash
# 개발 서버
npm run dev

# 빌드
npm run build

# 코드 품질
npm run lint          # ESLint 검사
npm run lint:fix      # ESLint 자동 수정
npm run type-check    # TypeScript 검사

# 테스트
npm run test          # Vitest 실행
npm run test:coverage # 커버리지 리포트
```

## 주요 파일

| 파일                                            | 설명                                |
| ----------------------------------------------- | ----------------------------------- |
| `src/main.tsx`                                  | 앱 진입점                           |
| `src/App.tsx`                                   | 루트 컴포넌트 (Router, QueryClient) |
| `src/features/CADViewer/`                       | CAD 뷰어 기능 모듈                  |
| `src/features/CADViewer/hooks/useDXFParser.ts`  | DXF 파싱 훅                         |
| `src/features/CADViewer/utils/dxfToGeometry.ts` | 지오메트리 변환                     |
| `vite.config.ts`                                | Vite 설정 (alias, 플러그인)         |
| `tsconfig.app.json`                             | TypeScript 설정                     |

## 참고 문서

- `docs/ROADMAP.md` - 7단계 개발 로드맵
- `docs/ARCHITECTURE.md` - 시스템 아키텍처
- `docs/DEV_GUIDE.md` - 개발 컨벤션 상세
- `docs/GIT_CONVENTIONS.md` - Git 커밋 규칙

## 제약사항

- TypeScript strict mode 필수
- ESLint + Prettier 사전 커밋 훅 적용
- 백엔드 미연동 (Phase 2B 예정)
- 테스트 파일 작성 중
