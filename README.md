# CAD Viewer

Three.js 기반 CAD 파일 3D 뷰어 및 키오스크 동기화 프로젝트

[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.3-61dafb.svg)](https://reactjs.org/)
[![Three.js](https://img.shields.io/badge/Three.js-0.181-black.svg)](https://threejs.org/)
[![Vite](https://img.shields.io/badge/Vite-6.0-646cff.svg)](https://vitejs.dev/)

## 프로젝트 비전

**건축 도면 → 3D 모델 변환 → 키오스크 연동 시스템**

1. CAD 도면(DXF) 업로드 → 백엔드 3D 변환 → 파일서버 저장
2. JSON API로 프론트엔드에서 3D 모델 렌더링
3. 키오스크 연동 및 키오스크 간 실시간 동기화

## 현재 상태

| Phase | 이름                 | 상태    |
| ----- | -------------------- | ------- |
| 1     | Foundation           | ✅ 완료 |
| 1.5   | Three.js 학습        | ✅ 완료 |
| 2A    | CAD Features (FE)    | ✅ 완료 |
| 3-7   | Backend ~ Production | 📋 계획 |

> 자세한 로드맵은 [ROADMAP.md](./docs/ROADMAP.md) 참조

## 기술 스택

### Frontend

| 카테고리     | 기술                                |
| ------------ | ----------------------------------- |
| Framework    | React 18 + TypeScript 5.6           |
| Build        | Vite 6                              |
| 3D Rendering | Three.js (React Three Fiber + Drei) |
| State        | Zustand 5                           |
| Styling      | Tailwind CSS 4                      |
| Form         | React Hook Form + Zod               |
| API          | Axios + TanStack Query              |
| Router       | React Router 6                      |

### Development

| 카테고리   | 기술                     |
| ---------- | ------------------------ |
| Linting    | ESLint 9                 |
| Formatting | Prettier                 |
| Testing    | Vitest + Testing Library |
| Type Check | TypeScript strict mode   |

### Backend (계획)

| 카테고리    | 기술              |
| ----------- | ----------------- |
| Framework   | Python FastAPI    |
| Task Queue  | Celery + Redis    |
| Database    | PostgreSQL        |
| Storage     | MinIO (S3 호환)   |
| CAD Library | ezdxf + pygltflib |

## 프로젝트 구조

```
src/
├── api/              # API 레이어 (Axios 인스턴스, 엔드포인트)
├── assets/           # 정적 리소스 (이미지, 아이콘)
├── components/       # 공통 컴포넌트
│   └── Layout/       # 레이아웃 (MainLayout, SideBar, Footer)
├── config/           # 전역 설정
├── constants/        # 상수 정의
├── features/         # 도메인 기능 모듈
│   ├── TeapotDemo/   # Three.js 학습 예제
│   └── CADViewer/    # DXF 파일 3D 뷰어
├── hooks/            # 전역 커스텀 훅
├── locales/          # 다국어 (i18n)
├── pages/            # 페이지 컴포넌트
├── routes/           # 라우팅 설정
├── services/         # 비즈니스 로직
├── stores/           # Zustand 스토어
├── styles/           # 전역 스타일
├── types/            # TypeScript 타입 정의
└── utils/            # 유틸리티 함수
```

## 시작하기

### 요구사항

- Node.js 18+
- npm 9+

### 설치 및 실행

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev

# 브라우저에서 http://localhost:5173 접속
```

### 빌드

```bash
# 프로덕션 빌드
npm run build

# 빌드 결과물 미리보기
npm run preview
```

### 코드 품질

```bash
# 린트 검사
npm run lint

# 린트 자동 수정
npm run lint:fix

# 타입 검사
npm run type-check

# 테스트 실행
npm run test

# 테스트 UI 모드
npm run test:ui

# 테스트 커버리지
npm run test:coverage
```

## 주요 기능

### 구현 완료

- **Three.js Teapot 예제**: 와이어프레임/쉐이딩 학습 예제
- **GUI 컨트롤**: lil-gui 파라미터 조정 패널
- **카메라 제어**: OrbitControls 기본 컨트롤
- **CAD Viewer MVP**: DXF 파일 업로드/파싱
- **파일 검증**: 타입/크기 검증 (20MB 제한)
- **엔티티 확장**: LINE, ARC, CIRCLE, POLYLINE/LWPOLYLINE 지원
- **레이어 제어**: 레이어별 표시/숨김, DXF 색상 매핑
- **성능 최적화**: Geometry 머징, WebWorker, LOD
- **단위 테스트**: Vitest 58개 테스트 (utils 커버리지 98%)

### 개발 예정

- **키오스크 동기화**: WebSocket 기반 실시간 동기화
- **백엔드 연동**: CAD → glTF 변환 엔진

## 문서

| 문서                                            | 설명                         |
| ----------------------------------------------- | ---------------------------- |
| [ROADMAP.md](./docs/ROADMAP.md)                 | 개발 로드맵 (7 Phase, 9개월) |
| [ARCHITECTURE.md](./docs/ARCHITECTURE.md)       | 시스템 아키텍처              |
| [DEV_GUIDE.md](./docs/DEV_GUIDE.md)             | 개발자 가이드                |
| [GIT_CONVENTIONS.md](./docs/GIT_CONVENTIONS.md) | Git 커밋 규칙                |
| [GLOSSARY.md](./docs/GLOSSARY.md)               | 용어 및 약어 정의            |

## 라이선스

Private Project

---

> **Note**: 이 프로젝트는 활발히 개발 중입니다. Phase 2A 완료 (2025-12-03), Phase 3 백엔드 통합이 진행될 예정입니다.
