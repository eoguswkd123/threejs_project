/**
 * DropZone - 범용 드래그앤드롭 컴포넌트
 *
 * 순수 드래그앤드롭 로직만 처리하는 원시 컴포넌트
 * Render Props 패턴으로 UI는 사용처에서 정의
 *
 * @example
 * <DropZone onDrop={handleFile} accept={['.glb']}>
 *     {({ isDragOver }) => (
 *         <div className={isDragOver ? 'active' : 'normal'}>
 *             드래그하여 파일 업로드
 *         </div>
 *     )}
 * </DropZone>
 */

import { memo, useState, useCallback, useRef } from 'react';

/** Render Props로 전달되는 상태 */
export interface DropZoneRenderProps {
    /** 드래그 오버 상태 */
    isDragOver: boolean;
    /** 파일 선택 다이얼로그 열기 */
    openFilePicker: () => void;
}

/** DropZone children 타입 - ReactNode 또는 Render Props 함수 */
export type DropZoneChildren =
    | React.ReactNode
    | ((props: DropZoneRenderProps) => React.ReactNode);

/**
 * 타입 가드: children이 Render Props 함수인지 확인
 * @param children - DropZone의 children prop
 * @returns children이 함수이면 true
 */
function isRenderPropChildren(
    children: DropZoneChildren
): children is (props: DropZoneRenderProps) => React.ReactNode {
    return typeof children === 'function';
}

/** DropZone Props */
export interface DropZoneProps {
    /** 파일 드롭 콜백 (단일 파일) */
    onDrop: (file: File) => void;
    /** 다중 파일 드롭 콜백 (multiple=true일 때 사용) */
    onDropMultiple?: (files: File[]) => void;
    /** 허용 확장자 (예: ['.glb', '.gltf']) */
    accept?: readonly string[];
    /** 다중 파일 선택 허용 */
    multiple?: boolean;
    /** 비활성화 */
    disabled?: boolean;
    /** 렌더링 함수 또는 React 노드 */
    children: DropZoneChildren;
    /** 컨테이너 클래스 */
    className?: string;
}

function DropZoneComponent({
    onDrop,
    onDropMultiple,
    accept,
    multiple = false,
    disabled = false,
    children,
    className,
}: DropZoneProps) {
    const [isDragOver, setIsDragOver] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleDragOver = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault();
            e.stopPropagation();
            if (!disabled) {
                setIsDragOver(true);
            }
        },
        [disabled]
    );

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(false);
    }, []);

    const handleDrop = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault();
            e.stopPropagation();
            setIsDragOver(false);

            if (disabled) return;

            const fileList = Array.from(e.dataTransfer.files);

            if (multiple && onDropMultiple && fileList.length > 1) {
                onDropMultiple(fileList);
            } else if (fileList[0]) {
                onDrop(fileList[0]);
            }
        },
        [disabled, multiple, onDrop, onDropMultiple]
    );

    const openFilePicker = useCallback(() => {
        if (!disabled && inputRef.current) {
            inputRef.current.click();
        }
    }, [disabled]);

    const handleChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const fileList = e.target.files ? Array.from(e.target.files) : [];

            if (multiple && onDropMultiple && fileList.length > 1) {
                onDropMultiple(fileList);
            } else if (fileList[0]) {
                onDrop(fileList[0]);
            }

            // input 초기화 (같은 파일 재선택 가능)
            if (inputRef.current) {
                inputRef.current.value = '';
            }
        },
        [multiple, onDrop, onDropMultiple]
    );

    const renderProps: DropZoneRenderProps = {
        isDragOver,
        openFilePicker,
    };

    // accept 속성 생성
    const acceptValue = accept?.join(',');

    return (
        <div
            className={className}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={openFilePicker}
        >
            <input
                ref={inputRef}
                type="file"
                accept={acceptValue}
                multiple={multiple}
                onChange={handleChange}
                className="hidden"
                disabled={disabled}
            />
            {isRenderPropChildren(children) ? children(renderProps) : children}
        </div>
    );
}

export const DropZone = memo(DropZoneComponent);
