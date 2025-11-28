# Architecture

CAD Viewer 프로젝트 아키텍처 및 패키지 구조

## 전체 시스템 흐름

CAD 도면 → 3D 건축물 뷰어 데이터 플로우

```
+------------------------------------------------------------------------------+
|                            CAD Viewer Architecture                           |
|                                                                              |
|    [Frontend]                [Backend]                    [Storage]          |
|                                                                              |
|   +-----------+           +-----------+              +-----------------+     |
|   | 1. CAD    |  upload   | 2. File   |   save       |       DB        |     |
|   |   Upload  | --------> |   Receive | -----------> |   (metadata)    |     |
|   +-----------+           +-----+-----+              +-----------------+     |
|                                 |                                            |
|                                 v                                            |
|                           +-----------+              +-----------------+     |
|                           | 3. Parse  |   save       |     Storage     |     |
|                           |   (DXF)   | -----------> |   (3D model)    |     |
|                           +-----+-----+              +-----------------+     |
|                                 |                                            |
|                                 v                                            |
|                           +-----------+                                      |
|                           | 4. Convert|                                      |
|                           |  (2D->3D) |                                      |
|                           +-----+-----+                                      |
|                                 |                                            |
|                                 v                                            |
|   +-----------+   JSON    +-----------+                                      |
|   | 6. Render | <-------- | 5. Return |                                      |
|   | (Three.js)|           |   (JSON)  |                                      |
|   +-----------+           +-----------+                                      |
|                                                                              |
+------------------------------------------------------------------------------+
```

### 단계별 설명

| 단계 | 위치 | 설명 |
|------|------|------|
| **1. CAD 파일 업로드** | 프론트엔드 | 사용자가 DXF/DWG 파일 선택 |
| **2. CAD 파일 수신** | 백엔드 | 파일 수신 및 메타데이터 DB 저장 |
| **3. 도면 분석 (파싱)** | 백엔드 | DXF 파싱, 엔티티 추출, 레이어 분리 |
| **4. 3D 모델 생성** | 백엔드 | 2D → 3D 변환 (벽 두께, 높이 등) |
| **5. JSON 반환** | 백엔드 | Three.js 호환 지오메트리 데이터 |
| **6. 3D 렌더링** | 프론트엔드 | Three.js로 3D 시각화 |

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
│   └── (images, fonts)
│
├── components/            # 공통 컴포넌트
│   ├── Layout/            # 레이아웃 (MainLayout, SideBar, Footer)
│   └── common/            # 공통 UI (Button, Input, Toast, Modal)
│
├── config/                # 전역 설정
│   └── index.ts           # APP, ENV, UPLOAD, SYNC 설정
│
├── constants/             # 상수
│   ├── app.ts             # 앱 상수
│   ├── routes.ts          # 라우트 경로
│   └── menu.ts            # 메뉴 설정
│
├── features/              # 도메인 기능 모듈
│   ├── three-core/        # Three.js 베이스 엔진
│   │   ├── components/    # Scene, 기본 도형
│   │   ├── config/        # Three.js 설정
│   │   ├── hooks/         # useThree
│   │   └── utils/         # 순수 함수 (React 없음, 10줄 이하, 선택)
│   │
│   ├── cad-renderer/      # CAD 3D 렌더링
│   │   ├── components/    # CadScene, CadMesh, LayerPanel
│   │   └── hooks/         # useCADLoader, useSelection
│   │
│   ├── cad-processor/     # CAD 데이터 처리
│   │   ├── parser/        # DXF 파싱
│   │   ├── converter/     # 2D→3D 변환
│   │   └── hooks/         # useParser, useConverter
│   │
│   └── sync/              # 동기화 기능
│       ├── components/
│       └── hooks/
│
├── hooks/                 # 전역 훅
│   └── useSync.ts         # 동기화 훅 (여러 feature에서 사용)
│
├── locales/               # 다국어
│   ├── ko.json
│   └── en.json
│
├── pages/                 # 페이지 컴포넌트
│   ├── CadViewer/         # CAD 뷰어 페이지
│   ├── KioskDisplay/      # 키오스크 디스플레이
│   └── ThreeDemo/         # Three.js 데모
│
├── routes/                # 라우팅
│   └── root.tsx
│
├── services/              # 복잡한 로직 (React 없음, 클래스/엔진, 10줄 이상)
│   ├── common/            # 전역 공유 로직
│   │   ├── storage/       # 로컬스토리지, IndexedDB 래퍼
│   │   ├── cache/         # 캐싱 엔진
│   │   └── validator/     # 복잡한 검증 로직
│   │
│   ├── cad/               # CAD 처리
│   │   ├── parser/        # DXF 파싱
│   │   └── converter/     # Three.js 변환
│   │
│   └── sync/              # 동기화 엔진
│       ├── transports/    # WebSocket, WebRTC
│       └── SyncEngine.ts
│
├── utils/                 # 순수 함수 (React 없음, 10줄 이하)
│   ├── format.ts          # 포맷팅 (파일크기, 날짜)
│   ├── validation.ts      # 검증 (파일, 이메일)
│   └── async.ts           # 비동기 (debounce, throttle)
│
├── stores/                # Zustand 상태 관리
│   ├── cadStore.ts        # CAD 상태
│   ├── viewerStore.ts     # 뷰어 상태
│   └── syncStore.ts       # 동기화 상태
│
├── styles/                # 전역 스타일
│   └── global.css
│
└── types/                 # 타입 정의
    ├── cad.ts
    ├── viewer.ts
    └── sync.ts
```

## 레이어별 역할

| 레이어 | 역할 | 의존성 |
|--------|------|--------|
| `api/` | API 통신 레이어 (Axios 인스턴스) | config |
| `assets/` | 정적 리소스 (이미지, 폰트) | - |
| `components/` | 공통 재사용 UI (Layout, Button, Modal) | - |
| `config/` | 전역 설정 (APP, ENV, UPLOAD) | - |
| `constants/` | 상수 정의 (routes, menu, app) | - |
| `features/` | 도메인 기능 모듈 (components, hooks, utils) | services, stores |
| `hooks/` | 전역 훅 (여러 feature에서 공유) | stores, services |
| `locales/` | 다국어 리소스 (ko, en) | - |
| `pages/` | 페이지 조합 (라우트별) | features, components |
| `routes/` | 라우팅 설정 | pages |
| `services/` | 복잡한 로직 (React 없음, 클래스/엔진, 10줄 이상) | types만 |
| `stores/` | Zustand 전역 상태 | types만 |
| `styles/` | 전역 스타일 (CSS) | - |
| `types/` | 타입/인터페이스 정의 | - |
| `utils/` | 순수 함수 (React 없음, 10줄 이하) | - |
