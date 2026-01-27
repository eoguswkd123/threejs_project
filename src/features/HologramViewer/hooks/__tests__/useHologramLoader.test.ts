/**
 * useHologramLoader.test.ts
 * HologramViewer glTF/GLB 모델 로딩 훅 테스트
 *
 * 주요 테스트:
 * - 초기 상태 검증
 * - loadModelFromUrl 성공/실패 테스트
 * - loadModelFromFile 성공/실패 테스트
 * - clearModel 동작 테스트
 * - URL/확장자 검증 테스트
 */

import { renderHook, act } from '@testing-library/react';
import {
    describe,
    it,
    expect,
    vi,
    beforeEach,
    afterEach,
    type Mock,
} from 'vitest';

// @/utils 모킹
vi.mock('@/utils', () => ({
    validateSecureUrl: vi.fn(),
    validateExtension: vi.fn(),
    classifyError: vi.fn(() => ({
        code: 'FETCH_ERROR',
        message: 'Test error',
    })),
    // 새로 추가된 유틸리티 함수들
    isInternalResource: vi.fn(
        (url: string) => url.startsWith('blob:') || url.startsWith('/')
    ),
    extractFileName: vi.fn(
        (url: string, fallback = 'file') => url.split('/').pop() || fallback
    ),
    detectGltfFormat: vi.fn((url: string) =>
        url.toLowerCase().endsWith('.gltf') ? 'gltf' : 'glb'
    ),
    GLTF_ALLOWED_EXTENSIONS: ['.glb', '.gltf'],
}));

// validateSecureUrl, validateExtension 가져오기
import { validateSecureUrl, validateExtension } from '@/utils';

import { useHologramLoader } from '../useHologramLoader';

// jsdom에서 제공하지 않는 URL 메서드들을 전역에 정의
const mockCreateObjectURL = vi.fn(() => 'blob:http://localhost/test-blob');
const mockRevokeObjectURL = vi.fn();

// URL.createObjectURL이 없으면 정의
if (typeof URL.createObjectURL === 'undefined') {
    Object.defineProperty(URL, 'createObjectURL', {
        value: mockCreateObjectURL,
        writable: true,
        configurable: true,
    });
}
if (typeof URL.revokeObjectURL === 'undefined') {
    Object.defineProperty(URL, 'revokeObjectURL', {
        value: mockRevokeObjectURL,
        writable: true,
        configurable: true,
    });
}

describe('useHologramLoader', () => {
    let randomUUIDSpy: Mock;

    beforeEach(() => {
        vi.clearAllMocks();

        // crypto.randomUUID 모킹
        randomUUIDSpy = vi.fn(() => 'test-uuid-1234');
        vi.spyOn(crypto, 'randomUUID').mockImplementation(randomUUIDSpy);

        // URL mock 초기화
        mockCreateObjectURL.mockClear();
        mockCreateObjectURL.mockReturnValue('blob:http://localhost/test-blob');
        mockRevokeObjectURL.mockClear();

        // URL 메서드 재설정 (이미 정의되어 있는 경우)
        if (URL.createObjectURL !== mockCreateObjectURL) {
            vi.spyOn(URL, 'createObjectURL').mockImplementation(
                mockCreateObjectURL
            );
        }
        if (URL.revokeObjectURL !== mockRevokeObjectURL) {
            vi.spyOn(URL, 'revokeObjectURL').mockImplementation(
                mockRevokeObjectURL
            );
        }

        // 기본 성공 응답 설정
        vi.mocked(validateSecureUrl).mockReturnValue({ valid: true });
        vi.mocked(validateExtension).mockReturnValue({ valid: true });
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('초기 상태', () => {
        it('초기 상태는 status=idle, selectedModel=null, error=null', () => {
            const { result } = renderHook(() => useHologramLoader());

            expect(result.current.status).toBe('idle');
            expect(result.current.selectedModel).toBeNull();
            expect(result.current.error).toBeNull();
        });

        it('반환 타입이 UseHologramLoaderReturn 인터페이스를 준수', () => {
            const { result } = renderHook(() => useHologramLoader());

            // 모든 필수 속성 존재 확인
            expect(result.current).toHaveProperty('selectedModel');
            expect(result.current).toHaveProperty('status');
            expect(result.current).toHaveProperty('error');
            expect(typeof result.current.loadModelFromUrl).toBe('function');
            expect(typeof result.current.loadModelFromFile).toBe('function');
            expect(typeof result.current.clearModel).toBe('function');
        });
    });

    describe('loadModelFromUrl', () => {
        it('로컬 경로(/) 로드 시 검증을 스킵하고 성공', async () => {
            const { result } = renderHook(() => useHologramLoader());

            await act(async () => {
                await result.current.loadModelFromUrl('/models/test.glb');
            });

            expect(result.current.status).toBe('success');
            expect(result.current.selectedModel).not.toBeNull();
            expect(result.current.selectedModel?.url).toBe('/models/test.glb');
            expect(result.current.selectedModel?.format).toBe('glb');
            // 로컬 경로는 validateSecureUrl 호출 안함
            expect(validateSecureUrl).not.toHaveBeenCalled();
        });

        it('Blob URL 로드 시 검증을 스킵하고 성공', async () => {
            const { result } = renderHook(() => useHologramLoader());
            const blobUrl = 'blob:http://localhost/some-blob-id';

            await act(async () => {
                await result.current.loadModelFromUrl(blobUrl);
            });

            expect(result.current.status).toBe('success');
            expect(result.current.selectedModel?.url).toBe(blobUrl);
            // Blob URL은 validateSecureUrl 호출 안함
            expect(validateSecureUrl).not.toHaveBeenCalled();
        });

        it('허용된 호스트 URL 로드 성공', async () => {
            const testUrl = 'https://khronos.org/models/test.glb';

            const { result } = renderHook(() => useHologramLoader());

            await act(async () => {
                await result.current.loadModelFromUrl(testUrl, 'Custom Name');
            });

            expect(result.current.status).toBe('success');
            expect(result.current.selectedModel).toEqual({
                id: 'test-uuid-1234',
                name: 'Custom Name',
                url: testUrl,
                format: 'glb',
            });
            expect(result.current.error).toBeNull();
            expect(validateSecureUrl).toHaveBeenCalledWith(
                testUrl,
                expect.any(Object)
            );
        });

        it('허용되지 않은 호스트 URL 로드 시 에러', async () => {
            vi.mocked(validateSecureUrl).mockReturnValue({
                valid: false,
                error: { code: 'INVALID_URL', message: 'Host not allowed' },
            });

            const { result } = renderHook(() => useHologramLoader());

            await act(async () => {
                await result.current.loadModelFromUrl(
                    'https://malicious.com/model.glb'
                );
            });

            expect(result.current.status).toBe('error');
            expect(result.current.error).not.toBeNull();
            // 허용되지 않은 호스트는 INVALID_URL 에러 코드 반환
            expect(result.current.error?.code).toBe('INVALID_URL');
            expect(result.current.error?.message).toContain('Host not allowed');
        });

        it('잘못된 확장자 URL 로드 시 에러', async () => {
            vi.mocked(validateExtension).mockReturnValue({
                valid: false,
                error: {
                    code: 'INVALID_EXTENSION',
                    message: 'Extension not allowed',
                },
            });

            const { result } = renderHook(() => useHologramLoader());

            await act(async () => {
                await result.current.loadModelFromUrl(
                    'https://khronos.org/model.exe'
                );
            });

            expect(result.current.status).toBe('error');
            expect(result.current.error?.message).toContain(
                'Extension not allowed'
            );
        });

        it('loading 상태 전이 확인', async () => {
            const { result } = renderHook(() => useHologramLoader());

            // 초기 상태
            expect(result.current.status).toBe('idle');

            // loadModelFromUrl 시작 - act 내부에서 상태 변경
            const loadPromise = act(async () => {
                await result.current.loadModelFromUrl('/models/test.glb');
            });

            // 완료 대기
            await loadPromise;
            expect(result.current.status).toBe('success');
        });

        it('.gltf 확장자 파일 포맷이 올바르게 설정됨', async () => {
            const { result } = renderHook(() => useHologramLoader());

            await act(async () => {
                await result.current.loadModelFromUrl('/models/test.gltf');
            });

            expect(result.current.selectedModel?.format).toBe('gltf');
        });

        it('이름 미제공 시 URL에서 파일명 추출', async () => {
            const { result } = renderHook(() => useHologramLoader());

            await act(async () => {
                await result.current.loadModelFromUrl('/path/to/my-model.glb');
            });

            expect(result.current.selectedModel?.name).toBe('my-model.glb');
        });
    });

    describe('loadModelFromFile', () => {
        const createMockFile = (name: string): File => {
            const blob = new Blob(['test content'], {
                type: 'application/octet-stream',
            });
            return new File([blob], name, {
                type: 'application/octet-stream',
                lastModified: Date.now(),
            });
        };

        it('.glb 파일 로드 성공', async () => {
            const mockFile = createMockFile('test-model.glb');

            const { result } = renderHook(() => useHologramLoader());

            let objectUrl: string | null = null;
            await act(async () => {
                objectUrl = await result.current.loadModelFromFile(mockFile);
            });

            expect(result.current.status).toBe('success');
            expect(result.current.selectedModel).not.toBeNull();
            expect(result.current.selectedModel?.name).toBe('test-model.glb');
            expect(result.current.selectedModel?.format).toBe('glb');
            expect(result.current.selectedModel?.fileSize).toBe(mockFile.size);
            expect(objectUrl).toBe('blob:http://localhost/test-blob');
        });

        it('.gltf 파일 로드 성공', async () => {
            const mockFile = createMockFile('test-model.gltf');

            const { result } = renderHook(() => useHologramLoader());

            await act(async () => {
                await result.current.loadModelFromFile(mockFile);
            });

            expect(result.current.status).toBe('success');
            expect(result.current.selectedModel?.format).toBe('gltf');
        });

        it('잘못된 확장자 파일 로드 시 INVALID_EXTENSION 에러', async () => {
            vi.mocked(validateExtension).mockReturnValue({
                valid: false,
                error: {
                    code: 'INVALID_EXTENSION',
                    message: 'Only .glb and .gltf files are allowed',
                },
            });

            const mockFile = createMockFile('malware.exe');

            const { result } = renderHook(() => useHologramLoader());

            let objectUrl: string | null = null;
            await act(async () => {
                objectUrl = await result.current.loadModelFromFile(mockFile);
            });

            expect(result.current.status).toBe('error');
            expect(result.current.error?.code).toBe('INVALID_EXTENSION');
            expect(objectUrl).toBeNull();
        });

        it('ObjectURL이 정상적으로 생성됨', async () => {
            const mockFile = createMockFile('test.glb');

            const { result } = renderHook(() => useHologramLoader());

            await act(async () => {
                await result.current.loadModelFromFile(mockFile);
            });

            expect(mockCreateObjectURL).toHaveBeenCalledWith(mockFile);
            expect(result.current.selectedModel?.url).toBe(
                'blob:http://localhost/test-blob'
            );
        });

        it('파일 크기가 모델 정보에 포함됨', async () => {
            const mockFile = createMockFile('large-model.glb');
            // File의 size를 직접 설정하기 어려우므로, 생성된 File의 size 사용

            const { result } = renderHook(() => useHologramLoader());

            await act(async () => {
                await result.current.loadModelFromFile(mockFile);
            });

            expect(result.current.selectedModel?.fileSize).toBeDefined();
        });
    });

    describe('clearModel', () => {
        it('clearModel 호출 시 selectedModel이 null이 되고 status가 idle', async () => {
            const { result } = renderHook(() => useHologramLoader());

            // 먼저 모델 로드
            await act(async () => {
                await result.current.loadModelFromUrl('/models/test.glb');
            });

            expect(result.current.selectedModel).not.toBeNull();
            expect(result.current.status).toBe('success');

            // clearModel 호출
            act(() => {
                result.current.clearModel();
            });

            expect(result.current.selectedModel).toBeNull();
            expect(result.current.status).toBe('idle');
            expect(result.current.error).toBeNull();
        });

        it('에러 상태에서 clearModel 호출 시 에러도 클리어됨', async () => {
            vi.mocked(validateSecureUrl).mockReturnValue({
                valid: false,
                error: { code: 'INVALID_URL', message: 'Test error' },
            });

            const { result } = renderHook(() => useHologramLoader());

            // 에러 발생시키기
            await act(async () => {
                await result.current.loadModelFromUrl(
                    'https://bad.com/model.glb'
                );
            });

            expect(result.current.error).not.toBeNull();

            // clearModel 호출
            act(() => {
                result.current.clearModel();
            });

            expect(result.current.error).toBeNull();
            expect(result.current.status).toBe('idle');
        });
    });

    describe('에러 처리', () => {
        it('에러 발생 후 다시 로드하면 에러가 클리어됨', async () => {
            // 첫 번째 호출 - 에러
            vi.mocked(validateSecureUrl).mockReturnValueOnce({
                valid: false,
                error: { code: 'INVALID_URL', message: 'First error' },
            });

            const { result } = renderHook(() => useHologramLoader());

            await act(async () => {
                await result.current.loadModelFromUrl(
                    'https://bad.com/model.glb'
                );
            });

            expect(result.current.error).not.toBeNull();

            // 두 번째 호출 - 성공 (로컬 경로)
            await act(async () => {
                await result.current.loadModelFromUrl('/models/good.glb');
            });

            expect(result.current.error).toBeNull();
            expect(result.current.status).toBe('success');
        });

        it('URL이 비어있어도 에러 처리됨', async () => {
            const { result } = renderHook(() => useHologramLoader());

            // 빈 URL이지만 /나 blob:으로 시작하지 않으므로 검증 실행
            vi.mocked(validateSecureUrl).mockReturnValue({
                valid: false,
                error: { code: 'INVALID_URL', message: 'Invalid URL' },
            });

            await act(async () => {
                await result.current.loadModelFromUrl('');
            });

            expect(result.current.status).toBe('error');
        });
    });

    describe('고유 ID 생성', () => {
        it('각 로드마다 고유 ID가 생성됨', async () => {
            let callCount = 0;
            randomUUIDSpy.mockImplementation(() => {
                callCount++;
                return `uuid-${callCount}`;
            });

            const { result } = renderHook(() => useHologramLoader());

            await act(async () => {
                await result.current.loadModelFromUrl('/model1.glb');
            });
            const firstId = result.current.selectedModel?.id;

            await act(async () => {
                await result.current.loadModelFromUrl('/model2.glb');
            });
            const secondId = result.current.selectedModel?.id;

            expect(firstId).toBe('uuid-1');
            expect(secondId).toBe('uuid-2');
            expect(firstId).not.toBe(secondId);
        });
    });
});
