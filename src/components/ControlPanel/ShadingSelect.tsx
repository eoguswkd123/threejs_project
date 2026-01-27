/**
 * ShadingSelect - Shading Mode 선택 컴포넌트
 *
 * 3D 뷰어의 쉐이딩 모드를 제어하는 셀렉트 박스
 */

import { memo, useCallback, useMemo } from 'react';

import { Palette } from 'lucide-react';

import type { CadShadingMode } from '@/types/cad';

/** 기본 Shading Mode 옵션 (wireframe, flat, smooth, glossy) */
const BASE_SHADING_OPTIONS: readonly {
    value: CadShadingMode;
    label: string;
}[] = [
    { value: 'wireframe', label: 'Wireframe' },
    { value: 'flat', label: 'Flat' },
    { value: 'smooth', label: 'Smooth' },
    { value: 'glossy', label: 'Glossy' },
];

/** Hologram 옵션 (HologramViewer 전용) */
const HOLOGRAM_OPTION: { value: CadShadingMode; label: string } = {
    value: 'hologram',
    label: 'Hologram',
};

/** ShadingSelect Props */
interface ShadingSelectProps {
    /** 현재 선택된 값 */
    value: CadShadingMode;
    /** 변경 핸들러 */
    onChange: (value: CadShadingMode) => void;
    /** 라벨 텍스트 */
    label?: string;
    /** Hologram 옵션 포함 여부 (HologramViewer에서만 true) */
    includeHologram?: boolean;
    /** 접근성 라벨 */
    ariaLabel?: string;
}

function ShadingSelectComponent({
    value,
    onChange,
    label = 'Shading',
    includeHologram = false,
    ariaLabel,
}: ShadingSelectProps): JSX.Element {
    const handleChange = useCallback(
        (e: React.ChangeEvent<HTMLSelectElement>) => {
            onChange(e.target.value as CadShadingMode);
        },
        [onChange]
    );

    // includeHologram에 따라 옵션 동적 생성
    const options = useMemo(
        () =>
            includeHologram
                ? [...BASE_SHADING_OPTIONS, HOLOGRAM_OPTION]
                : BASE_SHADING_OPTIONS,
        [includeHologram]
    );

    return (
        <div className="mb-3">
            <div className="mb-1 flex items-center gap-2">
                <Palette className="h-4 w-4 text-gray-400" />
                <span className="text-xs text-gray-400">{label}</span>
            </div>
            <select
                value={value}
                onChange={handleChange}
                aria-label={ariaLabel ?? label}
                className="w-full rounded border border-gray-600 bg-gray-700 px-2 py-1.5 text-sm text-gray-200 focus:border-transparent focus:ring-2 focus:ring-green-500 focus:outline-none"
            >
                {options.map((option) => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>
        </div>
    );
}

export const ShadingSelect = memo(ShadingSelectComponent);
