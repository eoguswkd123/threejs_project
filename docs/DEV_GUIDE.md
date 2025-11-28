# 개발자 가이드

프로젝트 개발 시 참고하는 가이드 문서

## 네이밍 컨벤션

### 파일/폴더

| 대상 | 규칙 | 예시 |
|-----|------|------|
| 컴포넌트 | PascalCase.tsx | `CadScene.tsx` |
| 훅 | use + camelCase.ts | `useCADLoader.ts` |
| 유틸리티 | camelCase.ts | `format.ts` |
| 타입 | camelCase.ts | `cad.ts` |
| 스토어 | camelCase + Store.ts | `cadStore.ts` |
| 서비스 | camelCase.ts | `syncEngine.ts` |
| 상수 | camelCase.ts | `app.ts`, `routes.ts` |
| 폴더 | PascalCase | `CadRenderer/`, `ThreeCore/` |

### 변수/함수

| 유형 | 규칙 | 예시 |
|-----|------|------|
| 일반 변수 | camelCase | `userName`, `fileSize` |
| 상수 | UPPER_SNAKE_CASE | `MAX_FILE_SIZE`, `API_URL` |
| Boolean | is/has/can + 상태 | `isLoading`, `hasError`, `canEdit` |
| 핸들러 | handle + 동작 | `handleClick`, `handleSubmit` |
| 콜백 props | on + 이벤트 | `onClick`, `onSubmit`, `onChange` |
| 데이터 조회 | get/fetch + 대상 | `getUser`, `fetchData` |
| 변환 함수 | to + 타입 | `toString`, `toJSON`, `toNumber` |
| 상태 setter | set + 상태 | `setUserName`, `setIsLoading` |

### 타입/인터페이스

#### 기본 타입

| 유형 | 규칙 | 예시 |
|-----|------|------|
| 인터페이스 | PascalCase | `User`, `CadFile` |
| 타입 | PascalCase | `Theme`, `Status` |
| Enum | PascalCase | `FileStatus`, `UserRole` |

#### 컴포넌트 관련

| 유형 | 규칙 | 예시 |
|-----|------|------|
| Props | 컴포넌트명 + Props | `ButtonProps`, `ModalProps` |
| State | 컴포넌트명 + State | `FormState`, `AppState` |

#### API 관련

| 유형 | 규칙 | 예시 |
|-----|------|------|
| API 타입 | 설명 + Response/Request | `UserResponse`, `CreateUserRequest` |

#### 설정

| 유형 | 규칙 | 예시 |
|-----|------|------|
| Config | 대상 + Config | `AppConfig`, `ThemeConfig` |

## 파일 위치 결정 가이드

새 코드 작성 시 어디에 둘지 빠르게 판단하는 흐름도

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
    ├─ 타입 정의? → types/
    │
    └─ 상태 관리? → stores/
```

### 위치 판단 체크리스트

#### Step 1: 도메인 범위 결정
> "이 코드가 특정 도메인(cad, sync, three 등)에서만 사용되나요?"

| 답변 | 컴포넌트 | 훅 | 순수 함수 |
|-----|---------|-----|---------|
| 1개 도메인 전용 | `features/[도메인]/components/` | `features/[도메인]/hooks/` | `features/[도메인]/utils/` |
| 여러 곳에서 사용 | `components/` | `hooks/` | `utils/` |

#### Step 2: 복잡도 결정 (순수 함수인 경우)
> "복잡한 로직/클래스가 필요한가요?"

| 답변 | 복잡한 로직/클래스 | 간단한 함수 |
|-----|------------------|------------|
| 1개 도메인 전용 | `services/[도메인]/` | `features/[도메인]/utils/` |
| 여러 곳에서 사용 | `services/` | `utils/` |

#### 판단 예시 모음

| 만들려는 코드 | Step 1 | Step 2 | 최종 위치 |
|-------------|--------|--------|----------|
| CAD 파일 3D 렌더링 컴포넌트 | cad 전용 | - | `features/cad-renderer/components/` |
| 날짜 포맷팅 함수 | 전역 | 간단 | `utils/format.ts` |
| WebSocket 동기화 엔진 | sync 전용 | 클래스 | `services/sync/SyncEngine.ts` |
| 파일 업로드 상태 훅 | 전역 | - | `hooks/useFileUpload.ts` |

---

## 파일 생성 가이드

새 파일 생성 시 위치, 파일명, 기본 템플릿 참고

### 요약 테이블

| 유형 | 위치 | 파일명 규칙 |
|------|------|------------|
| 컴포넌트 | `components/` or `features/*/components/` | `ComponentName.tsx` |
| 훅 | `hooks/` or `features/*/hooks/` | `useHookName.ts` |
| 유틸리티 | `utils/` | `categoryName.ts` |
| 타입 | `types/` | `domainName.ts` |
| 스토어 | `stores/` | `domainStore.ts` |
| API | `api/` | `serviceName.ts` |
| 설정 | `config/` | `configName.ts` |
| 상수 | `constants/` | `categoryName.ts` |

### 상세 템플릿

<details>
<summary><strong>컴포넌트 생성</strong></summary>

#### 위치
- 공통: `src/components/`
- 도메인 전용: `src/features/[도메인]/components/`

#### 템플릿
```typescript
import { useState } from 'react';

interface ComponentNameProps {
  className?: string;
  onClick?: () => void;
}

export function ComponentName({ className, onClick }: ComponentNameProps) {
  const [state, setState] = useState(false);

  return (
    <div className={className} onClick={onClick}>
      {/* 컴포넌트 내용 */}
    </div>
  );
}
```

</details>

<details>
<summary><strong>훅 생성</strong></summary>

#### 위치
- 공통: `src/hooks/`
- 도메인 전용: `src/features/[도메인]/hooks/`

#### 템플릿
```typescript
import { useState, useCallback, useEffect } from 'react';

interface UseHookNameOptions {
  initialValue?: string;
  onChange?: (value: string) => void;
}

export function useHookName(options: UseHookNameOptions = {}) {
  const { initialValue = '', onChange } = options;

  // 상태
  const [value, setValue] = useState(initialValue);
  const [isLoading, setIsLoading] = useState(false);

  // 액션
  const updateValue = useCallback((newValue: string) => {
    setValue(newValue);
    onChange?.(newValue);
  }, [onChange]);

  // 부수 효과
  useEffect(() => {
    // 초기화 로직
    return () => {
      // 정리 로직
    };
  }, []);

  return {
    // 상태
    value,
    isLoading,
    // 액션
    updateValue,
    // 계산값
    hasValue: value.length > 0,
  };
}
```

</details>

<details>
<summary><strong>유틸리티 생성</strong></summary>

#### 위치
- `src/utils/`

#### 템플릿
```typescript
/**
 * 파일 크기를 읽기 쉬운 형식으로 변환
 * @param bytes - 바이트 단위 크기
 * @returns 포맷된 문자열 (예: "1.5 MB")
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}
```

</details>

<details>
<summary><strong>타입 생성</strong></summary>

#### 위치
- `src/types/`

#### 템플릿
```typescript
// ===== 기본 타입 =====
export type Status = 'idle' | 'loading' | 'success' | 'error';

// ===== 인터페이스 =====
export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
}

// ===== Enum =====
export enum FileStatus {
  Pending = 'pending',
  Uploading = 'uploading',
  Complete = 'complete',
  Error = 'error',
}

// ===== 상수 + 타입 =====
export const ROLES = ['admin', 'user', 'guest'] as const;
export type Role = (typeof ROLES)[number];
```

</details>

<details>
<summary><strong>스토어 생성</strong></summary>

#### 위치
- `src/stores/`

#### 템플릿
```typescript
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

// ===== 타입 =====
interface DomainState {
  data: string | null;
  isLoading: boolean;
  error: string | null;
}

interface DomainActions {
  setData: (data: string) => void;
  setLoading: (isLoading: boolean) => void;
  reset: () => void;
}

// ===== 초기 상태 =====
const initialState: DomainState = {
  data: null,
  isLoading: false,
  error: null,
};

// ===== 스토어 =====
export const useDomainStore = create<DomainState & DomainActions>()(
  devtools(
    persist(
      (set) => ({
        ...initialState,

        setData: (data) => set({ data }),
        setLoading: (isLoading) => set({ isLoading }),
        reset: () => set(initialState),
      }),
      { name: 'domain-storage' }
    ),
    { name: 'DomainStore' }
  )
);

// ===== Selectors =====
export const selectIsLoading = (state: DomainState) => state.isLoading;
export const selectHasData = (state: DomainState) => state.data !== null;
```

</details>

<details>
<summary><strong>API 생성</strong></summary>

#### 위치
- `src/api/`

#### 템플릿
```typescript
import axios from 'axios';

// ===== API 클라이언트 =====
export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ===== 인터셉터 =====
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);

// ===== API 함수 =====
export async function fetchUsers(): Promise<User[]> {
  const { data } = await apiClient.get('/users');
  return data;
}

export async function createUser(payload: CreateUserRequest): Promise<User> {
  const { data } = await apiClient.post('/users', payload);
  return data;
}
```

</details>

<details>
<summary><strong>설정 생성</strong></summary>

#### 위치
- `src/config/`

#### 템플릿
```typescript
export const config = {
  app: {
    name: import.meta.env.VITE_APP_NAME || 'App',
    version: import.meta.env.VITE_APP_VERSION || '1.0.0',
  },
  api: {
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
    timeout: parseInt(import.meta.env.VITE_API_TIMEOUT || '30000'),
  },
  features: {
    enableAnalytics: import.meta.env.VITE_ENABLE_ANALYTICS === 'true',
    enableDebug: import.meta.env.DEV,
  },
} as const;

export type AppConfig = typeof config;
```

</details>

<details>
<summary><strong>상수 생성</strong></summary>

#### 위치
- `src/constants/`

#### 템플릿
```typescript
// ===== 라우트 =====
export const ROUTES = {
  HOME: '/',
  DASHBOARD: '/dashboard',
  SETTINGS: '/settings',
} as const;

export type RouteKey = keyof typeof ROUTES;
export type RoutePath = (typeof ROUTES)[RouteKey];

// ===== 앱 상수 =====
export const APP = {
  NAME: 'CAD Viewer',
  MAX_FILE_SIZE: 100 * 1024 * 1024, // 100MB
  SUPPORTED_FORMATS: ['.dxf', '.dwg'] as const,
} as const;

// ===== 메뉴 =====
export const MENU_ITEMS = [
  { label: 'Home', href: ROUTES.HOME, icon: 'home' },
  { label: 'Dashboard', href: ROUTES.DASHBOARD, icon: 'dashboard' },
] as const;
```

</details>

---

## TODO: 작성 예정 항목

### 1. 네이밍 컨벤션 ✅
- [x] 파일/폴더 네이밍
- [x] 변수/함수 네이밍
- [x] 타입/인터페이스 네이밍

### 2. 파일 위치 결정 가이드 ✅
- [x] 빠른 판단 흐름도
- [x] 위치 판단 체크리스트

### 3. 파일 생성 가이드 ✅
- [x] 컴포넌트 생성
- [x] 훅 생성
- [x] 유틸리티 생성
- [x] 타입 생성
- [x] 스토어 생성
- [x] API 생성
- [x] 설정 생성
- [x] 상수 생성

### 4. 코딩 스타일
- [ ] import 순서
- [ ] 컴포넌트 작성 패턴
- [ ] 훅 작성 패턴
- [ ] 타입 정의 패턴

### 5. 품질 관리
- [ ] 테스트 작성 가이드
- [ ] 에러 핸들링 규칙
- [ ] 코드 리뷰 체크리스트

### 6. Git 워크플로우
- [ ] 브랜치 전략
- [ ] 커밋 메시지 규칙
- [ ] PR 작성 가이드
