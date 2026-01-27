/**
 * ToggleControl - 범용 토글 체크박스 컴포넌트
 *
 * 아이콘과 라벨이 있는 체크박스 토글 UI
 * GridToggle, RotateToggle 등의 기반 컴포넌트로 사용
 */

import type { ReactNode } from 'react';
import { memo, useCallback } from 'react';

import { ACCENT_CLASSES } from './constants';

import type { AccentColor } from './constants';

/** ToggleControl Props */
interface ToggleControlProps {
    /** 체크 상태 */
    checked: boolean;
    /** 변경 핸들러 */
    onChange: (checked: boolean) => void;
    /** 라벨 텍스트 */
    label: string;
    /** 아이콘 */
    icon: ReactNode;
    /** 액센트 컬러 */
    accentColor?: AccentColor;
    /** 접근성 라벨 */
    ariaLabel?: string | undefined;
    /** 하단 마진 클래스 */
    marginClass?: string;
    /** 비활성화 여부 */
    disabled?: boolean;
}

function ToggleControlComponent({
    checked,
    onChange,
    label,
    icon,
    accentColor = 'green',
    ariaLabel,
    marginClass = 'mb-2',
    disabled = false,
}: ToggleControlProps): JSX.Element {
    const handleChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            if (disabled) return;
            onChange(e.target.checked);
        },
        [onChange, disabled]
    );

    return (
        <label
            className={`flex items-center justify-between ${marginClass} ${
                disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
            }`}
        >
            <div className="flex items-center gap-2">
                {icon}
                <span className="text-sm text-gray-200">{label}</span>
            </div>
            <input
                type="checkbox"
                checked={checked}
                onChange={handleChange}
                disabled={disabled}
                aria-label={ariaLabel ?? label}
                className={`h-4 w-4 rounded border-gray-600 bg-gray-700 ${ACCENT_CLASSES[accentColor].checkbox} ${
                    disabled ? 'cursor-not-allowed' : ''
                }`}
            />
        </label>
    );
}

export const ToggleControl = memo(ToggleControlComponent);
