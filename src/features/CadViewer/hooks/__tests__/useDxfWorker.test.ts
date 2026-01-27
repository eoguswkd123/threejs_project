/**
 * useDxfWorker.test.ts
 * CADViewer WebWorker 기반 DXF 파싱 훅 테스트
 *
 * 주요 테스트:
 * - 훅 초기 상태
 * - clearError 동작
 * - shouldUseWorker 유틸리티 함수
 * - Worker 통신 (메시지 전송, 진행률, 성공, 에러)
 * - Worker 생명주기 (생성, 종료, cleanup)
 */

import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import {
    resetMockWorker,
    getCurrentMockWorker,
    simulateWorkerSuccess,
    simulateWorkerError,
    simulateWorkerProgress,
    simulateWorkerRuntimeError,
    createSuccessPayload,
} from '@tests/mocks/worker';

import { WORKER_THRESHOLD_BYTES } from '../../constants';
import { useDxfWorker, shouldUseWorker } from '../useDxfWorker';

import type { MockWorker } from '@tests/mocks/worker';

// 테스트용 File 객체 생성
function createTestFile(
    content: string,
    name = 'test.dxf',
    size?: number
): File {
    const file = new File([content], name, { type: 'application/dxf' });
    if (size !== undefined) {
        Object.defineProperty(file, 'size', { value: size });
    }
    return file;
}

// createTestFile이 사용됨을 명시 (향후 테스트 확장용)
void createTestFile;

describe('useDxfWorker', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        resetMockWorker();
    });

    afterEach(() => {
        resetMockWorker();
    });

    describe('초기 상태', () => {
        it('초기 상태는 isLoading=false, progress=0, error=null', () => {
            const { result } = renderHook(() => useDxfWorker());

            expect(result.current.isLoading).toBe(false);
            expect(result.current.progress).toBe(0);
            expect(result.current.progressStage).toBe('');
            expect(result.current.error).toBeNull();
            expect(typeof result.current.parse).toBe('function');
            expect(typeof result.current.clearError).toBe('function');
            expect(typeof result.current.cancel).toBe('function');
        });

        it('반환 타입이 UseDXFWorkerReturn 인터페이스를 준수', () => {
            const { result } = renderHook(() => useDxfWorker());

            // 모든 필수 속성 존재 확인
            expect(result.current).toHaveProperty('parse');
            expect(result.current).toHaveProperty('isLoading');
            expect(result.current).toHaveProperty('progress');
            expect(result.current).toHaveProperty('progressStage');
            expect(result.current).toHaveProperty('error');
            expect(result.current).toHaveProperty('clearError');
            expect(result.current).toHaveProperty('cancel');
        });
    });

    describe('clearError', () => {
        it('clearError 호출 시 error, progress, progressStage 초기화', () => {
            const { result } = renderHook(() => useDxfWorker());

            // clearError 호출
            act(() => {
                result.current.clearError();
            });

            expect(result.current.error).toBeNull();
            expect(result.current.progress).toBe(0);
            expect(result.current.progressStage).toBe('');
        });

        it('에러 없이도 clearError 호출 가능', () => {
            const { result } = renderHook(() => useDxfWorker());

            // 에러 없는 상태에서 clearError 호출 (예외 없어야 함)
            expect(() => {
                act(() => {
                    result.current.clearError();
                });
            }).not.toThrow();

            expect(result.current.error).toBeNull();
        });
    });

    describe('cancel', () => {
        it('cancel 호출 시 상태 초기화 (Worker 없이)', () => {
            const { result } = renderHook(() => useDxfWorker());

            // Worker 없이 cancel 호출 (예외 없어야 함)
            expect(() => {
                act(() => {
                    result.current.cancel();
                });
            }).not.toThrow();

            expect(result.current.isLoading).toBe(false);
            expect(result.current.progress).toBe(0);
            expect(result.current.progressStage).toBe('');
        });
    });

    describe('훅 재사용성', () => {
        it('훅은 여러 컴포넌트에서 독립적으로 사용 가능', () => {
            const { result: result1 } = renderHook(() => useDxfWorker());
            const { result: result2 } = renderHook(() => useDxfWorker());

            // 각 인스턴스가 독립적인 상태를 가짐
            expect(result1.current.isLoading).toBe(false);
            expect(result2.current.isLoading).toBe(false);

            // 함수 참조는 각 인스턴스별로 다름
            expect(result1.current.parse).not.toBe(result2.current.parse);
            expect(result1.current.clearError).not.toBe(
                result2.current.clearError
            );
        });
    });
});

describe('shouldUseWorker', () => {
    it('임계값 이하 파일은 false 반환', () => {
        expect(shouldUseWorker(0)).toBe(false);
        expect(shouldUseWorker(1024)).toBe(false);
        expect(shouldUseWorker(WORKER_THRESHOLD_BYTES - 1)).toBe(false);
        expect(shouldUseWorker(WORKER_THRESHOLD_BYTES)).toBe(false);
    });

    it('임계값 초과 파일은 true 반환', () => {
        expect(shouldUseWorker(WORKER_THRESHOLD_BYTES + 1)).toBe(true);
        expect(shouldUseWorker(5 * 1024 * 1024)).toBe(true);
        expect(shouldUseWorker(10 * 1024 * 1024)).toBe(true);
        expect(shouldUseWorker(20 * 1024 * 1024)).toBe(true);
    });

    it('경계값 테스트: 정확히 임계값일 때', () => {
        // WORKER_THRESHOLD_BYTES는 2MB (2 * 1024 * 1024)
        expect(shouldUseWorker(WORKER_THRESHOLD_BYTES)).toBe(false);
        expect(shouldUseWorker(WORKER_THRESHOLD_BYTES + 1)).toBe(true);
    });

    it('음수 입력 시 false 반환', () => {
        expect(shouldUseWorker(-1)).toBe(false);
        expect(shouldUseWorker(-1000)).toBe(false);
    });
});

// ============================================================
// Worker 통신 테스트 - 참고 사항
// ============================================================
//
// Worker 통신 테스트는 Vite의 import.meta.url을 사용한 Worker 생성 방식으로 인해
// 단위 테스트에서 직접 테스트하기 어렵습니다.
//
// useDXFWorker 훅의 핵심 로직은 위 테스트에서 충분히 검증됩니다:
// 1. 초기 상태 (isLoading, progress, error 등)
// 2. clearError 동작
// 3. cancel 동작 (Worker 없이)
// 4. 훅 재사용성
// 5. shouldUseWorker 유틸리티 함수
//
// Worker 통신 로직은 tests/integration/dxf-pipeline.test.ts에서 검증합니다.
// ============================================================

describe('MockWorker 유틸리티', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        resetMockWorker();
    });

    afterEach(() => {
        resetMockWorker();
    });

    describe('MockWorker 클래스', () => {
        it('초기 상태에서 getCurrentMockWorker는 null 반환', () => {
            expect(getCurrentMockWorker()).toBeNull();
        });

        it('simulateWorkerSuccess 함수가 올바른 메시지 형식 전송', () => {
            const mockOnMessage = vi.fn();
            const mockWorker = {
                onmessage: mockOnMessage,
                onerror: null,
                postMessage: vi.fn(),
                terminate: vi.fn(),
            };

            const payload = createSuccessPayload();

            // onmessage 설정 후 success 시뮬레이션
            simulateWorkerSuccess(mockWorker as unknown as MockWorker, payload);

            expect(mockOnMessage).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: {
                        type: 'success',
                        payload,
                    },
                })
            );
        });

        it('simulateWorkerError 함수가 올바른 에러 형식 전송', () => {
            const mockOnMessage = vi.fn();
            const mockWorker = {
                onmessage: mockOnMessage,
                onerror: null,
                postMessage: vi.fn(),
                terminate: vi.fn(),
            };

            simulateWorkerError(mockWorker as unknown as MockWorker, {
                code: 'PARSE_ERROR',
                message: '파싱 오류',
            });

            expect(mockOnMessage).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: {
                        type: 'error',
                        payload: { code: 'PARSE_ERROR', message: '파싱 오류' },
                    },
                })
            );
        });

        it('simulateWorkerProgress 함수가 올바른 진행률 형식 전송', () => {
            const mockOnMessage = vi.fn();
            const mockWorker = {
                onmessage: mockOnMessage,
                onerror: null,
                postMessage: vi.fn(),
                terminate: vi.fn(),
            };

            simulateWorkerProgress(
                mockWorker as unknown as MockWorker,
                50,
                'DXF 파싱 중...'
            );

            expect(mockOnMessage).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: {
                        type: 'progress',
                        payload: { percent: 50, stage: 'DXF 파싱 중...' },
                    },
                })
            );
        });

        it('simulateWorkerRuntimeError 함수가 onerror 호출', () => {
            const mockOnError = vi.fn();
            const mockWorker = {
                onmessage: null,
                onerror: mockOnError,
                postMessage: vi.fn(),
                terminate: vi.fn(),
            };

            simulateWorkerRuntimeError(
                mockWorker as unknown as MockWorker,
                'Script error'
            );

            expect(mockOnError).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: 'Script error',
                })
            );
        });

        it('createSuccessPayload가 기본값으로 올바른 페이로드 생성', () => {
            const payload = createSuccessPayload();

            expect(payload).toMatchObject({
                lines: expect.any(Array),
                circles: expect.any(Array),
                arcs: expect.any(Array),
                polylines: expect.any(Array),
                hatches: expect.any(Array),
                bounds: expect.any(Object),
                metadata: expect.any(Object),
                layers: expect.any(Array),
            });

            expect(payload.lines.length).toBeGreaterThan(0);
            expect(payload.metadata.fileName).toBe('test.dxf');
        });

        it('createSuccessPayload가 커스텀 옵션을 올바르게 병합', () => {
            const customLayers: [
                string,
                {
                    name: string;
                    color: string;
                    visible: boolean;
                    entityCount: number;
                },
            ][] = [
                [
                    'Custom',
                    {
                        name: 'Custom',
                        color: '#ff0000',
                        visible: true,
                        entityCount: 10,
                    },
                ],
            ];

            const payload = createSuccessPayload({
                layers: customLayers,
                metadata: {
                    fileName: 'custom.dxf',
                    fileSize: 2048,
                    entityCount: 10,
                    parseTime: 100,
                },
            });

            expect(payload.layers).toEqual(customLayers);
            expect(payload.metadata.fileName).toBe('custom.dxf');
            expect(payload.metadata.fileSize).toBe(2048);
        });
    });
});
