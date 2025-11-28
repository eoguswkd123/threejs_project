/**
 * 동기화 관련 타입 정의
 */

// ===== Transport 타입 =====
export type TransportType = 'websocket' | 'webrtc';
export type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'reconnecting' | 'error';
export type DeviceRole = 'master' | 'slave';

// ===== Transport 설정 =====
export interface TransportConfig {
    type: TransportType;
    serverUrl?: string;
    roomId: string;
    deviceId: string;
    role: DeviceRole;
    reconnectAttempts?: number;
    reconnectInterval?: number;
    heartbeatInterval?: number;
}

// ===== Transport 인터페이스 =====
export interface Transport {
    readonly type: TransportType;
    readonly isConnected: boolean;
    readonly connectionState: ConnectionState;

    connect(config: TransportConfig): Promise<void>;
    disconnect(): Promise<void>;
    send(message: SyncMessage): Promise<void>;
    onMessage(handler: MessageHandler): Unsubscribe;
    onConnectionChange(handler: ConnectionHandler): Unsubscribe;
}

export type MessageHandler = (message: SyncMessage) => void;
export type ConnectionHandler = (state: ConnectionState) => void;
export type Unsubscribe = () => void;

// ===== 메시지 타입 =====
export type MessageType =
    | 'DEVICE_JOIN'
    | 'DEVICE_LEAVE'
    | 'VIEW_STATE_UPDATE'
    | 'CAMERA_UPDATE'
    | 'SELECTION_UPDATE'
    | 'LAYER_UPDATE'
    | 'MODEL_LOADED'
    | 'ANNOTATION_ADD'
    | 'ANNOTATION_REMOVE'
    | 'HEARTBEAT'
    | 'SYNC_REQUEST'
    | 'SYNC_RESPONSE'
    | 'ERROR';

export interface SyncMessage<T = unknown> {
    type: MessageType;
    payload: T;
    timestamp: number;
    senderId: string;
    sequenceNumber: number;
    roomId: string;
}

// ===== 디바이스 정보 =====
export interface DeviceInfo {
    id: string;
    name: string;
    role: DeviceRole;
    joinedAt: number;
    lastSeen: number;
    isOnline: boolean;
}

// ===== 뷰포트 상태 =====
export interface ViewportState {
    camera: CameraState;
    selection: SelectionState;
    visibility: VisibilityState;
}

export interface CameraState {
    position: [number, number, number];
    target: [number, number, number];
    up: [number, number, number];
    zoom: number;
    fov?: number;
}

export interface SelectionState {
    selectedIds: string[];
    highlightedId?: string;
}

export interface VisibilityState {
    visibleLayers: string[];
    hiddenEntityIds: string[];
}

// ===== 동기화 엔진 =====
export type ConflictStrategy = 'master-wins' | 'last-write-wins' | 'merge';

export interface SyncEngineConfig {
    conflictStrategy: ConflictStrategy;
    syncInterval: number;
    batchUpdates: boolean;
    maxBatchSize: number;
}

export interface SyncEngineState {
    isRunning: boolean;
    lastSyncTime: number;
    pendingUpdates: number;
    connectedDevices: DeviceInfo[];
}

// ===== WebSocket 관련 =====
export interface WebSocketConfig extends TransportConfig {
    type: 'websocket';
    protocols?: string[];
    pingInterval?: number;
}

// ===== WebRTC 관련 =====
export interface WebRTCConfig extends TransportConfig {
    type: 'webrtc';
    iceServers?: RTCIceServer[];
    dataChannelOptions?: RTCDataChannelInit;
    signalingServerUrl: string;
}

export interface RTCSignalingMessage {
    type: 'offer' | 'answer' | 'candidate' | 'ready';
    from: string;
    to: string;
    payload: RTCSessionDescriptionInit | RTCIceCandidateInit | null;
}

// ===== 메시지 페이로드 =====
export interface DeviceJoinPayload {
    device: DeviceInfo;
}

export interface DeviceLeavePayload {
    deviceId: string;
    reason?: string;
}

export interface ViewStateUpdatePayload {
    state: Partial<ViewportState>;
}

export interface CameraUpdatePayload {
    camera: CameraState;
}

export interface SelectionUpdatePayload {
    selection: SelectionState;
}

export interface LayerUpdatePayload {
    layerName: string;
    visible: boolean;
}

export interface ModelLoadedPayload {
    filename: string;
    entityCount: number;
    bounds: {
        min: [number, number, number];
        max: [number, number, number];
    };
}

export interface SyncRequestPayload {
    requestedState: ('camera' | 'selection' | 'visibility')[];
}

export interface SyncResponsePayload {
    state: ViewportState;
}

export interface ErrorPayload {
    code: string;
    message: string;
    details?: unknown;
}

// ===== 헬퍼 함수 =====
export function createSyncMessage<T>(
    type: MessageType,
    payload: T,
    senderId: string,
    roomId: string,
    sequenceNumber: number
): SyncMessage<T> {
    return {
        type,
        payload,
        timestamp: Date.now(),
        senderId,
        roomId,
        sequenceNumber,
    };
}

export function isValidMessage(message: unknown): message is SyncMessage {
    if (typeof message !== 'object' || message === null) return false;
    const msg = message as Record<string, unknown>;
    return (
        typeof msg['type'] === 'string' &&
        typeof msg['timestamp'] === 'number' &&
        typeof msg['senderId'] === 'string' &&
        typeof msg['roomId'] === 'string' &&
        typeof msg['sequenceNumber'] === 'number'
    );
}
