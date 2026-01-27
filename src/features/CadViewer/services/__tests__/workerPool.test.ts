/**
 * CadViewer Services - WorkerPool Tests
 * Worker Pool 기본 동작 테스트
 *
 * NOTE: 실제 Worker 실행 테스트는 브라우저 환경에서 수행
 * 이 테스트는 Pool 관리 로직만 검증
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { DxfWorkerPool, type PoolStatus } from '../workerPool';

// Worker Mock - 즉시 응답하는 간단한 Mock
class MockWorker {
    onmessage: ((event: MessageEvent) => void) | null = null;
    onerror: ((event: ErrorEvent) => void) | null = null;

    constructor() {
        // constructor에서는 아무것도 하지 않음
    }

    postMessage(): void {
        // Mock에서는 아무것도 하지 않음
        // 실제 테스트는 브라우저에서 수행
    }

    terminate(): void {
        this.onmessage = null;
        this.onerror = null;
    }
}

// 전역 Worker 모킹
vi.stubGlobal('Worker', MockWorker);

describe('DxfWorkerPool', () => {
    beforeEach(() => {
        // 각 테스트 전 Pool 리셋
        DxfWorkerPool.resetInstance();
    });

    afterEach(() => {
        // 각 테스트 후 Pool 종료
        DxfWorkerPool.resetInstance();
    });

    describe('Singleton 패턴', () => {
        it('getInstance()는 동일한 인스턴스를 반환해야 함', () => {
            const pool1 = DxfWorkerPool.getInstance();
            const pool2 = DxfWorkerPool.getInstance();

            expect(pool1).toBe(pool2);
        });

        it('resetInstance() 후 새 인스턴스가 생성되어야 함', () => {
            const pool1 = DxfWorkerPool.getInstance();
            DxfWorkerPool.resetInstance();
            const pool2 = DxfWorkerPool.getInstance();

            expect(pool1).not.toBe(pool2);
        });
    });

    describe('Worker 초기화', () => {
        it('minWorkers 수만큼 Worker가 초기화되어야 함', () => {
            const pool = DxfWorkerPool.getInstance({ minWorkers: 2 });
            const status = pool.getStatus();

            expect(status.total).toBe(2);
            expect(status.idle).toBe(2);
            expect(status.busy).toBe(0);
        });

        it('커스텀 설정으로 Pool 생성 가능', () => {
            const pool = DxfWorkerPool.getInstance({
                minWorkers: 1,
                maxWorkers: 2,
            });
            const status = pool.getStatus();

            expect(status.total).toBe(1);
        });
    });

    describe('getStatus()', () => {
        it('초기 상태에서 올바른 값 반환', () => {
            const pool = DxfWorkerPool.getInstance({
                minWorkers: 2,
                maxWorkers: 4,
            });
            const status: PoolStatus = pool.getStatus();

            expect(status.total).toBe(2);
            expect(status.idle).toBe(2);
            expect(status.busy).toBe(0);
            expect(status.queued).toBe(0);
        });
    });

    describe('execute() - 기본 동작', () => {
        it('종료된 Pool에서 실행 시 에러 반환', async () => {
            const pool = DxfWorkerPool.getInstance({ minWorkers: 1 });
            pool.terminate();

            await expect(
                pool.execute({
                    text: 'DXF CONTENT',
                    fileName: 'test.dxf',
                    fileSize: 1000,
                })
            ).rejects.toMatchObject({
                code: 'WORKER_ERROR',
            });
        });

        it('execute 호출 시 Worker가 busy 상태가 됨', () => {
            const pool = DxfWorkerPool.getInstance({
                minWorkers: 1,
                maxWorkers: 1,
            });

            // execute 호출 (Promise를 기다리지 않음)
            pool.execute({
                text: 'DXF CONTENT',
                fileName: 'test.dxf',
                fileSize: 1000,
            }).catch(() => {
                // 테스트 종료 시 reject될 수 있음
            });

            const status = pool.getStatus();
            expect(status.busy).toBe(1);
            expect(status.idle).toBe(0);
        });

        it('모든 Worker가 바쁠 때 작업이 큐에 추가됨', () => {
            const pool = DxfWorkerPool.getInstance({
                minWorkers: 1,
                maxWorkers: 1,
            });

            // 첫 번째 작업
            pool.execute({
                text: 'DXF 1',
                fileName: 'test1.dxf',
                fileSize: 1000,
            }).catch(() => {});

            // 두 번째 작업 (큐에 들어감)
            pool.execute({
                text: 'DXF 2',
                fileName: 'test2.dxf',
                fileSize: 1000,
            }).catch(() => {});

            const status = pool.getStatus();
            expect(status.queued).toBe(1);
        });
    });

    describe('terminate()', () => {
        it('모든 Worker가 정리되어야 함', () => {
            const pool = DxfWorkerPool.getInstance({ minWorkers: 2 });

            const statusBefore = pool.getStatus();
            expect(statusBefore.total).toBe(2);

            pool.terminate();

            // terminate 후 새 인스턴스에서 확인
            const newPool = DxfWorkerPool.getInstance({ minWorkers: 1 });
            const statusAfter = newPool.getStatus();
            expect(statusAfter.total).toBe(1);
        });

        it('대기 중인 작업이 거부됨', async () => {
            const pool = DxfWorkerPool.getInstance({
                minWorkers: 1,
                maxWorkers: 1,
            });

            // 첫 번째 작업 (Worker 점유)
            const promise1 = pool.execute({
                text: 'DXF 1',
                fileName: 'test1.dxf',
                fileSize: 1000,
            });

            // 두 번째 작업 (큐에 대기)
            const promise2 = pool.execute({
                text: 'DXF 2',
                fileName: 'test2.dxf',
                fileSize: 1000,
            });

            // Pool 종료
            pool.terminate();

            // 두 작업 결과 확인
            const results = await Promise.allSettled([promise1, promise2]);

            // 최소한 하나는 거부되어야 함 (큐에 있던 작업)
            const rejectedCount = results.filter(
                (r) => r.status === 'rejected'
            ).length;
            expect(rejectedCount).toBeGreaterThanOrEqual(1);
        });
    });

    describe('Pool 설정', () => {
        it('기본 설정값이 적용됨', () => {
            const pool = DxfWorkerPool.getInstance();
            const status = pool.getStatus();

            // 기본값: minWorkers = 2
            expect(status.total).toBe(2);
        });

        it('maxWorkers 제한이 적용됨', () => {
            const pool = DxfWorkerPool.getInstance({
                minWorkers: 1,
                maxWorkers: 2,
            });

            // 3개의 작업 실행
            pool.execute({ text: '1', fileName: '1.dxf', fileSize: 100 }).catch(
                () => {}
            );
            pool.execute({ text: '2', fileName: '2.dxf', fileSize: 100 }).catch(
                () => {}
            );
            pool.execute({ text: '3', fileName: '3.dxf', fileSize: 100 }).catch(
                () => {}
            );

            const status = pool.getStatus();
            // maxWorkers가 2이므로 Worker는 2개, 나머지는 큐에
            expect(status.total).toBe(2);
            expect(status.queued).toBe(1);
        });
    });
});
