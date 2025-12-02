# 개발자 가이드

프로젝트 개발 시 참고하는 가이드 문서

## 목차

- [네이밍 컨벤션](#네이밍-컨벤션)
    - [파일/폴더](#파일폴더)
    - [변수/함수](#변수함수)
    - [타입/인터페이스](#타입인터페이스)
- [파일 가이드](#파일-가이드)
    - [빠른 판단 흐름도](#빠른-판단-흐름도)
    - [위치 판단 체크리스트](#위치-판단-체크리스트)
- [코딩 스타일](#코딩-스타일)
    - [Import 순서](#import-순서)
    - [Feature 모듈 Import 패턴](#feature-모듈-import-패턴)
    - [컴포넌트 작성 패턴](#컴포넌트-작성-패턴)
    - [타입 정의 패턴](#타입-정의-패턴)
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

---

## 테스트 가이드

### 테스트 실행

| 명령어                  | 설명                 |
| ----------------------- | -------------------- |
| `npm run test`          | Vitest 테스트 실행   |
| `npm run test:ui`       | Vitest UI 모드       |
| `npm run test:coverage` | 커버리지 리포트 생성 |

### 테스트 파일 구조

```
tests/
├── fixtures/              # 테스트용 데이터 (배포 번들 제외)
│   └── dxf/               # DXF 테스트 파일
└── scripts/               # 테스트/성능 측정 스크립트
    ├── generate-test-dxf.cjs  # 테스트 DXF 생성
    └── perf-test-dxf.cjs      # 파싱 성능 측정
```

### 성능 테스트

```bash
# 테스트 DXF 파일 생성
node tests/scripts/generate-test-dxf.cjs

# 파싱 성능 측정
node tests/scripts/perf-test-dxf.cjs
```

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

| 명령어             | 설명                      |
| ------------------ | ------------------------- |
| `npm run lint`     | ESLint 검사 (오류만 표시) |
| `npm run lint:fix` | ESLint 검사 + 자동 수정   |

```bash
# 커밋 전 수동 점검 예시
npm run lint          # 오류 확인
npm run lint:fix      # 자동 수정 가능한 오류 수정
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
```

| Hook         | 트리거 시점      | 용도              |
| ------------ | ---------------- | ----------------- |
| `pre-commit` | 커밋 직전        | lint, format 검사 |
| `pre-push`   | 푸시 직전        | 테스트 실행       |
| `commit-msg` | 커밋 메시지 작성 | 메시지 형식 검증  |

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
