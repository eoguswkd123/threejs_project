/**
 * ControlPanelViewer - 통합 Viewer 컨트롤 패널
 *
 * CadViewer, WorkerViewer 등에서 공유하는 컨트롤 UI
 * render props 패턴으로 메타데이터 표시 커스터마이징 가능
 *
 * Props 그룹화 리팩토링: 16개 → 8개 props
 */

import { memo, useCallback } from 'react';

import {
    GridToggle,
    RotateToggle,
    SpeedSlider,
    ViewerActionButtons,
    ShadingSelect,
    RenderModeSelect,
    Extrude3DToggle,
    DepthSlider,
    BevelToggle,
} from '@/components/ControlPanel';
import { DEFAULT_EXTRUDE_OPTIONS, type CadShadingMode } from '@/types/cad';

import type { ControlPanelViewerProps } from './types';

// ============================================================
// Styles
// ============================================================

const styles = {
    container: 'absolute right-4 top-4 flex min-w-[180px] flex-col gap-3',
    card: 'rounded-lg bg-gray-800/90 p-3 shadow-lg backdrop-blur-sm',
    title: 'mb-3 text-xs font-medium text-gray-400',
    helpText: 'text-xs text-gray-500',
};

function ControlPanelViewerComponent<T>({
    config,
    onConfigChange,
    onResetView,
    onClear,
    metadata,
    extrude,
    renderMode,
    ui,
    showShadingSelect = false,
    includeHologramOption = false,
}: ControlPanelViewerProps<T>) {
    // UI 설정 기본값
    const accentColor = ui?.accentColor ?? 'green';
    const resetLabel = ui?.resetLabel ?? 'Home';
    const clearLabel = ui?.clearLabel ?? 'Close';
    const helpText = ui?.helpText;

    // Config 핸들러
    const handleShadingChange = useCallback(
        (value: CadShadingMode) => onConfigChange({ shadingMode: value }),
        [onConfigChange]
    );

    const handleGridChange = useCallback(
        (checked: boolean) => onConfigChange({ showGrid: checked }),
        [onConfigChange]
    );

    const handleRotateChange = useCallback(
        (checked: boolean) => onConfigChange({ autoRotate: checked }),
        [onConfigChange]
    );

    const handleSpeedChange = useCallback(
        (value: number) => onConfigChange({ rotateSpeed: value }),
        [onConfigChange]
    );

    // Extrude 핸들러
    const handleDepthChange = useCallback(
        (depth: number) => {
            if (extrude) {
                extrude.onOptionsChange({ ...extrude.options, depth });
            }
        },
        [extrude]
    );

    const handleBevelChange = useCallback(
        (bevel: boolean) => {
            if (extrude) {
                extrude.onOptionsChange({ ...extrude.options, bevel });
            }
        },
        [extrude]
    );

    const handleDepthReset = useCallback(() => {
        if (extrude) {
            extrude.onOptionsChange(DEFAULT_EXTRUDE_OPTIONS);
        }
    }, [extrude]);

    return (
        <div className={styles.container}>
            {/* 메타데이터 표시 (render prop) */}
            {metadata?.data && metadata.render && (
                <div className={styles.card}>
                    {metadata.render(metadata.data)}
                </div>
            )}

            {/* 컨트롤 패널 */}
            <div className={styles.card}>
                <p className={styles.title}>Controls</p>

                {/* Shading Mode 선택 */}
                {showShadingSelect && config.shadingMode && (
                    <ShadingSelect
                        value={config.shadingMode}
                        onChange={handleShadingChange}
                        includeHologram={includeHologramOption}
                    />
                )}

                <GridToggle
                    checked={config.showGrid}
                    onChange={handleGridChange}
                    accentColor={accentColor}
                />

                <RotateToggle
                    checked={config.autoRotate}
                    onChange={handleRotateChange}
                    accentColor={accentColor}
                />

                {config.autoRotate && (
                    <SpeedSlider
                        value={config.rotateSpeed}
                        onChange={handleSpeedChange}
                    />
                )}

                {/* Extrude Controls (Phase 2.1.6) */}
                {extrude?.showControls && (
                    <>
                        {/* 구분선 */}
                        <div className="my-2 border-t border-gray-700" />

                        {/* 3D 모드 토글 */}
                        <Extrude3DToggle
                            checked={extrude.enabled}
                            onChange={extrude.onToggle}
                            accentColor={accentColor}
                        />

                        {/* 3D 활성화: Depth → Shading → Bevel */}
                        {extrude.enabled && (
                            <>
                                <DepthSlider
                                    value={extrude.options.depth}
                                    onChange={handleDepthChange}
                                    disabled={!extrude.enabled}
                                    showReset
                                    onReset={handleDepthReset}
                                />
                                <ShadingSelect
                                    value={config.shadingMode ?? 'flat'}
                                    onChange={handleShadingChange}
                                />
                                <BevelToggle
                                    checked={extrude.options.bevel ?? false}
                                    onChange={handleBevelChange}
                                    disabled={!extrude.enabled}
                                    accentColor={accentColor}
                                />
                            </>
                        )}

                        {/* 2D 모드: Render Mode */}
                        {!extrude.enabled && renderMode && (
                            <RenderModeSelect
                                value={renderMode.mode}
                                onChange={renderMode.onModeChange}
                            />
                        )}
                    </>
                )}

                <ViewerActionButtons
                    onReset={onResetView}
                    onClear={metadata?.data ? onClear : undefined}
                    resetLabel={resetLabel}
                    clearLabel={clearLabel}
                    resetIcon="home"
                />
            </div>

            {/* 도움말 (메타데이터 없을 때만 표시) */}
            {helpText && !metadata?.data && (
                <div className={styles.card}>
                    <p className={styles.helpText}>{helpText}</p>
                </div>
            )}
        </div>
    );
}

export const ControlPanelViewer = memo(
    ControlPanelViewerComponent
) as typeof ControlPanelViewerComponent;
