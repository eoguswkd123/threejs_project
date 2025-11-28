/**
 * CAD Mesh 컴포넌트
 * Three.js Group을 렌더링하고 선택/호버 상호작용 처리
 */

import { useRef, useCallback, useMemo } from 'react';
import { ThreeEvent, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useViewerStore } from '@stores';
import type { RenderMode } from '@types/viewer';

interface CadMeshProps {
    group: THREE.Group;
    renderMode?: RenderMode;
    onSelect?: (entityId: string | null, position?: [number, number, number]) => void;
    onHover?: (entityId: string | null) => void;
}

// 렌더 모드별 머티리얼 설정
function applyRenderMode(object: THREE.Object3D, mode: RenderMode): void {
    object.traverse((child) => {
        if (child instanceof THREE.Mesh || child instanceof THREE.Line) {
            const material = child.material as THREE.Material | THREE.Material[];
            const materials = Array.isArray(material) ? material : [material];

            materials.forEach((mat) => {
                if (mat instanceof THREE.MeshBasicMaterial || mat instanceof THREE.MeshStandardMaterial) {
                    switch (mode) {
                        case 'wireframe':
                            mat.wireframe = true;
                            break;
                        case 'solid':
                            mat.wireframe = false;
                            break;
                        case 'points':
                            // Points 모드는 별도 처리 필요
                            break;
                        case 'mixed':
                            // Mixed 모드는 원본 유지
                            break;
                    }
                }
            });
        }
    });
}

// 선택/호버 하이라이트 적용
function applyHighlight(
    object: THREE.Object3D,
    selectedIds: string[],
    highlightedId: string | undefined,
    hiddenIds: string[]
): void {
    object.traverse((child) => {
        const entityId = child.userData.entityId as string | undefined;
        if (!entityId) return;

        // 숨김 처리
        if (hiddenIds.includes(entityId)) {
            child.visible = false;
            return;
        }
        child.visible = true;

        // 선택/호버 하이라이트
        if (child instanceof THREE.Mesh || child instanceof THREE.Line) {
            const material = child.material as THREE.MeshBasicMaterial | THREE.LineBasicMaterial;

            if (selectedIds.includes(entityId)) {
                // 선택된 객체 - 밝은 파란색
                material.color.setHex(0x00aaff);
                if ('emissive' in material) {
                    (material as THREE.MeshStandardMaterial).emissive.setHex(0x004488);
                }
            } else if (highlightedId === entityId) {
                // 호버된 객체 - 밝은 노란색
                material.color.setHex(0xffff00);
            } else {
                // 원래 색상 복원
                const originalColor = child.userData.originalColor as number | undefined;
                if (originalColor !== undefined) {
                    material.color.setHex(originalColor);
                }
                if ('emissive' in material) {
                    (material as THREE.MeshStandardMaterial).emissive.setHex(0x000000);
                }
            }
        }
    });
}

export function CadMesh({ group, renderMode = 'wireframe', onSelect, onHover }: CadMeshProps) {
    const groupRef = useRef<THREE.Group>(null);
    const selection = useViewerStore((state) => state.selection);
    const visibility = useViewerStore((state) => state.visibility);

    // 원래 색상 저장
    useMemo(() => {
        group.traverse((child) => {
            if (child instanceof THREE.Mesh || child instanceof THREE.Line) {
                const material = child.material as THREE.MeshBasicMaterial | THREE.LineBasicMaterial;
                if (!child.userData.originalColor) {
                    child.userData.originalColor = material.color.getHex();
                }
            }
        });
    }, [group]);

    // 렌더 모드 적용
    useMemo(() => {
        applyRenderMode(group, renderMode);
    }, [group, renderMode]);

    // 프레임마다 하이라이트 업데이트
    useFrame(() => {
        if (groupRef.current) {
            applyHighlight(
                groupRef.current,
                selection.selectedIds,
                selection.highlightedId,
                visibility.hiddenEntityIds
            );
        }
    });

    // 클릭 핸들러
    const handleClick = useCallback(
        (event: ThreeEvent<MouseEvent>) => {
            event.stopPropagation();
            const entityId = event.object.userData.entityId as string | undefined;
            if (entityId && onSelect) {
                const point = event.point;
                onSelect(entityId, [point.x, point.y, point.z]);
            }
        },
        [onSelect]
    );

    // 호버 핸들러
    const handlePointerOver = useCallback(
        (event: ThreeEvent<PointerEvent>) => {
            event.stopPropagation();
            const entityId = event.object.userData.entityId as string | undefined;
            if (entityId && onHover) {
                onHover(entityId);
                document.body.style.cursor = 'pointer';
            }
        },
        [onHover]
    );

    const handlePointerOut = useCallback(() => {
        if (onHover) {
            onHover(null);
            document.body.style.cursor = 'default';
        }
    }, [onHover]);

    // 배경 클릭 (선택 해제)
    const handleMissed = useCallback(() => {
        if (onSelect) {
            onSelect(null);
        }
    }, [onSelect]);

    return (
        <primitive
            ref={groupRef}
            object={group}
            onClick={handleClick}
            onPointerOver={handlePointerOver}
            onPointerOut={handlePointerOut}
            onPointerMissed={handleMissed}
        />
    );
}
