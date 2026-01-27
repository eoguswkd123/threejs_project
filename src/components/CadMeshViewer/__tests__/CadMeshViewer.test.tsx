/**
 * CadMeshViewer Component Tests
 * CAD 데이터 렌더링 오케스트레이터 테스트
 */

import { render, cleanup } from '@testing-library/react';
import * as THREE from 'three';
import {
    describe,
    expect,
    it,
    vi,
    beforeEach,
    afterEach,
    type Mock,
} from 'vitest';

import {
    createEmptyCADData,
    createTestLine,
    createTestCircle,
    createTestHatch,
    createTestText,
    createTestEllipse,
    createTestDimension,
    createTestLayers,
} from '@/components/CadMesh/__tests__/testHelpers';
import type { ExtrudeOptions, CadShadingMode } from '@/types/cad';

import { CadMeshViewer } from '../index';

// Mock child mesh components
vi.mock('@/components/CadMesh', () => ({
    WireframeMesh: vi.fn(() => null),
    HatchMesh: vi.fn(() => null),
    Hatch3DMesh: vi.fn(() => null),
    TextMesh: vi.fn(() => null),
    CurveMesh: vi.fn(() => null),
    DimensionMesh: vi.fn(() => null),
}));

// Mock calculateDataCenter utility
const mockDataCenter = new THREE.Vector3(50, 50, 0);
vi.mock('@/utils/cad', () => ({
    calculateDataCenter: vi.fn(() => mockDataCenter),
}));

// Mock React Three Fiber
vi.mock('@react-three/fiber', () => ({
    useThree: vi.fn(() => ({ gl: {}, scene: {}, camera: {} })),
}));

describe('CadMeshViewer', () => {
    let WireframeMesh: Mock;
    let HatchMesh: Mock;
    let Hatch3DMesh: Mock;
    let TextMesh: Mock;
    let CurveMesh: Mock;
    let DimensionMesh: Mock;
    let calculateDataCenter: Mock;

    beforeEach(async () => {
        vi.clearAllMocks();

        // Import mocked components
        const CadMesh = await import('@/components/CadMesh');
        WireframeMesh = CadMesh.WireframeMesh as unknown as Mock;
        HatchMesh = CadMesh.HatchMesh as unknown as Mock;
        Hatch3DMesh = CadMesh.Hatch3DMesh as unknown as Mock;
        TextMesh = CadMesh.TextMesh as unknown as Mock;
        CurveMesh = CadMesh.CurveMesh as unknown as Mock;
        DimensionMesh = CadMesh.DimensionMesh as unknown as Mock;

        const utils = await import('@/utils/cad');
        calculateDataCenter = utils.calculateDataCenter as unknown as Mock;
    });

    afterEach(() => {
        cleanup();
    });

    describe('렌더링', () => {
        it('빈 CAD 데이터로 렌더링 시 에러 없음', () => {
            const data = createEmptyCADData();

            expect(() => render(<CadMeshViewer data={data} />)).not.toThrow();
        });

        it('모든 메시 컴포넌트가 렌더링됨', () => {
            const data = createEmptyCADData();
            data.lines = [createTestLine(0, 0, 100, 100)];
            data.circles = [createTestCircle(50, 50, 25)];
            data.hatches = [createTestHatch(0, 0, 50, 50)];
            data.texts = [createTestText('Test', 10, 10)];
            data.ellipses = [createTestEllipse(50, 50, 30)];
            data.dimensions = [
                createTestDimension({ x: 0, y: 0 }, { x: 100, y: 0 }),
            ];

            render(<CadMeshViewer data={data} />);

            expect(WireframeMesh).toHaveBeenCalled();
            expect(HatchMesh).toHaveBeenCalled();
            expect(TextMesh).toHaveBeenCalled();
            expect(CurveMesh).toHaveBeenCalled();
            expect(DimensionMesh).toHaveBeenCalled();
        });

        it('memoized 컴포넌트로 export됨', async () => {
            const { CadMeshViewer: Viewer } = await import('../index');
            expect(Viewer.$$typeof).toBe(Symbol.for('react.memo'));
        });
    });

    describe('Props 전달', () => {
        it('baseProps가 모든 자식 컴포넌트에 전달됨', () => {
            const data = createEmptyCADData();
            data.lines = [createTestLine(0, 0, 100, 100)];

            const layers = createTestLayers([{ name: '0', color: '#ffffff' }]);

            render(<CadMeshViewer data={data} center={true} layers={layers} />);

            // WireframeMesh가 올바른 props와 함께 호출되었는지 확인
            expect(WireframeMesh).toHaveBeenCalledWith(
                expect.objectContaining({
                    data,
                    center: true,
                    layers,
                    dataCenter: mockDataCenter,
                }),
                expect.anything()
            );

            // HatchMesh도 동일하게 확인
            expect(HatchMesh).toHaveBeenCalledWith(
                expect.objectContaining({
                    data,
                    center: true,
                    layers,
                    dataCenter: mockDataCenter,
                }),
                expect.anything()
            );
        });

        it('renderMode가 HatchMesh에 전달됨', () => {
            const data = createEmptyCADData();

            render(<CadMeshViewer data={data} renderMode="solid" />);

            expect(HatchMesh).toHaveBeenCalledWith(
                expect.objectContaining({
                    renderMode: 'solid',
                }),
                expect.anything()
            );
        });

        it('기본 renderMode는 outline', () => {
            const data = createEmptyCADData();

            render(<CadMeshViewer data={data} />);

            expect(HatchMesh).toHaveBeenCalledWith(
                expect.objectContaining({
                    renderMode: 'outline',
                }),
                expect.anything()
            );
        });
    });

    describe('3D 돌출 모드 (enable3DExtrude)', () => {
        it('enable3DExtrude=false일 때 HatchMesh 렌더링, Hatch3DMesh 렌더링 안함', () => {
            const data = createEmptyCADData();
            data.hatches = [createTestHatch(0, 0, 50, 50)];

            render(<CadMeshViewer data={data} enable3DExtrude={false} />);

            expect(HatchMesh).toHaveBeenCalled();
            expect(Hatch3DMesh).not.toHaveBeenCalled();
        });

        it('enable3DExtrude=true이고 hatches 있을 때 Hatch3DMesh 렌더링, HatchMesh 렌더링 안함', () => {
            const data = createEmptyCADData();
            data.hatches = [createTestHatch(0, 0, 50, 50)];

            render(<CadMeshViewer data={data} enable3DExtrude={true} />);

            expect(HatchMesh).not.toHaveBeenCalled();
            expect(Hatch3DMesh).toHaveBeenCalled();
        });

        it('enable3DExtrude=true이지만 hatches 없으면 Hatch3DMesh 렌더링 안함', () => {
            const data = createEmptyCADData();
            // hatches is empty

            render(<CadMeshViewer data={data} enable3DExtrude={true} />);

            expect(Hatch3DMesh).not.toHaveBeenCalled();
        });

        it('extrudeOptions가 Hatch3DMesh에 전달됨', () => {
            const data = createEmptyCADData();
            data.hatches = [createTestHatch(0, 0, 50, 50)];

            const extrudeOptions: ExtrudeOptions = {
                depth: 50,
                bevel: true,
                bevelSize: 2,
                bevelSegments: 3,
            };

            render(
                <CadMeshViewer
                    data={data}
                    enable3DExtrude={true}
                    extrudeOptions={extrudeOptions}
                />
            );

            expect(Hatch3DMesh).toHaveBeenCalledWith(
                expect.objectContaining({
                    extrudeOptions,
                    mergeByLayer: true,
                }),
                expect.anything()
            );
        });

        it('shadingMode가 Hatch3DMesh에 전달됨', () => {
            const data = createEmptyCADData();
            data.hatches = [createTestHatch(0, 0, 50, 50)];

            const shadingMode: CadShadingMode = 'glossy';

            render(
                <CadMeshViewer
                    data={data}
                    enable3DExtrude={true}
                    shadingMode={shadingMode}
                />
            );

            expect(Hatch3DMesh).toHaveBeenCalledWith(
                expect.objectContaining({
                    shadingMode: 'glossy',
                }),
                expect.anything()
            );
        });
    });

    describe('중심점 계산 (dataCenter)', () => {
        it('center=true일 때 calculateDataCenter가 호출됨', () => {
            const data = createEmptyCADData();

            render(<CadMeshViewer data={data} center={true} />);

            expect(calculateDataCenter).toHaveBeenCalledWith(data);
        });

        it('center=false일 때 dataCenter는 원점 (0,0,0)', () => {
            const data = createEmptyCADData();

            render(<CadMeshViewer data={data} center={false} />);

            // calculateDataCenter가 호출되지 않거나, 원점이 전달됨
            expect(WireframeMesh).toHaveBeenCalledWith(
                expect.objectContaining({
                    dataCenter: expect.objectContaining({ x: 0, y: 0, z: 0 }),
                }),
                expect.anything()
            );
        });

        it('기본 center 값은 true', () => {
            const data = createEmptyCADData();

            render(<CadMeshViewer data={data} />);

            expect(calculateDataCenter).toHaveBeenCalledWith(data);
        });
    });

    describe('레이어 처리', () => {
        it('layers가 없을 때도 정상 렌더링', () => {
            const data = createEmptyCADData();

            expect(() => render(<CadMeshViewer data={data} />)).not.toThrow();
        });

        it('layers Map이 모든 자식 컴포넌트에 전달됨', () => {
            const data = createEmptyCADData();
            const layers = createTestLayers([
                { name: 'Layer1', color: '#ff0000', visible: true },
                { name: 'Layer2', color: '#00ff00', visible: false },
            ]);

            render(<CadMeshViewer data={data} layers={layers} />);

            expect(WireframeMesh).toHaveBeenCalledWith(
                expect.objectContaining({ layers }),
                expect.anything()
            );
            expect(HatchMesh).toHaveBeenCalledWith(
                expect.objectContaining({ layers }),
                expect.anything()
            );
            expect(TextMesh).toHaveBeenCalledWith(
                expect.objectContaining({ layers }),
                expect.anything()
            );
            expect(CurveMesh).toHaveBeenCalledWith(
                expect.objectContaining({ layers }),
                expect.anything()
            );
            expect(DimensionMesh).toHaveBeenCalledWith(
                expect.objectContaining({ layers }),
                expect.anything()
            );
        });
    });

    describe('기본값 처리', () => {
        it('모든 옵션 props에 기본값이 적용됨', () => {
            const data = createEmptyCADData();
            data.hatches = [createTestHatch(0, 0, 50, 50)];

            render(<CadMeshViewer data={data} />);

            // HatchMesh가 호출됨 (enable3DExtrude 기본값 false)
            expect(HatchMesh).toHaveBeenCalled();
            expect(Hatch3DMesh).not.toHaveBeenCalled();

            // renderMode 기본값 'outline'
            expect(HatchMesh).toHaveBeenCalledWith(
                expect.objectContaining({
                    renderMode: 'outline',
                }),
                expect.anything()
            );
        });
    });

    describe('복합 시나리오', () => {
        it('모든 엔티티 타입이 있는 복잡한 CAD 데이터 렌더링', () => {
            const data = createEmptyCADData();
            data.lines = [
                createTestLine(0, 0, 100, 0),
                createTestLine(100, 0, 100, 100),
            ];
            data.circles = [createTestCircle(50, 50, 20)];
            data.hatches = [
                createTestHatch(10, 10, 30, 30),
                createTestHatch(50, 50, 20, 20),
            ];
            data.texts = [createTestText('Room A', 25, 25)];
            data.ellipses = [createTestEllipse(75, 75, 15)];
            data.dimensions = [
                createTestDimension({ x: 0, y: 0 }, { x: 100, y: 0 }),
            ];

            const layers = createTestLayers([
                { name: '0', color: '#ffffff' },
                { name: 'Walls', color: '#ff0000' },
                { name: 'Annotations', color: '#00ff00' },
            ]);

            expect(() =>
                render(
                    <CadMeshViewer
                        data={data}
                        center={true}
                        layers={layers}
                        renderMode="solid"
                    />
                )
            ).not.toThrow();

            // 모든 메시 컴포넌트가 호출됨
            expect(WireframeMesh).toHaveBeenCalled();
            expect(HatchMesh).toHaveBeenCalled();
            expect(TextMesh).toHaveBeenCalled();
            expect(CurveMesh).toHaveBeenCalled();
            expect(DimensionMesh).toHaveBeenCalled();
        });

        it('3D 모드에서 복잡한 CAD 데이터 렌더링', () => {
            const data = createEmptyCADData();
            data.lines = [createTestLine(0, 0, 100, 100)];
            data.hatches = [createTestHatch(10, 10, 80, 80)];
            data.texts = [createTestText('3D Room', 50, 50)];

            const extrudeOptions: ExtrudeOptions = {
                depth: 30,
                bevel: false,
                bevelSize: 0,
                bevelSegments: 1,
            };

            render(
                <CadMeshViewer
                    data={data}
                    enable3DExtrude={true}
                    extrudeOptions={extrudeOptions}
                    shadingMode="smooth"
                />
            );

            // 3D 모드에서는 Hatch3DMesh 사용
            expect(HatchMesh).not.toHaveBeenCalled();
            expect(Hatch3DMesh).toHaveBeenCalledWith(
                expect.objectContaining({
                    extrudeOptions,
                    shadingMode: 'smooth',
                }),
                expect.anything()
            );

            // 다른 메시들은 그대로 렌더링
            expect(WireframeMesh).toHaveBeenCalled();
            expect(TextMesh).toHaveBeenCalled();
        });
    });

    describe('데이터 변경 시 동작', () => {
        it('data가 변경되면 dataCenter가 재계산됨', () => {
            const data1 = createEmptyCADData();
            data1.lines = [createTestLine(0, 0, 50, 50)];

            const { rerender } = render(<CadMeshViewer data={data1} />);

            expect(calculateDataCenter).toHaveBeenCalledTimes(1);

            const data2 = createEmptyCADData();
            data2.lines = [createTestLine(0, 0, 100, 100)];

            rerender(<CadMeshViewer data={data2} />);

            expect(calculateDataCenter).toHaveBeenCalledTimes(2);
            expect(calculateDataCenter).toHaveBeenLastCalledWith(data2);
        });
    });
});
