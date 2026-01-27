/**
 * FilePanelViewer - 통합 파일 패널 컴포넌트
 *
 * 파일 업로드(드래그앤드롭) + 서버 샘플 목록을 통합
 * CadViewer, WorkerViewer 등에서 공통으로 사용
 *
 * @example
 * <FilePanelViewer
 *   uploadConfig={DXF_UPLOAD_CONFIG}
 *   uploadMessages={DXF_UPLOAD_MESSAGES}
 *   onFileSelect={handleFileSelect}
 *   samples={dxfSamples}
 *   onSelectSample={handleSelectSample}
 *   hasData={!!cadData}
 *   accentColor="green"
 * />
 */

import { memo } from 'react';

import {
    FileUploadBox,
    SampleList,
    UrlInput,
    type FileUploadConfig,
    type FileUploadMessages,
    type UploadError,
    type SampleInfo,
} from '@/components/FilePanel';

// ============================================================
// Styles
// ============================================================

const styles = {
    container: 'absolute top-4 left-4 z-10 flex flex-col gap-3',
};

// ============================================================
// Types
// ============================================================

/** FilePanelViewer Props */
interface FilePanelViewerProps {
    /** 업로드 설정 */
    uploadConfig: FileUploadConfig;
    /** 업로드 메시지 */
    uploadMessages: FileUploadMessages;
    /** 파일 선택 콜백 */
    onFileSelect: (file: File) => void;
    /** 샘플 파일 목록 */
    samples: SampleInfo[];
    /** 샘플 로딩 상태 */
    samplesLoading?: boolean;
    /** 샘플 선택 콜백 */
    onSelectSample: (sample: SampleInfo) => void;
    /** 파일 파싱 로딩 상태 */
    isLoading?: boolean;
    /** 파싱 진행률 (0-100) */
    progress?: number;
    /** 진행 단계 텍스트 */
    progressStage?: string;
    /** 에러 정보 */
    error?: UploadError | null;
    /** 데이터 로드 여부 (true면 패널 숨김) */
    hasData?: boolean;
    /** 테마 색상 */
    accentColor?: 'green' | 'blue';
    /** URL 제출 콜백 (optional - 있을 때만 UrlInput 표시) */
    onUrlSubmit?: (url: string) => void;
    /** URL 입력 placeholder */
    urlPlaceholder?: string;
}

// ============================================================
// Component
// ============================================================

function FilePanelViewerComponent({
    uploadConfig,
    uploadMessages,
    onFileSelect,
    samples,
    samplesLoading = false,
    onSelectSample,
    isLoading = false,
    progress = 0,
    progressStage,
    error,
    hasData = false,
    accentColor = 'green',
    onUrlSubmit,
    urlPlaceholder,
}: FilePanelViewerProps) {
    // 데이터가 로드되면 전체 패널 숨김
    if (hasData) {
        return null;
    }

    return (
        <div className={styles.container}>
            {/* 드래그앤드롭 업로드 영역 */}
            <FileUploadBox
                config={uploadConfig}
                messages={uploadMessages}
                onFileSelect={onFileSelect}
                isLoading={isLoading}
                progress={progress}
                {...(progressStage && { progressStage })}
                error={error ?? null}
                accentColor={accentColor}
            />

            {/* 서버 샘플 목록 */}
            <SampleList
                samples={samples}
                isLoading={samplesLoading}
                onSelectSample={onSelectSample}
                accentColor={accentColor}
            />

            {/* URL 입력 (onUrlSubmit이 있을 때만 표시) */}
            {onUrlSubmit && (
                <UrlInput
                    onUrlSubmit={onUrlSubmit}
                    isLoading={isLoading}
                    {...(urlPlaceholder && { placeholder: urlPlaceholder })}
                    accentColor={accentColor}
                />
            )}
        </div>
    );
}

export const FilePanelViewer = memo(FilePanelViewerComponent);
