/**
 * useDxfLoader Hook Tests
 * DXF 파일 로딩, 레이어 관리, 카메라 제어 훅 테스트
 */

import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { CAMERA_CONFIG } from '../../constants';
import { useDxfLoader } from '../useDxfLoader';

import type { ParsedCADData } from '../../types';

// Mock useDxfWorker
const mockParse = vi.fn();
const mockClearError = vi.fn();
const mockCancel = vi.fn();

vi.mock('../useDxfWorker', () => ({
    useDxfWorker: () => ({
        parse: mockParse,
        isLoading: false,
        progress: 0,
        progressStage: '',
        error: null,
        clearError: mockClearError,
        cancel: mockCancel,
        retryState: {
            attempt: 0,
            maxAttempts: 4,
            isRetrying: false,
            lastErrorCode: null,
        },
    }),
}));

// Mock @/utils (validateSecureUrl, validateExtension)
const mockValidateSecureUrl = vi.fn();
const mockValidateExtension = vi.fn();
vi.mock('@/utils', () => ({
    validateSecureUrl: (url: string, options: unknown) =>
        mockValidateSecureUrl(url, options),
    validateExtension: (filename: string, extensions: readonly string[]) =>
        mockValidateExtension(filename, extensions),
}));

// Mock calculateCameraDistance
vi.mock('@/utils/cad', () => ({
    calculateCameraDistance: vi.fn(() => 500),
}));

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

// 테스트용 ParsedCADData
const createMockCadData = (
    overrides: Partial<ParsedCADData> = {}
): ParsedCADData => ({
    lines: [
        {
            start: { x: 0, y: 0, z: 0 },
            end: { x: 100, y: 100, z: 0 },
            layer: 'Layer1',
        },
    ],
    circles: [],
    arcs: [],
    polylines: [],
    hatches: [],
    texts: [],
    mtexts: [],
    ellipses: [],
    splines: [],
    dimensions: [],
    bounds: {
        min: { x: 0, y: 0, z: 0 },
        max: { x: 100, y: 100, z: 0 },
    },
    layers: {
        Layer1: {
            name: 'Layer1',
            color: '#ff0000',
            visible: true,
            entityCount: 1,
        },
        Layer2: {
            name: 'Layer2',
            color: '#00ff00',
            visible: true,
            entityCount: 0,
        },
    },
    metadata: {
        fileName: 'test.dxf',
        fileSize: 1024,
        entityCount: 1,
        parseTime: 50,
    },
    ...overrides,
});

describe('useDxfLoader', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockValidateSecureUrl.mockReturnValue({ valid: true });
        mockValidateExtension.mockReturnValue({ valid: true });
        mockFetch.mockResolvedValue({
            ok: true,
            text: () => Promise.resolve('DXF content'),
            headers: new Headers({ 'content-length': '100' }),
        });
    });

    describe('Initial State', () => {
        it('should initialize with null cadData', () => {
            const { result } = renderHook(() => useDxfLoader());
            expect(result.current.cadData).toBeNull();
        });

        it('should initialize with empty layers Map', () => {
            const { result } = renderHook(() => useDxfLoader());
            expect(result.current.layers.size).toBe(0);
        });

        it('should initialize with default camera position', () => {
            const { result } = renderHook(() => useDxfLoader());
            expect(result.current.cameraPosition).toEqual(
                CAMERA_CONFIG.defaultPosition
            );
        });

        it('should initialize with isLoading false', () => {
            const { result } = renderHook(() => useDxfLoader());
            expect(result.current.isLoading).toBe(false);
        });

        it('should initialize with null error', () => {
            const { result } = renderHook(() => useDxfLoader());
            expect(result.current.error).toBeNull();
        });

        it('should initialize with progress 0', () => {
            const { result } = renderHook(() => useDxfLoader());
            expect(result.current.progress).toBe(0);
        });

        it('should initialize with empty progressStage', () => {
            const { result } = renderHook(() => useDxfLoader());
            expect(result.current.progressStage).toBe('');
        });
    });

    describe('handleFileSelect', () => {
        it('should call parse with file', async () => {
            const mockData = createMockCadData();
            mockParse.mockResolvedValueOnce(mockData);

            const { result } = renderHook(() => useDxfLoader());
            const file = new File(['test'], 'test.dxf', {
                type: 'application/dxf',
            });

            await act(async () => {
                await result.current.handleFileSelect(file);
            });

            expect(mockParse).toHaveBeenCalledWith(file);
        });

        it('should update cadData on success', async () => {
            const mockData = createMockCadData();
            mockParse.mockResolvedValueOnce(mockData);

            const { result } = renderHook(() => useDxfLoader());
            const file = new File(['test'], 'test.dxf', {
                type: 'application/dxf',
            });

            await act(async () => {
                await result.current.handleFileSelect(file);
            });

            expect(result.current.cadData).toEqual(mockData);
        });

        it('should update layers from parsed data', async () => {
            const mockData = createMockCadData();
            mockParse.mockResolvedValueOnce(mockData);

            const { result } = renderHook(() => useDxfLoader());
            const file = new File(['test'], 'test.dxf', {
                type: 'application/dxf',
            });

            await act(async () => {
                await result.current.handleFileSelect(file);
            });

            expect(result.current.layers.size).toBe(2);
            expect(result.current.layers.get('Layer1')).toBeDefined();
            expect(result.current.layers.get('Layer2')).toBeDefined();
        });

        it('should adjust camera position when autoFitCamera is true', async () => {
            const mockData = createMockCadData();
            mockParse.mockResolvedValueOnce(mockData);

            const { result } = renderHook(() =>
                useDxfLoader({ autoFitCamera: true })
            );
            const file = new File(['test'], 'test.dxf', {
                type: 'application/dxf',
            });

            await act(async () => {
                await result.current.handleFileSelect(file);
            });

            // calculateCameraDistance returns 500
            expect(result.current.cameraPosition).toEqual([0, 0, 500]);
        });

        it('should call clearError before parsing', async () => {
            mockParse.mockResolvedValueOnce(createMockCadData());

            const { result } = renderHook(() => useDxfLoader());
            const file = new File(['test'], 'test.dxf', {
                type: 'application/dxf',
            });

            await act(async () => {
                await result.current.handleFileSelect(file);
            });

            expect(mockClearError).toHaveBeenCalled();
        });

        it('should log error when parse fails', async () => {
            const consoleSpy = vi
                .spyOn(console, 'error')
                .mockImplementation(() => {});
            mockParse.mockRejectedValueOnce(new Error('Parse failed'));

            const { result } = renderHook(() => useDxfLoader());
            const file = new File(['test'], 'test.dxf', {
                type: 'application/dxf',
            });

            await act(async () => {
                await result.current.handleFileSelect(file);
            });

            expect(consoleSpy).toHaveBeenCalledWith(
                'Failed to parse DXF:',
                expect.any(Error)
            );
            consoleSpy.mockRestore();
        });
    });

    describe('handleSelectSample', () => {
        it('should fetch sample file and call handleFileSelect', async () => {
            const mockData = createMockCadData();
            mockParse.mockResolvedValueOnce(mockData);

            const { result } = renderHook(() => useDxfLoader());

            await act(async () => {
                await result.current.handleSelectSample({
                    id: 'sample-1',
                    name: 'Sample',
                    path: '/samples/sample.dxf',
                });
            });

            expect(mockFetch).toHaveBeenCalledWith('/samples/sample.dxf');
            expect(mockParse).toHaveBeenCalled();
        });

        it('should handle fetch error', async () => {
            const consoleSpy = vi
                .spyOn(console, 'error')
                .mockImplementation(() => {});
            mockFetch.mockResolvedValueOnce({ ok: false });

            const { result } = renderHook(() => useDxfLoader());

            await act(async () => {
                await result.current.handleSelectSample({
                    id: 'sample-1',
                    name: 'Sample',
                    path: '/samples/sample.dxf',
                });
            });

            expect(consoleSpy).toHaveBeenCalledWith(
                'Failed to load sample:',
                expect.any(Error)
            );
            consoleSpy.mockRestore();
        });
    });

    describe('handleUrlSubmit', () => {
        it('should validate URL and extension before fetching', async () => {
            mockParse.mockResolvedValueOnce(createMockCadData());

            const { result } = renderHook(() => useDxfLoader());

            await act(async () => {
                await result.current.handleUrlSubmit(
                    'https://example.com/test.dxf'
                );
            });

            // URL 보안 검증 (프로토콜, 호스트만)
            expect(mockValidateSecureUrl).toHaveBeenCalledWith(
                'https://example.com/test.dxf',
                expect.objectContaining({
                    allowedProtocols: expect.any(Array),
                    allowedHosts: expect.any(Array),
                })
            );

            // 확장자 검증 (별도 호출)
            expect(mockValidateExtension).toHaveBeenCalledWith('/test.dxf', [
                '.dxf',
            ]);
        });

        it('should reject invalid URL', async () => {
            mockValidateSecureUrl.mockReturnValueOnce({
                valid: false,
                error: { message: 'Invalid URL' },
            });
            const consoleSpy = vi
                .spyOn(console, 'error')
                .mockImplementation(() => {});

            const { result } = renderHook(() => useDxfLoader());

            await act(async () => {
                await result.current.handleUrlSubmit('invalid-url');
            });

            expect(mockFetch).not.toHaveBeenCalled();
            expect(consoleSpy).toHaveBeenCalledWith(
                'URL validation failed:',
                'Invalid URL'
            );
            consoleSpy.mockRestore();
        });

        it('should reject invalid extension', async () => {
            mockValidateExtension.mockReturnValueOnce({
                valid: false,
                error: { message: 'Invalid extension' },
            });
            const consoleSpy = vi
                .spyOn(console, 'error')
                .mockImplementation(() => {});

            const { result } = renderHook(() => useDxfLoader());

            await act(async () => {
                await result.current.handleUrlSubmit(
                    'https://example.com/test.txt'
                );
            });

            expect(mockFetch).not.toHaveBeenCalled();
            expect(consoleSpy).toHaveBeenCalledWith(
                'Extension validation failed:',
                'Invalid extension'
            );
            consoleSpy.mockRestore();
        });

        it('should handle fetch timeout', async () => {
            const consoleSpy = vi
                .spyOn(console, 'error')
                .mockImplementation(() => {});

            // Simulate abort
            const abortError = new Error('Aborted');
            abortError.name = 'AbortError';
            mockFetch.mockRejectedValueOnce(abortError);

            const { result } = renderHook(() => useDxfLoader());

            await act(async () => {
                await result.current.handleUrlSubmit(
                    'https://example.com/test.dxf'
                );
            });

            expect(consoleSpy).toHaveBeenCalledWith('URL fetch timeout');
            consoleSpy.mockRestore();
        });

        it('should handle large response size', async () => {
            const consoleSpy = vi
                .spyOn(console, 'error')
                .mockImplementation(() => {});
            mockFetch.mockResolvedValueOnce({
                ok: true,
                headers: new Headers({
                    'content-length': '100000000', // 100MB
                }),
                text: () => Promise.resolve(''),
            });

            const { result } = renderHook(() => useDxfLoader());

            await act(async () => {
                await result.current.handleUrlSubmit(
                    'https://example.com/test.dxf'
                );
            });

            expect(consoleSpy).toHaveBeenCalled();
            consoleSpy.mockRestore();
        });

        it('should extract and sanitize filename from URL', async () => {
            mockParse.mockResolvedValueOnce(createMockCadData());

            const { result } = renderHook(() => useDxfLoader());

            await act(async () => {
                await result.current.handleUrlSubmit(
                    'https://example.com/path/to/file.dxf'
                );
            });

            // File should be created with sanitized name
            expect(mockParse).toHaveBeenCalled();
        });
    });

    describe('handleResetFile', () => {
        it('should reset cadData to null', async () => {
            mockParse.mockResolvedValueOnce(createMockCadData());
            const { result } = renderHook(() => useDxfLoader());

            // First load a file
            await act(async () => {
                await result.current.handleFileSelect(
                    new File(['test'], 'test.dxf')
                );
            });
            expect(result.current.cadData).not.toBeNull();

            // Then reset
            act(() => {
                result.current.handleResetFile();
            });

            expect(result.current.cadData).toBeNull();
        });

        it('should reset layers to empty Map', async () => {
            mockParse.mockResolvedValueOnce(createMockCadData());
            const { result } = renderHook(() => useDxfLoader());

            await act(async () => {
                await result.current.handleFileSelect(
                    new File(['test'], 'test.dxf')
                );
            });
            expect(result.current.layers.size).toBeGreaterThan(0);

            act(() => {
                result.current.handleResetFile();
            });

            expect(result.current.layers.size).toBe(0);
        });

        it('should reset camera position to default', async () => {
            mockParse.mockResolvedValueOnce(createMockCadData());
            const { result } = renderHook(() => useDxfLoader());

            await act(async () => {
                await result.current.handleFileSelect(
                    new File(['test'], 'test.dxf')
                );
            });

            act(() => {
                result.current.handleResetFile();
            });

            expect(result.current.cameraPosition).toEqual(
                CAMERA_CONFIG.defaultPosition
            );
        });

        it('should call clearError', () => {
            const { result } = renderHook(() => useDxfLoader());

            act(() => {
                result.current.handleResetFile();
            });

            expect(mockClearError).toHaveBeenCalled();
        });
    });

    describe('Layer Management', () => {
        it('handleToggleLayer should toggle individual layer visibility', async () => {
            mockParse.mockResolvedValueOnce(createMockCadData());
            const { result } = renderHook(() => useDxfLoader());

            await act(async () => {
                await result.current.handleFileSelect(
                    new File(['test'], 'test.dxf')
                );
            });

            const initialVisibility =
                result.current.layers.get('Layer1')?.visible;

            act(() => {
                result.current.handleToggleLayer('Layer1');
            });

            expect(result.current.layers.get('Layer1')?.visible).toBe(
                !initialVisibility
            );
        });

        it('handleToggleAllLayers(true) should show all layers', async () => {
            const mockData = createMockCadData({
                layers: {
                    Layer1: {
                        name: 'Layer1',
                        color: '#ff0000',
                        visible: false,
                        entityCount: 1,
                    },
                    Layer2: {
                        name: 'Layer2',
                        color: '#00ff00',
                        visible: false,
                        entityCount: 0,
                    },
                },
            });
            mockParse.mockResolvedValueOnce(mockData);
            const { result } = renderHook(() => useDxfLoader());

            await act(async () => {
                await result.current.handleFileSelect(
                    new File(['test'], 'test.dxf')
                );
            });

            act(() => {
                result.current.handleToggleAllLayers(true);
            });

            for (const layer of result.current.layers.values()) {
                expect(layer.visible).toBe(true);
            }
        });

        it('handleToggleAllLayers(false) should hide all layers', async () => {
            mockParse.mockResolvedValueOnce(createMockCadData());
            const { result } = renderHook(() => useDxfLoader());

            await act(async () => {
                await result.current.handleFileSelect(
                    new File(['test'], 'test.dxf')
                );
            });

            act(() => {
                result.current.handleToggleAllLayers(false);
            });

            for (const layer of result.current.layers.values()) {
                expect(layer.visible).toBe(false);
            }
        });

        it('handleToggleLayer should not affect non-existent layer', async () => {
            mockParse.mockResolvedValueOnce(createMockCadData());
            const { result } = renderHook(() => useDxfLoader());

            await act(async () => {
                await result.current.handleFileSelect(
                    new File(['test'], 'test.dxf')
                );
            });

            const layer1Before = result.current.layers.get('Layer1');

            act(() => {
                result.current.handleToggleLayer('NonExistentLayer');
            });

            // Layers should remain unchanged
            expect(result.current.layers.get('Layer1')?.visible).toBe(
                layer1Before?.visible
            );
        });
    });

    describe('resetCameraPosition', () => {
        it('should reset to default position when no cadData', () => {
            const { result } = renderHook(() => useDxfLoader());

            act(() => {
                result.current.resetCameraPosition();
            });

            expect(result.current.cameraPosition).toEqual(
                CAMERA_CONFIG.defaultPosition
            );
        });

        it('should calculate position when cadData exists and autoFit is true', async () => {
            mockParse.mockResolvedValueOnce(createMockCadData());
            const { result } = renderHook(() =>
                useDxfLoader({ autoFitCamera: true })
            );

            await act(async () => {
                await result.current.handleFileSelect(
                    new File(['test'], 'test.dxf')
                );
            });

            // Manually change position
            act(() => {
                result.current.handleResetFile();
            });

            // Reload
            mockParse.mockResolvedValueOnce(createMockCadData());
            await act(async () => {
                await result.current.handleFileSelect(
                    new File(['test'], 'test.dxf')
                );
            });

            act(() => {
                result.current.resetCameraPosition(true);
            });

            expect(result.current.cameraPosition).toEqual([0, 0, 500]);
        });

        it('should use autoFit parameter override', async () => {
            mockParse.mockResolvedValueOnce(createMockCadData());
            const { result } = renderHook(() =>
                useDxfLoader({ autoFitCamera: false })
            );

            await act(async () => {
                await result.current.handleFileSelect(
                    new File(['test'], 'test.dxf')
                );
            });

            act(() => {
                result.current.resetCameraPosition(true);
            });

            // Should calculate since autoFit parameter is true
            expect(result.current.cameraPosition).toEqual([0, 0, 500]);
        });
    });

    describe('Options', () => {
        it('should respect autoFitCamera option', async () => {
            mockParse.mockResolvedValueOnce(createMockCadData());
            const { result } = renderHook(() =>
                useDxfLoader({ autoFitCamera: false })
            );

            await act(async () => {
                await result.current.handleFileSelect(
                    new File(['test'], 'test.dxf')
                );
            });

            // Camera should stay at default position
            expect(result.current.cameraPosition).toEqual(
                CAMERA_CONFIG.defaultPosition
            );
        });

        it('should default autoFitCamera to true', async () => {
            mockParse.mockResolvedValueOnce(createMockCadData());
            const { result } = renderHook(() => useDxfLoader());

            await act(async () => {
                await result.current.handleFileSelect(
                    new File(['test'], 'test.dxf')
                );
            });

            // Camera should be adjusted
            expect(result.current.cameraPosition).toEqual([0, 0, 500]);
        });
    });

    describe('Return Value', () => {
        it('should return all expected properties', () => {
            const { result } = renderHook(() => useDxfLoader());

            expect(result.current).toHaveProperty('cadData');
            expect(result.current).toHaveProperty('layers');
            expect(result.current).toHaveProperty('cameraPosition');
            expect(result.current).toHaveProperty('isLoading');
            expect(result.current).toHaveProperty('progress');
            expect(result.current).toHaveProperty('progressStage');
            expect(result.current).toHaveProperty('error');
            expect(result.current).toHaveProperty('handleFileSelect');
            expect(result.current).toHaveProperty('handleSelectSample');
            expect(result.current).toHaveProperty('handleUrlSubmit');
            expect(result.current).toHaveProperty('handleResetFile');
            expect(result.current).toHaveProperty('handleToggleLayer');
            expect(result.current).toHaveProperty('handleToggleAllLayers');
            expect(result.current).toHaveProperty('resetCameraPosition');
            expect(result.current).toHaveProperty('clearError');
        });

        it('should have stable function references', () => {
            const { result, rerender } = renderHook(() => useDxfLoader());

            const firstHandleFileSelect = result.current.handleFileSelect;
            const firstHandleResetFile = result.current.handleResetFile;

            rerender();

            expect(result.current.handleFileSelect).toBe(firstHandleFileSelect);
            expect(result.current.handleResetFile).toBe(firstHandleResetFile);
        });
    });
});
