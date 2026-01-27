/**
 * LayerPanel Component Tests
 * 레이어 패널 UI 컴포넌트 테스트
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { LayerPanel } from '../LayerPanel';

import type { LayerInfo } from '../../types';

// 테스트용 레이어 데이터 생성 헬퍼
const createMockLayers = (count: number): Map<string, LayerInfo> => {
    const layers = new Map<string, LayerInfo>();
    for (let i = 0; i < count; i++) {
        layers.set(`Layer${i}`, {
            name: `Layer${i}`,
            color: `#${((i * 111111) % 0xffffff).toString(16).padStart(6, '0')}`,
            visible: true,
            entityCount: (i + 1) * 10,
        });
    }
    return layers;
};

describe('LayerPanel', () => {
    const mockOnToggleLayer = vi.fn();
    const mockOnToggleAll = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('렌더링', () => {
        it('레이어가 없으면 null을 반환', () => {
            const { container } = render(
                <LayerPanel
                    layers={new Map()}
                    onToggleLayer={mockOnToggleLayer}
                />
            );

            expect(container.firstChild).toBeNull();
        });

        it('레이어 목록이 올바르게 렌더링됨', () => {
            const layers = createMockLayers(3);

            render(
                <LayerPanel layers={layers} onToggleLayer={mockOnToggleLayer} />
            );

            // 헤더 확인
            expect(screen.getByText('레이어 (3)')).toBeInTheDocument();

            // 각 레이어가 표시되는지 확인
            expect(screen.getByText('Layer0')).toBeInTheDocument();
            expect(screen.getByText('Layer1')).toBeInTheDocument();
            expect(screen.getByText('Layer2')).toBeInTheDocument();
        });

        it('레이어별 엔티티 수가 표시됨', () => {
            const layers = createMockLayers(2);

            render(
                <LayerPanel layers={layers} onToggleLayer={mockOnToggleLayer} />
            );

            expect(screen.getByText('10')).toBeInTheDocument();
            expect(screen.getByText('20')).toBeInTheDocument();
        });

        it('레이어가 1개일 때 전체 토글 버튼이 표시되지 않음', () => {
            const layers = createMockLayers(1);

            render(
                <LayerPanel
                    layers={layers}
                    onToggleLayer={mockOnToggleLayer}
                    onToggleAll={mockOnToggleAll}
                />
            );

            expect(screen.queryByText('전체 표시')).not.toBeInTheDocument();
            expect(screen.queryByText('전체 숨김')).not.toBeInTheDocument();
        });

        it('레이어가 2개 이상일 때 전체 토글 버튼이 표시됨', () => {
            const layers = createMockLayers(3);

            render(
                <LayerPanel
                    layers={layers}
                    onToggleLayer={mockOnToggleLayer}
                    onToggleAll={mockOnToggleAll}
                />
            );

            expect(screen.getByText('전체 표시')).toBeInTheDocument();
            expect(screen.getByText('전체 숨김')).toBeInTheDocument();
        });

        it('onToggleAll이 없으면 전체 토글 버튼이 표시되지 않음', () => {
            const layers = createMockLayers(3);

            render(
                <LayerPanel layers={layers} onToggleLayer={mockOnToggleLayer} />
            );

            expect(screen.queryByText('전체 표시')).not.toBeInTheDocument();
            expect(screen.queryByText('전체 숨김')).not.toBeInTheDocument();
        });
    });

    describe('레이어 토글 상호작용', () => {
        it('레이어 클릭 시 onToggleLayer가 호출됨', () => {
            const layers = createMockLayers(2);

            render(
                <LayerPanel layers={layers} onToggleLayer={mockOnToggleLayer} />
            );

            fireEvent.click(screen.getByText('Layer0'));

            expect(mockOnToggleLayer).toHaveBeenCalledWith('Layer0');
            expect(mockOnToggleLayer).toHaveBeenCalledTimes(1);
        });

        it('여러 레이어를 순차적으로 토글할 수 있음', () => {
            const layers = createMockLayers(3);

            render(
                <LayerPanel layers={layers} onToggleLayer={mockOnToggleLayer} />
            );

            fireEvent.click(screen.getByText('Layer0'));
            fireEvent.click(screen.getByText('Layer1'));
            fireEvent.click(screen.getByText('Layer2'));

            expect(mockOnToggleLayer).toHaveBeenCalledTimes(3);
            expect(mockOnToggleLayer).toHaveBeenNthCalledWith(1, 'Layer0');
            expect(mockOnToggleLayer).toHaveBeenNthCalledWith(2, 'Layer1');
            expect(mockOnToggleLayer).toHaveBeenNthCalledWith(3, 'Layer2');
        });
    });

    describe('전체 토글 상호작용', () => {
        it('전체 표시 버튼 클릭 시 onToggleAll(true) 호출', () => {
            const layers = createMockLayers(3);
            // 일부 레이어를 숨김 상태로 설정
            layers.get('Layer0')!.visible = false;

            render(
                <LayerPanel
                    layers={layers}
                    onToggleLayer={mockOnToggleLayer}
                    onToggleAll={mockOnToggleAll}
                />
            );

            fireEvent.click(screen.getByText('전체 표시'));

            expect(mockOnToggleAll).toHaveBeenCalledWith(true);
        });

        it('전체 숨김 버튼 클릭 시 onToggleAll(false) 호출', () => {
            const layers = createMockLayers(3);

            render(
                <LayerPanel
                    layers={layers}
                    onToggleLayer={mockOnToggleLayer}
                    onToggleAll={mockOnToggleAll}
                />
            );

            fireEvent.click(screen.getByText('전체 숨김'));

            expect(mockOnToggleAll).toHaveBeenCalledWith(false);
        });

        it('모든 레이어가 표시 상태면 전체 표시 버튼이 비활성화', () => {
            const layers = createMockLayers(2);
            // 모두 visible: true (기본값)

            render(
                <LayerPanel
                    layers={layers}
                    onToggleLayer={mockOnToggleLayer}
                    onToggleAll={mockOnToggleAll}
                />
            );

            const showAllButton = screen.getByText('전체 표시');
            expect(showAllButton).toBeDisabled();
        });

        it('모든 레이어가 숨김 상태면 전체 숨김 버튼이 비활성화', () => {
            const layers = createMockLayers(2);
            layers.forEach((layer) => {
                layer.visible = false;
            });

            render(
                <LayerPanel
                    layers={layers}
                    onToggleLayer={mockOnToggleLayer}
                    onToggleAll={mockOnToggleAll}
                />
            );

            const hideAllButton = screen.getByText('전체 숨김');
            expect(hideAllButton).toBeDisabled();
        });
    });

    describe('가시성 상태 표시', () => {
        it('표시 상태 레이어는 Eye 아이콘이 표시됨', () => {
            const layers = new Map<string, LayerInfo>([
                [
                    'VisibleLayer',
                    {
                        name: 'VisibleLayer',
                        color: '#ffffff',
                        visible: true,
                        entityCount: 10,
                    },
                ],
            ]);

            render(
                <LayerPanel layers={layers} onToggleLayer={mockOnToggleLayer} />
            );

            // lucide-react Eye 아이콘이 있는 버튼 확인
            const button = screen.getByRole('button');
            expect(button).toHaveClass('bg-gray-800/50');
        });

        it('숨김 상태 레이어는 opacity가 낮아짐', () => {
            const layers = new Map<string, LayerInfo>([
                [
                    'HiddenLayer',
                    {
                        name: 'HiddenLayer',
                        color: '#ffffff',
                        visible: false,
                        entityCount: 10,
                    },
                ],
            ]);

            render(
                <LayerPanel layers={layers} onToggleLayer={mockOnToggleLayer} />
            );

            const button = screen.getByRole('button');
            expect(button).toHaveClass('opacity-60');
        });
    });

    describe('색상 인디케이터', () => {
        it('레이어 색상이 인디케이터에 적용됨', () => {
            const layers = new Map<string, LayerInfo>([
                [
                    'RedLayer',
                    {
                        name: 'RedLayer',
                        color: '#ff0000',
                        visible: true,
                        entityCount: 5,
                    },
                ],
            ]);

            render(
                <LayerPanel layers={layers} onToggleLayer={mockOnToggleLayer} />
            );

            // 색상 인디케이터 스타일 확인
            const colorIndicator = document.querySelector(
                '[style*="background-color"]'
            );
            expect(colorIndicator).toHaveStyle({
                backgroundColor: 'rgb(255, 0, 0)',
            });
        });
    });

    describe('긴 레이어 이름 처리', () => {
        it('긴 레이어 이름은 truncate 처리됨', () => {
            const layers = new Map<string, LayerInfo>([
                [
                    'VeryLongLayerNameThatShouldBeTruncated',
                    {
                        name: 'VeryLongLayerNameThatShouldBeTruncated',
                        color: '#ffffff',
                        visible: true,
                        entityCount: 10,
                    },
                ],
            ]);

            render(
                <LayerPanel layers={layers} onToggleLayer={mockOnToggleLayer} />
            );

            const layerName = screen.getByText(
                'VeryLongLayerNameThatShouldBeTruncated'
            );
            expect(layerName).toHaveClass('truncate');
            expect(layerName).toHaveAttribute(
                'title',
                'VeryLongLayerNameThatShouldBeTruncated'
            );
        });
    });

    describe('가상 스크롤링', () => {
        it('50개 미만 레이어는 일반 렌더링', () => {
            const layers = createMockLayers(10);

            render(
                <LayerPanel layers={layers} onToggleLayer={mockOnToggleLayer} />
            );

            // 모든 레이어가 DOM에 존재해야 함
            for (let i = 0; i < 10; i++) {
                expect(screen.getByText(`Layer${i}`)).toBeInTheDocument();
            }
        });

        it('50개 이상 레이어는 가상 스크롤링 컨테이너를 사용', () => {
            const layers = createMockLayers(100);

            render(
                <LayerPanel
                    layers={layers}
                    onToggleLayer={mockOnToggleLayer}
                    onToggleAll={mockOnToggleAll}
                />
            );

            // 헤더에 총 레이어 수 표시
            expect(screen.getByText('레이어 (100)')).toBeInTheDocument();

            // 가상 스크롤링 컨테이너가 전체 높이를 가지고 있음
            // 100개 * 32px = 3200px
            const virtualContainer = document.querySelector(
                '[style*="height: 3200px"]'
            );
            expect(virtualContainer).toBeInTheDocument();
        });

        it('49개 레이어는 일반 렌더링을 사용', () => {
            const layers = createMockLayers(49);

            render(
                <LayerPanel layers={layers} onToggleLayer={mockOnToggleLayer} />
            );

            // 헤더에 레이어 수 표시
            expect(screen.getByText('레이어 (49)')).toBeInTheDocument();

            // 모든 레이어가 DOM에 존재해야 함 (가상 스크롤링 미사용)
            expect(screen.getByText('Layer0')).toBeInTheDocument();
            expect(screen.getByText('Layer48')).toBeInTheDocument();
        });
    });
});
