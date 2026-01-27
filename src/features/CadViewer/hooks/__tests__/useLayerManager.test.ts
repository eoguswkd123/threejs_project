/**
 * useLayerManager Hook Tests
 */

import { renderHook, act } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

import type { LayerInfo } from '@/types/cad';

import { useLayerManager } from '../useLayerManager';

// 테스트용 레이어 데이터 생성
function createTestLayers(): Map<string, LayerInfo> {
    return new Map([
        [
            'Layer1',
            { name: 'Layer1', color: '#FF0000', visible: true, entityCount: 5 },
        ],
        [
            'Layer2',
            {
                name: 'Layer2',
                color: '#00FF00',
                visible: true,
                entityCount: 10,
            },
        ],
        [
            'Layer3',
            {
                name: 'Layer3',
                color: '#0000FF',
                visible: false,
                entityCount: 3,
            },
        ],
    ]);
}

describe('useLayerManager', () => {
    describe('Initial State', () => {
        it('빈 Map으로 초기화', () => {
            const { result } = renderHook(() => useLayerManager());

            expect(result.current.layers).toBeInstanceOf(Map);
            expect(result.current.layers.size).toBe(0);
        });

        it('initialLayers 옵션으로 초기화', () => {
            const initialLayers = createTestLayers();
            const { result } = renderHook(() =>
                useLayerManager({ initialLayers })
            );

            expect(result.current.layers.size).toBe(3);
            expect(result.current.layers.get('Layer1')?.visible).toBe(true);
        });
    });

    describe('setLayers', () => {
        it('새 레이어 맵 설정', () => {
            const { result } = renderHook(() => useLayerManager());
            const newLayers = createTestLayers();

            act(() => {
                result.current.setLayers(newLayers);
            });

            expect(result.current.layers.size).toBe(3);
            expect(result.current.layers.get('Layer1')?.name).toBe('Layer1');
        });

        it('새 Map 인스턴스 생성 (불변성)', () => {
            const { result } = renderHook(() => useLayerManager());
            const originalLayers = createTestLayers();

            act(() => {
                result.current.setLayers(originalLayers);
            });

            // 원본과 다른 인스턴스여야 함
            expect(result.current.layers).not.toBe(originalLayers);
        });
    });

    describe('handleToggleLayer', () => {
        it('개별 레이어 visible 토글', () => {
            const initialLayers = createTestLayers();
            const { result } = renderHook(() =>
                useLayerManager({ initialLayers })
            );

            // Layer1: true → false
            act(() => {
                result.current.handleToggleLayer('Layer1');
            });
            expect(result.current.layers.get('Layer1')?.visible).toBe(false);

            // Layer1: false → true
            act(() => {
                result.current.handleToggleLayer('Layer1');
            });
            expect(result.current.layers.get('Layer1')?.visible).toBe(true);
        });

        it('존재하지 않는 레이어는 무시', () => {
            const initialLayers = createTestLayers();
            const { result } = renderHook(() =>
                useLayerManager({ initialLayers })
            );
            const originalSize = result.current.layers.size;

            act(() => {
                result.current.handleToggleLayer('NonExistent');
            });

            expect(result.current.layers.size).toBe(originalSize);
        });

        it('다른 레이어에 영향 없음', () => {
            const initialLayers = createTestLayers();
            const { result } = renderHook(() =>
                useLayerManager({ initialLayers })
            );
            const layer2VisibleBefore =
                result.current.layers.get('Layer2')?.visible;

            act(() => {
                result.current.handleToggleLayer('Layer1');
            });

            expect(result.current.layers.get('Layer2')?.visible).toBe(
                layer2VisibleBefore
            );
        });
    });

    describe('handleToggleAllLayers', () => {
        it('모든 레이어 표시 (visible = true)', () => {
            const initialLayers = createTestLayers();
            const { result } = renderHook(() =>
                useLayerManager({ initialLayers })
            );

            act(() => {
                result.current.handleToggleAllLayers(true);
            });

            for (const layer of result.current.layers.values()) {
                expect(layer.visible).toBe(true);
            }
        });

        it('모든 레이어 숨김 (visible = false)', () => {
            const initialLayers = createTestLayers();
            const { result } = renderHook(() =>
                useLayerManager({ initialLayers })
            );

            act(() => {
                result.current.handleToggleAllLayers(false);
            });

            for (const layer of result.current.layers.values()) {
                expect(layer.visible).toBe(false);
            }
        });

        it('빈 레이어 맵에서도 에러 없이 동작', () => {
            const { result } = renderHook(() => useLayerManager());

            expect(() => {
                act(() => {
                    result.current.handleToggleAllLayers(true);
                });
            }).not.toThrow();
        });
    });

    describe('resetLayers', () => {
        it('레이어 맵 초기화', () => {
            const initialLayers = createTestLayers();
            const { result } = renderHook(() =>
                useLayerManager({ initialLayers })
            );

            expect(result.current.layers.size).toBe(3);

            act(() => {
                result.current.resetLayers();
            });

            expect(result.current.layers.size).toBe(0);
        });
    });

    describe('Stable References', () => {
        it('함수 참조 안정성 (useCallback)', () => {
            const { result, rerender } = renderHook(() => useLayerManager());

            const {
                setLayers: setLayers1,
                handleToggleLayer: toggleLayer1,
                handleToggleAllLayers: toggleAll1,
                resetLayers: reset1,
            } = result.current;

            // 리렌더링
            rerender();

            const {
                setLayers: setLayers2,
                handleToggleLayer: toggleLayer2,
                handleToggleAllLayers: toggleAll2,
                resetLayers: reset2,
            } = result.current;

            // 동일 참조 유지
            expect(setLayers1).toBe(setLayers2);
            expect(toggleLayer1).toBe(toggleLayer2);
            expect(toggleAll1).toBe(toggleAll2);
            expect(reset1).toBe(reset2);
        });
    });
});
