/**
 * CAD Viewer - File Upload Component
 * 드래그 앤 드롭 및 파일 선택 UI
 */

import { useCallback, useRef, useState, useEffect } from 'react';

import { Upload, FileText, AlertCircle, Loader2 } from 'lucide-react';

import { FILE_LIMITS } from '../constants';
import {
    validateFile,
    shouldShowSizeWarning,
    formatFileSize,
} from '../utils/validators';

import type { UploadError } from '../types';

interface FileUploadProps {
    /** 파일 선택 콜백 */
    onFileSelect: (file: File) => void;
    /** 샘플 불러오기 콜백 */
    onLoadSample?: () => void;
    /** 로딩 상태 */
    isLoading?: boolean;
    /** 진행률 (0-100) */
    progress?: number;
    /** 진행 단계 메시지 */
    progressStage?: string;
    /** 외부 에러 */
    error?: UploadError | null;
    /** 비활성화 */
    disabled?: boolean;
    /** 데이터 로드 상태 (false면 내부 상태 초기화) */
    hasData?: boolean;
}

export function FileUpload({
    onFileSelect,
    onLoadSample,
    isLoading = false,
    progress = 0,
    progressStage = '',
    error,
    disabled = false,
    hasData = false,
}: FileUploadProps) {
    const [isDragOver, setIsDragOver] = useState(false);
    const [localError, setLocalError] = useState<string | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // 외부에서 데이터가 초기화되면 내부 상태도 초기화
    useEffect(() => {
        if (!hasData) {
            setSelectedFile(null);
            setLocalError(null);
        }
    }, [hasData]);

    const displayError = error?.message || localError;

    const handleFile = useCallback(
        (file: File) => {
            setLocalError(null);

            // 유효성 검사
            const validation = validateFile(file);
            if (!validation.valid && validation.error) {
                setLocalError(validation.error.message);
                return;
            }

            // 크기 경고 (로그만)
            if (shouldShowSizeWarning(file)) {
                console.warn(
                    `Large file detected: ${formatFileSize(file.size)}`
                );
            }

            setSelectedFile(file);
            onFileSelect(file);
        },
        [onFileSelect]
    );

    const handleDragOver = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault();
            e.stopPropagation();
            if (!disabled && !isLoading) {
                setIsDragOver(true);
            }
        },
        [disabled, isLoading]
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

            if (disabled || isLoading) return;

            const files = e.dataTransfer.files;
            const file = files[0];
            if (file) {
                handleFile(file);
            }
        },
        [disabled, isLoading, handleFile]
    );

    const handleInputChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const files = e.target.files;
            const file = files?.[0];
            if (file) {
                handleFile(file);
            }
            // input 초기화 (같은 파일 재선택 가능)
            if (inputRef.current) {
                inputRef.current.value = '';
            }
        },
        [handleFile]
    );

    const handleClick = useCallback(() => {
        if (!disabled && !isLoading && inputRef.current) {
            inputRef.current.click();
        }
    }, [disabled, isLoading]);

    return (
        <div className="absolute top-4 left-4 z-10">
            <div className="flex gap-2">
                {/* 파일 업로드 박스 */}
                <div
                    className={`relative cursor-pointer overflow-hidden rounded-lg border-2 border-dashed bg-gray-900/90 backdrop-blur-sm transition-all duration-200 ${isDragOver ? 'border-green-400 bg-green-900/20' : 'border-gray-600 hover:border-gray-500'} ${disabled || isLoading ? 'cursor-not-allowed opacity-50' : ''} ${displayError ? 'border-red-500' : ''} `}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={handleClick}
                >
                    <input
                        ref={inputRef}
                        type="file"
                        accept={FILE_LIMITS.ACCEPTED_EXTENSIONS.join(',')}
                        onChange={handleInputChange}
                        className="hidden"
                        disabled={disabled || isLoading}
                    />

                    <div className="flex min-w-[200px] flex-col items-center gap-2 p-4">
                        {isLoading ? (
                            <>
                                <Loader2 className="h-8 w-8 animate-spin text-green-400" />
                                <span className="text-sm text-gray-300">
                                    {progressStage || '파싱 중...'}
                                </span>
                                {/* 진행률 바 */}
                                <div className="mt-1 h-1.5 w-full rounded-full bg-gray-700">
                                    <div
                                        className="h-1.5 rounded-full bg-green-500 transition-all duration-300"
                                        style={{ width: `${progress}%` }}
                                    />
                                </div>
                                <span className="text-xs text-gray-500">
                                    {progress}%
                                </span>
                            </>
                        ) : selectedFile && !displayError ? (
                            <>
                                <FileText className="h-8 w-8 text-green-400" />
                                <span className="max-w-[180px] truncate text-sm text-gray-300">
                                    {selectedFile.name}
                                </span>
                                <span className="text-xs text-gray-500">
                                    {formatFileSize(selectedFile.size)}
                                </span>
                            </>
                        ) : (
                            <>
                                <Upload
                                    className={`h-8 w-8 ${isDragOver ? 'text-green-400' : 'text-gray-400'}`}
                                />
                                <span className="text-sm text-gray-300">
                                    DXF 파일을 드래그하거나 클릭
                                </span>
                                <span className="text-xs text-gray-500">
                                    최대{' '}
                                    {FILE_LIMITS.MAX_SIZE_BYTES / 1024 / 1024}MB
                                </span>
                            </>
                        )}
                    </div>
                </div>

                {/* 샘플 불러오기 버튼 */}
                {onLoadSample && (
                    <button
                        onClick={onLoadSample}
                        disabled={disabled || isLoading}
                        className={`flex min-w-[120px] cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed bg-gray-900/90 p-4 backdrop-blur-sm transition-all duration-200 ${disabled || isLoading ? 'cursor-not-allowed border-gray-600 opacity-50' : 'border-gray-600 hover:border-blue-400'} `}
                    >
                        <FileText className="h-8 w-8 text-blue-400" />
                        <span className="text-sm whitespace-nowrap text-gray-300">
                            샘플 불러오기
                        </span>
                    </button>
                )}
            </div>

            {/* 에러 메시지 */}
            {displayError && (
                <div className="mt-2 flex items-center gap-2 rounded border border-red-500 bg-red-900/80 p-2">
                    <AlertCircle className="h-4 w-4 flex-shrink-0 text-red-400" />
                    <span className="text-xs text-red-300">{displayError}</span>
                </div>
            )}
        </div>
    );
}
