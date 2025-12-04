# 개발자 가이드

> **Version**: 0.1.3
> **Last Updated**: 2025-12-04

프로젝트 개발 시 참고하는 가이드 문서

## 목차

- [네이밍 컨벤션](#네이밍-컨벤션)
    - [파일/폴더](#파일폴더)
    - [변수/함수](#변수함수)
    - [타입/인터페이스](#타입인터페이스)
- [파일 가이드](#파일-가이드)
    - [빠른 판단 흐름도](#빠른-판단-흐름도)
    - [위치 판단 체크리스트](#위치-판단-체크리스트)
    - [페이지 전용 컴포넌트](#페이지-전용-컴포넌트)
- [코딩 스타일](#코딩-스타일)
    - [Import 순서](#import-순서)
    - [Feature 모듈 Import 패턴](#feature-모듈-import-패턴)
    - [컴포넌트 작성 패턴](#컴포넌트-작성-패턴)
    - [타입 정의 패턴](#타입-정의-패턴)
    - [Props 설계 가이드](#props-설계-가이드)
- [테스트 가이드](#테스트-가이드)
    - [테스트 실행](#테스트-실행)
    - [테스트 파일 구조](#테스트-파일-구조)
    - [성능 테스트](#성능-테스트)
- [코드 품질 도구](#코드-품질-도구)
    - [도구 개요](#도구-개요)
    - [수동 실행 명령어](#수동-실행-명령어)
    - [ESLint](#eslint---코드-품질-검사기)
    - [Prettier](#prettier---코드-포맷터)
    - [Husky](#husky---git-hooks-관리자)
    - [lint-staged](#lint-staged---스테이징-파일-전용-실행기)
    - [실행 흐름도](#실행-흐름도)
- [Git 워크플로우](#git-워크플로우)
    - [브랜치 전략](#브랜치-전략)
    - [커밋 메시지 규칙](#커밋-메시지-규칙)
- [TODO: 작성 예정 항목](#todo-작성-예정-항목)

---

## 네이밍 컨벤션

### 파일/폴더

| 대상           | 규칙                 | 예시                                 |
| -------------- | -------------------- | ------------------------------------ |
| 컴포넌트       | PascalCase.tsx       | `CadScene.tsx`                       |
| 훅             | use + camelCase.ts   | `useCADLoader.ts`                    |
| 유틸리티       | camelCase.ts         | `format.ts`                          |
| 타입           | camelCase.ts         | `cad.ts`                             |
| 스토어         | camelCase + Store.ts | `cadStore.ts`                        |
| 서비스         | camelCase.ts         | `syncEngine.ts`                      |
| 상수           | camelCase.ts         | `app.ts`, `routes.ts`                |
| 카테고리 폴더  | camelCase            | `components/`, `features/`, `hooks/` |
| 기능/모듈 폴더 | PascalCase           | `CADViewer/`, `Layout/`, `Home/`     |
| URL 경로       | kebab-case           | `/cad-viewer`, `/teapot-demo`        |

> **참고**: 폴더명(PascalCase)과 URL 경로(kebab-case)는 다른 규칙을 사용합니다.
> 이는 코드 컨벤션(JavaScript/React)과 웹 표준(RFC 3986, SEO)의 관심사 분리 원칙입니다.

### 변수/함수

| 유형        | 규칙              | 예시                               |
| ----------- | ----------------- | ---------------------------------- |
| 일반 변수   | camelCase         | `userName`, `fileSize`             |
| 상수        | UPPER_SNAKE_CASE  | `MAX_FILE_SIZE`, `API_URL`         |
| Boolean     | is/has/can + 상태 | `isLoading`, `hasError`, `canEdit` |
| 핸들러      | handle + 동작     | `handleClick`, `handleSubmit`      |
| 콜백 props  | on + 이벤트       | `onClick`, `onSubmit`, `onChange`  |
| 데이터 조회 | get/fetch + 대상  | `getUser`, `fetchData`             |
| 변환 함수   | to + 타입         | `toString`, `toJSON`, `toNumber`   |
| 상태 setter | set + 상태        | `setUserName`, `setIsLoading`      |

### 타입/인터페이스

#### 기본 타입

| 유형       | 규칙       | 예시                     |
| ---------- | ---------- | ------------------------ |
| 인터페이스 | PascalCase | `User`, `CadFile`        |
| 타입       | PascalCase | `Theme`, `Status`        |
| Enum       | PascalCase | `FileStatus`, `UserRole` |

#### 컴포넌트 관련

| 유형  | 규칙               | 예시                        |
| ----- | ------------------ | --------------------------- |
| Props | 컴포넌트명 + Props | `ButtonProps`, `ModalProps` |
| State | 컴포넌트명 + State | `FormState`, `AppState`     |

#### API 관련

| 유형     | 규칙                    | 예시                                |
| -------- | ----------------------- | ----------------------------------- |
| API 타입 | 설명 + Response/Request | `UserResponse`, `CreateUserRequest` |

#### 설정

| 유형   | 규칙          | 예시                       |
| ------ | ------------- | -------------------------- |
| Config | 대상 + Config | `AppConfig`, `ThemeConfig` |

## 파일 가이드

새 코드 작성 시 위치 결정과 프로젝트 특화 패턴 참고

### 빠른 판단 흐름도

```
새 코드 작성
    │
    ├─ React 컴포넌트?
    │   ├─ 1개 도메인 전용 → features/[도메인]/components/
    │   └─ 여러 곳에서 사용 → components/
    │
    ├─ React 훅?
    │   ├─ 1개 도메인 전용 → features/[도메인]/hooks/
    │   └─ 여러 곳에서 사용 → hooks/
    │
    ├─ 순수 함수? (React 의존성 없음)
    │   ├─ 1개 도메인 전용 → features/[도메인]/utils/
    │   ├─ 여러 곳에서 사용 → utils/
    │   └─ 복잡한 로직/클래스 → services/
    │
    ├─ 타입 정의?
    │   ├─ 1개 도메인 전용 → features/[도메인]/types.ts
    │   └─ 여러 곳에서 사용 → types/
    │
    ├─ 상수 정의?
    │   ├─ 1개 도메인 전용 → features/[도메인]/constants.ts
    │   └─ 여러 곳에서 사용 → constants/
    │
    ├─ 정적 데이터셋? (형상 데이터, 대용량 배열)
    │   └─ 1개 도메인 전용 → features/[도메인]/data/
    │
    ├─ 설정값? (환경변수 참조)
    │   └─ config/
    │
    ├─ 상태 관리? → stores/
    │
    ├─ CSS/스타일? → styles/
    │
    └─ 테스트 파일?
        ├─ 테스트 데이터 → tests/fixtures/
        └─ 테스트 스크립트 → tests/scripts/
```

### 위치 판단 체크리스트

#### Step 1: 도메인 범위 결정

> "이 코드가 특정 도메인(cad, sync, three 등)에서만 사용되나요?"

| 답변             | 컴포넌트                        | 훅                         | 순수 함수                  |
| ---------------- | ------------------------------- | -------------------------- | -------------------------- |
| 1개 도메인 전용  | `features/[도메인]/components/` | `features/[도메인]/hooks/` | `features/[도메인]/utils/` |
| 여러 곳에서 사용 | `components/`                   | `hooks/`                   | `utils/`                   |

#### Step 2: 복잡도 결정 (순수 함수인 경우)

> "복잡한 로직/클래스가 필요한가요?"

| 답변             | utils                      | services             |
| ---------------- | -------------------------- | -------------------- |
| 1개 도메인 전용  | `features/[도메인]/utils/` | `services/[도메인]/` |
| 여러 곳에서 사용 | `utils/`                   | `services/`          |

#### Step 3: 타입/상수/설정 구분

> "어떤 종류의 데이터인가요?"

| 폴더         | 용도          | 기준                            | 예시                                |
| ------------ | ------------- | ------------------------------- | ----------------------------------- |
| `types/`     | 타입 정의     | 컴파일타임, interface/type 선언 | `MenuItem`, `UserProfile`           |
| `constants/` | 고정 상수     | 런타임, 환경 무관 고정값        | `ROUTES`, `MENU_ITEMS`              |
| `data/`      | 정적 데이터셋 | 런타임, 대용량 형상/샘플 데이터 | `teapotVertices`, `sampleDxfData`   |
| `config/`    | 앱 설정       | 런타임, 환경변수 참조           | `API_CONFIG` (import.meta.env 사용) |

#### 판단 예시 모음

| 만들려는 코드               | Step 1    | Step 2 | 최종 위치                          |
| --------------------------- | --------- | ------ | ---------------------------------- |
| CAD 파일 3D 렌더링 컴포넌트 | cad 전용  | -      | `features/CadRenderer/components/` |
| 파일 업로드 상태 훅         | 전역      | -      | `hooks/useFileUpload.ts`           |
| 날짜 포맷팅 함수            | 전역      | 간단   | `utils/format.ts`                  |
| WebSocket 동기화 엔진       | sync 전용 | 클래스 | `services/sync/syncEngine.ts`      |

### 페이지 전용 컴포넌트

페이지에서만 사용되는 컴포넌트는 해당 페이지 폴더 내에 배치합니다.

> **근거**: Feature-First 아키텍처와 동일한 원칙 적용 (소유권 기반 배치)
> Next.js App Router, Remix 등 현대 프레임워크에서도 colocation 패턴 권장

#### 원칙

| 조건                         | 위치                 |
| ---------------------------- | -------------------- |
| 해당 페이지에서만 사용       | `pages/[Page]/`      |
| 2개+ 페이지/feature에서 사용 | `components/Common/` |

#### 구조 예시

```
pages/Home/
├── index.tsx        # HomePage (메인 컴포넌트)
└── DemoCard.tsx     # 페이지 전용 컴포넌트
```

#### 마이그레이션 규칙

1. **처음**: 페이지 내부에 정의 (작은 컴포넌트)
2. **파일 커지면**: 같은 폴더에 분리 (`pages/Home/DemoCard.tsx`)
3. **재사용 시**: `components/Common/`으로 이동 (일반화)

```
# 마이그레이션 경로
pages/Home/index.tsx (내부 정의)
    ↓ 파일 커짐
pages/Home/DemoCard.tsx (분리)
    ↓ 다른 곳에서 재사용
components/Common/Card.tsx (일반화)
```

---

## 코딩 스타일

### Import 순서

```typescript
// 1. React
import { useState, useCallback, useEffect } from 'react';

// 2. 외부 라이브러리
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

// 3. 내부 모듈 (path alias)
import { useCADStore, useViewerStore } from '@stores';
import { dxfParser } from '@services/cad';

// 4. 상대 경로
import { CadMesh } from './CadMesh';
import { ViewerControls } from './ViewerControls';

// 5. 타입 (type-only)
import type { CADFile } from '@types/cad';
import type { RenderMode } from '@types/viewer';
```

### Feature 모듈 Import 패턴

Feature 모듈(`features/[도메인]/`)의 import는 **내부**와 **외부**를 구분합니다.

> **참고**: 이 패턴은 **Feature-Sliced Design**, **Nx Monorepo**, **Angular Style Guide** 등에서 권장하는 업계 표준입니다.
> Barrel 파일(index.ts)은 공개 API를 정의하고, 내부 구현은 직접 경로로 참조합니다.

#### 원칙

| 컨텍스트              | Import 방식       | 이유                          |
| --------------------- | ----------------- | ----------------------------- |
| **내부** (feature 안) | 직접 상대 경로    | 순환 참조 방지, 명확한 의존성 |
| **외부** (pages 등)   | Barrel (index.ts) | 캡슐화, 공개 API              |

#### 올바른 예시

```typescript
// ✅ 내부 컴포넌트 (features/TeapotDemo/components/TeapotMesh.tsx)
import { useTeapotMaterial } from '../hooks/useTeapotMaterial';
import type { ShadingMode } from '../types';

// ✅ 외부 소비자 (pages/TeapotDemo/index.tsx)
import { TeapotScene } from '@/features/TeapotDemo';
```

#### 피해야 할 패턴

```typescript
// ❌ 내부에서 Barrel 사용 (순환 참조 위험!)
// features/TeapotDemo/components/TeapotMesh.tsx
import { useTeapotMaterial } from '..'; // index.ts에서 import
import { useTeapotMaterial } from '@/features/TeapotDemo'; // 동일한 문제
```

#### 왜 이렇게 하나요?

| 오해                              | 실제                                                       |
| --------------------------------- | ---------------------------------------------------------- |
| "중복 import 아닌가?"             | `export ... from`은 **re-export** (참조 통과), import 아님 |
| "번들에 두 번 포함?"              | JS 모듈은 **싱글톤** - 번들에 1번만 포함                   |
| "내부도 barrel 쓰면 편하지 않나?" | **순환 참조 위험** - 초기화 순서 문제 발생 가능            |

#### Feature 모듈 구조

```
features/[도메인]/
├── index.ts              # Barrel - 외부 공개 API (re-export)
├── components/           # 내부: ../hooks, ../types 등 직접 참조
│   └── Component.tsx
├── hooks/
│   └── useHook.ts
├── data/                 # 정적 데이터셋 (형상, 샘플 데이터)
│   ├── index.ts
│   └── [domain]Data.ts
├── types.ts              # 도메인 타입 정의
└── constants.ts          # 도메인 상수
```

### 컴포넌트 작성 패턴

```typescript
/**
 * 컴포넌트 설명
 */

// 1. Import
import { useState, useCallback, useEffect, useMemo, useRef } from 'react';

import { Canvas } from '@react-three/fiber';

import { DEFAULT_SIZE } from '@constants';
import { formatValue } from '@utils';
import { useCADStore } from '@stores';

import { LoadingPlaceholder } from './LoadingPlaceholder';

import type { CADFile } from '@types/cad';

// 2. 타입/인터페이스
// 2-1. 인터페이스 (객체 형태)
interface ComponentProps {
    className?: string;
}

// 2-2. 타입 (유니온, 별칭)
type Status = 'idle' | 'loading' | 'success' | 'error';

// 3. 컴포넌트
export function Component({ className }: ComponentProps) {
    // 3-1. Store 훅
    const data = useCADStore((state) => state.data);

    // 3-2. 로컬 상태 (useState)
    const [isOpen, setIsOpen] = useState(false);

    // 3-3. Ref (useRef)
    const inputRef = useRef<HTMLInputElement>(null);

    // 3-4. 계산된 값 (useMemo)
    const computed = useMemo(() => data.length, [data]);

    // 3-5. 핸들러 (useCallback)
    const handleClick = useCallback(() => {
        setIsOpen(true);
    }, []);

    // 3-6. 부수 효과 (useEffect)
    useEffect(() => {
        // 초기화
    }, []);

    // 3-7. 조건부 렌더링 (early return)
    if (!data) return <LoadingPlaceholder />;

    // 3-8. JSX 반환
    return (
        <div className={className}>
            {/* 내용 */}
        </div>
    );
}
```

### 타입 정의 패턴

```typescript
// Interface - 객체 형태
interface User {
    id: string;
    name: string;
}

// Interface - 다른 인터페이스를 타입으로 사용
interface Address {
    city: string;
    zipCode: string;
}

interface UserWithAddress {
    id: string;
    name: string;
    address: Address; // 인터페이스를 타입으로 사용
    subAddresses?: Address[]; // 배열로도 사용 가능
}

// 사용 예시
const user: UserWithAddress = {
    id: '1',
    name: 'Kim',
    address: { city: 'Seoul', zipCode: '12345' },
};

// Interface - 옵셔널 속성 (?)
interface UserProfile {
    id: string;
    name: string;
    email?: string;
}

// 사용 예시
const user1: UserProfile = { id: '1', name: 'Kim' }; // ✅ 생략
const user2: UserProfile = { id: '1', name: 'Kim', email: 'a@b.com' }; // ✅ 값 있음
const user3: UserProfile = { id: '1', name: 'Kim', email: null }; // ❌ null 불가

// Interface - 상속 (extends)
interface AdminUser extends User {
    role: 'admin';
    permissions: string[];
}

// Type - 유니온 (여러 값 중 하나)
type Status = 'idle' | 'loading' | 'error';

// Type - 객체 형태
type Point = {
    x: number;
    y: number;
    z?: number;
};

// Type - 인터섹션 (여러 타입 합치기)
type AdminWithTimestamp = AdminUser & {
    createdAt: Date;
    updatedAt: Date;
};
```

#### Props 설계 가이드

##### Optional vs Required 판단 기준

| 질문                                    | Yes → Optional | No → Required |
| --------------------------------------- | -------------- | ------------- |
| 이 prop 없이 컴포넌트가 의미 있나?      | ✅             | ❌            |
| 합리적인 기본값이 존재하나?             | ✅             | ❌            |
| 호출자가 "안 줘도 됨"을 의도할 수 있나? | ✅             | ❌            |

```tsx
// ✅ Optional 적합 - 기본 동작 가능
interface ButtonProps {
    label: string; // 필수 - 텍스트 없으면 버튼 의미 없음
    disabled?: boolean; // 선택 - 기본값 false
    variant?: 'primary' | 'secondary'; // 선택 - 기본 스타일 있음
}

// ❌ Optional 부적합 - 핵심 기능에 필수
interface DemoCardProps {
    hue: number; // 필수 - 색상 없으면 카드 목적 불명확
    title: string;
}
```

##### 배열 인덱싱과 타입 안전성

`tsconfig.json`의 `noUncheckedIndexedAccess: true` 설정으로 인해
배열 인덱싱은 항상 `T | undefined`를 반환합니다.

```tsx
const arr: number[] = [1, 2, 3];
const value = arr[0]; // 타입: number | undefined (항상)
```

**방어적 처리 패턴**:

```tsx
// ✅ 부모에서 fallback 처리 (권장)
<DemoCard hue={cardHues[index] ?? 0} />;

// 자식은 필수 props로 선언
interface DemoCardProps {
    hue: number;
}
```

**책임 분리 원칙**:

| 역할 | 책임                                           |
| ---- | ---------------------------------------------- |
| 부모 | 데이터 접근 안전성 (배열 인덱싱 `?? fallback`) |
| 자식 | 렌더링 (유효한 값 기대, 필수 props 선언)       |

---

## 테스트 가이드

### 테스트 실행 흐름도

```
npm run test
    │
    ▼
┌─────────────────────────────────────────────┐
│  vitest.config.ts                           │
│  ├─ environment: 'jsdom'                    │
│  ├─ setupFiles: vitest-setup.ts             │
│  └─ include patterns                        │
└─────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────┐
│  tests/setup/vitest-setup.ts (글로벌 설정)  │
│  ├─ @testing-library/jest-dom 로드          │
│  ├─ Canvas/WebGL 모킹                       │
│  ├─ ResizeObserver 모킹                     │
│  └─ requestAnimationFrame 모킹              │
└─────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────┐
│  테스트 파일들 실행                          │
│  ├─ src/**/__tests__/**/*.test.{ts,tsx}     │
│  └─ tests/integration/**/*.test.{ts,tsx}    │
└─────────────────────────────────────────────┘
```

### 테스트 구조 (Co-located 방식)

프로젝트는 **Co-located** 테스트 구조를 사용합니다. 단위 테스트는 소스 파일 옆에 위치하고, 공유 인프라는 `tests/` 폴더에 있습니다.

```
src/
├── features/CADViewer/
│   ├── utils/
│   │   ├── validators.ts
│   │   └── __tests__/               # 단위 테스트 (소스 옆)
│   │       └── validators.test.ts
│   └── hooks/
│       └── __tests__/
│
tests/                                # 공유 인프라
├── setup/                           # 테스트 환경 설정
│   ├── vitest-setup.ts              # 글로벌 설정
│   └── test-utils.tsx               # 커스텀 render
├── mocks/                           # 모킹 유틸리티
│   └── three.ts                     # Three.js 모킹
├── fixtures/                        # 테스트 데이터
│   └── dxf/                         # DXF 테스트 파일
├── integration/                     # 통합 테스트
└── scripts/                         # 성능 테스트 스크립트
```

### 테스트 파일 위치 패턴

| 패턴        | 위치                               | 용도                      |
| ----------- | ---------------------------------- | ------------------------- |
| Co-located  | `src/**/__tests__/*.test.ts`       | 단위 테스트 (기능별 배치) |
| Integration | `tests/integration/*.test.ts`      | 통합 테스트               |
| E2E         | `tests/e2e/`                       | E2E 테스트 (현재 제외)    |

### 테스트 실행

```bash
npm run test                          # Vitest 테스트 실행
npm run test:ui                       # Vitest UI 모드
npm run test:coverage                 # 커버리지 리포트
npm run test -- validators.test.ts    # 특정 파일
npm run test -- --grep "validateFile" # 특정 패턴
npm run test -- --run                 # 1회 실행 (watch 없이)
```

### 테스트 유형별 가이드

| 테스트 유형           | 위치                       | 네이밍       | 예시                    |
| --------------------- | -------------------------- | ------------ | ----------------------- |
| **Unit** (순수 함수)  | `feature/__tests__/`       | `*.test.ts`  | `validators.test.ts`    |
| **Component** (React) | `feature/__tests__/`       | `*.test.tsx` | `CADScene.test.tsx`     |
| **Hook**              | `feature/hooks/__tests__/` | `*.test.ts`  | `useDXFParser.test.ts`  |
| **Integration**       | `tests/integration/`       | `*.test.tsx` | `cad-workflow.test.tsx` |
| **Performance**       | `tests/scripts/`           | `*.cjs`      | `perf-test-dxf.cjs`     |

### 테스트 유틸리티

#### `@tests/setup/test-utils.tsx`

| 함수                 | 설명                                                |
| -------------------- | --------------------------------------------------- |
| `render`             | Provider 포함 커스텀 render (QueryClient + BrowserRouter) |
| `createTestFile()`   | 테스트용 File 객체 생성                             |
| `createTestDXFFile()` | DXF 전용 File 객체 생성                             |

#### `@tests/mocks/three.tsx`

| 함수                 | 설명                        |
| -------------------- | --------------------------- |
| `setupR3FMocks()`    | React Three Fiber + Drei 모킹 |
| `mockThreeCore()`    | Three.js 코어 객체 모킹     |
| `setupAllThreeMocks()` | 위 두 함수 통합 호출        |
| `clearThreeMocks()`  | 모킹 초기화                 |

### 성능 테스트

```bash
# 테스트 DXF 파일 생성
node tests/scripts/generate-test-dxf.cjs

# 파싱 성능 측정
node tests/scripts/perf-test-dxf.cjs
```

### 모킹 가이드

| 대상               | 모킹 함수                  | 위치                   |
| ------------------ | -------------------------- | ---------------------- |
| Three.js Canvas    | `vitest-setup.ts`에서 자동 | `tests/setup/`         |
| React Three Fiber  | `setupR3FMocks()`          | `tests/mocks/three.tsx` |
| Three.js 코어 객체 | `mockThreeCore()`          | `tests/mocks/three.tsx` |

> **참고**: `tests/setup/vitest-setup.ts`에서 Canvas, ResizeObserver, requestAnimationFrame이 자동으로 모킹됩니다.

---

## 코드 품질 도구

프로젝트에서 사용하는 코드 품질 관리 도구들

### 도구 개요

| 도구            | 역할                | 비유             | 실행 시점        |
| --------------- | ------------------- | ---------------- | ---------------- |
| **ESLint**      | 코드 품질/버그 검사 | 경찰 (위반 적발) | 개발 중, 커밋 시 |
| **Prettier**    | 코드 스타일 통일    | 스타일리스트     | 저장 시, 커밋 시 |
| **Husky**       | Git hooks 관리      | 문지기 (통제)    | git 명령 시      |
| **lint-staged** | 변경 파일만 처리    | 효율 담당        | 커밋 시          |

### 수동 실행 명령어

커밋 전에 미리 검사하거나, 전체 프로젝트를 점검할 때 사용합니다.

```bash
npm run lint          # ESLint 검사 (오류만 표시)
npm run lint:fix      # ESLint 검사 + 자동 수정
```

### ESLint - 코드 품질 검사기

코드의 **버그, 안티패턴, 잠재적 오류**를 감지합니다.

```typescript
// ❌ ESLint가 잡는 문제들
const unused = 'never used'; // 사용하지 않는 변수
console.log(data); // console 사용 금지 (설정에 따라)
if ((x = 5)) {
} // 할당 vs 비교 실수
array.map((item) => {
    item * 2;
}); // return 누락
```

### Prettier - 코드 포맷터

코드의 **일관된 스타일/형식**을 자동 적용합니다.

```typescript
// 입력 (지저분함)
const x = { a: 1, b: 2 };
function foo(x, y, z) {
    return x + y + z;
}

// Prettier 적용 후 (깔끔함)
const x = { a: 1, b: 2 };
function foo(x, y, z) {
    return x + y + z;
}
```

### Husky - Git Hooks 관리자

Git 이벤트(commit, push 등)에 **스크립트를 자동 실행**합니다.

```bash
# .husky/pre-commit (커밋 직전 실행)
npx lint-staged

# .husky/pre-push (푸시 직전 실행)
npm run lint && npm run type-check && npm run build
```

| Hook         | 트리거 시점      | 용도                             |
| ------------ | ---------------- | -------------------------------- |
| `pre-commit` | 커밋 직전        | lint, format 검사 (변경 파일만)  |
| `pre-push`   | 푸시 직전        | lint + type-check + build (전체) |
| `commit-msg` | 커밋 메시지 작성 | 메시지 형식 검증                 |

### lint-staged - 스테이징 파일 전용 실행기

**변경된 파일만** lint/format을 실행하여 효율성을 높입니다.

```json
// package.json
"lint-staged": {
    "*.{ts,tsx}": ["eslint --fix", "prettier --write"],
    "*.{json,md,css}": ["prettier --write"]
}
```

> 1000개 파일 중 2개만 수정 → 2개만 검사 (빠름!)

### 실행 흐름도

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Git Commit Flow                              │
│                                                                     │
│  코드 작성 → git add → git commit → Husky 트리거 → lint-staged 실행 │
│                                          │                          │
│                           ┌──────────────┴──────────────┐           │
│                           ▼                             ▼           │
│                       ESLint                        Prettier        │
│                    (코드 품질)                     (코드 스타일)     │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                        Git Push Flow                                 │
│                                                                      │
│  git push → Husky 트리거 → npm run lint → type-check → build        │
│                                  │                                   │
│                   ┌──────────────┼──────────────┐                    │
│                   ▼              ▼              ▼                    │
│               ESLint        TypeScript       Vite                    │
│            (전체 검사)      (타입 검사)     (빌드)                   │
└─────────────────────────────────────────────────────────────────────┘
```

**실제 흐름**:

1. 코드 수정 후 저장 → (VSCode에서 Prettier 자동 포맷)
2. `git add .`
3. `git commit -m "feat: 기능 추가"`
    - Husky가 `pre-commit` hook 트리거
    - lint-staged 실행
        - `*.ts,tsx` 파일: `eslint --fix` → `prettier --write`
        - `*.json,md,css` 파일: `prettier --write`
4. 모두 통과 → 커밋 완료
5. 오류 발생 → 커밋 차단! (수정 필요)

**Git Push Flow**:

1. `git push`
2. Husky가 `pre-push` hook 트리거
3. `npm run lint` → `npm run type-check` → `npm run build` 순차 실행
4. 모두 통과 → 푸시 진행
5. 하나라도 실패 → 푸시 차단! (수정 필요)

---

## Git 워크플로우

### 브랜치 전략

```
master ← develop ← 기능명_이름
```

| 브랜치        | 설명                            |
| ------------- | ------------------------------- |
| `master`      | 프로덕션 배포                   |
| `develop`     | 개발 통합                       |
| `기능명_이름` | 개인 작업 (예: `cad-layer_kim`) |

```bash
# 1. 작업 브랜치 생성
git checkout develop
git pull origin develop
git checkout -b 기능명_이름

# 2. 작업 후 푸시
git pull origin develop
git add .
git commit -m "feat: 기능 설명"
git push origin 기능명_이름

# 3. GitHub에서 develop으로 PR 생성
```

### 커밋 메시지 규칙

| 타입       | 설명      |
| ---------- | --------- |
| `feat`     | 새 기능   |
| `fix`      | 버그 수정 |
| `docs`     | 문서 변경 |
| `refactor` | 리팩토링  |
| `style`    | 포맷팅    |
| `test`     | 테스트    |
| `chore`    | 기타      |

**형식**: `타입: 설명`

```bash
feat: 레이어 필터링 기능 추가
fix: 뷰어 회전 시 좌표계 오류 해결
docs: README 업데이트
```

> 상세 규칙은 [GIT_CONVENTIONS.md](GIT_CONVENTIONS.md) 참고

---

## TODO: 작성 예정 항목

### 1. 네이밍 컨벤션 ✅

- ✅ 파일/폴더 네이밍
- ✅ 변수/함수 네이밍
- ✅ 타입/인터페이스 네이밍

### 2. 파일 가이드 ✅

- ✅ 빠른 판단 흐름도
- ✅ 위치 판단 체크리스트
- ✅ 타입/상수/설정 구분 기준
- ✅ 스타일 파일 위치

### 3. 코딩 스타일 ✅

- ✅ import 순서
- ✅ Feature 모듈 Import 패턴
- ✅ 컴포넌트 작성 패턴
- ✅ 타입 정의 패턴

### 4. 테스트 가이드 ✅

- ✅ 테스트 실행
- ✅ 테스트 파일 구조
- ✅ 성능 테스트

### 5. 코드 품질 도구 ✅

- ✅ 도구 개요 (ESLint, Prettier, Husky, lint-staged)
- ✅ 각 도구 역할 설명
- ✅ Git 커밋 시 실행 흐름도

### 6. Git 워크플로우 ✅

- ✅ 브랜치 전략
- ✅ 커밋 메시지 규칙

### 7. 품질 관리 (추후 진행)

- ⏳ 에러 핸들링 규칙
- ⏳ 코드 리뷰 체크리스트

---

## Changelog (변경 이력)

| 버전  | 날짜       | 변경 내용                                            |
| ----- | ---------- | ---------------------------------------------------- |
| 0.1.3 | 2025-12-04 | 삭제된 PHASE_DEV_DOC_GUIDE.md 참조 제거              |
| 0.1.2 | 2025-12-03 | pre-push lint 적용                                   |
| 0.1.1 | 2025-12-02 | Phase개발 템플릿 개발완료                            |
| 0.1.0 | 2025-12-01 | 개발자가이드 문서 업데이트, CAD Viewer 기능 추가     |
| 0.0.0 | 2025-11-28 | 초기 버전                                            |
