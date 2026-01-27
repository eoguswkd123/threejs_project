/**
 * RotateToggle - 자동 회전 토글 컴포넌트
 *
 * 3D 뷰어의 자동 회전 여부를 제어하는 체크박스
 */

import { memo } from 'react';

import { RefreshCw } from 'lucide-react';

import { ToggleControl } from '@/components/Common';

import { DEFAULT_LABELS } from './constants';

/** RotateToggle Props */
interface RotateToggleProps {
    /** 체크 상태 */
    checked: boolean;
    /** 변경 핸들러 */
    onChange: (checked: boolean) => void;
    /** 라벨 텍스트 */
    label?: string;
    /** 액센트 컬러 */
    accentColor?: 'green' | 'blue';
    /** 접근성 라벨 */
    ariaLabel?: string;
}

function RotateToggleComponent({
    checked,
    onChange,
    label = DEFAULT_LABELS.autoRotate,
    accentColor = 'green',
    ariaLabel,
}: RotateToggleProps): JSX.Element {
    return (
        <ToggleControl
            checked={checked}
            onChange={onChange}
            label={label}
            accentColor={accentColor}
            ariaLabel={ariaLabel}
            icon={<RefreshCw className="h-4 w-4 text-gray-400" />}
            marginClass="mb-3"
        />
    );
}

export const RotateToggle = memo(RotateToggleComponent);
