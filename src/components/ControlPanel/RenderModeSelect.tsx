/**
 * RenderModeSelect - Render Mode 선택 컴포넌트
 *
 * 2D CAD 렌더링 모드를 제어하는 셀렉트 박스
 */

import { memo, useCallback } from 'react';

import { Layers } from 'lucide-react';

import type { HatchFillMode } from '@/types/cad';

/** Render Mode 타입 (2D HATCH용) - HatchFillMode alias */
export type RenderMode = HatchFillMode;

/** Render Mode 옵션 */
const RENDER_OPTIONS: readonly { value: RenderMode; label: string }[] = [
    { value: 'outline', label: 'Outline' },
    { value: 'solid', label: 'Solid Fill' },
    { value: 'pattern', label: 'Pattern Fill' },
];

/** RenderModeSelect Props */
interface RenderModeSelectProps {
    /** 현재 선택된 값 */
    value: RenderMode;
    /** 변경 핸들러 */
    onChange: (value: RenderMode) => void;
    /** 라벨 텍스트 */
    label?: string;
    /** 접근성 라벨 */
    ariaLabel?: string;
}

function RenderModeSelectComponent({
    value,
    onChange,
    label = 'Render Mode',
    ariaLabel,
}: RenderModeSelectProps): JSX.Element {
    const handleChange = useCallback(
        (e: React.ChangeEvent<HTMLSelectElement>) => {
            onChange(e.target.value as RenderMode);
        },
        [onChange]
    );

    return (
        <div className="mb-3">
            <div className="mb-1 flex items-center gap-2">
                <Layers className="h-4 w-4 text-gray-400" />
                <span className="text-xs text-gray-400">{label}</span>
            </div>
            <select
                value={value}
                onChange={handleChange}
                aria-label={ariaLabel ?? label}
                className="w-full rounded border border-gray-600 bg-gray-700 px-2 py-1.5 text-sm text-gray-200 focus:border-transparent focus:ring-2 focus:ring-green-500 focus:outline-none"
            >
                {RENDER_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>
        </div>
    );
}

export const RenderModeSelect = memo(RenderModeSelectComponent);
