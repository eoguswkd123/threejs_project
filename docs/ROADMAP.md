# Roadmap

> **Version**: 0.1.3
> **Last Updated**: 2025-12-04

CAD Viewer 프로젝트 로드맵 - DevOps 모범사례 적용 버전

---

## 프로젝트 비전

Three.js 기반 CAD 뷰어에서 시작하여, **건축 도면 → 3D 모델 변환 → 키오스크 연동 시스템**으로 발전하는 프로젝트

### 최종 목표

1. CAD 도면 업로드 → 백엔드 3D 변환 → 파일서버 저장
2. JSON API로 프론트엔드에서 3D 모델 렌더링
3. 키오스크 연동 및 키오스크 간 실시간 동기화

### 상태 표시 범례

| 아이콘 | 상태   | 설명                          |
| ------ | ------ | ----------------------------- |
| ✅     | 완료   | 100% 완료 및 검증됨           |
| 🔄     | 진행중 | 현재 작업 중 (퍼센티지 표시)  |
| 📋     | 계획됨 | 설계 완료, 실행 대기          |
| ⏳     | 차단됨 | 의존성 미충족으로 대기        |
| ⏸️     | 보류   | 코드 삭제됨, 향후 재구현 예정 |

### 타임라인 개요 (DevOps 최적화)

| Phase    | 이름                    | 예상 기간 | 소요 기간 | 상태        | 비고                  |
| -------- | ----------------------- | --------- | --------- | ----------- | --------------------- |
| 1        | Foundation + CI/CD      | 1-2주     | 1주       | ✅ 완료     | CI/CD Day 1 적용      |
| **1.5**  | **Three.js 학습**       | 1주       | 3일       | **✅ 완료** | **Teapot 예제**       |
| **2A**   | **DXF CAD Viewer**      | 2-3주     | 2주       | **✅ 완료** | **프론트엔드 전용**   |
| **3A**   | **Core Backend**        | 5주       | -         | 📋 대기     | 인증 우선, 인프라     |
| **3B**   | **Processing Engine**   | 5주       | -         | ⏳ 대기     | 3A 의존               |
| **3C**   | **Communication & Ops** | 5주       | -         | ⏳ 대기     | 3A, 3B 의존           |
| **2B**   | **PDF CAD Viewer**      | 1주       | -         | **⏳ 대기** | **P3A.3, P3B.1 의존** |
| 4        | Synchronization         | 4주       | -         | ⏳ 대기     | P3C.1 의존            |
| 4.5      | Performance             | 2-3주     | -         | 📋 계획     | P3B.1 이후 권장       |
| 5        | Staging & E2E           | 3주       | -         | 📋 계획     | E2E 테스트 집중       |
| 6        | Enhancement             | 4주       | -         | 📋 계획     | UX/접근성             |
| 7        | Production & Scale      | 4주       | -         | 📋 계획     | K8s, Blue-Green       |
| **총계** |                         | **9개월** | **~10일** |             |                       |

---

## Phase 1: Foundation + DevOps 기반 ✅

> **Status**: ✅ COMPLETED | **Progress**: 100%

### 목표

프로젝트 기반 구조 + **CI/CD 파이프라인** + 3D 렌더링 인프라 구축

### Milestones

| Milestone       | 주요 내용                                         | Status |
| --------------- | ------------------------------------------------- | ------ |
| 프로젝트 초기화 | Vite + React + TypeScript 설정                    | ✅     |
| 코드 품질       | ESLint + Prettier + 경로 별칭                     | ✅     |
| 아키텍처        | Layer-Based 구조, Zustand 스토어                  | ✅     |
| 라우팅          | React Router v6 설정                              | ✅     |
| Three.js 기반   | R3F 기본 씬, OrbitControls                        | ✅     |
| 레이아웃        | MainLayout, SideBar, Footer                       | ✅     |
| **패키지 구조** | features/, services/, stores/ 설계                | ✅     |
| **문서 작성**   | ARCHITECTURE, DEV_GUIDE, GIT_CONVENTIONS, ROADMAP | ✅     |
| **CI/CD 기본**  | GitHub Actions (lint + type-check + build)        | ✅     |
| **환경 정의**   | Dev/Staging/Prod 환경 변수 템플릿                 | ✅     |

### CI/CD 기본 설정 (Day 1)

**GitHub Actions Workflow**

- ✅ PR 생성 시 자동 검사
- ✅ lint (ESLint)
- ✅ type-check (tsc --noEmit)
- ✅ build (Vite)
- ✅ 브랜치 보호 규칙 설정

**환경 정의**

- ✅ `.env.development` 템플릿
- ✅ `.env.staging` 템플릿
- ✅ `.env.production` 템플릿
- ✅ `.env.example` (문서화)

---

## Phase 1.5: Three.js 학습 ✅

> **Status**: ✅ COMPLETED | **Progress**: 100%

### 목표

Three.js와 React Three Fiber를 활용한 3D 렌더링 기초 학습

### Milestones

| Milestone           | 주요 내용                       | Status |
| ------------------- | ------------------------------- | ------ |
| **Teapot 예제**     | Three.js 와이어프레임 학습 예제 | ✅     |
| **GUI 컨트롤**      | lil-gui 파라미터 조정 패널      | ✅     |
| **OrbitControls**   | 카메라 회전/확대/이동 제어      | ✅     |
| **Material 시스템** | 와이어프레임, 색상, 투명도      | ✅     |

### 학습 성과

- React Three Fiber (R3F) 선언적 3D 렌더링 패턴 이해
- Three.js 지오메트리, 머티리얼, 메쉬 구조 학습
- lil-gui를 통한 런타임 파라미터 조정 구현
- memo, useMemo 최적화 패턴 적용

### 관련 문서

- [1.5_TEAPOT_DEMO.md](./phases/01-Foundation/1.5_TEAPOT_DEMO.md)

---

## Phase 2A: DXF CAD Viewer ✅

> **Status**: ✅ COMPLETED | **Progress**: 100%
> **의존성**: Phase 1.5 완료 ✅

### 목표

DXF 파일을 **프론트엔드에서** 파싱하여 3D 와이어프레임으로 렌더링 (백엔드 불필요)

### 세부 단계

```
Phase 2A: DXF CAD Viewer
├── 2A.1 MVP (LINE 엔티티만)                  ✅ 완료
├── 2A.2 엔티티 확장 (ARC, CIRCLE, POLYLINE)  ✅ 완료
├── 2A.3 레이어 기능                          ✅ 완료
├── 2A.4 성능 최적화                          ✅ 완료
└── 2A.5 Unit 테스트                          ✅ 완료
```

### Milestones

| Milestone            | 주요 내용                                  | Status |
| -------------------- | ------------------------------------------ | ------ |
| **2A.1 MVP**         | LINE 엔티티 파싱 + 렌더링                  | ✅     |
| **파일 업로드**      | 드래그앤드롭, 타입/크기 검증               | ✅     |
| **CAD Scene**        | 3D 렌더링 컴포넌트                         | ✅     |
| **Viewer Controls**  | 그리드 토글, 색상 변경                     | ✅     |
| **2A.2 ARC/CIRCLE**  | 원호, 원 엔티티 지원                       | ✅     |
| **2A.2 POLYLINE**    | 연결선 (bulge 포함)                        | ✅     |
| **2A.3 Layer Panel** | 레이어 표시/숨김 UI, DXF 색상 매핑         | ✅     |
| **2A.4 성능 최적화** | Geometry 머징, WebWorker, LOD              | ✅     |
| 2A.5 Unit 테스트     | Vitest 단위 테스트 (85개, 커버리지 98.29%) | ✅     |

### 구현 완료 (2A.1~2A.4)

**생성된 파일:**

- `src/features/CADViewer/` - CAD 뷰어 기능 모듈
- `src/pages/CADViewer/` - CAD 뷰어 페이지
- `src/types/dxf-parser.d.ts` - 타입 정의
- `public/samples/simple-room.dxf` - 테스트용 샘플
- `tests/fixtures/dxf/` - 성능 테스트용 DXF 파일
- `tests/scripts/` - 성능 측정 스크립트

**구현된 기능:**

- DXF 파일 드래그앤드롭 업로드
- 파일 타입/크기 검증 (20MB 제한)
- LINE, CIRCLE, ARC, POLYLINE/LWPOLYLINE 엔티티 파싱
- Three.js 와이어프레임 렌더링
- OrbitControls (확대/회전/이동)
- 그리드 표시 토글
- 와이어프레임 색상 변경
- 파일 메타데이터 표시
- 레이어별 색상/가시성 토글 (DXF ACI 1-9 색상 매핑)
- Geometry 머징 (성능 최적화)
- WebWorker 파싱 (2MB 이상 파일)
- LOD (Level of Detail) - 엔티티 수 기반 자동 세그먼트 조절

### 테스트 전략

**Unit Tests** (Vitest, 커버리지 98.29% 달성)

- [x] DXF 파서 유틸리티 테스트 (useDXFParser.test.ts)
- [x] 지오메트리 변환 로직 테스트 (dxfToGeometry.test.ts)
- [x] 파일 검증 로직 테스트 (validators.test.ts)

### 관련 문서

- [2A_DXF_VIEWER.md](./phases/02-CadFeatures/2A_DXF_VIEWER.md)

---

## Phase 2B: PDF CAD Viewer 📋

> **Status**: 📋 WAITING | **Progress**: 0%
> **의존성**: Phase 3.2 파일 관리 API + Phase 3.3 CAD 변환 엔진 필요

### 목표

PDF 도면 파일을 백엔드 ML 분석을 통해 3D 모델로 변환

### 세부 단계

```
Phase 2B: PDF CAD Viewer (백엔드 필요)
├── 2B.1 PDF 업로드 UI
├── 2B.2 백엔드 연동 (Phase 3.2 의존)
├── 2B.3 ML 분석 결과 수신 (Phase 3.3 의존)
└── 2B.4 3D 렌더링
```

### Milestones

| Milestone         | 주요 내용                      | Status  |
| ----------------- | ------------------------------ | ------- |
| PDF 업로드 UI     | PDF 파일 선택 + 업로드         | 📋 TODO |
| Backend API 연동  | Phase 3A.3 API 호출 로직       | 📋 TODO |
| ML 분석 결과 수신 | Phase 3B.1 결과 폴링/WebSocket | 📋 TODO |
| 3D 렌더링         | 분석 결과 → Three.js 렌더링    | 📋 TODO |
| 진행률 표시       | 변환 진행 상태 UI              | 📋 TODO |
| 통합 테스트       | E2E 업로드→분석→렌더링 테스트  | 📋 TODO |

### 의존성 상세

| 의존 Phase | 필요 기능            | 상태    |
| ---------- | -------------------- | ------- |
| Phase 3A.3 | 파일 업로드 API      | 📋 대기 |
| Phase 3B.1 | PDF→ML 분석 엔진     | 📋 대기 |
| Phase 3C.1 | 실시간 진행률 (옵션) | 📋 대기 |

---

## Phase 3A: Core Backend 📋

> **Status**: 📋 PLANNED | **Progress**: 0%
> **목표**: 인증 기반 구축 + 기본 인프라 + 파일 관리 (보안 우선)

### Phase 3 전체 기술 스택

| 컴포넌트             | 선택                                     | 근거                                  |
| -------------------- | ---------------------------------------- | ------------------------------------- |
| **API Layer**        | NestJS / FastAPI / Spring Boot (검토 중) | ADR-001 참조                          |
| **Message Queue**    | RabbitMQ                                 | 메시지 영속성, DLQ (ADR-002)          |
| **Worker Engine**    | Python + Celery                          | CAD 라이브러리 필수 (ezdxf, PyMuPDF)  |
| **Database**         | PostgreSQL                               | 메타데이터, ACID 트랜잭션             |
| **Storage**          | MinIO (S3 호환)                          | 파일 저장, 클라우드 마이그레이션 용이 |
| **CAD Parser**       | ezdxf                                    | DXF 파싱, Python 생태계               |
| **3D Export**        | pygltflib                                | glTF/glb 생성                         |
| **ML Framework**     | PyTorch                                  | YOLOv8/Detectron2 기반                |
| **Inference**        | ONNX RT / TensorRT                       | 추론 가속                             |
| **Image Processing** | OpenCV                                   | 전처리, 컨투어 추출                   |
| **PDF Parser**       | PyMuPDF                                  | PDF 벡터/이미지 추출                  |
| **OCR**              | PaddleOCR                                | 텍스트 인식 (옵션)                    |
| **Monitoring**       | Prometheus + Grafana                     | 메트릭 수집 + 대시보드                |
| **IaC**              | Terraform                                | 인프라 코드화                         |

### Phase 3A Milestones

| Milestone                  | 주요 내용                          | Status  |
| -------------------------- | ---------------------------------- | ------- |
| **3A.1 인증 + OWASP**      | JWT + **OWASP Top 10** (보안 우선) | 📋 TODO |
| **3A.2 기본 인프라 + IaC** | Docker Compose, DB, **Terraform**  | 📋 TODO |
| **3A.3 파일 관리 + 보안**  | API + **파일 보안 검증**           | 📋 TODO |

### 3A.1 인증 + OWASP 상세

> ⚠️ **보안 우선 원칙**: 파일 업로드 API 구현 전에 인증 시스템 먼저 구축

**인증 시스템**

- [ ] JWT 발급/검증 로직
- [ ] 회원가입 API (`POST /api/v1/auth/register`)
- [ ] 로그인 API (`POST /api/v1/auth/login`)
- [ ] 리프레시 토큰 로직
- [ ] 파일 소유권 검증 미들웨어
- [ ] 감사 로그 기록
- [ ] **Rate Limiting** (slowapi + Redis)

**OWASP Top 10**

- [ ] SQL Injection 방지 (ORM 사용)
- [ ] XSS 방지 (입력 검증)
- [ ] CSRF 토큰
- [ ] 인증/인가 검증
- [ ] 보안 헤더 설정 (HSTS, CSP, X-Frame-Options)
- [ ] 민감 데이터 암호화

### 3A.2 기본 인프라 + IaC 상세

**인프라 구축**

- [ ] Docker Compose 환경 구축 (PostgreSQL, Redis, MinIO)
- [ ] FastAPI 프로젝트 초기화 및 구조 설계
- [ ] Alembic 마이그레이션 설정
- [ ] OpenAPI 3.0 문서 자동 생성
- [ ] 환경 변수 관리 (.env, secrets)
- [ ] **ezdxf → pygltflib POC** (2D→3D 변환 검증)

**IaC (Terraform)**

- [ ] Terraform 프로젝트 초기화
- [ ] Docker 리소스 모듈
- [ ] 환경별 변수 파일 (dev/staging/prod)
- [ ] State 백업 설정 (S3 backend)
- [ ] CI/CD Terraform 자동 적용

### 3A.3 파일 관리 + 보안 상세

**파일 관리 API**

- [ ] 파일 업로드 API (`POST /api/v1/files/upload`)
- [ ] 파일 목록 API (`GET /api/v1/files`)
- [ ] 파일 상세 API (`GET /api/v1/files/{file_id}`)
- [ ] 파일 삭제 API (`DELETE /api/v1/files/{file_id}`)
- [ ] 복잡도 분석기 (ezdxf 메타데이터 파싱)
- [ ] MinIO 스토리지 서비스 구현
- [ ] 파일 다운로드 API (presigned URL)

**파일 업로드 보안**

- [ ] 파일 타입 검증 (magic bytes)
- [ ] 파일 크기 제한 (100MB)
- [ ] 악성코드 스캔 (ClamAV)
- [ ] 파일명 sanitization

---

## Phase 3B: Processing Engine 📋

> **Status**: ⏳ BLOCKED | **Progress**: 0%
> **의존성**: Phase 3A 완료 필요
> **목표**: CAD 변환 엔진 (DXF→3D, PDF→ML 분석)

### Phase 3B Milestones

| Milestone              | 주요 내용            | Status  |
| ---------------------- | -------------------- | ------- |
| **3B.1 CAD 변환 엔진** | DXF→3D / PDF→ML 분석 | 📋 TODO |

### 3B.1 CAD 변환 엔진 상세

**DXF 경로 (벡터)**

- [ ] Celery 워커 설정 (RabbitMQ 브로커)
- [ ] DXF 파서 구현 (ezdxf)
- [ ] 2D → 3D 변환 로직 (압출 알고리즘)
- [ ] glTF/glb 포맷 생성 (pygltflib)

**ML 분석 경로 (PDF/이미지)**

- [ ] PyMuPDF/pdfplumber PDF 벡터/이미지 추출
- [ ] OpenCV 전처리 (기울기 교정, 이진화, 타일링)
- [ ] YOLO/Detectron2 모델 추론 (ONNX Runtime)
- [ ] NMS/후처리 → Vertices/Patches 생성
- [ ] PaddleOCR 통합 (옵션)

**공통 API/인프라**

- [ ] 진행률 추적 (Redis Pub/Sub → WebSocket)
- [ ] 변환 시작 API (`POST /api/v1/conversions`)
- [ ] 변환 상태 API (`GET /api/v1/conversions/{id}`)
- [ ] 변환 취소 API (`POST /api/v1/conversions/{id}/cancel`)
- [ ] **재시도 정책** (max_retries=3, exponential backoff)
- [ ] **Dead Letter Queue** (실패 작업 관리)

---

## Phase 3C: Communication & Ops 📋

> **Status**: ⏳ BLOCKED | **Progress**: 0%
> **의존성**: Phase 3A, 3B 완료 필요
> **목표**: 실시간 통신 **기본 구현** + 모니터링 + 백업

### Phase 3C Milestones

| Milestone                   | 주요 내용                 | Status  |
| --------------------------- | ------------------------- | ------- |
| **3C.1 실시간 통신 (기본)** | WebSocket 서버 기본 구현  | 📋 TODO |
| **3C.2 모니터링**           | Prometheus + Grafana 설정 | 📋 TODO |
| **3C.3 백업 자동화**        | DB/파일 백업 스케줄       | 📋 TODO |

### 3C.1 실시간 통신 (기본 구현) 상세

> **범위**: WebSocket 서버 구축, 기본 연결 관리, Redis Pub/Sub 통합
> **제외**: 성능 최적화, 고급 동기화 로직 (→ Phase 4.3)

**WebSocket 서버**

- [ ] WebSocket 서버 (`/ws/conversion/{file_id}`)
- [ ] 키오스크 동기화 (`/ws/kiosk/{session_id}`)
- [ ] Redis Pub/Sub 통합
- [ ] Master-wins 충돌 해결 로직
- [ ] 재연결 메커니즘
- [ ] Heartbeat/ping-pong (30초 간격)

**WebSocket 보안**

- [ ] JWT 인증 (연결 시 토큰 검증)
- [ ] Rate Limiting (연결 수 제한)
- [ ] Origin 검증 (CORS)
- [ ] 메시지 크기 제한

### 3C.2 모니터링 상세

**Prometheus 설정**

- [ ] FastAPI 메트릭 엔드포인트 (`/metrics`)
- [ ] 커스텀 메트릭 정의 (변환 시간, 성공률)
- [ ] Redis exporter 설정
- [ ] PostgreSQL exporter 설정

**Grafana 대시보드**

- [ ] API 응답 시간 대시보드
- [ ] CAD 변환 성능 대시보드
- [ ] 시스템 리소스 대시보드
- [ ] 알림 규칙 설정

**알림 규칙**

- [ ] Critical: 서버 다운 (5분 이상), 변환 실패율 > 10%
- [ ] Warning: 응답 시간 > 2초, 메모리 > 80%
- [ ] Info: 배포 완료, 스케일링 이벤트

### 3C.3 백업 자동화 상세

**Database 백업**

- [ ] pg_dump 스크립트 작성
- [ ] 매일 자정 백업 스케줄 (cron)
- [ ] 30일 보존 정책
- [ ] MinIO/S3 저장

**File Storage 백업**

- [ ] MinIO 버킷 복제 설정
- [ ] 증분 백업 전략
- [ ] 영구 보존 정책

**Configuration 백업**

- [ ] .env 파일 암호화 백업
- [ ] Terraform state 백업

---

## Phase 4: Synchronization ⏳

> **Status**: ⏳ BLOCKED | **클라이언트 Progress**: 30% | **통합 Progress**: 0%
> **의존성**: Phase 3C.1 WebSocket 서버 완료 필요 ❌

### 목표

멀티 디바이스 간 CAD 뷰어 상태 실시간 동기화 (키오스크 연동)

> **범위**: 연결 풀링, 메시지 압축, 배치 처리, 고급 충돌 해결 (성능 최적화)
> **전제**: Phase 3C.1 WebSocket 기본 구현 완료

### Milestones

| Milestone           | 주요 내용                   | Status                    |
| ------------------- | --------------------------- | ------------------------- |
| Transport 구조      | BaseTransport, Factory 패턴 | ✅                        |
| Sync Store          | 동기화 상태 관리            | ✅                        |
| WebSocket 연결      | 실제 연결 로직 구현         | 🔄 클라이언트 (서버 필요) |
| **Leader Election** | 마스터 자동 선출            | 📋 TODO                   |
| **State Recovery**  | 재연결 시 상태 복구         | 📋 TODO                   |
| Kiosk Display       | 키오스크 전용 페이지        | 📋 TODO                   |

---

## Phase 4.5: Performance Optimization 📋

> **Status**: 📋 PLANNED | **Progress**: 0%
> **의존성**: Phase 3B.1 CAD 변환 엔진 완료 권장

### 목표

대용량 CAD 파일 렌더링 성능 최적화

### Milestones

| Milestone   | 주요 내용                     | Status  |
| ----------- | ----------------------------- | ------- |
| LOD 시스템  | 거리별 3단계 상세도           | 📋 TODO |
| Instancing  | 반복 패턴 자동 감지           | 📋 TODO |
| WebWorker   | 파싱/변환 오프로딩            | 📋 TODO |
| 메모리 관리 | 자동 dispose, Frustum Culling | 📋 TODO |
| 청킹 전략   | 10,000+ 엔티티 분할 로딩      | 📋 TODO |

---

## Phase 5: Staging & E2E Testing 📋

> **Status**: 📋 PLANNED | **Progress**: 0%

### 목표

스테이징 환경 구축 + **E2E 테스트 집중**

### Milestones

| Milestone       | 주요 내용                     | Status  |
| --------------- | ----------------------------- | ------- |
| 환경 분리       | Dev / Staging / Prod 구성     | 📋 TODO |
| **E2E 테스트**  | Playwright 통합 테스트        | 📋 TODO |
| **부하 테스트** | Locust 성능 테스트            | 📋 TODO |
| 스테이징 배포   | 자동 스테이징 배포 파이프라인 | 📋 TODO |

### E2E 테스트 시나리오

**CAD 뷰어 테스트**

- [ ] DXF 파일 업로드 → 렌더링 검증
- [ ] 레이어 필터링 동작 검증
- [ ] 카메라 컨트롤 검증
- [ ] 성능 벤치마크 (FPS 측정)

**백엔드 통합 테스트**

- [ ] 파일 업로드 → 변환 → 다운로드 E2E
- [ ] WebSocket 동기화 시나리오
- [ ] 인증 플로우 검증

**부하 테스트**

- [ ] 동시 업로드 100건
- [ ] 동시 변환 50건
- [ ] WebSocket 연결 200개

---

## Phase 6: Enhancement 📋

> **Status**: 📋 PLANNED | **Progress**: 0%

### 목표

UX 개선, 품질 향상, 접근성

### Milestones

| Milestone     | 주요 내용             | Status  |
| ------------- | --------------------- | ------- |
| WebRTC P2P    | 저지연 키오스크 통신  | 📋 TODO |
| 다국어 지원   | 한국어/영어 (i18next) | 📋 TODO |
| 다크모드      | 시스템 설정 연동      | 📋 TODO |
| **접근성**    | WCAG 2.1 AA 준수      | 📋 TODO |
| 렌더링 최적화 | Draco 압축 (90% 감소) | 📋 TODO |

---

## Phase 7: Production & Scale 📋

> **Status**: 📋 PLANNED | **Progress**: 0%

### 목표

프로덕션 배포 + **스케일링**

### Milestones

| Milestone             | 주요 내용                        | Status  |
| --------------------- | -------------------------------- | ------- |
| Docker 최적화         | 멀티스테이지 빌드, 이미지 경량화 | 📋 TODO |
| **Kubernetes**        | 15대+ 시 K8s 전환                | 📋 TODO |
| **Blue-Green 배포**   | 무중단 배포 파이프라인           | 📋 TODO |
| 문서화                | API 문서, 운영 가이드, Runbook   | 📋 TODO |
| **Disaster Recovery** | 재해 복구 절차 검증              | 📋 TODO |

### Kubernetes 전환 기준

| 키오스크 수 | 권장 오케스트레이션 |
| ----------- | ------------------- |
| < 15대      | Docker Compose      |
| ≥ 15대      | Kubernetes          |

### Disaster Recovery 절차

- [ ] 백업에서 DB 복원 테스트
- [ ] MinIO 데이터 복구 테스트
- [ ] 환경 변수 재설정 절차
- [ ] RTO/RPO 검증 (RTO: 4시간, RPO: 1시간)

---

## 기술적 의사결정 요약

| 항목            | 결정                                     | 근거                       |
| --------------- | ---------------------------------------- | -------------------------- |
| 프론트엔드      | React + R3F + Zustand                    | 이미 구축됨, 선언적 3D     |
| API Layer       | NestJS / FastAPI / Spring Boot (검토 중) | ADR-001 참조               |
| 메시지 큐       | RabbitMQ                                 | ADR-002 확정               |
| 워커 엔진       | Python + Celery                          | CAD 라이브러리 필수        |
| 데이터베이스    | PostgreSQL                               | 메타데이터, ACID 트랜잭션  |
| 스토리지        | MinIO (S3 호환)                          | 클라우드 마이그레이션 용이 |
| 실시간 통신     | WebSocket (우선)                         | 안정성, 디버깅 용이        |
| 키오스크 동기화 | Master-Wins → WebRTC                     | 단계적 고도화              |
| 오케스트레이션  | Docker Compose → K8s                     | 15대 기준 전환             |
| 테스트          | Vitest + Playwright                      | 단위 + E2E                 |
| 모니터링        | Prometheus + Grafana                     | 업계 표준, 풍부한 생태계   |
| IaC             | Terraform                                | 멀티 클라우드 지원         |

---

## 관련 문서

| 문서                                                     | 역할                      |
| -------------------------------------------------------- | ------------------------- |
| [ARCHITECTURE.md](./ARCHITECTURE.md)                     | 시스템 구조, 패키지 설계  |
| [DEV_GUIDE.md](./DEV_GUIDE.md)                           | 개발 가이드, 컨벤션       |
| [GIT_CONVENTIONS.md](./GIT_CONVENTIONS.md)               | Git 워크플로우, 커밋 규칙 |
| [GLOSSARY.md](./GLOSSARY.md)                             | 용어 및 약어 정의         |
| [phases/PHASE_NAV_GUIDE.md](./phases/PHASE_NAV_GUIDE.md) | Phase별 구현 문서 가이드  |

---

## Changelog (변경 이력)

| 버전  | 날짜       | 변경 내용                                                                                               |
| ----- | ---------- | ------------------------------------------------------------------------------------------------------- |
| 0.1.3 | 2025-12-04 | 삭제된 PHASE_DEV_DOC_GUIDE.md 참조 제거, Phase 3 분할 (3A/3B/3C), 테스트 수 85개 수정, 기술 스택 동기화 |
| 0.1.2 | 2025-12-03 | Phase 2A 완료 (100%), 단위 테스트 58개 통과, utils 커버리지 98.29%                                      |
| 0.1.1 | 2025-12-02 | Phase개발 템플릿 개발완료                                                                               |
| 0.1.0 | 2025-12-01 | Phase 구조 개편 (1.5 Three.js 학습 추가, 2A/2B 분리), CAD Viewer 기능 추가, Phase 2A 진행률 업데이트    |
| 0.0.0 | 2025-11-28 | 초기 버전, 로드맵/아키텍처/깃컨벤션 문서가이드 정리                                                     |
