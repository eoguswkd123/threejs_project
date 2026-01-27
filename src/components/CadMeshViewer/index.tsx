/**
 * CadMeshViewer - CAD 데이터 렌더링 오케스트레이터
 *
 * 파싱된 CAD 데이터를 개별 메시 컴포넌트로 조합하여 렌더링
 *
 * @see {@link WireframeMesh} - LINE/CIRCLE/ARC/POLYLINE 렌더링
 * @see {@link HatchMesh} - HATCH 렌더링
 * @see {@link Hatch3DMesh} - HATCH 3D 돌출 렌더링 (Phase 2.1.6)
 * @see {@link TextMesh} - TEXT/MTEXT 렌더링
 * @see {@link CurveMesh} - ELLIPSE/SPLINE 렌더링
 * @see {@link DimensionMesh} - DIMENSION 렌더링
 */

import { useMemo, memo } from 'react';

import {
    WireframeMesh,
    HatchMesh,
    Hatch3DMesh,
    TextMesh,
    CurveMesh,
    DimensionMesh,
} from '@/components/CadMesh';
import { DEFAULT_EXTRUDE_OPTIONS, DEFAULT_SHADING_MODE } from '@/types/cad';
import type {
    HatchFillMode,
    CadShadingMode,
    ExtrudeOptions,
    LayerInfo,
    ParsedCADData,
} from '@/types/cad';
import { calculateDataCenter } from '@/utils/cad';

/**
 * CadMeshViewer Props (최상위 오케스트레이터)
 */
export interface CadMeshViewerProps {
    /** 파싱된 CAD 데이터 */
    data: ParsedCADData;
    /** 중심 정렬 여부 */
    center?: boolean;
    /** 레이어 정보 (가시성 및 색상용) */
    layers?: Map<string, LayerInfo>;
    /** 렌더링 모드 */
    renderMode?: HatchFillMode;
    /** 3D 돌출 모드 활성화 (Phase 2.1.6) */
    enable3DExtrude?: boolean;
    /** 3D 돌출 옵션 (Phase 2.1.6) */
    extrudeOptions?: ExtrudeOptions;
    /** 3D 쉐이딩 모드 (Phase 2.1.7) */
    shadingMode?: CadShadingMode;
}

/**
 * CadMeshViewer 컴포넌트
 *
 * 모든 CAD 엔티티 타입을 개별 메시 컴포넌트로 렌더링
 */
function CadMeshViewerComponent({
    data,
    center = true,
    layers,
    renderMode = 'outline',
    enable3DExtrude = false,
    extrudeOptions = DEFAULT_EXTRUDE_OPTIONS,
    shadingMode = DEFAULT_SHADING_MODE,
}: CadMeshViewerProps) {
    // 전체 데이터의 중심점 계산 (한 번만)
    const dataCenter = useMemo(() => {
        if (!center) {
            return { x: 0, y: 0, z: 0 } as ReturnType<
                typeof calculateDataCenter
            >;
        }
        return calculateDataCenter(data);
    }, [data, center]);

    // 공통 props
    const baseProps = {
        data,
        center,
        layers,
        dataCenter,
    };

    // HATCH 데이터 존재 여부
    const hasHatches = data.hatches && data.hatches.length > 0;

    return (
        <group>
            {/* LINE, CIRCLE, ARC, POLYLINE */}
            <WireframeMesh {...baseProps} />

            {/* HATCH 2D (outline/solid/pattern) - 3D 모드가 아닐 때만 */}
            {!enable3DExtrude && (
                <HatchMesh {...baseProps} renderMode={renderMode} />
            )}

            {/* HATCH 3D (ExtrudeGeometry) - 3D 모드일 때만 (Phase 2.1.6) */}
            {enable3DExtrude && hasHatches && (
                <Hatch3DMesh
                    {...baseProps}
                    extrudeOptions={extrudeOptions}
                    mergeByLayer={true}
                    shadingMode={shadingMode}
                />
            )}

            {/* ELLIPSE, SPLINE */}
            <CurveMesh {...baseProps} />

            {/* TEXT, MTEXT */}
            <TextMesh {...baseProps} />

            {/* DIMENSION */}
            <DimensionMesh {...baseProps} />
        </group>
    );
}

export const CadMeshViewer = memo(CadMeshViewerComponent);
