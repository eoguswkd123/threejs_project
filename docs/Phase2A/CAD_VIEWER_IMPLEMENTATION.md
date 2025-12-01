# Phase 2A: CAD Viewer 구현 문서

> **문서 버전**: 2A.3
> **생성일**: 2025-12-01
> **최종 수정**: 2025-12-01
> **목표**: DXF 파일 업로드 → Three.js 와이어프레임 렌더링 (프론트엔드 전용)

---

## Phase 진행 상태

| Phase    | 상태    | 설명                                        |
| -------- | ------- | ------------------------------------------- |
| **2A.1** | ✅ 완료 | MVP - LINE 엔티티, 파일 업로드, 기본 렌더링 |
| **2A.2** | ✅ 완료 | CIRCLE, ARC, POLYLINE 엔티티 확장           |
| **2A.3** | ✅ 완료 | 레이어별 색상/가시성 토글                   |
| **2A.4** | ✅ 완료 | 성능 최적화                                 |

---

## 1. 개요

### 1.1 목표

- 프론트엔드에서 DXF 파일을 파싱하여 3D 와이어프레임으로 렌더링
- 기존 TeapotDemo 패턴을 따라 CADViewer 기능 구현
- 최소 MVP로 시작하여 점진적 확장

### 1.2 MVP 범위 (최소)

| 항목          | MVP 범위              | 확장 단계              |
| ------------- | --------------------- | ---------------------- |
| **파일 형식** | DXF (ASCII)           | DWG, PDF               |
| **엔티티**    | LINE만                | ARC, CIRCLE, POLYLINE  |
| **레이어**    | 단일 레이어           | 레이어별 색상/가시성   |
| **UI**        | 파일 업로드 + 3D 뷰어 | 레이어 패널, 측정 도구 |

---

## 2. 구현 체크리스트

### 2.1 MVP (Phase 2A.1) ✅

- ✅ dxf-parser 패키지 설치
- ✅ CADViewer 폴더 구조 생성
- ✅ 라우트 및 메뉴 아이템 추가
- ✅ types.ts 및 constants.ts 작성
- ✅ validators.ts (파일 유효성 검사) 작성
- ✅ dxfToGeometry.ts (DXF→Three.js 변환) 작성
- ✅ useDXFParser.ts 훅 작성
- ✅ FileUpload.tsx 컴포넌트 작성
- ✅ CADMesh.tsx 컴포넌트 작성
- ✅ CADScene.tsx 컴포넌트 작성
- ✅ CADViewer 페이지 및 index.ts 작성
- ✅ dxf-parser.d.ts 타입 정의 추가
- ✅ 테스트용 샘플 DXF 파일 생성
- ✅ DXF 파일 드래그앤드롭 업로드
- ✅ 파일 타입/크기 검증
- ✅ LINE 엔티티 파싱
- ✅ Three.js 와이어프레임 렌더링
- ✅ OrbitControls로 뷰 조작
- ✅ 에러 처리 및 메시지 표시
- ✅ 타입 체크 통과

### 2.2 Phase 2A.2: 엔티티 확장 ✅

- ✅ ParsedCircle, ParsedArc, ParsedPolyline 타입 추가
- ✅ CIRCLE 파싱 및 렌더링
- ✅ ARC 파싱 및 렌더링 (degree→radian 변환)
- ✅ POLYLINE/LWPOLYLINE 파싱 및 렌더링
- ✅ cadDataToGeometry 통합 함수
- ✅ 타입 체크 통과

### 2.3 Phase 2A.3: 레이어 기능 ✅

- ✅ LayerInfo 타입 정의
- ✅ 레이어 파싱 로직 추가
- ✅ LayerPanel UI 컴포넌트
- ✅ 레이어별 렌더링 적용
- ✅ DXF 색상 매핑 (ACI 1-9)
- ✅ 타입 체크 통과

### 2.4 Phase 2A.4: 성능 최적화 ✅

- ✅ Geometry 머징 (mergeBufferGeometries + 메모리 정리)
- ✅ WebWorker 파싱 (대용량 파일 > 2MB)
- ✅ LOD (Level of Detail) - 엔티티 수 기반 자동 세그먼트 조절

### 2.5 Phase 2B: 백엔드 연동 ⏳

- ⏳ 파일 업로드 API
- ⏳ DWG 지원 (백엔드 변환)
- ⏳ PDF 지원 (ML 기반)

---

## 3. 기술 스택

### 3.1 필수 의존성

```bash
npm install dxf-parser
```

| 패키지               | 버전   | 용도                  |
| -------------------- | ------ | --------------------- |
| `dxf-parser`         | ^1.1.2 | DXF 파일 파싱 (ASCII) |
| `three`              | 기존   | 3D 렌더링             |
| `@react-three/fiber` | 기존   | React Three.js 통합   |
| `@react-three/drei`  | 기존   | OrbitControls 등      |

### 3.2 파일 제한

```typescript
export const FILE_LIMITS = {
    MAX_SIZE_BYTES: 20 * 1024 * 1024, // 20MB
    WARNING_SIZE_BYTES: 5 * 1024 * 1024, // 5MB 경고
    ACCEPTED_EXTENSIONS: ['.dxf'],
} as const;
```

---

## 4. 디렉토리 구조

```
src/features/CADViewer/
├── index.ts                    # 모듈 exports
├── types.ts                    # 타입 정의
├── constants.ts                # 설정 상수
├── components/
│   ├── index.ts
│   ├── CADScene.tsx           # 메인 3D 씬 (TeapotScene 패턴)
│   ├── CADMesh.tsx            # 지오메트리 렌더러 (TeapotMesh 패턴)
│   ├── CADControls.tsx        # 뷰어 컨트롤 패널
│   └── FileUpload.tsx         # 파일 업로드 컴포넌트
├── hooks/
│   ├── index.ts
│   └── useDXFParser.ts        # DXF 파싱 훅
└── utils/
    ├── index.ts
    ├── dxfToGeometry.ts       # DXF → Three.js 변환
    └── validators.ts          # 파일 유효성 검사

src/pages/CADViewer/
└── index.tsx                   # 페이지 컴포넌트

src/types/
└── dxf-parser.d.ts            # dxf-parser 타입 정의

public/samples/
└── simple-room.dxf            # 테스트용 샘플 파일
```

---

## 5. 구현 단계

### Step 1: 프로젝트 설정 ✅

1. `dxf-parser` 설치
2. CADViewer 폴더 구조 생성
3. 라우트 추가 (`/cad-viewer`)
4. 메뉴 아이템 추가

**수정 파일:**

- `package.json` - dxf-parser 추가
- `src/constants/routes.ts` - CAD_VIEWER 라우트
- `src/constants/menu.ts` - 메뉴 아이템
- `src/routes/root.tsx` - 라우트 등록

### Step 2: 타입 및 상수 정의 ✅

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

export interface ParsedCADData {
    lines: ParsedLine[];
    bounds: BoundingBox;
    metadata: CADMetadata;
}

export interface CADViewerConfig {
    showGrid: boolean;
    wireframeColor: string;
    backgroundColor: string;
    autoFitCamera: boolean;
}
```

### Step 3: 파일 업로드 컴포넌트 ✅

```typescript
// components/FileUpload.tsx
- 드래그 앤 드롭 존
- 파일 타입 검증 (.dxf만)
- 파일 크기 검증 (< 5MB)
- 에러 메시지 표시
- 로딩 상태 표시
```

### Step 4: DXF 파싱 훅 ✅

```typescript
// hooks/useDXFParser.ts
import DxfParser from 'dxf-parser';

export function useDXFParser() {
    const parse = useCallback(async (file: File): Promise<ParsedCADData> => {
        const text = await file.text();
        const parser = new DxfParser();
        const dxf = parser.parseSync(text);

        // LINE 엔티티만 추출
        const lines = dxf.entities
            .filter((e) => e.type === 'LINE')
            .map((e) => ({
                start: { x: e.start.x, y: e.start.y, z: e.start.z ?? 0 },
                end: { x: e.end.x, y: e.end.y, z: e.end.z ?? 0 },
            }));

        return { lines, bounds: calculateBounds(lines), metadata };
    }, []);

    return { parse, isLoading, error, clearError };
}
```

### Step 5: DXF → Three.js 변환 ✅

```typescript
// utils/dxfToGeometry.ts
export function linesToGeometry(lines: ParsedLine[]): THREE.BufferGeometry {
    const vertices: number[] = [];

    for (const line of lines) {
        vertices.push(
            line.start.x,
            line.start.y,
            line.start.z,
            line.end.x,
            line.end.y,
            line.end.z
        );
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
        'position',
        new THREE.Float32BufferAttribute(vertices, 3)
    );

    return geometry;
}
```

### Step 6: CADMesh 컴포넌트 ✅

```typescript
// components/CADMesh.tsx (TeapotMesh 패턴 따름)
export const CADMesh = memo(function CADMesh({ data, color }: Props) {
  const geometry = useMemo(() => linesToGeometry(data.lines), [data]);

  useEffect(() => {
    return () => geometry.dispose();
  }, [geometry]);

  return (
    <lineSegments geometry={geometry}>
      <lineBasicMaterial color={color} />
    </lineSegments>
  );
});
```

### Step 7: CADScene 통합 ✅

```typescript
// components/CADScene.tsx (TeapotScene 패턴 따름)
export function CADScene() {
  const [cadData, setCadData] = useState<ParsedCADData | null>(null);
  const { parse, isLoading, error } = useDXFParser();

  const handleFileSelect = async (file: File) => {
    const data = await parse(file);
    setCadData(data);
  };

  return (
    <div className="w-full h-full relative">
      <Canvas camera={{ position: [0, 0, 200], fov: 45 }}>
        <ambientLight intensity={0.8} />
        <OrbitControls enableDamping dampingFactor={0.05} />
        <gridHelper args={[1000, 50]} rotation={[Math.PI/2, 0, 0]} />
        {cadData && <CADMesh data={cadData} color="#00ff00" />}
      </Canvas>
      <FileUpload onFileSelect={handleFileSelect} isLoading={isLoading} />
      <CADControls data={cadData} config={config} onConfigChange={...} />
    </div>
  );
}
```

---

## 6. 테스트용 샘플 파일

### 6.1 무료 건축 도면 DXF 다운로드

| 출처          | URL                                          | 추천 파일             |
| ------------- | -------------------------------------------- | --------------------- |
| **GrabCAD**   | https://grabcad.com/library?q=floor+plan+dxf | 평면도 검색           |
| **CAD Forum** | https://www.cadforum.cz/en/sample-dwg-dxf    | Architecture 카테고리 |
| **LibreCAD**  | https://github.com/LibreCAD/LibreCAD         | sample/ 폴더          |

### 6.2 제공된 테스트 파일

`public/samples/simple-room.dxf` - 간단한 방 평면도 (12개 LINE 엔티티)

### 6.3 테스트 순서

1. **Level 1**: 간단한 사각형 (LINE 4개)
2. **Level 2**: 방 1개 평면도 (< 100 LINE)
3. **Level 3**: 소형 건물 평면도 (< 1000 LINE)

---

## 7. 참조 파일 (기존 패턴)

구현 시 참조한 기존 코드:

| 파일                                                 | 참조 내용                    |
| ---------------------------------------------------- | ---------------------------- |
| `src/features/TeapotDemo/components/TeapotScene.tsx` | Canvas, OrbitControls 설정   |
| `src/features/TeapotDemo/components/TeapotMesh.tsx`  | memo, useEffect cleanup 패턴 |
| `src/features/TeapotDemo/hooks/useTeapotMaterial.ts` | useMemo 최적화 패턴          |
| `src/constants/routes.ts`                            | 라우트 추가 패턴             |
| `src/constants/menu.ts`                              | 메뉴 아이템 추가 패턴        |
| `src/routes/root.tsx`                                | lazy loading 라우트 패턴     |

---

## 8. Phase 2A.2: 엔티티 확장 ✅

### 8.1 구현 완료 내용

**지원 엔티티:**

- ✅ CIRCLE - THREE.EllipseCurve (64 세그먼트)
- ✅ ARC - THREE.EllipseCurve (degree→radian 변환)
- ✅ POLYLINE/LWPOLYLINE - 정점 연결, closed 처리

**수정된 파일:**
| 파일 | 변경 내용 |
|------|----------|
| `types.ts` | ParsedCircle, ParsedArc, ParsedPolyline 인터페이스 추가 |
| `dxfToGeometry.ts` | circlesToGeometry, arcsToGeometry, polylinesToGeometry 함수 |
| `useDXFParser.ts` | CIRCLE, ARC, LWPOLYLINE/POLYLINE 파싱 로직 |
| `CADMesh.tsx` | cadDataToGeometry 사용으로 전체 엔티티 렌더링 |

### 8.2 구현 상세

```typescript
// CIRCLE → Three.js
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

// ARC → Three.js (degree → radian)
const startRad = (arc.startAngle * Math.PI) / 180;
let endRad = (arc.endAngle * Math.PI) / 180;
if (endRad < startRad) endRad += Math.PI * 2;

// POLYLINE → Three.js
for (let i = 0; i < polyline.vertices.length - 1; i++) {
    vertices.push(v1.x, v1.y, v1.z, v2.x, v2.y, v2.z);
}
if (polyline.closed) {
    /* 첫점-끝점 연결 */
}
```

---

## 9. Phase 2A.3: 레이어 기능 ✅

### 9.1 구현 완료 내용

**핵심 기능:**

- ✅ 레이어별 엔티티 그룹화
- ✅ 레이어 가시성 토글 UI
- ✅ DXF 레이어 색상 적용 (ACI → Hex)

**수정된 파일:**
| 파일 | 변경 내용 |
|------|----------|
| `types.ts` | LayerInfo 인터페이스 추가, ParsedCADData에 layers 필드 추가 |
| `constants.ts` | DXF_COLOR_MAP, aciToHex 함수 추가 |
| `useDXFParser.ts` | 레이어 파싱 및 엔티티 카운팅 로직 |
| `LayerPanel.tsx` | 새 컴포넌트 (가시성 토글, 전체 표시/숨김) |
| `CADScene.tsx` | 레이어 상태 관리 및 패널 통합 |
| `CADMesh.tsx` | 레이어 가시성에 따른 필터링 렌더링 |

---

## 10. Phase 2A.4: 성능 최적화 ✅

### 10.1 구현 완료 내용

**핵심 기능:**

- ✅ Geometry 머징 - 다중 BufferGeometry를 하나로 병합
- ✅ WebWorker 파싱 - 메인 스레드 블로킹 방지
- ✅ LOD (Level of Detail) - 엔티티 수 기반 품질 자동 조절

**추가된 파일:**
| 파일 | 설명 |
|------|------|
| `workers/dxfParser.worker.ts` | DXF 파싱 전용 WebWorker |
| `workers/index.ts` | Worker 타입 export |
| `hooks/useDXFWorker.ts` | Worker 사용 훅 (진행률 표시 포함) |

**수정된 파일:**
| 파일 | 변경 내용 |
|------|----------|
| `constants.ts` | WORKER_THRESHOLD_BYTES, LOD_CONFIG, getLODSegments 추가 |
| `utils/dxfToGeometry.ts` | LOD 지원 cadDataToGeometry, 메모리 정리 로직 |
| `hooks/index.ts` | useDXFWorker export 추가 |

### 10.2 LOD 설정

```typescript
const LOD_CONFIG = {
    HIGH_QUALITY_SEGMENTS: 64, // 엔티티 < 1000
    MEDIUM_QUALITY_SEGMENTS: 32, // 엔티티 1000-5000
    LOW_QUALITY_SEGMENTS: 16, // 엔티티 > 5000
};
```

### 10.3 WebWorker 사용 조건

- 파일 크기 > 2MB 시 자동으로 Worker 사용 권장
- `useDXFWorker` 훅: 진행률 표시, 취소 기능 제공
- `shouldUseWorker(fileSize)` 헬퍼 함수 제공

---

## 11. 사용 방법

### 11.1 개발 서버 실행

```bash
npm run dev
```

### 11.2 브라우저 접속

```
http://localhost:3000/cad-viewer
```

### 11.3 테스트

1. 좌측 상단 업로드 영역에 DXF 파일 드래그 앤 드롭
2. 또는 클릭하여 파일 선택
3. 3D 와이어프레임 렌더링 확인
4. 마우스로 회전/확대/이동 조작
5. 우측 컨트롤 패널에서 설정 변경
