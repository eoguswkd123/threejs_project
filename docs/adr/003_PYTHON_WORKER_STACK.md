# ADR-003: Python Worker 기술 스택

> **Version**: 0.0.0
> **Created**: 2025-12-04
> **Last Updated**: 2025-12-04
> **Author**: Claude Code (AI Assistant)

## 상태

**초안 (Draft)** | 날짜: 2025-12-04

> **관련 문서**
>
> - [ADR-001: Backend 기술 스택](./001_BACKEND_STACK.md)
> - [ADR-002: Queue 대안 비교 (RabbitMQ 확정)](./002_QUEUE_ALTERNATIVES_COMPARISON.md)
> - [파일 업로드 아키텍처](../fileUpload/FILE_UPLOAD_ARCHITECTURE.md)
> - [ROADMAP Phase 3](../ROADMAP.md)
> - [용어집](../GLOSSARY.md)

---

## 목차

1. [핵심 질문](#1-핵심-질문)
2. [프로젝트 컨텍스트](#2-프로젝트-컨텍스트)
3. [결정 영역별 분석](#3-결정-영역별-분석)
    - 3.1 Python 버전 선택
    - 3.2 Task Queue Framework
    - 3.3 핵심 라이브러리
    - 3.4 개발 환경 도구
    - 3.5 Worker 실행 모델
    - 3.6 Docker 컨테이너화
4. [권장 기술 스택 종합](#4-권장-기술-스택-종합)
5. [프로젝트 구조](#5-프로젝트-구조)
6. [설정 예시](#6-설정-예시)
7. [에러 처리 및 복원력](#7-에러-처리-및-복원력)
8. [모니터링 전략](#8-모니터링-전략)
9. [Consequences (결과)](#9-consequences-결과)
10. [Review Triggers (재검토 조건)](#10-review-triggers-재검토-조건)

---

## 1. 핵심 질문

> **"Python Worker를 어떻게 구성해야 안정적이고 확장 가능한 CAD 변환 시스템을 구축할 수 있는가?"**

### Executive Summary (1분 요약)

| 항목             | 내용                                                                         |
| ---------------- | ---------------------------------------------------------------------------- |
| **질문**         | Python Worker의 최적 기술 스택은?                                            |
| **답변**         | Python 3.11 + Celery + prefork pool + Worker 분리 (DXF/PDF)                  |
| **핵심 근거**    | 성능 (3.11 최대 60% 향상), 안정성 (prefork GIL 우회), 확장성 (독립 스케일링) |
| **트레이드오프** | 복잡도 증가 (2개 Worker 관리) vs 리소스 효율성 확보                          |

### 권장 기술 스택 (확정)

| 컴포넌트         | 선택    | 버전   | 선정 근거                                |
| ---------------- | ------- | ------ | ---------------------------------------- |
| **Python**       | 3.11    | 3.11.x | 10-60% 성능 향상, 안정적 ML 지원         |
| **Task Queue**   | Celery  | ^5.3.0 | 업계 표준, RabbitMQ 네이티브 지원        |
| **Worker Pool**  | prefork | -      | CPU-bound 작업, GIL 우회 필수            |
| **패키지 관리**  | uv      | latest | 10-100x 빠름, pip/poetry/pyenv 통합 대체 |
| **코드 품질**    | Ruff    | ^0.1.0 | 10-100x 빠름, 올인원 (linter+formatter)  |
| **Type Checker** | mypy    | ^1.8.0 | 프로덕션 안정성, 엄격한 타입 검사        |
| **테스트**       | pytest  | ^7.4.0 | 사실상 표준, pytest-celery 통합          |

---

## 2. 프로젝트 컨텍스트

### 시스템 아키텍처

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                           PYTHON WORKER SYSTEM                                │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  ┌─────────────┐      ┌─────────────┐      ┌─────────────────────────────┐   │
│  │  RabbitMQ   │      │  RabbitMQ   │      │        PYTHON WORKERS       │   │
│  │   Exchange  │─────▶│   Queues    │─────▶│                             │   │
│  │   (tasks)   │      │             │      │  ┌─────────┐  ┌─────────┐   │   │
│  └─────────────┘      │ dxf_queue   │      │  │   DXF   │  │   PDF   │   │   │
│                       │ pdf_queue   │      │  │ Worker  │  │ Worker  │   │   │
│                       │ dxf_dlq     │      │  │  (CPU)  │  │  (GPU)  │   │   │
│                       │ pdf_dlq     │      │  └────┬────┘  └────┬────┘   │   │
│                       └─────────────┘      │       │            │        │   │
│                                            └───────│────────────│────────┘   │
│                                                    │            │            │
│                                                    ▼            ▼            │
│                       ┌─────────────┐      ┌─────────────────────────────┐   │
│                       │ PostgreSQL  │◀─────│         MinIO / S3          │   │
│                       │  (상태)     │      │      (파일 저장소)          │   │
│                       └─────────────┘      └─────────────────────────────┘   │
│                                                                               │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Worker 역할 정의

| Worker         | 역할              | 처리 파이프라인                      | 예상 시간 |
| -------------- | ----------------- | ------------------------------------ | --------- |
| **DXF Worker** | 벡터 도면 변환    | DXF → ezdxf 파싱 → 2D→3D 압출 → glTF | ~2초      |
| **PDF Worker** | ML 기반 도면 분석 | PDF → PyMuPDF → OpenCV → YOLO → glTF | ~18초     |

### 성능 요구사항

| 항목          | 값                    | 비고                  |
| ------------- | --------------------- | --------------------- |
| 파일 크기     | 최대 500MB            | 대용량 건축 도면      |
| 동시 처리     | 10-50건               | 키오스크 다수 배포    |
| 처리 시간 SLA | DXF < 5초, PDF < 30초 | 사용자 대기 허용 범위 |
| 가용성        | 99.5%                 | 키오스크 서비스       |
| 메모리 사용   | Worker당 8-16GB       | ML 모델 로딩 고려     |

---

## 3. 결정 영역별 분석

### 3.1 Python 버전 선택

**평가 점수 해석**:

- ⭐⭐⭐⭐⭐ (5점): 매우 우수
- ⭐⭐⭐⭐ (4점): 우수
- ⭐⭐⭐ (3점): 보통
- ⭐⭐ (2점): 부족
- ⭐ (1점): 매우 부족

| 기준                  | Python 3.10                  | Python 3.11                  | Python 3.12                |
| --------------------- | ---------------------------- | ---------------------------- | -------------------------- |
| **성능**              | ⭐⭐⭐ 기준선                | ⭐⭐⭐⭐⭐ +10-60%           | ⭐⭐⭐⭐⭐ +5% (3.11 대비) |
| **라이브러리 호환성** | ⭐⭐⭐⭐⭐ 최고              | ⭐⭐⭐⭐⭐ 우수              | ⭐⭐⭐⭐ 대부분 호환       |
| **ML 생태계**         | ⭐⭐⭐⭐⭐ PyTorch 완전 지원 | ⭐⭐⭐⭐⭐ PyTorch 완전 지원 | ⭐⭐⭐⭐ 일부 제한         |
| **에러 메시지**       | ⭐⭐⭐ 기본                  | ⭐⭐⭐⭐⭐ 향상됨            | ⭐⭐⭐⭐⭐ 향상됨          |
| **Docker 이미지**     | ⭐⭐⭐⭐⭐ 안정적            | ⭐⭐⭐⭐⭐ 안정적            | ⭐⭐⭐⭐ 비교적 새로움     |
| **LTS 지원**          | 2026-10                      | 2027-10                      | 2028-10                    |
| **종합**              | 78점                         | **92점**                     | 85점                       |

> **📌 Python LTS 정책 참고**
>
> Python은 공식 "LTS" 용어를 사용하지 않지만, **모든 minor 버전이 동일하게 5년간 지원**됩니다.
>
> - **Full Support**: 1.5년 (3.13부터 2년) - 버그 수정 + 보안 패치
> - **Security Only**: 3.5년 (3.13부터 3년) - 보안 패치만
> - Spring Boot와 달리 LTS/non-LTS 구분 없이 **모든 버전 동일 대우**
> - 참고: [Python 버전 지원 정책](https://devguide.python.org/versions/)

#### 권장: Python 3.11

**선정 근거**:

1. **성능 향상**: CPython Faster CPython 프로젝트로 10-60% 성능 개선
    - 함수 호출 최적화
    - 적응형 인터프리터 (Adaptive Specializing Interpreter)
    - 메모리 사용량 감소

2. **향상된 에러 메시지**: 오류 위치 정확하게 표시

    ```python
    # Python 3.10
    TypeError: 'NoneType' object is not subscriptable

    # Python 3.11
    TypeError: 'NoneType' object is not subscriptable
        data["key"]
        ~~~~^^^^^^^
    ```

3. **ML 라이브러리 호환성**: PyTorch 2.x, TensorFlow 2.x, Ultralytics (YOLO) 완전 지원

4. **Exception Groups**: 여러 예외 동시 처리 (병렬 작업에 유용)
    ```python
    try:
        async with asyncio.TaskGroup() as tg:
            tg.create_task(process_dxf())
            tg.create_task(process_pdf())
    except* ValueError as eg:
        handle_value_errors(eg.exceptions)
    ```

---

### 3.2 Task Queue Framework

| 기준              | Celery                             | Dramatiq                  | RQ (Redis Queue)     |
| ----------------- | ---------------------------------- | ------------------------- | -------------------- |
| **RabbitMQ 지원** | ⭐⭐⭐⭐⭐ 네이티브                | ⭐⭐⭐⭐⭐ 네이티브       | ❌ Redis 전용        |
| **생태계**        | ⭐⭐⭐⭐⭐ 매우 풍부               | ⭐⭐⭐ 성장 중            | ⭐⭐⭐ 기본적        |
| **문서화**        | ⭐⭐⭐⭐⭐ 풍부                    | ⭐⭐⭐⭐ 양호             | ⭐⭐⭐ 기본          |
| **모니터링**      | ⭐⭐⭐⭐⭐ Flower                  | ⭐⭐⭐ 기본               | ⭐⭐⭐ rq-dashboard  |
| **재시도/DLQ**    | ⭐⭐⭐⭐⭐ 내장                    | ⭐⭐⭐⭐⭐ 내장           | ⭐⭐⭐ 기본          |
| **Worker Pool**   | ⭐⭐⭐⭐⭐ prefork/gevent/eventlet | ⭐⭐⭐⭐ gevent/threading | ⭐⭐⭐ fork          |
| **Spring 통합**   | ⭐⭐⭐⭐ AMQP 공유                 | ⭐⭐⭐⭐ AMQP 공유        | ❌ Redis 전용        |
| **학습 곡선**     | ⭐⭐⭐ 복잡                        | ⭐⭐⭐⭐ 단순             | ⭐⭐⭐⭐⭐ 매우 단순 |
| **커뮤니티**      | ⭐⭐⭐⭐⭐ 매우 활발               | ⭐⭐⭐ 활발               | ⭐⭐⭐ 활발          |
| **종합**          | **90점**                           | 80점                      | 65점                 |

#### 권장: Celery

**선정 근거**:

1. **RabbitMQ 네이티브 지원**: ADR-002에서 RabbitMQ 확정, AMQP 프로토콜 완벽 지원
2. **업계 표준**: 10년+ 역사, 풍부한 문서와 커뮤니티
3. **Flower 모니터링**: 실시간 Worker 상태, 작업 큐 모니터링 UI
4. **유연한 Worker Pool**: CPU-bound(prefork), I/O-bound(gevent) 선택 가능
5. **Spring Boot 호환**: Java Backend와 동일 RabbitMQ 인스턴스 공유

**Dramatiq 대안 고려 시점**:

- Celery의 복잡성이 문제가 될 때
- 더 단순한 API 선호 시
- 리소스 관리가 더 중요할 때

---

### 3.3 핵심 라이브러리

#### DXF 처리 라이브러리

| 라이브러리 | 성능       | 기능                     | 유지보수        | 선택    |
| ---------- | ---------- | ------------------------ | --------------- | ------- |
| **ezdxf**  | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ 전체 DXF 지원 | ⭐⭐⭐⭐⭐ 활발 | ✅ 권장 |
| dxfgrabber | ⭐⭐⭐⭐   | ⭐⭐⭐ 읽기 전용         | ⭐⭐ 중단됨     | ❌      |

**ezdxf 선정 근거**:

- DXF R12 ~ R2018 전체 버전 지원
- LINE, ARC, CIRCLE, POLYLINE, LWPOLYLINE 등 모든 엔티티 파싱
- 활발한 유지보수 (GitHub 4.7k+ stars)
- 벡터 변환에 최적화된 API

#### PDF 처리 라이브러리

| 라이브러리         | 성능       | CAD 도면 적합성           | 대용량 처리             | 선택    |
| ------------------ | ---------- | ------------------------- | ----------------------- | ------- |
| **PyMuPDF (fitz)** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ 벡터 추출 우수 | ⭐⭐⭐⭐⭐ 스트리밍     | ✅ 권장 |
| pdfplumber         | ⭐⭐⭐     | ⭐⭐⭐⭐ 표 추출 특화     | ⭐⭐⭐ 메모리 사용 높음 | ❌      |
| pypdf              | ⭐⭐⭐⭐   | ⭐⭐⭐ 텍스트 추출 특화   | ⭐⭐⭐⭐ 양호           | ❌      |

**PyMuPDF 선정 근거**:

- 고해상도 이미지 렌더링 (300+ DPI)
- 벡터 정보 직접 추출 가능
- 500MB 파일 스트리밍 처리
- C 기반으로 빠른 성능

#### 3D 출력 라이브러리

| 라이브러리    | glTF 지원                     | 사용 편의성 | 선택    |
| ------------- | ----------------------------- | ----------- | ------- |
| **pygltflib** | ⭐⭐⭐⭐⭐ glTF 2.0 완전 지원 | ⭐⭐⭐⭐    | ✅ 권장 |
| trimesh       | ⭐⭐⭐⭐ 변환 필요            | ⭐⭐⭐⭐⭐  | 대안    |

**pygltflib 선정 근거**:

- glTF 2.0 / glb 네이티브 지원
- Three.js 직접 로드 가능
- 머티리얼, 텍스처 지원

#### ML 추론 라이브러리

| 컴포넌트                   | 라이브러리                    | 용도           |
| -------------------------- | ----------------------------- | -------------- |
| **ML Framework**           | PyTorch ^2.1.0                | 딥러닝 기반    |
| **Object Detection**       | ultralytics (YOLOv8) ^8.0.0   | 도면 요소 탐지 |
| **Inference Acceleration** | onnxruntime ^1.16.0           | ONNX 모델 추론 |
| **Image Processing**       | opencv-python-headless ^4.9.0 | 전처리         |

---

### 3.4 개발 환경 도구

#### IDE / 코드 에디터

| 도구        | 타입        | Python 특화          | 메모리           | 시작 시간       | 가격   | 선택    |
| ----------- | ----------- | -------------------- | ---------------- | --------------- | ------ | ------- |
| **VS Code** | 에디터+확장 | ⭐⭐⭐⭐ 확장 필요   | ⭐⭐⭐⭐⭐ ~40MB | ⭐⭐⭐⭐⭐ 즉시 | 무료   | ✅ 권장 |
| PyCharm Pro | 전용 IDE    | ⭐⭐⭐⭐⭐ 즉시 사용 | ⭐⭐⭐ ~400MB    | ⭐⭐⭐ 3-5분    | $89/년 | 대안    |
| PyCharm CE  | 전용 IDE    | ⭐⭐⭐⭐⭐ 즉시 사용 | ⭐⭐⭐ ~400MB    | ⭐⭐⭐ 3-5분    | 무료   | 대안    |

**VS Code 선정 근거**:

- 가볍고 빠른 시작 (메모리 ~40MB, 즉시 시작)
- Python 확장 + Pylance로 PyCharm 수준 IntelliSense
- Ruff 확장으로 통합 린팅/포매팅
- Docker, Git, Remote SSH 통합 우수
- 무료 + 오픈소스

**PyCharm 고려 시점**:

- Django/Flask 전문 웹 개발 (Pro 버전)
- 대규모 Python 프로젝트 리팩토링
- 디버깅 및 프로파일링 집중 필요 시

---

#### 패키지 관리

| 도구                   | 속도               | 재현성     | Docker 호환 | 학습 곡선  | 선택                |
| ---------------------- | ------------------ | ---------- | ----------- | ---------- | ------------------- |
| **uv**                 | ⭐⭐⭐⭐⭐ 10-100x | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐  | ⭐⭐⭐⭐   | ✅ **권장**         |
| pip-tools              | ⭐⭐⭐⭐⭐         | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐  | ⭐⭐⭐⭐⭐ | 안정성 중시 시 대안 |
| Poetry                 | ⭐⭐⭐             | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐    | ⭐⭐⭐     | 대안                |
| pip + requirements.txt | ⭐⭐⭐⭐⭐         | ⭐⭐⭐     | ⭐⭐⭐⭐⭐  | ⭐⭐⭐⭐⭐ | ❌                  |

**uv 선정 근거** (2024년 2월 출시, [Astral](https://astral.sh)):

- Rust 기반으로 pip 대비 **10-100배 빠름**
- pip, pip-tools, pipx, poetry, pyenv, virtualenv **통합 대체**
- `uv venv` 생성 80배 빠름
- Ruff와 같은 Astral 팀 개발
- Docker 빌드 시간 대폭 단축

**uv 사용 예시**:

```bash
# uv 설치
curl -LsSf https://astral.sh/uv/install.sh | sh

# 가상환경 생성 (80x 빠름)
uv venv

# 의존성 설치 (10-100x 빠름)
uv pip install -r requirements.txt

# 프로젝트 관리 (poetry/pdm 대체)
uv init
uv add celery ezdxf PyMuPDF
uv sync
```

**pip-tools vs uv 선택 기준**:

- **uv**: 신규 프로젝트, 빠른 빌드 중시, 최신 도구 선호
- **pip-tools**: 기존 프로젝트, 안정성 중시, 보수적 환경

**pip-tools 사용 예시** (레거시/안정성 중시):

```bash
# requirements.in (추상적 의존성)
celery[rabbitmq]>=5.3.0
ezdxf>=1.3.0
PyMuPDF>=1.24.0

# 컴파일
pip-compile requirements.in -o requirements.txt

# 설치
pip install -r requirements.txt
```

#### 코드 품질 도구

| 도구                   | 속도               | 기능              | 설정 복잡도     | 선택    |
| ---------------------- | ------------------ | ----------------- | --------------- | ------- |
| **Ruff**               | ⭐⭐⭐⭐⭐ 10-100x | ⭐⭐⭐⭐⭐ 올인원 | ⭐⭐⭐⭐⭐ 단순 | ✅ 권장 |
| Black + Flake8 + isort | ⭐⭐⭐             | ⭐⭐⭐⭐⭐        | ⭐⭐⭐ 복잡     | 레거시  |

**Ruff 선정 근거**:

- Rust 기반으로 10-100배 빠름
- Linting + Formatting 통합
- Black, isort, Flake8 규칙 호환
- 단일 도구로 설정 간소화

**ruff.toml 예시**:

```toml
[tool.ruff]
line-length = 88
target-version = "py311"

[tool.ruff.lint]
select = ["E", "F", "I", "N", "W", "UP"]
ignore = ["E501"]

[tool.ruff.format]
quote-style = "double"
```

#### Type Checker

| 도구     | 엄격성     | 성능       | IDE 통합                | 선택    |
| -------- | ---------- | ---------- | ----------------------- | ------- |
| **mypy** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐   | ⭐⭐⭐⭐⭐              | ✅ 권장 |
| Pyright  | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ VS Code 최적 | 대안    |

**mypy 선정 근거**:

- 프로덕션 안정성 검증됨
- 점진적 타입 검사 지원
- Celery, PyTorch 타입 스텁 지원

---

### 3.5 Worker 실행 모델

#### Worker Pool 선택

| Pool        | CPU-bound  | I/O-bound  | GIL 우회         | 메모리          | 선택       |
| ----------- | ---------- | ---------- | ---------------- | --------------- | ---------- |
| **prefork** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐     | ✅ 프로세스 격리 | ⭐⭐⭐ 높음     | ✅ DXF/PDF |
| gevent      | ⭐⭐       | ⭐⭐⭐⭐⭐ | ❌               | ⭐⭐⭐⭐⭐ 낮음 | I/O 작업용 |
| eventlet    | ⭐⭐       | ⭐⭐⭐⭐⭐ | ❌               | ⭐⭐⭐⭐⭐ 낮음 | I/O 작업용 |

**prefork 선정 근거**:

- DXF 파싱, PDF 렌더링, ML 추론 모두 CPU-bound
- GIL(Global Interpreter Lock) 우회로 진정한 병렬 처리
- 프로세스 격리로 메모리 누수 방지

#### Worker 분리 전략

| 전략                      | 리소스 효율 | 확장성     | 운영 복잡도     | 선택     |
| ------------------------- | ----------- | ---------- | --------------- | -------- |
| **타입별 분리 (DXF/PDF)** | ⭐⭐⭐⭐⭐  | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ 중간     | ✅ 권장  |
| 단일 Worker               | ⭐⭐⭐      | ⭐⭐⭐     | ⭐⭐⭐⭐⭐ 단순 | MVP 한정 |
| 우선순위별 분리           | ⭐⭐⭐⭐    | ⭐⭐⭐⭐   | ⭐⭐ 복잡       | 대안     |

**타입별 분리 선정 근거**:

1. **리소스 최적화**:
    - DXF: CPU 4 vCPU, 8GB RAM
    - PDF: CPU 4 vCPU, 16GB RAM + GPU (T4/A10)

2. **독립 스케일링**:
    - DXF 80% 트래픽 → CPU Worker 스케일 업
    - PDF 증가 → GPU Worker만 추가

3. **장애 격리**:
    - PDF ML 오류 → DXF 처리 영향 없음

---

### 3.6 Docker 컨테이너화

#### Base 이미지 선택

| 이미지                       | 크기   | 보안       | 호환성                | 용도            |
| ---------------------------- | ------ | ---------- | --------------------- | --------------- |
| **python:3.11-slim**         | ~150MB | ⭐⭐⭐⭐   | ⭐⭐⭐⭐⭐            | ✅ CPU Worker   |
| python:3.11-alpine           | ~50MB  | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ musl 호환 이슈 | ❌              |
| **nvidia/cuda:12.2-runtime** | ~1.8GB | ⭐⭐⭐⭐   | ⭐⭐⭐⭐⭐            | ✅ GPU Worker   |
| distroless                   | ~30MB  | ⭐⭐⭐⭐⭐ | ⭐⭐ 디버깅 어려움    | 프로덕션 최적화 |

**선정 근거**:

- **python:3.11-slim**: Debian 기반, 대부분의 wheel 호환, 적절한 크기
- **nvidia/cuda**: GPU 가속 필수, CUDA 라이브러리 포함

#### Multi-stage 빌드 전략

```dockerfile
# Stage 1: Builder
FROM python:3.11-slim AS builder
WORKDIR /app
RUN pip install pip-tools
COPY requirements.in .
RUN pip-compile requirements.in -o requirements.txt
RUN pip wheel --no-cache-dir --wheel-dir=/wheels -r requirements.txt

# Stage 2: Runtime
FROM python:3.11-slim AS runtime
WORKDIR /app

# 비root 사용자
RUN useradd --create-home appuser
USER appuser

# 의존성 설치
COPY --from=builder /wheels /wheels
RUN pip install --no-cache-dir --user /wheels/*

# 애플리케이션 코드
COPY --chown=appuser:appuser . .

# Health check
HEALTHCHECK --interval=30s --timeout=10s \
  CMD celery -A worker inspect ping || exit 1

CMD ["celery", "-A", "worker", "worker", "-l", "info"]
```

**Multi-stage 효과**:

- 빌드 도구 제외로 60% 이미지 크기 감소
- 보안: 빌드 시크릿 런타임에 포함 안 됨

---

## 4. 권장 기술 스택 종합

### requirements.in

```ini
# Core
celery[rabbitmq]>=5.3.0
pika>=1.3.0

# DXF Processing
ezdxf>=1.3.0

# PDF Processing
PyMuPDF>=1.24.0

# 3D Output
pygltflib>=1.16.0

# Image Processing
opencv-python-headless>=4.9.0
numpy>=1.26.0

# ML Inference (GPU Worker)
torch>=2.1.0
ultralytics>=8.0.0
onnxruntime-gpu>=1.16.0

# Database
psycopg2-binary>=2.9.9
SQLAlchemy>=2.0.0

# Storage
boto3>=1.34.0

# Monitoring
prometheus-client>=0.19.0
celery-exporter>=1.4.0

# Utilities
pydantic>=2.5.0
python-dotenv>=1.0.0
structlog>=24.1.0
```

### pyproject.toml

```toml
[project]
name = "cad-worker"
version = "0.1.0"
requires-python = ">=3.11"

[tool.ruff]
line-length = 88
target-version = "py311"

[tool.ruff.lint]
select = ["E", "F", "I", "N", "W", "UP", "B", "C4", "SIM"]
ignore = ["E501"]

[tool.ruff.format]
quote-style = "double"

[tool.mypy]
python_version = "3.11"
strict = true
warn_return_any = true
disallow_untyped_defs = true

[[tool.mypy.overrides]]
module = ["celery.*", "ezdxf.*", "fitz.*", "cv2.*"]
ignore_missing_imports = true

[tool.pytest.ini_options]
testpaths = ["tests"]
asyncio_mode = "auto"
addopts = "-v --cov=src --cov-report=term-missing"
```

---

## 5. 프로젝트 구조

```
cad-worker/
├── src/
│   ├── __init__.py
│   ├── celery_app.py           # Celery 인스턴스 설정
│   ├── config.py               # 환경 변수 관리
│   │
│   ├── tasks/                  # Celery Tasks
│   │   ├── __init__.py
│   │   ├── dxf_tasks.py        # DXF 변환 태스크
│   │   └── pdf_tasks.py        # PDF ML 분석 태스크
│   │
│   ├── pipelines/              # 처리 파이프라인
│   │   ├── __init__.py
│   │   ├── dxf/
│   │   │   ├── __init__.py
│   │   │   ├── parser.py       # ezdxf 파싱
│   │   │   ├── transformer.py  # 2D → 3D 변환
│   │   │   └── exporter.py     # glTF 출력
│   │   └── pdf/
│   │       ├── __init__.py
│   │       ├── extractor.py    # PyMuPDF 추출
│   │       ├── preprocessor.py # OpenCV 전처리
│   │       ├── detector.py     # YOLO 추론
│   │       └── exporter.py     # glTF 출력
│   │
│   ├── models/                 # 데이터 모델
│   │   ├── __init__.py
│   │   ├── job.py              # Job 상태 모델
│   │   └── geometry.py         # 3D Geometry 모델
│   │
│   ├── storage/                # 스토리지 클라이언트
│   │   ├── __init__.py
│   │   ├── minio_client.py     # MinIO/S3 클라이언트
│   │   └── db_client.py        # PostgreSQL 클라이언트
│   │
│   └── utils/                  # 유틸리티
│       ├── __init__.py
│       ├── logging.py          # 구조화 로깅
│       └── metrics.py          # Prometheus 메트릭
│
├── tests/
│   ├── __init__.py
│   ├── conftest.py             # pytest fixtures
│   ├── unit/
│   │   ├── test_dxf_parser.py
│   │   └── test_pdf_extractor.py
│   └── integration/
│       ├── test_dxf_pipeline.py
│       └── test_pdf_pipeline.py
│
├── docker/
│   ├── Dockerfile.cpu          # CPU Worker
│   ├── Dockerfile.gpu          # GPU Worker
│   └── docker-compose.yml
│
├── requirements.in
├── requirements.txt            # pip-compile 출력
├── pyproject.toml
├── .env.example
└── README.md
```

---

## 6. 설정 예시

### celery_app.py

```python
"""Celery 애플리케이션 설정"""
from celery import Celery
from kombu import Exchange, Queue

from src.config import settings

app = Celery("cad-worker")

# Broker 설정 (RabbitMQ)
app.conf.broker_url = settings.RABBITMQ_URL
app.conf.result_backend = settings.REDIS_URL

# Worker 설정
app.conf.worker_pool = "prefork"
app.conf.worker_concurrency = settings.WORKER_CONCURRENCY
app.conf.worker_prefetch_multiplier = 1  # 긴 태스크 부하 분산
app.conf.worker_max_tasks_per_child = 100  # 메모리 누수 방지

# Task 설정
app.conf.task_acks_late = True  # 처리 완료 후 ACK
app.conf.task_reject_on_worker_lost = True
app.conf.task_time_limit = 600  # 10분 (hard limit)
app.conf.task_soft_time_limit = 540  # 9분 (soft limit)

# 직렬화
app.conf.task_serializer = "json"
app.conf.result_serializer = "json"
app.conf.accept_content = ["json"]

# Queue 설정
default_exchange = Exchange("tasks", type="direct")

app.conf.task_queues = (
    Queue("dxf_queue", default_exchange, routing_key="dxf"),
    Queue("pdf_queue", default_exchange, routing_key="pdf"),
    Queue("dxf_dlq", default_exchange, routing_key="dxf.dlq"),
    Queue("pdf_dlq", default_exchange, routing_key="pdf.dlq"),
)

app.conf.task_routes = {
    "src.tasks.dxf_tasks.*": {"queue": "dxf_queue", "routing_key": "dxf"},
    "src.tasks.pdf_tasks.*": {"queue": "pdf_queue", "routing_key": "pdf"},
}

# Retry 설정
app.conf.task_default_retry_delay = 60  # 60초
app.conf.task_max_retries = 3

# Task 자동 탐색
app.autodiscover_tasks(["src.tasks"])
```

### config.py

```python
"""환경 변수 설정"""
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Worker 설정"""

    # RabbitMQ
    RABBITMQ_URL: str = "amqp://guest:guest@localhost:5672//"

    # Redis (Result Backend)
    REDIS_URL: str = "redis://localhost:6379/0"

    # PostgreSQL
    DATABASE_URL: str = "postgresql://user:pass@localhost:5432/cadviewer"

    # MinIO/S3
    MINIO_ENDPOINT: str = "localhost:9000"
    MINIO_ACCESS_KEY: str = "minioadmin"
    MINIO_SECRET_KEY: str = "minioadmin"
    MINIO_BUCKET: str = "cad-files"

    # Worker
    WORKER_CONCURRENCY: int = 4
    WORKER_TYPE: str = "dxf"  # "dxf" | "pdf"

    # ML (PDF Worker only)
    YOLO_MODEL_PATH: str = "/models/yolov8n.pt"
    USE_GPU: bool = False

    class Config:
        env_file = ".env"


settings = Settings()
```

### docker-compose.yml

```yaml
version: '3.8'

services:
    # DXF Worker (CPU)
    worker-dxf:
        build:
            context: .
            dockerfile: docker/Dockerfile.cpu
        environment:
            - WORKER_TYPE=dxf
            - WORKER_CONCURRENCY=4
            - RABBITMQ_URL=amqp://guest:guest@rabbitmq:5672//
            - DATABASE_URL=postgresql://user:pass@postgres:5432/cadviewer
            - MINIO_ENDPOINT=minio:9000
        depends_on:
            - rabbitmq
            - postgres
            - minio
        command: celery -A src.celery_app worker -Q dxf_queue -l info
        deploy:
            resources:
                limits:
                    cpus: '4'
                    memory: 8G
        healthcheck:
            test: ['CMD', 'celery', '-A', 'src.celery_app', 'inspect', 'ping']
            interval: 30s
            timeout: 10s
            retries: 3

    # PDF Worker (GPU)
    worker-pdf:
        build:
            context: .
            dockerfile: docker/Dockerfile.gpu
        environment:
            - WORKER_TYPE=pdf
            - WORKER_CONCURRENCY=2
            - USE_GPU=true
            - RABBITMQ_URL=amqp://guest:guest@rabbitmq:5672//
            - DATABASE_URL=postgresql://user:pass@postgres:5432/cadviewer
            - MINIO_ENDPOINT=minio:9000
        depends_on:
            - rabbitmq
            - postgres
            - minio
        command: celery -A src.celery_app worker -Q pdf_queue -l info
        deploy:
            resources:
                limits:
                    cpus: '4'
                    memory: 16G
                reservations:
                    devices:
                        - driver: nvidia
                          count: 1
                          capabilities: [gpu]
        healthcheck:
            test: ['CMD', 'celery', '-A', 'src.celery_app', 'inspect', 'ping']
            interval: 30s
            timeout: 10s
            retries: 3

    # Flower (모니터링)
    flower:
        image: mher/flower:2.0
        environment:
            - CELERY_BROKER_URL=amqp://guest:guest@rabbitmq:5672//
        ports:
            - '5555:5555'
        depends_on:
            - rabbitmq

    # 인프라 서비스 (개발용)
    rabbitmq:
        image: rabbitmq:3.12-management
        ports:
            - '5672:5672'
            - '15672:15672'
        healthcheck:
            test: rabbitmq-diagnostics -q ping
            interval: 30s
            timeout: 10s
            retries: 5

    postgres:
        image: postgres:15
        environment:
            POSTGRES_USER: user
            POSTGRES_PASSWORD: pass
            POSTGRES_DB: cadviewer
        ports:
            - '5432:5432'
        volumes:
            - postgres_data:/var/lib/postgresql/data

    minio:
        image: minio/minio
        command: server /data --console-address ":9001"
        ports:
            - '9000:9000'
            - '9001:9001'
        volumes:
            - minio_data:/data

volumes:
    postgres_data:
    minio_data:
```

---

## 7. 에러 처리 및 복원력

### Retry 정책

```python
"""DXF 태스크 예시 - Retry 정책 적용"""
from celery import shared_task
from celery.exceptions import MaxRetriesExceededError

from src.celery_app import app


@app.task(
    bind=True,
    autoretry_for=(IOError, ConnectionError),
    retry_backoff=True,  # Exponential backoff
    retry_backoff_max=600,  # 최대 10분
    retry_kwargs={"max_retries": 3},
)
def process_dxf(self, job_id: str, file_path: str) -> dict:
    """DXF 파일 처리 태스크"""
    try:
        # 처리 로직
        result = dxf_pipeline.process(file_path)
        return {"status": "completed", "result_path": result}

    except MaxRetriesExceededError:
        # DLQ로 이동
        self.apply_async(
            args=[job_id, file_path],
            queue="dxf_dlq",
            retry=False,
        )
        raise
```

### Dead Letter Queue (DLQ) 전략

| 단계 | 동작         | 조건                               |
| ---- | ------------ | ---------------------------------- |
| 1    | 최초 처리    | dxf_queue / pdf_queue              |
| 2    | 재시도 (3회) | Exponential Backoff (60→180→360초) |
| 3    | DLQ 이동     | max_retries 초과                   |
| 4    | 알림 발송    | DLQ 메시지 발생 시 Slack/Email     |
| 5    | 수동 재처리  | 관리자 확인 후 재큐잉              |

### Circuit Breaker (외부 서비스)

```python
"""MinIO Circuit Breaker 예시"""
from pybreaker import CircuitBreaker

minio_breaker = CircuitBreaker(
    fail_max=5,
    reset_timeout=60,
    exclude=[FileNotFoundError],  # 파일 없음은 장애 아님
)

@minio_breaker
def upload_to_minio(file_path: str, bucket: str, key: str) -> str:
    """MinIO 업로드 (Circuit Breaker 적용)"""
    return minio_client.fput_object(bucket, key, file_path)
```

---

## 8. 모니터링 전략

### Prometheus 메트릭

```python
"""커스텀 메트릭 정의"""
from prometheus_client import Counter, Histogram, Gauge

# 작업 카운터
tasks_total = Counter(
    "worker_tasks_total",
    "Total tasks processed",
    ["task_name", "status"],  # completed, failed
)

# 처리 시간
task_duration = Histogram(
    "worker_task_duration_seconds",
    "Task processing duration",
    ["task_name"],
    buckets=[0.5, 1, 2, 5, 10, 30, 60, 120],
)

# 현재 처리 중인 작업
tasks_in_progress = Gauge(
    "worker_tasks_in_progress",
    "Tasks currently being processed",
    ["task_name"],
)

# 메모리 사용량
memory_usage = Gauge(
    "worker_memory_bytes",
    "Worker memory usage in bytes",
)
```

### 알림 규칙

| 심각도       | 조건                  | 알림 채널         |
| ------------ | --------------------- | ----------------- |
| **Critical** | Worker 다운 (5분+)    | Slack + PagerDuty |
| **Critical** | 실패율 > 10% (5분)    | Slack + PagerDuty |
| **Warning**  | 처리 시간 > SLA의 2배 | Slack             |
| **Warning**  | 메모리 > 80%          | Slack             |
| **Info**     | DLQ 메시지 발생       | Slack             |

### Grafana 대시보드

**주요 패널**:

1. 작업 처리율 (tasks/sec)
2. 평균/P95/P99 처리 시간
3. 큐 깊이 (백로그)
4. 실패율
5. Worker 인스턴스 상태
6. 메모리/CPU 사용량
7. GPU 사용률 (PDF Worker)

---

## 9. Consequences (결과)

### 긍정적 결과

| 결과          | 설명                                      |
| ------------- | ----------------------------------------- |
| **성능 향상** | Python 3.11로 10-60% 처리 속도 개선       |
| **안정성**    | prefork pool로 GIL 우회, 메모리 누수 방지 |
| **확장성**    | DXF/PDF Worker 독립 스케일링              |
| **운영 효율** | Ruff 단일 도구로 코드 품질 관리 간소화    |
| **모니터링**  | Prometheus + Grafana로 실시간 가시성 확보 |

### 부정적 결과

| 결과            | 영향                     | 완화 방안                  |
| --------------- | ------------------------ | -------------------------- |
| **운영 복잡도** | 2개 Worker 관리 필요     | Docker Compose 통합 관리   |
| **메모리 사용** | prefork pool 메모리 증가 | max_tasks_per_child로 제어 |
| **GPU 비용**    | PDF Worker GPU 필요      | 수요 기반 스케일링         |
| **학습 곡선**   | Celery 설정 복잡도       | 문서화 및 템플릿 제공      |

---

## 10. Review Triggers (재검토 조건)

### 기술적 트리거

| 조건                 | 재검토 영역              |
| -------------------- | ------------------------ |
| Python 3.12 LTS 출시 | Python 버전 업그레이드   |
| PyTorch 3.x 출시     | ML 라이브러리 업그레이드 |
| Dramatiq 2.0 안정화  | Celery 대안 재평가       |
| 처리량 100배 증가    | Worker 아키텍처 재설계   |

### 비즈니스 트리거

| 조건                  | 재검토 영역            |
| --------------------- | ---------------------- |
| 키오스크 30대 초과    | Kubernetes 전환 검토   |
| 새로운 파일 형식 추가 | 파이프라인 확장        |
| 실시간 처리 요구      | 스트리밍 아키텍처 검토 |

---

## Changelog (변경 이력)

| 버전  | 날짜       | 변경 내용                                                                                                                                                 |
| ----- | ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0.0.0 | 2025-12-04 | 초기 버전 - Python Worker 기술 스택 정의, 전문가 검토 결과 반영, 용어집 GLOSSARY.md 통합, Python LTS 정책 명시, IDE 도구 비교 추가, uv 패키지 관리자 추가 |
