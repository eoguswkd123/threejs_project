/**
 * CAD Scene 컴포넌트
 * CAD 데이터 렌더링을 위한 전용 씬
 */

import { Suspense, useMemo, useCallback, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { PerspectiveCamera, OrthographicCamera, Grid, GizmoHelper, GizmoViewport } from '@react-three/drei';
import * as THREE from 'three';
import { useViewerStore, useCADStore, selectHasData } from '@stores';
import { CadMesh } from './CadMesh';
import { ViewerControls } from './ViewerControls';
import type { RenderMode, ProjectionMode } from '@types/viewer';

interface CadSceneProps {
    className?: string;
    showGrid?: boolean;
    showAxes?: boolean;
    showGizmo?: boolean;
    onEntitySelect?: (entityId: string | null, position?: [number, number, number]) => void;
    onEntityHover?: (entityId: string | null) => void;
    onReady?: () => void;
}

// 로딩 플레이스홀더
function LoadingPlaceholder() {
    return (
        <mesh>
            <boxGeometry args={[1, 1, 1]} />
            <meshBasicMaterial color={0x888888} wireframe />
        </mesh>
    );
}

// 그리드 헬퍼
function SceneGrid({ visible }: { visible: boolean }) {
    if (!visible) return null;

    return (
        <Grid
            infiniteGrid
            cellSize={10}
            cellThickness={0.5}
            cellColor={0x666666}
            sectionSize={100}
            sectionThickness={1}
            sectionColor={0x888888}
            fadeDistance={1000}
            fadeStrength={1}
        />
    );
}

// 축 헬퍼
function SceneAxes({ visible }: { visible: boolean }) {
    if (!visible) return null;

    return <axesHelper args={[100]} />;
}

// 씬 조명
function SceneLighting() {
    return (
        <>
            <ambientLight intensity={0.5} />
            <directionalLight position={[100, 100, 100]} intensity={0.8} />
            <directionalLight position={[-100, -100, -100]} intensity={0.3} />
        </>
    );
}

// 씬 내용물
function SceneContent({
    onEntitySelect,
    onEntityHover,
}: {
    onEntitySelect?: CadSceneProps['onEntitySelect'];
    onEntityHover?: CadSceneProps['onEntityHover'];
}) {
    const threeGroup = useCADStore((state) => state.threeGroup);
    const config = useViewerStore((state) => state.config);
    const selectEntity = useViewerStore((state) => state.selectEntity);
    const deselectAll = useViewerStore((state) => state.deselectAll);
    const highlightEntity = useViewerStore((state) => state.highlightEntity);

    // 선택 핸들러
    const handleSelect = useCallback(
        (entityId: string | null, position?: [number, number, number]) => {
            if (entityId) {
                selectEntity(entityId);
            } else {
                deselectAll();
            }
            onEntitySelect?.(entityId, position);
        },
        [selectEntity, deselectAll, onEntitySelect]
    );

    // 호버 핸들러
    const handleHover = useCallback(
        (entityId: string | null) => {
            highlightEntity(entityId ?? undefined);
            onEntityHover?.(entityId);
        },
        [highlightEntity, onEntityHover]
    );

    if (!threeGroup) {
        return <LoadingPlaceholder />;
    }

    return (
        <CadMesh
            group={threeGroup}
            renderMode={config.renderMode}
            onSelect={handleSelect}
            onHover={handleHover}
        />
    );
}

export function CadScene({
    className = '',
    showGrid = true,
    showAxes = true,
    showGizmo = true,
    onEntitySelect,
    onEntityHover,
    onReady,
}: CadSceneProps) {
    const config = useViewerStore((state) => state.config);
    const camera = useViewerStore((state) => state.camera);
    const setViewportSize = useViewerStore((state) => state.setViewportSize);
    const setReady = useViewerStore((state) => state.setReady);
    const hasData = useCADStore(selectHasData);

    // 뷰포트 크기 업데이트
    const handleResize = useCallback(
        (state: { size: { width: number; height: number } }) => {
            setViewportSize(state.size.width, state.size.height);
        },
        [setViewportSize]
    );

    // 준비 완료 콜백
    useEffect(() => {
        if (hasData) {
            setReady(true);
            onReady?.();
        }
    }, [hasData, setReady, onReady]);

    // 카메라 설정
    const cameraProps = useMemo(
        () => ({
            position: camera.position as [number, number, number],
            fov: camera.fov ?? 75,
            near: 0.1,
            far: 100000,
        }),
        [camera.position, camera.fov]
    );

    return (
        <div className={`w-full h-full ${className}`}>
            <Canvas
                onCreated={handleResize}
                gl={{
                    antialias: config.antialias,
                    preserveDrawingBuffer: true,
                }}
                shadows={config.shadows}
            >
                {/* 카메라 */}
                {config.projectionMode === 'perspective' ? (
                    <PerspectiveCamera makeDefault {...cameraProps} />
                ) : (
                    <OrthographicCamera
                        makeDefault
                        position={cameraProps.position}
                        zoom={camera.zoom ?? 1}
                        near={-100000}
                        far={100000}
                    />
                )}

                {/* 조명 */}
                <SceneLighting />

                {/* 배경색 */}
                <color attach="background" args={[config.backgroundColor]} />

                {/* 헬퍼 */}
                <SceneGrid visible={showGrid && config.gridEnabled} />
                <SceneAxes visible={showAxes && config.axesEnabled} />

                {/* 기즈모 */}
                {showGizmo && (
                    <GizmoHelper alignment="bottom-right" margin={[80, 80]}>
                        <GizmoViewport
                            axisColors={['#ff3653', '#0adb50', '#2c8fff']}
                            labelColor="white"
                        />
                    </GizmoHelper>
                )}

                {/* 컨트롤 */}
                <ViewerControls />

                {/* 콘텐츠 */}
                <Suspense fallback={<LoadingPlaceholder />}>
                    <SceneContent onEntitySelect={onEntitySelect} onEntityHover={onEntityHover} />
                </Suspense>
            </Canvas>
        </div>
    );
}
