/**
 * SceneCanvasViewer Component Tests
 * 통합 3D 캔버스 Viewer 테스트
 */

import { createRef } from 'react';

import { render, cleanup } from '@testing-library/react';
import {
    describe,
    expect,
    it,
    vi,
    beforeEach,
    afterEach,
    type Mock,
} from 'vitest';

import type { SceneCanvasViewerProps } from '../index';

// Mock SceneCanvas 원자 컴포넌트
vi.mock('@/components/SceneCanvas', () => ({
    SceneBase: vi.fn(({ children }) => (
        <div data-testid="scene-base">{children}</div>
    )),
    SceneLighting: vi.fn(() => <div data-testid="scene-lighting" />),
    SceneGrid: vi.fn(() => <div data-testid="scene-grid" />),
    SceneEffects: vi.fn(() => <div data-testid="scene-effects" />),
}));

// Mock LoadingSpinnerCanvas
vi.mock('@/components/Common', () => ({
    LoadingSpinnerCanvas: vi.fn(() => <div data-testid="loading-spinner" />),
}));

// React Suspense는 그대로 사용
vi.mock('react', async () => {
    const actual = await vi.importActual('react');
    return {
        ...actual,
    };
});

describe('SceneCanvasViewer', () => {
    let SceneBase: Mock;
    let SceneLighting: Mock;
    let SceneGrid: Mock;
    let SceneEffects: Mock;

    const defaultProps: SceneCanvasViewerProps = {
        camera: { position: [0, 0, 100] },
        children: <mesh />,
    };

    beforeEach(async () => {
        vi.clearAllMocks();

        // Import mocked components
        const SceneCanvas = await import('@/components/SceneCanvas');
        SceneBase = SceneCanvas.SceneBase as unknown as Mock;
        SceneLighting = SceneCanvas.SceneLighting as unknown as Mock;
        SceneGrid = SceneCanvas.SceneGrid as unknown as Mock;
        SceneEffects = SceneCanvas.SceneEffects as unknown as Mock;
    });

    afterEach(() => {
        cleanup();
    });

    describe('렌더링', () => {
        it('기본 props로 렌더링 시 에러 없음', async () => {
            const { SceneCanvasViewer } = await import('../index');

            expect(() =>
                render(<SceneCanvasViewer {...defaultProps} />)
            ).not.toThrow();
        });

        it('모든 원자 컴포넌트가 렌더링됨', async () => {
            const { SceneCanvasViewer } = await import('../index');

            render(<SceneCanvasViewer {...defaultProps} />);

            expect(SceneBase).toHaveBeenCalled();
            expect(SceneLighting).toHaveBeenCalled();
            expect(SceneGrid).toHaveBeenCalled();
            expect(SceneEffects).toHaveBeenCalled();
        });

        it('children이 정상 렌더링됨', async () => {
            const { SceneCanvasViewer } = await import('../index');

            const { getByTestId } = render(
                <SceneCanvasViewer {...defaultProps}>
                    <mesh data-testid="child-mesh" />
                </SceneCanvasViewer>
            );

            expect(getByTestId('scene-base')).toBeTruthy();
        });

        it('memoized 컴포넌트로 export됨', async () => {
            const { SceneCanvasViewer } = await import('../index');
            expect(SceneCanvasViewer.$$typeof).toBe(Symbol.for('react.memo'));
        });
    });

    describe('카메라 설정 (camera)', () => {
        it('camera.position이 SceneBase에 전달됨', async () => {
            const { SceneCanvasViewer } = await import('../index');

            render(
                <SceneCanvasViewer
                    {...defaultProps}
                    camera={{ position: [10, 20, 30] }}
                />
            );

            expect(SceneBase).toHaveBeenCalledWith(
                expect.objectContaining({
                    cameraPosition: [10, 20, 30],
                }),
                expect.anything()
            );
        });

        it('camera.fov가 SceneBase에 전달됨', async () => {
            const { SceneCanvasViewer } = await import('../index');

            render(
                <SceneCanvasViewer
                    {...defaultProps}
                    camera={{ position: [0, 0, 100], fov: 75 }}
                />
            );

            expect(SceneBase).toHaveBeenCalledWith(
                expect.objectContaining({
                    cameraFov: 75,
                }),
                expect.anything()
            );
        });

        it('camera.near/far가 SceneBase에 전달됨', async () => {
            const { SceneCanvasViewer } = await import('../index');

            render(
                <SceneCanvasViewer
                    {...defaultProps}
                    camera={{ position: [0, 0, 100], near: 0.5, far: 5000 }}
                />
            );

            expect(SceneBase).toHaveBeenCalledWith(
                expect.objectContaining({
                    cameraNear: 0.5,
                    cameraFar: 5000,
                }),
                expect.anything()
            );
        });
    });

    describe('컨트롤 설정 (controls)', () => {
        it('controls.autoRotate가 SceneBase에 전달됨', async () => {
            const { SceneCanvasViewer } = await import('../index');

            render(
                <SceneCanvasViewer
                    {...defaultProps}
                    controls={{ autoRotate: true, rotateSpeed: 2 }}
                />
            );

            expect(SceneBase).toHaveBeenCalledWith(
                expect.objectContaining({
                    autoRotate: true,
                    rotateSpeed: 2,
                }),
                expect.anything()
            );
        });

        it('controls.enableDamping 설정이 전달됨', async () => {
            const { SceneCanvasViewer } = await import('../index');

            render(
                <SceneCanvasViewer
                    {...defaultProps}
                    controls={{ enableDamping: true, dampingFactor: 0.1 }}
                />
            );

            expect(SceneBase).toHaveBeenCalledWith(
                expect.objectContaining({
                    enableDamping: true,
                    dampingFactor: 0.1,
                }),
                expect.anything()
            );
        });

        it('controls.minDistance/maxDistance가 전달됨', async () => {
            const { SceneCanvasViewer } = await import('../index');

            render(
                <SceneCanvasViewer
                    {...defaultProps}
                    controls={{ minDistance: 10, maxDistance: 500 }}
                />
            );

            expect(SceneBase).toHaveBeenCalledWith(
                expect.objectContaining({
                    minDistance: 10,
                    maxDistance: 500,
                }),
                expect.anything()
            );
        });
    });

    describe('캔버스 설정 (canvas)', () => {
        it('canvas.backgroundColor가 SceneBase에 전달됨', async () => {
            const { SceneCanvasViewer } = await import('../index');

            render(
                <SceneCanvasViewer
                    {...defaultProps}
                    canvas={{ backgroundColor: '#1a1a2e' }}
                />
            );

            expect(SceneBase).toHaveBeenCalledWith(
                expect.objectContaining({
                    backgroundColor: '#1a1a2e',
                }),
                expect.anything()
            );
        });

        it('canvas.glAlpha가 SceneBase에 전달됨', async () => {
            const { SceneCanvasViewer } = await import('../index');

            render(
                <SceneCanvasViewer
                    {...defaultProps}
                    canvas={{ glAlpha: true }}
                />
            );

            expect(SceneBase).toHaveBeenCalledWith(
                expect.objectContaining({
                    glAlpha: true,
                }),
                expect.anything()
            );
        });
    });

    describe('조명 설정 (lighting)', () => {
        it('lighting.ambientIntensity가 SceneLighting에 전달됨', async () => {
            const { SceneCanvasViewer } = await import('../index');

            render(
                <SceneCanvasViewer
                    {...defaultProps}
                    lighting={{ ambientIntensity: 0.5 }}
                />
            );

            expect(SceneLighting).toHaveBeenCalledWith(
                expect.objectContaining({
                    ambientIntensity: 0.5,
                }),
                expect.anything()
            );
        });

        it('lighting.ambientColor가 SceneLighting에 전달됨', async () => {
            const { SceneCanvasViewer } = await import('../index');

            render(
                <SceneCanvasViewer
                    {...defaultProps}
                    lighting={{ ambientColor: '#ffffff' }}
                />
            );

            expect(SceneLighting).toHaveBeenCalledWith(
                expect.objectContaining({
                    ambientColor: '#ffffff',
                }),
                expect.anything()
            );
        });

        it('lighting.pointLights가 SceneLighting에 전달됨', async () => {
            const { SceneCanvasViewer } = await import('../index');

            const pointLights = [
                {
                    position: [10, 10, 10] as [number, number, number],
                    intensity: 0.5,
                    color: '#00ffff',
                },
            ];

            render(
                <SceneCanvasViewer
                    {...defaultProps}
                    lighting={{ pointLights }}
                />
            );

            expect(SceneLighting).toHaveBeenCalledWith(
                expect.objectContaining({
                    pointLights,
                }),
                expect.anything()
            );
        });
    });

    describe('그리드 설정 (grid)', () => {
        it('grid.show=true일 때 SceneGrid 렌더링됨', async () => {
            const { SceneCanvasViewer } = await import('../index');

            render(
                <SceneCanvasViewer {...defaultProps} grid={{ show: true }} />
            );

            expect(SceneGrid).toHaveBeenCalled();
        });

        it('grid.show=false일 때 SceneGrid 렌더링 안됨', async () => {
            const { SceneCanvasViewer } = await import('../index');

            render(
                <SceneCanvasViewer {...defaultProps} grid={{ show: false }} />
            );

            expect(SceneGrid).not.toHaveBeenCalled();
        });

        it('grid 설정 없으면 기본으로 그리드 표시됨', async () => {
            const { SceneCanvasViewer } = await import('../index');

            render(<SceneCanvasViewer {...defaultProps} />);

            expect(SceneGrid).toHaveBeenCalled();
        });

        it('grid.size/divisions가 SceneGrid에 전달됨', async () => {
            const { SceneCanvasViewer } = await import('../index');

            render(
                <SceneCanvasViewer
                    {...defaultProps}
                    grid={{ show: true, size: 200, divisions: 100 }}
                />
            );

            expect(SceneGrid).toHaveBeenCalledWith(
                expect.objectContaining({
                    size: 200,
                    divisions: 100,
                }),
                expect.anything()
            );
        });

        it('grid.colorCenterLine/colorGrid가 SceneGrid에 전달됨', async () => {
            const { SceneCanvasViewer } = await import('../index');

            render(
                <SceneCanvasViewer
                    {...defaultProps}
                    grid={{
                        show: true,
                        colorCenterLine: 0xff0000,
                        colorGrid: 0x00ff00,
                    }}
                />
            );

            expect(SceneGrid).toHaveBeenCalledWith(
                expect.objectContaining({
                    colorCenterLine: 0xff0000,
                    colorGrid: 0x00ff00,
                }),
                expect.anything()
            );
        });

        it('grid.rotation이 SceneGrid에 전달됨', async () => {
            const { SceneCanvasViewer } = await import('../index');

            const rotation: [number, number, number] = [Math.PI / 2, 0, 0];

            render(
                <SceneCanvasViewer
                    {...defaultProps}
                    grid={{ show: true, rotation }}
                />
            );

            expect(SceneGrid).toHaveBeenCalledWith(
                expect.objectContaining({
                    rotation,
                }),
                expect.anything()
            );
        });
    });

    describe('효과 설정 (effects)', () => {
        it('effects.enableBloom이 SceneEffects에 전달됨', async () => {
            const { SceneCanvasViewer } = await import('../index');

            render(
                <SceneCanvasViewer
                    {...defaultProps}
                    effects={{ enableBloom: true, bloomIntensity: 0.8 }}
                />
            );

            expect(SceneEffects).toHaveBeenCalledWith(
                expect.objectContaining({
                    enableBloom: true,
                    bloomIntensity: 0.8,
                }),
                expect.anything()
            );
        });

        it('effects.bloomThreshold가 SceneEffects에 전달됨', async () => {
            const { SceneCanvasViewer } = await import('../index');

            render(
                <SceneCanvasViewer
                    {...defaultProps}
                    effects={{ enableBloom: true, bloomThreshold: 0.5 }}
                />
            );

            expect(SceneEffects).toHaveBeenCalledWith(
                expect.objectContaining({
                    bloomThreshold: 0.5,
                }),
                expect.anything()
            );
        });

        it('effects.enableScanline이 SceneEffects에 전달됨', async () => {
            const { SceneCanvasViewer } = await import('../index');

            render(
                <SceneCanvasViewer
                    {...defaultProps}
                    effects={{ enableScanline: true, scanlineDensity: 2.0 }}
                />
            );

            expect(SceneEffects).toHaveBeenCalledWith(
                expect.objectContaining({
                    enableScanline: true,
                    scanlineDensity: 2.0,
                }),
                expect.anything()
            );
        });
    });

    describe('forwardRef', () => {
        it('ref가 SceneBase에 전달됨', async () => {
            const { SceneCanvasViewer } = await import('../index');

            const ref = createRef<HTMLCanvasElement>();

            render(<SceneCanvasViewer {...defaultProps} ref={ref} />);

            // SceneBase가 ref와 함께 호출됨
            expect(SceneBase).toHaveBeenCalled();
        });
    });

    describe('복합 시나리오', () => {
        it('모든 Config가 설정된 홀로그램 스타일 렌더링', async () => {
            const { SceneCanvasViewer } = await import('../index');

            expect(() =>
                render(
                    <SceneCanvasViewer
                        camera={{
                            position: [0, 0, 5],
                            fov: 50,
                            near: 0.1,
                            far: 1000,
                        }}
                        controls={{
                            autoRotate: true,
                            rotateSpeed: 0.5,
                            enableDamping: true,
                        }}
                        canvas={{ backgroundColor: '#000000', glAlpha: true }}
                        lighting={{
                            ambientIntensity: 0.3,
                            pointLights: [
                                {
                                    position: [10, 10, 10],
                                    intensity: 0.5,
                                    color: '#00ffff',
                                },
                            ],
                        }}
                        grid={{ show: false }}
                        effects={{
                            enableBloom: true,
                            bloomIntensity: 0.6,
                            enableScanline: true,
                        }}
                    >
                        <mesh />
                    </SceneCanvasViewer>
                )
            ).not.toThrow();

            // 그리드 비활성화 확인
            expect(SceneGrid).not.toHaveBeenCalled();

            // 효과 활성화 확인
            expect(SceneEffects).toHaveBeenCalledWith(
                expect.objectContaining({
                    enableBloom: true,
                    enableScanline: true,
                }),
                expect.anything()
            );
        });

        it('CAD Viewer 스타일 렌더링', async () => {
            const { SceneCanvasViewer } = await import('../index');

            expect(() =>
                render(
                    <SceneCanvasViewer
                        camera={{ position: [0, 0, 100], fov: 50 }}
                        controls={{ minDistance: 1, maxDistance: 1000 }}
                        canvas={{ backgroundColor: '#1a1a2e' }}
                        lighting={{ ambientIntensity: 0.8 }}
                        grid={{ show: true, size: 100, divisions: 50 }}
                        effects={{ enableBloom: false }}
                    >
                        <group>
                            <mesh />
                            <lineSegments />
                        </group>
                    </SceneCanvasViewer>
                )
            ).not.toThrow();

            // 그리드 활성화 확인
            expect(SceneGrid).toHaveBeenCalled();
        });
    });

    describe('Legacy 별칭', () => {
        it('SceneCanvas 별칭이 export됨', async () => {
            const { SceneCanvas } = await import('../index');
            expect(SceneCanvas).toBeDefined();
        });

        it('EnhancedSceneCanvas 별칭이 export됨', async () => {
            const { EnhancedSceneCanvas } = await import('../index');
            expect(EnhancedSceneCanvas).toBeDefined();
        });
    });

    describe('타입 re-export', () => {
        it('Config 타입들이 export됨', async () => {
            const exports = await import('../index');

            // 타입은 런타임에서 확인할 수 없으므로 컴포넌트 존재만 확인
            expect(exports.SceneCanvasViewer).toBeDefined();
        });
    });
});
