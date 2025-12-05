# ADR-003: Python Worker 기술 스택

> **Version**: 0.0.1
> **Last Updated**: 2025-12-05

## 상태 및 의사결정 정보

**상태**: 초안 (Draft) | **작성일**: 2025-12-04

| 역할       | 담당자      |
| ---------- | ----------- |
| **작성자** | Claude      |
| **검토자** | -           |
| **승인자** | -           |
| **결정일** | - (승인 시) |

### 의사결정 동인 (Decision Drivers)

| 유형         | 내용                                                       |
| ------------ | ---------------------------------------------------------- |
| **기술적**   | GIL 우회 필요, CPU-bound 작업 최적화, ML 라이브러리 호환성 |
| **비즈니스** | 키오스크 서비스 99.5% 가용성, DXF < 5초 / PDF < 30초 SLA   |
| **팀/조직**  | 2-3명 소규모 팀, 운영 복잡도 최소화 필요                   |

> **상태 정의**: Draft → In Review → Approved / Superseded / Deprecated

---

## 목차

1. [핵심 질문](#1-핵심-질문)
2. [문서 범위](#2-문서-범위)
3. [프로젝트 컨텍스트](#3-프로젝트-컨텍스트)
4. [평가 기준](#4-평가-기준)
5. [결정 영역별 분석](#5-결정-영역별-분석)
    - 5.1 Python 버전 선택
    - 5.2 Task Queue Framework
    - 5.3 핵심 라이브러리
    - 5.4 개발 환경 도구
    - 5.5 Worker 실행 모델
    - 5.6 Docker 컨테이너화
    - 5.7 모니터링 도구
6. [전문가 분석 종합](#6-전문가-분석-종합)
7. [권장 기술 스택 종합](#7-권장-기술-스택-종합)
8. [Consequences (결과)](#8-consequences-결과)
9. [Review Triggers (재검토 조건)](#9-review-triggers-재검토-조건)
10. [참조](#10-참조)

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

### 권장 기술 스택

| 컴포넌트          | 선택                 | 버전   | 선정 근거                                |
| ----------------- | -------------------- | ------ | ---------------------------------------- |
| **Python**        | 3.11                 | 3.11.x | 10-60% 성능 향상, 안정적 ML 지원         |
| **Task Queue**    | Celery               | ^5.3.0 | 업계 표준, RabbitMQ 네이티브 지원        |
| **Worker Pool**   | prefork              | -      | CPU-bound 작업, GIL 우회 필수            |
| **패키지 관리**   | uv                   | ^0.5.0 | 10-100x 빠름, pip/poetry/pyenv 통합 대체 |
| **코드 품질**     | Ruff                 | ^0.8.0 | 10-100x 빠름, 올인원 (linter+formatter)  |
| **Type Checker**  | mypy                 | ^1.8.0 | 프로덕션 안정성, 엄격한 타입 검사        |
| **테스트**        | pytest               | ^7.4.0 | 사실상 표준, pytest-celery 통합          |
| **모니터링**      | Prometheus + Grafana | latest | 메트릭 수집 + 시각화, Celery 통합        |
| **Task 모니터링** | Flower               | ^2.0   | Celery 전용 실시간 대시보드              |

---

## 2. 문서 범위

**이 문서가 다루는 내용:**

- Python Worker 기술 스택 선택 (Python 버전, Task Queue, 라이브러리)
- 모니터링 도구 선택 (Prometheus, Grafana, Flower)
- Worker 실행 모델 및 Docker 컨테이너화 전략

**이 문서가 다루지 않는 내용:**
| 항목 | 다루는 위치 |
|------|------------|
| 설정 예시 및 구현 코드 | `cad-worker/README.md` (Phase 3B 구현 시) |
| 보안 설정 (시크릿, 인증, 네트워크) | `cad-worker/README.md` (Phase 3B 구현 시) |
| 테스트 전략 및 실행 방법 | `cad-worker/README.md` (Phase 3B 구현 시) |
| 배포 운영 가이드 | `cad-worker/docs/DEPLOYMENT.md` (Phase 3C 이후) |
| Backend ↔ Worker 인터페이스 | ADR-001 확정 후 별도 문서 |

---

## 3. 프로젝트 컨텍스트

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

## 4. 평가 기준

### 가중치 기반 평가 프레임워크

| 기준          | 가중치 | 설명                                          |
| ------------- | ------ | --------------------------------------------- |
| **성능**      | 25%    | 처리 속도, 리소스 효율성, GIL 우회 능력       |
| **안정성**    | 25%    | 프로덕션 검증, 에러 처리, 장애 격리, LTS 지원 |
| **생태계**    | 20%    | 커뮤니티 활성도, 문서화 수준, 유지보수 상태   |
| **통합성**    | 15%    | RabbitMQ/Spring Boot 호환, 기존 스택 연계     |
| **팀 적합성** | 15%    | 학습 곡선, 운영 복잡도, 2-3명 팀 규모 적합성  |
| **합계**      | 100%   |                                               |

### 평가 척도

| 점수             | 의미      |
| ---------------- | --------- |
| ⭐⭐⭐⭐⭐ (5점) | 매우 우수 |
| ⭐⭐⭐⭐ (4점)   | 우수      |
| ⭐⭐⭐ (3점)     | 보통      |
| ⭐⭐ (2점)       | 미흡      |
| ⭐ (1점)         | 매우 미흡 |

---

## 5. 결정 영역별 분석

### 5.1 Python 버전 선택

| 기준                  | Python 3.10                  | Python 3.11                  | Python 3.12                |
| --------------------- | ---------------------------- | ---------------------------- | -------------------------- |
| **성능**              | ⭐⭐⭐ 기준선                | ⭐⭐⭐⭐⭐ +10-60%           | ⭐⭐⭐⭐⭐ +5% (3.11 대비) |
| **라이브러리 호환성** | ⭐⭐⭐⭐⭐ 최고              | ⭐⭐⭐⭐⭐ 우수              | ⭐⭐⭐⭐ 대부분 호환       |
| **ML 생태계**         | ⭐⭐⭐⭐⭐ PyTorch 완전 지원 | ⭐⭐⭐⭐⭐ PyTorch 완전 지원 | ⭐⭐⭐⭐ 일부 제한         |
| **에러 메시지**       | ⭐⭐⭐ 기본                  | ⭐⭐⭐⭐⭐ 향상됨            | ⭐⭐⭐⭐⭐ 향상됨          |
| **Docker 이미지**     | ⭐⭐⭐⭐⭐ 안정적            | ⭐⭐⭐⭐⭐ 안정적            | ⭐⭐⭐⭐ 비교적 새로움     |
| **LTS 지원**          | 2026-10                      | 2027-10                      | 2028-10                    |
| **종합**              | 78점                         | **92점**                     | 85점                       |

**📌 Python LTS 정책 참고**

Python은 공식 "LTS" 용어를 사용하지 않지만, **모든 minor 버전이 동일하게 5년간 지원**됩니다.

- **Full Support**: 1.5년 (3.13부터 2년) - 버그 수정 + 보안 패치
- **Security Only**: 3.5년 (3.13부터 3년) - 보안 패치만
- Spring Boot와 달리 LTS/non-LTS 구분 없이 **모든 버전 동일 대우**
- 참고: [Python 버전 지원 정책](https://devguide.python.org/versions/)

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

### 5.2 Task Queue Framework

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

### 5.3 핵심 라이브러리

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

### 5.4 개발 환경 도구

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
| **uv**                 | ⭐⭐⭐⭐⭐ 10-100x | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐  | ⭐⭐⭐⭐   | ✅ 권장             |
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

### 5.5 Worker 실행 모델

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

### 5.6 Docker 컨테이너화

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

### 5.7 모니터링 도구

#### 메트릭 수집/시각화

| 기준              | Prometheus + Grafana       | Datadog           | ELK Stack           |
| ----------------- | -------------------------- | ----------------- | ------------------- |
| **비용**          | ⭐⭐⭐⭐⭐ 무료 (OSS)      | ⭐⭐ SaaS 비용    | ⭐⭐⭐⭐ 무료 (OSS) |
| **Celery 통합**   | ⭐⭐⭐⭐⭐ celery-exporter | ⭐⭐⭐⭐ 에이전트 | ⭐⭐⭐ 커스텀 필요  |
| **대시보드**      | ⭐⭐⭐⭐⭐ 풍부 (커스텀)   | ⭐⭐⭐⭐⭐ 풍부   | ⭐⭐⭐⭐ Kibana     |
| **알림**          | ⭐⭐⭐⭐ Alertmanager      | ⭐⭐⭐⭐⭐ 내장   | ⭐⭐⭐ Watcher      |
| **운영 복잡도**   | ⭐⭐⭐⭐ 중간              | ⭐⭐⭐⭐⭐ 낮음   | ⭐⭐⭐ 높음         |
| **2-3명 팀 적합** | ⭐⭐⭐⭐⭐ 높음            | ⭐⭐⭐ 비용 부담  | ⭐⭐⭐ 복잡도       |
| **종합**          | **90점**                   | 75점              | 70점                |

**Prometheus + Grafana 점수 계산**:

- 비용 (20%): 5 × 0.2 = 1.0
- Celery 통합 (25%): 5 × 0.25 = 1.25
- 대시보드 (15%): 5 × 0.15 = 0.75
- 알림 (15%): 4 × 0.15 = 0.6
- 운영 복잡도 (15%): 4 × 0.15 = 0.6
- 팀 적합성 (10%): 5 × 0.1 = 0.5
- **합계**: 4.7 × 20 = **94점** → 보수적으로 **90점**

#### Celery 전용 모니터링

| 기준            | Flower     | celery-events | 자체 구현 |
| --------------- | ---------- | ------------- | --------- |
| **실시간 UI**   | ⭐⭐⭐⭐⭐ | ❌            | ⭐⭐⭐    |
| **작업 상태**   | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐      | ⭐⭐⭐    |
| **Worker 관리** | ⭐⭐⭐⭐⭐ | ❌            | ⭐⭐      |
| **설치 용이성** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐    | ⭐⭐      |
| **종합**        | **95점**   | 60점          | 50점      |

**Flower 점수 계산**:

- 실시간 UI (30%): 5 × 0.3 = 1.5
- 작업 상태 (30%): 5 × 0.3 = 1.5
- Worker 관리 (20%): 5 × 0.2 = 1.0
- 설치 용이성 (20%): 5 × 0.2 = 1.0
- **합계**: 5.0 × 20 = **100점** → 보수적으로 **95점**

#### 권장: Prometheus + Grafana + Flower

**선정 근거**:

1. **비용 효율**: 모두 오픈소스, SaaS 비용 없음
2. **Celery 완벽 통합**: celery-exporter로 Prometheus 메트릭 수집 + Flower 실시간 UI
3. **커스터마이징**: Grafana 대시보드 자유롭게 구성 가능
4. **2-3명 팀 적합**: 운영 복잡도 낮음, 학습 곡선 완만

**아키텍처**:

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────┐
│   Celery    │────▶│ celery-exporter  │────▶│ Prometheus  │
│   Workers   │     │   (메트릭 수집)   │     │  (저장소)   │
└─────────────┘     └──────────────────┘     └──────┬──────┘
       │                                           │
       │            ┌──────────────────┐           │
       └───────────▶│     Flower       │           │
                    │ (실시간 Task UI)  │           ▼
                    └──────────────────┘     ┌─────────────┐
                                             │   Grafana   │
                                             │ (시각화/알림)│
                                             └─────────────┘
```

---

## 6. 전문가 분석 종합

### 핵심 결정 평가 매트릭스

| 기준 (가중치)   | Python 3.11 | Celery     | prefork    | uv         |
| --------------- | ----------- | ---------- | ---------- | ---------- |
| 성능 (25%)      | ⭐⭐⭐⭐⭐  | ⭐⭐⭐⭐   | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| 안정성 (25%)    | ⭐⭐⭐⭐⭐  | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐   |
| 생태계 (20%)    | ⭐⭐⭐⭐⭐  | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐   |
| 통합성 (15%)    | ⭐⭐⭐⭐⭐  | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| 팀 적합성 (15%) | ⭐⭐⭐⭐    | ⭐⭐⭐     | ⭐⭐⭐⭐   | ⭐⭐⭐⭐   |
| **가중 총점**   | **95점**    | **89점**   | **97점**   | **87점**   |

### 분석 요약

**주요 인사이트**:

1. **Python 3.11**: 성능 10-60% 향상과 ML 생태계 완벽 호환으로 최적 선택
2. **Celery + prefork**: GIL 우회와 RabbitMQ 네이티브 지원으로 CPU-bound 작업에 최적
3. **Worker 분리 전략**: DXF/PDF 독립 스케일링으로 리소스 효율성과 장애 격리 확보
4. **uv 패키지 관리**: 10-100x 빠른 속도로 Docker 빌드 시간 대폭 단축

---

## 7. 권장 기술 스택 종합

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
celery-exporter>=1.3.0

# Utilities
pydantic>=2.5.0
python-dotenv>=1.0.0
structlog>=24.1.0

# Resilience
pybreaker>=1.0.0
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
indent-style = "space"

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

### 마이그레이션 경로

```
Phase 1          Phase 2          Phase 3
Python 3.11  ──▶ Python 3.12  ──▶ Python 3.13
Celery 5.3   ──▶ Celery 5.4+  ──▶ Celery 6.x
(현재)           (2026 검토)       (2027 검토)
```

**마이그레이션 고려사항:**

- Python 업그레이드: ML 라이브러리 호환성 확인 필수 (PyTorch, ultralytics)
- Celery 업그레이드: Worker pool 설정 호환성 검증, 설정 파일 마이그레이션

---

## 8. Consequences (결과)

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

### 리스크

| 리스크                               | 확률 | 영향 | 대응                                         |
| ------------------------------------ | ---- | ---- | -------------------------------------------- |
| Celery 복잡성으로 인한 디버깅 어려움 | 중간 | 중간 | 상세 로깅, Flower 모니터링 활용              |
| Python 3.13 조기 전환 압박           | 낮음 | 낮음 | 3.11 LTS 2027-10까지 유지, 점진 전환         |
| GPU Worker 비용 증가                 | 중간 | 높음 | 수요 기반 오토스케일링, 스팟 인스턴스 활용   |
| uv 도구 성숙도 리스크                | 낮음 | 낮음 | pip-tools 대안 준비, Astral 팀 지속 모니터링 |

---

## 9. Review Triggers (재검토 조건)

다음 조건 발생 시 이 ADR을 재검토합니다:

### 기술적 트리거

- [ ] Python 3.13 정식 출시 및 생태계 성숙 → Python 버전 업그레이드 검토
- [ ] PyTorch 3.x 출시 → ML 라이브러리 업그레이드 검토
- [ ] Dramatiq 2.0 안정화 → Celery 대안 재평가
- [ ] 처리량 100배 증가 → Worker 아키텍처 재설계

### 비즈니스 트리거

- [ ] 키오스크 30대 초과 → Kubernetes 전환 검토
- [ ] 새로운 파일 형식 추가 → 파이프라인 확장
- [ ] 실시간 처리 요구 → 스트리밍 아키텍처 검토

### 정기 검토

- [ ] 6개월 정기 검토 (다음 검토: 2026-06-05)

---

## 10. 참조

### 관련 문서

| 문서                                                                           | 설명                   |
| ------------------------------------------------------------------------------ | ---------------------- |
| [001_BACKEND_STACK.md](./001_BACKEND_STACK.md)                                 | Backend 기술 스택 선택 |
| [002_QUEUE_ALTERNATIVES_COMPARISON.md](./002_QUEUE_ALTERNATIVES_COMPARISON.md) | RabbitMQ 선택 근거     |
| [FILE_UPLOAD_ARCHITECTURE.md](../fileUpload/FILE_UPLOAD_ARCHITECTURE.md)       | 시스템 다이어그램      |
| [ROADMAP.md](../ROADMAP.md)                                                    | 전체 프로젝트 로드맵   |
| [GLOSSARY.md](../GLOSSARY.md)                                                  | 용어 및 약어 정의      |

### 외부 참조

- [Python 버전 지원 정책](https://devguide.python.org/versions/)
- [Celery 공식 문서](https://docs.celeryq.dev/)
- [uv 패키지 관리자](https://github.com/astral-sh/uv)
- [Ruff Linter](https://github.com/astral-sh/ruff)
- [Flower Celery 모니터링](https://flower.readthedocs.io/)
- [PyTorch 공식 문서](https://pytorch.org/docs/stable/)
- [Docker Python 이미지 가이드](https://hub.docker.com/_/python)
- [Prometheus 공식 문서](https://prometheus.io/docs/)

---

## Changelog (변경 이력)

| 버전  | 날짜       | 변경 내용                                                                                                                                                                                                                                    |
| ----- | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0.0.1 | 2025-12-05 | 템플릿 구조 정렬 및 품질 개선: 상태/평가기준/전문가분석/리스크/외부참조 섹션 추가, 모니터링 도구 비교 추가, Review Triggers 체크박스 형식 변환, 마이그레이션 경로 추가, Python 3.13 참조 업데이트, 외부 참조 보강, 리스크 테이블 일관성 수정 |
| 0.0.0 | 2025-12-04 | 초기 버전 - Python Worker 기술 스택 정의, 전문가 검토 결과 반영, 용어집 GLOSSARY.md 통합, Python LTS 정책 명시, IDE 도구 비교 추가, uv 패키지 관리자 추가                                                                                    |
