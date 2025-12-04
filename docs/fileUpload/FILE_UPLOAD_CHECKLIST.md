# 구현 체크리스트

> **Version**: 0.0.1
> **Last Updated**: 2025-12-04

> **관련 문서**
>
> - [파일 업로드 아키텍처](./FILE_UPLOAD_ARCHITECTURE.md) - 시스템 다이어그램
> - [Queue vs Direct Call 분석](./FILE_UPLOAD_QUEUE_DECISION.md) - 아키텍처 선택 이유
> - [Phase 2A DXF Viewer](../phases/02-CadFeatures/2A_DXF_VIEWER.md) - 프론트엔드 구현
> - ROADMAP Phase 3.3 참조

## 목차

1. [Backend API](#1-backend-api)
2. [DXF Worker (벡터 파이프라인)](#2-dxf-worker-벡터-파이프라인)
3. [PDF Worker (ML 파이프라인)](#3-pdf-worker-ml-파이프라인)
4. [Frontend](#4-frontend)
5. [인프라](#5-인프라)
6. [Changelog (변경 이력)](#changelog-변경-이력)

---

## 1. Backend API

### 공통

- [ ] POST `/api/upload` - 파일 업로드 엔드포인트
- [ ] GET `/api/status/{job_id}` - 상태 조회 엔드포인트
- [ ] 파일 검증
  - [ ] 파일 크기 제한 (max 500MB)
  - [ ] MIME 타입 검증 (application/pdf, application/dxf)
  - [ ] 악성코드 스캔 (ClamAV)
- [ ] Temp Storage 저장 (MinIO/S3)
- [ ] DB 상태 관리 (PostgreSQL)
- [ ] Queue 메시지 발행 (SQS/RabbitMQ)

### Java (Spring Boot) - 주요 구현

- [ ] Spring Boot 프로젝트 구조 설정
- [ ] DTO/Entity 클래스 정의
- [ ] JPA Repository 설정
- [ ] MinIO Client 설정
- [ ] Spring AMQP 설정

---

## 2. DXF Worker (벡터 파이프라인)

### Stage 1: DXF 파싱

- [ ] ezdxf 라이브러리 설정
- [ ] 헤더 정보 추출 (단위, 스케일)
- [ ] 레이어 정보 추출 (색상, 라인타입)
- [ ] 엔티티 파싱
  - [ ] LINE 엔티티
  - [ ] ARC 엔티티
  - [ ] CIRCLE 엔티티
  - [ ] LWPOLYLINE 엔티티
  - [ ] POLYLINE 엔티티

### Stage 2: 엔티티 변환

- [ ] LINE → LineSegment (시작점, 끝점)
- [ ] ARC → Curve (세그먼트 분할)
- [ ] CIRCLE → Curve (360° 세그먼트)
- [ ] POLYLINE → Path 변환
- [ ] Bulge 처리 (곡선 세그먼트)

### Stage 3: 2D → 3D 압출

- [ ] Z=0 평면 → 높이(h) 압출
- [ ] 벽체 두께(t) 적용 (박스 생성)
- [ ] 원형 요소 → 실린더 생성
- [ ] 레이어별 높이/재질 매핑
- [ ] 버텍스 인덱스 최적화

### Stage 4: glTF 생성

- [ ] pygltflib 설정
- [ ] Mesh 생성 (엔티티별)
- [ ] Material 설정 (ACI 색상 → RGB)
- [ ] Scene 구성
- [ ] glb 바이너리 출력

### Worker 통합

- [ ] S3에서 원본 파일 다운로드
- [ ] 파이프라인 실행
- [ ] S3에 결과 업로드
- [ ] DB 상태 업데이트 (COMPLETED/FAILED)
- [ ] 오류 처리 및 로깅

---

## 3. PDF Worker (ML 파이프라인)

### Stage 1: PDF 파싱

- [ ] PyMuPDF(fitz) 설정
- [ ] 페이지별 이미지 렌더링 (300 DPI)
- [ ] 벡터 정보 추출 (있는 경우)
- [ ] 메타데이터 추출 (페이지 크기, 스케일)

### Stage 2: 전처리 (OpenCV)

- [ ] 그레이스케일 변환
- [ ] 기울기 교정 (Hough Transform)
- [ ] 이진화 (Adaptive Thresholding)
- [ ] 노이즈 제거 (Morphological Operations)
- [ ] 타일링 (4096x4096 분할)

### Stage 3: ML 추론

- [ ] YOLO/Detectron2 모델 설정
- [ ] ONNX Runtime / TensorRT 가속
- [ ] 도면 요소 탐지
  - [ ] wall (벽)
  - [ ] door (문)
  - [ ] window (창문)
  - [ ] column (기둥)
  - [ ] stair (계단)
- [ ] Bounding Box + Confidence 추출

### Stage 4: 후처리

- [ ] NMS (Non-Maximum Suppression)
- [ ] 좌표 정규화 (픽셀 → 실제 단위)
- [ ] 요소 연결 (인접 벽 병합)
- [ ] Vertices 배열 생성
- [ ] Indices 배열 생성

### Stage 5: glTF 생성

- [ ] pygltflib 설정
- [ ] Mesh 생성 (요소별 3D 모델)
- [ ] Material 설정 (요소 타입별 색상)
- [ ] Scene 구성
- [ ] glb 바이너리 출력

### Worker 통합

- [ ] S3에서 원본 파일 다운로드
- [ ] 파이프라인 실행
- [ ] S3에 결과 업로드
- [ ] DB 상태 업데이트 (COMPLETED/FAILED)
- [ ] 오류 처리 및 로깅

---

## 4. Frontend

### 파일 업로드

- [ ] FileUpload 컴포넌트 구현
- [ ] Drag & Drop 지원
- [ ] 파일 타입 필터 (.dxf, .pdf)
- [ ] 업로드 진행률 표시
- [ ] 에러 핸들링

### 상태 폴링

- [ ] React Query 또는 SWR 설정
- [ ] 2초 간격 폴링
- [ ] 완료/실패 시 폴링 중단
- [ ] 상태별 UI 표시
  - [ ] PENDING: 대기 중
  - [ ] PROCESSING: 변환 중
  - [ ] COMPLETED: 완료
  - [ ] FAILED: 실패

### 3D 뷰어

- [ ] Three.js GLTFLoader 설정
- [ ] React Three Fiber 컴포넌트
- [ ] OrbitControls 설정
- [ ] 조명 설정 (Ambient + Directional)
- [ ] 그리드 헬퍼
- [ ] 모델 중심으로 카메라 이동
- [ ] 모델 정보 표시 (정점 수, 삼각형 수)

---

## 5. 인프라

### 스토리지

- [ ] S3/MinIO 버킷 생성
  - [ ] temp/ 폴더 (24h TTL 정책)
  - [ ] results/ 폴더
- [ ] CORS 정책 설정
- [ ] CDN 설정 (CloudFront)

### 메시지 큐

- [ ] SQS/RabbitMQ 큐 생성
- [ ] Dead Letter Queue 설정
- [ ] 재시도 정책 설정

### 데이터베이스

- [ ] PostgreSQL 스키마 생성
  - [ ] upload_sessions 테이블
  - [ ] dxf_analysis_results 테이블 (옵션)
  - [ ] ml_analysis_results 테이블 (옵션)
- [ ] 인덱스 설정 (job_id, status)

### Worker 배포

- [ ] Lambda/Cloud Functions 설정
- [ ] 컨테이너 이미지 빌드
- [ ] GPU 인스턴스 설정 (ML Worker)
- [ ] 환경 변수 설정
- [ ] 로깅 설정 (CloudWatch)

### 모니터링

- [ ] API 응답 시간 모니터링
- [ ] Worker 처리 시간 모니터링
- [ ] 에러율 알림 설정
- [ ] 큐 백로그 모니터링

---

## 관련 Phase

| Phase | 내용 | 상태 |
| ----- | ---- | ---- |
| Phase 2A | DXF CAD Viewer (프론트엔드) | ✅ 완료 |
| Phase 3.3 | CAD 변환 엔진 (백엔드) | 📋 계획 |
| Phase 2B | PDF CAD Viewer | 📋 대기 |

---

## Changelog (변경 이력)

| 버전  | 날짜       | 변경 내용                                                    |
| ----- | ---------- | ------------------------------------------------------------ |
| 0.0.1 | 2025-12-04 | 삭제된 PHASE_DEV_DOC_GUIDE.md 참조 제거                       |
| 0.0.0 | 2025-12-03 | 초기 버전, 구현 체크리스트 문서화                             |
