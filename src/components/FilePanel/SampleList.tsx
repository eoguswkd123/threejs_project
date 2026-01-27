/**
 * SampleList - 서버 샘플 파일 목록 컴포넌트
 *
 * Available Samples 영역에 샘플 파일 목록을 표시
 * 파일 클릭 시 onSelectSample 콜백 호출
 */

import { memo } from 'react';

import { FileText, FolderOpen, Loader2 } from 'lucide-react';

import { ACCENT_CLASSES } from '@/components/Common/constants';

import type { SampleListProps } from './types';

// ============================================================
// Styles
// ============================================================

const styles = {
    container: 'rounded-lg bg-gray-900/90 p-3 backdrop-blur-sm',
    header: 'mb-2 flex items-center gap-2',
    headerIcon: 'h-4 w-4',
    headerText: 'text-xs text-gray-400',
    list: 'max-h-[200px] space-y-1 overflow-y-auto',
    item: 'flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm text-gray-200 transition-colors hover:bg-gray-700 disabled:opacity-50',
    itemIcon: 'h-4 w-4',
    itemName: 'flex-1 truncate',
    itemFormat: 'text-xs text-gray-500',
    loading: 'flex items-center justify-center py-4',
    loadingIcon: 'h-5 w-5 animate-spin',
};

function SampleListComponent({
    samples,
    isLoading = false,
    onSelectSample,
    accentColor = 'green',
}: SampleListProps) {
    const colors = ACCENT_CLASSES[accentColor];

    // 샘플 없고 로딩도 아니면 숨김
    if (samples.length === 0 && !isLoading) {
        return null;
    }

    return (
        <div className={styles.container}>
            {/* 헤더 */}
            <div className={styles.header}>
                <FolderOpen className={`${styles.headerIcon} ${colors.icon}`} />
                <span className={styles.headerText}>Available Samples</span>
            </div>

            {/* 로딩 상태 */}
            {isLoading ? (
                <div className={styles.loading}>
                    <Loader2
                        className={`${styles.loadingIcon} ${colors.icon}`}
                    />
                </div>
            ) : (
                /* 샘플 목록 */
                <div className={styles.list}>
                    {samples.map((sample) => (
                        <button
                            key={sample.id}
                            onClick={() => onSelectSample(sample)}
                            className={styles.item}
                        >
                            <FileText
                                className={`${styles.itemIcon} ${colors.icon}`}
                            />
                            <span className={styles.itemName}>
                                {sample.name}
                            </span>
                            {sample.format && (
                                <span className={styles.itemFormat}>
                                    .{sample.format}
                                </span>
                            )}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

export const SampleList = memo(SampleListComponent);
