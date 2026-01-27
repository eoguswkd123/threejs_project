/**
 * BevelToggle.test.tsx
 * 베벨(모서리) 토글 컴포넌트 테스트
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

import { BevelToggle } from '../BevelToggle';

describe('BevelToggle', () => {
    describe('렌더링', () => {
        it('checked=true일 때 체크박스가 체크 상태', () => {
            render(<BevelToggle checked={true} onChange={vi.fn()} />);

            expect(screen.getByRole('checkbox')).toBeChecked();
        });

        it('checked=false일 때 체크박스가 체크 해제 상태', () => {
            render(<BevelToggle checked={false} onChange={vi.fn()} />);

            expect(screen.getByRole('checkbox')).not.toBeChecked();
        });

        it('기본 라벨 "Bevel" 표시', () => {
            render(<BevelToggle checked={false} onChange={vi.fn()} />);

            expect(screen.getByText('Bevel')).toBeInTheDocument();
        });

        it('커스텀 라벨 표시', () => {
            render(
                <BevelToggle
                    checked={false}
                    onChange={vi.fn()}
                    label="베벨 (모서리)"
                />
            );

            expect(screen.getByText('베벨 (모서리)')).toBeInTheDocument();
        });
    });

    describe('상호작용', () => {
        it('체크박스 클릭 시 onChange가 true로 호출됨', () => {
            const onChange = vi.fn();
            render(<BevelToggle checked={false} onChange={onChange} />);

            fireEvent.click(screen.getByRole('checkbox'));

            expect(onChange).toHaveBeenCalledTimes(1);
            expect(onChange).toHaveBeenCalledWith(true);
        });

        it('체크박스 클릭 시 onChange가 false로 호출됨', () => {
            const onChange = vi.fn();
            render(<BevelToggle checked={true} onChange={onChange} />);

            fireEvent.click(screen.getByRole('checkbox'));

            expect(onChange).toHaveBeenCalledTimes(1);
            expect(onChange).toHaveBeenCalledWith(false);
        });

        it('disabled=true일 때 onChange가 호출되지 않음', () => {
            const onChange = vi.fn();
            render(
                <BevelToggle
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
            render(<BevelToggle checked={false} onChange={vi.fn()} />);

            expect(screen.getByRole('checkbox')).toHaveAttribute(
                'aria-label',
                'Bevel'
            );
        });
    });
});
