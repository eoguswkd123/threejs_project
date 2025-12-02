# Claude Code 추천 명령어 조합

> 전체 가이드: [CLAUDE_CODE_GUIDE_DETAIL.md](./CLAUDE_CODE_GUIDE_DETAIL.md)

---

### 전문가 병렬 검수 후 파일 생성

`/sc:spec-panel @파일 --ultrathink --parallel`

### 템플릿 기반 파일 개선

```bash
/sc:improve @파일 --reference @템플릿파일

# 예시
/sc:improve @docs/phases/01-foundation/1.5-teapot.md --reference @docs/phases/templates/PHASE_DEV_TEMPLATE.md
```
