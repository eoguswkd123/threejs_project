/**
 * BevelToggle - 베벨(모서리) 토글 컴포넌트
 *
 * 3D 돌출 시 모서리 베벨 처리 활성화/비활성화 체크박스
 */

import { memo } from 'react';

import { Triangle } from 'lucide-react';

import { ToggleControl } from '@/components/Common';

import { DEFAULT_LABELS } from './constants';

/** BevelToggle Props */
interface BevelToggleProps {
    /** 체크 상태 */
    checked: boolean;
    /** 변경 핸들러 */
    onChange: (checked: boolean) => void;
    /** 라벨 텍스트 */
    label?: string;
    /** 액센트 컬러 */
    accentColor?: 'green' | 'blue';
    /** 비활성화 여부 */
    disabled?: boolean;
    /** 접근성 라벨 */
    ariaLabel?: string;
}

function BevelToggleComponent({
    checked,
    onChange,
    label = DEFAULT_LABELS.bevel,
    accentColor = 'blue',
    disabled = false,
    ariaLabel,
}: BevelToggleProps): JSX.Element {
    return (
        <ToggleControl
            checked={checked}
            onChange={onChange}
            label={label}
            accentColor={accentColor}
            disabled={disabled}
            ariaLabel={ariaLabel}
            icon={<Triangle className="h-4 w-4 text-gray-400" />}
            marginClass="mb-2"
        />
    );
}

export const BevelToggle = memo(BevelToggleComponent);
