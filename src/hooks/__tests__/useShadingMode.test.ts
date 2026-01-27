/**
 * useShadingMode.test.ts
 * Material 모드 전환 훅 테스트
 *
 * 주요 테스트:
 * - 원본 보존: original material clone 저장
 * - wireframe 모드: createMeshWireframeMaterial 호출
 * - flat 모드: flatShading=true 설정
 * - smooth 모드: flatShading=false 설정
 * - glossy 모드: roughness=0.1, metalness=0.9
 * - hologram 스킵: skipHologram=true면 처리 안함
 * - dispose 호출: cleanup 시 material.dispose()
 * - 멀티 Material: 배열 처리 정상 동작
 * - 빈 메쉬 배열: 에러 없이 처리
 */

import { renderHook } from '@testing-library/react';
import * as THREE from 'three';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock wireframe material
const mockWireframeMaterial = {
    type: 'LineBasicMaterial',
    dispose: vi.fn(),
};

// Mock utility functions
vi.mock('@/utils/cad', () => ({
    createMeshWireframeMaterial: vi.fn(() => ({
        ...mockWireframeMaterial,
        dispose: vi.fn(),
    })),
    WIREFRAME_DEFAULT_COLOR: '#ffffff',
}));

// Mock MeshStandardMaterial 생성 헬퍼
const createMockMaterial = (overrides = {}) => ({
    clone: vi.fn(() => createMockMaterial(overrides)),
    dispose: vi.fn(),
    flatShading: false,
    roughness: 0.5,
    metalness: 0.5,
    needsUpdate: false,
    ...overrides,
});

// Mock Mesh 생성 헬퍼
const createMockMesh = (material: unknown = createMockMaterial()) => ({
    material,
});

// Import after mocks
import type { CadShadingMode } from '@/types/cad';
import { createMeshWireframeMaterial } from '@/utils/cad';

import { useShadingMode } from '../useShadingMode';

// THREE.MeshStandardMaterial mock
vi.mock('three', async () => {
    const actual = await vi.importActual('three');
    return {
        ...actual,
        MeshStandardMaterial: class MockMeshStandardMaterial {
            flatShading = false;
            roughness = 0.5;
            metalness = 0.5;
            needsUpdate = false;

            clone() {
                const cloned = new MockMeshStandardMaterial();
                cloned.flatShading = this.flatShading;
                cloned.roughness = this.roughness;
                cloned.metalness = this.metalness;
                return cloned;
            }

            dispose = vi.fn();
        },
    };
});

beforeEach(() => {
    vi.clearAllMocks();
});

describe('useShadingMode', () => {
    describe('원본 Material 보존', () => {
        it('원본 material을 clone하여 저장한다', () => {
            const mockMaterial = createMockMaterial();
            const mockMesh = createMockMesh(mockMaterial);

            renderHook(() =>
                useShadingMode([mockMesh as unknown as THREE.Mesh], 'smooth')
            );

            expect(mockMaterial.clone).toHaveBeenCalled();
        });

        it('여러 메쉬의 material을 각각 저장한다', () => {
            const mockMaterial1 = createMockMaterial();
            const mockMaterial2 = createMockMaterial();
            const mockMesh1 = createMockMesh(mockMaterial1);
            const mockMesh2 = createMockMesh(mockMaterial2);

            renderHook(() =>
                useShadingMode(
                    [
                        mockMesh1 as unknown as THREE.Mesh,
                        mockMesh2 as unknown as THREE.Mesh,
                    ],
                    'smooth'
                )
            );

            expect(mockMaterial1.clone).toHaveBeenCalled();
            expect(mockMaterial2.clone).toHaveBeenCalled();
        });
    });

    describe('wireframe 모드', () => {
        it('wireframe 모드에서 createMeshWireframeMaterial을 호출한다', () => {
            const mockMaterial = createMockMaterial();
            const mockMesh = createMockMesh(mockMaterial);

            renderHook(() =>
                useShadingMode([mockMesh as unknown as THREE.Mesh], 'wireframe')
            );

            expect(createMeshWireframeMaterial).toHaveBeenCalled();
        });

        it('wireframe material이 메쉬에 적용된다', () => {
            const mockMaterial = createMockMaterial();
            const mockMesh = createMockMesh(mockMaterial);

            renderHook(() =>
                useShadingMode([mockMesh as unknown as THREE.Mesh], 'wireframe')
            );

            // material이 변경되었는지 확인
            expect(mockMesh.material).not.toBe(mockMaterial);
        });
    });

    describe('flat 모드', () => {
        it('flat 모드에서 flatShading=true로 설정된다', () => {
            const mockMaterial = new THREE.MeshStandardMaterial();
            const mockMesh = { material: mockMaterial };

            renderHook(() =>
                useShadingMode([mockMesh as unknown as THREE.Mesh], 'flat')
            );

            // 적용된 material 확인
            const appliedMaterial =
                mockMesh.material as THREE.MeshStandardMaterial;
            expect(appliedMaterial.flatShading).toBe(true);
        });
    });

    describe('smooth 모드', () => {
        it('smooth 모드에서 flatShading=false로 설정된다', () => {
            const mockMaterial = new THREE.MeshStandardMaterial();
            mockMaterial.flatShading = true; // 초기값을 true로
            const mockMesh = { material: mockMaterial };

            renderHook(() =>
                useShadingMode([mockMesh as unknown as THREE.Mesh], 'smooth')
            );

            const appliedMaterial =
                mockMesh.material as THREE.MeshStandardMaterial;
            expect(appliedMaterial.flatShading).toBe(false);
        });
    });

    describe('glossy 모드', () => {
        it('glossy 모드에서 roughness=0.1, metalness=0.9로 설정된다', () => {
            const mockMaterial = new THREE.MeshStandardMaterial();
            const mockMesh = { material: mockMaterial };

            renderHook(() =>
                useShadingMode([mockMesh as unknown as THREE.Mesh], 'glossy')
            );

            const appliedMaterial =
                mockMesh.material as THREE.MeshStandardMaterial;
            expect(appliedMaterial.roughness).toBe(0.1);
            expect(appliedMaterial.metalness).toBe(0.9);
        });

        it('glossy 모드에서 flatShading=false로 설정된다', () => {
            const mockMaterial = new THREE.MeshStandardMaterial();
            const mockMesh = { material: mockMaterial };

            renderHook(() =>
                useShadingMode([mockMesh as unknown as THREE.Mesh], 'glossy')
            );

            const appliedMaterial =
                mockMesh.material as THREE.MeshStandardMaterial;
            expect(appliedMaterial.flatShading).toBe(false);
        });
    });

    describe('hologram 스킵', () => {
        it('skipHologram=true(기본값)면 hologram 모드를 처리하지 않는다', () => {
            const mockMaterial = createMockMaterial();
            const mockMesh = createMockMesh(mockMaterial);
            const originalMaterial = mockMesh.material;

            renderHook(() =>
                useShadingMode([mockMesh as unknown as THREE.Mesh], 'hologram')
            );

            // material이 변경되지 않음
            expect(mockMesh.material).toBe(originalMaterial);
        });

        it('skipHologram=false면 hologram 모드도 처리한다', () => {
            const mockMaterial = createMockMaterial();
            const mockMesh = createMockMesh(mockMaterial);
            const originalMaterial = mockMesh.material;

            renderHook(() =>
                useShadingMode(
                    [mockMesh as unknown as THREE.Mesh],
                    'hologram',
                    { skipHologram: false }
                )
            );

            // material이 변경됨
            expect(mockMesh.material).not.toBe(originalMaterial);
        });
    });

    describe('dispose 호출', () => {
        it('모드 변경 시 이전 적용된 material이 dispose된다', () => {
            const mockMaterial = new THREE.MeshStandardMaterial();
            const mockMesh = { material: mockMaterial };

            const { rerender } = renderHook(
                ({ mode }) =>
                    useShadingMode([mockMesh as unknown as THREE.Mesh], mode),
                { initialProps: { mode: 'flat' as CadShadingMode } }
            );

            // flat → smooth로 변경
            const flatMaterial = mockMesh.material;

            rerender({ mode: 'smooth' });

            // 이전 flat material이 dispose됨
            expect(
                (flatMaterial as THREE.MeshStandardMaterial).dispose
            ).toHaveBeenCalled();
        });

        it('언마운트 시 모든 material이 dispose된다', () => {
            const mockMaterial = new THREE.MeshStandardMaterial();
            const mockMesh = { material: mockMaterial };

            const { unmount } = renderHook(() =>
                useShadingMode([mockMesh as unknown as THREE.Mesh], 'smooth')
            );

            const appliedMaterial =
                mockMesh.material as THREE.MeshStandardMaterial;

            unmount();

            expect(appliedMaterial.dispose).toHaveBeenCalled();
        });
    });

    describe('멀티 Material 배열', () => {
        it('material 배열도 정상 처리한다', () => {
            const mockMaterial1 = new THREE.MeshStandardMaterial();
            const mockMaterial2 = new THREE.MeshStandardMaterial();
            const mockMesh = {
                material: [mockMaterial1, mockMaterial2],
            };

            renderHook(() =>
                useShadingMode([mockMesh as unknown as THREE.Mesh], 'flat')
            );

            // 배열 형태로 유지되고 각각 처리됨
            expect(Array.isArray(mockMesh.material)).toBe(true);
            expect(
                (mockMesh.material as THREE.MeshStandardMaterial[]).length
            ).toBe(2);
        });

        it('배열 내 각 material에 flatShading이 적용된다', () => {
            const mockMaterial1 = new THREE.MeshStandardMaterial();
            const mockMaterial2 = new THREE.MeshStandardMaterial();
            const mockMesh = {
                material: [mockMaterial1, mockMaterial2],
            };

            renderHook(() =>
                useShadingMode([mockMesh as unknown as THREE.Mesh], 'flat')
            );

            const materials = mockMesh.material as THREE.MeshStandardMaterial[];
            expect(materials[0]!.flatShading).toBe(true);
            expect(materials[1]!.flatShading).toBe(true);
        });
    });

    describe('빈 메쉬 배열', () => {
        it('빈 배열이면 에러 없이 동작한다', () => {
            expect(() => {
                renderHook(() => useShadingMode([], 'smooth'));
            }).not.toThrow();
        });
    });

    describe('모드 전환', () => {
        it('smooth → wireframe 전환이 동작한다', () => {
            const mockMaterial = new THREE.MeshStandardMaterial();
            const mockMesh = { material: mockMaterial };

            const { rerender } = renderHook(
                ({ mode }) =>
                    useShadingMode([mockMesh as unknown as THREE.Mesh], mode),
                { initialProps: { mode: 'smooth' as CadShadingMode } }
            );

            rerender({ mode: 'wireframe' });

            expect(createMeshWireframeMaterial).toHaveBeenCalled();
        });

        it('flat → glossy 전환이 동작한다', () => {
            const mockMaterial = new THREE.MeshStandardMaterial();
            const mockMesh = { material: mockMaterial };

            const { rerender } = renderHook(
                ({ mode }) =>
                    useShadingMode([mockMesh as unknown as THREE.Mesh], mode),
                { initialProps: { mode: 'flat' as CadShadingMode } }
            );

            rerender({ mode: 'glossy' });

            const appliedMaterial =
                mockMesh.material as THREE.MeshStandardMaterial;
            expect(appliedMaterial.roughness).toBe(0.1);
            expect(appliedMaterial.metalness).toBe(0.9);
        });
    });

    describe('반환값', () => {
        it('void를 반환한다', () => {
            const mockMaterial = createMockMaterial();
            const mockMesh = createMockMesh(mockMaterial);

            const { result } = renderHook(() =>
                useShadingMode([mockMesh as unknown as THREE.Mesh], 'smooth')
            );

            expect(result.current).toBeUndefined();
        });
    });

    describe('needsUpdate', () => {
        it('material 변경 후 needsUpdate=true로 설정된다', () => {
            const mockMaterial = new THREE.MeshStandardMaterial();
            const mockMesh = { material: mockMaterial };

            renderHook(() =>
                useShadingMode([mockMesh as unknown as THREE.Mesh], 'flat')
            );

            const appliedMaterial =
                mockMesh.material as THREE.MeshStandardMaterial;
            expect(appliedMaterial.needsUpdate).toBe(true);
        });
    });
});
