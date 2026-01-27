/**
 * useAutoRotate.test.ts
 * 자동 회전 애니메이션 훅 테스트
 *
 * 주요 테스트:
 * - 초기화: enabled=false면 회전 안함
 * - 활성화: enabled=true면 rotation 변경
 * - 속도: speed 값에 비례한 회전
 * - 축: x, y, z 각 축 회전 검증
 * - ref null: groupRef.current가 null이면 에러 없음
 * - delta: delta time 기반 프레임 독립성
 */

import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { useAutoRotate } from '../useAutoRotate';

import type * as THREE from 'three';

// useFrame 콜백 저장용
let frameCallback: ((state: unknown, delta: number) => void) | null = null;

// @react-three/fiber mock
vi.mock('@react-three/fiber', () => ({
    useFrame: vi.fn((callback: (state: unknown, delta: number) => void) => {
        frameCallback = callback;
    }),
}));

// THREE.Group mock 생성 헬퍼
const createMockGroup = () => ({
    rotation: { x: 0, y: 0, z: 0 },
});

// Mock ref 생성 헬퍼
const createMockRef = (current: ReturnType<typeof createMockGroup> | null) => ({
    current,
});

beforeEach(() => {
    vi.clearAllMocks();
    frameCallback = null;
});

describe('useAutoRotate', () => {
    describe('초기화', () => {
        it('enabled=false가 기본값이다', () => {
            const mockGroup = createMockGroup();
            const mockRef = createMockRef(mockGroup);

            renderHook(() =>
                useAutoRotate(
                    mockRef as React.RefObject<THREE.Group | null>,
                    {}
                )
            );

            // 콜백 실행
            frameCallback?.(null, 0.016);

            // enabled=false이므로 회전 안함
            expect(mockGroup.rotation.y).toBe(0);
        });

        it('speed=0.5가 기본값이다', () => {
            const mockGroup = createMockGroup();
            const mockRef = createMockRef(mockGroup);

            renderHook(() =>
                useAutoRotate(mockRef as React.RefObject<THREE.Group | null>, {
                    enabled: true,
                })
            );

            const delta = 1; // 1초
            frameCallback?.(null, delta);

            // speed=0.5, delta=1 → 0.5 라디안 회전
            expect(mockGroup.rotation.y).toBeCloseTo(0.5);
        });

        it('axis=y가 기본값이다', () => {
            const mockGroup = createMockGroup();
            const mockRef = createMockRef(mockGroup);

            renderHook(() =>
                useAutoRotate(mockRef as React.RefObject<THREE.Group | null>, {
                    enabled: true,
                    speed: 1,
                })
            );

            frameCallback?.(null, 1);

            expect(mockGroup.rotation.y).toBe(1);
            expect(mockGroup.rotation.x).toBe(0);
            expect(mockGroup.rotation.z).toBe(0);
        });
    });

    describe('회전 동작', () => {
        it('enabled=true면 회전한다', () => {
            const mockGroup = createMockGroup();
            const mockRef = createMockRef(mockGroup);

            renderHook(() =>
                useAutoRotate(mockRef as React.RefObject<THREE.Group | null>, {
                    enabled: true,
                    speed: 1,
                })
            );

            frameCallback?.(null, 0.016);

            expect(mockGroup.rotation.y).toBeGreaterThan(0);
        });

        it('enabled=false면 회전하지 않는다', () => {
            const mockGroup = createMockGroup();
            const mockRef = createMockRef(mockGroup);

            renderHook(() =>
                useAutoRotate(mockRef as React.RefObject<THREE.Group | null>, {
                    enabled: false,
                    speed: 1,
                })
            );

            frameCallback?.(null, 0.016);

            expect(mockGroup.rotation.y).toBe(0);
        });

        it('speed에 비례하여 회전한다', () => {
            const mockGroup1 = createMockGroup();
            const mockGroup2 = createMockGroup();
            const mockRef1 = createMockRef(mockGroup1);
            const mockRef2 = createMockRef(mockGroup2);

            // speed=1
            renderHook(() =>
                useAutoRotate(mockRef1 as React.RefObject<THREE.Group | null>, {
                    enabled: true,
                    speed: 1,
                })
            );
            const callback1 = frameCallback;

            // speed=2
            renderHook(() =>
                useAutoRotate(mockRef2 as React.RefObject<THREE.Group | null>, {
                    enabled: true,
                    speed: 2,
                })
            );
            const callback2 = frameCallback;

            const delta = 0.5;
            callback1?.(null, delta);
            callback2?.(null, delta);

            // speed=2는 speed=1의 2배
            expect(mockGroup2.rotation.y).toBeCloseTo(
                mockGroup1.rotation.y * 2
            );
        });

        it('delta time에 비례하여 회전한다 (프레임 독립성)', () => {
            const mockGroup = createMockGroup();
            const mockRef = createMockRef(mockGroup);

            renderHook(() =>
                useAutoRotate(mockRef as React.RefObject<THREE.Group | null>, {
                    enabled: true,
                    speed: 1,
                })
            );

            // 짧은 프레임 (60fps)
            frameCallback?.(null, 0.016);
            const rotation60fps = mockGroup.rotation.y;

            // 리셋
            mockGroup.rotation.y = 0;

            // 긴 프레임 (30fps)
            frameCallback?.(null, 0.033);
            const rotation30fps = mockGroup.rotation.y;

            // 30fps delta가 2배이므로 회전량도 ~2배
            expect(rotation30fps / rotation60fps).toBeCloseTo(2, 0);
        });
    });

    describe('축 회전', () => {
        it('axis=x면 x축으로 회전한다', () => {
            const mockGroup = createMockGroup();
            const mockRef = createMockRef(mockGroup);

            renderHook(() =>
                useAutoRotate(mockRef as React.RefObject<THREE.Group | null>, {
                    enabled: true,
                    speed: 1,
                    axis: 'x',
                })
            );

            frameCallback?.(null, 1);

            expect(mockGroup.rotation.x).toBe(1);
            expect(mockGroup.rotation.y).toBe(0);
            expect(mockGroup.rotation.z).toBe(0);
        });

        it('axis=y면 y축으로 회전한다', () => {
            const mockGroup = createMockGroup();
            const mockRef = createMockRef(mockGroup);

            renderHook(() =>
                useAutoRotate(mockRef as React.RefObject<THREE.Group | null>, {
                    enabled: true,
                    speed: 1,
                    axis: 'y',
                })
            );

            frameCallback?.(null, 1);

            expect(mockGroup.rotation.x).toBe(0);
            expect(mockGroup.rotation.y).toBe(1);
            expect(mockGroup.rotation.z).toBe(0);
        });

        it('axis=z면 z축으로 회전한다', () => {
            const mockGroup = createMockGroup();
            const mockRef = createMockRef(mockGroup);

            renderHook(() =>
                useAutoRotate(mockRef as React.RefObject<THREE.Group | null>, {
                    enabled: true,
                    speed: 1,
                    axis: 'z',
                })
            );

            frameCallback?.(null, 1);

            expect(mockGroup.rotation.x).toBe(0);
            expect(mockGroup.rotation.y).toBe(0);
            expect(mockGroup.rotation.z).toBe(1);
        });
    });

    describe('엣지 케이스', () => {
        it('groupRef.current가 null이면 에러 없이 동작한다', () => {
            const mockRef = createMockRef(null);

            renderHook(() =>
                useAutoRotate(mockRef as React.RefObject<THREE.Group | null>, {
                    enabled: true,
                    speed: 1,
                })
            );

            expect(() => {
                frameCallback?.(null, 0.016);
            }).not.toThrow();
        });

        it('옵션 없이 호출해도 에러가 발생하지 않는다', () => {
            const mockGroup = createMockGroup();
            const mockRef = createMockRef(mockGroup);

            expect(() => {
                renderHook(() =>
                    useAutoRotate(
                        mockRef as React.RefObject<THREE.Group | null>
                    )
                );
            }).not.toThrow();
        });

        it('여러 프레임에 걸쳐 누적 회전한다', () => {
            const mockGroup = createMockGroup();
            const mockRef = createMockRef(mockGroup);

            renderHook(() =>
                useAutoRotate(mockRef as React.RefObject<THREE.Group | null>, {
                    enabled: true,
                    speed: 1,
                })
            );

            // 3번 프레임 콜백
            frameCallback?.(null, 0.1);
            frameCallback?.(null, 0.1);
            frameCallback?.(null, 0.1);

            // 누적: 0.1 + 0.1 + 0.1 = 0.3
            expect(mockGroup.rotation.y).toBeCloseTo(0.3);
        });

        it('speed=0이면 회전하지 않는다', () => {
            const mockGroup = createMockGroup();
            const mockRef = createMockRef(mockGroup);

            renderHook(() =>
                useAutoRotate(mockRef as React.RefObject<THREE.Group | null>, {
                    enabled: true,
                    speed: 0,
                })
            );

            frameCallback?.(null, 1);

            expect(mockGroup.rotation.y).toBe(0);
        });

        it('음수 speed면 반대 방향으로 회전한다', () => {
            const mockGroup = createMockGroup();
            const mockRef = createMockRef(mockGroup);

            renderHook(() =>
                useAutoRotate(mockRef as React.RefObject<THREE.Group | null>, {
                    enabled: true,
                    speed: -1,
                })
            );

            frameCallback?.(null, 1);

            expect(mockGroup.rotation.y).toBe(-1);
        });
    });

    describe('반환값', () => {
        it('void를 반환한다', () => {
            const mockGroup = createMockGroup();
            const mockRef = createMockRef(mockGroup);

            const { result } = renderHook(() =>
                useAutoRotate(mockRef as React.RefObject<THREE.Group | null>, {
                    enabled: true,
                })
            );

            expect(result.current).toBeUndefined();
        });
    });
});
