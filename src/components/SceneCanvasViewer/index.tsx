/**
 * SceneCanvasViewer - 통합 3D 캔버스 Viewer
 *
 * @description
 * SceneCanvas 원자 컴포넌트들을 조합한 완성된 Viewer
 * ControlPanelViewer 패턴과 동일한 구조 (Props 그룹화)
 *
 * 조합 구성:
 * - SceneBase: Canvas + Camera + Controls
 * - SceneLighting: Ambient + PointLights
 * - SceneGrid: GridHelper
 * - SceneEffects: Postprocessing (Bloom, Scanline)
 * - LoadingSpinnerCanvas: 3D 로딩 스피너
 *
 * @example
 * // 기본 사용 (그룹화된 Props)
 * import { SceneCanvasViewer } from '@/components/SceneCanvasViewer';
 *
 * <SceneCanvasViewer
 *   camera={{ position: [0, 0, 100], fov: 50 }}
 *   grid={{ show: true }}
 * >
 *   <MyMesh />
 * </SceneCanvasViewer>
 *
 * @example
 * // 홀로그램 스타일
 * <SceneCanvasViewer
 *   camera={{ position: [0, 0, 5] }}
 *   canvas={{ backgroundColor: '#000000', glAlpha: true }}
 *   lighting={{ pointLights: [{ position: [10, 10, 10], intensity: 0.3, color: '#00ffff' }] }}
 *   effects={{ enableBloom: true, enableScanline: true }}
 * >
 *   <HologramMesh />
 * </SceneCanvasViewer>
 */

import { Suspense, memo, forwardRef } from 'react';
import type { RefObject, ReactNode } from 'react';

import { LoadingSpinnerCanvas } from '@/components/Common';
import {
    SceneBase,
    SceneLighting,
    SceneGrid,
    SceneEffects,
} from '@/components/SceneCanvas';
import type { PointLightConfig } from '@/components/SceneCanvas';

import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';

// ============================================================
// Config Types (그룹화된 설정)
// ============================================================

/** 카메라 설정 */
export interface CameraConfig {
    /** 카메라 위치 [x, y, z] (필수) */
    position: [number, number, number];
    /** Field of View (기본: 50) */
    fov?: number;
    /** Near clipping plane (기본: 0.1) */
    near?: number;
    /** Far clipping plane (기본: 10000) */
    far?: number;
}

/** OrbitControls 설정 */
export interface ControlsConfig {
    /** OrbitControls ref (선택적) */
    ref?: RefObject<OrbitControlsImpl | null>;
    /** Damping 활성화 (기본: true) */
    enableDamping?: boolean;
    /** Damping factor (기본: 0.05) */
    dampingFactor?: number;
    /** 최소 줌 거리 (기본: 1) */
    minDistance?: number;
    /** 최대 줌 거리 (기본: 1000) */
    maxDistance?: number;
    /** 자동 회전 (기본: false) */
    autoRotate?: boolean;
    /** 회전 속도 (기본: 1) */
    rotateSpeed?: number;
}

/** Canvas 설정 */
export interface CanvasConfig {
    /** 배경색 (CSS color string) */
    backgroundColor?: string;
    /** Alpha 채널 활성화 (투명 배경, 기본: false) */
    glAlpha?: boolean;
}

/** 조명 설정 */
export interface LightingConfig {
    /** Ambient light 강도 (기본: 0.8) */
    ambientIntensity?: number;
    /** Ambient light 색상 */
    ambientColor?: string;
    /** PointLight 배열 (추가 조명) */
    pointLights?: PointLightConfig[];
}

/** 그리드 설정 */
export interface GridConfig {
    /** 그리드 표시 여부 (기본: true) */
    show?: boolean;
    /** 그리드 크기 (기본: 100) */
    size?: number;
    /** 그리드 분할 수 (기본: 50) */
    divisions?: number;
    /** 중심선 색상 (기본: 0x444444) */
    colorCenterLine?: number;
    /** 그리드 색상 (기본: 0x222222) */
    colorGrid?: number;
    /** 그리드 회전 [x, y, z] (라디안) */
    rotation?: [number, number, number];
}

/** Postprocessing 효과 설정 */
export interface EffectsConfig {
    /** Bloom 효과 활성화 (기본: false) */
    enableBloom?: boolean;
    /** Bloom 강도 (기본: 0.5) */
    bloomIntensity?: number;
    /** Bloom 임계값 (기본: 0.6) */
    bloomThreshold?: number;
    /** Scanline 효과 활성화 (기본: false) */
    enableScanline?: boolean;
    /** Scanline 밀도 (기본: 1.25) */
    scanlineDensity?: number;
}

// ============================================================
// SceneCanvasViewer Props (그룹화된 API)
// ============================================================

/**
 * SceneCanvasViewer Props
 *
 * 그룹화된 Config 객체를 사용하는 Viewer Props
 */
export interface SceneCanvasViewerProps {
    /** 3D 콘텐츠 (Mesh 등) */
    children: ReactNode;

    /** 카메라 설정 (필수) */
    camera: CameraConfig;
    /** OrbitControls 설정 */
    controls?: ControlsConfig;
    /** Canvas 설정 */
    canvas?: CanvasConfig;
    /** 조명 설정 */
    lighting?: LightingConfig;
    /** 그리드 설정 */
    grid?: GridConfig;
    /** Postprocessing 효과 설정 */
    effects?: EffectsConfig;
}

/**
 * 통합 3D 캔버스 Viewer
 *
 * 그룹화된 Config 객체를 사용하는 완성된 Viewer
 */
const SceneCanvasViewerComponent = forwardRef<
    HTMLCanvasElement,
    SceneCanvasViewerProps
>(function SceneCanvasViewerComponent(
    { children, camera, controls, canvas, lighting, grid, effects },
    ref
) {
    // 그리드 표시 여부 (기본값: true)
    const showGrid = grid?.show ?? true;

    return (
        <SceneBase
            ref={ref}
            cameraPosition={camera.position}
            {...(camera.fov !== undefined && { cameraFov: camera.fov })}
            {...(camera.near !== undefined && { cameraNear: camera.near })}
            {...(camera.far !== undefined && { cameraFar: camera.far })}
            {...(controls?.ref !== undefined && { controlsRef: controls.ref })}
            {...(controls?.enableDamping !== undefined && {
                enableDamping: controls.enableDamping,
            })}
            {...(controls?.dampingFactor !== undefined && {
                dampingFactor: controls.dampingFactor,
            })}
            {...(controls?.minDistance !== undefined && {
                minDistance: controls.minDistance,
            })}
            {...(controls?.maxDistance !== undefined && {
                maxDistance: controls.maxDistance,
            })}
            {...(controls?.autoRotate !== undefined && {
                autoRotate: controls.autoRotate,
            })}
            {...(controls?.rotateSpeed !== undefined && {
                rotateSpeed: controls.rotateSpeed,
            })}
            {...(canvas?.backgroundColor !== undefined && {
                backgroundColor: canvas.backgroundColor,
            })}
            {...(canvas?.glAlpha !== undefined && { glAlpha: canvas.glAlpha })}
        >
            {/* 조명 */}
            <SceneLighting
                {...(lighting?.ambientIntensity !== undefined && {
                    ambientIntensity: lighting.ambientIntensity,
                })}
                {...(lighting?.ambientColor !== undefined && {
                    ambientColor: lighting.ambientColor,
                })}
                {...(lighting?.pointLights !== undefined && {
                    pointLights: lighting.pointLights,
                })}
            />

            {/* 그리드 */}
            {showGrid ? (
                <SceneGrid
                    {...(grid?.size !== undefined && { size: grid.size })}
                    {...(grid?.divisions !== undefined && {
                        divisions: grid.divisions,
                    })}
                    {...(grid?.colorCenterLine !== undefined && {
                        colorCenterLine: grid.colorCenterLine,
                    })}
                    {...(grid?.colorGrid !== undefined && {
                        colorGrid: grid.colorGrid,
                    })}
                    {...(grid?.rotation !== undefined && {
                        rotation: grid.rotation,
                    })}
                />
            ) : null}

            {/* 3D 콘텐츠 */}
            <Suspense fallback={<LoadingSpinnerCanvas />}>{children}</Suspense>

            {/* Postprocessing 효과 */}
            <SceneEffects
                {...(effects?.enableBloom !== undefined && {
                    enableBloom: effects.enableBloom,
                })}
                {...(effects?.bloomIntensity !== undefined && {
                    bloomIntensity: effects.bloomIntensity,
                })}
                {...(effects?.bloomThreshold !== undefined && {
                    bloomThreshold: effects.bloomThreshold,
                })}
                {...(effects?.enableScanline !== undefined && {
                    enableScanline: effects.enableScanline,
                })}
                {...(effects?.scanlineDensity !== undefined && {
                    scanlineDensity: effects.scanlineDensity,
                })}
            />
        </SceneBase>
    );
});

export const SceneCanvasViewer = memo(SceneCanvasViewerComponent);

// Re-export 타입 (편의성)
export type { PointLightConfig } from '@/components/SceneCanvas';

// Legacy alias (하위 호환성)
/** @deprecated SceneCanvasViewer를 직접 사용하세요. */
export { SceneCanvasViewer as SceneCanvas };
/** @deprecated SceneCanvasViewer를 직접 사용하세요. */
export { SceneCanvasViewer as EnhancedSceneCanvas };
