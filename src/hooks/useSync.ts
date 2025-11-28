/**
 * 동기화 관리 훅
 * SyncEngine 연결 및 상태 관리
 */

import { useCallback, useEffect, useRef } from 'react';
import { useSyncStore, useViewerStore, selectIsConnected } from '@stores';
import { getSyncEngine, resetSyncEngine } from '@services/sync';
import type { TransportConfig, TransportType, DeviceRole, ViewportState } from '@types/sync';

interface UseSyncOptions {
    autoConnect?: boolean;
    serverUrl?: string;
    signalingServerUrl?: string;
    onStateChange?: (state: Partial<ViewportState>) => void;
}

export function useSync(options: UseSyncOptions = {}) {
    const { autoConnect = false, onStateChange } = options;

    // Store 상태
    const isConnected = useSyncStore(selectIsConnected);
    const connectionState = useSyncStore((state) => state.connectionState);
    const roomId = useSyncStore((state) => state.roomId);
    const deviceId = useSyncStore((state) => state.deviceId);
    const role = useSyncStore((state) => state.role);
    const connectedDevices = useSyncStore((state) => state.connectedDevices);
    const isSyncEnabled = useSyncStore((state) => state.isSyncEnabled);
    const setSyncEnabled = useSyncStore((state) => state.setSyncEnabled);

    // Viewer 상태
    const camera = useViewerStore((state) => state.camera);
    const selection = useViewerStore((state) => state.selection);
    const setCamera = useViewerStore((state) => state.setCamera);
    const selectEntities = useViewerStore((state) => state.selectEntities);

    // 상태 변경 핸들러 참조
    const stateChangeRef = useRef(onStateChange);
    stateChangeRef.current = onStateChange;

    // 연결
    const connect = useCallback(
        async (config: {
            transportType: TransportType;
            roomId: string;
            role: DeviceRole;
            deviceId?: string;
        }) => {
            const engine = getSyncEngine();

            const transportConfig: TransportConfig = {
                type: config.transportType,
                roomId: config.roomId,
                deviceId: config.deviceId ?? crypto.randomUUID(),
                role: config.role,
                serverUrl:
                    config.transportType === 'websocket'
                        ? options.serverUrl ?? 'ws://localhost:8080/sync'
                        : undefined,
            };

            // WebRTC인 경우 시그널링 서버 URL 추가
            if (config.transportType === 'webrtc') {
                (transportConfig as any).signalingServerUrl =
                    options.signalingServerUrl ?? 'ws://localhost:8080/signaling';
            }

            await engine.connect(transportConfig);

            // 상태 변경 핸들러 등록
            engine.onStateUpdate((state) => {
                stateChangeRef.current?.(state);

                // 슬레이브인 경우 원격 상태 적용
                if (role === 'slave') {
                    if (state.camera) {
                        setCamera(state.camera);
                    }
                    if (state.selection) {
                        selectEntities(state.selection.selectedIds);
                    }
                }
            });
        },
        [options.serverUrl, options.signalingServerUrl, role, setCamera, selectEntities]
    );

    // 연결 해제
    const disconnect = useCallback(async () => {
        resetSyncEngine();
    }, []);

    // 카메라 동기화
    const syncCamera = useCallback(async () => {
        if (!isConnected || !isSyncEnabled) return;
        const engine = getSyncEngine();
        await engine.syncCamera(camera);
    }, [isConnected, isSyncEnabled, camera]);

    // 선택 동기화
    const syncSelection = useCallback(async () => {
        if (!isConnected || !isSyncEnabled) return;
        const engine = getSyncEngine();
        await engine.syncSelection(selection);
    }, [isConnected, isSyncEnabled, selection]);

    // 전체 상태 요청
    const requestFullSync = useCallback(async () => {
        if (!isConnected) return;
        const engine = getSyncEngine();
        await engine.requestSync(['camera', 'selection', 'visibility']);
    }, [isConnected]);

    // 카메라 변경 시 자동 동기화
    useEffect(() => {
        if (isConnected && isSyncEnabled && role === 'master') {
            const timeoutId = setTimeout(syncCamera, 100);
            return () => clearTimeout(timeoutId);
        }
    }, [camera, isConnected, isSyncEnabled, role, syncCamera]);

    // 선택 변경 시 자동 동기화
    useEffect(() => {
        if (isConnected && isSyncEnabled && role === 'master') {
            syncSelection();
        }
    }, [selection, isConnected, isSyncEnabled, role, syncSelection]);

    // 자동 연결
    useEffect(() => {
        if (autoConnect && !isConnected && options.serverUrl) {
            // 자동 연결 로직 (필요시 구현)
        }
    }, [autoConnect, isConnected, options.serverUrl]);

    // 정리
    useEffect(() => {
        return () => {
            disconnect();
        };
    }, [disconnect]);

    return {
        // 상태
        isConnected,
        connectionState,
        roomId,
        deviceId,
        role,
        connectedDevices,
        deviceCount: connectedDevices.length,
        isSyncEnabled,

        // 액션
        connect,
        disconnect,
        setSyncEnabled,
        syncCamera,
        syncSelection,
        requestFullSync,
    };
}
