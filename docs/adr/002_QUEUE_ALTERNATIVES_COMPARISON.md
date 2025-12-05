# ADR-002: Queue 대안 비교 분석

> **Version**: 0.0.3
> **Last Updated**: 2025-12-05

## 상태 및 의사결정 정보

**상태**: 초안 (Draft) | **작성일**: 2025-12-04

### 역할

| 역할       | 담당자      |
| ---------- | ----------- |
| **작성자** | Claude AI   |
| **검토자** | -           |
| **승인자** | -           |
| **결정일** | - (승인 시) |

### 의사결정 동인 (Decision Drivers)

| 유형         | 내용                                                                        |
| ------------ | --------------------------------------------------------------------------- |
| **기술적**   | Long-running task (DXF ~2초, PDF ~18초), 메시지 유실 방지 필요, 수평 확장성 |
| **비즈니스** | 키오스크 다수 배포, 동시 요청 처리 필요, 서비스 신뢰성 요구                 |
| **팀/조직**  | 2-3명 소규모 팀, 운영 복잡도 제한, Spring Boot + Python Worker 환경         |

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
9. [Consequences (결과)](#9-consequences-결과)
10. [Review Triggers (재검토 조건)](#10-review-triggers-재검토-조건)
11. [참조](#11-참조)

---

## 1. 핵심 질문

> **"왜 반드시 Queue여야 하는가? 다른 대안들은 왜 안 되는가?"**

### Executive Summary (1분 요약)

| 항목             | 내용                                                         |
| ---------------- | ------------------------------------------------------------ |
| **질문**         | 왜 Queue가 필요한가?                                         |
| **답변**         | 18초 PDF 처리에 HTTP 연결 유지 불가능, Worker 장애 격리 필수 |
| **권장**         | RabbitMQ (단계적: MVP는 DB Polling → 프로덕션은 RabbitMQ)    |
| **핵심 근거**    | 시간적 분리, 장애 격리, 수평 확장성                          |
| **트레이드오프** | 비용 증가 ($30-150/월) vs 신뢰성 확보                        |

### 권장안 (검토 중)

**RabbitMQ 기반 Message Queue 권장** (단계적 접근: MVP는 DB Polling → 프로덕션은 RabbitMQ)

| 방식              | 적합한 상황                  | 부적합한 상황               |
| ----------------- | ---------------------------- | --------------------------- |
| **Direct HTTP**   | < 1초 작업, 단일 Worker      | PDF 18초 처리, 동시 요청 多 |
| **DB Polling**    | MVP, 일일 작업 <100개        | 확장 필요, 실시간 처리      |
| **Redis Pub/Sub** | 알림, 로깅 (손실 허용)       | 파일 처리 (유실 불가)       |
| **RabbitMQ**      | Long-running, 확장 필요      | 단순 MVP                    |
| **Kafka**         | 10,000+ msg/sec, 이벤트 소싱 | 소규모 팀, 단순 작업 큐     |

---

## 2. 문서 범위

### 다루는 내용 (In Scope)

| 항목          | 설명                                         |
| ------------- | -------------------------------------------- |
| **대안 비교** | 6가지 Queue 대안 기술 비교 분석              |
| **선택 기준** | 가중치 기반 의사결정 프레임워크              |
| **구현 예시** | Spring Boot (Java) + Python Worker 샘플 코드 |
| **비용 분석** | AWS 기준 월간 운영 비용 추정                 |
| **장애 대응** | 장애 시나리오별 RTO/RPO 및 복구 전략         |
| **도입 전략** | 단계적 접근 (DB Polling → RabbitMQ)          |

### 다루지 않는 내용 (Out of Scope)

| 항목                             | 대안/참고                      |
| -------------------------------- | ------------------------------ |
| Queue 서버 설치/운영 가이드      | 공식 문서 참조                 |
| 모니터링 대시보드 구성           | 별도 운영 가이드 작성 예정     |
| TLS/인증 보안 설정               | 보안 가이드 문서 참조          |
| 성능 튜닝 상세                   | 부하 테스트 후 별도 문서화     |
| 마이그레이션 스크립트            | 구현 단계에서 작성             |
| 테스트 전략 (통합/부하)          | QA 가이드 문서 참조            |
| 클라우드 관리형 서비스 심층 분석 | 클라우드 전환 시 별도 ADR 작성 |

---

## 3. 프로젝트 컨텍스트

| 항목      | 값                            | 의미                  |
| --------- | ----------------------------- | --------------------- |
| 처리 시간 | DXF ~2초, PDF ~18초           | **Long-running task** |
| 파일 크기 | 최대 500MB                    | 대용량 처리 필요      |
| 환경      | 키오스크 다수 배포            | **동시 요청 발생**    |
| 팀 규모   | 2-3명                         | 운영 복잡도 제한      |
| Backend   | Spring Boot (Java)            | Spring 생태계 활용    |
| Worker    | Python (ezdxf, PyMuPDF, YOLO) | ML 파이프라인         |

### 제약사항

| 컴포넌트        | 제약             | 이유                                        |
| --------------- | ---------------- | ------------------------------------------- |
| **Backend**     | Spring Boot 필수 | 기존 기술 스택, 팀 역량                     |
| **Worker**      | Python 필수      | ML 라이브러리 (ezdxf, PyMuPDF, YOLO) 의존성 |
| **인프라 예산** | 월 $500 한도     | 초기 스타트업 예산 제약                     |
| **운영 인력**   | 2-3명            | 24/7 전담 DevOps 인력 없음                  |
| **파일 크기**   | 최대 500MB       | 대용량 CAD 파일 처리 요구사항               |
| **처리 시간**   | PDF ~18초        | Long-running task 지원 필수                 |

---

## 4. 평가 기준

**평가 점수 해석**:

- ⭐⭐⭐⭐⭐ (5점): 매우 우수, 프로덕션 권장
- ⭐⭐⭐⭐ (4점): 우수, 조건부 권장
- ⭐⭐⭐ (3점): 보통, 트레이드오프 존재
- ⭐⭐ (2점): 부족, 특수 상황만 고려
- ⭐ (1점): 매우 부족, 부적합

> **점수는 높을수록 좋음** (5점 > 1점)

### 4.1 아키텍처 관점

| 기준                            | 설명                                  | 가중치    |
| ------------------------------- | ------------------------------------- | --------- |
| **결합도 (Coupling)**           | 서비스 간 의존성 수준                 | 높음      |
| **장애 격리 (Fault Isolation)** | 한 컴포넌트 장애가 전체에 미치는 영향 | 높음      |
| **확장성 (Scalability)**        | Worker 수평 확장 용이성               | 높음      |
| **신뢰성 (Reliability)**        | 메시지 유실 방지 메커니즘             | 매우 높음 |

### 4.2 구현 관점

| 기준                   | 설명                           | 가중치 |
| ---------------------- | ------------------------------ | ------ |
| **구현 복잡도**        | Spring Boot에서 구현 난이도    | 중간   |
| **트랜잭션 처리**      | DB 저장과 메시지 발행의 원자성 | 높음   |
| **에러 처리**          | 재시도, DLQ, 타임아웃 처리     | 높음   |
| **Spring 생태계 지원** | 공식 스타터, 문서 품질         | 중간   |

### 4.3 운영 관점

| 기준              | 설명                       | 가중치 |
| ----------------- | -------------------------- | ------ |
| **인프라 비용**   | 서버, 메모리, 스토리지     | 중간   |
| **운영 복잡도**   | 설정, 모니터링, 장애 대응  | 높음   |
| **고가용성 (HA)** | 클러스터링, 복제, 페일오버 | 중간   |
| **모니터링**      | 메트릭, 로깅, 알림 설정    | 중간   |

---

## 5. 영역별 대안 분석

| #   | 대안                 | 설명                                | 대표 기술                      |
| --- | -------------------- | ----------------------------------- | ------------------------------ |
| 1   | **Direct HTTP**      | Backend → Worker REST API 직접 호출 | RestTemplate, WebClient        |
| 2   | **Database Polling** | DB를 Queue처럼 사용                 | PostgreSQL + SELECT FOR UPDATE |
| 3   | **Redis Pub/Sub**    | Redis 메시지 브로커 (휘발성)        | Spring Data Redis              |
| 4   | **Redis Streams**    | Redis 메시지 스트림 (지속성)        | Spring Data Redis              |
| 5   | **RabbitMQ**         | 전용 Message Queue                  | Spring AMQP                    |
| 6   | **Kafka**            | 이벤트 스트리밍 플랫폼              | Spring Kafka                   |
| 7   | **gRPC Streaming**   | 양방향 스트리밍 RPC                 | grpc-spring-boot-starter       |
| 8   | **Cloud-Native**     | 클라우드 관리형 서비스              | AWS SQS, Azure Service Bus     |

---

## 6. 대안별 상세 분석

### 6.1 Direct HTTP ❌ 부적합

#### 6.1.1 동기 방식 (Sync) - 응답 대기

```
사용자 → Backend → Worker (18초 대기) → 응답
              ↑
        HTTP Timeout (30초 기본)
        Thread Blocking
        연쇄 장애 위험
```

**치명적 문제**:

| 문제            | 영향                                   |
| --------------- | -------------------------------------- |
| HTTP 타임아웃   | 18초 처리 중 연결 끊김 위험            |
| Thread Blocking | Backend Worker Pool 고갈               |
| 연쇄 장애       | Worker 다운 → Backend 장애 전파        |
| 확장 어려움     | Load Balancer + Service Discovery 필요 |

#### 6.1.2 비동기 방식 (Async/Fire-and-Forget) - 응답 안 기다림

```java
// Spring WebClient 비동기 호출
webClient.post()
    .uri("http://worker:8000/process")
    .bodyValue(new ProcessRequest(jobId, filePath))
    .retrieve()
    .toBodilessEntity()
    .subscribe();  // Fire-and-Forget: 응답 안 기다림

return ResponseEntity.ok(new JobResponse(jobId, "PENDING"));
```

> **Q: "비동기면 Queue랑 같은거 아닌가요? 18초 안 기다리잖아요"**

**A: 아닙니다.** "18초 안 기다린다"는 것만 동일하고, 나머지는 전부 다릅니다:

| 관점                 | Direct HTTP Async                       | Queue (RabbitMQ)              |
| -------------------- | --------------------------------------- | ----------------------------- |
| 18초 대기            | ✅ 없음                                 | ✅ 없음                       |
| **메시지 전달 보장** | ❌ Worker 다운 시 유실                  | ✅ Publisher Confirms         |
| **메시지 저장**      | ❌ 없음 (메모리만)                      | ✅ 디스크 영구 저장           |
| **재시도**           | ❌ 수동 구현 (서버 재시작 시 상태 유실) | ✅ 자동 (DLQ 포함)            |
| **배압 제어**        | ❌ 100개 동시 요청 → Worker OOM         | ✅ 버퍼링 (수만 개 대기 가능) |
| **처리 중 장애**     | ❌ 유실 (재시도 없음)                   | ✅ ACK 없으면 자동 재전달     |
| **Load Balancing**   | ❌ 별도 구현 필요                       | ✅ 내장 (Round-Robin)         |
| **모니터링**         | ❌ 직접 구현                            | ✅ Management UI              |

**핵심 차이**: Queue는 단순한 "메시지 전달"이 아니라:

1. **저장소** - 메시지를 디스크에 영구 저장
2. **전달 보장** - ACK 메커니즘으로 수신 확인
3. **버퍼** - 급증 트래픽을 흡수 (Producer >> Consumer 속도 차이 해소)
4. **장애 복구** - 처리 중 장애 시 자동 재전달

Direct HTTP Async는 그냥 **"응답 안 기다리는 HTTP 요청"**일 뿐, 위 4가지가 **전부 없습니다**.

**장애 시나리오 비교**:

```
Direct HTTP Async:
Backend → HTTP POST → Worker (다운됨)
              ↓
      응답 안 기다림 (subscribe)
              ↓
      메시지 유실! Backend는 모름!

Queue 방식:
Backend → RabbitMQ (저장) → Worker (다운됨)
              ↓
      메시지 디스크 보존
              ↓
      Worker 복구 시 자동 재전달 ✅
```

**적합한 경우**: 처리 시간 <1초, 단일 Worker, 개발/테스트 환경, **메시지 유실 허용되는 작업 (로깅, 알림)**

---

### 6.2 Database Polling ⚠️ MVP용

```
사용자 → Backend → DB (INSERT job)
                    ↑
Worker ← (SELECT ... FOR UPDATE) ← 폴링
```

**장점**:

| 장점             | 설명                        |
| ---------------- | --------------------------- |
| 추가 인프라 없음 | 기존 PostgreSQL 활용        |
| 트랜잭션 보장    | DB 트랜잭션으로 원자성 확보 |
| 디버깅 용이      | SQL 쿼리로 상태 확인        |
| 비용 $0          | 추가 인프라 비용 없음       |

**단점**:

| 단점          | 설명                           |
| ------------- | ------------------------------ |
| 폴링 오버헤드 | 지속적인 SELECT 쿼리 부하      |
| 락 경합       | 다중 Worker 시 FOR UPDATE 경합 |
| 확장성 제한   | Worker↑ → DB 부하↑ (비선형)    |
| 지연 발생     | 폴링 주기만큼 처리 지연        |

**적합한 경우**: MVP, 일일 작업 <100개, 예산 제약

---

### 6.3 Redis Pub/Sub ❌ 메시지 손실 위험

```
Backend → Redis (PUBLISH) → Worker (SUBSCRIBE)
              ↓
         Fire-and-Forget
         메시지 손실 위험!
```

**치명적 문제**:

| 문제          | 영향                             |
| ------------- | -------------------------------- |
| 메시지 휘발성 | Worker 재시작 시 메시지 손실     |
| ACK 없음      | 처리 완료 확인 불가              |
| DLQ 없음      | 실패 작업 추적 불가              |
| 복구 불가     | 500MB 파일 유실 시 재업로드 필요 |

**적합한 경우**: 실시간 알림 (손실 허용), 로깅 (best-effort)

> **참고**: Redis Streams는 Redis Pub/Sub과 다른 기능으로, 지속성을 제공합니다. 아래 6.4에서 상세 분석합니다.

---

### 6.4 Redis Streams ⚠️ 조건부 적합

```
Backend → Redis (XADD) → Worker (XREADGROUP)
              ↓
         메시지 지속성 ✅
         Consumer Groups ✅
         ACK 메커니즘 ✅
```

**Redis Pub/Sub vs Redis Streams 비교**:

| 항목            | Redis Pub/Sub | Redis Streams      | RabbitMQ       |
| --------------- | ------------- | ------------------ | -------------- |
| 메시지 지속성   | ❌ 휘발성     | ✅ 디스크 저장     | ✅ 디스크 저장 |
| Consumer Groups | ❌ 없음       | ✅ 지원            | ✅ 지원        |
| ACK 메커니즘    | ❌ 없음       | ✅ XACK            | ✅ basic.ack   |
| 메시지 재처리   | ❌ 불가       | ✅ XPENDING/XCLAIM | ✅ DLQ         |
| 추가 인프라     | Redis만       | Redis만            | 별도 필요      |
| 성능            | 매우 빠름     | 빠름               | 중간           |
| Spring 지원     | ⭐⭐⭐⭐      | ⭐⭐⭐             | ⭐⭐⭐⭐⭐     |

**장점**:

| 장점            | 설명                                   |
| --------------- | -------------------------------------- |
| 기존 Redis 활용 | 캐시용 Redis가 있다면 추가 인프라 없음 |
| 간단한 설정     | RabbitMQ 대비 운영 복잡도 낮음         |
| 높은 성능       | RabbitMQ 대비 2-3배 빠른 처리 가능     |

**단점**:

| 단점             | 설명                                   |
| ---------------- | -------------------------------------- |
| DLQ 직접 구현    | 실패 메시지 처리 로직 필요             |
| Spring 지원 미흡 | `@StreamListener` 없음, 직접 구현 필요 |
| 메모리 제약      | 대량 메시지 시 Redis 메모리 부담       |

**적합한 경우**: 이미 Redis를 사용 중이고 RabbitMQ 추가 인프라 부담을 줄이고 싶을 때

**부적합한 이유 (현재 프로젝트)**: Spring AMQP의 성숙한 생태계와 DLQ 자동 처리가 필요하므로 RabbitMQ 권장

---

### 6.5 RabbitMQ ✅ 권장

```
Backend → RabbitMQ → Worker
           ↓           ↓
    메시지 지속성    ACK/NACK
    Dead Letter Q   자동 재시도
```

**핵심 강점**:

| 강점          | 설명                                     |
| ------------- | ---------------------------------------- |
| 메시지 내구성 | 디스크 저장, Broker 재시작 후 복구       |
| ACK 메커니즘  | 처리 완료 확인, 미확인 시 재전달         |
| DLQ           | 실패 작업 격리, 수동 재처리 가능         |
| Spring AMQP   | `@RabbitListener`로 간단한 Consumer 구현 |
| 모니터링      | 내장 Management UI, Prometheus 연동      |
| 적정 복잡도   | 기능 완성도 높으면서 운영 가능           |

**Spring Boot 설정 예시** (프로덕션 수준):

```yaml
spring:
    rabbitmq:
        host: ${RABBITMQ_HOST:localhost}
        port: ${RABBITMQ_PORT:5672}
        username: ${RABBITMQ_USER:guest}
        password: ${RABBITMQ_PASS:guest}
        # Publisher Confirms (메시지 발행 확인)
        publisher-confirm-type: correlated
        publisher-returns: true
        # Connection 설정
        connection-timeout: 5000
        # Listener 설정
        listener:
            simple:
                acknowledge-mode: manual # 수동 ACK (Long-running task)
                prefetch: 1 # Worker당 1개씩 처리
                default-requeue-rejected: false # 실패 시 DLQ로 이동
                retry:
                    enabled: true
                    max-attempts: 3
                    initial-interval: 2000 # 2초 후 첫 재시도
                    multiplier: 2.0 # 2초 → 4초 → 8초
                    max-interval: 30000 # 최대 30초
```

**설정값 근거**:

| 설정                              | 값           | 이유                                    |
| --------------------------------- | ------------ | --------------------------------------- |
| `prefetch: 1`                     | Worker당 1개 | PDF 처리 18초, 병렬 처리 시 메모리 부담 |
| `acknowledge-mode: manual`        | 수동 ACK     | Long-running task 완료 후 명시적 확인   |
| `max-attempts: 3`                 | 3회 재시도   | 일시적 오류 복구, 무한 재시도 방지      |
| `default-requeue-rejected: false` | DLQ 이동     | 실패 메시지 수동 분석 가능              |

**Java Config 예시** (DLQ 설정):

```java
@Configuration
public class RabbitMQConfig {

    @Bean
    public Queue fileQueue() {
        return QueueBuilder.durable("file_queue")
            .withArgument("x-dead-letter-exchange", "dlx")
            .withArgument("x-dead-letter-routing-key", "file_queue.dlq")
            .build();
    }

    @Bean
    public Queue deadLetterQueue() {
        return QueueBuilder.durable("file_queue.dlq").build();
    }

    @Bean
    public DirectExchange deadLetterExchange() {
        return new DirectExchange("dlx");
    }

    @Bean
    public Binding dlqBinding() {
        return BindingBuilder.bind(deadLetterQueue())
            .to(deadLetterExchange())
            .with("file_queue.dlq");
    }
}
```

#### Python Worker 호환성 ✅

**Pika 라이브러리** (공식 RabbitMQ Python 클라이언트)

| 항목               | 평가       | 설명                                 |
| ------------------ | ---------- | ------------------------------------ |
| 라이브러리 성숙도  | ⭐⭐⭐⭐⭐ | RabbitMQ 공식 지원, 10년+ 역사       |
| 문서 품질          | ⭐⭐⭐⭐   | 공식 튜토리얼, 예제 풍부             |
| ML 라이브러리 호환 | ⭐⭐⭐⭐⭐ | ezdxf, PyMuPDF, YOLO와 충돌 없음     |
| 비동기 지원        | ⭐⭐⭐⭐   | asyncio 지원 (pika.adapters.asyncio) |
| 설치 용이성        | ⭐⭐⭐⭐⭐ | `pip install pika`                   |

**Python Worker 코드 예시** (프로덕션 수준):

```python
import pika
import json
import logging
import signal
import sys
import os
from pika.exceptions import AMQPConnectionError

# 로깅 설정
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# 환경변수에서 설정 읽기
RABBITMQ_HOST = os.getenv('RABBITMQ_HOST', 'localhost')
RABBITMQ_PORT = int(os.getenv('RABBITMQ_PORT', 5672))
RABBITMQ_USER = os.getenv('RABBITMQ_USER', 'guest')
RABBITMQ_PASS = os.getenv('RABBITMQ_PASS', 'guest')
QUEUE_NAME = os.getenv('QUEUE_NAME', 'file_queue')

# Graceful Shutdown 플래그
shutdown_requested = False

def signal_handler(signum, frame):
    """SIGTERM/SIGINT 처리"""
    global shutdown_requested
    logger.info(f"Received signal {signum}, initiating graceful shutdown...")
    shutdown_requested = True

signal.signal(signal.SIGTERM, signal_handler)
signal.signal(signal.SIGINT, signal_handler)

def callback(ch, method, properties, body):
    """메시지 처리 콜백"""
    try:
        task = json.loads(body)
        job_id = task.get('job_id', 'unknown')
        file_path = task.get('file_path')

        logger.info(f"[{job_id}] Processing file: {file_path}")

        # 파일 존재 확인
        if not file_path or not os.path.exists(file_path):
            raise FileNotFoundError(f"File not found: {file_path}")

        # 파일 처리 로직 (ezdxf, PyMuPDF, YOLO 등)
        process_file(task)

        # 처리 완료 ACK
        ch.basic_ack(delivery_tag=method.delivery_tag)
        logger.info(f"[{job_id}] Processing completed successfully")

    except json.JSONDecodeError as e:
        logger.error(f"Invalid JSON message: {e}")
        ch.basic_nack(delivery_tag=method.delivery_tag, requeue=False)  # DLQ로 이동
    except FileNotFoundError as e:
        logger.error(f"File error: {e}")
        ch.basic_nack(delivery_tag=method.delivery_tag, requeue=False)
    except Exception as e:
        logger.exception(f"Unexpected error: {e}")
        ch.basic_nack(delivery_tag=method.delivery_tag, requeue=False)

def process_file(task):
    """실제 파일 처리 로직 (구현 필요)"""
    # ezdxf, PyMuPDF, YOLO 등 처리
    pass

def create_connection():
    """RabbitMQ 연결 생성 (재시도 로직 포함)"""
    credentials = pika.PlainCredentials(RABBITMQ_USER, RABBITMQ_PASS)
    parameters = pika.ConnectionParameters(
        host=RABBITMQ_HOST,
        port=RABBITMQ_PORT,
        credentials=credentials,
        heartbeat=600,
        blocked_connection_timeout=300
    )
    return pika.BlockingConnection(parameters)

def main():
    """메인 실행 루프"""
    while not shutdown_requested:
        try:
            logger.info("Connecting to RabbitMQ...")
            connection = create_connection()
            channel = connection.channel()

            # Queue 선언 (멱등성 보장)
            channel.queue_declare(queue=QUEUE_NAME, durable=True)

            # Worker당 1개씩 처리 (Long-running task)
            channel.basic_qos(prefetch_count=1)
            channel.basic_consume(queue=QUEUE_NAME, on_message_callback=callback)

            logger.info(f"Worker started. Waiting for messages on '{QUEUE_NAME}'...")

            while not shutdown_requested:
                connection.process_data_events(time_limit=1)

            logger.info("Graceful shutdown completed")
            connection.close()
            break

        except AMQPConnectionError as e:
            logger.error(f"Connection failed: {e}. Retrying in 5 seconds...")
            import time
            time.sleep(5)

if __name__ == '__main__':
    main()
```

**Python 라이브러리 비교**:

| 라이브러리   | 용도        | 장단점                                            |
| ------------ | ----------- | ------------------------------------------------- |
| **Pika**     | 범용        | 공식, 안정적, 블로킹/비동기 모두 지원             |
| **Celery**   | 태스크 큐   | 추상화 높음, RabbitMQ 외 백엔드도 지원, 설정 복잡 |
| **aio-pika** | 비동기 전용 | asyncio 네이티브, Pika 래퍼                       |

**권장**: Long-running 처리(18초)이므로 **Pika + BlockingConnection** (간단, 안정적, 디버깅 용이)

---

### 6.6 Kafka ⚠️ 과잉

```
Backend → Kafka (3+ Brokers + ZooKeeper) → Worker
                    ↓
            초당 수백만 메시지 처리 가능
            이벤트 소싱, 메시지 리플레이
            BUT: 2-3명 팀에 과도한 복잡도
```

**문제점**:

| 문제        | 설명                                  |
| ----------- | ------------------------------------- |
| 처리량 낭비 | 처리 시간(18초) >> 메시지 전달(<10ms) |
| 인프라 복잡 | ZooKeeper/KRaft + 3노드 클러스터      |
| 운영 부담   | 파티션 관리, 리밸런싱, ISR 모니터링   |
| 비용        | 월 $200-400 (RabbitMQ 대비 2-10배)    |

**적합한 경우**: 초당 10,000+ 메시지, 이벤트 소싱, 메시지 리플레이 필요

---

### 6.7 gRPC Streaming ❌ 큐 이점 없음

**문제점**:

| 문제             | 설명                                            |
| ---------------- | ----------------------------------------------- |
| 내장 Queue 없음  | 버퍼링/재시도 직접 구현 필요                    |
| 연결 상태 관리   | Long-lived connection 유지 복잡                 |
| Spring 지원 미흡 | 공식 스타터 없음, grpc-spring-boot-starter 사용 |
| 구현 복잡도      | ~280 lines (RabbitMQ ~90 lines 대비)            |

---

### 6.8 Cloud-Native 대안 (참고)

클라우드 환경 배포 시 고려할 관리형 서비스:

| 서비스                   | 장점                               | 단점                           | 비용             |
| ------------------------ | ---------------------------------- | ------------------------------ | ---------------- |
| **AWS SQS**              | 서버리스, 무제한 확장, 관리 불필요 | Vendor Lock-in, 로컬 개발 복잡 | $0.40/100만 요청 |
| **Azure Service Bus**    | Enterprise 기능, Spring JMS 통합   | 복잡한 가격 체계               | $0.05/100만 작업 |
| **Google Cloud Pub/Sub** | 글로벌 분산, exactly-once 보장     | 학습 곡선                      | $40/TiB          |

**현재 프로젝트 권장**: 온프레미스 배포 우선이므로 RabbitMQ 유지. 클라우드 마이그레이션 시 AWS SQS 검토.

---

## 7. 전문가 분석 종합

### 7.1 시스템 아키텍트 관점

| 대안          | 결합도     | 장애 격리  | 확장성     | 운영 복잡도 | 판정            |
| ------------- | ---------- | ---------- | ---------- | ----------- | --------------- |
| **RabbitMQ**  | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐      | ✅ **권장**     |
| Direct HTTP   | ⭐         | ⭐         | ⭐⭐       | ⭐⭐⭐⭐    | ❌ 부적합       |
| DB Polling    | ⭐⭐       | ⭐⭐       | ⭐         | ⭐⭐⭐⭐    | ⚠️ MVP만        |
| Redis Pub/Sub | ⭐⭐⭐⭐   | ⭐         | ⭐⭐⭐⭐   | ⭐⭐⭐⭐    | ❌ 메시지 손실  |
| Kafka         | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐        | ⚠️ 과잉         |
| gRPC          | ⭐⭐       | ⭐⭐       | ⭐⭐⭐     | ⭐⭐⭐      | ❌ 큐 이점 없음 |

**핵심 인사이트**:

> "10x 성장 시나리오(10→100 키오스크)에서 RabbitMQ만 자연스럽게 확장. Direct HTTP는 Thread Pool 고갈, DB Polling은 쿼리 폭증."

### 7.2 백엔드 아키텍트 관점

| 대안          | 구현 복잡도 | 트랜잭션 처리         | 에러 처리  | Spring 지원 | 판정             |
| ------------- | ----------- | --------------------- | ---------- | ----------- | ---------------- |
| **RabbitMQ**  | ⭐⭐⭐      | ✅ Publisher Confirms | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐  | ✅ **최적**      |
| Direct HTTP   | ⭐⭐        | ❌ 불가능             | ⭐⭐       | ⭐⭐⭐⭐⭐  | ❌ 타임아웃      |
| DB Polling    | ⭐⭐        | ✅ 완벽               | ⭐⭐⭐     | ⭐⭐⭐⭐⭐  | ⚠️ 조건부        |
| Redis Pub/Sub | ⭐⭐⭐      | ❌ 없음               | ⭐⭐       | ⭐⭐⭐⭐    | ❌ 트랜잭션 없음 |
| Kafka         | ⭐⭐⭐⭐    | ✅ Transactional      | ⭐⭐⭐⭐   | ⭐⭐⭐⭐⭐  | ⚠️ 과도함        |
| gRPC          | ⭐⭐⭐⭐⭐  | ❌ 복잡               | ⭐⭐       | ⭐⭐⭐      | ❌ 복잡          |

**핵심 인사이트**:

> "Spring AMQP Publisher Confirms로 메시지 브로커 도달 확인 가능. 단, DB 트랜잭션과 메시지 발행은 별개이므로 `@TransactionalEventListener(AFTER_COMMIT)` 또는 **Outbox Pattern**으로 순서 보장 필요."

### 7.3 DevOps 아키텍트 관점

| 대안          | 월간 비용 | 운영 복잡도 | 고가용성 | 모니터링 | 2-3명 팀 적합도 |
| ------------- | --------- | ----------- | -------- | -------- | --------------- |
| **RabbitMQ**  | $30-150   | 5.0/10      | 9/10     | 9/10     | ✅ 높음         |
| Direct HTTP   | $0        | 5.0/10      | 3/10     | 4/10     | ⚠️ 낮음         |
| DB Polling    | $0        | 4.5/10      | 7/10     | 6/10     | ✅ 높음         |
| Redis Pub/Sub | $20-40    | 5.3/10      | 4/10     | 5/10     | ⚠️ 중간         |
| Kafka         | $200-400  | 8.3/10      | 10/10    | 8/10     | ❌ 낮음         |

**비용 산정 근거 (AWS 기준)**:

| 대안              | 월간 비용 | 구성 상세                                                             |
| ----------------- | --------- | --------------------------------------------------------------------- |
| **RabbitMQ**      | $30-150   | t3.small ($30) ~ t3.medium ($60) + EBS 20GB ($2) + 데이터 전송 (변동) |
| **Kafka**         | $200-400  | m5.large 3노드 ($210) + EBS 150GB ($15) + ZooKeeper ($75)             |
| **DB Polling**    | $0        | 기존 PostgreSQL 활용 (추가 비용 없음)                                 |
| **Redis Pub/Sub** | $20-40    | ElastiCache t3.micro ($20) ~ t3.small ($40)                           |

_주: 온프레미스 배포 시 비용 구조 다름 (서버 구매 vs 운영비)_

**핵심 인사이트**:

> "2-3명 소규모 팀에는 단계적 접근 권장. MVP는 DB Polling으로 빠르게, 프로덕션은 RabbitMQ로 안정성 확보."

---

## 8. 권장 사항

### 8.1 왜 반드시 Queue여야 하는가?

#### 8.1.1 시간적 분리 (Temporal Decoupling)

```
Direct HTTP:
├─ Backend Thread: ████████████████████ 18초 Blocked ████████████████████
└─ 사용자 대기: 18초+ (타임아웃 위험)

Queue 기반:
├─ Backend Thread: ██ 0.01초 (메시지 발행)
├─ 즉시 job_id 반환
└─ Worker: 독립적으로 18초 처리
```

**결론**: 18초 처리에 HTTP 연결 유지는 불가능 → **Queue 필수**

#### 8.1.2 장애 격리 (Fault Isolation)

| 시나리오       | Direct HTTP                 | Queue 기반                |
| -------------- | --------------------------- | ------------------------- |
| Worker 다운    | Backend 타임아웃, 연쇄 장애 | 메시지 보존, Backend 정상 |
| Worker 재시작  | 처리 중 작업 유실           | 자동 재전달, 유실 없음    |
| 동시 요청 폭주 | Thread Pool 고갈            | Queue가 버퍼 역할         |

**결론**: Worker 장애가 Backend로 전파되면 안 됨 → **Queue 필수**

#### 8.1.3 확장성 (Scalability)

```
10개 키오스크 → 100개 키오스크 성장 시:

Direct HTTP:
├─ Backend Thread Pool 증설
├─ Load Balancer 설정
├─ Service Discovery 구현
└─ 복잡도: 높음

Queue 기반:
├─ Worker 인스턴스 추가
├─ Queue가 자동 분산
└─ 코드 변경: 없음
```

**결론**: 수평 확장이 코드 변경 없이 가능해야 함 → **Queue 필수**

#### 확장 시 병목점 분석 ⚠️

**Worker 추가만으로 해결되는 것**:

- ✅ 메시지 처리 속도 (RabbitMQ는 수만 msg/sec 지원)
- ✅ CPU-bound 작업 분산 (YOLO 모델 추론)

**Worker 추가로 해결되지 않는 것**:

- ❌ Network Bandwidth (500MB 파일 전송)
- ❌ RabbitMQ 단일 노드 용량 (클러스터 필요)
- ❌ PostgreSQL Connection Pool (max_connections 증설 필요)
- ❌ MinIO/S3 처리량 (분산 모드 필요)

**현실적인 확장 전략 (10 → 100 키오스크)**:

| 컴포넌트   | 10개 키오스크 | 100개 키오스크    | 변경 사항            |
| ---------- | ------------- | ----------------- | -------------------- |
| RabbitMQ   | 단일 노드     | 3노드 클러스터    | Quorum Queue 설정    |
| Worker     | 1-2대 서버    | 3-5대 분산        | Auto-scaling 설정    |
| PostgreSQL | max_conn: 100 | max_conn: 500     | Connection Pool 증설 |
| MinIO      | 단일 노드     | 분산 모드 (4노드) | 처리량 확장          |
| Network    | 1Gbps         | 10Gbps 업링크     | 대역폭 확장          |

#### 8.1.4 신뢰성 (Reliability)

| 메커니즘          | Redis Pub/Sub    | RabbitMQ          |
| ----------------- | ---------------- | ----------------- |
| 메시지 지속성     | ❌ 없음 (휘발성) | ✅ 디스크 저장    |
| ACK 메커니즘      | ❌ 없음          | ✅ 처리 완료 확인 |
| Dead Letter Queue | ❌ 없음          | ✅ 실패 작업 격리 |
| 재시도            | ❌ 수동 구현     | ✅ 자동 재전달    |

**결론**: 500MB 파일 처리 유실은 치명적 → **신뢰성 있는 Queue 필수**

#### 8.1.5 장애 시나리오 및 복구 전략

| 장애 유형              | 감지 방법          | 영향             | 복구 전략              | 복구시간 | 손실허용 |
| ---------------------- | ------------------ | ---------------- | ---------------------- | -------- | -------- |
| **RabbitMQ 노드 다운** | Health Check       | 메시지 발행 불가 | Quorum Queue 자동 전환 | <10초    | 0        |
| **Worker 서버 다운**   | Heartbeat 타임아웃 | 처리 지연        | 메시지 자동 재할당     | <30초    | 0        |
| **Network Partition**  | Cluster Status     | 메시지 중복 가능 | Idempotency + Fencing  | <1분     | 0        |
| **Disk Full**          | Disk Alarm         | 발행 차단        | Message TTL + 알람     | <5분     | 0        |
| **PostgreSQL 다운**    | Connection Failure | 상태 저장 불가   | DB Replication 전환    | <30초    | <1분     |
| **Slow Consumer**      | Queue Length       | 처리 지연 증가   | Auto-Scaling Worker    | <5분     | N/A      |

> **복구시간 (RTO)**: Recovery Time Objective - 장애 발생 후 서비스 복구까지 목표 시간
> **손실허용 (RPO)**: Recovery Point Objective - 허용 가능한 데이터 손실 시간

**DLQ 운영 절차**:

1. **모니터링**: RabbitMQ Management UI에서 DLQ 메시지 수 확인
2. **분석**: DLQ 메시지의 `x-death` 헤더로 실패 원인 파악
3. **재처리**: 문제 해결 후 DLQ → 원래 Queue로 이동 (Shovel Plugin)
4. **정리**: 복구 불가 메시지는 아카이빙 후 삭제 (최대 7일 보존)

### 8.2 의사결정 매트릭스

#### 가중치 선정 근거

| 기준            | 가중치 | 선정 이유                                            |
| --------------- | ------ | ---------------------------------------------------- |
| **신뢰성**      | 30%    | 500MB 파일 유실 시 재업로드 필요, 사용자 경험 치명적 |
| **확장성**      | 25%    | 10→100 키오스크 성장 계획 (2년 내)                   |
| **운영 복잡도** | 20%    | 2-3명 소규모 팀, 24/7 운영 인력 없음                 |
| **비용**        | 15%    | 초기 스타트업 예산 제약, 월 $500 한도                |
| **Spring 통합** | 10%    | 기존 Java 스택 활용, 학습 곡선 최소화                |

#### 평가 결과

| 기준          | 가중치 | RabbitMQ | DB Polling | Kafka    | Redis    | Direct HTTP |
| ------------- | ------ | -------- | ---------- | -------- | -------- | ----------- |
| 신뢰성        | 30%    | 9        | 7          | 10       | 6        | 2           |
| 확장성        | 25%    | 9        | 4          | 10       | 8        | 3           |
| 운영 복잡도   | 20%    | 6        | 8          | 3        | 7        | 9           |
| 비용          | 15%    | 7        | 10         | 4        | 8        | 10          |
| Spring 통합   | 10%    | 10       | 10         | 9        | 7        | 10          |
| **가중 평균** | 100%   | **8.20** | **7.20**   | **7.60** | **7.05** | **5.65**    |

**계산식**: (신뢰성×0.3) + (확장성×0.25) + (운영복잡도×0.2) + (비용×0.15) + (Spring통합×0.1)

**Direct HTTP 점수 근거**:
| 기준 | 점수 | 이유 |
|------|------|------|
| 신뢰성 | 2 | 메시지 유실 가능, ACK 없음, 재시도 없음, 처리 중 장애 시 복구 불가 |
| 확장성 | 3 | Load Balancer + Service Discovery 별도 구현 필요 |
| 운영 복잡도 | 9 | 추가 인프라 없음, WebClient만으로 구현 (가장 간단) |
| 비용 | 10 | $0 (추가 비용 없음) |
| Spring 통합 | 10 | WebClient 내장, 별도 의존성 불필요 |

> **결론**: Direct HTTP는 비용과 단순함에서 최고점이지만, **신뢰성(2점)과 확장성(3점)이 치명적으로 낮아** 500MB 파일 처리에는 **부적합**.

### 8.3 단계적 접근법 (권장)

```
┌─────────────────────────────────────────────────────────┐
│  Phase 1: Database Polling (MVP/검증)                   │
│  ├─ 추가 인프라: 없음                                    │
│  ├─ 구현 시간: 1-2일                                    │
│  ├─ 적합 조건: 일일 작업 <100개                         │
│  └─ 전환 신호: DB CPU >70%, 폴링 지연 불만              │
├─────────────────────────────────────────────────────────┤
│  Phase 2: RabbitMQ (프로덕션)                           │
│  ├─ 추가 인프라: RabbitMQ 단일/클러스터                 │
│  ├─ 마이그레이션: 1주                                   │
│  ├─ 적합 조건: 일일 작업 >100개, 동시성 증가            │
│  └─ ROI: 사용자 경험 + 운영 가시성                      │
└─────────────────────────────────────────────────────────┘
```

### 8.4 핵심 결론

> **"Long-running Task(>5초) + 동시 요청 + 신뢰성 요구 = Queue 필수"**

| 조건             | 현재 프로젝트    | Queue 필요성 |
| ---------------- | ---------------- | ------------ |
| 처리 시간 >5초   | ✅ PDF 18초      | **필수**     |
| 동시 요청 가능   | ✅ 키오스크 다수 | **필수**     |
| 메시지 유실 불가 | ✅ 500MB 파일    | **필수**     |
| 확장 계획        | ✅ 키오스크 증가 | **필수**     |

### 8.5 권장 아키텍처

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           권장 아키텍처                                   │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐              │
│  │   Frontend   │     │   Backend    │     │  RabbitMQ    │              │
│  │   (React)    │────▶│(Spring Boot) │────▶│              │              │
│  │              │     │              │     │  ┌────────┐  │              │
│  └──────────────┘     └───────┬──────┘     │  │  Queue │  │              │
│         │                     │            │  └────┬───┘  │              │
│         │                     │            │       │      │              │
│         │                     ▼            │  ┌────┴───┐  │              │
│         │             ┌──────────────┐     │  │  DLQ   │  │              │
│         │             │  PostgreSQL  │     │  └────────┘  │              │
│         │             │   (상태)     │     └──────┬───────┘              │
│         │             └──────────────┘            │                      │
│         │                     │                   │                      │
│         │             ┌───────┴──────┐            │                      │
│         └────────────▶│   MinIO/S3   │◀───────────┼──────────────────────│
│          (glTF 로드)  │   (파일)     │            │                      │
│                       └──────────────┘            ▼                      │
│                                           ┌──────────────┐               │
│                                           │    Worker    │               │
│                                           │   (Python)   │               │
│                                           └──────────────┘               │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 9. Consequences (결과)

### 9.1 긍정적 결과

| 결과            | 영향                                         | 측정 지표                    |
| --------------- | -------------------------------------------- | ---------------------------- |
| **장애 격리**   | Worker 장애가 Backend에 전파되지 않음        | Backend 가용률 99.9%+ 유지   |
| **수평 확장**   | Worker 인스턴스 추가만으로 처리량 증가       | 코드 변경 없이 10x 확장 가능 |
| **메시지 보존** | 서버 재시작 시에도 미처리 메시지 유지        | 데이터 유실률 0%             |
| **운영 가시성** | RabbitMQ Management UI로 Queue 상태 모니터링 | 실시간 처리량/지연 추적      |
| **재처리 용이** | DLQ로 실패 메시지 격리 후 재처리 가능        | 수동 개입 최소화             |

### 9.2 부정적 결과

| 결과                   | 영향                                 | 완화 방안                                |
| ---------------------- | ------------------------------------ | ---------------------------------------- |
| **인프라 복잡도 증가** | RabbitMQ 운영 지식 필요              | Docker 컨테이너 + CloudAMQP(관리형) 검토 |
| **월간 비용 발생**     | $30-150/월 (서버 + 모니터링)         | Phase 1 DB Polling으로 MVP 검증 후 전환  |
| **팀 학습 비용**       | AMQP 프로토콜, Spring AMQP 학습 필요 | 공식 튜토리얼 2-3일 학습 권장            |
| **디버깅 난이도**      | 비동기 메시지 추적 어려움            | Correlation ID + 중앙 로깅 (ELK)         |
| **트랜잭션 경계**      | DB-Queue 원자성 보장 복잡            | Outbox Pattern 또는 Saga 적용            |

### 9.3 리스크

| 리스크                   | 확률 | 영향 | 대응                                                      |
| ------------------------ | ---- | ---- | --------------------------------------------------------- |
| RabbitMQ 운영 미숙       | 중간 | 중간 | CloudAMQP(관리형) 또는 Docker 컨테이너화로 운영 부담 경감 |
| 메시지 폭주로 Queue 포화 | 낮음 | 높음 | Message TTL 설정, Disk Alarm 모니터링, Auto-scaling       |
| Worker 처리 지연 누적    | 중간 | 중간 | prefetch=1로 제한, 대기열 길이 알림, Worker 수평 확장     |
| DB-Queue 트랜잭션 불일치 | 낮음 | 높음 | Outbox Pattern 또는 @TransactionalEventListener 적용      |
| 네트워크 파티션          | 낮음 | 높음 | Quorum Queue + Idempotency Key로 중복 방지                |

### 9.4 수용 가능한 트레이드오프

```
┌─────────────────────────────────────────────────────────────┐
│  트레이드오프 분석                                            │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ⚖️ 비용 증가 ($30-150/월) vs 신뢰성 확보                     │
│     → 500MB 파일 1건 유실 = 사용자 재업로드 5분+             │
│     → 월 10건 유실 방지 = 50분 절약 → 비용 정당화            │
│                                                              │
│  ⚖️ 초기 복잡도 vs 장기 확장성                                │
│     → Phase 1 DB Polling으로 검증 후 전환 가능               │
│     → 전환 비용: ~1주 (추상화 레이어 설계 시 최소화)          │
│                                                              │
│  ⚖️ 학습 곡선 vs 표준 기술 습득                               │
│     → RabbitMQ/AMQP는 업계 표준, 이직 시에도 유용            │
│     → Spring AMQP는 풍부한 문서와 커뮤니티 지원              │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 10. Review Triggers (재검토 조건)

### 10.1 재검토가 필요한 상황

| 트리거               | 임계값                    | 재검토 대안        | 이유                         |
| -------------------- | ------------------------- | ------------------ | ---------------------------- |
| **처리량 급증**      | 일일 작업 1,000건 초과    | Kafka              | RabbitMQ 단일 노드 한계      |
| **이벤트 소싱 필요** | 메시지 리플레이 요구 발생 | Kafka              | 메시지 보존 기간 무제한 필요 |
| **팀 규모 확대**     | 개발자 10명 초과          | 운영 복잡도 재평가 | 전담 DevOps 인력 가용        |
| **비용 압박**        | 인프라 예산 20% 초과      | DB Polling 복귀    | 처리량이 낮은 경우           |
| **클라우드 전환**    | AWS/GCP 마이그레이션      | SQS/Pub/Sub        | 관리형 서비스 이점           |
| **실시간 요구**      | 지연 <100ms 필요          | Redis Streams      | 낮은 레이턴시 우선           |

### 10.2 정기 점검 주기

```
┌─────────────────────────────────────────────────────────────┐
│  ADR 재검토 일정                                             │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  📅 분기별 점검 (3개월마다)                                   │
│     ├─ Queue 처리량 추이 확인                                │
│     ├─ 장애 발생 빈도 및 원인 분석                           │
│     └─ 비용 대비 효과 평가                                   │
│                                                              │
│  📅 연간 점검 (12개월마다)                                   │
│     ├─ 기술 스택 최신 트렌드 반영                            │
│     ├─ 팀 역량 및 규모 변화 반영                             │
│     └─ 장기 로드맵과의 정합성 확인                           │
│                                                              │
│  📅 즉시 점검 트리거                                         │
│     ├─ 주요 장애 발생 (SLA 위반)                             │
│     ├─ 요구사항 대폭 변경                                    │
│     └─ 신규 기술 도입 검토                                   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 11. 참조

### 11.1 관련 문서

| 문서                                                                     | 설명              |
| ------------------------------------------------------------------------ | ----------------- |
| [FILE_UPLOAD_ARCHITECTURE.md](../fileUpload/FILE_UPLOAD_ARCHITECTURE.md) | 시스템 다이어그램 |
| [FILE_UPLOAD_CHECKLIST.md](../fileUpload/FILE_UPLOAD_CHECKLIST.md)       | 구현 항목 목록    |
| [GLOSSARY.md](../GLOSSARY.md)                                            | 용어 및 약어 정의 |

### 11.2 외부 참조

| 리소스                                                                                   | 설명                                |
| ---------------------------------------------------------------------------------------- | ----------------------------------- |
| [RabbitMQ 공식 문서](https://www.rabbitmq.com/docs)                                      | RabbitMQ 설치/운영 가이드           |
| [Spring AMQP Reference](https://docs.spring.io/spring-amqp/docs/current/reference/html/) | Spring Boot + RabbitMQ 통합         |
| [Pika Python Client](https://pika.readthedocs.io/)                                       | Python Worker용 RabbitMQ 클라이언트 |
| [CloudAMQP](https://www.cloudamqp.com/)                                                  | 관리형 RabbitMQ 서비스              |

---

## Changelog (변경 이력)

| 버전  | 날짜       | 변경 내용                                                                                                                                                                                                                                                                                                                                                                                                           |
| ----- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0.0.3 | 2025-12-05 | [0.0.2] 문서 구조 개선 - 관련 문서 섹션 하단 이동 및 테이블 형식 변환, 상태 목록 추가, 8.1 평가 결과에 Redis 열 추가, 문서 범위 섹션 추가; [0.0.3] ADR 템플릿 구조에 맞춘 전면 재편 - 상태 섹션 확장(역할/Decision Drivers), 섹션 순서 재정렬, 3장 제약사항 섹션 추가, 9장 리스크 테이블 추가, 5장 영역별 대안 테이블에 Redis Streams/Cloud-Native 추가, 테이블 헤더 한글화(HA→고가용성, RTO/RPO→복구시간/손실허용) |
| 0.0.1 | 2025-12-04 | 초기 버전: 6가지 대안 비교 분석, 전문가 검수 기반 개선, Direct HTTP Async 비교 추가, 용어집 GLOSSARY.md 통합                                                                                                                                                                                                                                                                                                        |
