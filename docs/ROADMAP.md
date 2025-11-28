# Roadmap

CAD Viewer 프로젝트 로드맵

> **Last Updated**: 2025-11-26
> **Version**: 2.0 (전문가 검토 반영)

---

## 프로젝트 비전

Three.js 기반 CAD 뷰어에서 시작하여, **건축 도면 → 3D 모델 변환 → 키오스크 연동 시스템**으로 발전하는 프로젝트

### 최종 목표
1. CAD 도면 업로드 → 백엔드 3D 변환 → 파일서버 저장
2. JSON API로 프론트엔드에서 3D 모델 렌더링
3. 키오스크 연동 및 키오스크 간 실시간 동기화

### 타임라인 개요

| Phase | 이름 | 기간 | 상태 |
|-------|------|------|------|
| 1 | Foundation | - | ✅ 완료 |
| 2 | CAD Features | 2-3주 | 🔄 80% |
| 2.5 | Performance | 2-3주 | 📋 계획 |
| 3 | Backend | 15주 | 📋 계획 |
| 4 | Synchronization | 4주 | 📋 계획 |
| 5 | Staging | 3주 | 📋 계획 |
| 6 | Enhancement | 4주 | 📋 계획 |
| 7 | Production | 4주 | 📋 계획 |
| **총계** | | **9개월** | |

---

## Phase 1: Foundation (기본 구조) ✅

> **Status**: ✅ COMPLETED | **Progress**: 100%

### 목표
프로젝트 기반 구조 및 3D 렌더링 인프라 구축

### Milestones

| Milestone | 주요 내용 | Status |
|-----------|----------|--------|
| 프로젝트 초기화 | Vite + React + TypeScript 설정 | ✅ |
| 코드 품질 | ESLint + Prettier + 경로 별칭 | ✅ |
| 아키텍처 | Layer-Based 구조, Zustand 스토어 | ✅ |
| 라우팅 | React Router v6 설정 | ✅ |
| Three.js 기반 | R3F 기본 씬, OrbitControls | ✅ |
| 레이아웃 | MainLayout, SideBar, Footer | ✅ |

---

## Phase 2: CAD Features (CAD 기능) 🔄

> **Status**: 🔄 IN PROGRESS | **Progress**: 80%

### 목표
DXF 파일을 웹에서 렌더링하고 레이어별 제어 + Three.js 학습 예제 + **테스트 기반 구축**

### Milestones

| Milestone | 주요 내용 | Status |
|-----------|----------|--------|
| DXF Parser | 파일 파싱, 엔티티 추출 | ✅ |
| Geometry Converter | DXF → Three.js 변환 | ✅ |
| Hybrid Strategy | 프론트/백엔드 분기 처리 | ✅ |
| CAD Scene | 3D 렌더링 컴포넌트 | ✅ |
| Layer Panel | 레이어 표시/숨김 UI | ✅ |
| Viewer Controls | 카메라 프리셋, 뷰 제어 | ✅ |
| Selection | 엔티티 선택/호버 | ✅ |
| **Teapot 예제** | Three.js 와이어프레임 학습 예제 | 📋 TODO |
| **GUI 컨트롤** | lil-gui 파라미터 조정 패널 | 📋 TODO |
| 줌/패닝 개선 | 사용성 개선 | 📋 TODO |
| **Unit 테스트** | Vitest 테스트 인프라 구축 | 📋 TODO |
| **CI 파이프라인** | GitHub Actions (lint + build + test) | 📋 TODO |

### Teapot 예제 상세

Three.js 공식 예제 ([teapot geometry](https://threejs.org/examples/#webgl_geometry_teapot)) 기반 학습용 구현

- 와이어프레임 렌더링 모드
- 실시간 파라미터 조정 (크기, 세그먼트, 재질)
- OrbitControls 카메라 제어
- 기존 CAD 뷰어와 공통 인프라 공유

### 테스트 전략 (신규)

```yaml
unit_tests:
  framework: Vitest
  coverage_target: 70%
  focus:
    - DXF 파서 유틸리티
    - 지오메트리 변환 로직
    - Zustand 스토어 액션

ci_pipeline:
  tool: GitHub Actions
  triggers: [push, pull_request]
  jobs:
    - lint (ESLint)
    - type-check (tsc)
    - test (Vitest)
    - build (Vite)
```

---

## Phase 2.5: Performance Optimization (성능 최적화) 📋

> **Status**: 📋 PLANNED | **Progress**: 0%

### 목표
대용량 CAD 파일 렌더링 성능 최적화

### Milestones

| Milestone | 주요 내용 | Status |
|-----------|----------|--------|
| LOD 시스템 | 거리별 3단계 상세도 (high/medium/low) | 📋 TODO |
| Instancing | 반복 패턴 자동 감지 및 인스턴싱 | 📋 TODO |
| WebWorker | 파싱/변환 오프로딩 (1MB+ 파일) | 📋 TODO |
| 메모리 관리 | 자동 dispose, Frustum Culling | 📋 TODO |
| 청킹 전략 | 10,000+ 엔티티 분할 로딩 | 📋 TODO |

### 성능 목표

| 파일 규모 | 엔티티 수 | 타겟 FPS | 전략 |
|----------|----------|----------|------|
| 소형 | <100 | 60 fps | 기본 렌더링 |
| 중형 | 100-1,000 | 30-60 fps | LOD Level 2 |
| 대형 | 1,000-10,000 | 30 fps | LOD + 청킹 |
| 초대형 | 10,000+ | 15-30 fps | 청킹 + 가상화 |

---

## Phase 3: Backend Integration (백엔드) 📋

> **Status**: 📋 PLANNED | **Progress**: 10%
> **Duration**: 15주 (기존 12주에서 연장)

### 목표
백엔드 서버 연동, CAD 변환 엔진, 파일 관리 및 실시간 동기화

### 기술 스택

| 컴포넌트 | 선택 | 근거 |
|---------|------|------|
| **Framework** | Python FastAPI | CAD 라이브러리 풍부 (ezdxf), 빠른 개발 |
| **Task Queue** | Celery + Redis | 장시간 변환 작업 처리 |
| **Database** | PostgreSQL | 메타데이터, ACID 트랜잭션 |
| **Cache/Broker** | Redis | 캐싱, Pub/Sub, Celery 브로커 |
| **Storage** | MinIO (S3 호환) | 파일 저장, 클라우드 마이그레이션 용이 |
| **CAD Parser** | ezdxf | DXF 파싱, Python 생태계 |
| **3D Export** | pygltflib | glTF/glb 생성 |

### Milestones

| Milestone | 주요 내용 | Duration | Status |
|-----------|----------|----------|--------|
| **3.1 기본 인프라** | Docker Compose, DB 마이그레이션 | 3주 | 📋 TODO |
| **3.2 파일 관리** | 업로드/다운로드 API, MinIO 통합 | 3주 | 📋 TODO |
| **3.3 CAD 변환 엔진** | Celery 워커, DXF→3D 변환 | 5주 | 📋 TODO |
| **3.4 실시간 통신** | WebSocket 서버, Redis Pub/Sub | 2주 | 📋 TODO |
| **3.5 인증 시스템** | JWT, 권한 관리, 감사 로그 | 2주 | 📋 TODO |

### 3.1 기본 인프라 상세

- [ ] Docker Compose 환경 구축 (PostgreSQL, Redis, MinIO)
- [ ] FastAPI 프로젝트 초기화 및 구조 설계
- [ ] Alembic 마이그레이션 설정
- [ ] OpenAPI 3.0 문서 자동 생성
- [ ] 환경 변수 관리 (.env, secrets)
- [ ] **ezdxf → pygltflib POC** (2D→3D 변환 검증)

### 3.2 파일 관리 상세

- [ ] 파일 업로드 API (`POST /api/v1/files/upload`)
- [ ] 파일 목록 API (`GET /api/v1/files`)
- [ ] 파일 상세 API (`GET /api/v1/files/{file_id}`)
- [ ] 파일 삭제 API (`DELETE /api/v1/files/{file_id}`)
- [ ] 복잡도 분석기 (ezdxf 메타데이터 파싱)
- [ ] MinIO 스토리지 서비스 구현
- [ ] 파일 다운로드 API (presigned URL)
- [ ] 드래그앤드롭 프론트엔드 연동

### 3.3 CAD 변환 엔진 상세

- [ ] Celery 워커 설정 (Redis 브로커)
- [ ] DXF 파서 구현 (ezdxf)
- [ ] 2D → 3D 변환 로직 (압출 알고리즘)
- [ ] glTF/glb 포맷 생성 (pygltflib)
- [ ] 진행률 추적 (Redis Pub/Sub → WebSocket)
- [ ] 변환 시작 API (`POST /api/v1/conversions`)
- [ ] 변환 상태 API (`GET /api/v1/conversions/{id}`)
- [ ] 변환 취소 API (`POST /api/v1/conversions/{id}/cancel`)
- [ ] **재시도 정책** (max_retries=3, exponential backoff)
- [ ] **Dead Letter Queue** (실패 작업 관리)

### 3.4 실시간 통신 상세

- [ ] WebSocket 서버 (`/ws/conversion/{file_id}`)
- [ ] 키오스크 동기화 (`/ws/kiosk/{session_id}`)
- [ ] Redis Pub/Sub 통합
- [ ] Master-wins 충돌 해결 로직
- [ ] 재연결 메커니즘
- [ ] Heartbeat/ping-pong (30초 간격)

### 3.5 인증 시스템 상세

- [ ] JWT 발급/검증 로직
- [ ] 회원가입 API (`POST /api/v1/auth/register`)
- [ ] 로그인 API (`POST /api/v1/auth/login`)
- [ ] 리프레시 토큰 로직
- [ ] 파일 소유권 검증 미들웨어
- [ ] 감사 로그 기록
- [ ] **Rate Limiting** (slowapi + Redis)

### API 명세 (신규)

```yaml
# 파일 관리
POST   /api/v1/files/upload          # 파일 업로드
GET    /api/v1/files                  # 파일 목록
GET    /api/v1/files/{id}             # 파일 상세
DELETE /api/v1/files/{id}             # 파일 삭제
GET    /api/v1/files/{id}/metadata    # DXF 메타데이터

# 변환 관리
POST   /api/v1/conversions            # 변환 시작
GET    /api/v1/conversions/{id}       # 변환 상태
POST   /api/v1/conversions/{id}/cancel # 변환 취소

# 키오스크 세션
POST   /api/v1/kiosks/sessions        # 세션 생성
GET    /api/v1/kiosks/sessions/{id}   # 세션 정보
PATCH  /api/v1/kiosks/sessions/{id}   # 마스터 변경
DELETE /api/v1/kiosks/sessions/{id}   # 세션 종료

# 인증
POST   /api/v1/auth/register          # 회원가입
POST   /api/v1/auth/login             # 로그인
POST   /api/v1/auth/refresh           # 토큰 갱신

# 헬스체크
GET    /health                        # 서버 상태
GET    /health/ready                  # 준비 상태
GET    /metrics                       # Prometheus 메트릭
```

### 파일 저장 포맷 전략

| 포맷 | 용도 | 크기 | 시나리오 |
|------|------|------|----------|
| **glTF 2.0** | 프로덕션 렌더링 | 중간 | 최종 렌더링 |
| **glb (Binary)** | 키오스크 | 작음 | 저사양 디바이스 |
| **JSON** | 디버깅 | 큼 | 개발/디버깅 |
| **Draco 압축** | 대용량 모델 | 매우 작음 | 네트워크 제약 |

### Celery 워커 구성 (신규)

```yaml
celery_queues:
  small_files:
    workers: 4
    concurrency: 2
    max_memory: 512MB
    timeout: 30s
    routing: "entities < 100"

  medium_files:
    workers: 2
    concurrency: 1
    max_memory: 2GB
    timeout: 5m
    routing: "entities 100-1000"

  large_files:
    workers: 1
    concurrency: 1
    max_memory: 4GB
    timeout: 30m
    routing: "entities > 1000"
```

---

## Phase 4: Synchronization (동기화) 📋

> **Status**: 📋 PLANNED | **Progress**: 30%
> **Duration**: 4주
> **의존성**: Phase 3 WebSocket 서버 완료 필요

### 목표
멀티 디바이스 간 CAD 뷰어 상태 실시간 동기화 (키오스크 연동)

### 아키텍처

```
┌─────────────┐     WebSocket      ┌─────────────┐
│  Kiosk A    │◄──────────────────►│  Sync Hub   │
│  (Master)   │                    │  (Backend)  │
└─────────────┘                    └──────┬──────┘
                                          │
                                   Redis Pub/Sub
                                          │
┌─────────────┐     WebSocket      ┌──────┴──────┐
│  Kiosk B    │◄──────────────────►│  Sync Hub   │
│  (Slave)    │                    │  (Backend)  │
└─────────────┘                    └─────────────┘
```

### Milestones

| Milestone | 주요 내용 | Status |
|-----------|----------|--------|
| Transport 구조 | BaseTransport, Factory 패턴 | ✅ |
| Sync Store | 동기화 상태 관리 | ✅ |
| WebSocket 연결 | 실제 연결 로직 구현 | 📋 TODO |
| **Leader Election** | 마스터 자동 선출 (장애 복구) | 📋 TODO |
| **State Recovery** | 재연결 시 상태 복구 | 📋 TODO |
| **Connection Health** | 연결 상태 모니터링 | 📋 TODO |
| 재연결 메커니즘 | 자동 재연결 로직 | 📋 TODO |
| 상태 충돌 해결 | Master-Wins 전략 | 📋 TODO |
| Kiosk Display | 키오스크 전용 페이지 (터치 최적화) | 📋 TODO |
| 뷰 상태 동기화 | 카메라/선택 상태 공유 | 📋 TODO |

### 동기화 전략

| Phase | 전략 | 설명 |
|-------|------|------|
| Phase 4 | **Master-Wins** | 마스터 키오스크 상태 우선 (빠른 구현) |
| Phase 6 | **WebRTC P2P** | 저지연 직접 통신 (선택적 확장) |

### Leader Election 상세 (신규)

```yaml
leader_election:
  algorithm: "Bully Algorithm"
  heartbeat_interval: 5s
  election_timeout: 15s

  failover:
    - 마스터 heartbeat 실패 감지
    - 가장 오래된 연결 클라이언트가 마스터 승격
    - 다른 클라이언트에게 새 마스터 브로드캐스트
    - 상태 동기화 재개
```

---

## Phase 5: Staging & Integration (스테이징) 📋

> **Status**: 📋 PLANNED | **Progress**: 0%
> **Duration**: 3주

### 목표
프로덕션 배포 전 통합 테스트 및 스테이징 환경 구축

### Milestones

| Milestone | 주요 내용 | Status |
|-----------|----------|--------|
| 환경 분리 | Dev / Staging / Prod 구성 | 📋 TODO |
| E2E 테스트 | Playwright 통합 테스트 | 📋 TODO |
| 부하 테스트 | Locust 성능 테스트 | 📋 TODO |
| 모니터링 설정 | Prometheus + Grafana | 📋 TODO |
| 알림 구성 | Critical/Warning/Info 계층 | 📋 TODO |

### 환경 분리 전략 (신규)

```yaml
environments:
  development:
    infra: Docker Compose (로컬)
    database: PostgreSQL (단일)
    storage: MinIO (단일)

  staging:
    infra: Docker Compose (서버)
    database: PostgreSQL (단일)
    storage: MinIO (단일)
    monitoring: Prometheus + Grafana

  production:
    infra: Docker Compose (15대 미만) / K8s (15대 이상)
    database: PostgreSQL (Read Replica)
    storage: MinIO (클러스터) or AWS S3
    monitoring: Prometheus + Grafana + ELK
    cdn: CloudFlare (선택적)
```

### 모니터링 역할 분담 (신규)

| 도구 | 역할 | 용도 |
|------|------|------|
| **Prometheus** | 메트릭 수집 | CPU, 메모리, 요청 수, 변환 시간 |
| **Grafana** | 대시보드 | 실시간 모니터링, 알림 |
| **ELK Stack** | 로그 집중화 | 에러 추적, 감사 로그 (Prod만) |

### 알림 규칙 (신규)

```yaml
alerts:
  critical:
    - 서버 다운 (5분 이상)
    - 변환 실패율 > 10%
    - 디스크 사용량 > 90%
    channel: PagerDuty / 전화

  warning:
    - 응답 시간 > 2초
    - 변환 실패율 > 5%
    - 메모리 사용량 > 80%
    channel: Slack

  info:
    - 배포 완료
    - 스케일링 이벤트
    channel: Slack
```

---

## Phase 6: Enhancement (고도화) 📋

> **Status**: 📋 PLANNED | **Progress**: 0%
> **Duration**: 4주

### 목표
UX 개선, 품질 향상, 접근성

### Milestones

| Milestone | 주요 내용 | Status |
|-----------|----------|--------|
| WebRTC P2P | 저지연 키오스크 통신 (선택적) | 📋 TODO |
| 다국어 지원 | 한국어/영어 (i18next) | 📋 TODO |
| 다크모드 | 시스템 설정 연동 | 📋 TODO |
| **접근성** | WCAG 2.1 AA 준수 | 📋 TODO |
| 렌더링 최적화 | Draco 압축 (90% 크기 감소) | 📋 TODO |

### 키오스크 UI 접근성 요구사항

- 최소 터치 타겟: **44x44px** (WCAG 2.1)
- 키보드 네비게이션 지원
- 스크린 리더 호환 (aria-label)
- 고대비 모드 지원

---

## Phase 7: Production Readiness (프로덕션) 📋

> **Status**: 📋 PLANNED | **Progress**: 0%
> **Duration**: 4주

### 목표
프로덕션 배포 준비 및 운영 안정화

### Milestones

| Milestone | 주요 내용 | Status |
|-----------|----------|--------|
| 컨테이너화 | Docker 이미지 최적화 | 📋 TODO |
| 오케스트레이션 | Kubernetes (15대+ 시) | 📋 TODO |
| CI/CD 고도화 | Blue-Green 배포 | 📋 TODO |
| 보안 강화 | Rate Limiting, OWASP Top 10 | 📋 TODO |
| 문서화 | API 문서, 운영 가이드, Runbook | 📋 TODO |
| **백업 전략** | DB/파일 백업, 재해 복구 | 📋 TODO |
| **IaC** | Terraform 인프라 코드화 | 📋 TODO |

### 배포 환경

- **클라우드**: AWS/GCP (자동 스케일링)
- **키오스크 규모**: 중규모 5-20대 (그룹별 동기화)
- **오케스트레이션 기준**: 15대 미만 Docker Compose, 15대 이상 Kubernetes

### 백업 및 재해 복구 전략 (신규)

```yaml
backup_strategy:
  database:
    frequency: 매일 자정
    retention: 30일
    location: S3 Cross-Region

  file_storage:
    frequency: 실시간 복제
    retention: 영구
    location: MinIO 클러스터 or S3

  configuration:
    method: Git 버전 관리
    secrets: AWS Secrets Manager

disaster_recovery:
  rto: 4시간  # Recovery Time Objective
  rpo: 1시간  # Recovery Point Objective

  procedures:
    - 백업에서 DB 복원
    - MinIO 데이터 복구
    - 환경 변수 재설정
    - 헬스체크 확인
```

### 보안 체크리스트 (신규)

```yaml
security:
  owasp_top_10:
    - [ ] SQL Injection 방지 (ORM 사용)
    - [ ] XSS 방지 (입력 검증)
    - [ ] CSRF 토큰
    - [ ] 인증/인가 검증
    - [ ] 보안 헤더 설정

  file_upload:
    - [ ] 파일 타입 검증 (magic bytes)
    - [ ] 파일 크기 제한 (100MB)
    - [ ] 악성코드 스캔 (ClamAV)

  websocket:
    - [ ] JWT 인증
    - [ ] Rate Limiting
    - [ ] Origin 검증

  secrets:
    - [ ] 환경 변수 분리
    - [ ] AWS Secrets Manager
    - [ ] 로그에서 민감정보 제외
```

---

## 기술적 의사결정 요약

| 항목 | 결정 | 근거 |
|------|------|------|
| 프론트엔드 | React + R3F + Zustand | 이미 구축됨, 선언적 3D |
| 백엔드 | FastAPI + Celery | CAD 라이브러리, 빠른 개발 |
| 데이터베이스 | PostgreSQL + Redis | 메타데이터 + 캐싱/Pub-Sub |
| 스토리지 | MinIO (S3 호환) | 클라우드 마이그레이션 용이 |
| 실시간 통신 | WebSocket (우선) | 안정성, 디버깅 용이 |
| 키오스크 동기화 | Master-Wins → WebRTC | 단계적 고도화 |
| 오케스트레이션 | Docker Compose → K8s | 15대 기준 전환 |
| 테스트 | Vitest + Playwright | 단위 + E2E |

---

## 리스크 및 완화 전략

| 리스크 | 영향 | 확률 | 완화 전략 |
|--------|------|------|----------|
| CAD 변환 병목 | High | High | Celery 워커 스케일링, 복잡도 분기 |
| WebSocket 불안정 | Medium | Medium | Leader Election, 자동 재연결, 상태 복구 |
| 대용량 파일 처리 | High | Medium | WebWorker, 청킹, Draco 압축 |
| 키오스크 세션 충돌 | Medium | Medium | Master-Wins, 감사 로그 |
| **보안 취약점** | High | Medium | OWASP Top 10, 파일 검증, Rate Limiting |
| **데이터 손실** | High | Low | 백업 전략, Cross-Region 복제 |
| **비용 초과** | Medium | Medium | 모니터링, 리소스 최적화, 예산 알림 |
| **2D→3D 변환 실패** | High | Medium | POC 선행, 지원 엔티티 범위 제한 |

---

## Appendix

### 관련 문서

| 문서 | 역할 |
|------|------|
| [ARCHITECTURE.md](./ARCHITECTURE.md) | 시스템 구조, 패키지 설계 |
| [DEV_GUIDE.md](./DEV_GUIDE.md) | 개발 가이드, 컨벤션 |

### 문서 역할 분리

| 문서 | 담당 | 포함 내용 |
|------|------|----------|
| **ROADMAP.md** | 방향성, 일정 | What & When |
| **ARCHITECTURE.md** | 시스템 구조 | How (Structure) |
| **DEV_GUIDE.md** | 실무 가이드 | How (Practice) |

### 참고 자료

- [Three.js Teapot Example](https://threejs.org/examples/#webgl_geometry_teapot)
- [ezdxf Documentation](https://ezdxf.readthedocs.io/)
- [glTF 2.0 Specification](https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html)
- [FastAPI Best Practices](https://github.com/zhanymkanov/fastapi-best-practices)
- [Celery Documentation](https://docs.celeryq.dev/)

---

## 변경 이력

| 버전 | 날짜 | 변경 내용 |
|------|------|----------|
| 1.0 | 2025-11-26 | 초기 로드맵 작성 |
| 2.0 | 2025-11-26 | 전문가 검토 반영 (Phase 재구성, 일정 조정, 보안/백업 추가) |
