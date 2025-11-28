/**
 * 동기화 상태 관리 Store (Zustand)
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type {
    TransportType,
    ConnectionState,
    DeviceRole,
    DeviceInfo,
    ViewportState,
} from '@types/sync';

// ===== 상태 타입 =====
export interface SyncState {
    // 연결 정보
    transportType: TransportType | null;
    connectionState: ConnectionState;
    roomId: string | null;
    deviceId: string | null;
    role: DeviceRole | null;

    // 연결된 디바이스
    connectedDevices: DeviceInfo[];

    // 동기화 상태
    isSyncEnabled: boolean;
    lastSyncTime: number | null;
    pendingUpdates: number;

    // 에러
    connectionError: string | null;

    // 뷰포트 상태 (다른 디바이스로부터 수신)
    remoteViewportState: ViewportState | null;
}

export interface SyncActions {
    // 연결 관리
    setTransportType: (type: TransportType | null) => void;
    setConnectionState: (state: ConnectionState) => void;
    setRoomId: (roomId: string | null) => void;
    setDeviceId: (deviceId: string | null) => void;
    setRole: (role: DeviceRole | null) => void;
    setConnectionError: (error: string | null) => void;

    // 디바이스 관리
    addDevice: (device: DeviceInfo) => void;
    removeDevice: (deviceId: string) => void;
    updateDevice: (deviceId: string, updates: Partial<DeviceInfo>) => void;
    clearDevices: () => void;

    // 동기화 관리
    setSyncEnabled: (enabled: boolean) => void;
    updateLastSyncTime: () => void;
    incrementPendingUpdates: () => void;
    decrementPendingUpdates: () => void;
    resetPendingUpdates: () => void;

    // 원격 상태
    setRemoteViewportState: (state: ViewportState | null) => void;

    // 연결 시작/종료
    onConnected: (roomId: string, deviceId: string, role: DeviceRole) => void;
    onDisconnected: (reason?: string) => void;

    // 리셋
    reset: () => void;
}

// 초기 상태
const initialState: SyncState = {
    transportType: null,
    connectionState: 'disconnected',
    roomId: null,
    deviceId: null,
    role: null,
    connectedDevices: [],
    isSyncEnabled: true,
    lastSyncTime: null,
    pendingUpdates: 0,
    connectionError: null,
    remoteViewportState: null,
};

// Store 생성
export const useSyncStore = create<SyncState & SyncActions>()(
    devtools(
        (set, get) => ({
            // 초기 상태
            ...initialState,

            // ===== 연결 관리 =====
            setTransportType: (type) => {
                set({ transportType: type });
            },

            setConnectionState: (connectionState) => {
                set({ connectionState });
            },

            setRoomId: (roomId) => {
                set({ roomId });
            },

            setDeviceId: (deviceId) => {
                set({ deviceId });
            },

            setRole: (role) => {
                set({ role });
            },

            setConnectionError: (error) => {
                set({
                    connectionError: error,
                    connectionState: error ? 'error' : get().connectionState,
                });
            },

            // ===== 디바이스 관리 =====
            addDevice: (device) => {
                set((state) => {
                    // 중복 체크
                    if (state.connectedDevices.some((d) => d.id === device.id)) {
                        return state;
                    }
                    return {
                        connectedDevices: [...state.connectedDevices, device],
                    };
                });
            },

            removeDevice: (deviceId) => {
                set((state) => ({
                    connectedDevices: state.connectedDevices.filter((d) => d.id !== deviceId),
                }));
            },

            updateDevice: (deviceId, updates) => {
                set((state) => ({
                    connectedDevices: state.connectedDevices.map((d) =>
                        d.id === deviceId ? { ...d, ...updates } : d
                    ),
                }));
            },

            clearDevices: () => {
                set({ connectedDevices: [] });
            },

            // ===== 동기화 관리 =====
            setSyncEnabled: (enabled) => {
                set({ isSyncEnabled: enabled });
            },

            updateLastSyncTime: () => {
                set({ lastSyncTime: Date.now() });
            },

            incrementPendingUpdates: () => {
                set((state) => ({ pendingUpdates: state.pendingUpdates + 1 }));
            },

            decrementPendingUpdates: () => {
                set((state) => ({
                    pendingUpdates: Math.max(0, state.pendingUpdates - 1),
                }));
            },

            resetPendingUpdates: () => {
                set({ pendingUpdates: 0 });
            },

            // ===== 원격 상태 =====
            setRemoteViewportState: (state) => {
                set({ remoteViewportState: state });
            },

            // ===== 연결 시작/종료 =====
            onConnected: (roomId, deviceId, role) => {
                set({
                    connectionState: 'connected',
                    roomId,
                    deviceId,
                    role,
                    connectionError: null,
                });
            },

            onDisconnected: (reason) => {
                set({
                    connectionState: 'disconnected',
                    roomId: null,
                    deviceId: null,
                    role: null,
                    connectedDevices: [],
                    connectionError: reason ?? null,
                    remoteViewportState: null,
                });
            },

            // ===== 리셋 =====
            reset: () => {
                set(initialState);
            },
        }),
        { name: 'SyncStore' }
    )
);

// 선택자
export const selectIsConnected = (state: SyncState) =>
    state.connectionState === 'connected';

export const selectIsMaster = (state: SyncState) =>
    state.role === 'master';

export const selectDeviceCount = (state: SyncState) =>
    state.connectedDevices.length;

export const selectHasRemoteState = (state: SyncState) =>
    state.remoteViewportState !== null;
