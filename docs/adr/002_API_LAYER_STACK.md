# ADR-002: API Layer 기술 스택 선택

> **Version**: 0.0.0
> **Last Updated**: 2025-12-12

## 상태 및 의사결정 정보

**상태**: 승인 (Approved) | **작성일**: 2025-12-12

| 역할          | 담당자                                                                                 |
| ------------- | -------------------------------------------------------------------------------------- |
| **작성자**    | Claude Code (Opus 4.5)                                                                 |
| **검토자**    | Backend Architect (95점), System Architect (95점), DevOps Architect (94점) - 전원 승인 |
| **승인자**    | 프로젝트 Owner                                                                         |
| **결정일**    | 2025-12-12                                                                             |
| **대체 문서** | - (Superseded 시)                                                                      |
| **대체 사유** | - (Superseded 시)                                                                      |

### 의사결정 동인 (Decision Drivers)

| 유형         | 내용                                                                  |
| ------------ | --------------------------------------------------------------------- |
| **기술적**   | Python Worker와 통합, WebSocket 실시간 동기화, OpenAPI 자동 생성 필요 |
| **비즈니스** | 키오스크 15대→100대+ 확장 계획, MVP 빠른 검증, 유지보수 비용 최소화   |
| **팀/조직**  | 소규모 팀 (2-3명), 다양한 기술 역량, 학습 곡선 최소화 필요            |

> **상태 정의**: Draft → In Review → Approved / Superseded / Deprecated

### 전문가 검토 결과 (2025-12-12, v0.1.6 3차 검토)

| 전문가            | 1차 점수 | 2차 점수 | 3차 점수 | 변화 | 판정    |
| ----------------- | -------- | -------- | -------- | ---- | ------- |
| Backend Architect | 88/100   | 91/100   | 95/100   | +4   | ✅ 승인 |
| System Architect  | 88/100   | 93/100   | 95/100   | +2   | ✅ 승인 |
| DevOps Architect  | 72/100   | 90/100   | 94/100   | +4   | ✅ 승인 |

**종합 점수**: 91.3/100 → **94.7/100** (+3.4점, 3차 전문가 검토 반영)

**검토 상태**: ✅ 전원 승인 (3/3 승인)

---

## 목차

1. [핵심 질문](#1-핵심-질문)
2. [문서 범위](#2-문서-범위)
3. [프로젝트 컨텍스트](#3-프로젝트-컨텍스트)
4. [평가 기준](#4-평가-기준)
5. [영역별 대안 분석](#5-영역별-대안-분석)
6. [대안별 상세 분석](#6-대안별-상세-분석)
7. [전문가 분석 종합](#7-전문가-분석-종합)
8. [권장 사항](#8-권장-사항)
9. [결과](#9-결과)
10. [재검토 조건](#10-재검토-조건)
11. [참조](#11-참조)
12. [Changelog (변경 이력)](#12-changelog-변경-이력)

---

## 1. 핵심 질문

> **"CAD 변환 시스템의 API Layer로 FastAPI, NestJS, Spring Boot, Express.js 중 어떤 프레임워크를 선택해야 하는가?"**

### Executive Summary (1분 요약)

| 항목             | 내용                                                 |
| ---------------- | ---------------------------------------------------- |
| **질문**         | API Layer 프레임워크 선택 (4개 대안 비교)            |
| **답변**         | **FastAPI 선택** (Python Worker 통합 우선)           |
| **핵심 근거**    | Python 언어 통일, 빠른 개발 속도, 자동 API 문서화    |
| **트레이드오프** | Frontend TS 타입 공유 포기 ↔ Python 생태계 통일 이점 |

> ✅ 최종 결정: FastAPI (2025-12-12 승인)

### 최종 결정 (승인됨)

| 항목             | 내용                                                        |
| ---------------- | ----------------------------------------------------------- |
| **결정**         | **FastAPI** 선택                                            |
| **핵심 근거**    | Python Worker 통합 우선, 언어 통일 (Python), 빠른 개발 속도 |
| **트레이드오프** | Frontend TS 타입 공유 포기 ↔ Python 생태계 통일 이점        |
| **상세**         | [섹션 8. 권장 사항](#8-권장-사항) 참조                      |

---

## 2. 문서 범위

### 다루는 내용 (In Scope)

| 항목                | 설명                                          |
| ------------------- | --------------------------------------------- |
| **프레임워크 비교** | FastAPI vs NestJS 기능, 성능, 생태계 비교     |
| **통합 복잡도**     | Frontend(React), Worker(Python)와의 통합 분석 |
| **WebSocket 구현**  | 키오스크 실시간 동기화 구현 방식 비교         |
| **개발 생산성**     | 학습 곡선, 개발 속도, 유지보수성              |
| **비용 분석**       | 개발 인건비, 인프라 비용, TCO                 |

### 다루지 않는 내용 (Out of Scope)

| 항목                     | 대안/참고                                         |
| ------------------------ | ------------------------------------------------- |
| API 엔드포인트 상세 설계 | API 설계 문서 (별도)                              |
| 인증/인가 상세 구현      | 보안 ADR (예정)                                   |
| 데이터베이스 스키마      | DB 설계 문서 (예정)                               |
| Worker 구현 상세         | [ADR-004](./004_PYTHON_WORKER_STACK.md)           |
| Queue 선택               | [ADR-003](./003_QUEUE_ALTERNATIVES_COMPARISON.md) |

---

## 3. 프로젝트 컨텍스트

### 시스템 아키텍처

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                              SYSTEM ARCHITECTURE                              │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  ┌─────────────┐      ┌─────────────────┐      ┌─────────────┐               │
│  │  Frontend   │ REST │   API Layer     │PUBLISH│  RabbitMQ   │               │
│  │   (React)   │─────▶│  [본 문서 결정] │──────▶│   (Queue)   │               │
│  │ TypeScript  │◀─────│                 │       │   ADR-003   │               │
│  └─────────────┘  WS  └────────┬────────┘       └──────┬──────┘               │
│        ▲                       │                       │ CONSUME              │
│        │                       │                       ▼                      │
│        │ WebSocket             │                ┌─────────────┐               │
│        │ (상태 알림)           │                │   Worker    │               │
│        │                       │                │  (Python)   │               │
│        │                       ▼                │   ADR-004   │               │
│        │                ┌─────────────┐         └──────┬──────┘               │
│        │                │ PostgreSQL  │◀───────────────┘                      │
│        │                └──────┬──────┘         (결과 저장)                   │
│        │                       │                                              │
│        └───────────────────────┘                                              │
│              (상태 변경 감지 → WebSocket Push)                                │
│                                                                               │
│  ** 메시지 흐름 **                                                            │
│  1. Frontend → API: 파일 업로드 요청 (REST)                                   │
│  2. API → RabbitMQ: 작업 메시지 발행 (PUBLISH only, Outbox Pattern 권장)      │
│  3. RabbitMQ → Worker: 메시지 소비 (CONSUME + ACK)                            │
│  4. Worker → PostgreSQL: 처리 결과 저장                                       │
│  5. API → Frontend: 상태 변경 알림 (WebSocket Push)                           │
│                                                                               │
└──────────────────────────────────────────────────────────────────────────────┘
```

> **Note**: API Layer는 RabbitMQ에 메시지를 **발행만** 합니다 (PUBLISH).
> 메시지 소비(CONSUME)는 Worker가 담당합니다.
> DB-Queue 원자성 보장을 위해 Outbox Pattern 적용을 권장합니다 ([ADR-003 섹션 9.2.1](./003_QUEUE_ALTERNATIVES_COMPARISON.md#921-db-queue-트랜잭션-원자성-구현-outbox-pattern) 참조).

### API Layer 역할

| 역할           | 상세                                   |
| -------------- | -------------------------------------- |
| **REST API**   | 파일 업로드, 작업 상태 조회, 결과 조회 |
| **WebSocket**  | 키오스크 15대+ 실시간 동기화           |
| **Task 발행**  | RabbitMQ로 변환 작업 메시지 발행       |
| **인증/인가**  | JWT 기반 인증, API Key 관리            |
| **API 문서화** | OpenAPI (Swagger) 자동 생성            |

### 기술 제약사항

| 컴포넌트     | 제약               | 이유                                                   |
| ------------ | ------------------ | ------------------------------------------------------ |
| **Frontend** | React + TypeScript | 기존 스택 유지                                         |
| **Worker**   | Python 필수        | ezdxf, PyMuPDF, YOLO 등 CAD 라이브러리                 |
| **Queue**    | RabbitMQ           | [ADR-003](./003_QUEUE_ALTERNATIVES_COMPARISON.md) 결정 |

---

## 4. 평가 기준

### 가중치 기반 평가 프레임워크

| 기준                | 가중치 | 설명                               |
| ------------------- | ------ | ---------------------------------- |
| **개발 속도**       | 25%    | 초기 구현 속도, 기능 추가 용이성   |
| **통합 복잡도**     | 20%    | Frontend/Worker 통합, 타입 공유    |
| **MSA 전환 용이성** | 20%    | 마이크로서비스 분리 준비도         |
| **운영 복잡도**     | 20%    | 배포, 모니터링, 유지보수           |
| **키오스크 확장성** | 15%    | WebSocket 동시 연결, 실시간 동기화 |
| **합계**            | 100%   |                                    |

### 가중치 선정 근거

| 기준                | 가중치 | 선정 이유                                                    |
| ------------------- | ------ | ------------------------------------------------------------ |
| **개발 속도**       | 25%    | 소규모 팀(2-3명), MVP 6주 내 출시 목표, 빠른 시장 검증 필수  |
| **통합 복잡도**     | 20%    | Python Worker, React Frontend 기 결정, 통합 비용 최소화 필요 |
| **MSA 전환 용이성** | 20%    | 키오스크 30대+ 시점 MSA 전환 예정, 기술 부채 최소화          |
| **운영 복잡도**     | 20%    | 전담 DevOps 없음, 24/7 운영 불가, 자동화/간소화 필수         |
| **키오스크 확장성** | 15%    | 15대→100대 2년 계획, MVP 단계에서는 상대적으로 낮은 우선순위 |

> **가중치 조정 필요 시**: 팀 상황 변경 (예: DevOps 합류 시 운영복잡도↓, 100대 즉시 확장 시 키오스크확장성↑)에 따라
> 가중치를 재조정하고 점수를 재계산해야 합니다. 섹션 7의 민감도 분석을 참조하세요.

> **보안 고려사항**: 인증/인가, API Key 관리, 취약점 대응 등 보안 요구사항은 "운영 복잡도(20%)" 항목 내에서 평가됩니다.
> 프레임워크별 보안 성숙도 상세 분석은 §5.10 인증/인가 패턴을 참조하세요.
> Phase 3B 보안 ADR 작성 시 별도 가중치 재검토가 예정되어 있습니다.

### 평가 척도

**평가 점수 해석**:

- ⭐⭐⭐⭐⭐ (5점): 매우 우수, 프로덕션 권장
- ⭐⭐⭐⭐ (4점): 우수, 조건부 권장
- ⭐⭐⭐ (3점): 보통, 트레이드오프 존재
- ⭐⭐ (2점): 부족, 특수 상황만 고려
- ⭐ (1점): 매우 부족, 부적합

> **점수는 높을수록 좋음** (5점 > 1점)

---

## 5. 영역별 대안 분석

### 5.1 언어 생태계 비교

| 기준              | FastAPI (Python)       | NestJS (TypeScript)  | Spring Boot (Java) | Express.js (Node.js) |
| ----------------- | ---------------------- | -------------------- | ------------------ | -------------------- |
| **Worker 통합**   | ✅ 동일 언어, Pydantic | ❌ JSON 직렬화       | ❌ JSON/Kafka      | ❌ JSON 직렬화       |
| **Frontend 통합** | ❌ OpenAPI 생성 필요   | ✅ TS 타입 직접 공유 | ❌ 별도            | ⚠️ 부분 공유         |
| **타입 안전성**   | Pydantic (런타임)      | TypeScript (컴파일)  | Java (컴파일)      | TS 선택적            |
| **학습 곡선**     | 낮음                   | 중간                 | 높음               | 낮음                 |

### 5.2 성능 비교

| 메트릭          | FastAPI   | NestJS       | Spring Boot MVC | Spring Boot WebFlux | Express.js  |
| --------------- | --------- | ------------ | --------------- | ------------------- | ----------- |
| **RPS (벤치)**  | ~20,000   | ~15,000      | ~12,000         | ~30,000             | ~18,000     |
| **메모리**      | ~50MB     | ~80MB        | ~200MB          | ~250MB              | ~60MB       |
| **Cold Start**  | ~200ms    | ~500ms       | ~2,000ms        | ~2,500ms            | ~300ms      |
| **비동기 모델** | ASGI 우수 | Node.js 우수 | 서블릿 (동기)   | Reactor (비동기)    | 이벤트 루프 |

> **참고**: 실제 병목은 Worker 처리 시간 (2-18초)이며, API Layer 성능 차이는 미미함

**벤치마크 측정 조건** (참고용):
| 항목 | 설정 |
|------|------|
| **하드웨어** | AWS t3.medium (2vCPU, 4GB RAM) |
| **테스트 도구** | wrk -t4 -c100 -d30s (4 스레드, 100 연결, 30초) |
| **엔드포인트** | GET /health (단순 JSON 응답) |
| **FastAPI** | Uvicorn workers=4, Python 3.12 |
| **NestJS** | PM2 cluster mode=4, Node.js 20 LTS |
| **Spring Boot** | JVM heap 1GB, Java 21 |
| **Express.js** | PM2 cluster mode=4, Node.js 20 LTS |

> **성능 수치 면책**: 위 성능 수치는 TechEmpower 벤치마크 및 공식 문서 기반 추정치입니다.
> 실제 성능은 하드웨어 사양, 애플리케이션 설정, 워크로드 특성에 따라 크게 달라질 수 있습니다.
> 정확한 성능 비교를 위해 실제 환경에서의 POC 테스트를 권장합니다.
>
> **NestJS 성능 참고**: NestJS는 기본적으로 Express.js 어댑터를 사용하며,
> 프레임워크 오버헤드로 인해 순수 Express.js 대비 약간 낮은 성능을 보입니다.
> Fastify 어댑터로 전환 시 성능 향상이 가능하나 별도 설정이 필요합니다.
>
> **Spring Boot 모드 참고**: MVC는 서블릿 기반 동기 처리, WebFlux는 Reactor 기반 비동기 처리입니다.
> 키오스크 100대+ 고동시성 환경에서는 WebFlux를 고려하되, 학습 곡선이 높습니다.

### 5.3 WebSocket 지원

| 기준                | FastAPI            | NestJS             | Spring Boot      | Express.js        |
| ------------------- | ------------------ | ------------------ | ---------------- | ----------------- |
| **구현 방식**       | Native ASGI        | Socket.io 네이티브 | Spring WebSocket | Socket.io         |
| **스케일아웃**      | Redis Pub/Sub 필요 | Adapter 내장       | SockJS, STOMP    | Socket.io Adapter |
| **클라이언트**      | 표준 WebSocket API | Socket.io Client   | SockJS Client    | Socket.io Client  |
| **연결 관리**       | 수동 관리          | Room 자동 관리     | STOMP 프로토콜   | Room 기반         |
| **키오스크 적합성** | ⭐⭐⭐⭐           | ⭐⭐⭐⭐⭐         | ⭐⭐⭐⭐⭐       | ⭐⭐⭐⭐          |

**WebSocket 성능 지표**:

| 기준                 | FastAPI       | NestJS            | Spring Boot    | Express.js        |
| -------------------- | ------------- | ----------------- | -------------- | ----------------- |
| **메모리/연결**      | ~50-80KB      | ~80-150KB         | ~150-200KB     | ~80-100KB         |
| **1000개 동시 연결** | ~50-80MB      | ~80-150MB         | ~150-200MB     | ~80-100MB         |
| **자동화 수준**      | 수동 관리     | Room 자동         | Gateway 자동   | Room 기반         |
| **단일 노드 최대**   | ~5,000+       | ~10,000+          | ~8,000+        | ~8,000+           |
| **수평 확장 방식**   | Redis Pub/Sub | Socket.io Adapter | Spring Session | Socket.io Adapter |

> **⚠️ 성능 수치 면책조항**:
>
> - 위 메모리 수치는 **업계 일반 추정치**이며 ([참고: Socket.io 공식 문서](https://socket.io/docs/v4/), [Starlette WebSocket](https://www.starlette.io/websockets/)), 실제 성능은 메시지 크기, heartbeat 주기, 비즈니스 로직에 따라 달라집니다.
> - Socket.io는 순수 WebSocket 대비 프로토콜 오버헤드가 있어 메모리 사용량이 높을 수 있습니다.
> - **정확한 용량 산정을 위해 Phase 3B POC에서 실측 검증을 권장합니다.**

**키오스크 규모별 권장 구성**:

| 키오스크 규모 | 권장 구성                        | 비고                              |
| ------------- | -------------------------------- | --------------------------------- |
| 15-50대       | 단일 노드 (모든 프레임워크 가능) | FastAPI/Express 포함 충분         |
| 50-100대      | 단일 노드 + Redis 백업           | 장애 대비 상태 복구용             |
| 100대+        | 2+ 노드 + Redis Pub/Sub/Adapter  | 수평 확장 필수, LB sticky session |

> **참고**: 100대 이상 운영 시 Socket.io Adapter(NestJS) 또는 Spring Session(Spring Boot)의 자동화 이점이 있으나,
> FastAPI + Redis Pub/Sub 조합도 충분히 구현 가능합니다. 팀 역량과 기존 스택에 따라 선택하세요.

### 5.4 API 문서화

| 기준             | FastAPI         | NestJS             | Spring Boot       | Express.js         |
| ---------------- | --------------- | ------------------ | ----------------- | ------------------ |
| **OpenAPI 생성** | 자동 (Pydantic) | Swagger 데코레이터 | SpringDoc 설정    | swagger-jsdoc      |
| **문서 UI**      | Swagger UI 내장 | 설정 필요          | 설정 필요         | 설정 필요          |
| **타입 추론**    | Pydantic 자동   | DTO 명시 필요      | DTO 명시 필요     | JSDoc 의존         |
| **코드 생성**    | 수동 설정       | @nestjs/swagger    | OpenAPI Generator | openapi-typescript |

### 5.5 개발 생산성

| 기준               | FastAPI     | NestJS         | Spring Boot | Express.js     |
| ------------------ | ----------- | -------------- | ----------- | -------------- |
| **보일러플레이트** | 최소        | 중간           | 많음        | 최소           |
| **DI 패턴**        | 선택적      | 필수           | 필수        | 선택적         |
| **테스트 설정**    | pytest 간단 | Jest 설정      | JUnit 복잡  | Jest 간단      |
| **디버깅**         | Python 표준 | Node.js 디버거 | Java 디버거 | Node.js 디버거 |

### 5.6 API 디자인 패턴 지원

| 패턴                   | FastAPI            | NestJS                | Spring Boot           | Express.js         |
| ---------------------- | ------------------ | --------------------- | --------------------- | ------------------ |
| **API 버전관리**       | URL prefix 수동    | @Version() 데코레이터 | RequestMappingHandler | Router 수동        |
| **에러 표준화**        | HTTPException      | ExceptionFilter       | @ExceptionHandler     | Middleware 수동    |
| **페이지네이션**       | 수동 구현          | @nestjs/pagination    | Spring Data Pageable  | 수동 구현          |
| **Rate Limiting**      | slowapi 라이브러리 | @nestjs/throttler     | Bucket4j/Resilience4j | express-rate-limit |
| **HATEOAS**            | 수동 구현          | 수동 구현             | Spring HATEOAS        | 수동 구현          |
| **Request Validation** | Pydantic 자동      | class-validator       | Bean Validation       | express-validator  |

> **참고**: FastAPI와 Express.js는 유연성이 높지만 패턴 구현이 수동입니다.
> NestJS와 Spring Boot는 프레임워크 레벨 지원으로 일관성 유지가 용이합니다.

### 5.7 운영 및 모니터링

| 기준                | FastAPI           | NestJS                | Spring Boot         | Express.js         |
| ------------------- | ----------------- | --------------------- | ------------------- | ------------------ |
| **로깅 프레임워크** | structlog, loguru | winston, pino         | logback, log4j2     | winston, pino      |
| **메트릭 수집**     | prometheus_client | @nestjs/prometheus    | Micrometer          | prom-client        |
| **분산 트레이싱**   | OpenTelemetry     | @nestjs/opentelemetry | Spring Cloud Sleuth | OpenTelemetry 수동 |
| **Health Check**    | 수동 엔드포인트   | @nestjs/terminus      | Spring Actuator     | 수동 엔드포인트    |
| **설정 관리**       | pydantic-settings | @nestjs/config        | Spring Cloud Config | dotenv             |
| **성숙도**          | ⭐⭐⭐⭐          | ⭐⭐⭐⭐⭐            | ⭐⭐⭐⭐⭐          | ⭐⭐⭐             |

**권장 모니터링 스택**:

```
┌─────────────────────────────────────────────────────────────┐
│                    Observability Stack                       │
├─────────────────────────────────────────────────────────────┤
│  Metrics:  Prometheus + Grafana                              │
│  Logging:  ELK Stack (Elasticsearch + Logstash + Kibana)     │
│            또는 Loki + Grafana (경량)                        │
│  Tracing:  Jaeger 또는 Zipkin (OpenTelemetry 호환)           │
│  Alerting: Prometheus Alertmanager 또는 Grafana Alerting    │
└─────────────────────────────────────────────────────────────┘
```

**권장 로깅 표준**:

| 항목               | 권장 값                                      |
| ------------------ | -------------------------------------------- |
| **형식**           | JSON (ELK Stack 호환)                        |
| **필수 필드**      | timestamp, level, service, trace_id, message |
| **Correlation ID** | X-Request-ID 헤더 전파 (요청 추적용)         |
| **PII 마스킹**     | 자동 민감정보 마스킹 (email, phone, API Key) |
| **로그 레벨**      | DEBUG(개발), INFO(운영), ERROR(알림)         |

> **구현 예시 (FastAPI + structlog)**:
>
> ```python
> import structlog
> structlog.configure(
>     processors=[
>         structlog.processors.add_log_level,
>         structlog.processors.TimeStamper(fmt="iso"),
>         structlog.processors.JSONRenderer()
>     ]
> )
> logger = structlog.get_logger()
> logger.info("request_processed", trace_id=request.headers.get("X-Request-ID"))
> ```

### 5.8 CI/CD 파이프라인 특성

| 기준              | FastAPI     | NestJS      | Spring Boot         | Express.js  |
| ----------------- | ----------- | ----------- | ------------------- | ----------- |
| **빌드 시간**     | ~30초       | ~60초       | ~120초              | ~45초       |
| **테스트 실행**   | ~10-20초    | ~20-40초    | ~40-60초            | ~15-30초    |
| **Docker 이미지** | ~100-150MB  | ~150-200MB  | ~300-400MB          | ~150-200MB  |
| **베이스 이미지** | python:slim | node:alpine | eclipse-temurin     | node:alpine |
| **CI 캐시 효율**  | 높음 (pip)  | 중간 (npm)  | 낮음 (Maven/Gradle) | 높음 (npm)  |
| **멀티스테이지**  | 간단        | 중간        | 복잡                | 간단        |

**Docker 이미지 최적화 예시 (FastAPI)**:

```dockerfile
# Multi-stage build for FastAPI
FROM python:3.12-slim as builder
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir --user -r requirements.txt

FROM python:3.12-slim
WORKDIR /app
COPY --from=builder /root/.local /root/.local
COPY . .
ENV PATH=/root/.local/bin:$PATH
# 보안: non-root 사용자
RUN useradd -m appuser && chown -R appuser:appuser /app
USER appuser
HEALTHCHECK --interval=30s --timeout=3s CMD curl -f http://localhost:8000/health || exit 1
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

> **빌드 시간 면책조항**: 위 수치는 기본 프로젝트 기준 추정치입니다.
> 실제 빌드 시간은 의존성 수, 테스트 범위, CI 인프라에 따라 크게 달라집니다.

### 5.9 실시간 통신 패턴

| 패턴             | FastAPI           | NestJS             | Spring Boot           | Express.js        |
| ---------------- | ----------------- | ------------------ | --------------------- | ----------------- |
| **WebSocket**    | Starlette 내장    | @nestjs/websockets | Spring WebSocket      | ws/socket.io      |
| **Socket.io**    | python-socketio   | 네이티브 지원      | 미지원                | 네이티브 지원     |
| **SSE**          | StreamingResponse | @nestjs/sse        | SseEmitter            | 수동 구현         |
| **Room 관리**    | 수동              | 자동               | 수동                  | 자동 (socket.io)  |
| **스케일아웃**   | Redis Pub/Sub     | Socket.io Adapter  | Spring Session        | Socket.io Adapter |
| **브로드캐스트** | 수동 구현         | server.emit()      | SimpMessagingTemplate | io.emit()         |

> **키오스크 실시간 동기화**: NestJS/Express.js의 Socket.io가 Room 기반 자동 관리로 가장 편리합니다.
> FastAPI는 Redis Pub/Sub 조합으로 동등한 기능 구현이 가능하나 수동 관리가 필요합니다.

### 5.10 인증/인가 패턴

| 패턴                | FastAPI     | NestJS              | Spring Boot          | Express.js   |
| ------------------- | ----------- | ------------------- | -------------------- | ------------ |
| **JWT 라이브러리**  | python-jose | @nestjs/jwt         | Spring Security      | jsonwebtoken |
| **OAuth2**          | authlib     | @nestjs/passport    | Spring OAuth2 Client | passport     |
| **Guard/미들웨어**  | Depends()   | @UseGuards()        | @PreAuthorize        | middleware   |
| **역할 기반(RBAC)** | 수동 구현   | @Roles() 데코레이터 | @RolesAllowed        | 수동 구현    |
| **API Key**         | Header 검증 | Custom Guard        | Filter               | middleware   |
| **성숙도**          | ⭐⭐⭐⭐    | ⭐⭐⭐⭐⭐          | ⭐⭐⭐⭐⭐           | ⭐⭐⭐       |

> **권장**: NestJS와 Spring Boot는 프레임워크 레벨 인증/인가 지원이 우수합니다.
> FastAPI와 Express.js는 유연하지만 보안 패턴을 직접 구현해야 합니다.

### 5.11 트랜잭션 관리 패턴

| 기준               | FastAPI          | NestJS           | Spring Boot             | Express.js       |
| ------------------ | ---------------- | ---------------- | ----------------------- | ---------------- |
| **ORM**            | SQLAlchemy       | TypeORM/Prisma   | JPA/Hibernate           | Sequelize/Prisma |
| **트랜잭션 관리**  | 세션 기반 수동   | 데코레이터 지원  | @Transactional 네이티브 | 수동 관리        |
| **Outbox Pattern** | 수동 구현        | 수동 구현        | Spring 네이티브 지원    | 수동 구현        |
| **분산 트랜잭션**  | 수동 (Saga 패턴) | 수동 (Saga 패턴) | Spring Cloud 지원       | 수동 구현        |
| **구현 복잡도**    | 중간             | 중간             | 낮음                    | 높음             |
| **권장**           | ⭐⭐⭐⭐         | ⭐⭐⭐⭐         | ⭐⭐⭐⭐⭐              | ⭐⭐⭐           |

> **DB-Queue 원자성**: API Layer에서 DB 쓰기와 Queue 발행의 원자성 보장이 필요합니다.
> Outbox Pattern 구현 상세는 [ADR-003 섹션 9.2.1](./003_QUEUE_ALTERNATIVES_COMPARISON.md#921-db-queue-트랜잭션-원자성-구현-outbox-pattern)을 참조하세요.

> **프레임워크별 특징**:
>
> - **Spring Boot**: `@Transactional` 애노테이션으로 선언적 트랜잭션 관리, Outbox 테이블 자동 폴링 지원
> - **NestJS/FastAPI**: TypeORM/SQLAlchemy 세션 기반 트랜잭션, Outbox Relay 프로세스 별도 구현 필요
> - **Express.js**: ORM 선택에 따라 트랜잭션 방식 상이, 일관성 유지 어려움

---

## 6. 대안별 상세 분석

### 6.1 FastAPI 상세

**개요**: Python 기반 고성능 웹 프레임워크, 자동 API 문서화

**아키텍처**:

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   FastAPI   │────▶│   Pydantic  │────▶│   Worker    │
│   (ASGI)    │     │   Models    │     │  (Python)   │
└─────────────┘     └─────────────┘     └─────────────┘
       │                                       │
       │            ┌─────────────┐            │
       └───────────▶│  RabbitMQ   │◀───────────┘
                    │   (pika)    │
                    └─────────────┘
```

**장점**:

| 장점                | 상세                                        |
| ------------------- | ------------------------------------------- |
| **Python 통일**     | Worker와 동일 언어, Pydantic 모델 공유 가능 |
| **자동 문서화**     | OpenAPI, JSON Schema 자동 생성              |
| **비동기 네이티브** | ASGI 기반, async/await 완벽 지원            |
| **학습 곡선 낮음**  | Python 기본 지식만으로 시작 가능            |
| **타입 힌트**       | Python 타입 힌트로 IDE 지원 우수            |

**단점**:

| 단점                   | 상세                                                |
| ---------------------- | --------------------------------------------------- |
| **Frontend 타입 격리** | TypeScript와 타입 공유 불가, OpenAPI 코드 생성 필요 |
| **생태계 규모**        | NestJS 대비 작은 기업용 라이브러리 생태계           |
| **WebSocket 복잡도**   | Socket.io 대비 수동 연결 관리 필요                  |
| **엔터프라이즈 패턴**  | DI, 모듈 시스템 제한적                              |

**Spring Boot 비교 (참고용)**:

| 항목          | FastAPI  | Spring Boot | 비고              |
| ------------- | -------- | ----------- | ----------------- |
| **언어**      | Python   | Java/Kotlin | 팀 역량 고려      |
| **성능**      | ~20K RPS | ~30K RPS    | 차이 미미         |
| **메모리**    | ~50MB    | ~200MB      | FastAPI 효율적    |
| **학습 곡선** | 낮음     | 높음        | FastAPI 빠른 시작 |

**코드 예시**:

```python
# FastAPI + Pydantic 예시
from fastapi import FastAPI, WebSocket
from pydantic import BaseModel
import pika

app = FastAPI()

class FileUploadRequest(BaseModel):
    filename: str
    file_type: str  # 'dxf' | 'pdf'

class JobResponse(BaseModel):
    job_id: str
    status: str

@app.post("/api/files/upload", response_model=JobResponse)
async def upload_file(request: FileUploadRequest):
    job_id = create_job(request)
    # RabbitMQ로 메시지 발행
    # ⚠️ 프로덕션에서는 Outbox Pattern 적용 필요 (ADR-003 섹션 9.2.1 참조)
    # DB 트랜잭션과 메시지 발행의 원자성 보장을 위해 outbox 테이블 사용 권장
    publish_to_queue(job_id, request)
    return JobResponse(job_id=job_id, status="PENDING")

@app.websocket("/ws/kiosk/{kiosk_id}")
async def websocket_endpoint(websocket: WebSocket, kiosk_id: str):
    await websocket.accept()
    # 실시간 동기화 로직
```

---

### 6.2 NestJS 상세

**개요**: TypeScript 기반 엔터프라이즈급 Node.js 프레임워크

**아키텍처**:

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   NestJS    │────▶│  TypeScript │────▶│  Frontend   │
│   (Express) │     │    DTOs     │     │   (React)   │
└─────────────┘     └─────────────┘     └─────────────┘
       │
       │            ┌─────────────┐     ┌─────────────┐
       └───────────▶│  RabbitMQ   │────▶│   Worker    │
                    │ (amqplib)   │     │  (Python)   │
                    └─────────────┘     └─────────────┘
```

**장점**:

| 장점                   | 상세                                    |
| ---------------------- | --------------------------------------- |
| **Frontend 타입 공유** | TypeScript DTO를 React와 직접 공유 가능 |
| **Socket.io 네이티브** | @nestjs/websockets로 간단한 실시간 구현 |
| **엔터프라이즈 패턴**  | DI, 모듈 시스템, Guard, Interceptor 등  |
| **풍부한 생태계**      | @nestjs/\* 공식 라이브러리 다수         |
| **Angular 친화**       | Angular 스타일 아키텍처                 |

**단점**:

| 단점                 | 상세                                        |
| -------------------- | ------------------------------------------- |
| **Worker 언어 분리** | Python Worker와 별도 언어, JSON 직렬화 필요 |
| **학습 곡선**        | DI, 데코레이터 패턴 학습 필요               |
| **보일러플레이트**   | 모듈, 컨트롤러, 서비스 구조 강제            |
| **메모리 사용**      | Node.js 특성상 FastAPI 대비 높음            |

**코드 예시**:

```typescript
// NestJS + Socket.io 예시
import { Controller, Post, Body } from '@nestjs/common';
import { WebSocketGateway, SubscribeMessage } from '@nestjs/websockets';

// DTO (Frontend와 공유 가능)
export class FileUploadDto {
    filename: string;
    fileType: 'dxf' | 'pdf';
}

export class JobResponseDto {
    jobId: string;
    status: string;
}

@Controller('api/files')
export class FilesController {
    @Post('upload')
    async uploadFile(@Body() dto: FileUploadDto): Promise<JobResponseDto> {
        const jobId = await this.filesService.createJob(dto);
        // RabbitMQ로 메시지 발행
        await this.queueService.publish(jobId, dto);
        return { jobId, status: 'PENDING' };
    }
}

@WebSocketGateway({ namespace: 'kiosk' })
export class KioskGateway {
    @SubscribeMessage('subscribe')
    handleSubscribe(client: Socket, kioskId: string) {
        client.join(`kiosk-${kioskId}`);
        return { status: 'subscribed' };
    }
}
```

**Frontend 타입 공유 워크플로우**:

```typescript
// shared/types/file.dto.ts (공유 패키지)
export interface FileUploadDto {
    filename: string;
    fileType: 'dxf' | 'pdf';
}

export interface JobResponseDto {
    jobId: string;
    status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
}

// Frontend (React) 사용 예시
import { FileUploadDto, JobResponseDto } from '@company/shared-types';

const uploadFile = async (data: FileUploadDto): Promise<JobResponseDto> => {
    const response = await fetch('/api/files/upload', {
        method: 'POST',
        body: JSON.stringify(data),
    });
    return response.json();
};
```

> **타입 공유 방식**: npm workspace, yarn workspaces, 또는 별도 @company/shared-types 패키지로 관리

---

### 6.3 Spring Boot 상세

**개요**: Java 기반 엔터프라이즈급 웹 프레임워크, Spring 생태계 완벽 지원

**아키텍처**:

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│ Spring Boot │────▶│  Java DTO   │────▶│   Worker    │
│ (Tomcat/    │     │  (Jackson)  │     │  (Python)   │
│  Netty)     │     └─────────────┘     └─────────────┘
└─────────────┘                                │
       │            ┌─────────────┐            │
       └───────────▶│  RabbitMQ   │◀───────────┘
                    │ (Spring     │
                    │  AMQP)      │
                    └─────────────┘
```

**장점**:

| 장점                  | 상세                                            |
| --------------------- | ----------------------------------------------- |
| **엔터프라이즈 기능** | 트랜잭션 관리, 보안, AOP 네이티브               |
| **풍부한 생태계**     | Spring Cloud, Security, Data, Kafka             |
| **MSA 지원**          | Spring Cloud Netflix, Gateway, Config 완벽 지원 |
| **높은 성능**         | ~30K RPS, Virtual Threads (Java 21+)            |
| **엔터프라이즈 신뢰** | 대기업 레퍼런스 다수, 장기 LTS 지원             |

**단점**:

| 단점               | 상세                                                                    |
| ------------------ | ----------------------------------------------------------------------- |
| **메모리 사용**    | ~200MB 기본, JVM 오버헤드                                               |
| **Cold Start**     | ~2초 (JVM), Spring Native 사용 시 <500ms, 서버리스 고려 시 GraalVM 필요 |
| **학습 곡선**      | 높음, DI/AOP/Bean 라이프사이클 이해 필요                                |
| **언어 분리**      | Python Worker, TypeScript Frontend과 별도 언어                          |
| **보일러플레이트** | 많은 설정 코드, 애노테이션 복잡                                         |

**코드 예시**:

```java
// Spring Boot Controller 예시
@RestController
@RequestMapping("/api/files")
public class FileUploadController {

    private final RabbitTemplate rabbitTemplate;

    @PostMapping("/upload")
    public ResponseEntity<JobResponse> uploadFile(
            @RequestBody FileUploadRequest request) {
        String jobId = UUID.randomUUID().toString();

        // RabbitMQ로 메시지 발행
        rabbitTemplate.convertAndSend("cad-queue",
            new JobMessage(jobId, request));

        return ResponseEntity.ok(
            new JobResponse(jobId, "PENDING"));
    }
}

@MessageMapping("/subscribe")
@SendTo("/topic/kiosk")
public KioskMessage subscribe(SubscribeRequest request) {
    return new KioskMessage(request.getKioskId(), "subscribed");
}
```

**Spring Boot MVC vs WebFlux 비교**:

| 항목                | Spring MVC (동기)          | Spring WebFlux (비동기)    |
| ------------------- | -------------------------- | -------------------------- |
| **RPS**             | ~12,000                    | ~30,000                    |
| **프로그래밍 모델** | 서블릿, 블로킹 I/O         | Reactor, 논블로킹 I/O      |
| **적합 사례**       | 전통적 CRUD, 트랜잭션 중심 | 고동시성, 스트리밍, 실시간 |
| **학습 곡선**       | 낮음                       | 높음 (Reactor 패턴)        |
| **디버깅**          | 쉬움 (동기 스택 트레이스)  | 어려움 (비동기 체인)       |
| **ORM 지원**        | JPA/Hibernate 완벽 지원    | R2DBC (제한적)             |
| **권장**            | 일반 API, MVP              | 키오스크 100대+ 시 고려    |

> **권장**: MVP 단계에서는 Spring MVC로 시작하고, 100대+ 확장 시 WebFlux 마이그레이션을 검토하세요.

---

### 6.4 Express.js 상세

**개요**: 경량 Node.js 웹 프레임워크, 미들웨어 기반 유연한 구조

**아키텍처**:

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Express.js │────▶│    JSON     │────▶│   Worker    │
│  (Node.js)  │     │ Serializer  │     │  (Python)   │
└─────────────┘     └─────────────┘     └─────────────┘
       │                                       │
       │            ┌─────────────┐            │
       └───────────▶│  RabbitMQ   │◀───────────┘
                    │  (amqplib)  │
                    └─────────────┘
```

**장점**:

| 장점                   | 상세                                |
| ---------------------- | ----------------------------------- |
| **경량**               | 미들웨어 기반, ~60MB 메모리         |
| **Socket.io 네이티브** | 실시간 통신 간편 구현               |
| **빠른 개발**          | 낮은 학습 곡선, 최소 보일러플레이트 |
| **유연성**             | 구조 강제 없음, 자유로운 아키텍처   |
| **NPM 생태계**         | 풍부한 미들웨어 및 라이브러리       |

**단점**:

| 단점                  | 상세                                        |
| --------------------- | ------------------------------------------- |
| **타입 안정성**       | TypeScript 선택적, 런타임 에러 위험         |
| **엔터프라이즈 부족** | NestJS 대비 기업용 라이브러리 부족          |
| **구조화 어려움**     | 아키텍처 패턴 강제 없음, 일관성 유지 어려움 |
| **중위 성능**         | ~18K RPS, NestJS(~15K) 대비 양호            |
| **콜백 복잡성**       | 비동기 패턴 관리 복잡 (async/await 개선됨)  |

**코드 예시**:

```typescript
// Express.js + TypeScript 예시
import express from 'express';
import { Server } from 'socket.io';
import amqp from 'amqplib';

const app = express();
app.use(express.json());

interface FileUploadDto {
    filename: string;
    fileType: 'dxf' | 'pdf';
}

interface JobResponse {
    jobId: string;
    status: string;
}

app.post('/api/files/upload', async (req, res) => {
    const { filename, fileType }: FileUploadDto = req.body;
    const jobId = crypto.randomUUID();

    // RabbitMQ로 메시지 발행
    const channel = await getChannel();
    channel.sendToQueue(
        'cad-queue',
        Buffer.from(JSON.stringify({ jobId, filename, fileType }))
    );

    const response: JobResponse = { jobId, status: 'PENDING' };
    res.json(response);
});

// Socket.io 실시간 동기화
const io = new Server(server);
io.on('connection', (socket) => {
    socket.on('subscribe', (kioskId: string) => {
        socket.join(`kiosk-${kioskId}`);
        socket.emit('subscribed', { status: 'ok' });
    });
});
```

---

### 6.5 비용 분석

| 항목              | FastAPI | NestJS  | Spring Boot | Express.js |
| ----------------- | ------- | ------- | ----------- | ---------- |
| **개발 인건비**   | 낮음    | 중간    | 높음        | 낮음       |
| **인프라 비용**   | ~$73/월 | ~$73/월 | ~$96/월     | ~$73/월    |
| **학습 비용**     | 1-2주   | 3-4주   | 6-8주       | 1-2주      |
| **유지보수 비용** | 낮음    | 중간    | 중간        | 낮음-중간  |

#### 6.5.1 인프라 비용 상세 (AWS us-east-1 기준)

**가정 조건**:

- 단일 t3.medium 인스턴스 (2vCPU, 4GB RAM) - Spring Boot는 t3.large 필요
- 키오스크 15대 WebSocket 연결
- 일일 API 요청 1,000건
- 스토리지 50GB, 월간 데이터 전송 100GB

| 비용 항목          | FastAPI | NestJS  | Spring Boot    | Express.js |
| ------------------ | ------- | ------- | -------------- | ---------- |
| **Compute (EC2)**  | $30     | $30     | $50 (t3.large) | $30        |
| **ALB**            | $16     | $16     | $16            | $16        |
| **RDS PostgreSQL** | $15     | $15     | $15            | $15        |
| **CloudWatch**     | $5      | $5      | $8             | $5         |
| **S3/MinIO**       | $2      | $2      | $2             | $2         |
| **데이터 전송**    | $5      | $5      | $5             | $5         |
| **합계 (월)**      | **$73** | **$73** | **$96**        | **$73**    |

#### 6.5.2 규모별 확장 비용 추정

| 키오스크 규모  | FastAPI | NestJS  | Spring Boot | Express.js |
| -------------- | ------- | ------- | ----------- | ---------- |
| **15대 (MVP)** | $73/월  | $73/월  | $96/월      | $73/월     |
| **50대**       | $120/월 | $120/월 | $160/월     | $130/월    |
| **100대**      | $185/월 | $185/월 | $310/월     | $210/월    |
| **200대+**     | $350/월 | $350/월 | $550/월     | $400/월    |

**100대 확장 시 구성**:

- 2× t3.medium (또는 Spring Boot: 2× t3.xlarge)
- Redis ElastiCache (WebSocket 상태 공유)
- RDS Multi-AZ (고가용성)
- ALB + Auto Scaling Group

> **비용 면책조항**: 위 비용은 AWS 2024년 기준 추정치이며, 리전, 할인 옵션(Reserved/Savings Plan),
> 실제 트래픽 패턴에 따라 크게 달라질 수 있습니다. 정확한 비용은 AWS Pricing Calculator를 참조하세요.

#### 6.5.3 학습 비용 근거

| 프레임워크  | 학습 기간 | 학습 항목                                     |
| ----------- | --------- | --------------------------------------------- |
| FastAPI     | 1-2주     | Python 타입힌트, async/await, Pydantic 기본   |
| NestJS      | 3-4주     | DI 패턴, 데코레이터, RxJS (선택), 모듈 시스템 |
| Spring Boot | 6-8주     | Bean 라이프사이클, AOP, JPA, Spring Security  |
| Express.js  | 1-2주     | 미들웨어 패턴, 라우팅, 에러 핸들링            |

> **가정**: 2년 이상 백엔드 경험자, 해당 프레임워크 첫 사용 기준

---

### 6.6 MSA 서비스 경계 정의

향후 MSA 전환 시 서비스 분리 청사진을 정의합니다. 키오스크 30대 이상 확장 시점에 참고합니다.

#### 6.6.1 서비스 분해 Blueprint

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          MSA SERVICE BOUNDARIES                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐              │
│  │  Upload Service │  │ Conversion Svc  │  │  Status Service │              │
│  │ (파일 업로드)   │  │ (변환 오케스트) │  │  (상태 조회)    │              │
│  ├─────────────────┤  ├─────────────────┤  ├─────────────────┤              │
│  │ POST /files     │  │ Job 생성/관리   │  │ GET /status     │              │
│  │ 파일 검증       │  │ Queue 발행     │  │ WebSocket 관리  │              │
│  │ S3/MinIO 저장   │  │ 결과 수집      │  │ 이벤트 브로드캐스트│            │
│  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘              │
│           │                    │                    │                        │
│           ▼                    ▼                    ▼                        │
│  ┌─────────────────────────────────────────────────────────────┐            │
│  │                    Shared Infrastructure                     │            │
│  │  PostgreSQL (jobs, files) │ RabbitMQ │ Redis (WebSocket)    │            │
│  └─────────────────────────────────────────────────────────────┘            │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### 6.6.2 서비스별 데이터 소유권

| 서비스             | 소유 데이터          | 데이터베이스 테이블               |
| ------------------ | -------------------- | --------------------------------- |
| **Upload Service** | 파일 메타데이터      | `files`, `file_chunks`            |
| **Conversion Svc** | 변환 작업 정보       | `jobs`, `job_results`, `outbox`   |
| **Status Service** | 연결 상태, 알림 이력 | `ws_connections`, `notifications` |

#### 6.6.3 서비스 간 통신 패턴

| 통신 유형          | 패턴            | 사용 사례                       |
| ------------------ | --------------- | ------------------------------- |
| **동기 (Sync)**    | REST API 호출   | 파일 메타데이터 조회, 상태 확인 |
| **비동기 (Async)** | RabbitMQ 이벤트 | 변환 요청, 완료 알림            |
| **실시간**         | WebSocket Push  | 클라이언트 상태 업데이트        |

**이벤트 흐름 예시**:

```
Upload Service ──[file.uploaded]──▶ Conversion Service
                                          │
                                   [job.created]
                                          │
                                          ▼
                                    RabbitMQ Queue
                                          │
                                   [job.completed]
                                          │
                                          ▼
                              Status Service ──[WebSocket Push]──▶ Frontend
```

#### 6.6.4 모놀리식 → MSA 전환 전략

**Phase 1: 모듈 분리 (현재 → 키오스크 30대)**

- 단일 FastAPI 앱 내 모듈 경계 명확화
- Router 단위로 논리적 서비스 분리
- 공통 의존성 추출 (DB, Queue 클라이언트)

**Phase 2: 서비스 추출 (키오스크 30대 → 100대)**

- Upload Service 먼저 분리 (독립 배포 단위)
- API Gateway 도입 (Kong, AWS API Gateway)
- 서비스 디스커버리 설정 (Consul, AWS Cloud Map)

**Phase 3: 완전 분리 (키오스크 100대+)**

- 모든 서비스 독립 배포
- 서비스별 데이터베이스 분리 (필요 시)
- Circuit Breaker 패턴 적용 (Resilience4j, Hystrix)

> **MSA 전환 기준**: 팀 규모 5명 이상, 배포 빈도 주 2회 이상, 서비스별 독립 확장 필요 시

---

## 7. 전문가 분석 종합

### 평가 결과 매트릭스

| 기준 (가중치)         | FastAPI        | NestJS         | Spring Boot    | Express.js   |
| --------------------- | -------------- | -------------- | -------------- | ------------ |
| 개발 속도 (25%)       | ⭐⭐⭐⭐⭐ (5) | ⭐⭐⭐⭐ (4)   | ⭐⭐⭐ (3)     | ⭐⭐⭐⭐ (4) |
| 통합 복잡도 (20%)     | ⭐⭐⭐⭐ (4)   | ⭐⭐⭐⭐ (4)   | ⭐⭐ (2)       | ⭐⭐⭐ (3)   |
| MSA 전환 용이성 (20%) | ⭐⭐⭐⭐ (4)   | ⭐⭐⭐⭐⭐ (5) | ⭐⭐⭐⭐⭐ (5) | ⭐⭐⭐⭐ (4) |
| 운영 복잡도 (20%)     | ⭐⭐⭐⭐⭐ (5) | ⭐⭐⭐⭐ (4)   | ⭐⭐⭐ (3)     | ⭐⭐⭐⭐ (4) |
| 키오스크 확장성 (15%) | ⭐⭐⭐⭐ (4)   | ⭐⭐⭐⭐⭐ (5) | ⭐⭐⭐⭐⭐ (5) | ⭐⭐⭐⭐ (4) |
| **가중 총점**         | **4.45**       | **4.35**       | **3.50**       | **3.80**     |

> **가중 총점 계산**:
>
> - FastAPI: (5×0.25) + (4×0.20) + (4×0.20) + (5×0.20) + (4×0.15) = 1.25 + 0.80 + 0.80 + 1.00 + 0.60 = **4.45**
> - NestJS: (4×0.25) + (4×0.20) + (5×0.20) + (4×0.20) + (5×0.15) = 1.00 + 0.80 + 1.00 + 0.80 + 0.75 = **4.35**
> - Spring Boot: (3×0.25) + (2×0.20) + (5×0.20) + (3×0.20) + (5×0.15) = 0.75 + 0.40 + 1.00 + 0.60 + 0.75 = **3.50**
> - Express.js: (4×0.25) + (3×0.20) + (4×0.20) + (4×0.20) + (4×0.15) = 1.00 + 0.60 + 0.80 + 0.80 + 0.60 = **3.80**

### 분석 근거

각 평가 기준별 점수 부여 근거를 상세히 설명합니다.

**개발 속도 (25%)**:

| 프레임워크  | 점수 | 근거                                                           |
| ----------- | ---- | -------------------------------------------------------------- |
| FastAPI     | 5점  | 보일러플레이트 최소, Python 타입 힌트로 IDE 자동완성 우수      |
| NestJS      | 4점  | DI 패턴 학습 필요하나 프레임워크 구조 제공, 생산성 양호        |
| Spring Boot | 3점  | 많은 설정 코드, Bean 라이프사이클/AOP 이해 필요, 진입장벽 높음 |
| Express.js  | 4점  | 최소 보일러플레이트, 구조 자유도 높음, 빠른 프로토타이핑       |

**통합 복잡도 (20%)**:

| 프레임워크  | 점수 | 근거                                                              |
| ----------- | ---- | ----------------------------------------------------------------- |
| FastAPI     | 4점  | Worker와 Pydantic 공유(+), Frontend는 OpenAPI 코드 생성 필요(-)   |
| NestJS      | 4점  | Frontend와 TS 타입 직접 공유(+), Worker는 JSON 직렬화 필요(-)     |
| Spring Boot | 2점  | 3개 언어(Java-Python-TS) 모두 JSON 직렬화, 타입 공유 불가         |
| Express.js  | 3점  | TypeScript 선택적(±), Frontend 부분 공유 가능, Worker JSON 직렬화 |

**MSA 전환 용이성 (20%)**:

| 프레임워크  | 점수 | 근거                                                          |
| ----------- | ---- | ------------------------------------------------------------- |
| FastAPI     | 4점  | 모듈식 설계 가능, 점진적 분리 용이, 경량 컨테이너 적합        |
| NestJS      | 5점  | 모듈 시스템 네이티브, 서비스 분리 경계 명확, DI로 의존성 관리 |
| Spring Boot | 5점  | Spring Cloud 생태계, 이벤트 드리븐 아키텍처, 분산 트랜잭션    |
| Express.js  | 4점  | 구조 자유도 높지만 패턴 정의 필요, 서비스 분리는 가능         |

**운영 복잡도 (20%)**:

| 프레임워크  | 점수 | 근거                                                           |
| ----------- | ---- | -------------------------------------------------------------- |
| FastAPI     | 5점  | 단순 배포, Python 표준 도구, 로깅/모니터링 설정 간편           |
| NestJS      | 4점  | Node.js 배포 표준, Socket.io 관리 자동화, PM2/Docker 지원      |
| Spring Boot | 3점  | 메모리 사용량 높음 (~200MB), JVM 메트릭 이해 필요, 복잡한 설정 |
| Express.js  | 4점  | 경량, 표준 Node.js 배포, 단순한 운영 환경                      |

**키오스크 확장성 (15%)**:

| 프레임워크  | 점수 | 근거                                                        |
| ----------- | ---- | ----------------------------------------------------------- |
| FastAPI     | 4점  | WebSocket 수동 관리 필요, Redis Pub/Sub로 브로드캐스트 구현 |
| NestJS      | 5점  | Socket.io Room 기반 자동 관리, 100대+ 동시 연결 최적화      |
| Spring Boot | 5점  | WebSocket Gateway로 확장성 우수, 대규모 동시 연결 처리 최적 |
| Express.js  | 4점  | Socket.io 네이티브 지원, NestJS보다 자동화 수준 약간 낮음   |

### 분석 요약

**순위**: FastAPI (4.45) > NestJS (4.35) > Express.js (3.80) > Spring Boot (3.50)

**주요 인사이트**:

1. **FastAPI와 NestJS는 근소한 차이** (0.1점) - 팀 역량과 통합 방향이 결정 요소
2. **Spring Boot는 엔터프라이즈에 최적** - MSA, 키오스크 확장성 최고점, 초기 개발 비용 높음
3. **Express.js는 균형형** - 모든 지표 중간, 유연성 높지만 구조화 부족

> **Set 정의** ([ADR-001](./001_BACKEND_STACK.md) 참조):
>
> - **Set A (MVP)**: NestJS + Redis + MinIO - 소규모 팀, 빠른 개발, 키오스크 <50대
> - **Set B (Growth)**: FastAPI + RabbitMQ + MinIO/S3 - Python 통일, 확장 준비, 키오스크 15-100대
> - **Set C (Enterprise)**: Spring Boot + Kafka + S3 - 엔터프라이즈급 기능, 키오스크 100대+

**결정 요소별 권장**:

| 상황                              | 권장        | 이유                                |
| --------------------------------- | ----------- | ----------------------------------- |
| Python 팀, Worker 통합 중시       | FastAPI     | 언어 통일, Pydantic 공유            |
| TypeScript 팀, Frontend 통합 중시 | NestJS      | 타입 공유, Socket.io 편의성         |
| MVP 빠른 개발                     | FastAPI     | 보일러플레이트 최소, 학습 곡선 낮음 |
| 엔터프라이즈 패턴 필요            | Spring Boot | 트랜잭션, 보안, AOP 네이티브        |
| 경량 Node.js, 비용 절감           | Express.js  | 최소 메모리, 낮은 학습 곡선         |
| ADR-001 Set B 기준                | FastAPI     | Python 생태계 통일 권장             |
| ADR-001 Set C 기준                | Spring Boot | 엔터프라이즈 기능 완비              |

### 민감도 분석 (Sensitivity Analysis)

가중치 ±10% 변경 시 순위 변화를 분석합니다.

| 시나리오          | 변경 내용                  | FastAPI  | NestJS   | Spring Boot | Express.js | 순위 변화  |
| ----------------- | -------------------------- | -------- | -------- | ----------- | ---------- | ---------- |
| **기본**          | 현재 가중치                | **4.45** | 4.35     | 3.50        | 3.80       | 1→2→4→3    |
| **개발속도 중시** | 개발속도 35%, 키오스크 5%  | **4.55** | 4.25     | 3.30        | 3.90       | 변동 없음  |
| **확장성 중시**   | 키오스크 25%, 개발속도 15% | 4.35     | **4.45** | 3.70        | 3.70       | NestJS 1위 |
| **MSA 중시**      | MSA 30%, 통합복잡도 10%    | 4.35     | **4.55** | 3.80        | 3.80       | NestJS 1위 |
| **운영 중시**     | 운영복잡도 30%, MSA 10%    | **4.55** | 4.25     | 3.30        | 3.90       | 변동 없음  |

> **인사이트**: FastAPI와 NestJS는 대부분의 시나리오에서 1-2위를 유지합니다.
> 키오스크 확장성이나 MSA 전환을 최우선시할 경우에만 NestJS가 1위로 올라갑니다.

---

## 8. 권장 사항

### 8.1 의사결정 가이드

```
┌─────────────────────────────────────────────────────────────────┐
│  의사결정 흐름 (4개 프레임워크)                                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Q1: 팀의 주력 언어는?                                            │
│      ├─ Python ─────────────────▶ FastAPI 권장                   │
│      ├─ TypeScript ─────────────▶ Q2로                           │
│      ├─ Java ───────────────────▶ Spring Boot 검토               │
│      └─ JavaScript ─────────────▶ Express.js 검토                │
│                                                                  │
│  Q2: TypeScript 팀 - 더 중요한 통합은?                            │
│      ├─ Worker(Python) 통합 ────▶ FastAPI 권장                   │
│      └─ Frontend(React) 통합 ───▶ NestJS 권장                    │
│                                                                  │
│  Q3: 엔터프라이즈 기능 필수?                                       │
│      ├─ 예 (트랜잭션, 보안) ────▶ Spring Boot 권장               │
│      └─ 아니오 ─────────────────▶ Q1-Q2 결과 유지                │
│                                                                  │
│  Q4: 비용/리소스 제약이 심한가?                                    │
│      ├─ 예 (최소 인프라) ───────▶ Express.js 검토                │
│      └─ 아니오 ─────────────────▶ Q1-Q3 결과 유지                │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 8.2 Set별 권장

| ADR-001 Set            | API Layer 권장 | 이유                                     |
| ---------------------- | -------------- | ---------------------------------------- |
| **Set A (MVP)**        | NestJS         | Frontend 타입 공유, Socket.io 편의성     |
| **Set B (Growth)**     | FastAPI        | Python 생태계 통일, Worker Pydantic 공유 |
| **Set C (Enterprise)** | Spring Boot    | 엔터프라이즈 기능, 트랜잭션 관리, Kafka  |
| **비용 최적화**        | Express.js     | 경량, 빠른 개발, 낮은 인프라 비용        |

#### 팀 역량별 시나리오

**시나리오 1: TypeScript 중심 팀**

- 권장: **NestJS** (Set A)
- 근거: Frontend와 타입 직접 공유, Angular 스타일 아키텍처
- 학습 비용: 낮음 (TypeScript 경험 활용)
- 적합 규모: 2-5명 팀

**시나리오 2: Python 중심 팀**

- 권장: **FastAPI** (Set B)
- 근거: Pydantic 모델 Worker와 공유, Python 생태계 통일
- 학습 비용: 매우 낮음 (기존 Python 경험 활용)
- 적합 규모: 1-4명 팀

**시나리오 3: 엔터프라이즈 팀 (Java 경험)**

- 권장: **Spring Boot** (Set C)
- 근거: 기존 Spring/Java 경험 활용, 엔터프라이즈 패턴 숙지
- 학습 비용: 없음 (기존 경험 활용)
- 적합 규모: 5명+ 팀

**시나리오 4: 소규모 팀 (비용 절감 중시)**

- 권장: **Express.js** 또는 **FastAPI**
- 근거: 경량 인프라, 빠른 학습, 최소 운영 비용
- 학습 비용: 낮음
- 적합 규모: 1-2명 팀

### 8.3 구현 가이드

**FastAPI 선택 시 초기 설정**:

- FastAPI + Uvicorn + Pydantic
- RabbitMQ 연결 (pika)
- OpenAPI 코드 생성 설정

**NestJS 선택 시 초기 설정**:

- NestJS + @nestjs/websockets
- RabbitMQ 연결 (amqplib)
- Socket.io Adapter 설정

**Spring Boot 선택 시 초기 설정**:

- Spring Boot + Spring WebFlux/MVC
- Spring AMQP (RabbitMQ) 또는 Spring Kafka
- SpringDoc OpenAPI 설정
- Spring Security + JWT 구성

**Express.js 선택 시 초기 설정**:

- Express.js + TypeScript (선택)
- Socket.io 실시간 통신
- amqplib (RabbitMQ)
- swagger-jsdoc + swagger-ui-express

### 8.4 마이그레이션 경로

```
Phase 1 (MVP)        Phase 2 (Growth)        Phase 3 (Scale)
API 기본 구현   →   WebSocket 추가     →   MSA 전환 준비
      │                    │                      │
      ▼                    ▼                      ▼
 REST API 구축      실시간 동기화 구현      서비스 분리 설계
```

---

## 9. 결과

### 9.1 FastAPI 선택 시

**긍정적 결과**:

- Python 단일 언어로 백엔드 스택 통일
- Worker와 Pydantic 모델 공유 가능
- 자동 OpenAPI 문서화
- 낮은 학습 곡선, 빠른 MVP 개발

**부정적 결과**:

- Frontend TypeScript 타입 공유 불가 → OpenAPI 코드 생성으로 완화
- Socket.io 대비 WebSocket 관리 복잡 → Redis Pub/Sub 추가 필요

### 9.2 NestJS 선택 시

**긍정적 결과**:

- Frontend와 TypeScript 타입 직접 공유
- Socket.io Room 기반 간편한 실시간 구현
- 엔터프라이즈 패턴 (DI, Guard, Interceptor) 활용

**부정적 결과**:

- Worker(Python)와 별도 언어 → JSON 직렬화 오버헤드
- 학습 곡선 존재 (DI, 데코레이터 패턴)
- 보일러플레이트 코드 증가

### 9.3 Spring Boot 선택 시

**긍정적 결과**:

- 엔터프라이즈급 기능 네이티브 지원 (트랜잭션, 보안, AOP)
- Spring Cloud로 MSA 전환 용이
- 대규모 키오스크 확장에 최적화
- Kafka 네이티브 통합

**부정적 결과**:

- 높은 학습 곡선 → Java/Spring 경험자 필요
- 무거운 메모리 사용량 (~200MB) → 인프라 비용 증가
- Cold Start 느림 (~2초, Spring Native 시 <500ms) → 서버리스 시 GraalVM 검토 필요
- Python/TypeScript와 언어 분리

### 9.4 Express.js 선택 시

**긍정적 결과**:

- 낮은 학습 곡선, 빠른 프로토타이핑
- 경량 메모리 사용량 (~60MB)
- Socket.io 네이티브 통합
- 유연한 아키텍처 선택

**부정적 결과**:

- 구조화된 아키텍처 패턴 부재 → 대규모 팀 협업 어려움
- TypeScript 선택적 → 타입 안정성 보장 어려움
- 엔터프라이즈 라이브러리 부족
- 중위 성능 (~18K RPS, §5.2 벤치마크 기준)

### 9.5 리스크

| 리스크                | 확률 | 영향 | 대응                                 |
| --------------------- | ---- | ---- | ------------------------------------ |
| FastAPI 학습 부족     | 낮음 | 낮음 | Python 기본 지식으로 충분            |
| NestJS DI 복잡도      | 중간 | 중간 | 공식 문서, Angular 경험 활용         |
| Spring Boot 무거움    | 높음 | 중간 | 충분한 메모리 할당, 캐싱 전략        |
| Express.js 구조 부재  | 중간 | 높음 | 아키텍처 가이드라인 사전 정립        |
| WebSocket 스케일 이슈 | 중간 | 중간 | Redis Pub/Sub 또는 Socket.io Adapter |
| 타입 불일치 버그      | 중간 | 중간 | OpenAPI 코드 생성 자동화             |

---

## 10. 재검토 조건

다음 조건 발생 시 이 ADR을 재검토합니다:

- [ ] 팀 기술 스택 변경 (주력 언어 변경)
- [ ] 키오스크 100대 이상으로 확장 시
- [ ] 실시간 요구사항 변경 (지연 시간 <100ms 등)
- [ ] 마이크로서비스 전환 시점
- [ ] 6개월 정기 검토 (다음 검토: 2026-06-12)

---

## 11. 참조

### 관련 문서

| 문서                                                                           | 설명                   |
| ------------------------------------------------------------------------------ | ---------------------- |
| [001_BACKEND_STACK.md](./001_BACKEND_STACK.md)                                 | Backend 기술 스택 개요 |
| [003_QUEUE_ALTERNATIVES_COMPARISON.md](./003_QUEUE_ALTERNATIVES_COMPARISON.md) | RabbitMQ 선택 근거     |
| [004_PYTHON_WORKER_STACK.md](./004_PYTHON_WORKER_STACK.md)                     | Worker 기술 스택       |

### 외부 참조

- [FastAPI 공식 문서](https://fastapi.tiangolo.com/)
- [NestJS 공식 문서](https://docs.nestjs.com/)
- [Pydantic 문서](https://docs.pydantic.dev/)
- [Socket.io 문서](https://socket.io/docs/)

---

## 12. Changelog (변경 이력)

| 버전  | 날짜       | 변경 내용                                                                                                                                                                                                                                                                                                             |
| ----- | ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0.0.0 | 2025-12-12 | 초기 버전 - FastAPI vs NestJS vs Spring Boot vs Express.js 4개 프레임워크 비교 분석, 3차 전문가 검토 완료 (Backend 95점, System 95점, DevOps 94점 - 전원 승인), **FastAPI 최종 결정 (Approved)**, 12개 섹션 완비 (영역별 분석 11개, 대안별 분석 6개, 권장사항 4개), 트랜잭션 관리 패턴/로깅 표준화/보안 고려사항 포함 |
