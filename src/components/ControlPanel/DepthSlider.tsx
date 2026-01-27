/**
 * DepthSlider - 3D 돌출 깊이 슬라이더 컴포넌트
 *
 * HATCH 3D 돌출 깊이를 제어하는 슬라이더 (디바운싱 포함)
 */

import { memo, useCallback, useState, useRef, useEffect } from 'react';

import { RotateCcw } from 'lucide-react';

import { DEPTH_SLIDER_CONFIG, DEFAULT_LABELS } from './constants';

/** DepthSlider Props */
interface DepthSliderProps {
    /** 현재 값 */
    value: number;
    /** 변경 핸들러 */
    onChange: (value: number) => void;
    /** 최소값 */
    min?: number;
    /** 최대값 */
    max?: number;
    /** 스텝 */
    step?: number;
    /** 라벨 텍스트 */
    label?: string;
    /** 값 표시 포맷 함수 */
    formatValue?: (value: number) => string;
    /** 리셋 버튼 표시 여부 */
    showReset?: boolean;
    /** 리셋 핸들러 */
    onReset?: () => void;
    /** 비활성화 여부 */
    disabled?: boolean;
    /** 접근성 라벨 */
    ariaLabel?: string;
}

/** 기본 값 포맷 함수 */
const defaultFormatValue = (value: number): string => value.toFixed(1);

function DepthSliderComponent({
    value,
    onChange,
    min = DEPTH_SLIDER_CONFIG.min,
    max = DEPTH_SLIDER_CONFIG.max,
    step = DEPTH_SLIDER_CONFIG.step,
    label = DEFAULT_LABELS.depth,
    formatValue = defaultFormatValue,
    showReset = false,
    onReset,
    disabled = false,
    ariaLabel,
}: DepthSliderProps) {
    // 로컬 상태로 즉각적인 UI 반응성 확보
    const [localValue, setLocalValue] = useState(value);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // 외부 value 변경 시 동기화
    useEffect(() => {
        setLocalValue(value);
    }, [value]);

    // 디바운스된 onChange 호출 (~60fps)
    const debouncedOnChange = useCallback(
        (newValue: number) => {
            if (debounceRef.current) {
                clearTimeout(debounceRef.current);
            }
            debounceRef.current = setTimeout(() => {
                onChange(newValue);
            }, 16);
        },
        [onChange]
    );

    // 슬라이더 변경 핸들러
    const handleChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const newValue = parseFloat(e.target.value);
            setLocalValue(newValue);
            debouncedOnChange(newValue);
        },
        [debouncedOnChange]
    );

    // 클린업
    useEffect(() => {
        return () => {
            if (debounceRef.current) {
                clearTimeout(debounceRef.current);
            }
        };
    }, []);

    return (
        <div className={`mb-3 ${disabled ? 'opacity-50' : ''}`}>
            <label className="mb-1 flex items-center justify-between text-xs text-gray-400">
                <span>{label}</span>
                <div className="flex items-center gap-2">
                    <span className="font-mono text-white">
                        {formatValue(localValue)}
                    </span>
                    {showReset && onReset && (
                        <button
                            onClick={onReset}
                            disabled={disabled}
                            className="rounded p-0.5 transition-colors hover:bg-gray-700 disabled:cursor-not-allowed"
                            title="기본값으로 리셋"
                            type="button"
                        >
                            <RotateCcw className="h-3 w-3" />
                        </button>
                    )}
                </div>
            </label>
            <input
                type="range"
                min={min}
                max={max}
                step={step}
                value={localValue}
                onChange={handleChange}
                disabled={disabled}
                aria-label={ariaLabel ?? label}
                className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-gray-700 accent-blue-500 disabled:cursor-not-allowed"
            />
            <div className="mt-1 flex justify-between text-[10px] text-gray-500">
                <span>{min}</span>
                <span>{max}</span>
            </div>
        </div>
    );
}

export const DepthSlider = memo(DepthSliderComponent);
