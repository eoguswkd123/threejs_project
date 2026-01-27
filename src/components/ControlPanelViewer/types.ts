/**
 * ControlPanelViewer - Type Definitions
 *
 * Props 그룹화 리팩토링: 16개 → 8개 props
 * - ExtrudeConfig: 3D 돌출 관련 (5개 → 1개)
 * - RenderModeConfig: 2D 렌더 모드 관련 (2개 → 1개)
 * - MetadataConfig: 메타데이터 관련 (2개 → 1개)
 * - UIConfig: UI 커스터마이징 관련 (4개 → 1개)
 */

import type { ReactNode } from 'react';

import type { RenderMode } from '@/components/ControlPanel';
import type { CadShadingMode, ExtrudeOptions } from '@/types/cad';

/** Viewer 설정 */
export interface ViewerConfig {
    /** 그리드 표시 여부 */
    showGrid: boolean;
    /** 자동 회전 여부 */
    autoRotate: boolean;
    /** 회전 속도 */
    rotateSpeed: number;
    /** 쉐이딩 모드 */
    shadingMode?: CadShadingMode;
    /** 배경색 */
    backgroundColor?: string;
    /** 카메라 자동 맞춤 */
    autoFitCamera?: boolean;
}

// ============================================================
// 그룹화된 Props 인터페이스
// ============================================================

/** Extrude 관련 Props 그룹 (Phase 2.1.6) */
export interface ExtrudeConfig {
    /** 컨트롤 표시 여부 */
    showControls: boolean;
    /** 3D 돌출 활성화 여부 */
    enabled: boolean;
    /** 돌출 옵션 */
    options: ExtrudeOptions;
    /** 3D 토글 콜백 */
    onToggle: (enabled: boolean) => void;
    /** 옵션 변경 콜백 */
    onOptionsChange: (options: ExtrudeOptions) => void;
}

/** Render Mode 관련 Props 그룹 (2D HATCH) */
export interface RenderModeConfig {
    /** 현재 렌더 모드 */
    mode: RenderMode;
    /** 렌더 모드 변경 콜백 */
    onModeChange: (mode: RenderMode) => void;
}

/** Metadata 관련 Props 그룹 */
export interface MetadataConfig<T> {
    /** 메타데이터 */
    data: T | null;
    /** 메타데이터 렌더러 (render prop) */
    render: (data: T) => ReactNode;
}

/** UI 커스터마이징 Props 그룹 */
export interface UIConfig {
    /** 테마 색상 */
    accentColor?: 'green' | 'blue';
    /** 리셋 버튼 라벨 */
    resetLabel?: string;
    /** 클리어 버튼 라벨 */
    clearLabel?: string;
    /** 도움말 텍스트 */
    helpText?: string;
}

// ============================================================
// ControlPanelViewer Props (리팩토링됨)
// ============================================================

/** ControlPanelViewer Props */
export interface ControlPanelViewerProps<T = unknown> {
    // === Core Config (유지) ===
    /** 뷰어 설정 */
    config: ViewerConfig;
    /** 설정 변경 콜백 */
    onConfigChange: (config: Partial<ViewerConfig>) => void;

    // === Actions (유지) ===
    /** 뷰 리셋 콜백 */
    onResetView: () => void;
    /** 클리어 콜백 (파일 닫기/모델 제거) */
    onClear?: () => void;

    // === 그룹화된 Props ===
    /** 메타데이터 설정 */
    metadata?: MetadataConfig<T>;
    /** Extrude 설정 (3D 돌출) */
    extrude?: ExtrudeConfig;
    /** Render Mode 설정 (2D HATCH) */
    renderMode?: RenderModeConfig;
    /** UI 커스터마이징 */
    ui?: UIConfig;

    /** Shading Select 표시 여부 (3D 모드 외부에서도 사용) */
    showShadingSelect?: boolean;
    /** Hologram 옵션 포함 여부 (HologramViewer에서만 true) */
    includeHologramOption?: boolean;
}
