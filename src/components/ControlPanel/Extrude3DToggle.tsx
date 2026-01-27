/**
 * Extrude3DToggle - 3D 돌출 모드 토글 컴포넌트
 *
 * HATCH 패턴의 3D 돌출 활성화/비활성화 체크박스
 */

import { memo } from 'react';

import { Box } from 'lucide-react';

import { ToggleControl } from '@/components/Common';

import { DEFAULT_LABELS } from './constants';

/** Extrude3DToggle Props */
interface Extrude3DToggleProps {
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

function Extrude3DToggleComponent({
    checked,
    onChange,
    label = DEFAULT_LABELS.extrude3D,
    accentColor = 'blue',
    disabled = false,
    ariaLabel,
}: Extrude3DToggleProps): JSX.Element {
    return (
        <ToggleControl
            checked={checked}
            onChange={onChange}
            label={label}
            accentColor={accentColor}
            disabled={disabled}
            ariaLabel={ariaLabel}
            icon={<Box className="h-4 w-4 text-gray-400" />}
            marginClass="mb-2"
        />
    );
}

export const Extrude3DToggle = memo(Extrude3DToggleComponent);
