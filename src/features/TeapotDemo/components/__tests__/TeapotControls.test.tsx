/**
 * TeapotControls Component Tests
 * Teapot Demo HTML 오버레이 컨트롤 패널 테스트
 *
 * 주요 테스트:
 * - 모든 컨트롤 요소 렌더링
 * - Tessellation 슬라이더 동작
 * - Shading Mode 선택 동작
 * - Display 체크박스 (Lid, Body, Bottom)
 * - Auto Rotate 체크박스
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { TeapotControls } from '../TeapotControls';

import type { TeapotConfig } from '../../types';

const mockConfig: TeapotConfig = {
    showGrid: true,
    autoRotate: true,
    rotateSpeed: 1.0,
    tessellation: 15,
    shadingMode: 'smooth',
    showLid: true,
    showBody: true,
    showBottom: true,
};

describe('TeapotControls', () => {
    const mockOnConfigChange = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('렌더링', () => {
        it('컨트롤 패널 제목이 렌더링됨', () => {
            render(
                <TeapotControls
                    config={mockConfig}
                    onConfigChange={mockOnConfigChange}
                />
            );

            expect(screen.getByText('Teapot Controls')).toBeInTheDocument();
        });

        it('Tessellation 슬라이더가 렌더링됨', () => {
            render(
                <TeapotControls
                    config={mockConfig}
                    onConfigChange={mockOnConfigChange}
                />
            );

            expect(
                screen.getByRole('slider', { name: /tessellation/i })
            ).toBeInTheDocument();
            expect(
                screen.getByText(`Tessellation: ${mockConfig.tessellation}`)
            ).toBeInTheDocument();
        });

        it('Shading Mode 선택이 렌더링됨', () => {
            render(
                <TeapotControls
                    config={mockConfig}
                    onConfigChange={mockOnConfigChange}
                />
            );

            expect(
                screen.getByRole('combobox', { name: /shading mode/i })
            ).toBeInTheDocument();
        });

        it('6가지 Shading Mode 옵션이 모두 렌더링됨', () => {
            render(
                <TeapotControls
                    config={mockConfig}
                    onConfigChange={mockOnConfigChange}
                />
            );

            const select = screen.getByRole('combobox', {
                name: /shading mode/i,
            });
            const options = select.querySelectorAll('option');

            expect(options).toHaveLength(6);
            expect(options[0]).toHaveTextContent('Wireframe');
            expect(options[1]).toHaveTextContent('Flat');
            expect(options[2]).toHaveTextContent('Smooth');
            expect(options[3]).toHaveTextContent('Glossy');
            expect(options[4]).toHaveTextContent('Textured');
            expect(options[5]).toHaveTextContent('Reflective');
        });

        it('Display 체크박스들이 렌더링됨', () => {
            render(
                <TeapotControls
                    config={mockConfig}
                    onConfigChange={mockOnConfigChange}
                />
            );

            expect(screen.getByText('Lid')).toBeInTheDocument();
            expect(screen.getByText('Body')).toBeInTheDocument();
            expect(screen.getByText('Bottom')).toBeInTheDocument();
        });

        it('Auto Rotate 체크박스가 렌더링됨', () => {
            render(
                <TeapotControls
                    config={mockConfig}
                    onConfigChange={mockOnConfigChange}
                />
            );

            expect(screen.getByText('Auto Rotate')).toBeInTheDocument();
        });

        it('Tessellation 범위 표시 (2 ~ 50)', () => {
            render(
                <TeapotControls
                    config={mockConfig}
                    onConfigChange={mockOnConfigChange}
                />
            );

            expect(screen.getByText('2')).toBeInTheDocument();
            expect(screen.getByText('50')).toBeInTheDocument();
        });
    });

    describe('초기 config 값 표시', () => {
        it('Tessellation 슬라이더가 config 값을 표시', () => {
            render(
                <TeapotControls
                    config={mockConfig}
                    onConfigChange={mockOnConfigChange}
                />
            );

            const slider = screen.getByRole('slider', {
                name: /tessellation/i,
            });
            expect(slider).toHaveValue(String(mockConfig.tessellation));
        });

        it('Shading Mode 선택이 config 값을 표시', () => {
            render(
                <TeapotControls
                    config={mockConfig}
                    onConfigChange={mockOnConfigChange}
                />
            );

            const select = screen.getByRole('combobox', {
                name: /shading mode/i,
            });
            expect(select).toHaveValue(mockConfig.shadingMode);
        });

        it('체크박스들이 config 값을 반영', () => {
            render(
                <TeapotControls
                    config={mockConfig}
                    onConfigChange={mockOnConfigChange}
                />
            );

            const checkboxes = screen.getAllByRole('checkbox');
            // Lid, Body, Bottom, Auto Rotate (4개)
            expect(checkboxes).toHaveLength(4);

            // 모든 체크박스가 checked 상태
            checkboxes.forEach((checkbox) => {
                expect(checkbox).toBeChecked();
            });
        });

        it('체크 해제된 config 값 반영', () => {
            const uncheckedConfig: TeapotConfig = {
                ...mockConfig,
                showLid: false,
                showBody: false,
                showBottom: false,
                autoRotate: false,
            };

            render(
                <TeapotControls
                    config={uncheckedConfig}
                    onConfigChange={mockOnConfigChange}
                />
            );

            const checkboxes = screen.getAllByRole('checkbox');
            checkboxes.forEach((checkbox) => {
                expect(checkbox).not.toBeChecked();
            });
        });
    });

    describe('Tessellation 슬라이더', () => {
        it('슬라이더 값 변경 시 onConfigChange 호출', () => {
            render(
                <TeapotControls
                    config={mockConfig}
                    onConfigChange={mockOnConfigChange}
                />
            );

            const slider = screen.getByRole('slider', {
                name: /tessellation/i,
            });
            fireEvent.change(slider, { target: { value: '25' } });

            expect(mockOnConfigChange).toHaveBeenCalledWith({
                tessellation: 25,
            });
        });

        it('슬라이더 min/max 속성 확인', () => {
            render(
                <TeapotControls
                    config={mockConfig}
                    onConfigChange={mockOnConfigChange}
                />
            );

            const slider = screen.getByRole('slider', {
                name: /tessellation/i,
            });
            expect(slider).toHaveAttribute('min', '2');
            expect(slider).toHaveAttribute('max', '50');
            expect(slider).toHaveAttribute('step', '1');
        });
    });

    describe('Shading Mode 선택', () => {
        it('선택 변경 시 onConfigChange 호출', () => {
            render(
                <TeapotControls
                    config={mockConfig}
                    onConfigChange={mockOnConfigChange}
                />
            );

            const select = screen.getByRole('combobox', {
                name: /shading mode/i,
            });
            fireEvent.change(select, { target: { value: 'wireframe' } });

            expect(mockOnConfigChange).toHaveBeenCalledWith({
                shadingMode: 'wireframe',
            });
        });

        it('모든 쉐이딩 모드로 변경 가능', () => {
            const modes = [
                'wireframe',
                'flat',
                'smooth',
                'glossy',
                'textured',
                'reflective',
            ];

            render(
                <TeapotControls
                    config={mockConfig}
                    onConfigChange={mockOnConfigChange}
                />
            );

            const select = screen.getByRole('combobox', {
                name: /shading mode/i,
            });

            modes.forEach((mode) => {
                fireEvent.change(select, { target: { value: mode } });
                expect(mockOnConfigChange).toHaveBeenCalledWith({
                    shadingMode: mode,
                });
            });
        });
    });

    describe('Display 체크박스', () => {
        it('Lid 체크박스 토글 시 onConfigChange 호출', () => {
            render(
                <TeapotControls
                    config={mockConfig}
                    onConfigChange={mockOnConfigChange}
                />
            );

            const lidCheckbox = screen.getByRole('checkbox', { name: /lid/i });
            fireEvent.click(lidCheckbox);

            expect(mockOnConfigChange).toHaveBeenCalledWith({ showLid: false });
        });

        it('Body 체크박스 토글 시 onConfigChange 호출', () => {
            render(
                <TeapotControls
                    config={mockConfig}
                    onConfigChange={mockOnConfigChange}
                />
            );

            const bodyCheckbox = screen.getByRole('checkbox', {
                name: /body/i,
            });
            fireEvent.click(bodyCheckbox);

            expect(mockOnConfigChange).toHaveBeenCalledWith({
                showBody: false,
            });
        });

        it('Bottom 체크박스 토글 시 onConfigChange 호출', () => {
            render(
                <TeapotControls
                    config={mockConfig}
                    onConfigChange={mockOnConfigChange}
                />
            );

            const bottomCheckbox = screen.getByRole('checkbox', {
                name: /bottom/i,
            });
            fireEvent.click(bottomCheckbox);

            expect(mockOnConfigChange).toHaveBeenCalledWith({
                showBottom: false,
            });
        });

        it('체크 해제 상태에서 체크 시 true 전달', () => {
            const uncheckedConfig: TeapotConfig = {
                ...mockConfig,
                showLid: false,
            };

            render(
                <TeapotControls
                    config={uncheckedConfig}
                    onConfigChange={mockOnConfigChange}
                />
            );

            const lidCheckbox = screen.getByRole('checkbox', { name: /lid/i });
            fireEvent.click(lidCheckbox);

            expect(mockOnConfigChange).toHaveBeenCalledWith({ showLid: true });
        });
    });

    describe('Auto Rotate', () => {
        it('Auto Rotate 체크박스 토글 시 onConfigChange 호출', () => {
            render(
                <TeapotControls
                    config={mockConfig}
                    onConfigChange={mockOnConfigChange}
                />
            );

            const autoRotateCheckbox = screen.getByRole('checkbox', {
                name: /auto rotate/i,
            });
            fireEvent.click(autoRotateCheckbox);

            expect(mockOnConfigChange).toHaveBeenCalledWith({
                autoRotate: false,
            });
        });

        it('Auto Rotate 해제 상태에서 체크 시 true 전달', () => {
            const uncheckedConfig: TeapotConfig = {
                ...mockConfig,
                autoRotate: false,
            };

            render(
                <TeapotControls
                    config={uncheckedConfig}
                    onConfigChange={mockOnConfigChange}
                />
            );

            const autoRotateCheckbox = screen.getByRole('checkbox', {
                name: /auto rotate/i,
            });
            fireEvent.click(autoRotateCheckbox);

            expect(mockOnConfigChange).toHaveBeenCalledWith({
                autoRotate: true,
            });
        });
    });

    describe('접근성', () => {
        it('슬라이더에 aria-label이 설정됨', () => {
            render(
                <TeapotControls
                    config={mockConfig}
                    onConfigChange={mockOnConfigChange}
                />
            );

            const slider = screen.getByRole('slider', {
                name: /tessellation/i,
            });
            expect(slider).toHaveAttribute('aria-label', 'Tessellation level');
        });

        it('select에 aria-label이 설정됨', () => {
            render(
                <TeapotControls
                    config={mockConfig}
                    onConfigChange={mockOnConfigChange}
                />
            );

            const select = screen.getByRole('combobox', {
                name: /shading mode/i,
            });
            expect(select).toHaveAttribute('aria-label', 'Select shading mode');
        });

        it('모든 input에 htmlFor와 연결된 label이 있음', () => {
            render(
                <TeapotControls
                    config={mockConfig}
                    onConfigChange={mockOnConfigChange}
                />
            );

            // id가 있는 input들
            expect(screen.getByLabelText(/tessellation/i)).toBeInTheDocument();
            expect(screen.getByLabelText(/shading mode/i)).toBeInTheDocument();
        });
    });
});
