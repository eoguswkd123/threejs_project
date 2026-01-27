/**
 * useDxfFileLoader Hook Tests
 */

import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';

import type { ParsedCADData } from '@/types/cad';

import { useDxfFileLoader } from '../useDxfFileLoader';

// useDxfWorker mock
const mockParse = vi.fn();
const mockClearError = vi.fn();

vi.mock('../useDxfWorker', () => ({
    useDxfWorker: () => ({
        parse: mockParse,
        isLoading: false,
        progress: 0,
        progressStage: '',
        error: null,
        clearError: mockClearError,
    }),
}));

// validateSecureUrl, validateExtension mock
vi.mock('@/utils', () => ({
    validateSecureUrl: vi.fn(() => ({ valid: true })),
    validateExtension: vi.fn(() => ({ valid: true })),
}));

// 테스트용 ParsedCADData 생성
function createTestCadData(): ParsedCADData {
    return {
        lines: [],
        circles: [],
        arcs: [],
        polylines: [],
        hatches: [],
        texts: [],
        mtexts: [],
        ellipses: [],
        splines: [],
        dimensions: [],
        layers: {
            Layer0: {
                name: 'Layer0',
                color: '#FFFFFF',
                visible: true,
                entityCount: 10,
            },
        },
        bounds: {
            min: { x: 0, y: 0, z: 0 },
            max: { x: 100, y: 100, z: 0 },
        },
        metadata: {
            fileName: 'test.dxf',
            fileSize: 1024,
            entityCount: 10,
            parseTime: 50,
        },
    };
}

describe('useDxfFileLoader', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockParse.mockReset();
        mockClearError.mockReset();
        global.fetch = vi.fn();
    });

    describe('Initial State', () => {
        it('초기 상태 확인', () => {
            const { result } = renderHook(() => useDxfFileLoader());

            expect(result.current.cadData).toBeNull();
            expect(result.current.isLoading).toBe(false);
            expect(result.current.progress).toBe(0);
            expect(result.current.progressStage).toBe('');
            expect(result.current.error).toBeNull();
        });
    });

    describe('handleFileSelect', () => {
        it('파일 파싱 성공', async () => {
            const testData = createTestCadData();
            mockParse.mockResolvedValue(testData);

            const { result } = renderHook(() => useDxfFileLoader());
            const file = new File(['DXF content'], 'test.dxf', {
                type: 'application/dxf',
            });

            await act(async () => {
                await result.current.handleFileSelect(file);
            });

            expect(mockClearError).toHaveBeenCalled();
            expect(mockParse).toHaveBeenCalledWith(file);
            expect(result.current.cadData).toEqual(testData);
        });

        it('onDataLoaded 콜백 호출', async () => {
            const testData = createTestCadData();
            mockParse.mockResolvedValue(testData);
            const onDataLoaded = vi.fn();

            const { result } = renderHook(() =>
                useDxfFileLoader({ onDataLoaded })
            );
            const file = new File(['DXF content'], 'test.dxf', {
                type: 'application/dxf',
            });

            await act(async () => {
                await result.current.handleFileSelect(file);
            });

            expect(onDataLoaded).toHaveBeenCalledWith(testData);
        });

        it('파싱 실패 시 에러 처리', async () => {
            mockParse.mockRejectedValue(new Error('Parse error'));

            const { result } = renderHook(() => useDxfFileLoader());
            const file = new File(['Invalid content'], 'invalid.dxf', {
                type: 'application/dxf',
            });

            await act(async () => {
                await result.current.handleFileSelect(file);
            });

            // 에러는 useDxfWorker에서 처리됨
            expect(mockParse).toHaveBeenCalled();
            expect(result.current.cadData).toBeNull();
        });
    });

    describe('handleSelectSample', () => {
        it('샘플 파일 로드 성공', async () => {
            const testData = createTestCadData();
            mockParse.mockResolvedValue(testData);
            (global.fetch as Mock).mockResolvedValue({
                ok: true,
                text: () => Promise.resolve('DXF content'),
            });

            const { result } = renderHook(() => useDxfFileLoader());
            const sample = {
                id: 'sample-1',
                name: 'sample',
                path: '/samples/sample.dxf',
            };

            await act(async () => {
                await result.current.handleSelectSample(sample);
            });

            expect(global.fetch).toHaveBeenCalledWith('/samples/sample.dxf');
            expect(mockParse).toHaveBeenCalled();
            expect(result.current.cadData).toEqual(testData);
        });

        it('샘플 파일 로드 실패', async () => {
            (global.fetch as Mock).mockResolvedValue({
                ok: false,
            });

            const { result } = renderHook(() => useDxfFileLoader());
            const sample = {
                id: 'sample-2',
                name: 'sample',
                path: '/samples/notfound.dxf',
            };

            await act(async () => {
                await result.current.handleSelectSample(sample);
            });

            expect(mockParse).not.toHaveBeenCalled();
            expect(result.current.cadData).toBeNull();
        });
    });

    describe('handleUrlSubmit', () => {
        it('URL 로드 성공', async () => {
            const testData = createTestCadData();
            mockParse.mockResolvedValue(testData);
            (global.fetch as Mock).mockResolvedValue({
                ok: true,
                headers: new Headers({ 'content-length': '1024' }),
                text: () => Promise.resolve('DXF content'),
            });

            // mock validateSecureUrl, validateExtension
            const { validateSecureUrl, validateExtension } =
                await import('@/utils');
            (validateSecureUrl as Mock).mockReturnValue({ valid: true });
            (validateExtension as Mock).mockReturnValue({ valid: true });

            const { result } = renderHook(() => useDxfFileLoader());

            await act(async () => {
                await result.current.handleUrlSubmit(
                    'https://example.com/test.dxf'
                );
            });

            expect(mockClearError).toHaveBeenCalled();
            expect(mockParse).toHaveBeenCalled();
            expect(result.current.cadData).toEqual(testData);
        });

        it('URL 유효성 검증 실패', async () => {
            const { validateSecureUrl } = await import('@/utils');
            (validateSecureUrl as Mock).mockReturnValue({
                valid: false,
                error: { message: 'Invalid URL' },
            });

            const { result } = renderHook(() => useDxfFileLoader());

            await act(async () => {
                await result.current.handleUrlSubmit('http://malicious.com');
            });

            expect(mockParse).not.toHaveBeenCalled();
            expect(result.current.cadData).toBeNull();
        });

        it('확장자 검증 실패', async () => {
            const { validateSecureUrl, validateExtension } =
                await import('@/utils');
            (validateSecureUrl as Mock).mockReturnValue({ valid: true });
            (validateExtension as Mock).mockReturnValue({
                valid: false,
                error: { message: 'Invalid extension' },
            });

            const { result } = renderHook(() => useDxfFileLoader());

            await act(async () => {
                await result.current.handleUrlSubmit(
                    'https://example.com/test.txt'
                );
            });

            expect(mockParse).not.toHaveBeenCalled();
        });

        it('파일 크기 초과 검증', async () => {
            const { validateSecureUrl, validateExtension } =
                await import('@/utils');
            (validateSecureUrl as Mock).mockReturnValue({ valid: true });
            (validateExtension as Mock).mockReturnValue({ valid: true });
            (global.fetch as Mock).mockResolvedValue({
                ok: true,
                headers: new Headers({ 'content-length': '999999999' }),
                text: () => Promise.resolve('Large content'),
            });

            const { result } = renderHook(() => useDxfFileLoader());

            await act(async () => {
                await result.current.handleUrlSubmit(
                    'https://example.com/large.dxf'
                );
            });

            // 파일 크기 초과로 파싱되지 않음
            expect(mockParse).not.toHaveBeenCalled();
        });
    });

    describe('handleResetFile', () => {
        it('파일 데이터 리셋', async () => {
            const testData = createTestCadData();
            mockParse.mockResolvedValue(testData);

            const { result } = renderHook(() => useDxfFileLoader());
            const file = new File(['DXF content'], 'test.dxf', {
                type: 'application/dxf',
            });

            // 먼저 파일 로드
            await act(async () => {
                await result.current.handleFileSelect(file);
            });

            expect(result.current.cadData).not.toBeNull();

            // 리셋
            act(() => {
                result.current.handleResetFile();
            });

            expect(result.current.cadData).toBeNull();
            expect(mockClearError).toHaveBeenCalled();
        });
    });

    describe('clearError', () => {
        it('에러 초기화 호출', () => {
            const { result } = renderHook(() => useDxfFileLoader());

            act(() => {
                result.current.clearError();
            });

            expect(mockClearError).toHaveBeenCalled();
        });
    });

    describe('Stable References', () => {
        it('콜백 없이 함수 참조 안정성', () => {
            const { result, rerender } = renderHook(() => useDxfFileLoader());

            const { handleResetFile: reset1 } = result.current;

            rerender();

            const { handleResetFile: reset2 } = result.current;

            // handleSelectSample, handleUrlSubmit는 handleFileSelect에 의존
            // handleFileSelect는 onDataLoaded에 의존하므로 undefined일 때 안정
            expect(reset1).toBe(reset2);
        });

        it('onDataLoaded 변경 시 handleFileSelect 참조 변경', () => {
            const callback1 = vi.fn();
            const callback2 = vi.fn();

            const { result, rerender } = renderHook(
                ({ cb }) => useDxfFileLoader({ onDataLoaded: cb }),
                { initialProps: { cb: callback1 } }
            );

            const { handleFileSelect: select1 } = result.current;

            rerender({ cb: callback2 });

            const { handleFileSelect: select2 } = result.current;

            // 콜백 변경으로 참조 변경
            expect(select1).not.toBe(select2);
        });
    });
});
