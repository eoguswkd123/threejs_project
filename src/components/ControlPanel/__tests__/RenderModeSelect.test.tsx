/**
 * RenderModeSelect.test.tsx
 * Render Mode 선택 컴포넌트 테스트
 *
 * 주요 테스트:
 * - 초기값 렌더링
 * - 옵션 표시
 * - onChange 콜백 호출
 * - 라벨 표시
 * - 접근성
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

import { RenderModeSelect } from '../RenderModeSelect';

describe('RenderModeSelect', () => {
    describe('렌더링', () => {
        it('초기값 렌더링', () => {
            render(<RenderModeSelect value="outline" onChange={vi.fn()} />);

            expect(screen.getByRole('combobox')).toHaveValue('outline');
        });

        it('기본 라벨 "Render Mode" 표시', () => {
            render(<RenderModeSelect value="outline" onChange={vi.fn()} />);

            expect(screen.getByText('Render Mode')).toBeInTheDocument();
        });

        it('커스텀 라벨 표시', () => {
            render(
                <RenderModeSelect
                    value="outline"
                    onChange={vi.fn()}
                    label="렌더 모드"
                />
            );

            expect(screen.getByText('렌더 모드')).toBeInTheDocument();
        });
    });

    describe('옵션', () => {
        it('모든 렌더 모드 옵션 표시', () => {
            render(<RenderModeSelect value="outline" onChange={vi.fn()} />);

            expect(
                screen.getByRole('option', { name: 'Outline' })
            ).toBeInTheDocument();
            expect(
                screen.getByRole('option', { name: 'Solid Fill' })
            ).toBeInTheDocument();
            expect(
                screen.getByRole('option', { name: 'Pattern Fill' })
            ).toBeInTheDocument();
        });

        it('3개의 옵션이 존재', () => {
            render(<RenderModeSelect value="outline" onChange={vi.fn()} />);

            const options = screen.getAllByRole('option');
            expect(options).toHaveLength(3);
        });

        it('각 옵션의 value가 올바름', () => {
            render(<RenderModeSelect value="outline" onChange={vi.fn()} />);

            expect(screen.getByRole('option', { name: 'Outline' })).toHaveValue(
                'outline'
            );
            expect(
                screen.getByRole('option', { name: 'Solid Fill' })
            ).toHaveValue('solid');
            expect(
                screen.getByRole('option', { name: 'Pattern Fill' })
            ).toHaveValue('pattern');
        });
    });

    describe('상호작용', () => {
        it('옵션 변경 시 onChange가 호출됨', () => {
            const onChange = vi.fn();
            render(<RenderModeSelect value="outline" onChange={onChange} />);

            fireEvent.change(screen.getByRole('combobox'), {
                target: { value: 'solid' },
            });

            expect(onChange).toHaveBeenCalledTimes(1);
            expect(onChange).toHaveBeenCalledWith('solid');
        });

        it('pattern 모드로 변경', () => {
            const onChange = vi.fn();
            render(<RenderModeSelect value="outline" onChange={onChange} />);

            fireEvent.change(screen.getByRole('combobox'), {
                target: { value: 'pattern' },
            });

            expect(onChange).toHaveBeenCalledWith('pattern');
        });

        it('outline 모드로 변경', () => {
            const onChange = vi.fn();
            render(<RenderModeSelect value="solid" onChange={onChange} />);

            fireEvent.change(screen.getByRole('combobox'), {
                target: { value: 'outline' },
            });

            expect(onChange).toHaveBeenCalledWith('outline');
        });
    });

    describe('접근성', () => {
        it('기본 aria-label은 label과 동일', () => {
            render(<RenderModeSelect value="outline" onChange={vi.fn()} />);

            expect(screen.getByRole('combobox')).toHaveAttribute(
                'aria-label',
                'Render Mode'
            );
        });

        it('커스텀 label이 aria-label에 적용됨', () => {
            render(
                <RenderModeSelect
                    value="outline"
                    onChange={vi.fn()}
                    label="2D 렌더링 모드"
                />
            );

            expect(screen.getByRole('combobox')).toHaveAttribute(
                'aria-label',
                '2D 렌더링 모드'
            );
        });
    });

    describe('다양한 초기값', () => {
        it('solid 초기값', () => {
            render(<RenderModeSelect value="solid" onChange={vi.fn()} />);

            expect(screen.getByRole('combobox')).toHaveValue('solid');
        });

        it('pattern 초기값', () => {
            render(<RenderModeSelect value="pattern" onChange={vi.fn()} />);

            expect(screen.getByRole('combobox')).toHaveValue('pattern');
        });
    });
});
