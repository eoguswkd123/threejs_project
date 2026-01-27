# Phase 문서 가이드

> **Version**: 0.0.5
> **Last Updated**: 2025-12-30
>
> CAD Viewer 프로젝트의 Phase별 구현 문서 네비게이션

---

## 카테고리 구조

```
phases/
├── 01-Foundation/     # 기반 구축 (Phase 1, 1.5)
├── 02-CadViewer/      # CAD 뷰어 기능 (Phase 2.1, 2.2)
├── 03-Backend/        # 백엔드 & 인프라 (Phase 3)
├── 04-Sync/           # 동기화 & 성능 (Phase 4, 4.5)
├── 05-Production/     # 프로덕션 준비 (Phase 5, 6, 7)
└── templates/         # 문서 템플릿
```

---

## Quick Links

| 카테고리         | Phase | 문서                                                                 | 상태      |
| ---------------- | ----- | -------------------------------------------------------------------- | --------- |
| **Foundation**   | 1.2   | [Three.js Demo (Teapot)](./01-Foundation/1.2_THREEJS_DEMO_TEAPOT.md) | ✅ 완료   |
| **CAD Viewer**   | 2.1   | [DXF CAD Viewer](./02-CadViewer/2.1_DXF_VIEWER.md)                   | 🔄 진행중 |
| **CAD Features** | 2.2   | PDF CAD Viewer                                                       | ⏳ 차단됨 |
| **Backend**      | 3.2.2 | [Worker Viewer](./03-Backend/3.2.2_WORKER_VIEWER.md)                 | ✅ 완료   |
| **Backend**      | 3     | Backend + Security + Monitoring                                      | 📋 계획   |
| **Sync**         | 4     | Synchronization                                                      | 📋 계획   |
| **Sync**         | 4.5   | Performance Optimization                                             | 📋 계획   |
| **Production**   | 5     | Staging & E2E Testing                                                | 📋 계획   |
| **Production**   | 6     | Enhancement                                                          | 📋 계획   |
| **Production**   | 7     | Production & Scale                                                   | 📋 계획   |

---

## 카테고리별 설명

### 01-foundation (기반 구축)

프로젝트 기반 구조 + CI/CD 파이프라인 + 3D 렌더링 인프라

- **Phase 1.1**: Vite + React + TypeScript, ESLint/Prettier, R3F 기본 씬, CI/CD
- **Phase 1.2**: Three.js Demo (Teapot)

### 02-cad-features (CAD 뷰어 기능)

프론트엔드 CAD 파일 렌더링 기능

- **Phase 2.1**: DXF 파일 파싱 + 3D 와이어프레임 렌더링
- **Phase 2.2**: PDF 도면 → ML 분석 → 3D 변환 (백엔드 연동)

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

## 관련 문서

| 문서                                                                     | 설명                   |
| ------------------------------------------------------------------------ | ---------------------- |
| [ROADMAP.md](../ROADMAP.md)                                              | 전체 프로젝트 로드맵   |
| [ARCHITECTURE.md](../ARCHITECTURE.md)                                    | 시스템 아키텍처        |
| [PHASE_DEV_TEMPLATE.md](./templates/PHASE_DEV_TEMPLATE.md)               | Phase 문서 템플릿      |
| [1.2_THREEJS_DEMO_TEAPOT.md](./01-Foundation/1.2_THREEJS_DEMO_TEAPOT.md) | Three.js Demo (Teapot) |
| [2.1_DXF_VIEWER.md](./02-CadViewer/2.1_DXF_VIEWER.md)                    | DXF CAD Viewer 구현    |
| [3.2.2_WORKER_VIEWER.md](./03-Backend/3.2.2_WORKER_VIEWER.md)            | Worker Viewer 구현     |

---

## Changelog (변경 이력)

| 버전  | 날짜       | 변경 내용                                                                                                                                                                      |
| ----- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 0.0.5 | 2025-12-30 | Phase 2.1 진행률 75% 확인, 훅 네이밍 표준화/컴포넌트 테스트 추가 반영                                                                                                          |
| 0.0.4 | 2025-12-18 | Phase 2.1 상태 수정 (✅→🔄 진행중), 실제 구현 상태와 동기화                                                                                                                    |
| 0.0.3 | 2025-12-16 | Phase 3.2.2 Worker Viewer 추가, Phase 2B→2.2 번호 수정, 상태 아이콘 통일 (⏳ 차단됨), Phase 1.2 네이밍 변경 (Three.js Demo (Teapot)), 파일명 변경 (1.2_THREEJS_DEMO_TEAPOT.md) |
| 0.0.2 | 2025-12-03 | Phase 2.1 완료 상태 반영                                                                                                                                                       |
| 0.0.1 | 2025-12-02 | 초기 문서 작성, 버전 메타데이터 및 Changelog 추가                                                                                                                              |
