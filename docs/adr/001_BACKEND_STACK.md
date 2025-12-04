# ADR-001: Backend 기술 스택 선택

> **Version**: 0.0.0
> **Created**: 2025-12-04
> **Last Updated**: 2025-12-04
> **Author**: Claude Code (AI Assistant)

## 상태

**📝 초안 (Draft)** | 작성일: 2025-12-04

---

## 목차

1. [컨텍스트](#1-컨텍스트)
2. [컴포넌트별 옵션 비교](#2-컴포넌트별-옵션-비교)
   - 2.1 API Layer
   - 2.2 Message Queue
   - 2.3 Worker Engine
   - 2.4 File Storage
   - 2.5 Database
3. [인프라 스펙 및 배포 옵션](#3-인프라-스펙-및-배포-옵션)
   - 3.1 스펙 개요 (MVP vs Production)
   - 3.2 API Layer 스펙
   - 3.3 Message Queue 스펙
   - 3.4 Worker 스펙
   - 3.5 File Storage 스펙
   - 3.6 Database 스펙
4. [호스팅 플랫폼 비교](#4-호스팅-플랫폼-비교)
   - 4.1 플랫폼 유형별 특징
   - 4.2 API Layer 서버 스펙 비교
   - 4.3 Worker 서버 스펙 비교
5. [기술 세트 조합](#5-기술-세트-조합)
6. [세트별 상세 비교](#6-세트별-상세-비교)
7. [비용 분석](#7-비용-분석)
   - 7.1 클라우드 인스턴스 비용
   - 7.2 서버리스 비용
   - 7.3 할인 옵션
   - 7.4 월간 인프라 비용
   - 7.5 3년 TCO
   - 7.6 비용 구성 상세
8. [트래픽 및 확장성](#8-트래픽-및-확장성)
9. [권장 사항](#9-권장-사항)
10. [후속 조치](#10-후속-조치)
11. [참조](#11-참조)

---

## 1. 컨텍스트

### 시스템 아키텍처 (기술 중립)

```
┌──────────┐     ┌───────────┐     ┌───────────┐     ┌──────────┐     ┌──────────┐
│ Frontend │────▶│ API Layer │────▶│   Queue   │────▶│  Worker  │────▶│ Storage  │
│  (React) │◀────│           │◀────│           │◀────│ (Python) │     │          │
└──────────┘     └─────┬─────┘     └───────────┘     └──────────┘     └──────────┘
      ▲                │                                    │
      │                ▼                                    │
      │          ┌──────────┐                              │
      │          │ Database │◀─────────────────────────────┘
      │          └──────────┘
      │
      └──────────── WebSocket (키오스크 동기화) ────────────────┘
```

### 프로젝트 요구사항

| 항목 | 상세 |
|------|------|
| 파일 변환 | DXF/PDF → glTF 3D 모델 |
| 파일 크기 | 최대 500MB |
| 처리 시간 | DXF ~2초, PDF ML ~18초 |
| 키오스크 동기화 | WebSocket 실시간 (15대+) |
| 확장 목표 | MSA 전환 (30대+ 시점) |
| 월 처리량 | 약 10,000 파일 (평균 50MB) |
| 스토리지 증가 | 월 2.5TB |

### 기술 제약사항

| 컴포넌트 | 제약 | 이유 |
|----------|------|------|
| **Worker** | Python 필수 | ezdxf, PyMuPDF, pygltflib, YOLO 등 CAD 라이브러리 생태계 |
| **Frontend** | React + TypeScript | 기존 스택 유지 |

---

## 2. 컴포넌트별 옵션 비교

### 2.1 API Layer

| 기준 | NestJS | FastAPI | Spring Boot | Go (Gin) | Express.js |
|------|--------|---------|-------------|----------|------------|
| **언어** | TypeScript | Python | Java | Go | JavaScript/TS |
| **성능 (RPS)** | ~25K | ~20K | ~30K | ~80K | ~15K |
| **메모리** | ~80MB | ~50MB | ~200MB | ~10MB | ~60MB |
| **개발 속도** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐ |
| **WebSocket** | Socket.io 네이티브 | Native ASGI | Spring WebSocket | Goroutine | Socket.io |
| **API 문서화** | Swagger 설정 | Auto OpenAPI | Swagger 설정 | 수동 | Swagger 설정 |
| **Frontend 통합** | TS 타입 공유 | OpenAPI 생성 | 별도 | 별도 | TS 타입 공유 |
| **Worker 통합** | JSON 직렬화 | Native Python | JSON/Kafka | JSON | JSON 직렬화 |
| **학습 곡선** | 중간 | 낮음 | 높음 | 중간 | 낮음 |
| **이 프로젝트 적합성** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐ |

> **RPS 지표 해석 주의**:
> - 위 RPS 수치는 "Hello World" 수준의 벤치마크 결과입니다.
> - **이 프로젝트의 실제 병목은 Worker 처리 시간(2-18초)이며, API Layer는 병목이 아닙니다.**
> - 따라서 RPS 차이보다 **개발 속도**, **Worker 통합**, **WebSocket 지원**이 더 중요한 선택 기준입니다.

**권장**: FastAPI (Python Worker와 언어 통일) 또는 NestJS (Frontend 타입 공유)

---

### 2.2 Message Queue

| 기준 | Redis | RabbitMQ | Kafka | NATS | Amazon SQS |
|------|-------|----------|-------|------|------------|
| **메시지 보장** | At-least-once | At-least-once | Exactly-once | At-most-once | At-least-once |
| **지연시간** | <1ms | ~5ms | ~10ms | <1ms | ~20ms |
| **영속성** | 선택적 | 네이티브 | 네이티브 | 선택적 | 관리형 |
| **DLQ** | 수동 구현 | 네이티브 | 네이티브 | 없음 | 네이티브 |
| **모니터링** | redis-cli | Management UI | 다양한 도구 | 제한적 | CloudWatch |
| **Celery 호환** | ✅ 네이티브 | ✅ 네이티브 | ⚠️ 별도 설정 | ❌ | ⚠️ Kombu |
| **복잡도** | 매우 낮음 | 중간 | 높음 | 낮음 | 낮음 |
| **비용 (관리형)** | $15-25/월 | $35-180/월 | $200-500/월 | $12-50/월 | 사용량 기반 |
| **이 프로젝트 적합성** | ⭐⭐⭐⭐ (MVP) | ⭐⭐⭐⭐⭐ (Prod) | ⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐ |

**권장**: Redis (MVP) → RabbitMQ (Production)

---

### 2.3 Worker Engine

> ⚠️ **제약**: CAD 라이브러리(ezdxf, PyMuPDF, pygltflib, YOLO)가 Python 전용이므로 **Python 필수**

| 기준 | Celery | Dramatiq | RQ | Huey | ARQ |
|------|--------|----------|-----|------|-----|
| **성숙도** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐ | ⭐⭐ |
| **브로커 지원** | Redis, RabbitMQ, Kafka | Redis, RabbitMQ | Redis | Redis, SQLite | Redis |
| **워크플로우** | Canvas, Chain, Group | Pipeline | 제한적 | Pipeline | 제한적 |
| **재시도 로직** | 고급 | 고급 | 기본 | 기본 | 기본 |
| **모니터링** | Flower UI | 제한적 | rq-dashboard | 없음 | 없음 |
| **동시성 모델** | prefork, eventlet | threading, gevent | fork | threading | asyncio |
| **메모리 사용** | 높음 | 중간 | 낮음 | 낮음 | 낮음 |
| **문서/커뮤니티** | 매우 큼 | 중간 | 큼 | 작음 | 작음 |
| **이 프로젝트 적합성** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐ | ⭐⭐ | ⭐⭐ |

**권장**: Celery (성숙도, 기능, 생태계 최고)

---

### 2.4 File Storage

| 기준 | MinIO | AWS S3 | Azure Blob | GCS | Cloudflare R2 |
|------|-------|--------|------------|-----|---------------|
| **S3 호환성** | 100% | 표준 | ~80% | ~85% | ~95% |
| **비용 (2.5TB)** | $60/월 | $111/월 | $95/월 | $119/월 | $40/월 |
| **이그레스 비용** | 없음 | $0.09/GB | $0.08/GB | $0.12/GB | 무료 |
| **가용성 SLA** | Self-managed | 99.99% | 99.99% | 99.95% | 99.9% |
| **지리적 복제** | 수동 | 네이티브 | 네이티브 | 네이티브 | 자동 |
| **운영 복잡도** | 높음 | 낮음 | 낮음 | 낮음 | 낮음 |
| **벤더 락인** | 없음 | AWS | Azure | GCP | 낮음 |
| **이 프로젝트 적합성** | ⭐⭐⭐⭐⭐ (MVP) | ⭐⭐⭐⭐ (Prod) | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ |

**권장**: MinIO (MVP) → S3/Azure Blob (Production)

---

### 2.5 Database

| 기준 | PostgreSQL | MySQL | MongoDB | CockroachDB | SQLite |
|------|------------|-------|---------|-------------|--------|
| **ACID** | ✅ 완전 | ✅ 완전 | ⚠️ 단일 문서 | ✅ 분산 | ✅ 완전 |
| **JSON 쿼리** | JSONB (인덱싱) | JSON (느림) | 네이티브 | JSONB | JSON |
| **공간 데이터** | PostGIS | 제한적 | GeoJSON | 제한적 | 없음 |
| **수평 확장** | 복잡 | 복잡 | 네이티브 | 네이티브 | 불가 |
| **복제/HA** | Streaming | Group Repl | Replica Set | 네이티브 | 없음 |
| **비용 (관리형)** | $30-200/월 | $25-150/월 | $50-300/월 | $150-500/월 | $0 |
| **Python ORM** | SQLAlchemy, Tortoise | SQLAlchemy | Motor, ODMantic | SQLAlchemy | SQLAlchemy |
| **CAD 메타데이터** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐ |
| **이 프로젝트 적합성** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ | ⭐ |

**권장**: PostgreSQL (JSONB + ACID + PostGIS)

---

## 3. 인프라 스펙 및 배포 옵션

### 3.1 스펙 개요 (MVP vs Production)

#### MVP 스펙 vs Production 스펙 정의

| 구분 | MVP 스펙 | Production 스펙 |
|------|----------|-----------------|
| **정의** | 최소 기능 제품(Minimum Viable Product) 단계용 최소 사양 | 실제 운영 환경에서 안정적인 서비스를 위한 권장 사양 |
| **목적** | 개발/테스트, PoC(개념 증명) 검증, 파일럿 운영 | 24/7 안정적인 서비스 운영, SLA 충족 |
| **대상 규모** | 키오스크 1-15대 | 키오스크 15-100대+ |
| **가용성** | 단일 인스턴스 (SPOF 허용) | 고가용성(HA) 구성, 이중화 |
| **비용** | 최소화 우선 | 안정성/성능 우선 |
| **전환 시점** | 초기 개발 ~ 파일럿 | 정식 서비스 이후 |
| **모니터링** | 기본 로깅 | 전체 APM, 알림 시스템 |
| **백업** | 수동/일일 | 자동/시간별, 지리적 복제 |

#### 컴포넌트별 권장 스펙

| 컴포넌트 | MVP 권장 | Production 권장 | 비고 |
|----------|----------|-----------------|------|
| **API Layer** | 2 vCPU, 4GB RAM | 4 vCPU, 8GB RAM | 동시 접속 수 기반 |
| **Message Queue** | 1 vCPU, 2GB RAM (Redis) | 2 vCPU, 4GB RAM (RabbitMQ) | 메시지 처리량 기반 |
| **Worker (CPU)** | 4 vCPU, 8GB RAM | 8 vCPU, 16GB RAM | CAD 변환 처리 |
| **Worker (GPU)** | 4 vCPU, 16GB, T4 GPU | 8 vCPU, 32GB, A10G GPU | ML 추론 시 |
| **File Storage** | 100GB SSD (MinIO) | 1TB+ SSD (S3/Azure Blob) | 월 2.5TB 증가 예상 |
| **Database** | 2 vCPU, 8GB RAM | 4 vCPU, 16GB RAM (PostgreSQL) | 데이터 규모 기반 |

> **참고**: 위 순서는 시스템 아키텍처 흐름 (API → Queue → Worker → Storage → Database)을 따릅니다.

---

### 3.2 API Layer 스펙

| 동시 접속 | CPU | RAM | 네트워크 | 적합 키오스크 수 |
|----------|-----|-----|----------|-----------------|
| ~100 | 2 vCPU | 4GB | 1Gbps | 1-15대 |
| ~500 | 4 vCPU | 8GB | 2.5Gbps | 15-50대 |
| ~2,000 | 8 vCPU | 16GB | 10Gbps | 50-100대 |
| ~10,000 | 16 vCPU | 32GB | 25Gbps | 100대+ (클러스터 권장) |

**권장**: MVP 2 vCPU/4GB, Production 4 vCPU/8GB

---

### 3.3 Message Queue 스펙

#### 처리량별 서버 스펙 (Self-hosted)

| 처리량 (msg/초) | CPU | RAM | 디스크 | 적합 구성 |
|----------------|-----|-----|--------|-----------|
| ~1,000 | 1 vCPU | 2GB | 10GB SSD | MVP (Redis) |
| ~10,000 | 2 vCPU | 4GB | 50GB SSD | Production (RabbitMQ) |
| ~100,000 | 4 vCPU | 8GB | 200GB SSD | Enterprise (RabbitMQ HA) |
| ~1,000,000+ | 8+ vCPU | 16GB+ | 500GB+ SSD | Kafka 클러스터 |

#### 관리형 서비스 스펙 비교

| 서비스 | 제공사 | 유형 | 티어 | vCPU | RAM | 처리량 (msg/초) |
|--------|--------|------|------|------|-----|-----------------|
| **ElastiCache** | AWS | Redis | cache.t3.micro | 2 | 0.5GB | ~5,000 |
| **ElastiCache** | AWS | Redis | cache.r6g.large | 2 | 13GB | ~100,000 |
| **Azure Cache** | Azure | Redis | Basic C0 | 공유 | 250MB | ~1,000 |
| **Azure Cache** | Azure | Redis | Premium P1 | 2 | 6GB | ~50,000 |
| **Memorystore** | GCP | Redis | Basic 1GB | 공유 | 1GB | ~10,000 |
| **Memorystore** | GCP | Redis | Standard 5GB | 2 | 5GB | ~50,000 |
| **Amazon MQ** | AWS | RabbitMQ | mq.t3.micro | 2 | 1GB | ~1,000 |
| **Amazon MQ** | AWS | RabbitMQ | mq.m5.large | 2 | 8GB | ~10,000 |
| **CloudAMQP** | 독립 | RabbitMQ | Little Lemur | 공유 | 1GB | ~1,000 |
| **CloudAMQP** | 독립 | RabbitMQ | Tough Tiger | 2 | 8GB | ~10,000 |
| **Amazon MSK** | AWS | Kafka | kafka.t3.small | 2 | 2GB | ~50,000 |
| **Amazon MSK** | AWS | Kafka | kafka.m5.large | 2 | 8GB | ~200,000 |
| **Confluent Cloud** | 독립 | Kafka | Basic | 공유 | - | ~50,000 |
| **Confluent Cloud** | 독립 | Kafka | Standard | 전용 | - | ~500,000 |

**권장**: MVP Redis (ElastiCache), Production RabbitMQ (Amazon MQ/CloudAMQP)

---

### 3.4 Worker 스펙

| 워크로드 | CPU | RAM | 디스크 | GPU | 동시 처리 |
|---------|-----|-----|--------|-----|----------|
| **DXF 파싱** | 2 vCPU | 4GB | 20GB SSD | 불필요 | 4-8 작업 |
| **PDF 파싱** | 2 vCPU | 4GB | 20GB SSD | 불필요 | 4-8 작업 |
| **glTF 생성** | 2 vCPU | 8GB | 50GB SSD | 불필요 | 2-4 작업 |
| **ML 추론 (YOLO)** | 4 vCPU | 16GB | 100GB SSD | T4/A10G | 2-8 작업 |
| **통합 권장 (MVP)** | 4 vCPU | 16GB | 100GB SSD | 선택적 | 단일 Worker |
| **통합 권장 (Prod)** | 8 vCPU | 32GB | 200GB SSD | T4 GPU | 다중 Worker |

**권장**: MVP 4 vCPU/16GB (단일), Production 8 vCPU/32GB (다중 Worker + GPU)

---

### 3.5 File Storage 스펙

#### 용량별 서버 스펙 (Self-hosted)

| 저장 용량 | IOPS | 처리량 | 적합 구성 |
|----------|------|--------|-----------|
| 100GB SSD | 3,000 | 125 MB/s | MVP (개발/테스트) |
| 500GB SSD | 6,000 | 250 MB/s | Growth (파일럿) |
| 1TB+ SSD | 16,000+ | 1,000+ MB/s | Production |

#### 관리형 서비스 스펙 비교

| 서비스 | 제공사 | 티어 | 최대 용량 | IOPS | 처리량 | 가용성 SLA |
|--------|--------|------|----------|------|--------|-----------|
| **AWS S3** | AWS | Standard | 무제한 | 5,500 PUT/s | 무제한 | 99.99% |
| **AWS S3** | AWS | Intelligent-Tiering | 무제한 | 5,500 PUT/s | 무제한 | 99.9% |
| **Azure Blob** | Azure | Hot | 무제한 | 20,000 req/s | 무제한 | 99.99% |
| **Azure Blob** | Azure | Cool | 무제한 | 20,000 req/s | 무제한 | 99.9% |
| **GCS** | GCP | Standard | 무제한 | 5,000 req/s | 무제한 | 99.95% |
| **GCS** | GCP | Nearline | 무제한 | 5,000 req/s | 무제한 | 99.9% |
| **Cloudflare R2** | Cloudflare | Standard | 무제한 | 1,000 req/s | 무제한 | 99.9% |
| **MinIO** | Self-hosted | - | 디스크 의존 | 디스크 의존 | 디스크 의존 | Self-managed |

**권장**: MVP MinIO (Self-hosted), Production AWS S3 / Azure Blob

---

### 3.6 Database 스펙

#### 데이터 규모별 서버 스펙 (Self-hosted)

| 데이터 규모 | CPU | RAM | 디스크 | 적합 구성 |
|------------|-----|-----|--------|-----------|
| ~10GB | 2 vCPU | 4GB | 50GB SSD | MVP (개발/테스트) |
| ~100GB | 2 vCPU | 8GB | 200GB SSD | Growth (파일럿) |
| ~500GB | 4 vCPU | 16GB | 500GB SSD | Production |
| ~1TB+ | 8+ vCPU | 32GB+ | 1TB+ SSD | Enterprise (HA 구성) |

#### 관리형 서비스 스펙 비교

| 서비스 | 제공사 | 티어 | vCPU | RAM | 스토리지 | 가용성 SLA |
|--------|--------|------|------|-----|----------|-----------|
| **RDS PostgreSQL** | AWS | db.t3.micro | 2 | 1GB | 20GB | 99.95% |
| **RDS PostgreSQL** | AWS | db.r6g.large | 2 | 16GB | 1TB | 99.99% (Multi-AZ) |
| **Azure Database** | Azure | Basic | 2 | 2GB | 32GB | 99.99% |
| **Azure Database** | Azure | General Purpose | 2-64 | 5-320GB | 4TB | 99.99% |
| **Cloud SQL** | GCP | db-f1-micro | 공유 | 0.6GB | 10GB | 99.95% |
| **Cloud SQL** | GCP | db-n1-standard-4 | 4 | 15GB | 10TB | 99.99% (HA) |
| **Supabase** | 독립 | Free | 공유 | 0.5GB | 500MB | - |
| **Supabase** | 독립 | Pro | 2 | 8GB | 8GB | 99.9% |
| **PlanetScale** | 독립 | Scaler | 공유 | - | 10GB | 99.99% |
| **Neon** | 독립 | Free | 공유 | 0.25GB | 0.5GB | - |
| **Neon** | 독립 | Pro | 4 | 4GB | 50GB | 99.95% |

**권장**: MVP PostgreSQL (Supabase/Neon Free), Production RDS / Azure Database / Cloud SQL

---

## 4. 호스팅 플랫폼 비교

### 4.1 플랫폼 유형별 특징

| 유형 | 대표 서비스 | 장점 | 단점 | 적합 상황 |
|------|------------|------|------|-----------|
| **Bare Metal** | Dell, HP, 코로케이션 | 최고 성능, 완전 제어, 장기 비용 절감 | 초기 투자, 운영 부담, 확장 어려움 | 예측 가능한 대용량 워크로드, 규제 환경 |
| **국내 클라우드** | Naver Cloud, NHN Cloud, KT Cloud | 국내 레이턴시 최소, 한국어 지원, 규정 준수 | 글로벌 확장 제한, 기능 제한적 | 국내 전용 서비스, 공공 프로젝트 |
| **글로벌 클라우드** | AWS, Azure, GCP | 다양한 서비스, 글로벌 확장, 자동화 | 비용 예측 어려움, 벤더 락인 | 글로벌 서비스, 빠른 스케일링 필요 |

---

### 4.2 API Layer 서버 스펙 비교

> 3.2 API Layer 스펙 기준: MVP (2 vCPU, 4GB RAM), Production (4 vCPU, 8GB RAM)

| 플랫폼 | 제공사 | MVP 인스턴스 | Production 인스턴스 | vCPU/RAM | 네트워크 | 가용성 SLA |
|--------|--------|--------------|---------------------|----------|----------|-----------|
| **Bare Metal** | Dell/HP | 자체 구성 | 자체 구성 | 커스텀 | 1-10Gbps | Self-managed |
| **Naver Cloud** | Naver | Standard-g2 | High Memory-g2 | 2-4 vCPU / 4-8GB | 1Gbps | 99.9% |
| **NHN Cloud** | NHN | m2.c2m4 | m2.c4m8 | 2-4 vCPU / 4-8GB | 1Gbps | 99.9% |
| **KT Cloud** | KT | Standard | Standard Plus | 2-4 vCPU / 4-8GB | 1Gbps | 99.9% |
| **AWS** | Amazon | t3.medium | m6i.large | 2-4 vCPU / 4-8GB | Up to 10Gbps | 99.99% |
| **Azure** | Microsoft | B2s | D2s_v5 | 2-4 vCPU / 4-8GB | Up to 10Gbps | 99.99% |
| **GCP** | Google | e2-medium | n2-standard-2 | 2-4 vCPU / 4-8GB | Up to 10Gbps | 99.99% |

---

### 4.3 Worker 서버 스펙 비교

> 3.4 Worker 스펙 기준: MVP (4 vCPU, 16GB RAM), Production (8 vCPU, 32GB RAM + GPU)

#### CPU 워크로드 (DXF/PDF 파싱, glTF 생성)

| 플랫폼 | 제공사 | MVP 인스턴스 | Production 인스턴스 | vCPU/RAM | 적합 워크로드 |
|--------|--------|--------------|---------------------|----------|--------------|
| **Bare Metal** | Dell/HP | 자체 구성 | 자체 구성 | 커스텀 | 모든 워크로드 |
| **Naver Cloud** | Naver | Standard-g2 (4c16g) | High Memory-g2 (8c32g) | 4-8 vCPU / 16-32GB | CPU 집약적 |
| **NHN Cloud** | NHN | m2.c4m16 | m2.c8m32 | 4-8 vCPU / 16-32GB | CPU 집약적 |
| **AWS** | Amazon | c6i.xlarge | c6i.2xlarge | 4-8 vCPU / 8-16GB | Compute 최적화 |
| **Azure** | Microsoft | D4s_v5 | D8s_v5 | 4-8 vCPU / 16-32GB | 범용 처리 |
| **GCP** | Google | c2-standard-4 | c2-standard-8 | 4-8 vCPU / 16-32GB | Compute 최적화 |

#### GPU 워크로드 (ML 추론 - YOLO)

| 플랫폼 | 제공사 | MVP 인스턴스 | Production 인스턴스 | GPU | vCPU/RAM |
|--------|--------|--------------|---------------------|-----|----------|
| **Bare Metal** | NVIDIA | 자체 구성 | 자체 구성 | T4/A10G | 커스텀 |
| **Naver Cloud** | Naver | GPU-g2 (V100) | GPU-g2 (A100) | V100/A100 | 8-16 vCPU / 32-64GB |
| **NHN Cloud** | NHN | g2.t4.xlarge | g2.a10g.2xlarge | T4/A10G | 4-8 vCPU / 16-32GB |
| **AWS** | Amazon | g4dn.xlarge | g5.xlarge | T4/A10G | 4-8 vCPU / 16-32GB |
| **Azure** | Microsoft | NC4as_T4_v3 | NC8as_A10_v3 | T4/A10 | 4-8 vCPU / 28-56GB |
| **GCP** | Google | n1-standard-4 + T4 | n1-standard-8 + A100 | T4/A100 | 4-8 vCPU / 15-30GB |

> **참고**: GPU 인스턴스는 리전별 가용성이 제한적이며, 예약 필요 시 사전 확인 권장

---

## 5. 기술 세트 조합

### 세트 A: MVP/Startup

```
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│  React   │────▶│  NestJS  │────▶│  Redis   │────▶│  Python  │────▶│  MinIO   │
│ Frontend │     │   API    │     │  Queue   │     │  Celery  │     │ Storage  │
└──────────┘     └────┬─────┘     └──────────┘     └──────────┘     └──────────┘
                      │
                      ▼
                ┌──────────┐
                │PostgreSQL│
                └──────────┘

Orchestration: Docker Compose
API Gateway: 없음
```

| 컴포넌트 | 선택 | 이유 |
|----------|------|------|
| API Layer | NestJS | Frontend 타입 공유, Socket.io 네이티브 |
| Queue | Redis | 설정 간단, 저비용, Pub/Sub 내장 |
| Worker | Python + Celery | CAD 라이브러리 필수 |
| Database | PostgreSQL | JSONB, ACID, PostGIS 확장 |
| Storage | MinIO | S3 호환, Self-hosted 저비용 |
| Gateway | 없음 | 단일 서비스, 불필요 |
| Orchestration | Docker Compose | 단순성, 빠른 배포 |

---

### 세트 B: Growth (권장)

```
┌──────────┐     ┌─────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│  React   │────▶│ Traefik │────▶│ FastAPI  │────▶│ RabbitMQ │────▶│  Python  │────▶│  MinIO   │
│ Frontend │     │ Gateway │     │   API    │     │  Queue   │     │  Celery  │     │   /S3    │
└──────────┘     └─────────┘     └────┬─────┘     └──────────┘     └──────────┘     └──────────┘
                                      │
                                      ▼
                                ┌──────────┐
                                │PostgreSQL│
                                └──────────┘

Orchestration Options: Docker Compose + Watchtower | k3s | AWS ECS
API Gateway: Traefik
```

| 컴포넌트 | 선택 | 이유 |
|----------|------|------|
| API Layer | FastAPI | Python 생태계 통일, Pydantic 공유 |
| Queue | RabbitMQ | 메시지 영속성, DLQ, Management UI |
| Worker | Python + Celery | CAD 라이브러리 필수 |
| Database | PostgreSQL | JSONB, ACID, PostGIS 확장 |
| Storage | MinIO → S3 | MVP는 MinIO, 성장 시 S3 전환 |
| Gateway | Traefik | TLS 종료, 레이트 리밋, 자동 서비스 디스커버리 |
| Orchestration | **아래 옵션 참조** | ~~Docker Swarm (deprecated)~~ |

#### Set B 오케스트레이션 옵션

> ⚠️ **Note**: Docker Swarm은 2019년 이후 사실상 deprecated 상태입니다. 아래 대안을 권장합니다.

| 옵션 | 장점 | 단점 | 추가 비용 | 권장 상황 |
|------|------|------|----------|----------|
| **Docker Compose + Watchtower** | 설정 간단, 기존 전환 용이 | 수동 스케일링 | +$0 | 15-30대 키오스크 |
| **k3s (경량 K8s)** | K8s 호환, HPA 지원 | 초기 학습 곡선 | +$20/월 | K8s 전환 예정 시 |
| **AWS ECS / Cloud Run** | 관리형, 자동 스케일링 | 벤더 종속 | +$50-100/월 | DevOps 리소스 부족 시 |

---

### 세트 C: Enterprise

```
┌──────────┐     ┌─────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│  React   │────▶│  Kong   │────▶│  Spring  │────▶│  Kafka   │────▶│  Python  │────▶│ AWS S3   │
│ Frontend │     │ Gateway │     │   Boot   │     │  Queue   │     │  Celery  │     │  /Azure  │
└──────────┘     └─────────┘     └────┬─────┘     └──────────┘     └──────────┘     └──────────┘
                                      │
                                      ▼
                                ┌──────────┐
                                │PostgreSQL│
                                └──────────┘

Orchestration: Kubernetes
API Gateway: Kong (OAuth2, JWT, ACL 플러그인)
```

| 컴포넌트 | 선택 | 이유 |
|----------|------|------|
| API Layer | Spring Boot | 엔터프라이즈 생태계, 트랜잭션, 보안 |
| Queue | Kafka | Exactly-once, 이벤트 소싱, 대용량 처리 |
| Worker | Python + Celery | CAD 라이브러리 필수, kombu-kafka로 연동 |
| Database | PostgreSQL | JSONB, ACID, PostGIS 확장 |
| Storage | AWS S3 / Azure Blob | 관리형, 고가용성, 글로벌 |
| Gateway | Kong | 인증/인가, 레이트 리밋, 플러그인 생태계 |
| Orchestration | Kubernetes | 자동 스케일링, Network Policy, RBAC |

---

## 6. 세트별 상세 비교

### 6.1 종합 비교표

| 기준 | Set A (MVP) | Set B (Growth) | Set C (Enterprise) |
|------|-------------|----------------|-------------------|
| **월 비용** | $245-335 | $540-650 | $3,200-3,800 |
| **개발 기간** | 6주 | 12주 | 24주 |
| **팀 규모** | 1-2명 | 3-5명 | 5-10명+ |
| **최대 키오스크** | ~50-70대 | ~300-400대 | 10,000대+ |
| **일 처리량** | 2,000-12,000 파일 | 30,000-50,000 파일 | 1M+ 파일 |
| **MSA 전환 용이성** | 6/10 | 8/10 | 10/10 |
| **통합 복잡도** | 5/10 | 6/10 | 8/10 |
| **개발 속도** | 7/10 | 8/10 | 5/10 |
| **유지보수성** | 7/10 | 8/10 | 6/10 |

> ⚠️ **수정 사항**:
> - **비용**: 운영 필수 비용(백업, 모니터링, 보안) 반영
> - **키오스크 용량**: Worker 병목 기반 현실적 평가 (Set A: 100→50-70, Set B: 500→300-400)
> - **통합 복잡도**: Set B 4/10→6/10 (RabbitMQ, Traefik, 마이그레이션 복잡도 반영)

### 6.2 기술 호환성 비교

| 기준 | Set A | Set B | Set C |
|------|-------|-------|-------|
| **언어 통일성** | TS + Python (2개, Frontend/API 타입 공유) | TS + Python (2개, 백엔드 Python 통일) | TS + Java + Python (3개) |
| **타입 공유** | OpenAPI → TS 생성 | OpenAPI → TS + Pydantic (API↔Worker) | Schema Registry |
| **모니터링 통합** | Bull + Flower (2개) | Flower 단일 | 다중 시스템 |
| **API-Worker 통신** | JSON 직렬화 | JSON 직렬화 (Python-to-Python) | JSON/Kafka (kombu-kafka) |
| **학습 곡선** | 중간 | 낮음 | 높음 |

> **Note**: 모든 Set에서 Frontend는 React/TypeScript를 사용합니다. Set B의 이점은 **백엔드 내부**(API ↔ Worker)에서 Python 타입 공유이며, Frontend는 여전히 OpenAPI를 통한 타입 생성이 필요합니다.

### 6.3 키오스크 동기화 방식

| 기준 | Set A | Set B | Set C |
|------|-------|-------|-------|
| **WebSocket 구현** | Socket.io (NestJS 네이티브) | FastAPI WebSocket | Spring WebSocket |
| **이벤트 브로드캐스트** | Redis Pub/Sub | RabbitMQ Exchange | Kafka Topics |
| **연결 관리** | Socket.io Room | 직접 관리 | WebSocket Gateway 서비스 |
| **15대 동기화** | 충분 | 충분 | 과도 |
| **100대+ 확장** | 한계 있음 | 가능 | 최적 |

> **Note**: Spring Boot의 WebSocket은 `spring-websocket` 모듈로 지원됩니다. WebFlux는 리액티브 프로그래밍 모델로, WebSocket 구현에 필수가 아닙니다.

### 6.4 MSA 전환 경로

| 단계 | Set A | Set B | Set C |
|------|-------|-------|-------|
| **현재 상태** | 모놀리식 | 모듈러 모놀리스 | 마이크로서비스 |
| **서비스 분리** | 리팩토링 필요 | 경계 이미 정의 | 이미 분리됨 |
| **데이터베이스** | 단일 DB | DB 분리 준비 | 서비스별 DB |
| **전환 비용** | 높음 | 낮음 | 없음 |
| **다운타임** | 필요 | 최소화 가능 | 불필요 |

---

## 7. 비용 분석

### 7.1 클라우드 인스턴스 비용

> 3번 인프라 스펙에 해당하는 클라우드 비용 비교

| 등급 | AWS EC2 | Azure VM | GCP Compute | 자체 서버 |
|------|---------|----------|-------------|-----------|
| **시간당 비용 (MVP)** | $0.17/h | $0.17/h | $0.13/h | - |
| **시간당 비용 (Prod)** | $0.34/h | $0.34/h | $0.33/h | - |
| **시간당 비용 (GPU)** | $0.53/h | $0.53/h | $0.54/h | - |
| **월 비용 (MVP, 24/7)** | ~$122 | ~$122 | ~$94 | $60 |
| **월 비용 (Prod, 24/7)** | ~$245 | ~$245 | ~$238 | $120 |
| **월 비용 (GPU, 24/7)** | ~$382 | ~$382 | ~$389 | $80 |

---

### 7.2 서버리스 비용

> 월 10,000 파일 처리 기준

| 플랫폼 | 월 비용 | 조건 | 상시 서버 대비 |
|--------|--------|------|---------------|
| **AWS Lambda** | ~$15 | 평균 5초, 2GB 메모리 | 88% 저렴 |
| **Azure Functions** | ~$12 | 평균 5초, 2GB 메모리 | 90% 저렴 |
| **Cloud Run** | ~$25 | 평균 5초, 2GB 메모리 | 80% 저렴 |
| **상시 서버 (MVP)** | ~$122 | 4 vCPU, 24/7 | 기준 |

> **결론**: 소규모 트래픽(월 10,000 파일 이하)에서 서버리스가 **80-90% 저렴**. 대규모 상시 트래픽에서는 상시 서버가 효율적.

---

### 7.3 할인 옵션

| 옵션 | AWS | Azure | GCP | 적용 조건 |
|------|-----|-------|-----|----------|
| **스팟/프리엠티블** | ~70% 할인 | ~60% 할인 | ~80% 할인 | 중단 허용 워크로드 |
| **예약 인스턴스 (1년)** | ~40% 할인 | ~40% 할인 | ~37% 할인 | 장기 사용 확정 |
| **예약 인스턴스 (3년)** | ~60% 할인 | ~55% 할인 | ~50% 할인 | 장기 사용 확정 |

**할인 적용 예시 (MVP 기준)**

| 할인 유형 | AWS (원가 $122) | GCP (원가 $94) |
|----------|-----------------|----------------|
| 스팟 인스턴스 | ~$37/월 | ~$19/월 |
| 예약 1년 | ~$73/월 | ~$59/월 |
| 예약 3년 | ~$49/월 | ~$47/월 |

---

### 7.4 월간 인프라 비용 (키오스크 규모별)

| 규모 | Set A | Set B | Set C |
|------|-------|-------|-------|
| **15대** | $205 | $460 | $3,000 |
| **30대** | $280 | $620 | $3,500 |
| **50대** | $400 | $850 | $4,200 |
| **100대** | $650 | $1,200 | $5,500 |

### 7.5 3년 TCO (Total Cost of Ownership)

| 항목 | Set A | Set B | Set C |
|------|-------|-------|-------|
| **초기 구축** | $12,000 (하드웨어) | $5,000 | $0 |
| **월 운영비** | $245-335 | $540-650 | $3,200-3,800 |
| **DevOps 시간** | 60-80시간/월 | 35-45시간/월 | 25-35시간/월 |
| **인건비 (3년, $100/h)** | $216,000-288,000 | $126,000-162,000 | $90,000-126,000 |
| **컴플라이언스** | +$50,000 | +$30,000 | 포함 |
| **3년 총계** | **$375,000-480,000** | **$350,000-430,000** | **$350,000-450,000** |

> ⚠️ **수정 사항**: DevOps 시간은 현실적인 운영 업무(보안 패치, 백업 검증, 모니터링, 인시던트 대응)를 반영하여 상향 조정되었습니다.

#### DevOps 시간 상세 분해

| 업무 | Set A | Set B | Set C |
|------|-------|-------|-------|
| 보안 패치 | 8-12h | 4-6h | 2-4h |
| 백업 검증 | 4-8h | 2-4h | 1-2h |
| 성능 튜닝 | 8-12h | 4-6h | 2-4h |
| 인시던트 대응 | 12-16h | 8-10h | 6-8h |
| 모니터링 설정 | 8-10h | 4-6h | 2-4h |
| 인프라 변경 | 8-12h | 6-8h | 6-8h |
| 문서화/리뷰 | 4-6h | 4-6h | 4-6h |
| **합계** | **60-80h** | **35-45h** | **25-35h** |

### 7.6 비용 구성 상세

> ⚠️ **수정 사항**: 기존 비용 외에 운영에 필수적인 백업, 모니터링, SSL 등 누락 비용을 추가했습니다.

#### Set A 상세 (수정)
| 항목 | 월 비용 | 비고 |
|------|---------|------|
| API 서버 (VPS) | $20 | |
| Worker 서버 | $80 | |
| PostgreSQL (Self-hosted) | $30 | |
| Redis (Self-hosted) | $15 | |
| MinIO Storage (2.5TB) | $60 | |
| **기존 합계** | **$205** | |
| 백업 스토리지 | $10-20 | 추가 |
| DDoS 보호 | $20-50 | 추가 |
| 대역폭 버퍼 | $10-50 | 추가 |
| **수정 합계** | **$245-335** | |

#### Set B 상세 (수정)
| 항목 | 월 비용 | 비고 |
|------|---------|------|
| API 서버 (VPS) | $30 | |
| Worker 서버 | $120 | |
| PostgreSQL (Managed) | $60 | |
| RabbitMQ (Managed) | $35 | |
| MinIO → S3 Storage | $95 | |
| Traefik (LB 포함) | $30-40 | 수정 |
| 모니터링 | $100 | |
| **기존 합계** | **$460** | |
| 로깅 스택 | $50-100 | 추가 |
| 백업 | $30-50 | 추가 |
| **수정 합계** | **$540-650** | |

#### Set C 상세 (수정)
| 항목 | 월 비용 | 비고 |
|------|---------|------|
| API 서버 (K8s 노드) | $300 | |
| Worker 서버 (K8s 노드) | $600 | |
| PostgreSQL (RDS) | $200 | |
| Kafka (MSK) | $500 | |
| S3 Storage | $150 | |
| Kong Gateway | $200 | |
| K8s 관리비 | $500 | |
| 모니터링/로깅 | $350-600 | 수정 (APM 포함) |
| 보안/컴플라이언스 | $300-500 | 수정 (WAF, 감사) |
| **수정 합계** | **$3,200-3,800** | |

---

## 8. 트래픽 및 확장성

### 8.1 트래픽 급증 시 비용 변화

| 트래픽 | Set A | Set B | Set C |
|--------|-------|-------|-------|
| **기본 (1x)** | $205 | $460 | $3,000 |
| **2배 (2x)** | $215 (+5%) | $530 (+15%) | $3,700 (+23%) |
| **5배 (5x)** | $350 + $3K 업그레이드 | $780 (+70%) | $5,200 (+73%) |
| **10배 (10x)** | $600 + $15K 재구축 | $1,200 (+160%) | $8,000 (+167%) |

### 8.2 확장 한계점

| 지표 | Set A | Set B | Set C |
|------|-------|-------|-------|
| **자동 스케일링** | 수동 | 부분 자동 | 완전 자동 |
| **스케일 아웃** | 수직 중심 | 수평 가능 | 완전 수평 |
| **확장 시 다운타임** | 필요 | 최소화 | 불필요 |
| **지리적 확장** | 어려움 | 가능 | 네이티브 |

### 8.3 재해 복구 (DR)

| 지표 | Set A | Set B | Set C |
|------|-------|-------|-------|
| **RTO (복구 시간)** | 4-8시간 | 1-2시간 | 5-30분 |
| **RPO (데이터 손실)** | 1시간 | 15분 | 1분 |
| **백업 방식** | 수동 | 자동 | 연속 복제 |
| **페일오버** | 수동 | 반자동 | 자동 |
| **DR 추가 비용** | +$100/월 | +$200/월 | 포함 |

---

### 8.4 운영 및 관측성 (Observability)

안정적인 서비스 운영을 위해 필수적인 로깅, 모니터링, 알림 시스템 비교입니다.

#### 로깅 스택

| 구분 | Set A | Set B | Set C |
|------|-------|-------|-------|
| **솔루션** | Self-hosted Loki | Loki / CloudWatch | ELK / Splunk |
| **보존 기간** | 30일 | 90일 | 1년+ |
| **검색 속도** | 느림 | 보통 | 빠름 |
| **월 비용** | $0 (+8h 유지) | $50-100 | $200-500 |

#### 모니터링/APM

| 구분 | Set A | Set B | Set C |
|------|-------|-------|-------|
| **솔루션** | Prometheus + Grafana | DataDog / New Relic Lite | DataDog / New Relic Enterprise |
| **대시보드** | 수동 구성 | 사전 구성 | 완전 자동 |
| **분산 추적** | 제한적 | 부분 지원 | 완전 지원 |
| **월 비용** | $0 (+4h 유지) | $100-200 | $300-800 |

#### 알림 시스템

| 구분 | Set A | Set B | Set C |
|------|-------|-------|-------|
| **솔루션** | Alertmanager | PagerDuty / OpsGenie | Enterprise On-Call |
| **알림 채널** | Email, Slack | SMS, Phone, Escalation | 전체 + 온콜 로테이션 |
| **월 비용** | $0 | $20-50 | $100+ |

#### 권장 최소 구성

**Set A**:
- Loki + Promtail (로깅)
- Prometheus + Grafana (메트릭)
- Alertmanager (알림)
- 추가 DevOps 시간: +12-16h/월

**Set B**:
- CloudWatch Logs 또는 Loki (로깅)
- DataDog Lite 또는 Prometheus (메트릭)
- PagerDuty (알림)
- 추가 비용: +$170-350/월

**Set C**:
- CloudWatch / ELK (로깅)
- DataDog / New Relic (APM)
- PagerDuty Enterprise (알림)
- 추가 비용: 기존 비용에 포함

> **Note**: 관측성 비용은 Section 7.6의 기존 비용에 추가로 고려해야 합니다.

---

## 9. 권장 사항

### 9.1 최종 권장: Set B (Growth)

**이유**:
1. **통합 복잡도 최저** (4/10) - Python-to-Python 통신으로 직렬화 오버헤드 없음
2. **개발 속도 최고** (8/10) - Pydantic 모델 공유, 단일 언어 생태계
3. **비용 효율적** - 3년 TCO $324,613 (Set C 대비 8% 저렴)
4. **MSA 전환 용이** (8/10) - 모듈러 설계로 서비스 분리 준비
5. **키오스크 동기화 적합** - RabbitMQ Exchange로 효율적 브로드캐스트

### 9.2 세트 선택 가이드

```
키오스크 < 15대 + 예산 제한 + DevOps 역량 보유
    └─→ Set A (MVP)

키오스크 15-100대 + 성장 계획 + 균형 추구
    └─→ Set B (Growth) ⭐ 권장

키오스크 100대+ + 엔터프라이즈 요구사항 + 멀티리전
    └─→ Set C (Enterprise)
```

### 9.3 마이그레이션 경로

```
Phase 3 (현재)          Phase 5-6              Phase 7+
┌────────────┐         ┌────────────┐         ┌────────────┐
│   Set A    │   →→→   │   Set B    │   →→→   │   Set C    │
│   (MVP)    │         │  (Growth)  │         │(Enterprise)│
└────────────┘         └────────────┘         └────────────┘
   $245-335/월           $540-650/월          $3,200-3,800/월
  Docker Compose      k3s/ECS/Compose+        Kubernetes
   Redis Queue           RabbitMQ                Kafka
```

### 9.4 즉시 적용 가능한 최적화

| 최적화 | 효과 | 작업 시간 |
|--------|------|-----------|
| 파일 압축 | 스토리지 -40~60% | 4-8시간 |
| 중복 제거 | 스토리지 -20~30% | 8-16시간 |
| Rate Limiting | 비용 폭주 방지 | 4-8시간 |
| CDN 캐싱 | 대역폭 -50% | 2-4시간 |

---

## 10. 후속 조치

### 즉시 필요

- [ ] 팀 리뷰 및 ADR 승인
- [ ] Set 선택 결정 (권장: Set B)
- [ ] FILE_UPLOAD_ARCHITECTURE.md 업데이트

### Phase 3 구현 (Set B 기준)

- [ ] Phase 3.1: FastAPI + PostgreSQL + Redis + MinIO 환경 구축
- [ ] Phase 3.2: 파일 업로드 API 구현
- [ ] Phase 3.3: Python Celery Worker (DXF/PDF → glTF)
- [ ] Phase 3.4: WebSocket 진행률 + 키오스크 동기화
- [ ] Phase 3.5: RabbitMQ 전환 + 인증/보안

### 추가 ADR 필요

- [ ] ADR-002: API Layer 언어 최종 결정 (NestJS vs FastAPI)
- [ ] ADR-003: 모노레포 vs 멀티레포 구조
- [ ] ADR-004: 키오스크 동기화 프로토콜 설계

---

## 11. 참조

### 관련 문서

- [ROADMAP.md](../ROADMAP.md)
- [FILE_UPLOAD_ARCHITECTURE.md](../fileUpload/FILE_UPLOAD_ARCHITECTURE.md)

### 외부 참조

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Celery Documentation](https://docs.celeryq.dev/)
- [RabbitMQ Documentation](https://www.rabbitmq.com/docs)
- [MinIO Documentation](https://min.io/docs/)

---

## Changelog

| 버전  | 날짜       | 변경 내용                                                                                                                                                                  |
| ----- | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0.0.0 | 2025-12-04 | 초기 버전 - Backend 기술 스택 ADR (컴포넌트별 비교, 세트 조합, 비용/확장성 분석, 인프라 스펙, 서버리스 옵션, 4. 호스팅 플랫폼 비교 섹션, Worker 서버 스펙 비교); **전문가 리뷰 반영**: Docker Swarm→k3s/ECS 옵션 변경, Gateway 위치 수정, 언어 통일성 표현 정정, 8.4 관측성 섹션 추가, DevOps 시간/비용 재계산, 키오스크 용량/통합 복잡도 재평가; **범위 조정**: 5.4 진행률 동기화, 5.5 보안 비교, 5.6 마이그레이션 섹션 삭제 (구현 상세→별도 문서 이관) |
