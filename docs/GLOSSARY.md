# Glossary

> CAD Viewer 프로젝트에서 사용되는 용어 및 약어 정의

---

## 목차

- [일반 용어](#일반-용어)
- [프론트엔드](#프론트엔드)
- [빌드/개발 도구](#빌드개발-도구)
- [백엔드](#백엔드)
- [CAD/3D](#cad3d)
- [성능/최적화](#성능최적화)
- [ML/AI](#mlai)
- [DevOps/인프라](#devops인프라)
- [보안](#보안)

---

## 일반 용어

| 용어            | 정의                                                        |
| --------------- | ----------------------------------------------------------- |
| **CAD**         | Computer-Aided Design - 컴퓨터 지원 설계                    |
| **DXF**         | Drawing Exchange Format - AutoCAD 도면 교환 포맷            |
| **PDF**         | Portable Document Format - 문서 포맷                        |
| **glTF/glb**    | GL Transmission Format - 3D 모델 표준 포맷                  |
| **JSON**        | JavaScript Object Notation - 데이터 교환 포맷               |
| **API**         | Application Programming Interface - 애플리케이션 인터페이스 |
| **MVP**         | Minimum Viable Product - 최소 기능 제품                     |
| **TypeScript**  | JavaScript에 정적 타입을 추가한 프로그래밍 언어             |
| **strict mode** | TypeScript 엄격한 타입 검사 설정                            |
| **MIME Type**   | 파일/콘텐츠 형식 식별자 (application/dxf 등)                |
| **Blob**        | Binary Large Object - 브라우저 바이너리 대용량 객체         |

---

## 프론트엔드

| 용어                     | 정의                                               |
| ------------------------ | -------------------------------------------------- |
| **R3F**                  | React Three Fiber - Three.js의 React 선언적 렌더러 |
| **Three.js**             | JavaScript 3D 라이브러리                           |
| **Zustand**              | React 경량 상태 관리 라이브러리                    |
| **Vite**                 | 차세대 프론트엔드 빌드 도구                        |
| **OrbitControls**        | Three.js 카메라 컨트롤러 (회전, 줌, 패닝)          |
| **LOD**                  | Level of Detail - 거리별 상세도 조절               |
| **Frustum Culling**      | 카메라 시야 밖 객체 렌더링 제외 기법               |
| **Instancing**           | GPU에서 동일 객체 반복 렌더링 최적화               |
| **React Hook Form**      | React 폼 상태 관리 라이브러리                      |
| **TanStack Query**       | React 비동기 상태 관리 라이브러리 (구 React Query) |
| **Axios**                | Promise 기반 HTTP 클라이언트                       |
| **Drei**                 | React Three Fiber 유틸리티 컴포넌트 모음           |
| **Lucide React**         | React 아이콘 컴포넌트 라이브러리                   |
| **Zod**                  | TypeScript-first 스키마 검증 라이브러리            |
| **clsx**                 | 조건부 CSS 클래스명 생성 유틸리티                  |
| **tailwind-merge**       | Tailwind CSS 클래스 병합 유틸리티                  |
| **React Router**         | React 클라이언트 라우팅 라이브러리                 |
| **Controlled Component** | React가 상태를 제어하는 폼 컴포넌트                |
| **Import Alias**         | 모듈 경로 단축 설정 (@/ 등)                        |
| **Barrel Export**        | index 파일에서 모든 내보내기 재수출 패턴           |

---

## 빌드/개발 도구

| 용어                  | 정의                                      |
| --------------------- | ----------------------------------------- |
| **ESLint**            | JavaScript/TypeScript 정적 코드 분석 도구 |
| **typescript-eslint** | ESLint TypeScript 플러그인                |
| **Prettier**          | 코드 포맷팅 도구                          |
| **Husky**             | Git 훅 관리 도구                          |
| **lint-staged**       | 스테이징된 파일에만 린트 적용 도구        |
| **Vitest**            | Vite 네이티브 단위 테스트 프레임워크      |
| **Testing Library**   | React 컴포넌트 테스트 라이브러리          |
| **Autoprefixer**      | CSS 벤더 프리픽스 자동 추가 도구          |

---

## 백엔드

| 용어           | 정의                                          |
| -------------- | --------------------------------------------- |
| **FastAPI**    | Python 고성능 웹 프레임워크                   |
| **Celery**     | Python 분산 작업 큐                           |
| **Redis**      | 인메모리 데이터 저장소 (캐시, 메시지 브로커)  |
| **PostgreSQL** | 오픈소스 관계형 데이터베이스                  |
| **MinIO**      | S3 호환 오브젝트 스토리지                     |
| **Alembic**    | SQLAlchemy용 데이터베이스 마이그레이션 도구   |
| **WebSocket**  | 양방향 실시간 통신 프로토콜                   |
| **WebRTC**     | Web Real-Time Communication - P2P 실시간 통신 |
| **Pub/Sub**    | Publish/Subscribe - 메시지 발행/구독 패턴     |
| **JWT**        | JSON Web Token - 인증 토큰 표준               |

---

## CAD/3D

| 용어                  | 정의                                                   |
| --------------------- | ------------------------------------------------------ |
| **ezdxf**             | Python DXF 파일 파싱 라이브러리                        |
| **pygltflib**         | Python glTF/glb 생성 라이브러리                        |
| **Entity**            | DXF 파일 내 개별 도형 요소 (선, 원, 호 등)             |
| **Layer**             | CAD 도면의 레이어 (그룹화 단위)                        |
| **Extrusion**         | 2D 형상을 3D로 압출하는 변환 기법                      |
| **Wireframe**         | 3D 모델의 뼈대(선) 표현 방식                           |
| **Mesh**              | 3D 모델의 폴리곤 표면 구조                             |
| **Draco**             | Google 3D 압축 라이브러리 (90% 용량 감소)              |
| **dxf-parser**        | JavaScript DXF 파일 파싱 라이브러리                    |
| **LWPOLYLINE**        | DXF 경량 폴리라인 엔티티 (Light-Weight POLYLINE)       |
| **ACI**               | AutoCAD Color Index - AutoCAD 표준 색상 인덱스 (256색) |
| **ByLayer**           | DXF 엔티티 속성이 레이어 설정을 따름                   |
| **ByBlock**           | DXF 엔티티 속성이 블록 설정을 따름                     |
| **BufferGeometry**    | Three.js GPU 최적화 지오메트리 데이터 구조             |
| **LineSegments**      | Three.js 선 세그먼트 렌더링 클래스                     |
| **PerspectiveCamera** | Three.js 원근 투영 카메라                              |
| **Vector3**           | Three.js 3차원 벡터 (x, y, z)                          |
| **EllipseCurve**      | Three.js 타원/원호 곡선 생성 클래스                    |
| **Bounding Box**      | 3D 객체를 감싸는 최소 직육면체 경계                    |

---

## 성능/최적화

| 용어               | 정의                                                 |
| ------------------ | ---------------------------------------------------- |
| **WebWorker**      | 브라우저 백그라운드 스레드 (메인 스레드 블로킹 방지) |
| **Memoization**    | 함수 결과 캐싱으로 재계산 방지 기법                  |
| **Chunking**       | 대용량 작업을 작은 단위로 분할 처리                  |
| **Lazy Loading**   | 필요 시점에 리소스를 지연 로드                       |
| **Code Splitting** | 번들을 작은 청크로 분할하여 초기 로드 최적화         |

---

## ML/AI

| 용어           | 정의                                               |
| -------------- | -------------------------------------------------- |
| **YOLO**       | You Only Look Once - 실시간 객체 탐지 모델         |
| **Detectron2** | Facebook AI 객체 탐지 프레임워크                   |
| **ONNX**       | Open Neural Network Exchange - ML 모델 교환 포맷   |
| **TensorRT**   | NVIDIA GPU 추론 최적화 엔진                        |
| **PyTorch**    | 딥러닝 프레임워크                                  |
| **OpenCV**     | 컴퓨터 비전 라이브러리                             |
| **PyMuPDF**    | PDF 파싱/렌더링 라이브러리                         |
| **PaddleOCR**  | 텍스트 인식(OCR) 라이브러리                        |
| **NMS**        | Non-Maximum Suppression - ML 후처리 중복 제거 기법 |
| **Inference**  | ML 모델 추론 (예측 실행)                           |

---

## DevOps/인프라

| 용어           | 정의                                                 |
| -------------- | ---------------------------------------------------- |
| **IaC**        | Infrastructure as Code - 인프라를 코드로 관리        |
| **Terraform**  | HashiCorp IaC 도구                                   |
| **Docker**     | 컨테이너 가상화 플랫폼                               |
| **K8s**        | Kubernetes - 컨테이너 오케스트레이션                 |
| **CI/CD**      | Continuous Integration/Deployment - 지속적 통합/배포 |
| **Blue-Green** | 무중단 배포 전략 (두 환경 전환)                      |
| **Prometheus** | 메트릭 수집 모니터링 시스템                          |
| **Grafana**    | 메트릭 시각화 대시보드                               |
| **RTO**        | Recovery Time Objective - 목표 복구 시간             |
| **RPO**        | Recovery Point Objective - 목표 복구 시점            |
| **Exporter**   | Prometheus 메트릭 수집기                             |

---

## 보안

| 용어              | 정의                                                  |
| ----------------- | ----------------------------------------------------- |
| **OWASP**         | Open Web Application Security Project - 웹 보안 표준  |
| **OWASP Top 10**  | 가장 흔한 웹 보안 취약점 10가지                       |
| **XSS**           | Cross-Site Scripting - 스크립트 삽입 공격             |
| **CSRF**          | Cross-Site Request Forgery - 요청 위조 공격           |
| **SQL Injection** | SQL 쿼리 삽입 공격                                    |
| **CORS**          | Cross-Origin Resource Sharing - 교차 출처 리소스 공유 |
| **HSTS**          | HTTP Strict Transport Security - HTTPS 강제 헤더      |
| **CSP**           | Content Security Policy - 콘텐츠 보안 정책            |
| **ClamAV**        | 오픈소스 악성코드 스캐너                              |
| **Rate Limiting** | API 요청 횟수 제한                                    |
| **Magic Bytes**   | 파일 헤더로 실제 파일 타입 검증                       |

---

## 관련 문서

| 문서                                       | 설명                        |
| ------------------------------------------ | --------------------------- |
| [ARCHITECTURE.md](./ARCHITECTURE.md)       | 시스템 구조, 패키지 설계    |
| [ROADMAP.md](./ROADMAP.md)                 | 개발 일정 및 마일스톤       |
| [DEV_GUIDE.md](./DEV_GUIDE.md)             | 개발 가이드 및 컨벤션       |
| [GIT_CONVENTIONS.md](./GIT_CONVENTIONS.md) | Git 워크플로우 및 커밋 규칙 |
