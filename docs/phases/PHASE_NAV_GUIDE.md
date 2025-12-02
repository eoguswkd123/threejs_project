# Phase 문서 가이드

> CAD Viewer 프로젝트의 Phase별 구현 문서 네비게이션

---

## 카테고리 구조

```
phases/
├── 01-foundation/     # 기반 구축 (Phase 1, 1.5)
├── 02-cad-features/   # CAD 뷰어 기능 (Phase 2A, 2B)
├── 03-backend/        # 백엔드 & 인프라 (Phase 3)
├── 04-sync/           # 동기화 & 성능 (Phase 4, 4.5)
├── 05-production/     # 프로덕션 준비 (Phase 5, 6, 7)
└── templates/         # 문서 템플릿
```

---

## Quick Links

| 카테고리         | Phase | 문서                                                    | 상태    |
| ---------------- | ----- | ------------------------------------------------------- | ------- |
| **Foundation**   | 1.5   | [Three.js 학습 (Teapot)](./01-foundation/1.5-teapot.md) | ✅ 완료 |
| **CAD Features** | 2A    | [DXF CAD Viewer](./02-cad-features/2a-dxf-viewer.md)    | 🔄 80%  |
| **CAD Features** | 2B    | PDF CAD Viewer                                          | 📋 대기 |
| **Backend**      | 3     | Backend + Security + Monitoring                         | 📋 계획 |
| **Sync**         | 4     | Synchronization                                         | 📋 계획 |
| **Sync**         | 4.5   | Performance Optimization                                | 📋 계획 |
| **Production**   | 5     | Staging & E2E Testing                                   | 📋 계획 |
| **Production**   | 6     | Enhancement                                             | 📋 계획 |
| **Production**   | 7     | Production & Scale                                      | 📋 계획 |

---

## 카테고리별 설명

### 01-foundation (기반 구축)

프로젝트 기반 구조 + CI/CD 파이프라인 + 3D 렌더링 인프라

- **Phase 1**: Vite + React + TypeScript, ESLint/Prettier, R3F 기본 씬
- **Phase 1.5**: Three.js 학습 (Teapot 예제)

### 02-cad-features (CAD 뷰어 기능)

프론트엔드 CAD 파일 렌더링 기능

- **Phase 2A**: DXF 파일 파싱 + 3D 와이어프레임 렌더링
- **Phase 2B**: PDF 도면 → ML 분석 → 3D 변환 (백엔드 연동)

### 03-backend (백엔드 & 인프라)

백엔드 서버 + 보안 + 모니터링

- **Phase 3**: FastAPI, Celery, PostgreSQL, Redis, MinIO, Prometheus/Grafana

### 04-sync (동기화 & 성능)

멀티 디바이스 동기화 및 성능 최적화

- **Phase 4**: WebSocket 기반 키오스크 실시간 동기화
- **Phase 4.5**: LOD, Instancing, 메모리 관리

### 05-production (프로덕션 준비)

스테이징, 테스트, 배포

- **Phase 5**: E2E 테스트 (Playwright), 부하 테스트 (Locust)
- **Phase 6**: 다국어, 다크모드, 접근성 (WCAG 2.1)
- **Phase 7**: Kubernetes, Blue-Green 배포, Disaster Recovery

---

## 네이밍 규칙

| 대상   | 규칙                  | 예시                                |
| ------ | --------------------- | ----------------------------------- |
| 폴더명 | `숫자-kebab-case`     | `01-foundation`, `02-cad-features`  |
| 파일명 | `Phase번호-기능명.md` | `1.5-teapot.md`, `2a-dxf-viewer.md` |

---

## 관련 문서

| 문서                                                         | 설명                   |
| ------------------------------------------------------------ | ---------------------- |
| [ROADMAP.md](../ROADMAP.md)                                  | 전체 프로젝트 로드맵   |
| [ARCHITECTURE.md](../ARCHITECTURE.md)                        | 시스템 아키텍처        |
| [PHASE_DEV_TEMPLATE.md](./templates/PHASE_DEV_TEMPLATE.md)   | Phase 문서 템플릿      |
| [PHASE_DEV_DOC_GUIDE.md](./templates/PHASE_DEV_DOC_GUIDE.md) | 문서 작성 규칙         |
| [1.5_TEAPOT_DEMO.md](./01-Foundation/1.5_TEAPOT_DEMO.md)     | Three.js 학습 (Teapot) |
| [2A_DXF_VIEWER.md](./02-CadFeatures/2A_DXF_VIEWER.md)        | DXF CAD Viewer 구현    |

---

_Phase Documentation Guide - Last Updated: 2025-12-02_
