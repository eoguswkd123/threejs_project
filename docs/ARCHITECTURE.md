# Architecture

> **Version**: 0.1.3
> **Last Updated**: 2025-12-04

CAD Viewer 프로젝트의 시스템 아키텍처와 패키지 구조를 설명합니다.

## 목차

- [전체 시스템 흐름](#전체-시스템-흐름)
- [아키텍처 개요](#아키텍처-개요)
- [패키지 구조](#패키지-구조)
- [레이어별 역할](#레이어별-역할)

---

## 전체 시스템 흐름

CAD 도면 → 3D 건축물 뷰어 데이터 플로우

```
                            <<< [1] Upload DXF >>>
                                     |
                                     v
+---------------+            +------------------+            +------------------+
|   FRONTEND    |            |     BACKEND      |            |   FILE SERVER    |
|   - - - - -   |            |   - - - - - -    |            |   - - - - - -    |
|               |            |                  |            |                  |
| +-----------+ |   [2]      | +------------+   |   [3]      | +------------+   |
| |  Upload   |===========>>>| |  Analyze   |===============>| | DXF File   |   |
| |   DXF     | |  Request   | |    DXF     |   |  Request   | +------------+   |
| +-----------+ |            | +-----+------+   |            |       |          |
|               |            |       ^         |   [4]       |       |          |
+---------------+            |       |         |<<<================= |          |
                             |       | [5]     |  Download   |                  |
                             |       | Parse   |            | +------------+   |
                             |       |         |   [6]      | | 3D File    |   |
                             | +-----v------+  |   Save     | | (JSON)     |   |
                             | |  3D Model  |===============>| +-----+------+   |
                             | |  Generate  |  |            |       |          |
                             | +------------+  |            +-------|----------+
                             +------------------+                   |
                                                                    |
                                                                    |
                                                        <<< [7] Download >>>
                                                                    |
+-------------------------------------------------------------------|----------+
|   KIOSK                                                           v          |
|                                                                              |
|          +------------------+                         +------------------+   |
|          |   3D Rendering   |                         |    Download      |   |
|          |    (Three.js)    |<========================|    3D File       |   |
|          +------------------+                         +------------------+   |
|                                                                              |
+------------------------------------------------------------------------------+
```

### 단계별 설명

| 단계             | 위치                    | 설명                      |
| ---------------- | ----------------------- | ------------------------- |
| **[1] Upload**   | 프론트엔드              | 사용자가 DXF 파일 업로드  |
| **[2] Request**  | 프론트엔드 → 백엔드     | 도면 생성 요청            |
| **[3] Request**  | 백엔드 → 첨부파일서버   | 원본 도면 파일 요청       |
| **[4] Download** | 첨부파일서버 → 백엔드   | 도면 파일 다운로드        |
| **[5] Parse**    | 백엔드                  | DXF 파싱                  |
| **[6] Save**     | 백엔드 → 첨부파일서버   | 3D JSON 파일 저장         |
| **[7] Download** | 첨부파일서버 → 키오스크 | 파싱된 3D 데이터 다운로드 |
| **Render**       | 키오스크                | Three.js로 3D 시각화      |

---

## 학습 예제와 실제 구현

Teapot Demo는 CAD Viewer의 핵심 패턴을 학습하기 위한 예제입니다.

### 비교 다이어그램

```
┌─────────────────────────────────────────────────────────────────┐
│  Teapot Demo (학습용)                                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   TeapotGeometry   →   Material   →   Mesh   →   Scene         │
│   (Three.js 내장)      (6가지 모드)    (렌더링)    (Controls)    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                              ↓ 패턴 재사용
┌─────────────────────────────────────────────────────────────────┐
│  CAD Viewer (Phase 2A 완료)                                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   DXF 업로드  →  Parser  →  Geometry  →  Mesh  →  Scene        │
│   (사용자 파일)  (dxf-parser) (동적 생성)  (렌더링)  (Controls)  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 패턴 재사용

| 학습 (Teapot)        | 실제 (CAD)                  | 재사용 요소        |
| -------------------- | --------------------------- | ------------------ |
| TeapotGeometry       | dxf-parser → BufferGeometry | Geometry 처리 패턴 |
| MeshStandardMaterial | LineBasicMaterial           | Material 시스템    |
| OrbitControls        | 동일                        | 카메라 제어        |
| React Three Fiber    | 동일                        | 렌더링 프레임워크  |

> **참고**: Teapot Demo 상세 구현은 [1.5_TEAPOT_DEMO.md](./phases/01-Foundation/1.5_TEAPOT_DEMO.md) 참조

---

## 아키텍처 개요

Layer-Based Architecture를 채택하여 관심사 분리와 의존성 방향을 명확히 합니다.

```
Pages → Features → Services → Types
         ↓
      Components
         ↓
       Stores
```

## 패키지 구조

```
src/
├── api/                   # API 레이어
│   └── apiCaller.ts       # Axios 인스턴스
│
├── assets/                # 정적 리소스
│
├── components/            # 공통 컴포넌트
│   └── Layout/            # MainLayout, SideBar, Footer
│
├── config/                # 전역 설정
│   ├── index.ts           # APP, ENV 설정
│   └── api.ts             # API 설정
│
├── constants/             # 상수
│   ├── app.ts             # 앱 상수
│   ├── routes.ts          # 라우트 경로
│   └── menu.ts            # 메뉴 설정
│
├── features/              # 도메인 기능 모듈
│   ├── TeapotDemo/        # Three.js 학습 예제
│   │   ├── components/    # TeapotScene, TeapotMesh, TeapotControls
│   │   ├── hooks/         # useTeapotMaterial
│   │   ├── constants.ts
│   │   ├── types.ts
│   │   └── index.ts
│   └── CADViewer/         # DXF 파일 3D 뷰어 (Phase 2A 완료)
│       ├── components/    # CADScene, CADMesh, FileUpload, LayerPanel
│       ├── hooks/         # useDXFParser, useDXFWorker
│       │   └── __tests__/ # useDXFParser.test.ts
│       ├── utils/         # dxfToGeometry, validators
│       │   └── __tests__/ # dxfToGeometry.test.ts, validators.test.ts
│       ├── workers/       # WebWorker (대용량 파일 파싱)
│       ├── constants.ts
│       ├── types.ts
│       └── index.ts
│
├── hooks/                 # 전역 훅
│   └── index.ts
│
├── locales/               # 다국어
│   ├── ko.json
│   └── en.json
│
├── pages/                 # 페이지 컴포넌트
│   ├── Home/              # 홈 페이지
│   ├── TeapotDemo/        # Teapot 데모 페이지
│   └── CADViewer/         # CAD 뷰어 페이지
│
├── routes/                # 라우팅
│   └── root.tsx
│
├── services/              # 복잡한 로직 (React 없음, 클래스/엔진, 10줄 이상)
│   └── index.ts
│
├── stores/                # Zustand 상태 관리
│   └── index.ts
│
├── styles/                # 전역 스타일
│   └── global.css
│
├── types/                 # 타입 정의
│   ├── menu.ts            # 메뉴 타입
│   └── index.ts
│
└── utils/                 # 순수 함수 (React 없음, 10줄 이하)
    └── index.ts

tests/                     # 테스트 관련 파일 (배포 번들 제외)
├── fixtures/              # 테스트용 데이터
│   └── dxf/               # DXF 테스트 파일
└── scripts/               # 테스트/성능 측정 스크립트
```

## 레이어별 역할

| 레이어             | 역할                                                 | 의존성               |
| ------------------ | ---------------------------------------------------- | -------------------- |
| `api/`             | API 통신 레이어 (Axios 인스턴스)                     | config               |
| `assets/`          | 정적 리소스 (이미지, 폰트)                           | -                    |
| `components/`      | 공통 재사용 UI (Layout)                              | -                    |
| `config/`          | 전역 설정 (APP, ENV, API)                            | -                    |
| `constants/`       | 상수 정의 (routes, menu, app)                        | -                    |
| `features/`        | 도메인 기능 모듈 (components, hooks, data)           | stores               |
| `features/*/data/` | 도메인 정적 데이터셋 (형상, 샘플 데이터)             | types만              |
| `hooks/`           | 전역 훅                                              | stores               |
| `locales/`         | 다국어 리소스 (ko, en)                               | -                    |
| `pages/`           | 페이지 조합 (라우트별)                               | features, components |
| `routes/`          | 라우팅 설정                                          | pages                |
| `services/`        | 복잡한 로직 (React 없음, 클래스/엔진, 10줄 이상)     | types만              |
| `stores/`          | Zustand 전역 상태                                    | types만              |
| `styles/`          | 전역 스타일 (CSS)                                    | -                    |
| `types/`           | 타입/인터페이스 정의                                 | -                    |
| `utils/`           | 순수 함수 (React 없음, 10줄 이하)                    | -                    |
| `tests/`           | 테스트 데이터(fixtures) 및 스크립트 (배포 번들 제외) | -                    |

---

## 관련 문서

| 문서                                                     | 설명                        |
| -------------------------------------------------------- | --------------------------- |
| [ROADMAP.md](./ROADMAP.md)                               | 개발 일정 및 마일스톤       |
| [DEV_GUIDE.md](./DEV_GUIDE.md)                           | 개발 가이드 및 컨벤션       |
| [GIT_CONVENTIONS.md](./GIT_CONVENTIONS.md)               | Git 워크플로우 및 커밋 규칙 |
| [GLOSSARY.md](./GLOSSARY.md)                             | 용어 및 약어 정의           |
| [phases/PHASE_NAV_GUIDE.md](./phases/PHASE_NAV_GUIDE.md) | Phase별 구현 문서 가이드    |

---

## Changelog (변경 이력)

| 버전  | 날짜       | 변경 내용                                                    |
| ----- | ---------- | ------------------------------------------------------------ |
| 0.1.3 | 2025-12-04 | 삭제된 PHASE_DEV_DOC_GUIDE.md 참조 제거                      |
| 0.1.2 | 2025-12-03 | Phase 2A 완료 반영, CADViewer 테스트 디렉토리 추가           |
| 0.1.1 | 2025-12-02 | Phase개발 템플릿 개발완료                                    |
| 0.1.0 | 2025-12-01 | 아키텍처 문서 업데이트, CAD Viewer 기능 추가                 |
| 0.0.0 | 2025-11-28 | 초기 버전, 로드맵/아키텍처/깃컨벤션 문서가이드 정리          |
