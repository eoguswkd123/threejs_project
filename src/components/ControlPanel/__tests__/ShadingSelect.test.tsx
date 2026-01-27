/**
 * ShadingSelect.test.tsx
 * Shading Mode 선택 컴포넌트 테스트
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

import { ShadingSelect } from '../ShadingSelect';

describe('ShadingSelect', () => {
    describe('렌더링', () => {
        it('초기값 렌더링', () => {
            render(<ShadingSelect value="flat" onChange={vi.fn()} />);

            expect(screen.getByRole('combobox')).toHaveValue('flat');
        });

        it('기본 라벨 "Shading" 표시', () => {
            render(<ShadingSelect value="flat" onChange={vi.fn()} />);

            expect(screen.getByText('Shading')).toBeInTheDocument();
        });

        it('커스텀 라벨 표시', () => {
            render(
                <ShadingSelect
                    value="flat"
                    onChange={vi.fn()}
                    label="쉐이딩 모드"
                />
            );

            expect(screen.getByText('쉐이딩 모드')).toBeInTheDocument();
        });
    });

    describe('옵션', () => {
        it('모든 쉐이딩 모드 옵션 표시', () => {
            render(<ShadingSelect value="flat" onChange={vi.fn()} />);

            expect(
                screen.getByRole('option', { name: 'Wireframe' })
            ).toBeInTheDocument();
            expect(
                screen.getByRole('option', { name: 'Flat' })
            ).toBeInTheDocument();
            expect(
                screen.getByRole('option', { name: 'Smooth' })
            ).toBeInTheDocument();
            expect(
                screen.getByRole('option', { name: 'Glossy' })
            ).toBeInTheDocument();
        });

        it('4개의 옵션이 존재', () => {
            render(<ShadingSelect value="flat" onChange={vi.fn()} />);

            const options = screen.getAllByRole('option');
            expect(options).toHaveLength(4);
        });

        it('각 옵션의 value가 올바름', () => {
            render(<ShadingSelect value="flat" onChange={vi.fn()} />);

            expect(
                screen.getByRole('option', { name: 'Wireframe' })
            ).toHaveValue('wireframe');
            expect(screen.getByRole('option', { name: 'Flat' })).toHaveValue(
                'flat'
            );
            expect(screen.getByRole('option', { name: 'Smooth' })).toHaveValue(
                'smooth'
            );
            expect(screen.getByRole('option', { name: 'Glossy' })).toHaveValue(
                'glossy'
            );
        });
    });

    describe('상호작용', () => {
        it('옵션 변경 시 onChange가 호출됨', () => {
            const onChange = vi.fn();
            render(<ShadingSelect value="flat" onChange={onChange} />);

            fireEvent.change(screen.getByRole('combobox'), {
                target: { value: 'smooth' },
            });

            expect(onChange).toHaveBeenCalledTimes(1);
            expect(onChange).toHaveBeenCalledWith('smooth');
        });

        it('glossy 모드로 변경', () => {
            const onChange = vi.fn();
            render(<ShadingSelect value="flat" onChange={onChange} />);

            fireEvent.change(screen.getByRole('combobox'), {
                target: { value: 'glossy' },
            });

            expect(onChange).toHaveBeenCalledWith('glossy');
        });

        it('wireframe 모드로 변경', () => {
            const onChange = vi.fn();
            render(<ShadingSelect value="flat" onChange={onChange} />);

            fireEvent.change(screen.getByRole('combobox'), {
                target: { value: 'wireframe' },
            });

            expect(onChange).toHaveBeenCalledWith('wireframe');
        });

        it('flat 모드로 변경', () => {
            const onChange = vi.fn();
            render(<ShadingSelect value="smooth" onChange={onChange} />);

            fireEvent.change(screen.getByRole('combobox'), {
                target: { value: 'flat' },
            });

            expect(onChange).toHaveBeenCalledWith('flat');
        });
    });

    describe('접근성', () => {
        it('기본 aria-label은 label과 동일', () => {
            render(<ShadingSelect value="flat" onChange={vi.fn()} />);

            expect(screen.getByRole('combobox')).toHaveAttribute(
                'aria-label',
                'Shading'
            );
        });

        it('커스텀 label이 aria-label에 적용됨', () => {
            render(
                <ShadingSelect
                    value="flat"
                    onChange={vi.fn()}
                    label="3D 쉐이딩"
                />
            );

            expect(screen.getByRole('combobox')).toHaveAttribute(
                'aria-label',
                '3D 쉐이딩'
            );
        });
    });

    describe('다양한 초기값', () => {
        it('wireframe 초기값', () => {
            render(<ShadingSelect value="wireframe" onChange={vi.fn()} />);

            expect(screen.getByRole('combobox')).toHaveValue('wireframe');
        });

        it('smooth 초기값', () => {
            render(<ShadingSelect value="smooth" onChange={vi.fn()} />);

            expect(screen.getByRole('combobox')).toHaveValue('smooth');
        });

        it('glossy 초기값', () => {
            render(<ShadingSelect value="glossy" onChange={vi.fn()} />);

            expect(screen.getByRole('combobox')).toHaveValue('glossy');
        });
    });
});
