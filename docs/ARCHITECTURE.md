# Architecture

> **Version**: 1.0.1
> **Last Updated**: 2026-01-26

CAD Viewer 프로젝트의 시스템 아키텍처와 패키지 구조를 설명합니다.

## 목차

- [전체 시스템 흐름](#전체-시스템-흐름)
- [Frontend 아키텍처](#frontend-아키텍처)
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
│  CAD Viewer (Phase 2.1 완료)                                     │
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

> **참고**: Teapot Demo 상세 구현은 [1.2_THREEJS_DEMO_TEAPOT.md](./phases/01-Foundation/1.2_THREEJS_DEMO_TEAPOT.md) 참조

---

## 메시지 큐 아키텍처

> **결정**: RabbitMQ 선택 ([ADR-003](./adr/003_QUEUE_ALTERNATIVES_COMPARISON.md) 승인 완료)

### 선택 근거

| 평가 항목   | RabbitMQ 점수 | 주요 이점                           |
| ----------- | ------------- | ----------------------------------- |
| 메시지 보장 | 9/10          | Publisher Confirms + Outbox Pattern |
| 운영 복잡도 | 8/10          | Spring AMQP 성숙도, 풍부한 문서     |
| DLQ 지원    | 9/10          | 네이티브 Dead Letter Exchange       |
| 확장성      | 7/10          | 프로젝트 규모에 적합                |

### 메시지 플로우

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Backend   │────▶│  RabbitMQ   │────▶│   Worker    │
│   (API)     │     │   Broker    │     │  (Celery)   │
└─────────────┘     └─────────────┘     └─────────────┘
      │                   │                    │
      │  1. Publish       │  2. Route          │  3. Process
      │  (Confirms)       │  (Exchange)        │  (ACK/NACK)
      v                   v                    v
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Outbox    │     │    DLQ      │     │   Result    │
│   Table     │     │  (Retry)    │     │   Queue     │
└─────────────┘     └─────────────┘     └─────────────┘
```

### 주요 컴포넌트

| 컴포넌트 | 역할             | 설정                                   |
| -------- | ---------------- | -------------------------------------- |
| Exchange | 메시지 라우팅    | `cad.direct` (Direct), `cad.dlx` (DLX) |
| Queue    | 작업 대기열      | `cad.conversion`, `cad.notification`   |
| DLQ      | 실패 메시지 관리 | `cad.dlq` (max-retries: 3)             |

### 신뢰성 패턴

1. **Publisher Confirms**: 메시지 발행 확인
2. **Outbox Pattern**: 트랜잭션 원자성 보장
3. **Dead Letter Queue**: 실패 메시지 격리 및 재처리

> **상세 문서**: [ADR-003](./adr/003_QUEUE_ALTERNATIVES_COMPARISON.md)

---

## Python Worker 아키텍처

> **결정**: Python 3.12 + Celery + prefork pool ([ADR-004](./adr/004_PYTHON_WORKER_STACK.md) 승인 완료)

### Worker 분리 구조

| Worker         | 역할                            | 리소스 | 처리 시간 SLA |
| -------------- | ------------------------------- | ------ | ------------- |
| **DXF Worker** | 벡터 도면 변환 (ezdxf → glTF)   | CPU    | < 5초         |
| **PDF Worker** | ML 기반 도면 분석 (YOLO → glTF) | GPU    | < 30초        |

### 주요 컴포넌트

| 컴포넌트    | 선택    | 버전     |
| ----------- | ------- | -------- |
| Python      | 3.12    | 3.12.x   |
| Task Queue  | Celery  | >=5.5.0  |
| Worker Pool | prefork | GIL 우회 |
| 모니터링    | Flower  | >=2.0    |

> **상세 문서**: [ADR-004](./adr/004_PYTHON_WORKER_STACK.md)

---

## Frontend 아키텍처

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
│   ├── Common/            # 공통 UI (DropZone, LoadingSpinner, ErrorBoundary)
│   ├── FilePanel/         # 파일 업로드 패널 (FileUploadBox, SampleList, UrlInput)
│   ├── FilePanelViewer/   # 파일 패널 컴포지트 래퍼
│   ├── SceneCanvasViewer/ # 3D 씬 컴포지트 래퍼
│   ├── ControlPanel/      # 뷰어 제어 패널
│   └── Layout/            # MainLayout, SideBar, Footer
│
├── config/                # 전역 설정
│   ├── index.ts           # APP, ENV 설정
│   ├── api.ts             # API 설정
│   └── urlSecurity.ts     # URL 보안 설정 (SSRF 방지)
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
│   └── CadViewer/         # DXF 파일 3D 뷰어 (Phase 2.1 진행중)
│       ├── components/    # CadScene, CadMesh, LayerPanel
│       ├── hooks/         # useDxfParser, useDxfWorker, useDxfLoader
│       │   └── __tests__/ # useDxfParser.test.ts, useDxfWorker.test.ts, useDxfLoader.test.ts
│       ├── services/      # WebWorker 및 파싱 로직
│       │   ├── dxfParser.worker.ts  # DXF 파싱 워커
│       │   ├── entityParsers.ts     # 엔티티별 파싱 로직
│       │   └── entityMath.ts        # 기하학 계산 유틸
│       ├── types/         # 타입 정의 (구조화됨)
│       │   ├── dxfEntity/           # DXF 엔티티 타입 (base, library, parsed)
│       │   └── dxfWorkerMsg/        # Worker 메시지 타입
│       ├── utils/         # dxfToGeometry, dxfSamples
│       │   └── __tests__/ # dxfToGeometry.test.ts
│       ├── constants.ts
│       └── index.ts
│
├── hooks/                 # 전역 훅
│   ├── useMobileDrawer.ts # 모바일 드로어 상태
│   ├── useSceneControls.ts # 3D 씬 제어
│   ├── useUrlInput.ts     # URL 입력 검증
│   └── index.ts
│
├── locales/               # 다국어 (TypeScript)
│   ├── ko.ts              # 한국어 메시지
│   ├── en.ts              # 영어 메시지
│   └── index.ts           # 통합 export
│
├── pages/                 # 페이지 컴포넌트
│   ├── Home/              # 홈 페이지
│   ├── TeapotDemo/        # Teapot 데모 페이지
│   └── CadViewer/         # CAD 뷰어 페이지
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
└── utils/                 # 순수 함수 및 유틸리티
    ├── fileValidator.ts   # 파일 검증 (확장자, 크기, magic bytes)
    ├── urlValidator.ts    # URL 검증 (SSRF 방지)
    ├── errorClassifier.ts # 에러 분류
    ├── errorFormatter.ts  # 에러 메시지 포맷팅
    └── index.ts

tests/                     # 테스트 관련 파일 (배포 번들 제외)
├── mocks/                 # 테스트 모킹
│   ├── dxf-parser/        # DXF 파서 목 (fixtures, config)
│   ├── three.tsx          # Three.js/R3F 목
│   └── worker.ts          # WebWorker 목
├── integration/           # 통합 테스트
│   └── dxf-pipeline.test.ts
├── setup/                 # 테스트 설정
└── scripts/               # 테스트/성능 측정 스크립트
```

## 레이어별 역할

| 레이어                 | 역할                                                  | 의존성               |
| ---------------------- | ----------------------------------------------------- | -------------------- |
| `api/`                 | API 통신 레이어 (Axios 인스턴스)                      | config               |
| `assets/`              | 정적 리소스 (이미지, 폰트)                            | -                    |
| `components/`          | 공통 재사용 UI (Layout)                               | -                    |
| `config/`              | 전역 설정 (APP, ENV, API)                             | -                    |
| `constants/`           | 상수 정의 (routes, menu, app)                         | -                    |
| `features/`            | 도메인 기능 모듈 (components, hooks, services, types) | stores               |
| `features/*/services/` | 도메인 서비스 (Worker, 파싱 로직)                     | types만              |
| `hooks/`               | 전역 훅                                               | stores               |
| `locales/`             | 다국어 리소스 TypeScript (ko.ts, en.ts)               | -                    |
| `pages/`               | 페이지 조합 (라우트별)                                | features, components |
| `routes/`              | 라우팅 설정                                           | pages                |
| `services/`            | 복잡한 로직 (React 없음, 클래스/엔진, 10줄 이상)      | types만              |
| `stores/`              | Zustand 전역 상태                                     | types만              |
| `styles/`              | 전역 스타일 (CSS)                                     | -                    |
| `types/`               | 타입/인터페이스 정의                                  | -                    |
| `utils/`               | 순수 함수 및 유틸리티 (검증, 에러 처리)               | -                    |
| `tests/`               | 테스트 데이터(fixtures) 및 스크립트 (배포 번들 제외)  | -                    |

---

## 컴포넌트 아키텍처 패턴

### Composite Component 패턴

FilePanelViewer, SceneCanvasViewer, ControlPanelViewer는 여러 하위 컴포넌트를 통합하는 컴포지트 패턴을 사용합니다.

```
FilePanelViewer (composite)
├── FileUploadBox      # 파일 드래그앤드롭
├── SampleList         # 서버 샘플 목록
└── UrlInput           # URL 입력

SceneCanvasViewer (composite)
└── R3F Canvas         # 3D 렌더링 캔버스

ControlPanelViewer (composite)
├── ViewerActionButtons # 액션 버튼
├── GridToggle         # 그리드 토글
└── SpeedSlider        # 속도 조절
```

### 중앙화된 Validation 아키텍처

파일 및 URL 검증 로직을 `src/utils/`로 중앙화하여 재사용성과 보안을 강화합니다.

| 유틸리티             | 역할                                     |
| -------------------- | ---------------------------------------- |
| `fileValidator.ts`   | 파일 확장자, 크기, magic bytes 검증      |
| `urlValidator.ts`    | URL 형식, 허용 호스트, SSRF 방지 검증    |
| `errorClassifier.ts` | 에러 유형 분류 (network, parser, worker) |
| `errorFormatter.ts`  | 사용자 친화적 에러 메시지 생성           |

### URL Security (SSRF 방지)

`src/config/urlSecurity.ts`에서 허용된 호스트를 관리합니다.

```typescript
// 기본 허용 호스트
BASE_ALLOWED_HOSTS = [
  'localhost', '127.0.0.1',           // 개발 환경
  'github.com', 'raw.githubusercontent.com',  // GitHub
  'gitlab.com', 'bitbucket.org'       // 기타 Git 호스팅
]

// 환경별 정책
- Production: HTTPS만 허용
- Development: HTTP 허용
```

### ErrorBoundary 계층

에러 경계를 계층화하여 에러 격리와 복구를 지원합니다.

| ErrorBoundary         | 역할                    | 위치             |
| --------------------- | ----------------------- | ---------------- |
| `ViewerErrorBoundary` | 3D 뷰어 에러 격리       | 각 뷰어 컴포넌트 |
| `PanelErrorBoundary`  | 패널 컴포넌트 에러 격리 | FilePanel 등     |

---

## CadMesh 컴포넌트 아키텍처

DXF 엔티티 타입별로 전문화된 Mesh 컴포넌트를 제공합니다. Phase 2.1 완료 후 도입된 구조입니다.

### 컴포넌트 분리 구조

```
src/components/CadMesh/
├── index.ts              # Barrel export
├── types.ts              # 공통 타입 정의
├── WireframeMesh.tsx     # 선 지오메트리 (LINE, POLYLINE, LWPOLYLINE)
├── CurveMesh.tsx         # 곡선 (ARC, CIRCLE, ELLIPSE, SPLINE)
├── HatchMesh.tsx         # 2D 해치 패턴
├── Hatch3DMesh.tsx       # 3D 돌출 해치 (ExtrudeGeometry)
├── TextMesh.tsx          # 텍스트 (TEXT, MTEXT)
└── DimensionMesh.tsx     # 치수 주석 (DIMENSION)
```

### 엔티티-컴포넌트 매핑

| DXF 엔티티 타입            | Mesh 컴포넌트   | 렌더링 방식       |
| -------------------------- | --------------- | ----------------- |
| LINE, POLYLINE, LWPOLYLINE | `WireframeMesh` | LineBasicMaterial |
| ARC, CIRCLE                | `CurveMesh`     | 곡선 세그먼트     |
| ELLIPSE, SPLINE            | `CurveMesh`     | 보간 곡선         |
| HATCH (solid=false)        | `HatchMesh`     | 2D 패턴           |
| HATCH (solid=true)         | `Hatch3DMesh`   | ExtrudeGeometry   |
| TEXT, MTEXT                | `TextMesh`      | Drei Text         |
| DIMENSION                  | `DimensionMesh` | 선 + 텍스트 조합  |

### Services 계층 확장

```
src/features/CadViewer/services/
├── dxfParser.worker.ts   # DXF 파싱 WebWorker
├── entityParsers.ts      # 엔티티별 파싱 로직
├── entityMath.ts         # 기하학 계산 유틸리티
├── hatchParser.ts        # 해치→지오메트리 변환
└── workerPool.ts         # 워커 풀 관리 (병렬 처리)
```

### 신규 Feature 모듈

| Feature        | 경로                           | 설명                 |
| -------------- | ------------------------------ | -------------------- |
| WorkerViewer   | `src/features/WorkerViewer/`   | GLTF/glb 파일 렌더링 |
| HologramViewer | `src/features/HologramViewer/` | 홀로그램 효과 뷰어   |

---

## 관련 문서

| 문서                                                     | 설명                        |
| -------------------------------------------------------- | --------------------------- |
| [ROADMAP.md](./ROADMAP.md)                               | 전체 프로젝트 로드맵        |
| [DEV_GUIDE.md](./DEV_GUIDE.md)                           | 개발 가이드 및 컨벤션       |
| [GIT_CONVENTIONS.md](./GIT_CONVENTIONS.md)               | Git 워크플로우 및 커밋 규칙 |
| [GLOSSARY.md](./GLOSSARY.md)                             | 용어 및 약어 정의           |
| [phases/PHASE_NAV_GUIDE.md](./phases/PHASE_NAV_GUIDE.md) | Phase별 구현 문서 가이드    |

---

## Changelog (변경 이력)

| 버전  | 날짜       | 변경 내용                                                                                                                                  |
| ----- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| 1.0.1 | 2026-01-26 | "아키텍처 개요" 섹션명을 "Frontend 아키텍처"로 명확화 (실제 내용이 Frontend Layer Architecture임을 반영)                                   |
| 1.0.0 | 2026-01-15 | CadMesh 컴포넌트 아키텍처 섹션 추가, Services 계층 확장 (hatchParser, workerPool), 신규 Feature 모듈 문서화 (WorkerViewer, HologramViewer) |
| 0.1.8 | 2025-12-29 | 코드 동기화: CadViewer services/types 구조, Composite 패턴, Validation 아키텍처, locales TS 전환, 새 컴포넌트 반영                         |
| 0.1.7 | 2025-12-18 | CadViewer 폴더명 대소문자 수정, Phase 2.1 상태 동기화                                                                                      |
| 0.1.6 | 2025-12-16 | 깨진 링크 수정 (1.2_TEAPOT_DEMO→THREEJS_DEMO_TEAPOT, ADR-003→ADR-004)                                                                      |
| 0.1.5 | 2025-12-10 | Python Worker 아키텍처 섹션 추가 (ADR-003 승인 반영)                                                                                       |
| 0.1.4 | 2025-12-08 | 메시지 큐 아키텍처 섹션 추가 (ADR-002 승인 반영)                                                                                           |
| 0.1.3 | 2025-12-04 | 삭제된 PHASE_DEV_DOC_GUIDE.md 참조 제거                                                                                                    |
| 0.1.2 | 2025-12-03 | Phase 2.1 완료 반영, CADViewer 테스트 디렉토리 추가                                                                                        |
| 0.1.1 | 2025-12-02 | Phase개발 템플릿 개발완료                                                                                                                  |
| 0.1.0 | 2025-12-01 | 아키텍처 문서 업데이트, CAD Viewer 기능 추가                                                                                               |
| 0.0.0 | 2025-11-28 | 초기 버전, 로드맵/아키텍처/깃컨벤션 문서가이드 정리                                                                                        |
