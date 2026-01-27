/**
 * Extrude3DToggle.test.tsx
 * 3D 돌출 모드 토글 컴포넌트 테스트
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

import { Extrude3DToggle } from '../Extrude3DToggle';

describe('Extrude3DToggle', () => {
    describe('렌더링', () => {
        it('checked=true일 때 체크박스가 체크 상태', () => {
            render(<Extrude3DToggle checked={true} onChange={vi.fn()} />);

            expect(screen.getByRole('checkbox')).toBeChecked();
        });

        it('checked=false일 때 체크박스가 체크 해제 상태', () => {
            render(<Extrude3DToggle checked={false} onChange={vi.fn()} />);

            expect(screen.getByRole('checkbox')).not.toBeChecked();
        });

        it('기본 라벨 "3D Extrude" 표시', () => {
            render(<Extrude3DToggle checked={false} onChange={vi.fn()} />);

            expect(screen.getByText('3D Extrude')).toBeInTheDocument();
        });

        it('커스텀 라벨 표시', () => {
            render(
                <Extrude3DToggle
                    checked={false}
                    onChange={vi.fn()}
                    label="3D 돌출"
                />
            );

            expect(screen.getByText('3D 돌출')).toBeInTheDocument();
        });
    });

    describe('상호작용', () => {
        it('체크박스 클릭 시 onChange가 true로 호출됨', () => {
            const onChange = vi.fn();
            render(<Extrude3DToggle checked={false} onChange={onChange} />);

            fireEvent.click(screen.getByRole('checkbox'));

            expect(onChange).toHaveBeenCalledTimes(1);
            expect(onChange).toHaveBeenCalledWith(true);
        });

        it('체크박스 클릭 시 onChange가 false로 호출됨', () => {
            const onChange = vi.fn();
            render(<Extrude3DToggle checked={true} onChange={onChange} />);

            fireEvent.click(screen.getByRole('checkbox'));

            expect(onChange).toHaveBeenCalledTimes(1);
            expect(onChange).toHaveBeenCalledWith(false);
        });

        it('disabled=true일 때 onChange가 호출되지 않음', () => {
            const onChange = vi.fn();
            render(
                <Extrude3DToggle
                    checked={false}
                    onChange={onChange}
                    disabled={true}
                />
            );

            fireEvent.click(screen.getByRole('checkbox'));

            expect(onChange).not.toHaveBeenCalled();
        });
    });

    describe('접근성', () => {
        it('기본 aria-label은 label과 동일', () => {
            render(<Extrude3DToggle checked={false} onChange={vi.fn()} />);

            expect(screen.getByRole('checkbox')).toHaveAttribute(
                'aria-label',
                '3D Extrude'
            );
        });
    });
});
