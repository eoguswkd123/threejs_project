/**
 * DXF Parser Worker Pool
 * Worker 재사용으로 생성 오버헤드 제거
 *
 * @description
 * - Singleton 패턴으로 앱 전체에서 단일 Pool 인스턴스 사용
 * - 최소 Worker 수 유지, 최대 Worker 수 제한
 * - 유휴 Worker 자동 정리 (타임아웃 기반)
 * - 작업 큐 관리로 모든 Worker 사용 중일 때 대기
 */

import type { ParsedCADData } from '@/types/cad';

import { WORKER_POOL_CONFIG } from '../constants';

import type {
    WorkerRequest,
    WorkerResponse,
    WorkerSuccessPayload,
    WorkerErrorPayload,
    WorkerProgressPayload,
} from '../types';
import type { UploadError } from '../types';

// ============================================================
// 타입 정의
// ============================================================

/** Pool 설정 */
export interface PoolConfig {
    /** 최소 Worker 수 (항상 유지) */
    minWorkers: number;
    /** 최대 Worker 수 */
    maxWorkers: number;
    /** 유휴 Worker 타임아웃 (ms) */
    idleTimeoutMs: number;
    /** 작업 타임아웃 (ms) */
    taskTimeoutMs: number;
    /** 정리 타이머 간격 (ms) */
    cleanupIntervalMs: number;
}

/** Pool 내 Worker 정보 */
interface PooledWorker {
    /** Worker 인스턴스 */
    worker: Worker;
    /** 고유 ID */
    id: string;
    /** 상태 */
    status: 'idle' | 'busy';
    /** 마지막 사용 시간 */
    lastUsedAt: number;
    /** 처리한 작업 수 */
    taskCount: number;
}

/** 파싱 작업 */
export interface ParseTask {
    /** 작업 ID */
    id: string;
    /** DXF 파일 텍스트 */
    text: string;
    /** 파일명 */
    fileName: string;
    /** 파일 크기 */
    fileSize: number;
    /** 성공 콜백 */
    resolve: (result: ParsedCADData) => void;
    /** 실패 콜백 */
    reject: (error: UploadError) => void;
    /** 진행률 콜백 */
    onProgress?: (stage: string, percent: number) => void;
}

/** Pool 상태 */
export interface PoolStatus {
    /** 전체 Worker 수 */
    total: number;
    /** 유휴 Worker 수 */
    idle: number;
    /** 사용 중 Worker 수 */
    busy: number;
    /** 대기 중인 작업 수 */
    queued: number;
}

// ============================================================
// Worker Pool 클래스
// ============================================================

/**
 * DXF Parser Worker Pool
 * Singleton 패턴으로 앱 전체에서 단일 인스턴스 사용
 */
export class DxfWorkerPool {
    private static instance: DxfWorkerPool | null = null;

    private workers: Map<string, PooledWorker> = new Map();
    private taskQueue: ParseTask[] = [];
    private activeTasks: Map<string, ParseTask> = new Map(); // workerId → task
    private config: PoolConfig;
    private cleanupTimer: ReturnType<typeof setInterval> | null = null;
    private isTerminated = false;

    private constructor(config: PoolConfig) {
        this.config = config;
        this.initializeMinWorkers();
        this.startCleanupTimer();
    }

    /**
     * Singleton 인스턴스 획득
     * @param config 설정 (최초 생성 시에만 적용)
     */
    static getInstance(config?: Partial<PoolConfig>): DxfWorkerPool {
        if (!DxfWorkerPool.instance || DxfWorkerPool.instance.isTerminated) {
            DxfWorkerPool.instance = new DxfWorkerPool({
                minWorkers: WORKER_POOL_CONFIG.minWorkers,
                maxWorkers: WORKER_POOL_CONFIG.maxWorkers,
                idleTimeoutMs: WORKER_POOL_CONFIG.idleTimeoutMs,
                taskTimeoutMs: WORKER_POOL_CONFIG.taskTimeoutMs,
                cleanupIntervalMs: WORKER_POOL_CONFIG.cleanupIntervalMs,
                ...config,
            });
        }
        return DxfWorkerPool.instance;
    }

    /**
     * 테스트용 인스턴스 리셋
     * @internal
     */
    static resetInstance(): void {
        if (DxfWorkerPool.instance) {
            DxfWorkerPool.instance.terminate();
        }
        DxfWorkerPool.instance = null;
    }

    /** 최소 Worker 수 초기화 */
    private initializeMinWorkers(): void {
        for (let i = 0; i < this.config.minWorkers; i++) {
            this.createWorker();
        }
    }

    /** Worker 생성 */
    private createWorker(): PooledWorker {
        const id = crypto.randomUUID();
        const worker = new Worker(
            new URL('./dxfParser.worker.ts', import.meta.url),
            { type: 'module' }
        );

        const pooledWorker: PooledWorker = {
            worker,
            id,
            status: 'idle',
            lastUsedAt: Date.now(),
            taskCount: 0,
        };

        this.workers.set(id, pooledWorker);
        return pooledWorker;
    }

    /** 유휴 Worker 획득 또는 생성 */
    private acquireWorker(): PooledWorker | null {
        // 1. 유휴 Worker 찾기
        for (const pooledWorker of this.workers.values()) {
            if (pooledWorker.status === 'idle') {
                pooledWorker.status = 'busy';
                return pooledWorker;
            }
        }

        // 2. 최대 수 미만이면 새 Worker 생성
        if (this.workers.size < this.config.maxWorkers) {
            const newWorker = this.createWorker();
            newWorker.status = 'busy';
            return newWorker;
        }

        // 3. 모든 Worker가 사용 중
        return null;
    }

    /** Worker 반환 */
    private releaseWorker(workerId: string): void {
        const pooledWorker = this.workers.get(workerId);
        if (pooledWorker) {
            pooledWorker.status = 'idle';
            pooledWorker.lastUsedAt = Date.now();
            pooledWorker.taskCount++;

            // 대기 중인 작업이 있으면 처리
            this.processQueue();
        }
    }

    /**
     * WorkerSuccessPayload를 ParsedCADData로 변환
     */
    private convertPayloadToData(payload: WorkerSuccessPayload): ParsedCADData {
        return {
            lines: payload.lines,
            circles: payload.circles,
            arcs: payload.arcs,
            polylines: payload.polylines,
            hatches: payload.hatches,
            texts: payload.texts,
            mtexts: payload.mtexts,
            ellipses: payload.ellipses,
            splines: payload.splines,
            dimensions: payload.dimensions,
            bounds: payload.bounds,
            metadata: payload.metadata,
            layers: payload.layers,
        };
    }

    /**
     * 작업 실행
     * @param task 파싱 작업 (id, resolve, reject 제외)
     * @returns ParsedCADData Promise
     */
    execute(
        task: Omit<ParseTask, 'id' | 'resolve' | 'reject'>
    ): Promise<ParsedCADData> {
        if (this.isTerminated) {
            return Promise.reject({
                code: 'WORKER_ERROR',
                message: 'Worker Pool이 종료되었습니다.',
            } as UploadError);
        }

        return new Promise((resolve, reject) => {
            const fullTask: ParseTask = {
                ...task,
                id: crypto.randomUUID(),
                resolve,
                reject,
            };

            const worker = this.acquireWorker();

            if (worker) {
                this.runTask(worker, fullTask);
            } else {
                // 모든 Worker가 바쁨 → 큐에 추가
                this.taskQueue.push(fullTask);
            }
        });
    }

    /** 작업 실행 (Worker에서) */
    private runTask(pooledWorker: PooledWorker, task: ParseTask): void {
        const { worker, id: workerId } = pooledWorker;

        // 활성 작업으로 등록
        this.activeTasks.set(workerId, task);

        // 타임아웃 설정
        const timeoutId = setTimeout(() => {
            cleanup();
            task.reject({
                code: 'TIMEOUT',
                message: '파일 처리 시간이 초과되었습니다.',
            });
            this.releaseWorker(workerId);
        }, this.config.taskTimeoutMs);

        const cleanup = () => {
            clearTimeout(timeoutId);
            worker.onmessage = null;
            worker.onerror = null;
            this.activeTasks.delete(workerId);
        };

        worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
            const { type, payload } = event.data;

            if (type === 'progress') {
                const progressPayload = payload as WorkerProgressPayload;
                task.onProgress?.(
                    progressPayload.stage,
                    progressPayload.percent
                );
            } else if (type === 'success') {
                cleanup();
                const successPayload = payload as WorkerSuccessPayload;
                task.resolve(this.convertPayloadToData(successPayload));
                this.releaseWorker(workerId);
            } else if (type === 'error') {
                cleanup();
                const errorPayload = payload as WorkerErrorPayload;
                task.reject({
                    code: errorPayload.code as UploadError['code'],
                    message: errorPayload.message,
                });
                this.releaseWorker(workerId);
            }
        };

        worker.onerror = () => {
            cleanup();
            task.reject({
                code: 'WORKER_ERROR',
                message: 'Worker 오류가 발생했습니다.',
            });
            this.releaseWorker(workerId);
        };

        // 작업 요청
        const request: WorkerRequest = {
            type: 'parse',
            payload: {
                text: task.text,
                fileName: task.fileName,
                fileSize: task.fileSize,
            },
        };
        worker.postMessage(request);
    }

    /** 큐 처리 */
    private processQueue(): void {
        while (this.taskQueue.length > 0) {
            const worker = this.acquireWorker();
            if (!worker) break;

            const task = this.taskQueue.shift()!;
            this.runTask(worker, task);
        }
    }

    /** 유휴 Worker 정리 타이머 */
    private startCleanupTimer(): void {
        this.cleanupTimer = setInterval(() => {
            const now = Date.now();

            for (const [id, pooledWorker] of this.workers.entries()) {
                // 최소 수 유지
                if (this.workers.size <= this.config.minWorkers) break;

                // 유휴 타임아웃 체크
                if (
                    pooledWorker.status === 'idle' &&
                    now - pooledWorker.lastUsedAt > this.config.idleTimeoutMs
                ) {
                    pooledWorker.worker.terminate();
                    this.workers.delete(id);
                }
            }
        }, this.config.cleanupIntervalMs);
    }

    /**
     * Pool 상태 조회
     * @returns PoolStatus
     */
    getStatus(): PoolStatus {
        let idle = 0,
            busy = 0;
        for (const w of this.workers.values()) {
            if (w.status === 'idle') idle++;
            else busy++;
        }
        return {
            total: this.workers.size,
            idle,
            busy,
            queued: this.taskQueue.length,
        };
    }

    /**
     * Pool 종료
     * 모든 Worker 종료 및 정리
     */
    terminate(): void {
        this.isTerminated = true;

        if (this.cleanupTimer) {
            clearInterval(this.cleanupTimer);
            this.cleanupTimer = null;
        }

        // 대기 중인 작업 거부
        for (const task of this.taskQueue) {
            task.reject({
                code: 'WORKER_ERROR',
                message: 'Worker Pool이 종료되었습니다.',
            });
        }
        this.taskQueue = [];

        // 활성 작업(실행 중인 작업) 거부
        for (const task of this.activeTasks.values()) {
            task.reject({
                code: 'WORKER_ERROR',
                message: 'Worker Pool이 종료되었습니다.',
            });
        }
        this.activeTasks.clear();

        // 모든 Worker 종료
        for (const { worker } of this.workers.values()) {
            worker.terminate();
        }
        this.workers.clear();
    }
}
