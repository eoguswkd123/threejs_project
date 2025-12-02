# Phase X.Y: [기능명] Implementation

> **Version**: X.Y.Z
> **Created**: YYYY-MM-DD
> **Last Updated**: YYYY-MM-DD
> **Status**: ✅ 완료 / 🔄 진행 중 (N%) / 📋 계획됨
> **Dependencies**: Phase X.X 완료 필요 (없으면 "없음")
>
> 📚 **작성 규칙**: [PHASE_DEV_DOC_GUIDE.md](../templates/PHASE_DEV_DOC_GUIDE.md) 참조

---

## Table of Contents (목차)

- [1. Overview (개요)](#1-overview-개요)
- [2. Architecture (아키텍처)](#2-architecture-아키텍처)
- [3. Implementation Checklist (구현 체크리스트)](#3-implementation-checklist-구현-체크리스트)
- [4. Key Implementation Details (핵심 구현 상세)](#4-key-implementation-details-핵심-구현-상세)
- [5. Testing Strategy (테스트 전략)](#5-testing-strategy-테스트-전략)
- [6. Dependencies & References (의존성 및 참조)](#6-dependencies--references-의존성-및-참조)
- [7. Routes & Navigation (라우트 및 네비게이션)](#7-routes--navigation-라우트-및-네비게이션)
- [8. Changelog (변경 이력)](#8-changelog-변경-이력)
- [9. Post-Completion Checklist (완료 후 체크리스트)](#9-post-completion-checklist-완료-후-체크리스트)

---

## 🤖 Claude Commands

### 이 문서 작성 + 검증 시 (템플릿 기반 문서 생성 후 품질 검증)

```bash
/sc:design [phase-feature-name] --template @docs/phases/templates/PHASE_DEV_TEMPLATE.md [--think|--think-hard|--ultrathink] && /sc:spec-panel @docs/phases/[Phase폴더]/[생성된파일].md

# 예시
/sc:design phase-2a5-unit-tests --template @docs/phases/templates/PHASE_DEV_TEMPLATE.md --think-hard && /sc:spec-panel @docs/phases/02-CadFeatures/2A5_UNIT_TESTS.md
```

### 검증된 문서 기반 구현 시

```bash
/sc:implement @docs/phases/[Phase폴더]/[THIS_FILE].md --validate

# 예시
/sc:implement @docs/phases/02-CadFeatures/2A5_UNIT_TESTS.md --validate
```

### 개발 완료 후

구현이 완료되면 Claude가 자동으로 연관 문서 업데이트를 제안합니다:

- 어떤 내용이 변경되는지 미리 보여줌
- 승인 후 ROADMAP, ARCHITECTURE, README 업데이트

---

## Phase Progress

| Sub-Phase | 상태 | 설명                    |
| --------- | ---- | ----------------------- |
| X.Y.1     | ✅   | 첫 번째 마일스톤        |
| X.Y.2     | 🔄   | 현재 진행 중인 마일스톤 |
| X.Y.3     | 📋   | 계획된 마일스톤         |

---

## 1. Overview (개요)

### 1.1 목표

<!-- 이 Phase에서 달성하고자 하는 핵심 목표 (1-3문장) -->

### 1.2 MVP 범위

| 항목       | MVP 범위  | 확장 단계 |
| ---------- | --------- | --------- |
| **기능 A** | 최소 구현 | 추가 기능 |
| **기능 B** | 기본 동작 | 고급 옵션 |

### 1.3 기술적 제약

<!-- 알려진 제한사항, 성능 요구사항, 호환성 등 -->

- 제약 1: 설명
- 제약 2: 설명

---

## 2. Architecture (아키텍처)

### 2.1 디렉토리 구조

```
src/features/[FeatureName]/
├── index.ts                    # Public exports
├── types.ts                    # 타입 정의
├── constants.ts                # 상수 정의
├── components/
│   ├── index.ts
│   ├── [ComponentA].tsx        # 컴포넌트 설명
│   └── [ComponentB].tsx        # 컴포넌트 설명
├── hooks/
│   ├── index.ts
│   └── use[HookName].ts        # 훅 설명
├── utils/
│   ├── index.ts
│   └── [utilName].ts           # 유틸리티 설명
└── workers/                    # (선택) WebWorker
    └── [workerName].worker.ts

src/pages/[FeatureName]/
└── index.tsx                   # 페이지 컴포넌트
```

### 2.2 컴포넌트 계층

```
PageComponent                          [custom] 페이지 컴포넌트
└── SceneComponent                     [custom] 씬 컨테이너
    ├── Canvas                         [@react-three/fiber] 3D 캔버스
    │   ├── Camera                     [@react-three/drei] 카메라
    │   ├── Controls                   [@react-three/drei] 컨트롤
    │   ├── Lighting                   [R3F built-in] 조명
    │   └── MeshComponent              [custom] 메시
    └── UIControls                     [custom / HTML] UI 컨트롤
```

**범례:**

- `[custom]` - 직접 구현한 컴포넌트
- `[@react-three/fiber]` - R3F 코어
- `[@react-three/drei]` - R3F 헬퍼 라이브러리
- `[R3F built-in]` - Three.js 객체 (R3F에서 JSX로 사용)

### 2.3 데이터 흐름

```
[입력] → [처리] → [상태] → [렌더링]

예시:
File Upload → Parser Hook → useState → Three.js Mesh
```

---

## 3. Implementation Checklist (구현 체크리스트)

### 3.1 Phase X.Y.1: [첫 번째 마일스톤]

- [ ] 항목 1 설명
- [ ] 항목 2 설명
- [ ] 항목 3 설명

### 3.2 Phase X.Y.2: [두 번째 마일스톤]

- [ ] 항목 1 설명
- [ ] 항목 2 설명

### 3.3 Phase X.Y.3: [세 번째 마일스톤]

- [ ] 항목 1 설명
- [ ] 항목 2 설명

---

## 4. Key Implementation Details (핵심 구현 상세)

### 4.1 핵심 코드 패턴

#### 타입 정의

```typescript
// types.ts
export interface MainType {
    property1: string;
    property2: number;
    property3?: boolean;
}

export interface Config {
    option1: boolean;
    option2: string;
}
```

#### 상수 정의

```typescript
// constants.ts
export const DEFAULT_CONFIG: Config = {
    option1: true,
    option2: 'default',
};

export const LIMITS = {
    MAX_SIZE: 1000,
    MIN_SIZE: 10,
} as const;
```

#### 훅 패턴

```typescript
// hooks/useFeature.ts
export function useFeature() {
    const [state, setState] = useState<MainType | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const process = useCallback(async (input: Input) => {
        setIsLoading(true);
        try {
            const result = await processInput(input);
            setState(result);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error');
        } finally {
            setIsLoading(false);
        }
    }, []);

    return { state, isLoading, error, process };
}
```

#### 컴포넌트 패턴

```tsx
// components/MainComponent.tsx
export const MainComponent = memo(function MainComponent({
    data,
    config,
}: Props) {
    const processedData = useMemo(() => {
        return processData(data);
    }, [data]);

    useEffect(() => {
        return () => {
            // cleanup
        };
    }, [processedData]);

    return <mesh>{/* Three.js 렌더링 */}</mesh>;
});
```

### 4.2 설정 및 상수

| 상수명          | 값        | 설명           |
| --------------- | --------- | -------------- |
| `MAX_SIZE`      | 1000      | 최대 크기 제한 |
| `DEFAULT_VALUE` | 'default' | 기본값         |

---

## 5. Testing Strategy (테스트 전략)

### 5.1 Unit Tests

**테스트 대상:**

- [ ] 유틸리티 함수 (`utils/`)
- [ ] 훅 로직 (`hooks/`)
- [ ] 타입 검증

**테스트 파일 위치:**

```
tests/features/[FeatureName]/
├── utils.test.ts
├── hooks.test.ts
└── components.test.tsx
```

**테스트 예시:**

```typescript
describe('utilityFunction', () => {
    it('should handle normal input', () => {
        expect(utilityFunction(input)).toBe(expected);
    });

    it('should handle edge cases', () => {
        expect(utilityFunction(null)).toThrow();
    });
});
```

### 5.2 Integration Tests

- [ ] 컴포넌트 통합 테스트
- [ ] 데이터 흐름 테스트

### 5.3 검증 체크리스트

| 검증 항목       | 방법                 | 상태 |
| --------------- | -------------------- | ---- |
| 타입 체크       | `npm run type-check` | ⬜   |
| 린트            | `npm run lint`       | ⬜   |
| 단위 테스트     | `npm run test`       | ⬜   |
| 브라우저 테스트 | 수동 확인            | ⬜   |

---

## 6. Dependencies & References (의존성 및 참조)

### 6.1 필수 패키지

| 패키지         | 버전   | 용도        |
| -------------- | ------ | ----------- |
| `package-name` | ^X.Y.Z | 패키지 설명 |

### 6.2 참조 문서

| 문서                                  | 역할            |
| ------------------------------------- | --------------- |
| [DEV_GUIDE.md](../DEV_GUIDE.md)       | 개발 컨벤션     |
| [ARCHITECTURE.md](../ARCHITECTURE.md) | 시스템 아키텍처 |
| [External Doc](https://example.com)   | 외부 참조       |

### 6.3 관련 Phase

| Phase     | 관계 | 설명                       |
| --------- | ---- | -------------------------- |
| Phase X.X | 의존 | 이 Phase 완료 후 시작 가능 |
| Phase Y.Y | 연관 | 공유 컴포넌트 사용         |

---

## 7. Routes & Navigation (라우트 및 네비게이션)

| Path            | Component   | Description      |
| --------------- | ----------- | ---------------- |
| `/feature-path` | FeaturePage | 기능 메인 페이지 |

---

## 8. Changelog (변경 이력)

| 버전  | 날짜       | 변경 내용      |
| ----- | ---------- | -------------- |
| 0.0.0 | YYYY-MM-DD | 초기 문서 작성 |

---

## 9. Post-Completion Checklist (완료 후 체크리스트)

개발 완료 시 Claude가 아래 문서들의 업데이트를 자동으로 제안합니다.

### 9.1 연관 문서 업데이트 (Claude 자동 제안)

| 문서                             | 업데이트 내용                                     |
| -------------------------------- | ------------------------------------------------- |
| `docs/phases/PHASE_NAV_GUIDE.md` | Phase 문서 링크, 상태, 진행률 업데이트            |
| `docs/ROADMAP.md`                | Phase 상태 (🔄→✅), 진행률, Milestones, 변경 이력 |
| `docs/GLOSSARY.md`               | 새로운 용어/약어 추가                             |
| `docs/ARCHITECTURE.md`           | 패키지 구조, 레이어별 역할, 관련 문서 링크        |
| `README.md`                      | 현재 상태, 구현 완료 기능, 개발 예정 목록         |

### 9.2 업데이트 프로세스

1. **구현 완료** → Claude가 "연관 문서 업데이트할까요?" 제안
2. **변경 내용 미리보기** → 각 문서별 수정될 내용 표시
3. **승인** → 사용자 확인 후 일괄 업데이트

---

_Phase X.Y Implementation - Created: YYYY-MM-DD_
