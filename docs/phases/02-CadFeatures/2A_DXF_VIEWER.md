# Phase 2A: DXF CAD Viewer Implementation

> **Version**: 0.0.2
> **Created**: 2025-12-01
> **Last Updated**: 2025-12-02
> **Status**: 🔄 진행 중 (80%)
> **Dependencies**: Phase 1.5 완료 ✅
>
> 📚 **작성 규칙**: [PHASE_DEV_DOC_GUIDE.md](../templates/PHASE_DEV_DOC_GUIDE.md) 참조

---

## Table of Contents (목차)

- [1. Overview (개요)](#1-overview-개요)
- [2. Architecture (아키텍처)](#2-architecture-아키텍처)
- [3. Implementation Checklist (구현 체크리스트)](#3-implementation-checklist-구현-체크리스트)
- [4. Key Implementation Details (핵심 구현 상세)](#4-key-implementation-details-핵심-구현-상세)
- [5. Testing Strategy (테스트 전략)](#5-testing-strategy-테스트-전략)
- [6. Dependencies & References (의존성 및 참조)](#6-dependencies--references-의존성-및-참조)
- [7. Routes & Navigation (라우트 및 네비게이션)](#7-routes--navigation-라우트-및-네비게이션)
- [8. Usage Guide (사용 가이드)](#8-usage-guide-사용-가이드)
- [9. Changelog (변경 이력)](#9-changelog-변경-이력)
- [10. Post-Completion Checklist (완료 후 체크리스트)](#10-post-completion-checklist-완료-후-체크리스트)

---

## Phase Progress (진행 상황)

| Sub-Phase | 상태 | 설명                                        |
| --------- | ---- | ------------------------------------------- |
| 2A.1      | ✅   | MVP - LINE 엔티티, 파일 업로드, 기본 렌더링 |
| 2A.2      | ✅   | CIRCLE, ARC, POLYLINE 엔티티 확장           |
| 2A.3      | ✅   | 레이어별 색상/가시성 토글                   |
| 2A.4      | ✅   | 성능 최적화 (Geometry 머징, WebWorker, LOD) |
| 2A.5      | 📋   | Unit 테스트 (Vitest)                        |

---

## 1. Overview (개요)

### 1.1 목표

프론트엔드에서 DXF 파일을 파싱하여 3D 와이어프레임으로 렌더링 (백엔드 불필요)

### 1.2 MVP 범위

| 항목          | MVP 범위              | 확장 단계                |
| ------------- | --------------------- | ------------------------ |
| **파일 형식** | DXF (ASCII)           | DWG, PDF (Phase 2B)      |
| **엔티티**    | LINE                  | ARC, CIRCLE, POLYLINE ✅ |
| **레이어**    | 단일 레이어           | 레이어별 색상/가시성 ✅  |
| **UI**        | 파일 업로드 + 3D 뷰어 | 레이어 패널, 측정 도구   |
| **성능**      | 기본                  | WebWorker, LOD ✅        |

### 1.3 기술적 제약

- DXF ASCII 형식만 지원 (바이너리 DXF 미지원)
- 파일 크기 제한: 20MB
- WebWorker 사용 조건: 파일 > 2MB

---

## 2. Architecture (아키텍처)

### 2.1 디렉토리 구조

```
src/features/CADViewer/
├── index.ts                    # Public exports
├── types.ts                    # 타입 정의
├── constants.ts                # 설정 상수
├── components/
│   ├── index.ts
│   ├── CADScene.tsx            # 메인 3D 씬 (TeapotScene 패턴)
│   ├── CADMesh.tsx             # 지오메트리 렌더러
│   ├── CADControls.tsx         # 뷰어 컨트롤 패널
│   ├── FileUpload.tsx          # 파일 업로드 컴포넌트
│   └── LayerPanel.tsx          # 레이어 패널 UI
├── hooks/
│   ├── index.ts
│   ├── useDXFParser.ts         # DXF 파싱 훅
│   └── useDXFWorker.ts         # WebWorker 파싱 훅
├── utils/
│   ├── index.ts
│   ├── dxfToGeometry.ts        # DXF → Three.js 변환
│   └── validators.ts           # 파일 유효성 검사
└── workers/
    ├── index.ts
    └── dxfParserV2.worker.ts   # DXF 파싱 WebWorker

src/pages/CADViewer/
└── index.tsx                   # 페이지 컴포넌트

src/types/
└── dxf-parser.d.ts             # dxf-parser 타입 정의

public/samples/
└── simple-room.dxf             # 테스트용 샘플 파일

tests/
├── fixtures/dxf/               # 성능 테스트용 DXF 파일
└── scripts/                    # 테스트 스크립트
```

### 2.2 컴포넌트 계층

```
CADViewerPage                          [custom] 페이지 컴포넌트
└── CADScene                           [custom] 씬 컨테이너
    ├── Canvas                         [@react-three/fiber] 3D 캔버스
    │   ├── PerspectiveCamera          [@react-three/drei] 원근 카메라
    │   ├── OrbitControls              [@react-three/drei] 궤도 컨트롤
    │   ├── ambientLight               [R3F built-in] 환경광
    │   ├── gridHelper                 [R3F built-in] 바닥 그리드
    │   └── CADMesh                    [custom] CAD 지오메트리
    │       └── lineSegments           [R3F built-in] 와이어프레임
    ├── FileUpload                     [custom / HTML] 파일 업로드 영역
    ├── CADControls                    [custom / HTML] 설정 패널
    └── LayerPanel                     [custom / HTML] 레이어 토글
```

**범례:**

- `[custom]` - 직접 구현한 컴포넌트
- `[@react-three/fiber]` - R3F 코어
- `[@react-three/drei]` - R3F 헬퍼 라이브러리
- `[R3F built-in]` - Three.js 객체

### 2.3 데이터 흐름

```
File Drop → FileUpload → useDXFParser → ParsedCADData → CADMesh → Three.js Render
                              ↓
                        (파일 > 2MB)
                              ↓
                        useDXFWorker (WebWorker)

상태 흐름:
1. File → text() → dxf-parser
2. entities → ParsedLine/Circle/Arc/Polyline
3. cadDataToGeometry() → BufferGeometry
4. <lineSegments> → Three.js 렌더링
```

---

## 3. Implementation Checklist (구현 체크리스트)

### 3.1 Phase 2A.1: MVP (LINE 엔티티)

- [✅] dxf-parser 패키지 설치
- [✅] CADViewer 폴더 구조 생성
- [✅] 라우트 및 메뉴 아이템 추가 (`/cad-viewer`)
- [✅] types.ts 및 constants.ts 작성
- [✅] validators.ts (파일 유효성 검사) 작성
- [✅] dxfToGeometry.ts (DXF→Three.js 변환) 작성
- [✅] useDXFParser.ts 훅 작성
- [✅] FileUpload.tsx 컴포넌트 작성
- [✅] CADMesh.tsx 컴포넌트 작성
- [✅] CADScene.tsx 컴포넌트 작성
- [✅] dxf-parser.d.ts 타입 정의 추가
- [✅] 테스트용 샘플 DXF 파일 생성

### 3.2 Phase 2A.2: 엔티티 확장

- [✅] ParsedCircle, ParsedArc, ParsedPolyline 타입 추가
- [✅] CIRCLE 파싱 및 렌더링 (THREE.EllipseCurve)
- [✅] ARC 파싱 및 렌더링 (degree→radian 변환)
- [✅] POLYLINE/LWPOLYLINE 파싱 및 렌더링 (closed 처리)
- [✅] cadDataToGeometry 통합 함수

### 3.3 Phase 2A.3: 레이어 기능

- [✅] LayerInfo 타입 정의
- [✅] 레이어 파싱 로직 추가
- [✅] LayerPanel UI 컴포넌트
- [✅] 레이어별 렌더링 적용
- [✅] DXF 색상 매핑 (ACI 1-9)

### 3.4 Phase 2A.4: 성능 최적화

- [✅] Geometry 머징 (mergeBufferGeometries + 메모리 정리)
- [✅] WebWorker 파싱 (대용량 파일 > 2MB)
- [✅] LOD (Level of Detail) - 엔티티 수 기반 자동 세그먼트 조절

### 3.5 Phase 2A.5: Unit 테스트

- [ ] DXF 파서 유틸리티 테스트
- [ ] 지오메트리 변환 로직 테스트
- [ ] 파일 검증 로직 테스트
- [ ] 테스트 커버리지 70% 달성

---

## 4. Key Implementation Details (핵심 구현 상세)

### 4.1 핵심 코드 패턴

#### 타입 정의

```typescript
// types.ts
export interface Point3D {
    x: number;
    y: number;
    z: number;
}

export interface ParsedLine {
    start: Point3D;
    end: Point3D;
    layer?: string;
}

export interface ParsedCircle {
    center: Point3D;
    radius: number;
    layer?: string;
}

export interface ParsedArc {
    center: Point3D;
    radius: number;
    startAngle: number; // degree
    endAngle: number; // degree
    layer?: string;
}

export interface ParsedPolyline {
    vertices: Point3D[];
    closed: boolean;
    layer?: string;
}

export interface LayerInfo {
    name: string;
    color: string;
    visible: boolean;
    entityCount: number;
}

export interface ParsedCADData {
    lines: ParsedLine[];
    circles: ParsedCircle[];
    arcs: ParsedArc[];
    polylines: ParsedPolyline[];
    layers: LayerInfo[];
    bounds: BoundingBox;
    metadata: CADMetadata;
}
```

#### 상수 정의

```typescript
// constants.ts
export const FILE_LIMITS = {
    MAX_SIZE_BYTES: 20 * 1024 * 1024, // 20MB
    WARNING_SIZE_BYTES: 5 * 1024 * 1024, // 5MB 경고
    WORKER_THRESHOLD_BYTES: 2 * 1024 * 1024, // 2MB → WebWorker 사용
    ACCEPTED_EXTENSIONS: ['.dxf'],
} as const;

export const LOD_CONFIG = {
    HIGH_QUALITY_SEGMENTS: 64, // 엔티티 < 1000
    MEDIUM_QUALITY_SEGMENTS: 32, // 엔티티 1000-5000
    LOW_QUALITY_SEGMENTS: 16, // 엔티티 > 5000
} as const;

export const DXF_COLOR_MAP: Record<number, string> = {
    1: '#ff0000', // Red
    2: '#ffff00', // Yellow
    3: '#00ff00', // Green
    4: '#00ffff', // Cyan
    5: '#0000ff', // Blue
    6: '#ff00ff', // Magenta
    7: '#ffffff', // White
    8: '#808080', // Gray
    9: '#c0c0c0', // Light Gray
};
```

#### DXF 파싱 훅 패턴

```typescript
// hooks/useDXFParser.ts
export function useDXFParser() {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const parse = useCallback(async (file: File): Promise<ParsedCADData> => {
        setIsLoading(true);
        setError(null);

        try {
            const text = await file.text();
            const parser = new DxfParser();
            const dxf = parser.parseSync(text);

            const lines = dxf.entities
                .filter((e) => e.type === 'LINE')
                .map((e) => ({
                    start: {
                        x: e.vertices[0].x,
                        y: e.vertices[0].y,
                        z: e.vertices[0].z ?? 0,
                    },
                    end: {
                        x: e.vertices[1].x,
                        y: e.vertices[1].y,
                        z: e.vertices[1].z ?? 0,
                    },
                    layer: e.layer,
                }));

            // ... circles, arcs, polylines 파싱

            return {
                lines,
                circles,
                arcs,
                polylines,
                layers,
                bounds,
                metadata,
            };
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Parse error';
            setError(message);
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, []);

    return { parse, isLoading, error, clearError: () => setError(null) };
}
```

#### 지오메트리 변환 패턴

```typescript
// utils/dxfToGeometry.ts
export function cadDataToGeometry(
    data: ParsedCADData,
    visibleLayers: Set<string>,
    segments?: number
): THREE.BufferGeometry {
    const geometries: THREE.BufferGeometry[] = [];
    const seg = segments ?? getLODSegments(getTotalEntityCount(data));

    // Lines
    geometries.push(linesToGeometry(filterByLayer(data.lines, visibleLayers)));

    // Circles
    geometries.push(
        circlesToGeometry(filterByLayer(data.circles, visibleLayers), seg)
    );

    // Arcs
    geometries.push(
        arcsToGeometry(filterByLayer(data.arcs, visibleLayers), seg)
    );

    // Polylines
    geometries.push(
        polylinesToGeometry(filterByLayer(data.polylines, visibleLayers))
    );

    // Merge all geometries
    const merged = mergeBufferGeometries(
        geometries.filter((g) => g.attributes.position?.count > 0)
    );

    // Cleanup
    geometries.forEach((g) => g.dispose());

    return merged ?? new THREE.BufferGeometry();
}
```

#### CIRCLE → Three.js

```typescript
export function circlesToGeometry(
    circles: ParsedCircle[],
    segments = 64
): THREE.BufferGeometry {
    const vertices: number[] = [];

    for (const circle of circles) {
        const curve = new THREE.EllipseCurve(
            circle.center.x,
            circle.center.y,
            circle.radius,
            circle.radius,
            0,
            Math.PI * 2,
            false,
            0
        );
        const points = curve.getPoints(segments);

        for (let i = 0; i < points.length - 1; i++) {
            vertices.push(points[i].x, points[i].y, circle.center.z);
            vertices.push(points[i + 1].x, points[i + 1].y, circle.center.z);
        }
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
        'position',
        new THREE.Float32BufferAttribute(vertices, 3)
    );
    return geometry;
}
```

#### ARC → Three.js (degree → radian)

```typescript
export function arcsToGeometry(
    arcs: ParsedArc[],
    segments = 64
): THREE.BufferGeometry {
    const vertices: number[] = [];

    for (const arc of arcs) {
        const startRad = (arc.startAngle * Math.PI) / 180;
        let endRad = (arc.endAngle * Math.PI) / 180;
        if (endRad < startRad) endRad += Math.PI * 2;

        const curve = new THREE.EllipseCurve(
            arc.center.x,
            arc.center.y,
            arc.radius,
            arc.radius,
            startRad,
            endRad,
            false,
            0
        );
        // ... points to vertices
    }

    return geometry;
}
```

### 4.2 설정 및 상수

| 상수명                    | 값   | 설명                           |
| ------------------------- | ---- | ------------------------------ |
| `MAX_SIZE_BYTES`          | 20MB | 최대 파일 크기                 |
| `WORKER_THRESHOLD_BYTES`  | 2MB  | WebWorker 사용 기준            |
| `HIGH_QUALITY_SEGMENTS`   | 64   | 원/호 세그먼트 (엔티티 < 1000) |
| `MEDIUM_QUALITY_SEGMENTS` | 32   | 원/호 세그먼트 (1000-5000)     |
| `LOW_QUALITY_SEGMENTS`    | 16   | 원/호 세그먼트 (> 5000)        |

---

## 5. Testing Strategy (테스트 전략)

### 5.1 Unit Tests

**테스트 대상:**

- [ ] `validators.ts` - 파일 타입/크기 검증
- [ ] `dxfToGeometry.ts` - 각 엔티티 변환 함수
- [ ] `useDXFParser.ts` - 파싱 로직

**테스트 파일 위치:**

```
tests/features/CADViewer/
├── validators.test.ts
├── dxfToGeometry.test.ts
└── useDXFParser.test.ts
```

**테스트 예시:**

```typescript
describe('linesToGeometry', () => {
    it('should convert ParsedLine[] to BufferGeometry', () => {
        const lines: ParsedLine[] = [
            { start: { x: 0, y: 0, z: 0 }, end: { x: 10, y: 0, z: 0 } },
        ];
        const geometry = linesToGeometry(lines);
        expect(geometry.attributes.position.count).toBe(2);
    });

    it('should handle empty array', () => {
        const geometry = linesToGeometry([]);
        expect(geometry.attributes.position.count).toBe(0);
    });
});
```

### 5.2 Integration Tests

- [ ] 파일 업로드 → 렌더링 E2E 테스트
- [ ] 레이어 토글 기능 테스트
- [ ] WebWorker 파싱 테스트

### 5.3 검증 체크리스트

| 검증 항목                       | 방법                 | 상태    |
| ------------------------------- | -------------------- | ------- |
| DXF 파일 업로드                 | 수동 확인            | ✅      |
| LINE/CIRCLE/ARC/POLYLINE 렌더링 | 수동 확인            | ✅      |
| 레이어 토글                     | 수동 확인            | ✅      |
| OrbitControls 조작              | 수동 확인            | ✅      |
| 파일 크기 제한 (20MB)           | 수동 확인            | ✅      |
| WebWorker (> 2MB)               | 수동 확인            | ✅      |
| 타입 체크                       | `npm run type-check` | ✅      |
| 린트                            | `npm run lint`       | ✅      |
| 단위 테스트                     | `npm run test`       | 📋 TODO |

---

## 6. Dependencies & References (의존성 및 참조)

### 6.1 필수 패키지

| 패키지               | 버전     | 용도                  |
| -------------------- | -------- | --------------------- |
| `dxf-parser`         | ^1.1.2   | DXF 파일 파싱 (ASCII) |
| `three`              | ^0.181.0 | 3D 렌더링             |
| `@react-three/fiber` | ^8.x     | React Three.js 통합   |
| `@react-three/drei`  | ^9.x     | OrbitControls 등      |

### 6.2 참조 문서

| 문서                                               | 역할               |
| -------------------------------------------------- | ------------------ |
| [Phase 1.5 Teapot](../01-foundation/1.5-teapot.md) | 컴포넌트 패턴 참조 |
| [DEV_GUIDE.md](../../DEV_GUIDE.md)                 | 개발 컨벤션        |
| [ARCHITECTURE.md](../../ARCHITECTURE.md)           | 시스템 아키텍처    |

### 6.3 관련 Phase

| Phase     | 관계 | 설명                     |
| --------- | ---- | ------------------------ |
| Phase 1.5 | 의존 | Teapot 패턴 완료 후 시작 |
| Phase 2B  | 후속 | PDF 뷰어 (백엔드 필요)   |
| Phase 3   | 연관 | 백엔드 API 연동          |

---

## 7. Routes & Navigation (라우트 및 네비게이션)

| Path          | Component     | Description          |
| ------------- | ------------- | -------------------- |
| `/cad-viewer` | CADViewerPage | CAD 뷰어 메인 페이지 |

---

## 8. Usage Guide (사용 가이드)

### 8.1 개발 서버 실행

```bash
npm run dev
```

### 8.2 브라우저 접속

```
http://localhost:3000/cad-viewer
```

### 8.3 사용법

1. 좌측 상단 업로드 영역에 DXF 파일 드래그 앤 드롭
2. 또는 클릭하여 파일 선택
3. 3D 와이어프레임 렌더링 확인
4. 마우스로 회전/확대/이동 조작
5. 우측 레이어 패널에서 레이어별 표시/숨김

---

## 9. Changelog (변경 이력)

| 버전  | 날짜       | 변경 내용                                                                          |
| ----- | ---------- | ---------------------------------------------------------------------------------- |
| 0.0.0 | 2025-12-01 | 2A.1~2A.4 구현 완료                                                                |
| 0.0.1 | 2025-12-02 | 템플릿 적용 (Language Guidelines, TOC, 섹션 제목 영어(한국어) 형식, 체크리스트 ✅) |
| 0.0.2 | 2025-12-02 | 버전 가이드라인 적용 (0.0.x), Section 10 추가                                      |

---

## 10. Post-Completion Checklist (완료 후 체크리스트)

개발 완료 시 Claude가 아래 문서들의 업데이트를 자동으로 제안합니다.

### 10.1 연관 문서 업데이트 (Claude 자동 제안)

| 문서                             | 업데이트 내용                                     |
| -------------------------------- | ------------------------------------------------- |
| `docs/phases/PHASE_NAV_GUIDE.md` | Phase 문서 링크, 상태, 진행률 업데이트            |
| `docs/ROADMAP.md`                | Phase 상태 (🔄→✅), 진행률, Milestones, 변경 이력 |
| `docs/GLOSSARY.md`               | 새로운 용어/약어 추가                             |
| `docs/ARCHITECTURE.md`           | 패키지 구조, 레이어별 역할, 관련 문서 링크        |
| `README.md`                      | 현재 상태, 구현 완료 기능, 개발 예정 목록         |

### 10.2 업데이트 프로세스

1. **구현 완료** → Claude가 "연관 문서 업데이트할까요?" 제안
2. **변경 내용 미리보기** → 각 문서별 수정될 내용 표시
3. **승인** → 사용자 확인 후 일괄 업데이트

---

_Phase 2A Implementation - Created: 2025-12-01_
