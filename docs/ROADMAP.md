# Roadmap

> **Version**: 0.1.7
> **Last Updated**: 2025-12-11

CAD Viewer 프로젝트 로드맵 - DevOps 모범사례 적용 버전

---

## Project Vision

Three.js 기반 CAD 뷰어에서 시작하여, **건축 도면 → 3D 모델 변환 → 키오스크 연동 시스템**으로 발전하는 프로젝트

### Final Goals

1. CAD 도면 업로드 → 백엔드 3D 변환 → 파일서버 저장
2. JSON API로 프론트엔드에서 3D 모델 렌더링
3. 키오스크 연동 및 키오스크 간 실시간 동기화

### Status Legend

| Icon | Status | Description                   |
| ---- | ------ | ----------------------------- |
| ✅   | 완료   | 100% 완료 및 검증됨           |
| 🔄   | 진행중 | 현재 작업 중 (퍼센티지 표시)  |
| 📋   | 계획됨 | 설계 완료, 실행 대기          |
| ⏳   | 차단됨 | 의존성 미충족으로 대기        |
| ⏸️   | 보류   | 코드 삭제됨, 향후 재구현 예정 |

### Timeline Overview

| Phase | Name                | Status    | Notes                        |
| ----- | ------------------- | --------- | ---------------------------- |
| 1     | Foundation + CI/CD  | ✅ 완료   | CI/CD Day 1 적용             |
| 1.5   | Three.js 학습       | ✅ 완료   | Teapot 예제                  |
| 2A    | DXF CAD Viewer      | ✅ 완료   | 프론트엔드 전용              |
| 3A    | Core Backend        | 📋 계획됨 | 인프라 우선                  |
| 3B    | Processing Engine   | ⏳ 차단됨 | 3A.1 의존 (3A.2와 병렬 가능) |
| 3C    | Communication & Ops | ⏳ 차단됨 | 3A, 3B 의존                  |
| 2B    | PDF CAD Viewer      | ⏳ 차단됨 | P3A.3, P3B.1 의존            |
| 4     | Synchronization     | ⏳ 차단됨 | P3C.1 의존                   |
| 4.5   | Performance         | 📋 계획됨 | P3B.1 이후 권장              |
| 5     | Staging & E2E       | 📋 계획됨 | E2E 테스트 집중              |
| 6     | Enhancement         | 📋 계획됨 | UX/접근성                    |
| 7     | Production & Scale  | 📋 계획됨 | K8s, Blue-Green              |

---

## Phase 1: Foundation + DevOps 기반 ✅ 완료

> **Status**: ✅ 완료 | **Progress**: 100%

### Goal

프로젝트 기반 구조 + **CI/CD 파이프라인** + 3D 렌더링 인프라 구축

### Milestones

| Milestone       | Description                                       | Status  |
| --------------- | ------------------------------------------------- | ------- |
| 프로젝트 초기화 | Vite + React + TypeScript 설정                    | ✅ 완료 |
| 코드 품질       | ESLint + Prettier + 경로 별칭                     | ✅ 완료 |
| 아키텍처        | Layer-Based 구조, Zustand 스토어                  | ✅ 완료 |
| 라우팅          | React Router v6 설정                              | ✅ 완료 |
| Three.js 기반   | R3F 기본 씬, OrbitControls                        | ✅ 완료 |
| 레이아웃        | MainLayout, SideBar, Footer                       | ✅ 완료 |
| 패키지 구조     | features/, services/, stores/ 설계                | ✅ 완료 |
| 문서 작성       | ARCHITECTURE, DEV_GUIDE, GIT_CONVENTIONS, ROADMAP | ✅ 완료 |
| CI/CD 기본      | GitHub Actions (lint + type-check + build)        | ✅ 완료 |
| 환경 정의       | Dev/Staging/Prod 환경 변수 템플릿                 | ✅ 완료 |

### Acceptance Criteria

- ✅ Vite 개발 서버 정상 기동 (< 3초)
- ✅ ESLint + Prettier 설정 완료, pre-commit 훅 동작
- ✅ Three.js 기본 씬 렌더링 확인
- ✅ GitHub Actions CI 파이프라인 통과

### Details

**GitHub Actions Workflow**

| Task             | Description          | Status  |
| ---------------- | -------------------- | ------- |
| PR 자동 검사     | PR 생성 시 자동 검사 | ✅ 완료 |
| lint             | ESLint 검사          | ✅ 완료 |
| type-check       | tsc --noEmit         | ✅ 완료 |
| build            | Vite 빌드            | ✅ 완료 |
| 브랜치 보호 규칙 | main 브랜치 보호     | ✅ 완료 |

**환경 정의**

| Task             | Description          | Status  |
| ---------------- | -------------------- | ------- |
| .env.development | 개발 환경 템플릿     | ✅ 완료 |
| .env.staging     | 스테이징 환경 템플릿 | ✅ 완료 |
| .env.production  | 프로덕션 환경 템플릿 | ✅ 완료 |
| .env.example     | 문서화               | ✅ 완료 |

---

## Phase 1.5: Three.js 학습 ✅ 완료

> **Status**: ✅ 완료 | **Progress**: 100%

### Goal

Three.js와 React Three Fiber를 활용한 3D 렌더링 기초 학습

### Milestones

| Milestone       | Description                     | Status  |
| --------------- | ------------------------------- | ------- |
| Teapot 예제     | Three.js 와이어프레임 학습 예제 | ✅ 완료 |
| GUI 컨트롤      | lil-gui 파라미터 조정 패널      | ✅ 완료 |
| OrbitControls   | 카메라 회전/확대/이동 제어      | ✅ 완료 |
| Material 시스템 | 와이어프레임, 색상, 투명도      | ✅ 완료 |

### Acceptance Criteria

- ✅ Teapot 모델 와이어프레임 렌더링 성공
- ✅ lil-gui로 실시간 파라미터 조정 가능
- ✅ OrbitControls로 카메라 제어 정상 동작
- ✅ memo, useMemo 최적화 적용 확인

### Learning Outcomes

- React Three Fiber (R3F) 선언적 3D 렌더링 패턴 이해
- Three.js 지오메트리, 머티리얼, 메쉬 구조 학습
- lil-gui를 통한 런타임 파라미터 조정 구현
- memo, useMemo 최적화 패턴 적용

### Related Documents

- [1.5_TEAPOT_DEMO.md](./phases/01-Foundation/1.5_TEAPOT_DEMO.md)

---

## Phase 2A: DXF CAD Viewer ✅ 완료

> **Status**: ✅ 완료 | **Progress**: 100%
> **Dependencies**: Phase 1.5 ✅ 완료

### Goal

DXF 파일을 **프론트엔드에서** 파싱하여 3D 와이어프레임으로 렌더링 (백엔드 불필요)

### Details

```
Phase 2A: DXF CAD Viewer
├── 2A.1 MVP (LINE 엔티티만)                  ✅ 완료
├── 2A.2 엔티티 확장 (ARC, CIRCLE, POLYLINE)  ✅ 완료
├── 2A.3 레이어 기능                          ✅ 완료
├── 2A.4 성능 최적화                          ✅ 완료
└── 2A.5 Unit 테스트                          ✅ 완료
```

### Milestones

| Milestone        | Description                                | Status  |
| ---------------- | ------------------------------------------ | ------- |
| 2A.1 MVP         | LINE 엔티티 파싱 + 렌더링                  | ✅ 완료 |
| 파일 업로드      | 드래그앤드롭, 타입/크기 검증               | ✅ 완료 |
| CAD Scene        | 3D 렌더링 컴포넌트                         | ✅ 완료 |
| Viewer Controls  | 그리드 토글, 색상 변경                     | ✅ 완료 |
| 2A.2 ARC/CIRCLE  | 원호, 원 엔티티 지원                       | ✅ 완료 |
| 2A.2 POLYLINE    | 연결선 (bulge 포함)                        | ✅ 완료 |
| 2A.3 Layer Panel | 레이어 표시/숨김 UI, DXF 색상 매핑         | ✅ 완료 |
| 2A.4 성능 최적화 | Geometry 머징, WebWorker, Basic LOD        | ✅ 완료 |
| 2A.5 Unit 테스트 | Vitest 단위 테스트 (85개, 커버리지 98.29%) | ✅ 완료 |

### Acceptance Criteria

- ✅ DXF 파일 드래그앤드롭 업로드 정상 동작
- ✅ 파일 타입/크기 검증 (20MB 제한) 통과
- ✅ 4개 엔티티 타입 렌더링 (LINE, CIRCLE, ARC, POLYLINE)
- ✅ 레이어 토글 UI 정상 동작
- ✅ WebWorker 파싱 (2MB 이상 파일) 동작
- ✅ 단위 테스트 85개 통과, 커버리지 98.29%

### Implementation Summary

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
- Basic LOD - 엔티티 수 기반 자동 세그먼트 조절 (프론트엔드 전용)

### Test Strategy

**Unit Tests** (Vitest, 커버리지 98.29% 달성)

| Test File             | Description       | Status  |
| --------------------- | ----------------- | ------- |
| useDXFParser.test.ts  | DXF 파서 유틸리티 | ✅ 완료 |
| dxfToGeometry.test.ts | 지오메트리 변환   | ✅ 완료 |
| validators.test.ts    | 파일 검증 로직    | ✅ 완료 |

### Related Documents

- [2A_DXF_VIEWER.md](./phases/02-CadFeatures/2A_DXF_VIEWER.md)

---

## Phase 2B: PDF CAD Viewer ⏳ 차단됨

> **Status**: ⏳ 차단됨 | **Progress**: 0%
> **Dependencies**: Phase 3A.3 파일 관리 API + Phase 3B.1 CAD 변환 엔진 필요

### Goal

PDF 도면 파일을 백엔드 ML 분석을 통해 3D 모델로 변환

### Details

```
Phase 2B: PDF CAD Viewer (백엔드 필요)
├── 2B.1 PDF 업로드 UI
├── 2B.2 백엔드 연동 (Phase 3A.3 의존)
├── 2B.3 ML 분석 결과 수신 (Phase 3B.1 의존)
└── 2B.4 3D 렌더링
```

### Milestones

| Milestone         | Description                    | Status    |
| ----------------- | ------------------------------ | --------- |
| PDF 업로드 UI     | PDF 파일 선택 + 업로드         | 📋 계획됨 |
| Backend API 연동  | Phase 3A.3 API 호출 로직       | 📋 계획됨 |
| ML 분석 결과 수신 | Phase 3B.1 결과 폴링/WebSocket | 📋 계획됨 |
| 3D 렌더링         | 분석 결과 → Three.js 렌더링    | 📋 계획됨 |
| 진행률 표시       | 변환 진행 상태 UI              | 📋 계획됨 |
| 통합 테스트       | E2E 업로드→분석→렌더링 테스트  | 📋 계획됨 |

### Acceptance Criteria

- [ ] PDF 파일 업로드 UI 구현
- [ ] 백엔드 API 연동 성공
- [ ] ML 분석 결과 수신 및 표시
- [ ] 3D 렌더링 정상 동작
- [ ] E2E 테스트 통과

### Dependencies

| Phase      | Required Feature     | Status    |
| ---------- | -------------------- | --------- |
| Phase 3A.3 | 파일 업로드 API      | 📋 계획됨 |
| Phase 3B.1 | PDF→ML 분석 엔진     | 📋 계획됨 |
| Phase 3C.1 | 실시간 진행률 (옵션) | 📋 계획됨 |

---

## Phase 3A: Core Backend 📋 계획됨

> **Status**: 📋 계획됨 | **Progress**: 0%
> **Goal**: 인증 기반 구축 + 기본 인프라 + 파일 관리 (보안 우선)

### Phase 3 Technology Stack

| Component            | Selection                                   | Rationale                                                                       |
| -------------------- | ------------------------------------------- | ------------------------------------------------------------------------------- |
| **API Layer**        | NestJS / FastAPI / Spring Boot (검토 중)    | [ADR-001](./adr/001_BACKEND_STACK.md) 검토 중                                   |
| **Message Queue**    | RabbitMQ                                    | 메시지 영속성, DLQ ([ADR-002](./adr/002_QUEUE_ALTERNATIVES_COMPARISON.md) 승인) |
| **Worker Engine**    | Python 3.12 + Celery                        | [ADR-003](./adr/003_PYTHON_WORKER_STACK.md) 승인 (ezdxf, PyMuPDF)               |
| **Database**         | PostgreSQL                                  | 메타데이터, ACID 트랜잭션                                                       |
| **Storage**          | MinIO (S3 호환)                             | 파일 저장, 클라우드 마이그레이션 용이                                           |
| **CAD Parser**       | ezdxf                                       | DXF 파싱, Python 생태계                                                         |
| **3D Export**        | pygltflib                                   | glTF/glb 생성                                                                   |
| **ML Framework**     | PyTorch                                     | YOLOv8/Detectron2 기반                                                          |
| **Inference**        | ONNX RT / TensorRT                          | 추론 가속                                                                       |
| **Image Processing** | OpenCV                                      | 전처리, 컨투어 추출                                                             |
| **PDF Parser**       | PyMuPDF                                     | PDF 벡터/이미지 추출                                                            |
| **OCR**              | PaddleOCR                                   | 텍스트 인식 (옵션)                                                              |
| **Monitoring**       | Prometheus + Grafana                        | 메트릭 수집 + 대시보드                                                          |
| **IaC**              | Docker Compose (MVP) → Terraform (Phase 5+) | MVP 단순화, Phase 5부터 환경 분리                                               |

### Phase 3A Milestones

| Milestone                    | Description                     | Status    |
| ---------------------------- | ------------------------------- | --------- |
| 3A.1 기본 인프라 + 환경 관리 | Docker Compose, DB, 환경별 설정 | 📋 계획됨 |
| 3A.2 인증 + OWASP            | JWT + OWASP Top 10 (보안 우선)  | 📋 계획됨 |
| 3A.3 파일 관리 + 보안        | API + 파일 보안 검증            | 📋 계획됨 |

### Acceptance Criteria

- [ ] Docker Compose로 PostgreSQL, RabbitMQ, MinIO 정상 기동
- [ ] 인증 API 응답 시간 < 200ms
- [ ] OWASP Top 10 보안 검사 통과
- [ ] 파일 업로드 성공률 > 99%

### 3A.1 Infrastructure + Environment Management

> **Note**: Terraform은 Phase 5 (Staging 환경 분리) 이후 도입 예정

**Infrastructure**

| Task                    | Description                 | Status    |
| ----------------------- | --------------------------- | --------- |
| Docker Compose 환경     | PostgreSQL, RabbitMQ, MinIO | 📋 계획됨 |
| FastAPI 프로젝트 초기화 | 프로젝트 구조 설계          | 📋 계획됨 |
| Alembic 마이그레이션    | DB 마이그레이션 설정        | 📋 계획됨 |
| OpenAPI 3.0 문서        | 자동 생성                   | 📋 계획됨 |
| 환경 변수 관리          | .env, secrets               | 📋 계획됨 |
| ezdxf → pygltflib POC   | 2D→3D 변환 검증             | 📋 계획됨 |

**Environment Management**

| Task              | Description                          | Status    |
| ----------------- | ------------------------------------ | --------- |
| Compose 파일 분리 | dev.yml, staging.yml                 | 📋 계획됨 |
| 환경 변수 템플릿  | .env.example, .env.dev, .env.staging | 📋 계획됨 |
| 배포 스크립트     | scripts/deploy.sh                    | 📋 계획됨 |
| 백업 스크립트     | scripts/backup.sh                    | 📋 계획됨 |

### 3A.2 Authentication + OWASP

> ⚠️ **Security Principle**: 인프라 구축 후 인증 시스템 구축 (3B와 병렬 개발 가능)

**Authentication System**

| Task             | Description                  | Status    |
| ---------------- | ---------------------------- | --------- |
| JWT 발급/검증    | JWT 로직 구현                | 📋 계획됨 |
| 회원가입 API     | `POST /api/v1/auth/register` | 📋 계획됨 |
| 로그인 API       | `POST /api/v1/auth/login`    | 📋 계획됨 |
| 리프레시 토큰    | 토큰 갱신 로직               | 📋 계획됨 |
| 파일 소유권 검증 | 미들웨어 구현                | 📋 계획됨 |
| 감사 로그        | 로그 기록                    | 📋 계획됨 |
| Rate Limiting    | slowapi 메모리 백엔드        | 📋 계획됨 |

**OWASP Top 10**

| Task               | Description                | Status    |
| ------------------ | -------------------------- | --------- |
| SQL Injection 방지 | ORM 사용                   | 📋 계획됨 |
| XSS 방지           | 입력 검증                  | 📋 계획됨 |
| CSRF 토큰          | CSRF 보호                  | 📋 계획됨 |
| 인증/인가 검증     | 접근 제어                  | 📋 계획됨 |
| 보안 헤더 설정     | HSTS, CSP, X-Frame-Options | 📋 계획됨 |
| 민감 데이터 암호화 | 암호화 적용                | 📋 계획됨 |

### 3A.3 File Management + Security

**File Management API**

| Task                  | Description                      | Status    |
| --------------------- | -------------------------------- | --------- |
| 파일 업로드 API       | `POST /api/v1/files/upload`      | 📋 계획됨 |
| 파일 목록 API         | `GET /api/v1/files`              | 📋 계획됨 |
| 파일 상세 API         | `GET /api/v1/files/{file_id}`    | 📋 계획됨 |
| 파일 삭제 API         | `DELETE /api/v1/files/{file_id}` | 📋 계획됨 |
| 복잡도 분석기         | ezdxf 메타데이터 파싱            | 📋 계획됨 |
| MinIO 스토리지 서비스 | 스토리지 구현                    | 📋 계획됨 |
| 파일 다운로드 API     | presigned URL                    | 📋 계획됨 |

**File Upload Security**

| Task                | Description | Status    |
| ------------------- | ----------- | --------- |
| 파일 타입 검증      | magic bytes | 📋 계획됨 |
| 파일 크기 제한      | 100MB       | 📋 계획됨 |
| 악성코드 스캔       | ClamAV      | 📋 계획됨 |
| 파일명 sanitization | 파일명 정제 | 📋 계획됨 |

---

## Phase 3B: Processing Engine ⏳ 차단됨

> **Status**: ⏳ 차단됨 | **Progress**: 0%
> **Dependencies**: Phase 3A 완료 필요
> **Goal**: CAD 변환 엔진 (DXF→3D, PDF→ML 분석)

### Phase 3B Milestones

| Milestone          | Description          | Status    |
| ------------------ | -------------------- | --------- |
| 3B.1 CAD 변환 엔진 | DXF→3D / PDF→ML 분석 | 📋 계획됨 |

### Acceptance Criteria

- [ ] Celery 워커 정상 동작
- [ ] DXF → glTF 변환 성공률 > 95%
- [ ] PDF ML 분석 정확도 > 90%
- [ ] 재시도 정책 및 DLQ 동작 확인

### 3B.1 CAD Conversion Engine

**DXF Path (Vector)**

| Task               | Description          | Status    |
| ------------------ | -------------------- | --------- |
| Celery 워커 설정   | RabbitMQ 브로커 연동 | 📋 계획됨 |
| DXF 파서 구현      | ezdxf 활용           | 📋 계획됨 |
| 2D → 3D 변환 로직  | 압출 알고리즘        | 📋 계획됨 |
| glTF/glb 포맷 생성 | pygltflib 활용       | 📋 계획됨 |

**ML Analysis Path (PDF/Image)**

| Task                 | Description                    | Status    |
| -------------------- | ------------------------------ | --------- |
| PDF 벡터/이미지 추출 | PyMuPDF/pdfplumber             | 📋 계획됨 |
| OpenCV 전처리        | 기울기 교정, 이진화, 타일링    | 📋 계획됨 |
| 모델 추론            | YOLO/Detectron2 (ONNX Runtime) | 📋 계획됨 |
| NMS/후처리           | Vertices/Patches 생성          | 📋 계획됨 |
| PaddleOCR 통합       | 텍스트 인식 (옵션)             | 📋 계획됨 |

**Common API/Infrastructure**

| Task              | Description                            | Status    |
| ----------------- | -------------------------------------- | --------- |
| 진행률 추적       | RabbitMQ Fanout Exchange → WebSocket   | 📋 계획됨 |
| 변환 시작 API     | `POST /api/v1/conversions`             | 📋 계획됨 |
| 변환 상태 API     | `GET /api/v1/conversions/{id}`         | 📋 계획됨 |
| 변환 취소 API     | `POST /api/v1/conversions/{id}/cancel` | 📋 계획됨 |
| 재시도 정책       | max_retries=3, exponential backoff     | 📋 계획됨 |
| Dead Letter Queue | 실패 작업 관리                         | 📋 계획됨 |

---

## Phase 3C: Communication & Ops ⏳ 차단됨

> **Status**: ⏳ 차단됨 | **Progress**: 0%
> **Dependencies**: Phase 3A, 3B 완료 필요
> **Goal**: 실시간 통신 기본 구현 + 모니터링 + 백업

### Phase 3C Milestones

| Milestone               | Description               | Status    |
| ----------------------- | ------------------------- | --------- |
| 3C.1 실시간 통신 (기본) | WebSocket 서버 기본 구현  | 📋 계획됨 |
| 3C.2 모니터링           | Prometheus + Grafana 설정 | 📋 계획됨 |
| 3C.3 백업 자동화        | DB/파일 백업 스케줄       | 📋 계획됨 |

### Acceptance Criteria

- [ ] WebSocket 연결 성공률 > 99%
- [ ] Heartbeat 30초 간격 동작
- [ ] Grafana 대시보드 3개 이상 구축
- [ ] 백업 스케줄 정상 동작

### 3C.1 Real-time Communication (Basic)

> **Scope**: WebSocket 서버 구축, 기본 연결 관리, RabbitMQ Topic Exchange 통합
> **Excluded**: 성능 최적화, 고급 동기화 로직 (→ Phase 4)

**WebSocket Server**

| Task                    | Description                | Status    |
| ----------------------- | -------------------------- | --------- |
| WebSocket 서버          | `/ws/conversion/{file_id}` | 📋 계획됨 |
| 키오스크 동기화         | `/ws/kiosk/{session_id}`   | 📋 계획됨 |
| RabbitMQ Topic Exchange | 메시지 브로커 통합         | 📋 계획됨 |
| Master-wins 충돌 해결   | 충돌 해결 로직             | 📋 계획됨 |
| 재연결 메커니즘         | 자동 재연결                | 📋 계획됨 |
| Heartbeat/ping-pong     | 30초 간격                  | 📋 계획됨 |

**WebSocket Security**

| Task             | Description           | Status    |
| ---------------- | --------------------- | --------- |
| JWT 인증         | 연결 시 토큰 검증     | 📋 계획됨 |
| Rate Limiting    | 연결 수 제한          | 📋 계획됨 |
| Origin 검증      | CORS                  | 📋 계획됨 |
| 메시지 크기 제한 | 최대 메시지 크기 설정 | 📋 계획됨 |

### 3C.2 Monitoring

**Prometheus Setup**

| Task                | Description        | Status    |
| ------------------- | ------------------ | --------- |
| 메트릭 엔드포인트   | FastAPI `/metrics` | 📋 계획됨 |
| 커스텀 메트릭       | 변환 시간, 성공률  | 📋 계획됨 |
| PostgreSQL exporter | DB 모니터링        | 📋 계획됨 |

**Grafana Dashboard**

| Task          | Description        | Status    |
| ------------- | ------------------ | --------- |
| API 응답 시간 | 응답 시간 대시보드 | 📋 계획됨 |
| CAD 변환 성능 | 변환 성능 대시보드 | 📋 계획됨 |
| 시스템 리소스 | 리소스 대시보드    | 📋 계획됨 |
| 알림 규칙     | 알림 설정          | 📋 계획됨 |

**Alert Rules**

| Level    | Condition                      | Description    |
| -------- | ------------------------------ | -------------- |
| Critical | 서버 다운 (5분+), 실패율 > 10% | 즉시 대응 필요 |
| Warning  | 응답 시간 > 2초, 메모리 > 80%  | 모니터링 필요  |
| Info     | 배포 완료, 스케일링 이벤트     | 정보 알림      |

### 3C.3 Backup Automation

**Database Backup**

| Task             | Description        | Status    |
| ---------------- | ------------------ | --------- |
| pg_dump 스크립트 | 백업 스크립트 작성 | 📋 계획됨 |
| 백업 스케줄      | 매일 자정 (cron)   | 📋 계획됨 |
| 보존 정책        | 30일 보존          | 📋 계획됨 |
| 저장소           | MinIO/S3           | 📋 계획됨 |

**File Storage Backup**

| Task            | Description    | Status    |
| --------------- | -------------- | --------- |
| MinIO 버킷 복제 | 복제 설정      | 📋 계획됨 |
| 증분 백업       | 증분 백업 전략 | 📋 계획됨 |
| 영구 보존       | 영구 보존 정책 | 📋 계획됨 |

**Configuration Backup**

| Task            | Description | Status    |
| --------------- | ----------- | --------- |
| .env 파일       | 암호화 백업 | 📋 계획됨 |
| Terraform state | 상태 백업   | 📋 계획됨 |

---

## Phase 4: Synchronization ⏳ 차단됨

> **Status**: ⏳ 차단됨 | **Client Progress**: 30% | **Integration Progress**: 0%
> **Dependencies**: Phase 3C.1 WebSocket 서버 완료 필요

### Goal

멀티 디바이스 간 CAD 뷰어 상태 실시간 동기화 (키오스크 연동)

> **Scope**: 연결 풀링, 메시지 압축, 배치 처리, 고급 충돌 해결 (성능 최적화)
> **Prerequisites**: Phase 3C.1 WebSocket 기본 구현 완료

### Milestones

| Milestone       | Description                 | Status                |
| --------------- | --------------------------- | --------------------- |
| Transport 구조  | BaseTransport, Factory 패턴 | ✅ 완료               |
| Sync Store      | 동기화 상태 관리            | ✅ 완료               |
| WebSocket 연결  | 실제 연결 로직 구현         | 🔄 진행중 (서버 필요) |
| Leader Election | 마스터 자동 선출            | 📋 계획됨             |
| State Recovery  | 재연결 시 상태 복구         | 📋 계획됨             |
| Kiosk Display   | 키오스크 전용 페이지        | 📋 계획됨             |

### Acceptance Criteria

- [ ] WebSocket 연결 안정성 > 99%
- [ ] 동기화 지연 < 100ms
- [ ] Leader Election 정상 동작
- [ ] 재연결 시 상태 복구 성공률 > 95%

### Details

**4.1 Connection Pool Management**

| Task               | Description            | Status    |
| ------------------ | ---------------------- | --------- |
| 연결 풀링          | 연결 재사용 및 관리    | 📋 계획됨 |
| 연결 상태 모니터링 | 연결 상태 추적         | 📋 계획됨 |
| 자동 복구          | 연결 끊김 시 자동 복구 | 📋 계획됨 |

**4.2 Message Batching & Compression**

| Task            | Description            | Status    |
| --------------- | ---------------------- | --------- |
| 메시지 배치     | 다중 메시지 배치 전송  | 📋 계획됨 |
| 메시지 압축     | gzip/brotli 압축       | 📋 계획됨 |
| 프로토콜 최적화 | 바이너리 프로토콜 적용 | 📋 계획됨 |

**4.3 Advanced Conflict Resolution**

| Task            | Description               | Status    |
| --------------- | ------------------------- | --------- |
| Leader Election | 마스터 자동 선출 알고리즘 | 📋 계획됨 |
| 충돌 감지       | 상태 충돌 감지 로직       | 📋 계획됨 |
| 충돌 해결       | Master-wins 기반 해결     | 📋 계획됨 |

**4.4 State Recovery**

| Task        | Description         | Status    |
| ----------- | ------------------- | --------- |
| 상태 스냅샷 | 주기적 상태 저장    | 📋 계획됨 |
| 재연결 복구 | 재연결 시 상태 복원 | 📋 계획됨 |
| 동기화 검증 | 상태 일관성 검증    | 📋 계획됨 |

---

## Phase 4.5: Performance Optimization 📋 계획됨

> **Status**: 📋 계획됨 | **Progress**: 0%
> **Dependencies**: Phase 3B.1 CAD 변환 엔진 완료 권장

### Goal

대용량 CAD 파일 렌더링 성능 최적화

> **Note**: Phase 2A에서 구현된 Basic LOD는 프론트엔드 전용 엔티티 수 기반 조절
> Advanced LOD는 거리 기반 3단계 상세도 + 동적 로딩

### Milestones

| Milestone      | Description                     | Status    |
| -------------- | ------------------------------- | --------- |
| Advanced LOD   | 거리별 3단계 상세도 + 동적 로딩 | 📋 계획됨 |
| Instancing     | 반복 패턴 자동 감지             | 📋 계획됨 |
| WebWorker 확장 | 파싱/변환 오프로딩 확장         | 📋 계획됨 |
| 메모리 관리    | 자동 dispose, Frustum Culling   | 📋 계획됨 |
| 청킹 전략      | 10,000+ 엔티티 분할 로딩        | 📋 계획됨 |

### Acceptance Criteria

- [ ] 10,000+ 엔티티 파일 60fps 유지
- [ ] 메모리 사용량 50% 감소
- [ ] 초기 로딩 시간 3초 이내
- [ ] Frustum Culling 동작 확인

### Details

**4.5.1 Advanced LOD System**

| Task                | Description                    | Status    |
| ------------------- | ------------------------------ | --------- |
| 거리 기반 LOD       | 카메라 거리에 따른 상세도 조절 | 📋 계획됨 |
| 3단계 상세도        | High/Medium/Low 레벨           | 📋 계획됨 |
| 동적 로딩           | 필요 시 상세 모델 로드         | 📋 계획됨 |
| LOD 전환 애니메이션 | 부드러운 LOD 전환              | 📋 계획됨 |

**4.5.2 Geometry Instancing**

| Task               | Description              | Status    |
| ------------------ | ------------------------ | --------- |
| 패턴 감지 알고리즘 | 반복 패턴 자동 감지      | 📋 계획됨 |
| InstancedMesh 적용 | Three.js Instancing 활용 | 📋 계획됨 |
| 인스턴스 관리      | 인스턴스 생성/삭제 관리  | 📋 계획됨 |

**4.5.3 Memory Management**

| Task            | Description                     | Status    |
| --------------- | ------------------------------- | --------- |
| 자동 dispose    | 미사용 지오메트리/머티리얼 해제 | 📋 계획됨 |
| Frustum Culling | 시야 밖 객체 렌더링 제외        | 📋 계획됨 |
| 메모리 모니터링 | 메모리 사용량 추적              | 📋 계획됨 |

**4.5.4 Chunking Strategy**

| Task          | Description               | Status    |
| ------------- | ------------------------- | --------- |
| 엔티티 분할   | 10,000+ 엔티티 청크 분할  | 📋 계획됨 |
| 점진적 로딩   | 청크 단위 점진적 로딩     | 📋 계획됨 |
| 우선순위 로딩 | 뷰포트 기준 우선순위 설정 | 📋 계획됨 |

---

## Phase 5: Staging & E2E Testing 📋 계획됨

> **Status**: 📋 계획됨 | **Progress**: 0%

### Goal

스테이징 환경 구축 + E2E 테스트 집중

### Milestones

| Milestone     | Description                   | Status    |
| ------------- | ----------------------------- | --------- |
| 환경 분리     | Dev / Staging / Prod 구성     | 📋 계획됨 |
| E2E 테스트    | Playwright 통합 테스트        | 📋 계획됨 |
| 부하 테스트   | Locust 성능 테스트            | 📋 계획됨 |
| 스테이징 배포 | 자동 스테이징 배포 파이프라인 | 📋 계획됨 |

### Acceptance Criteria

- [ ] 스테이징 환경 완전 분리
- [ ] E2E 테스트 커버리지 > 80%
- [ ] 부하 테스트 기준 충족 (동시 100건 업로드)
- [ ] 자동 배포 파이프라인 동작

### Details

**5.1 Environment Separation**

| Task              | Description                | Status    |
| ----------------- | -------------------------- | --------- |
| 환경 변수 분리    | Dev/Staging/Prod 환경 변수 | 📋 계획됨 |
| 데이터베이스 분리 | 환경별 DB 인스턴스         | 📋 계획됨 |
| 스토리지 분리     | 환경별 MinIO 버킷          | 📋 계획됨 |
| 도메인 설정       | 환경별 도메인 구성         | 📋 계획됨 |

**5.2 E2E Test Suite (Playwright)**

| Test Category | Test Cases                        | Status    |
| ------------- | --------------------------------- | --------- |
| CAD 뷰어      | DXF 업로드 → 렌더링 검증          | 📋 계획됨 |
| CAD 뷰어      | 레이어 필터링 동작 검증           | 📋 계획됨 |
| CAD 뷰어      | 카메라 컨트롤 검증                | 📋 계획됨 |
| CAD 뷰어      | 성능 벤치마크 (FPS 측정)          | 📋 계획됨 |
| 백엔드 통합   | 파일 업로드 → 변환 → 다운로드 E2E | 📋 계획됨 |
| 백엔드 통합   | WebSocket 동기화 시나리오         | 📋 계획됨 |
| 백엔드 통합   | 인증 플로우 검증                  | 📋 계획됨 |

**5.3 Load Testing (Locust)**

| Scenario       | Target            | Status    |
| -------------- | ----------------- | --------- |
| 동시 업로드    | 100건 동시 업로드 | 📋 계획됨 |
| 동시 변환      | 50건 동시 변환    | 📋 계획됨 |
| WebSocket 연결 | 200개 동시 연결   | 📋 계획됨 |
| API 응답 시간  | p95 < 500ms       | 📋 계획됨 |

**5.4 Staging Deployment Pipeline**

| Task             | Description                  | Status    |
| ---------------- | ---------------------------- | --------- |
| CI/CD 파이프라인 | GitHub Actions 스테이징 배포 | 📋 계획됨 |
| 자동 테스트      | 배포 전 자동 테스트          | 📋 계획됨 |
| 롤백 메커니즘    | 배포 실패 시 자동 롤백       | 📋 계획됨 |
| 배포 알림        | Slack/Discord 알림           | 📋 계획됨 |

---

## Phase 6: Enhancement 📋 계획됨

> **Status**: 📋 계획됨 | **Progress**: 0%

### Goal

UX 개선, 품질 향상, 접근성

### Milestones

| Milestone     | Description           | Status    |
| ------------- | --------------------- | --------- |
| WebRTC P2P    | 저지연 키오스크 통신  | 📋 계획됨 |
| 다국어 지원   | 한국어/영어 (i18next) | 📋 계획됨 |
| 다크모드      | 시스템 설정 연동      | 📋 계획됨 |
| 접근성        | WCAG 2.1 AA 준수      | 📋 계획됨 |
| 렌더링 최적화 | Draco 압축 (90% 감소) | 📋 계획됨 |

### Acceptance Criteria

- [ ] WebRTC P2P 연결 지연 < 50ms
- [ ] 다국어 지원 (한국어/영어) 완료
- [ ] 다크모드 시스템 설정 연동 동작
- [ ] WCAG 2.1 AA 접근성 감사 통과
- [ ] Draco 압축으로 파일 크기 90% 감소

### Details

**6.1 WebRTC P2P**

| Task             | Description         | Status    |
| ---------------- | ------------------- | --------- |
| WebRTC 서버 설정 | STUN/TURN 서버 구성 | 📋 계획됨 |
| P2P 연결 로직    | 피어 연결 관리      | 📋 계획됨 |
| 저지연 통신      | 실시간 상태 동기화  | 📋 계획됨 |
| 폴백 메커니즘    | WebSocket 폴백      | 📋 계획됨 |

**6.2 i18n (i18next)**

| Task         | Description            | Status    |
| ------------ | ---------------------- | --------- |
| i18next 설정 | 다국어 프레임워크 설정 | 📋 계획됨 |
| 한국어 번역  | UI 텍스트 한국어 번역  | 📋 계획됨 |
| 영어 번역    | UI 텍스트 영어 번역    | 📋 계획됨 |
| 언어 전환 UI | 언어 선택 드롭다운     | 📋 계획됨 |

**6.3 Dark Mode**

| Task             | Description                    | Status    |
| ---------------- | ------------------------------ | --------- |
| 시스템 설정 감지 | prefers-color-scheme 감지      | 📋 계획됨 |
| 테마 토글 UI     | 라이트/다크 토글               | 📋 계획됨 |
| CSS 변수 시스템  | 테마별 CSS 변수                | 📋 계획됨 |
| 3D 씬 테마 적용  | Three.js 배경/그리드 테마 적용 | 📋 계획됨 |

**6.4 WCAG 2.1 AA Accessibility**

| Task              | Description         | Status    |
| ----------------- | ------------------- | --------- |
| 키보드 네비게이션 | 전체 키보드 접근성  | 📋 계획됨 |
| 스크린 리더 지원  | ARIA 레이블         | 📋 계획됨 |
| 색상 대비         | WCAG 대비 기준 충족 | 📋 계획됨 |
| 포커스 관리       | 포커스 표시 및 관리 | 📋 계획됨 |

**6.5 Draco Compression**

| Task              | Description             | Status    |
| ----------------- | ----------------------- | --------- |
| Draco 인코더 설정 | glTF Draco 압축 적용    | 📋 계획됨 |
| 디코더 로드       | 클라이언트 Draco 디코더 | 📋 계획됨 |
| 압축률 최적화     | 품질/압축률 균형        | 📋 계획됨 |

---

## Phase 7: Production & Scale 📋 계획됨

> **Status**: 📋 계획됨 | **Progress**: 0%

### Goal

프로덕션 배포 + 스케일링

### Milestones

| Milestone         | Description                      | Status    |
| ----------------- | -------------------------------- | --------- |
| Docker 최적화     | 멀티스테이지 빌드, 이미지 경량화 | 📋 계획됨 |
| Kubernetes        | 15대+ 시 K8s 전환                | 📋 계획됨 |
| Blue-Green 배포   | 무중단 배포 파이프라인           | 📋 계획됨 |
| 문서화            | API 문서, 운영 가이드, Runbook   | 📋 계획됨 |
| Disaster Recovery | 재해 복구 절차 검증              | 📋 계획됨 |

### Acceptance Criteria

- [ ] Docker 이미지 크기 50% 감소
- [ ] Kubernetes 클러스터 정상 동작 (15대+ 키오스크)
- [ ] Blue-Green 배포 무중단 전환
- [ ] 운영 문서 완비 (API, 가이드, Runbook)
- [ ] RTO: 4시간, RPO: 1시간 달성

### Kubernetes Scale Criteria

| Kiosk Count | Recommended Orchestration |
| ----------- | ------------------------- |
| < 15대      | Docker Compose            |
| ≥ 15대      | Kubernetes                |

### Details

**7.1 Docker Optimization**

| Task              | Description        | Status    |
| ----------------- | ------------------ | --------- |
| 멀티스테이지 빌드 | 빌드/런타임 분리   | 📋 계획됨 |
| 이미지 경량화     | Alpine 기반 이미지 | 📋 계획됨 |
| 레이어 최적화     | 캐시 활용 최적화   | 📋 계획됨 |
| 보안 스캔         | 취약점 스캔 자동화 | 📋 계획됨 |

**7.2 Kubernetes Migration**

| Task              | Description               | Status    |
| ----------------- | ------------------------- | --------- |
| K8s 클러스터 구성 | 클러스터 설정             | 📋 계획됨 |
| Helm 차트 작성    | 배포 자동화               | 📋 계획됨 |
| HPA 설정          | Horizontal Pod Autoscaler | 📋 계획됨 |
| 서비스 메시       | Istio/Linkerd 검토        | 📋 계획됨 |

**7.3 Blue-Green Deployment**

| Task           | Description         | Status    |
| -------------- | ------------------- | --------- |
| 배포 전략 설계 | Blue-Green 아키텍처 | 📋 계획됨 |
| 트래픽 전환    | 라우팅 전환 로직    | 📋 계획됨 |
| 롤백 자동화    | 실패 시 자동 롤백   | 📋 계획됨 |
| 헬스체크       | 배포 완료 확인      | 📋 계획됨 |

**7.4 Documentation & Runbook**

| Task          | Description          | Status    |
| ------------- | -------------------- | --------- |
| API 문서      | OpenAPI/Swagger 문서 | 📋 계획됨 |
| 운영 가이드   | 운영자 매뉴얼        | 📋 계획됨 |
| Runbook       | 장애 대응 절차서     | 📋 계획됨 |
| 아키텍처 문서 | 시스템 아키텍처 문서 | 📋 계획됨 |

**7.5 Disaster Recovery**

| Task              | Description            | Status    |
| ----------------- | ---------------------- | --------- |
| DB 복원 테스트    | 백업에서 DB 복원       | 📋 계획됨 |
| MinIO 데이터 복구 | 파일 스토리지 복구     | 📋 계획됨 |
| 환경 변수 재설정  | 환경 재구성 절차       | 📋 계획됨 |
| RTO/RPO 검증      | RTO: 4시간, RPO: 1시간 | 📋 계획됨 |

---

## Technical Decisions Summary

| Category      | Decision                                    | Rationale                                                       |
| ------------- | ------------------------------------------- | --------------------------------------------------------------- |
| Frontend      | React + R3F + Zustand                       | 이미 구축됨, 선언적 3D                                          |
| API Layer     | NestJS / FastAPI / Spring Boot (검토 중)    | [ADR-001](./adr/001_BACKEND_STACK.md) 검토 중                   |
| Message Queue | RabbitMQ                                    | [ADR-002](./adr/002_QUEUE_ALTERNATIVES_COMPARISON.md) 승인 완료 |
| Worker Engine | Python 3.12 + Celery                        | [ADR-003](./adr/003_PYTHON_WORKER_STACK.md) 승인 완료           |
| Database      | PostgreSQL                                  | 메타데이터, ACID 트랜잭션                                       |
| Storage       | MinIO (S3 호환)                             | 클라우드 마이그레이션 용이                                      |
| Cache/Session | RabbitMQ RPC (MVP)                          | Redis 제거, 인프라 단순화                                       |
| Real-time     | WebSocket (우선)                            | 안정성, 디버깅 용이                                             |
| Kiosk Sync    | Master-Wins → WebRTC                        | 단계적 고도화                                                   |
| Orchestration | Docker Compose → K8s                        | 15대 기준 전환                                                  |
| Testing       | Vitest + Playwright                         | 단위 + E2E                                                      |
| Monitoring    | Prometheus + Grafana                        | 업계 표준, 풍부한 생태계                                        |
| IaC           | Docker Compose (MVP) → Terraform (Phase 5+) | MVP 단순화, Phase 5부터 환경 분리                               |

---

## Related Documents

| Document                                                 | Description               |
| -------------------------------------------------------- | ------------------------- |
| [ARCHITECTURE.md](./ARCHITECTURE.md)                     | 시스템 구조, 패키지 설계  |
| [DEV_GUIDE.md](./DEV_GUIDE.md)                           | 개발 가이드, 컨벤션       |
| [GIT_CONVENTIONS.md](./GIT_CONVENTIONS.md)               | Git 워크플로우, 커밋 규칙 |
| [GLOSSARY.md](./GLOSSARY.md)                             | 용어 및 약어 정의         |
| [phases/PHASE_NAV_GUIDE.md](./phases/PHASE_NAV_GUIDE.md) | Phase별 구현 문서 가이드  |

---

## Related Terms

For detailed terminology, see [GLOSSARY.md](./GLOSSARY.md):

| Category | Link                                        | Key Terms                |
| -------- | ------------------------------------------- | ------------------------ |
| CAD/3D   | [CAD/3D](./GLOSSARY.md#cad3d)               | DXF, glTF, Entity, Layer |
| Frontend | [프론트엔드](./GLOSSARY.md#프론트엔드)      | R3F, Three.js, Zustand   |
| Backend  | [백엔드](./GLOSSARY.md#백엔드)              | WebSocket, JWT, FastAPI  |
| DevOps   | [DevOps/인프라](./GLOSSARY.md#devops인프라) | Docker, K8s, CI/CD       |
| Security | [보안](./GLOSSARY.md#보안)                  | OWASP, XSS, CSRF         |

---

## Changelog

| Version | Date       | Changes                                                                                                                                                                               |
| ------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0.1.7   | 2025-12-11 | 문서 품질 개선: 상태 표시 통일 (아이콘+한글), 언어 영어화, Phase 4-7 상세화, Acceptance Criteria 추가, 체크박스→테이블 변환, ADR-001 링크 추가, 용어집 링크 추가, 테스트 수 85개 통일 |
| 0.1.6   | 2025-12-10 | ADR-003 승인 반영 (Python 3.12 + Celery Worker 기술 스택 확정)                                                                                                                        |
| 0.1.5   | 2025-12-08 | ADR-002 승인 완료 반영 (RabbitMQ 선택)                                                                                                                                                |
| 0.1.4   | 2025-12-05 | Redis 제거 (RabbitMQ RPC로 대체), Terraform → Docker Compose (MVP), 기술 스택 단순화, Phase 3A 번호 재정렬 (3A.1↔3A.2 교체: 인프라 우선), 3B 병렬 개발 가능성 명시                    |
| 0.1.3   | 2025-12-04 | 삭제된 PHASE_DEV_DOC_GUIDE.md 참조 제거, Phase 3 분할 (3A/3B/3C), 테스트 수 85개 수정, 기술 스택 동기화                                                                               |
| 0.1.2   | 2025-12-03 | Phase 2A 완료 (100%), 단위 테스트 85개 통과, utils 커버리지 98.29%                                                                                                                    |
| 0.1.1   | 2025-12-02 | Phase개발 템플릿 개발완료                                                                                                                                                             |
| 0.1.0   | 2025-12-01 | Phase 구조 개편 (1.5 Three.js 학습 추가, 2A/2B 분리), CAD Viewer 기능 추가, Phase 2A 진행률 업데이트                                                                                  |
| 0.0.0   | 2025-11-28 | 초기 버전, 로드맵/아키텍처/깃컨벤션 문서가이드 정리                                                                                                                                   |
