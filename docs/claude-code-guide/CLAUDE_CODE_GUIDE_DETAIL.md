# Claude Code & SuperClaude 프레임워크 종합 분석 가이드

> **Version**: 0.0.1
> **Last Updated**: 2025-12-04

명령어 요약본이 필요하신가요? → [CLAUDE_CODE_GUIDE_SUMMARY.md](./CLAUDE_CODE_GUIDE_SUMMARY.md)

---

## 목차

1. [Claude Code 핵심 동작 원리](#1-claude-code-핵심-동작-원리)
2. [초기 로딩 및 설정](#2-초기-로딩-및-설정)
3. [채팅 활용 이점](#3-채팅-활용-이점)
4. [에이전트 시스템](#4-에이전트-시스템)
5. [SuperClaude 프레임워크](#5-superClaude-프레임워크)
6. [SC 명령어 완전 가이드](#6-sc-명령어-완전-가이드)
7. [MCP 서버 통합](#7-mcp-서버-통합)
8. [실전 활용 패턴](#8-실전-활용-패턴)

---

## 1. Claude Code 핵심 동작 원리

### 1.1 에이전틱 루프 아키텍처

Claude Code는 터미널에서 실행되는 AI 코딩 어시스턴트로, 다음과 같은 에이전틱 루프로 동작합니다:

```
사용자 입력 → Claude 응답 생성 → 도구 호출 제안 → 도구 실행 → 결과 컨텍스트 통합 → 반복
```

### 1.2 컨텍스트 관리

- **토큰 버짓**: 전체 컨텍스트 윈도우 사용
- **자동 압축**: 95% 용량 도달 시 자동으로 이전 메시지 요약
- **수동 압축**: `/clear` 명령으로 컨텍스트 초기화
- **세션 격리**: 각 세션은 독립적인 컨텍스트 유지

### 1.3 도구 사용 패턴

| 도구          | 용도          | 최적 사용 시나리오      |
| ------------- | ------------- | ----------------------- |
| **Read**      | 파일 읽기     | 코드 분석, 문서 검토    |
| **Write**     | 파일 생성     | 새 기능 구현, 문서 작성 |
| **Edit**      | 파일 수정     | 버그 수정, 리팩토링     |
| **Bash**      | 명령 실행     | 테스트, Git 작업, 빌드  |
| **MultiEdit** | 일괄 수정     | 대규모 리팩토링         |
| **Grep**      | 코드 검색     | 패턴 검색, 사용처 찾기  |
| **Glob**      | 파일 검색     | 파일 구조 탐색          |
| **Task**      | 에이전트 위임 | 복잡한 병렬 작업        |

---

## 2. 초기 로딩 및 설정

### 2.1 시작 시퀀스

```
1. 설정 파일 로딩 (우선순위 순)
   └─ 엔터프라이즈 설정
   └─ 사용자 설정 (~/.claude/settings.json)
   └─ 프로젝트 설정 (./.claude/settings.json)
   └─ 로컬 오버라이드 (./.claude/settings.local.json)

2. 메모리 로딩 (계층적)
   └─ 홈 디렉토리 메모리 (~/.claude/CLAUDE.md)
   └─ 프로젝트 메모리 (./CLAUDE.md)
   └─ 부모 디렉토리 메모리 (모노레포 지원)
   └─ 자식 디렉토리 메모리 (온디맨드 로딩)

3. 확장 기능 로딩
   └─ 커스텀 슬래시 명령어 (.claude/commands/)
   └─ 커스텀 에이전트 (.claude/agents/)

4. MCP 서버 초기화

5. SessionStart 훅 실행 (설정된 경우)
```

### 2.2 CLAUDE.md - Claude의 장기 기억

**위치별 용도:**
| 위치 | 범위 | 용도 | Git 상태 |
|------|------|------|----------|
| `./CLAUDE.md` | 프로젝트 | 팀 공유 컨텍스트, 코드 표준 | 커밋 |
| `~/.claude/CLAUDE.md` | 사용자 | 개인 설정, 글로벌 워크플로우 | 커밋 안함 |

**권장 내용:**

```markdown
# 프로젝트 컨텍스트

## 코드 표준

- TypeScript strict 모드 필수
- ESLint, Prettier 적용
- vitest 테스트 커버리지 80% 이상

## 핵심 패턴

- 기능 기반 디렉토리 구조
- ./src/hooks/ 커스텀 훅
- ./src/features/ 기능별 모듈

## 중요 파일

- ./src/App.tsx - 메인 진입점
- ./src/config/ - 설정 관리
- ./tests/ - 테스트 스위트

## 개발 워크플로우

1. 기능 브랜치 생성: git checkout -b feature/name
2. 커밋 전 테스트: npm test
3. 푸시 전 린트: npm run lint
```

### 2.3 @ 임포트 기능

CLAUDE.md에서 외부 마크다운 파일 참조:

```markdown
# 프로젝트 지식 베이스

@ARCHITECTURE.md
@CODE_STANDARDS.md
@SETUP_GUIDE.md

# 글로벌 프레임워크

@/home/dhlimit/.claude/PRINCIPLES.md
@/home/dhlimit/.claude/RULES.md
```

### 2.4 권한 설정

```json
{
    "permissions": {
        "allow": [
            "Read(src/**)",
            "Write(src/**)",
            "Edit(src/**)",
            "Bash(git:*)",
            "Bash(npm run:*)"
        ],
        "deny": ["Bash(rm:*)", "Bash(sudo:*)", "Write(.env*)"],
        "ask": ["Bash(git push:*)", "Write(package.json)"]
    }
}
```

---

## 3. 채팅 활용 이점

### 3.1 훅(Hooks) - 결정론적 자동화

훅은 Claude Code 생명주기의 특정 시점에 자동 실행되는 셸 명령입니다.

**사용 가능한 훅 이벤트:**
| 훅 타입 | 트리거 | 사용 사례 |
|---------|--------|----------|
| `PreToolUse` | 도구 실행 전 | 위험 작업 차단, 입력 검증 |
| `PostToolUse` | 도구 완료 후 | 자동 포맷, 테스트 실행 |
| `SessionStart` | 세션 시작 | 환경 초기화 |
| `SessionEnd` | 세션 종료 | 정리, 로깅 |

**예시: 자동 포맷팅**

```json
{
    "hooks": [
        {
            "type": "PostToolUse",
            "matcher": "Edit(src/**/*.ts)",
            "command": "prettier --write $FILE && eslint --fix $FILE"
        }
    ]
}
```

### 3.2 내장 슬래시 명령어

```bash
/help              # 모든 명령어 표시
/context           # 컨텍스트 사용량 확인
/clear             # 대화 컨텍스트 초기화
/checkpoint        # 세션 상태 저장
/sessions          # 모든 세션 목록
/model [모델명]    # 모델 전환
/add-dir [경로]    # 디렉토리 컨텍스트 추가
/agent [에이전트]  # 특정 에이전트 실행
```

### 3.3 병렬 실행 기능

Claude Code는 독립적인 작업을 병렬로 실행할 수 있습니다:

```
메인 에이전트: 전체 조율
├─ 서브에이전트 1: 프론트엔드 분석
├─ 서브에이전트 2: 백엔드 분석
├─ 서브에이전트 3: 데이터베이스 분석
└─ 메인 에이전트: 결과 종합
```

**장점:**

- 7개 병렬 작업 = ~7배 컨텍스트 윈도우 활용
- 논블로킹: 서브에이전트 작업 중 메인 에이전트 계속 작업
- 각 서브에이전트는 메인 에이전트의 권한 상속

---

## 4. 에이전트 시스템

### 4.1 Task 도구를 통한 위임

```bash
# 기본 사용
/task
---
title: "인증 모듈 리팩토링"
description: "새 세션 패턴으로 업데이트"
tools: "Read,Edit,Bash(npm test)"
---

src/auth/를 검토하고 새 세션 관리 패턴으로 리팩토링하세요.
```

### 4.2 사용 가능한 에이전트 유형 (20개)

**시스템 에이전트 (6개):**

- `general-purpose` - 범용 연구, 코드 검색, 멀티스텝 작업
- `Explore` - 코드베이스 빠른 탐색 (quick/medium/very thorough)
- `Plan` - 구현 전략 설계, 아키텍처 계획
- `claude-code-guide` - Claude Code/Agent SDK 문서 조회
- `requirements-analyst` - 요구사항 발견 및 구조화 분석
- `statusline-setup` - 상태줄 설정

**아키텍처 도메인 (4개):**

- `system-architect` - 시스템 설계, 아키텍처 패턴
- `backend-architect` - 백엔드 시스템, API, 데이터베이스
- `frontend-architect` - 프론트엔드, UI/UX, 컴포넌트
- `devops-architect` - 인프라, 배포, 운영

**전문 분야 (10개):**

- `performance-engineer` - 성능 최적화, 병목 식별
- `security-engineer` - 보안 취약점, 위협 모델링
- `quality-engineer` - 코드 품질, 테스트, 기술 부채
- `refactoring-expert` - 코드 구조 개선, 패턴 적용
- `python-expert` - Python 전문, SOLID 원칙
- `technical-writer` - 문서화, 기술 커뮤니케이션
- `root-cause-analyst` - 문제 진단, 체계적 디버깅
- `socratic-mentor` - 학습 중심 대화, 전략적 사고
- `learning-guide` - 교육 콘텐츠, 학습 경로 설계
- `business-panel-experts` - 9인 비즈니스 전문가 패널

### 4.3 에이전트 설정 파일 형식

```markdown
---
name: 'senior-reviewer'
model: 'claude-sonnet-4-5-20250929'
tools: 'Read,Edit,Bash(git),Bash(npm test)'
description: '아키텍처 관점의 시니어 코드 리뷰어'
---

당신은 15년 이상 경력의 시니어 코드 리뷰어입니다.
역할: 품질, 보안, 유지보수성 관점에서 코드 리뷰

리뷰 시:

1. SOLID 원칙 위반 확인
2. 보안 취약점 식별
3. 성능 최적화 제안
4. 테스트 커버리지 80% 이상 확인
```

---

## 5. SuperClaude 프레임워크

### 5.1 프레임워크 구조

```
~/.claude/
├── CLAUDE.md              # 진입점 (모든 컴포넌트 임포트)
├── PRINCIPLES.md          # 소프트웨어 엔지니어링 철학
├── RULES.md              # 행동 규칙 (우선순위 기반)
├── FLAGS.md              # 실행 모드 플래그
├── MODE_Brainstorming.md  # 협업 발견 모드
├── MODE_Business_Panel.md # 비즈니스 분석 모드
├── MODE_Introspection.md  # 메타인지 분석 모드
├── MODE_Orchestration.md  # 도구 선택 최적화 모드
├── MODE_Task_Management.md # 계층적 작업 관리 모드
├── MODE_Token_Efficiency.md # 토큰 효율 모드
├── MCP_Context7.md        # 공식 문서 조회
├── MCP_Morphllm.md        # 패턴 기반 편집
└── MCP_Sequential.md      # 다단계 추론
```

### 5.2 핵심 원칙

**코어 디렉티브:**

```
Evidence > assumptions | Code > documentation | Efficiency > verbosity
```

**작업 패턴:**

```
이해 → 계획 → TodoWrite(3+ 작업) → 실행 → 추적 → 검증
```

**SOLID 원칙 적용:**

- Single Responsibility (단일 책임)
- Open/Closed (개방/폐쇄)
- Liskov Substitution (리스코프 치환)
- Interface Segregation (인터페이스 분리)
- Dependency Inversion (의존성 역전)

### 5.3 규칙 우선순위 시스템

**🔴 CRITICAL (절대 타협 불가):**

- `git status && git branch` 시작 전 확인
- Write/Edit 전 Read 필수
- feature 브랜치만, main/master 절대 금지
- 근본 원인 분석, 검증 건너뛰기 금지

**🟡 IMPORTANT (강하게 권장):**

- 3단계 이상 작업은 TodoWrite 사용
- 시작한 구현은 완료까지
- 요청한 것만 구현 (MVP 우선)
- 전문적 언어 사용 (마케팅 수사 금지)

**🟢 RECOMMENDED (실용적일 때 적용):**

- 순차보다 병렬 작업 선호
- 설명적 명명 규칙
- 기본 도구보다 MCP 도구 사용
- 가능하면 일괄 작업

### 5.4 플래그 시스템

**분석 깊이 플래그:**
| 플래그 | 토큰 규모 | 용도 |
|--------|----------|------|
| `--think` | ~4K | 표준 분석, Sequential 활성화 |
| `--think-hard` | ~10K | 아키텍처 분석, Sequential + Context7 |
| `--ultrathink` | ~32K | 최대 깊이, 모든 MCP 서버 활성화 |

**MCP 서버 플래그:**
| 플래그 | 서버 | 용도 |
|--------|------|------|
| `--c7` / `--context7` | Context7 | 공식 프레임워크 문서 |
| `--seq` / `--sequential` | Sequential | 구조화된 다단계 추론 |
| `--magic` | Magic | UI 컴포넌트 생성 |
| `--morph` | Morphllm | 패턴 기반 대량 변환 |
| `--serena` | Serena | 심볼 작업, 프로젝트 메모리 |
| `--play` | Playwright | 브라우저 자동화, E2E 테스트 |

**실행 제어 플래그:**
| 플래그 | 용도 |
|--------|------|
| `--delegate [auto\|files\|folders]` | 서브에이전트 병렬 처리 |
| `--concurrency [n]` | 최대 동시 작업 수 (1-15) |
| `--loop` | 반복 개선 사이클 |
| `--validate` | 사전 실행 위험 평가 |
| `--safe-mode` | 최대 검증, 보수적 실행 |

---

## 6. SC 명령어 완전 가이드

### 6.1 명령어 카테고리 개요 (24개)

**유틸리티 명령어:**

- `/sc:analyze` - 종합 코드 분석
- `/sc:design` - 시스템/컴포넌트 설계
- `/sc:document` - 문서 생성
- `/sc:build` - 빌드 및 패키징
- `/sc:git` - 스마트 Git 작업
- `/sc:test` - 테스트 실행
- `/sc:troubleshoot` - 문제 진단
- `/sc:help` - 명령어 도움말

**워크플로우 명령어:**

- `/sc:implement` - 기능 구현
- `/sc:improve` - 코드 개선
- `/sc:cleanup` - 코드 정리
- `/sc:explain` - 코드 설명

**고급 명령어:**

- `/sc:estimate` - 개발 추정
- `/sc:index` - 프로젝트 문서화
- `/sc:task` - 복잡한 작업 관리
- `/sc:brainstorm` - 요구사항 발견
- `/sc:workflow` - 구현 워크플로우 생성
- `/sc:spawn` - 메타 시스템 오케스트레이션

**세션 라이프사이클:**

- `/sc:load` - 프로젝트 컨텍스트 로딩
- `/sc:save` - 세션 컨텍스트 저장
- `/sc:reflect` - 작업 반성 및 검증

**분석 명령어:**

- `/sc:business-panel` - 비즈니스 전문가 패널
- `/sc:spec-panel` - 사양 전문가 리뷰
- `/sc:select-tool` - 지능형 도구 선택

### 6.2 주요 명령어 상세

#### `/sc:analyze` - 종합 코드 분석

```bash
# 전체 프로젝트 분석
/sc:analyze

# 보안 집중 분석
/sc:analyze src/auth --focus security --depth deep

# 성능 분석
/sc:analyze --focus performance --format report
```

**분석 도메인:** quality | security | performance | architecture

#### `/sc:implement` - 기능 구현

```bash
# React 컴포넌트 구현
/sc:implement "사용자 프로필 컴포넌트" --type component --framework react

# API 구현 (테스트 포함)
/sc:implement "사용자 인증 API" --type api --safe --with-tests
```

**MCP 통합:** Context7 (프레임워크), Magic (UI), Sequential (계획), Playwright (테스트)

#### `/sc:business-panel` - 비즈니스 전문가 패널

```bash
# 전략 문서 분석 (토론 모드)
/sc:business-panel @strategy.pdf --mode discussion

# 특정 전문가 지정 (토론 모드)
/sc:business-panel "혁신 전략" --experts "christensen,drucker"

# 도전적 분석 (토론 모드)
/sc:business-panel @document.pdf --mode debate
```

**9인 전문가 패널:**
| 전문가 | 프레임워크 | 심볼 |
|--------|-----------|------|
| Clayton Christensen | 파괴적 혁신, JTBD | 🔨 |
| Michael Porter | 5 Forces, 가치 사슬 | ⚔️ |
| Peter Drucker | 경영 철학, MBO | 🧭 |
| Seth Godin | 퍼플 카우, 트라이브 | 🎪 |
| Kim & Mauborgne | 블루 오션 전략 | 🌊 |
| Jim Collins | Good to Great, 플라이휠 | 🚀 |
| Nassim Taleb | 안티프래질, 블랙 스완 | 🛡️ |
| Donella Meadows | 시스템 사고, 레버리지 | 🕸️ |
| Jean-luc Doumont | 구조화된 커뮤니케이션 | 💬 |

**분석 모드:**

- **DISCUSSION** - 협업적 다중 관점 분석 (기본)
- **DEBATE** - 아이디어 스트레스 테스트
- **SOCRATIC** - 질문 기반 탐색

#### `/sc:task` - 복잡한 작업 관리

```bash
# 체계적 전략으로 인증 시스템 생성
/sc:task create "엔터프라이즈 인증" --strategy systematic --parallel

# 애자일 전략으로 기능 백로그 실행
/sc:task execute "기능 백로그" --strategy agile --delegate
```

**작업 계층:** Epic → Story → Task → Subtask

#### `/sc:brainstorm` - 요구사항 발견

```bash
# 체계적 심층 브레인스토밍
/sc:brainstorm "AI 기반 프로젝트 관리 도구" --strategy systematic --depth deep

# 병렬 애자일 브레인스토밍
/sc:brainstorm "실시간 협업" --strategy agile --parallel
```

**출력:** 구체적인 사양 및 구현 브리프

### 6.3 세션 관리 패턴

```bash
# 1. 세션 시작
/sc:load

# 2. 작업 수행...

# 3. 체크포인트 저장 (30분마다 권장)
/sc:save --checkpoint

# 4. 세션 종료 전 저장
/sc:save --type all --summarize
```

---

## 7. MCP 서버 통합

### 7.1 Context7 - 공식 문서 조회

**트리거:**

- import 문 (`import`, `require`, `from`, `use`)
- 프레임워크 키워드 (React, Vue, Angular, Next.js 등)
- 라이브러리 API 질문

**예시:**

```
"implement React useEffect" → Context7 (공식 React 패턴)
"add authentication with Auth0" → Context7 (공식 Auth0 문서)
```

### 7.2 Sequential - 다단계 추론

**트리거:**

- 복잡한 디버깅 (3+ 레이어)
- 아키텍처 분석
- `--think`, `--think-hard`, `--ultrathink` 플래그

**예시:**

```
"why is this API slow?" → Sequential (체계적 성능 분석)
"design microservices architecture" → Sequential (구조화된 시스템 설계)
```

### 7.3 Morphllm - 패턴 기반 편집

**트리거:**

- 일관된 패턴의 다중 파일 편집
- 프레임워크 업데이트, 스타일 가이드 적용
- 대량 텍스트 교체

**예시:**

```
"update all React class components to hooks" → Morphllm
"replace all console.log with logger calls" → Morphllm
```

---

## 8. 실전 활용 패턴

### 8.1 프로젝트 설정

```bash
/sc:load                                    # 프로젝트 컨텍스트 로딩
/sc:analyze                                 # 코드베이스 분석
/sc:index . --type structure                # 문서 생성
```

### 8.2 기능 구현

```bash
/sc:brainstorm "기능 아이디어"              # 요구사항 발견
/sc:workflow feature-spec.md                # 구현 계획 생성
/sc:implement "기능명" --with-tests         # 테스트와 함께 구현
/sc:test --coverage                         # 품질 검증
```

### 8.3 코드 품질 개선

```bash
/sc:analyze --focus quality                 # 품질 평가
/sc:improve src/ --type quality --safe      # 개선 적용
/sc:cleanup --type all --interactive        # 코드 정리
/sc:test --coverage                         # 개선 검증
```

### 8.4 전략 분석

```bash
/sc:business-panel @strategy.pdf            # 비즈니스 분석
/sc:spec-panel @requirements.yml            # 사양 리뷰
/sc:estimate "project" --breakdown          # 개발 추정
```

### 8.5 디버깅

```bash
/sc:troubleshoot "에러 메시지" --type bug --trace
/sc:analyze --focus security                # 보안 점검
/sc:test --watch --fix                      # 테스트 기반 디버깅
```

### 8.6 7-병렬-작업 패턴 (대규모 코드베이스)

```
메인 에이전트: "7개 병렬 작업으로 분석"
├─ 작업 1: 디렉토리 A 분석
├─ 작업 2: 디렉토리 B 분석
├─ 작업 3: 디렉토리 C 분석
├─ 작업 4: 디렉토리 D 분석
├─ 작업 5: 디렉토리 E 분석
├─ 작업 6: 디렉토리 F 분석
└─ 작업 7: 디렉토리 G 분석

결과: ~7배 유효 컨텍스트로 분석
```

---

## 핵심 요약

### Claude Code 핵심 이점

1. **에이전틱 루프**: 도구 호출, 결과 통합, 반복적 개선
2. **컨텍스트 관리**: 자동 압축, 세션 지속성
3. **계층적 설정**: 엔터프라이즈 → 사용자 → 프로젝트 → 로컬
4. **훅 자동화**: 결정론적 작업 실행
5. **병렬 실행**: 7배 컨텍스트 활용

### SuperClaude 프레임워크 이점

1. **24개 SC 명령어**: 전체 개발 라이프사이클 커버
2. **20개 에이전트**: 시스템(6) + 아키텍처(4) + 전문분야(10)
3. **9인 비즈니스 전문가**: 전략적 분석
4. **6개 MCP 서버**: 특화된 기능
5. **토큰 효율**: 30-50% 감소

### 권장 워크플로우

```
/sc:load → 작업 → 체크포인트(30분) → /sc:save
```

### 플래그 우선순위

- 안전 우선: `--safe-mode` > `--validate` > 최적화 플래그
- 깊이 계층: `--ultrathink` > `--think-hard` > `--think`
- MCP 제어: `--no-mcp`가 모든 개별 MCP 플래그 오버라이드

---

## Changelog (변경 이력)

| 버전  | 날짜       | 변경 내용                          |
| ----- | ---------- | ---------------------------------- |
| 0.0.1 | 2025-12-04 | 삭제된 PHASE_DEV_DOC_GUIDE.md 참조 제거 |
| 0.0.0 | 2025-12-02 | 초기 버전                          |
