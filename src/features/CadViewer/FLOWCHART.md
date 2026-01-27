# CAD Viewer - Component Hierarchy & Execution Flow

> **Version**: 0.0.1
> **Last Updated**: 2025-12-30

## Component Hierarchy

```
CadViewerPage (src/pages/CADViewer/index.tsx)
    └── CADScene (src/features/CADViewer/components/CADScene.tsx)
        ├── Canvas (React Three Fiber)
        │   ├── PerspectiveCamera
        │   ├── OrbitControls
        │   ├── ambientLight
        │   ├── CADMesh ← 3D 렌더링
        │   │   └── lineSegments (레이어별)
        │   └── gridHelper
        ├── FileUpload ← HTML Overlay (top-left)
        ├── CADControls ← HTML Overlay (top-right)
        └── LayerPanel ← HTML Overlay (bottom-left)
```

---

## 전체 실행 흐름도

샘플 불러오기 버튼 클릭 시 데이터 흐름:

```
┌─────────────────────────────────────────────────────────────────┐
│                     1. 페이지 접근                               │
│  /cad-viewer 라우트 → CadViewerPage → CADScene 초기화           │
│  src/pages/CADViewer/index.tsx:11                               │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                 2. 샘플 불러오기 클릭                            │
│  FileUpload "샘플 불러오기" 버튼 → handleLoadSample()           │
│  src/features/CADViewer/components/FileUpload.tsx:208-219       │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                 3. 샘플 파일 Fetch                               │
│  fetch('/samples/dxf/*.dxf') → File 객체 생성                   │
│  src/features/CADViewer/components/CADScene.tsx:114-128         │
│  샘플 파일: public/samples/dxf/*.dxf (자동 스캔)                │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                 4. useDxfWorker 호출                             │
│  handleFileSelect() → parse(file)                               │
│  src/features/CADViewer/components/CADScene.tsx:71-95           │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                 5. WebWorker 생성 & 파싱                         │
│  useDxfWorker.parse():                                          │
│  - file.text() → DXF 텍스트 추출                                │
│  - WebWorker 생성 (dxfParser.worker.ts)                         │
│  - Worker에 parse 메시지 전송                                   │
│  src/features/CadViewer/hooks/useDxfWorker.ts:71-178            │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                 6. Worker 내부 DXF 파싱                          │
│  dxf-parser 라이브러리로 DXF 파싱:                              │
│  - LINE → ParsedLine[]                                          │
│  - CIRCLE → ParsedCircle[]                                      │
│  - ARC → ParsedArc[]                                            │
│  - POLYLINE → ParsedPolyline[]                                  │
│  - Layer 정보 추출 (ACI 색상 → Hex 변환)                        │
│  - BoundingBox 계산                                             │
│  src/features/CADViewer/workers/dxfParserV2.worker.ts           │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                 7. 메인 스레드에 결과 전달                        │
│  WorkerSuccessPayload:                                          │
│  { lines, circles, arcs, polylines, bounds, layers, metadata }  │
│  → setCadData(data) → setLayers(data.layers)                    │
│  → 카메라 거리 자동 계산                                        │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                 8. Geometry 변환                                 │
│  cadDataToGeometry():                                           │
│  - linesToGeometry() → BufferGeometry                           │
│  - circlesToGeometry() → EllipseCurve 기반                      │
│  - arcsToGeometry() → 호 각도 계산                              │
│  - polylinesToGeometry() → 정점 연결                            │
│  - LOD 적용 (엔티티 수에 따른 품질 조절)                        │
│  src/features/CADViewer/utils/dxfToGeometry.ts:206-257          │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                 9. CADMesh 렌더링                                │
│  레이어별로:                                                    │
│  - 데이터 필터링 → Geometry 생성 → Material 생성               │
│  - THREE.LineBasicMaterial (레이어 색상 적용)                   │
│  - lineSegments로 렌더링                                        │
│  src/features/CADViewer/components/CADMesh.tsx:89-189           │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                 10. Canvas 최종 출력                             │
│  React Three Fiber Canvas:                                      │
│  - PerspectiveCamera (자동 위치 조정)                           │
│  - OrbitControls (줌/회전 인터랙션)                             │
│  - ambientLight (균일 조명)                                     │
│  - gridHelper (그리드 표시)                                     │
│  src/features/CADViewer/components/CADScene.tsx:141-188         │
└─────────────────────────────────────────────────────────────────┘
```

---

## 데이터 타입 흐름

```
DXF 텍스트 파일
    ↓ (dxf-parser)
WorkerSuccessPayload {
    lines: ParsedLine[]
    circles: ParsedCircle[]
    arcs: ParsedArc[]
    polylines: ParsedPolyline[]
    bounds: BoundingBox
    layers: [string, LayerInfo][]
}
    ↓ (cadDataToGeometry)
THREE.BufferGeometry
    ↓ (CADMesh)
THREE.LineSegments (per layer)
    ↓ (Canvas)
화면 출력
```

---

## 핵심 Hook

| Hook         | 파일 위치             | 역할                        |
| ------------ | --------------------- | --------------------------- |
| useDxfWorker | hooks/useDxfWorker.ts | WebWorker로 DXF 비동기 파싱 |
| useDxfParser | hooks/useDxfParser.ts | 메인 스레드 파싱 (fallback) |
| useDxfLoader | hooks/useDxfLoader.ts | 파일 로딩 및 상태 관리      |

---

## 성능 최적화 포인트

1. **WebWorker 사용**: UI 블로킹 방지 (2MB 이상 파일)
2. **LOD (Level of Detail)**: 엔티티 수에 따른 원/호 품질 조절
    - < 1000: 64 세그먼트 (고품질)
    - 1000-5000: 32 세그먼트 (중간)
    - > 5000: 16 세그먼트 (저품질)
3. **레이어 필터링**: 보이는 레이어만 렌더링
4. **React.memo**: CADMesh 메모이제이션
5. **Geometry 정리**: unmount 시 dispose 호출

---

## 핵심 파일 경로 요약

| 역할            | 파일 경로                                           |
| --------------- | --------------------------------------------------- |
| 페이지 엔트리   | src/pages/CADViewer/index.tsx                       |
| 메인 씬         | src/features/CADViewer/components/CADScene.tsx      |
| 파일 업로드 UI  | src/features/CADViewer/components/FileUpload.tsx    |
| 3D 메시 렌더링  | src/features/CADViewer/components/CADMesh.tsx       |
| Worker 훅       | src/features/CadViewer/hooks/useDxfWorker.ts        |
| DXF 파싱 Worker | src/features/CadViewer/services/dxfParser.worker.ts |
| Geometry 변환   | src/utils/cad/dxfToGeometry.ts                      |
| 샘플 파일       | public/samples/dxf/\*.dxf (자동 스캔)               |
| 상수/설정       | src/features/CADViewer/constants.ts                 |

---

## Changelog (변경 이력)

| 버전  | 날짜       | 변경 내용                                                     |
| ----- | ---------- | ------------------------------------------------------------- |
| 0.0.1 | 2025-12-30 | 훅 네이밍 표준화 반영 (useDxfWorker, useDxfParser), 경로 수정 |
| 0.0.0 | 2025-12-15 | 초기 문서 생성 - 컴포넌트 계층 및 실행 흐름도                 |
