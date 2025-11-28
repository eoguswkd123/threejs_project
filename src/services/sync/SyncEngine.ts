/**
 * Sync Engine
 * 뷰어 상태 동기화 관리
 */

import type {
    Transport,
    TransportConfig,
    SyncMessage,
    MessageType,
    ViewportState,
    CameraState,
    SelectionState,
    VisibilityState,
    DeviceInfo,
    SyncEngineConfig,
    Unsubscribe,
} from '@types/sync';
import { createSyncMessage } from '@types/sync';
import { transportFactory } from './TransportFactory';
import { useSyncStore } from '@stores';

const DEFAULT_CONFIG: SyncEngineConfig = {
    conflictStrategy: 'master-wins',
    syncInterval: 100,
    batchUpdates: true,
    maxBatchSize: 10,
};

type StateUpdateHandler = (state: Partial<ViewportState>) => void;

export class SyncEngine {
    private transport: Transport | null = null;
    private config: SyncEngineConfig;
    private transportConfig: TransportConfig | null = null;
    private updateHandlers: Set<StateUpdateHandler> = new Set();
    private batchedUpdates: Partial<ViewportState>[] = [];
    private batchTimer: ReturnType<typeof setTimeout> | null = null;
    private unsubscribers: Unsubscribe[] = [];

    constructor(config: Partial<SyncEngineConfig> = {}) {
        this.config = { ...DEFAULT_CONFIG, ...config };
    }

    /**
     * 연결 시작
     */
    async connect(transportConfig: TransportConfig): Promise<void> {
        this.transportConfig = transportConfig;

        // Transport 생성
        this.transport = transportFactory.create(transportConfig.type);

        // 이벤트 구독
        this.unsubscribers.push(
            this.transport.onMessage((message) => this.handleMessage(message)),
            this.transport.onConnectionChange((state) => {
                useSyncStore.getState().setConnectionState(state);
            })
        );

        // 연결
        useSyncStore.getState().setTransportType(transportConfig.type);
        await this.transport.connect(transportConfig);

        // 연결 성공
        useSyncStore.getState().onConnected(
            transportConfig.roomId,
            transportConfig.deviceId,
            transportConfig.role
        );

        // 자신의 디바이스 정보 브로드캐스트
        await this.sendDeviceJoin();
    }

    /**
     * 연결 종료
     */
    async disconnect(): Promise<void> {
        this.cancelBatchTimer();

        // 구독 해제
        this.unsubscribers.forEach((unsub) => unsub());
        this.unsubscribers = [];

        // 연결 종료
        if (this.transport) {
            await this.transport.disconnect();
            this.transport = null;
        }

        useSyncStore.getState().onDisconnected();
    }

    /**
     * 상태 업데이트 핸들러 등록
     */
    onStateUpdate(handler: StateUpdateHandler): Unsubscribe {
        this.updateHandlers.add(handler);
        return () => this.updateHandlers.delete(handler);
    }

    /**
     * 카메라 상태 동기화
     */
    async syncCamera(camera: CameraState): Promise<void> {
        if (this.config.batchUpdates) {
            this.addToBatch({ camera });
        } else {
            await this.sendMessage('CAMERA_UPDATE', { camera });
        }
    }

    /**
     * 선택 상태 동기화
     */
    async syncSelection(selection: SelectionState): Promise<void> {
        await this.sendMessage('SELECTION_UPDATE', { selection });
    }

    /**
     * 가시성 상태 동기화
     */
    async syncVisibility(layerName: string, visible: boolean): Promise<void> {
        await this.sendMessage('LAYER_UPDATE', { layerName, visible });
    }

    /**
     * 전체 뷰 상태 동기화
     */
    async syncViewState(state: Partial<ViewportState>): Promise<void> {
        await this.sendMessage('VIEW_STATE_UPDATE', { state });
    }

    /**
     * 동기화 요청
     */
    async requestSync(requestedState: ('camera' | 'selection' | 'visibility')[]): Promise<void> {
        await this.sendMessage('SYNC_REQUEST', { requestedState });
    }

    // 메시지 전송
    private async sendMessage<T>(type: MessageType, payload: T): Promise<void> {
        if (!this.transport || !this.transportConfig) return;

        const message = createSyncMessage(
            type,
            payload,
            this.transportConfig.deviceId,
            this.transportConfig.roomId,
            Date.now()
        );

        await this.transport.send(message);
        useSyncStore.getState().updateLastSyncTime();
    }

    // 메시지 처리
    private handleMessage(message: SyncMessage): void {
        const store = useSyncStore.getState();

        switch (message.type) {
            case 'DEVICE_JOIN': {
                const { device } = message.payload as { device: DeviceInfo };
                store.addDevice(device);
                break;
            }

            case 'DEVICE_LEAVE': {
                const { deviceId } = message.payload as { deviceId: string };
                store.removeDevice(deviceId);
                break;
            }

            case 'VIEW_STATE_UPDATE': {
                const { state } = message.payload as { state: Partial<ViewportState> };
                this.applyRemoteState(state);
                break;
            }

            case 'CAMERA_UPDATE': {
                const { camera } = message.payload as { camera: CameraState };
                this.applyRemoteState({ camera });
                break;
            }

            case 'SELECTION_UPDATE': {
                const { selection } = message.payload as { selection: SelectionState };
                this.applyRemoteState({ selection });
                break;
            }

            case 'LAYER_UPDATE': {
                const { layerName, visible } = message.payload as {
                    layerName: string;
                    visible: boolean;
                };
                this.applyRemoteState({
                    visibility: {
                        visibleLayers: visible
                            ? [...(store.remoteViewportState?.visibility?.visibleLayers ?? []), layerName]
                            : (store.remoteViewportState?.visibility?.visibleLayers ?? []).filter(
                                  (l) => l !== layerName
                              ),
                        hiddenEntityIds: store.remoteViewportState?.visibility?.hiddenEntityIds ?? [],
                    },
                });
                break;
            }

            case 'SYNC_REQUEST': {
                const { requestedState } = message.payload as {
                    requestedState: ('camera' | 'selection' | 'visibility')[];
                };
                this.handleSyncRequest(requestedState);
                break;
            }

            case 'SYNC_RESPONSE': {
                const { state } = message.payload as { state: ViewportState };
                this.applyRemoteState(state);
                break;
            }

            case 'HEARTBEAT':
                store.updateDevice(message.senderId, { lastSeen: Date.now() });
                break;
        }
    }

    // 원격 상태 적용
    private applyRemoteState(state: Partial<ViewportState>): void {
        const store = useSyncStore.getState();
        const isSlave = store.role === 'slave';

        // 충돌 해결
        if (this.config.conflictStrategy === 'master-wins' && !isSlave) {
            // 마스터는 자신의 상태 유지
            return;
        }

        // 원격 상태 저장
        const currentRemote = store.remoteViewportState;
        const newRemote: ViewportState = {
            camera: state.camera ?? currentRemote?.camera ?? {
                position: [0, 0, 100],
                target: [0, 0, 0],
                up: [0, 1, 0],
                zoom: 1,
            },
            selection: state.selection ?? currentRemote?.selection ?? {
                selectedIds: [],
            },
            visibility: state.visibility ?? currentRemote?.visibility ?? {
                visibleLayers: [],
                hiddenEntityIds: [],
            },
        };
        store.setRemoteViewportState(newRemote);

        // 핸들러에 전달
        this.updateHandlers.forEach((handler) => handler(state));
    }

    // 동기화 요청 처리
    private async handleSyncRequest(
        requestedState: ('camera' | 'selection' | 'visibility')[]
    ): Promise<void> {
        const store = useSyncStore.getState();

        // 마스터만 응답
        if (store.role !== 'master') return;

        // 현재 뷰어 상태 가져오기 (viewerStore에서)
        // 실제 구현에서는 viewerStore 상태를 가져와야 함
        const state: ViewportState = {
            camera: { position: [0, 0, 100], target: [0, 0, 0], up: [0, 1, 0], zoom: 1 },
            selection: { selectedIds: [] },
            visibility: { visibleLayers: [], hiddenEntityIds: [] },
        };

        await this.sendMessage('SYNC_RESPONSE', { state });
    }

    // 디바이스 참여 알림
    private async sendDeviceJoin(): Promise<void> {
        if (!this.transportConfig) return;

        const device: DeviceInfo = {
            id: this.transportConfig.deviceId,
            name: `Device-${this.transportConfig.deviceId.slice(0, 8)}`,
            role: this.transportConfig.role,
            joinedAt: Date.now(),
            lastSeen: Date.now(),
            isOnline: true,
        };

        await this.sendMessage('DEVICE_JOIN', { device });
    }

    // 배치 업데이트
    private addToBatch(update: Partial<ViewportState>): void {
        this.batchedUpdates.push(update);

        if (this.batchedUpdates.length >= this.config.maxBatchSize) {
            this.flushBatch();
        } else if (!this.batchTimer) {
            this.batchTimer = setTimeout(() => {
                this.flushBatch();
            }, this.config.syncInterval);
        }
    }

    private flushBatch(): void {
        this.cancelBatchTimer();

        if (this.batchedUpdates.length === 0) return;

        // 마지막 업데이트만 전송 (카메라의 경우)
        const merged = this.batchedUpdates.reduce((acc, update) => {
            return { ...acc, ...update };
        }, {});

        this.batchedUpdates = [];
        this.sendMessage('VIEW_STATE_UPDATE', { state: merged });
    }

    private cancelBatchTimer(): void {
        if (this.batchTimer) {
            clearTimeout(this.batchTimer);
            this.batchTimer = null;
        }
    }
}

// 싱글톤 인스턴스
let syncEngineInstance: SyncEngine | null = null;

export function getSyncEngine(config?: Partial<SyncEngineConfig>): SyncEngine {
    if (!syncEngineInstance) {
        syncEngineInstance = new SyncEngine(config);
    }
    return syncEngineInstance;
}

export function resetSyncEngine(): void {
    syncEngineInstance?.disconnect();
    syncEngineInstance = null;
}
