/**
 * useCameraControl Hook Tests
 */

import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

import { useCameraControl } from '../useCameraControl';

// CAMERA_CONFIG 기본값: defaultPosition = [0, 0, 200], fov = 45
const DEFAULT_POSITION: [number, number, number] = [0, 0, 200];

// 테스트용 BoundingBox
function createTestBounds(size: number = 100) {
    return {
        min: { x: -size / 2, y: -size / 2, z: 0 },
        max: { x: size / 2, y: size / 2, z: 0 },
    };
}

// calculateCameraDistance mock
vi.mock('@/utils/cad', () => ({
    calculateCameraDistance: vi.fn((bounds) => {
        // 간단한 계산: bounds 크기에 기반한 거리 반환
        const width = bounds.max.x - bounds.min.x;
        const height = bounds.max.y - bounds.min.y;
        return Math.max(width, height) * 1.5;
    }),
}));

describe('useCameraControl', () => {
    describe('Initial State', () => {
        it('기본 위치로 초기화', () => {
            const { result } = renderHook(() => useCameraControl());

            expect(result.current.cameraPosition).toEqual(DEFAULT_POSITION);
        });

        it('initialPosition 옵션으로 초기화', () => {
            const customPosition: [number, number, number] = [10, 20, 30];
            const { result } = renderHook(() =>
                useCameraControl({ initialPosition: customPosition })
            );

            expect(result.current.cameraPosition).toEqual(customPosition);
        });

        it('autoFitCamera 옵션 기본값 true', () => {
            const bounds = createTestBounds(100);
            const { result } = renderHook(() => useCameraControl());

            // autoFitCamera=true (기본값)이므로 bounds 제공 시 자동 맞춤
            act(() => {
                result.current.resetCameraPosition(undefined, bounds);
            });

            // bounds 기반 계산된 거리 (mock: 150)
            expect(result.current.cameraPosition[2]).not.toBe(
                DEFAULT_POSITION[2]
            );
        });
    });

    describe('setCameraPosition', () => {
        it('카메라 위치 직접 설정', () => {
            const { result } = renderHook(() => useCameraControl());
            const newPosition: [number, number, number] = [100, 200, 300];

            act(() => {
                result.current.setCameraPosition(newPosition);
            });

            expect(result.current.cameraPosition).toEqual(newPosition);
        });

        it('새 배열 인스턴스 생성 (불변성)', () => {
            const { result } = renderHook(() => useCameraControl());
            const newPosition: [number, number, number] = [100, 200, 300];

            act(() => {
                result.current.setCameraPosition(newPosition);
            });

            // 원본과 다른 인스턴스여야 함
            expect(result.current.cameraPosition).not.toBe(newPosition);
            expect(result.current.cameraPosition).toEqual(newPosition);
        });
    });

    describe('updateFromBounds', () => {
        it('BoundingBox 기반 카메라 위치 계산', () => {
            const { result } = renderHook(() => useCameraControl());
            const bounds = createTestBounds(100);

            act(() => {
                result.current.updateFromBounds(bounds);
            });

            // x, y는 0으로 유지, z는 계산된 거리
            expect(result.current.cameraPosition[0]).toBe(0);
            expect(result.current.cameraPosition[1]).toBe(0);
            expect(result.current.cameraPosition[2]).toBe(150); // mock 계산값
        });

        it('다양한 크기의 BoundingBox 처리', () => {
            const { result } = renderHook(() => useCameraControl());
            const smallBounds = createTestBounds(50);
            const largeBounds = createTestBounds(200);

            act(() => {
                result.current.updateFromBounds(smallBounds);
            });
            const smallDistance = result.current.cameraPosition[2];

            act(() => {
                result.current.updateFromBounds(largeBounds);
            });
            const largeDistance = result.current.cameraPosition[2];

            // 큰 bounds는 더 큰 거리
            expect(largeDistance).toBeGreaterThan(smallDistance);
        });
    });

    describe('resetCameraPosition', () => {
        it('기본 위치로 리셋 (autoFit=false)', () => {
            const { result } = renderHook(() =>
                useCameraControl({ autoFitCamera: false })
            );

            // 먼저 다른 위치로 이동
            act(() => {
                result.current.setCameraPosition([100, 100, 100]);
            });

            act(() => {
                result.current.resetCameraPosition();
            });

            expect(result.current.cameraPosition).toEqual(DEFAULT_POSITION);
        });

        it('autoFit=true, bounds 제공 시 자동 맞춤', () => {
            const { result } = renderHook(() =>
                useCameraControl({ autoFitCamera: true })
            );
            const bounds = createTestBounds(100);

            act(() => {
                result.current.resetCameraPosition(true, bounds);
            });

            // x, y는 0, z는 계산된 거리
            expect(result.current.cameraPosition[0]).toBe(0);
            expect(result.current.cameraPosition[1]).toBe(0);
            expect(result.current.cameraPosition[2]).toBe(150);
        });

        it('autoFit=true, bounds=null 시 기본 위치', () => {
            const { result } = renderHook(() =>
                useCameraControl({ autoFitCamera: true })
            );

            act(() => {
                result.current.setCameraPosition([100, 100, 100]);
            });

            act(() => {
                result.current.resetCameraPosition(true, null);
            });

            expect(result.current.cameraPosition).toEqual(DEFAULT_POSITION);
        });

        it('autoFit 파라미터가 옵션보다 우선', () => {
            const { result } = renderHook(() =>
                useCameraControl({ autoFitCamera: false })
            );
            const bounds = createTestBounds(100);

            // 옵션은 false이지만 파라미터로 true 전달
            act(() => {
                result.current.resetCameraPosition(true, bounds);
            });

            // 파라미터 true가 우선이므로 bounds 기반 계산
            expect(result.current.cameraPosition[2]).toBe(150);
        });

        it('autoFit=undefined 시 옵션 값 사용', () => {
            const { result } = renderHook(() =>
                useCameraControl({ autoFitCamera: true })
            );
            const bounds = createTestBounds(100);

            act(() => {
                result.current.resetCameraPosition(undefined, bounds);
            });

            // 옵션값 true 사용
            expect(result.current.cameraPosition[2]).toBe(150);
        });
    });

    describe('Stable References', () => {
        it('함수 참조 안정성 (useCallback)', () => {
            const { result, rerender } = renderHook(() => useCameraControl());

            const {
                setCameraPosition: set1,
                updateFromBounds: update1,
                resetCameraPosition: reset1,
            } = result.current;

            // 리렌더링
            rerender();

            const {
                setCameraPosition: set2,
                updateFromBounds: update2,
                resetCameraPosition: reset2,
            } = result.current;

            // 동일 참조 유지
            expect(set1).toBe(set2);
            expect(update1).toBe(update2);
            expect(reset1).toBe(reset2);
        });

        it('autoFitCamera 변경 시 resetCameraPosition 참조 변경', () => {
            const { result, rerender } = renderHook(
                ({ autoFit }) => useCameraControl({ autoFitCamera: autoFit }),
                { initialProps: { autoFit: true } }
            );

            const { resetCameraPosition: reset1 } = result.current;

            // autoFitCamera 변경
            rerender({ autoFit: false });

            const { resetCameraPosition: reset2 } = result.current;

            // 의존성 변경으로 참조 변경
            expect(reset1).not.toBe(reset2);
        });
    });

    describe('Edge Cases', () => {
        it('음수 좌표 BoundingBox 처리', () => {
            const { result } = renderHook(() => useCameraControl());
            const bounds = {
                min: { x: -200, y: -200, z: -50 },
                max: { x: -100, y: -100, z: 50 },
            };

            expect(() => {
                act(() => {
                    result.current.updateFromBounds(bounds);
                });
            }).not.toThrow();
        });

        it('매우 작은 BoundingBox 처리', () => {
            const { result } = renderHook(() => useCameraControl());
            const bounds = createTestBounds(0.001);

            expect(() => {
                act(() => {
                    result.current.updateFromBounds(bounds);
                });
            }).not.toThrow();
        });

        it('매우 큰 BoundingBox 처리', () => {
            const { result } = renderHook(() => useCameraControl());
            const bounds = createTestBounds(100000);

            expect(() => {
                act(() => {
                    result.current.updateFromBounds(bounds);
                });
            }).not.toThrow();
        });
    });
});
