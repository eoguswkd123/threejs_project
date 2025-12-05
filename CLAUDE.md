# ThreeJS CAD Viewer - Claude 지침

## 1. 문서 네비게이션

| 찾는 것                   | 읽을 문서              |
| ------------------------- | ---------------------- |
| 폴더 구조, 레이어 역할    | `docs/ARCHITECTURE.md` |
| 네이밍, import 순서, 패턴 | `docs/DEV_GUIDE.md`    |
| 로드맵, 일정              | `docs/ROADMAP.md`      |
| 용어 및 약어 정의         | `docs/GLOSSARY.md`     |

## 2. 코드 작성 규칙

**트리거**: 새 파일 생성, 기존 코드 수정 시

1. `docs/DEV_GUIDE.md` 컨벤션 먼저 확인
2. 기존 패턴 확인 (Read 도구로 유사 파일 읽기)
3. 새 파일 생성 시 `index.ts` barrel export 추가
4. TypeScript strict mode 준수

## 3. 문서 관리 (필수 준수)

**트리거**: `docs/**/*.md` 문서 작성/수정 시

**문서 형식 (필수):**

모든 `docs/**/*.md` 문서는 다음 형식을 준수:

**상단 메타데이터:**

```markdown
> **Version**: X.Y.Z
> **Last Updated**: YYYY-MM-DD
```

**하단 Changelog:**

```markdown
## Changelog (변경 이력)

| 버전  | 날짜       | 변경 내용 |
| ----- | ---------- | --------- |
| X.Y.Z | YYYY-MM-DD | 변경 설명 |
```

**🔴 문서 수정 시 필수 체크리스트:**

1. ☐ Changelog 마지막 항목의 **날짜** 확인
2. ☐ 아래 표에 따라 버전 결정:

| 조건              | 버전 변경            | Changelog 처리        |
| ----------------- | -------------------- | --------------------- |
| 같은 날           | ❌ 변경 금지         | 기존 항목에 내용 병합 |
| 다른 날 (같은 달) | PATCH +1             | 새 항목 추가          |
| 월 변경           | MINOR +1, PATCH 리셋 | 새 항목 추가          |
| 연 변경           | MAJOR +1             | 새 항목 추가          |

3. ☐ Version 업데이트
4. ☐ Last Updated 업데이트
5. ☐ Changelog 항목 추가/병합 (최신이 위, 최대 10건)
6. ☐ 구현 상태 업데이트 (체크리스트 ✅ 표시)

## 4. Git 안전 규칙 (중요)

**사용자 명시적 요청 없이 절대 금지:**

- ❌ `git commit` - 커밋 금지
- ❌ `git push` / `git pull` - 원격 저장소 조작 금지
- ❌ `git checkout` / `git switch` - 브랜치 변경 금지
- ❌ `git merge` / `git rebase` - 병합 작업 금지
- ❌ `git reset` / `git revert` - 히스토리 변경 금지
- ❌ `git stash` - 스태시 조작 금지

**허용되는 Git 명령 (읽기 전용):**

- ✅ `git status` - 상태 확인
- ✅ `git diff` - 변경 내용 확인
- ✅ `git log` - 히스토리 조회
- ✅ `git branch` - 브랜치 목록 조회

## 5. 제약사항

- TypeScript strict mode 필수
- ESLint + Prettier 사전 커밋 훅 적용
- React Three Fiber 필수 (vanilla Three.js 사용 금지)

## 6. Claude 전용 설정

> ⚠️ 이 섹션은 Claude Code/SuperClaude 프레임워크 전용입니다.

### 작업 완료 후 메타 피드백 (필수)

**트리거**: 모든 사용자 요청 완료 시

모든 사용자 요청 완료 후, 다음 2가지 평가를 **반드시** 제공:

1. **SuperClaude 플래그 최적화 제안**
    - 현재 요청에 더 적합한 플래그 조합 제안
    - 예: "이 작업은 `--think` 대신 `--think-hard --c7` 조합이 더 효과적"

2. **요청 적절성 평가**
    - ✅ 적절: 요청과 플래그가 최적으로 매칭
    - ⚠️ 개선 가능: 더 나은 접근법 존재
    - ❌ 부적절: 요청 재구성 필요
