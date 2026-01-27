/**
 * ViewerActionButtons - 뷰어 액션 버튼 컴포넌트
 *
 * Reset(뷰 리셋)과 Clear(파일/모델 삭제) 버튼을 제공
 *
 * @param props - 컴포넌트 속성
 * @param props.onReset - 리셋 버튼 클릭 핸들러
 * @param props.onClear - 클리어 버튼 클릭 핸들러 (선택, 없으면 버튼 숨김)
 * @param props.resetLabel - 리셋 버튼 라벨 (기본: 'Reset')
 * @param props.clearLabel - 클리어 버튼 라벨 (기본: 'Clear')
 * @param props.resetIcon - 리셋 아이콘 타입 ('rotate' | 'home')
 *
 * @example
 * ```tsx
 * <ViewerActionButtons
 *   onReset={handleReset}
 *   onClear={handleClear}
 *   resetIcon="rotate"
 * />
 * ```
 */

import { memo } from 'react';

import { Trash2 } from 'lucide-react';

import { Button } from '@/components/Common';

import { DEFAULT_LABELS, RESET_ICONS } from './constants';

/** Reset Icon 타입 */
export type ResetIconType = 'rotate' | 'home';

/**
 * ViewerActionButtons Props
 */
export interface ViewerActionButtonsProps {
    /** 리셋 핸들러 */
    onReset: () => void;
    /** 클리어 핸들러 (없으면 클리어 버튼 숨김) */
    onClear?: (() => void) | undefined;
    /** 리셋 버튼 라벨 */
    resetLabel?: string;
    /** 클리어 버튼 라벨 */
    clearLabel?: string;
    /** 리셋 아이콘 타입 */
    resetIcon?: ResetIconType;
}

function ViewerActionButtonsComponent({
    onReset,
    onClear,
    resetLabel = DEFAULT_LABELS.reset,
    clearLabel = DEFAULT_LABELS.clear,
    resetIcon = 'rotate',
}: ViewerActionButtonsProps) {
    const ResetIcon = RESET_ICONS[resetIcon];

    return (
        <div className="flex gap-2">
            <Button
                variant="ghost-dark"
                size="sm"
                onClick={onReset}
                aria-label={resetLabel}
                icon={<ResetIcon className="h-3 w-3" />}
                className="flex-1"
            >
                {resetLabel}
            </Button>

            {onClear && (
                <Button
                    variant="danger-dark"
                    size="sm"
                    onClick={onClear}
                    aria-label={clearLabel}
                    icon={<Trash2 className="h-3 w-3" />}
                    className="flex-1"
                >
                    {clearLabel}
                </Button>
            )}
        </div>
    );
}

export const ViewerActionButtons = memo(ViewerActionButtonsComponent);
