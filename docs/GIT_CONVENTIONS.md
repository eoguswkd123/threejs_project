# Git 커밋 규칙 (Conventional Commits)

Three.js CAD Viewer 프로젝트의 Git 워크플로우 및 커밋 규칙 가이드입니다.

이 프로젝트는 **Conventional Commits** 표준을 따릅니다.

## 목차

- [브랜치 전략](#브랜치-전략)
- [커밋 메시지 규칙](#커밋-메시지-규칙)
- [Pull Request(PR) 규칙](#pull-requestpr-규칙)
- [Git 유용한 명령어](#git-유용한-명령어)
- [참고 자료](#참고-자료)

---

## 브랜치 전략

### 브랜치 구조

```
master ← PR ← develop ← PR ← 기능명_이름
```

| 브랜치        | 설명                                   |
| ------------- | -------------------------------------- |
| `master`      | 프로덕션 배포 브랜치 (안정된 릴리스만) |
| `develop`     | 개발 통합 브랜치 (다음 릴리스 준비)    |
| `기능명_이름` | 개인 작업 브랜치 (모든 작업)           |

### 브랜치 네이밍 규칙

**형식**: `기능명_이름`

**규칙**:

- 소문자 사용
- 기능명은 하이픈(`-`)으로 단어 구분
- 언더스코어(`_`)로 이름 연결
- 영문 또는 영문+숫자 조합 (한글 ❌)
- 같은 기능 여러 명 작업 시 각자 브랜치 생성

**예시**:

- `cad-layer-filter_kim`
- `fix-rotation-bug_lee`
- `update-readme_park`

### 브랜치 워크플로우

#### 1. 새 작업 시작

```bash
# 1. develop에서 최신 코드 가져오기
git checkout develop
git pull origin develop

# 2. 작업 브랜치 생성 (기능명_이름)
git checkout -b cad-layer-filter_kim

# 3. 작업 및 커밋 (Conventional Commits 형식)
git add .
git commit -m "feat: 레이어 필터링 UI 추가"

# 4. 원격 저장소에 푸시
git push origin cad-layer-filter_kim

# 5. GitHub에서 develop으로 PR 생성
```

#### 2. 릴리스 (develop → master)

```bash
# develop이 안정화되면 master로 PR 생성
# GitHub에서 develop → master PR 생성 및 머지
```

---

## 커밋 메시지 규칙

### 커밋 타입

| 타입       | 설명                                           | 예시                                    |
| ---------- | ---------------------------------------------- | --------------------------------------- |
| `feat`     | 새로운 기능 추가                               | `feat: CAD 레이어 필터링 기능 추가`     |
| `fix`      | 버그 수정                                      | `fix: 뷰어 회전 시 좌표계 오류 해결`    |
| `docs`     | 문서 변경                                      | `docs: API 사용 가이드 업데이트`        |
| `style`    | 코드 포맷팅, 세미콜론 추가 등 (기능 변경 없음) | `style: Prettier 적용`                  |
| `refactor` | 코드 리팩토링 (버그 수정, 기능 추가 아님)      | `refactor: CAD 파서 구조 개선`          |
| `perf`     | 성능 개선                                      | `perf: Three.js 렌더링 최적화`          |
| `test`     | 테스트 코드 추가/수정                          | `test: 레이어 패널 단위 테스트 추가`    |
| `build`    | 빌드 시스템, 외부 종속성 변경                  | `build: Vite 5.0으로 업그레이드`        |
| `ci`       | CI 설정 파일 및 스크립트 변경                  | `ci: GitHub Actions 워크플로우 추가`    |
| `chore`    | 기타 변경 사항 (프로덕션 코드 변경 없음)       | `chore: .gitignore 업데이트`            |
| `revert`   | 이전 커밋 되돌리기                             | `revert: feat: 레이어 필터링 기능 제거` |

**중요**:

- 타입은 **영문 소문자만** 사용
- 콜론(`:`) 뒤에 **공백 하나** 필수
- 제목은 **명령형 현재 시제** 사용

### 타입 선택 가이드

**핵심 질문**: "사용자가 이 변경을 느낄 수 있나?"

| 사용자 영향 있음 (YES)  | 사용자 영향 없음 (NO) |
| ----------------------- | --------------------- |
| 새 기능? → `feat`       | 문서 작업? → `docs`   |
| 버그 수정? → `fix`      | 테스트? → `test`      |
| 더 빨라짐? → `perf`     | 빌드 설정? → `build`  |
| 코드 정리? → `refactor` | CI/CD? → `ci`         |
| 스타일링? → `style`     | 기타 설정? → `chore`  |

### 커밋 메시지 작성 가이드

#### ✅ 좋은 예시

```bash
# 기본 형식
feat: 3D 모델 선택 시 속성 패널 표시

# 상세한 본문
feat: 3D 모델 선택 시 속성 패널 표시

- 마우스 클릭으로 CAD 객체 선택 기능 구현
- 선택된 객체의 레이어, 색상, 크기 정보 표시
- Three.js Raycaster를 사용한 정확한 객체 감지

Closes #42
```

#### ❌ 나쁜 예시

```bash
# 너무 모호함
update

# 타입 없음
CAD 뷰어 수정

# 타입 대문자 사용 (잘못됨)
FEAT: 로그인 기능 추가

# 콜론 뒤 공백 없음 (잘못됨)
feat:로그인 기능 추가

# 과거형 사용 (잘못됨)
feat: 로그인 기능을 추가했음

# 너무 장황함
feat: CAD 파일을 불러올 때 DXF 파서를 사용해서 엔티티를 파싱하고 Three.js 지오메트리로 변환한 다음 씬에 추가하는 기능을 구현했습니다
```

### 커밋 제목 작성 팁

1. **50자 이내**로 작성
2. **마침표 사용 안 함**
3. **명령형 현재 시제** 사용
    - ✅ "추가" / "수정" / "변경"
    - ❌ "추가함" / "추가했음" / "추가합니다"
4. **구체적으로** 작성
    - ✅ `fix: 레이어 패널 null 에러 수정`
    - ❌ `fix: 버그 수정`

---

## Pull Request(PR) 규칙

PR 제목은 커밋 메시지 형식과 동일하게 작성합니다. (예: `feat: 레이어 필터링 기능 추가`)

---

## Git 유용한 명령어

```bash
# 브랜치 관리
git branch -a                    # 모든 브랜치 확인
git branch -d old-feature_kim    # 브랜치 삭제
git fetch --prune               # 삭제된 원격 브랜치 정리

# 자격증명 설정
git remote -v                    # 원격 저장소 경로 확인
git remote set-url origin https://사용자명@github.com/조직/저장소.git  # 자격증명 포함 URL 설정
```

---

## 참고 자료

### 프로젝트 문서

- [아키텍처 가이드](ARCHITECTURE.md) - 프로젝트 구조 및 설계
- [개발 가이드](DEV_GUIDE.md) - 개발 환경 설정 및 코딩 규칙
- [로드맵](ROADMAP.md) - 프로젝트 개발 계획
- [용어집](GLOSSARY.md) - 용어 및 약어 정의

### Conventional Commits

- [Conventional Commits 공식 사이트](https://www.conventionalcommits.org/) - 표준 스펙 및 가이드
- [Conventional Commits 한글](https://www.conventionalcommits.org/ko/v1.0.0/) - 한국어 번역 문서

### 도구 및 자동화

- [commitlint](https://commitlint.js.org/) - 커밋 메시지 검증 도구
- [commitizen](https://github.com/commitizen/cz-cli) - 대화형 커밋 메시지 작성 도구
- [semantic-release](https://semantic-release.gitbook.io/) - 자동 버전 관리 및 릴리스
- [standard-version](https://github.com/conventional-changelog/standard-version) - CHANGELOG 자동 생성

### Git 워크플로우

- [GitHub Flow](https://guides.github.com/introduction/flow/) - GitHub 워크플로우 가이드
- [Git 브랜치 전략](https://nvie.com/posts/a-successful-git-branching-model/) - Git Flow 모델

---

**문서 버전**: 0.1.0
**최종 업데이트**: 2025-12-02
**작성자**: Development Team
