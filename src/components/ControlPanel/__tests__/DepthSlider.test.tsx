/**
 * DepthSlider.test.tsx
 * 3D 돌출 깊이 슬라이더 컴포넌트 테스트
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { DepthSlider } from '../DepthSlider';

describe('DepthSlider', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    describe('렌더링', () => {
        it('현재 값을 표시', () => {
            render(<DepthSlider value={50} onChange={vi.fn()} />);

            expect(screen.getByText('50.0')).toBeInTheDocument();
        });

        it('기본 라벨 "Depth" 표시', () => {
            render(<DepthSlider value={10} onChange={vi.fn()} />);

            expect(screen.getByText('Depth')).toBeInTheDocument();
        });

        it('커스텀 라벨 표시', () => {
            render(
                <DepthSlider value={10} onChange={vi.fn()} label="돌출 깊이" />
            );

            expect(screen.getByText('돌출 깊이')).toBeInTheDocument();
        });

        it('min/max 범위 표시', () => {
            render(
                <DepthSlider value={10} onChange={vi.fn()} min={0} max={100} />
            );

            expect(screen.getByText('0')).toBeInTheDocument();
            expect(screen.getByText('100')).toBeInTheDocument();
        });

        it('showReset=true일 때 리셋 버튼 표시', () => {
            render(
                <DepthSlider
                    value={10}
                    onChange={vi.fn()}
                    showReset={true}
                    onReset={vi.fn()}
                />
            );

            expect(screen.getByTitle('기본값으로 리셋')).toBeInTheDocument();
        });

        it('showReset=false일 때 리셋 버튼 미표시', () => {
            render(
                <DepthSlider value={10} onChange={vi.fn()} showReset={false} />
            );

            expect(
                screen.queryByTitle('기본값으로 리셋')
            ).not.toBeInTheDocument();
        });
    });

    describe('상호작용', () => {
        it('슬라이더 변경 시 디바운스 후 onChange 호출', () => {
            const onChange = vi.fn();
            render(<DepthSlider value={10} onChange={onChange} />);

            const slider = screen.getByRole('slider');
            fireEvent.change(slider, { target: { value: '50' } });

            // 디바운스 전에는 호출되지 않음
            expect(onChange).not.toHaveBeenCalled();

            // 16ms 후 호출됨
            vi.advanceTimersByTime(20);
            expect(onChange).toHaveBeenCalledWith(50);
        });

        it('리셋 버튼 클릭 시 onReset 호출', () => {
            const onReset = vi.fn();
            render(
                <DepthSlider
                    value={50}
                    onChange={vi.fn()}
                    showReset={true}
                    onReset={onReset}
                />
            );

            fireEvent.click(screen.getByTitle('기본값으로 리셋'));

            expect(onReset).toHaveBeenCalledTimes(1);
        });

        it('disabled=true일 때 슬라이더 비활성화', () => {
            render(
                <DepthSlider value={10} onChange={vi.fn()} disabled={true} />
            );

            expect(screen.getByRole('slider')).toBeDisabled();
        });
    });

    describe('커스텀 포맷', () => {
        it('formatValue로 값 포맷 커스터마이징', () => {
            render(
                <DepthSlider
                    value={10}
                    onChange={vi.fn()}
                    formatValue={(v) => `${v}mm`}
                />
            );

            expect(screen.getByText('10mm')).toBeInTheDocument();
        });
    });
});
