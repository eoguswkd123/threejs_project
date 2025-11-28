/**
 * CAD 상태 관리 Store (Zustand)
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type * as THREE from 'three';
import type {
    CADFile,
    CADData,
    ComplexityScore,
    ConversionResult,
    ParseResult,
} from '@types/cad';

// ===== 상태 타입 =====
export type ConversionStatus =
    | 'idle'
    | 'analyzing'
    | 'parsing'
    | 'converting'
    | 'success'
    | 'error';

export interface CADState {
    // 파일 상태
    currentFile: CADFile | null;
    recentFiles: CADFile[];

    // 파싱/변환 상태
    conversionStatus: ConversionStatus;
    conversionProgress: number;
    conversionError: string | null;

    // 복잡도 분석
    complexity: ComplexityScore | null;

    // 결과 데이터
    parseResult: ParseResult | null;
    cadData: CADData | null;
    threeGroup: THREE.Group | null;

    // 변환 소스
    conversionSource: 'frontend' | 'backend' | null;
    conversionTime: number | null;
}

export interface CADActions {
    // 파일 관리
    setCurrentFile: (file: CADFile | null) => void;
    addRecentFile: (file: CADFile) => void;
    clearRecentFiles: () => void;

    // 상태 업데이트
    setConversionStatus: (status: ConversionStatus) => void;
    setConversionProgress: (progress: number) => void;
    setConversionError: (error: string | null) => void;

    // 복잡도
    setComplexity: (complexity: ComplexityScore | null) => void;

    // 결과 설정
    setParseResult: (result: ParseResult | null) => void;
    setCADData: (data: CADData | null) => void;
    setThreeGroup: (group: THREE.Group | null) => void;
    setConversionResult: (result: ConversionResult & { _threeGroup?: THREE.Group; _cadData?: CADData }) => void;

    // 리셋
    reset: () => void;
    clearResults: () => void;
}

// 초기 상태
const initialState: CADState = {
    currentFile: null,
    recentFiles: [],
    conversionStatus: 'idle',
    conversionProgress: 0,
    conversionError: null,
    complexity: null,
    parseResult: null,
    cadData: null,
    threeGroup: null,
    conversionSource: null,
    conversionTime: null,
};

// Store 생성
export const useCADStore = create<CADState & CADActions>()(
    devtools(
        persist(
            (set, get) => ({
                // 초기 상태
                ...initialState,

                // ===== 파일 관리 =====
                setCurrentFile: (file) => {
                    set({ currentFile: file });
                    if (file) {
                        get().addRecentFile(file);
                    }
                },

                addRecentFile: (file) => {
                    set((state) => {
                        // 중복 제거 및 최근 10개만 유지
                        const filtered = state.recentFiles.filter(
                            (f) => f.name !== file.name || f.lastModified !== file.lastModified
                        );
                        return {
                            recentFiles: [file, ...filtered].slice(0, 10),
                        };
                    });
                },

                clearRecentFiles: () => {
                    set({ recentFiles: [] });
                },

                // ===== 상태 업데이트 =====
                setConversionStatus: (status) => {
                    set({ conversionStatus: status });
                },

                setConversionProgress: (progress) => {
                    set({ conversionProgress: Math.min(100, Math.max(0, progress)) });
                },

                setConversionError: (error) => {
                    set({
                        conversionError: error,
                        conversionStatus: error ? 'error' : get().conversionStatus,
                    });
                },

                // ===== 복잡도 =====
                setComplexity: (complexity) => {
                    set({ complexity });
                },

                // ===== 결과 설정 =====
                setParseResult: (result) => {
                    set({ parseResult: result });
                },

                setCADData: (data) => {
                    set({ cadData: data });
                },

                setThreeGroup: (group) => {
                    set({ threeGroup: group });
                },

                setConversionResult: (result) => {
                    set({
                        conversionStatus: result.success ? 'success' : 'error',
                        conversionProgress: 100,
                        conversionSource: result.source,
                        conversionTime: result.conversionTime,
                        threeGroup: result._threeGroup ?? null,
                        cadData: result._cadData ?? null,
                    });
                },

                // ===== 리셋 =====
                reset: () => {
                    // Three.js 리소스 정리
                    const currentGroup = get().threeGroup;
                    if (currentGroup) {
                        disposeThreeGroup(currentGroup);
                    }

                    set({
                        ...initialState,
                        recentFiles: get().recentFiles, // 최근 파일 유지
                    });
                },

                clearResults: () => {
                    // Three.js 리소스 정리
                    const currentGroup = get().threeGroup;
                    if (currentGroup) {
                        disposeThreeGroup(currentGroup);
                    }

                    set({
                        conversionStatus: 'idle',
                        conversionProgress: 0,
                        conversionError: null,
                        complexity: null,
                        parseResult: null,
                        cadData: null,
                        threeGroup: null,
                        conversionSource: null,
                        conversionTime: null,
                    });
                },
            }),
            {
                name: 'cad-storage',
                // Three.js 객체는 직렬화할 수 없으므로 제외
                partialize: (state) => ({
                    recentFiles: state.recentFiles.map((f) => ({
                        name: f.name,
                        size: f.size,
                        type: f.type,
                        lastModified: f.lastModified,
                    })),
                }),
            }
        ),
        { name: 'CADStore' }
    )
);

// Three.js 리소스 정리 헬퍼
function disposeThreeGroup(group: THREE.Group): void {
    group.traverse((object) => {
        if ('geometry' in object && object.geometry) {
            (object.geometry as THREE.BufferGeometry).dispose();
        }
        if ('material' in object && object.material) {
            const material = object.material;
            if (Array.isArray(material)) {
                material.forEach((m) => m.dispose());
            } else {
                (material as THREE.Material).dispose();
            }
        }
    });
}

// 선택자
export const selectIsLoading = (state: CADState) =>
    state.conversionStatus === 'analyzing' ||
    state.conversionStatus === 'parsing' ||
    state.conversionStatus === 'converting';

export const selectHasData = (state: CADState) =>
    state.cadData !== null && state.threeGroup !== null;

export const selectCanConvert = (state: CADState) =>
    state.currentFile !== null && state.conversionStatus !== 'converting';
