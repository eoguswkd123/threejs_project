/**
 * GridToggle - Grid 표시 토글 컴포넌트
 *
 * 3D 뷰어의 그리드 표시 여부를 제어하는 체크박스
 */

import { memo } from 'react';

import { Grid3X3 } from 'lucide-react';

import { ToggleControl } from '@/components/Common';

import { DEFAULT_LABELS } from './constants';

/** GridToggle Props */
interface GridToggleProps {
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

function GridToggleComponent({
    checked,
    onChange,
    label = DEFAULT_LABELS.grid,
    accentColor = 'green',
    ariaLabel,
}: GridToggleProps): JSX.Element {
    return (
        <ToggleControl
            checked={checked}
            onChange={onChange}
            label={label}
            accentColor={accentColor}
            ariaLabel={ariaLabel}
            icon={<Grid3X3 className="h-4 w-4 text-gray-400" />}
            marginClass="mb-2"
        />
    );
}

export const GridToggle = memo(GridToggleComponent);
