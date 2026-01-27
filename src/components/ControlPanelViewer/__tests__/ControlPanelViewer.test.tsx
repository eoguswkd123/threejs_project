/**
 * ControlPanelViewer.test.tsx
 * 통합 컨트롤 패널 컴포넌트 테스트
 *
 * 주요 테스트:
 * - 자식 컴포넌트 렌더링 (GridToggle, RotateToggle, SpeedSlider, ViewerActionButtons)
 * - 설정 변경 콜백 전파
 * - 메타데이터 조건부 렌더링 (그룹화된 Props)
 * - 도움말 표시 조건
 *
 * Props 그룹화 리팩토링 반영 (16개 → 8개 props)
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

import { ControlPanelViewer } from '../index';

import type { ViewerConfig } from '../types';

const defaultConfig: ViewerConfig = {
    showGrid: true,
    autoRotate: false,
    rotateSpeed: 1,
};

const defaultProps = {
    config: defaultConfig,
    onConfigChange: vi.fn(),
    onResetView: vi.fn(),
};

describe('ControlPanelViewer', () => {
    describe('렌더링', () => {
        it('Controls 제목이 표시됨', () => {
            render(<ControlPanelViewer {...defaultProps} />);

            expect(screen.getByText('Controls')).toBeInTheDocument();
        });

        it('GridToggle이 렌더링됨', () => {
            render(<ControlPanelViewer {...defaultProps} />);

            expect(screen.getByText('Grid')).toBeInTheDocument();
        });

        it('RotateToggle이 렌더링됨', () => {
            render(<ControlPanelViewer {...defaultProps} />);

            expect(screen.getByText('Auto Rotate')).toBeInTheDocument();
        });

        it('Reset 버튼이 렌더링됨', () => {
            render(<ControlPanelViewer {...defaultProps} />);

            expect(
                screen.getByRole('button', { name: /home/i })
            ).toBeInTheDocument();
        });
    });

    describe('조건부 렌더링', () => {
        it('autoRotate=true일 때 SpeedSlider 표시', () => {
            const config = { ...defaultConfig, autoRotate: true };
            render(<ControlPanelViewer {...defaultProps} config={config} />);

            expect(screen.getByText('Rotate Speed')).toBeInTheDocument();
        });

        it('autoRotate=false일 때 SpeedSlider 미표시', () => {
            const config = { ...defaultConfig, autoRotate: false };
            render(<ControlPanelViewer {...defaultProps} config={config} />);

            expect(screen.queryByText('Rotate Speed')).not.toBeInTheDocument();
        });

        it('metadata.data 있을 때 Clear 버튼 표시', () => {
            render(
                <ControlPanelViewer
                    {...defaultProps}
                    metadata={{
                        data: { name: 'test' },
                        render: (data) => <span>{data.name}</span>,
                    }}
                    onClear={vi.fn()}
                />
            );

            expect(
                screen.getByRole('button', { name: /close/i })
            ).toBeInTheDocument();
        });

        it('metadata 없을 때 Clear 버튼 미표시', () => {
            render(<ControlPanelViewer {...defaultProps} />);

            expect(
                screen.queryByRole('button', { name: /close/i })
            ).not.toBeInTheDocument();
        });

        it('metadata 없고 ui.helpText 있을 때 도움말 표시', () => {
            render(
                <ControlPanelViewer
                    {...defaultProps}
                    ui={{ helpText: '파일을 업로드하세요' }}
                />
            );

            expect(screen.getByText('파일을 업로드하세요')).toBeInTheDocument();
        });

        it('metadata 있을 때 helpText 미표시', () => {
            render(
                <ControlPanelViewer
                    {...defaultProps}
                    metadata={{
                        data: { name: 'test' },
                        render: (data) => <span>{data.name}</span>,
                    }}
                    ui={{ helpText: '파일을 업로드하세요' }}
                />
            );

            expect(
                screen.queryByText('파일을 업로드하세요')
            ).not.toBeInTheDocument();
        });
    });

    describe('render props 패턴 (MetadataConfig)', () => {
        it('metadata.render로 메타데이터 커스텀 렌더링', () => {
            const metadata = { fileName: 'test.dxf', size: 1024 };
            render(
                <ControlPanelViewer
                    {...defaultProps}
                    metadata={{
                        data: metadata,
                        render: (data) => (
                            <div data-testid="custom-metadata">
                                <span>{data.fileName}</span>
                                <span>{data.size} bytes</span>
                            </div>
                        ),
                    }}
                />
            );

            expect(screen.getByTestId('custom-metadata')).toBeInTheDocument();
            expect(screen.getByText('test.dxf')).toBeInTheDocument();
            expect(screen.getByText('1024 bytes')).toBeInTheDocument();
        });

        it('metadata.data가 null이면 메타데이터 섹션 미표시', () => {
            render(
                <ControlPanelViewer
                    {...defaultProps}
                    metadata={{
                        data: null,
                        render: () => <div data-testid="custom-metadata" />,
                    }}
                />
            );

            expect(
                screen.queryByTestId('custom-metadata')
            ).not.toBeInTheDocument();
        });
    });

    describe('콜백 전파', () => {
        it('Grid 토글 시 onConfigChange가 showGrid와 함께 호출됨', () => {
            const onConfigChange = vi.fn();
            render(
                <ControlPanelViewer
                    {...defaultProps}
                    onConfigChange={onConfigChange}
                />
            );

            fireEvent.click(screen.getByRole('checkbox', { name: 'Grid' }));

            expect(onConfigChange).toHaveBeenCalledWith({ showGrid: false });
        });

        it('AutoRotate 토글 시 onConfigChange가 autoRotate와 함께 호출됨', () => {
            const onConfigChange = vi.fn();
            render(
                <ControlPanelViewer
                    {...defaultProps}
                    onConfigChange={onConfigChange}
                />
            );

            fireEvent.click(
                screen.getByRole('checkbox', { name: 'Auto Rotate' })
            );

            expect(onConfigChange).toHaveBeenCalledWith({ autoRotate: true });
        });

        it('Reset 버튼 클릭 시 onResetView 호출됨', () => {
            const onResetView = vi.fn();
            render(
                <ControlPanelViewer
                    {...defaultProps}
                    onResetView={onResetView}
                />
            );

            fireEvent.click(screen.getByRole('button', { name: /home/i }));

            expect(onResetView).toHaveBeenCalledTimes(1);
        });

        it('Clear 버튼 클릭 시 onClear 호출됨', () => {
            const onClear = vi.fn();
            render(
                <ControlPanelViewer
                    {...defaultProps}
                    metadata={{
                        data: { name: 'test' },
                        render: (data) => <span>{data.name}</span>,
                    }}
                    onClear={onClear}
                />
            );

            fireEvent.click(screen.getByRole('button', { name: /close/i }));

            expect(onClear).toHaveBeenCalledTimes(1);
        });
    });

    describe('테마 및 스타일 (UIConfig)', () => {
        it('기본 accentColor는 green', () => {
            render(<ControlPanelViewer {...defaultProps} />);

            // GridToggle 체크박스가 green 스타일을 가짐
            const checkbox = screen.getByRole('checkbox', { name: 'Grid' });
            expect(checkbox).toHaveClass('text-green-500');
        });

        it('ui.accentColor=blue 적용', () => {
            render(
                <ControlPanelViewer
                    {...defaultProps}
                    ui={{ accentColor: 'blue' }}
                />
            );

            const checkbox = screen.getByRole('checkbox', { name: 'Grid' });
            expect(checkbox).toHaveClass('text-blue-500');
        });
    });

    describe('커스텀 라벨 (UIConfig)', () => {
        it('커스텀 resetLabel 적용', () => {
            render(
                <ControlPanelViewer
                    {...defaultProps}
                    ui={{ resetLabel: '초기화' }}
                />
            );

            expect(
                screen.getByRole('button', { name: /초기화/i })
            ).toBeInTheDocument();
        });

        it('커스텀 clearLabel 적용', () => {
            render(
                <ControlPanelViewer
                    {...defaultProps}
                    metadata={{
                        data: { name: 'test' },
                        render: (data) => <span>{data.name}</span>,
                    }}
                    onClear={vi.fn()}
                    ui={{ clearLabel: '닫기' }}
                />
            );

            expect(
                screen.getByRole('button', { name: /닫기/i })
            ).toBeInTheDocument();
        });
    });
});
