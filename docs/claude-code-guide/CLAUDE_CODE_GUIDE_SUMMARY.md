# Claude Code 추천 명령어 조합

> **Version**: 0.0.2
> **Last Updated**: 2025-12-04

전체 가이드: [CLAUDE_CODE_GUIDE_DETAIL.md](./CLAUDE_CODE_GUIDE_DETAIL.md)

---

### 템플릿 기반 파일 개선

```bash
/sc:improve @파일 --reference @템플릿파일

# 예시
/sc:improve @docs/phases/01-foundation/1.5-teapot.md --reference @docs/phases/templates/PHASE_DEV_TEMPLATE.md
```

### 문서/파일 분석 및 점검

```bash
# 1. 종합 점검 (심층 분석)
/sc:analyze @파일 --ultrathink --deep --seq
/sc:analyze @docs --ultrathink --deep --seq                 # 예시

# 2. 품질 중심 분석
/sc:analyze @파일 --think-hard --focus quality
/sc:analyze @docs/DEV_GUIDE.md --think-hard --focus quality # 예시

# 3. 코드-문서 정합성 확인 (아키텍처 동기화 검증)
/sc:analyze @파일 --focus architecture --seq
/sc:analyze @docs --focus architecture --seq                # 예시

```

---

## Changelog (변경 이력)

| 버전  | 날짜       | 변경 내용                                                   |
| ----- | ---------- | ----------------------------------------------------------- |
| 0.0.2 | 2025-12-04 | 삭제된 PHASE_DEV_DOC_GUIDE.md 참조 제거                      |
| 0.0.1 | 2025-12-03 | 문서 분석 및 점검 예시 추가                                  |
| 0.0.0 | 2025-12-02 | 초기 버전                                                   |
