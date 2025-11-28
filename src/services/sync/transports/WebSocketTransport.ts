/**
 * WebSocket Transport 구현
 * 서버를 통한 중앙 집중식 통신
 */

import { BaseTransport } from './BaseTransport';
import type {
    TransportType,
    TransportConfig,
    WebSocketConfig,
    SyncMessage,
} from '@types/sync';
import { isValidMessage } from '@types/sync';

export class WebSocketTransport extends BaseTransport {
    readonly type: TransportType = 'websocket';

    private socket: WebSocket | null = null;
    private pingInterval: ReturnType<typeof setInterval> | null = null;
    private pendingMessages: SyncMessage[] = [];

    async connect(config: TransportConfig): Promise<void> {
        const wsConfig = config as WebSocketConfig;

        if (!wsConfig.serverUrl) {
            throw new Error('WebSocket serverUrl is required');
        }

        this.config = wsConfig;
        this.setConnectionState('connecting');

        return new Promise((resolve, reject) => {
            try {
                // 연결 URL 구성
                const url = new URL(wsConfig.serverUrl!);
                url.searchParams.set('roomId', wsConfig.roomId);
                url.searchParams.set('deviceId', wsConfig.deviceId);
                url.searchParams.set('role', wsConfig.role);

                this.socket = new WebSocket(url.toString(), wsConfig.protocols);

                this.socket.onopen = () => {
                    this.setConnectionState('connected');
                    this.startPing(wsConfig.pingInterval ?? 30000);
                    this.flushPendingMessages();
                    resolve();
                };

                this.socket.onclose = (event) => {
                    this.cleanup();
                    if (!event.wasClean) {
                        this.scheduleReconnect();
                    }
                };

                this.socket.onerror = () => {
                    if (this._connectionState === 'connecting') {
                        reject(new Error('WebSocket connection failed'));
                    }
                };

                this.socket.onmessage = (event) => {
                    this.handleRawMessage(event.data);
                };
            } catch (error) {
                this.setConnectionState('error');
                reject(error);
            }
        });
    }

    async disconnect(): Promise<void> {
        this.cancelReconnect();
        this.stopPing();

        if (this.socket) {
            this.socket.close(1000, 'Client disconnect');
            this.socket = null;
        }

        this.cleanup();
    }

    protected async doSend(message: SyncMessage): Promise<void> {
        if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
            // 연결 대기 중이면 메시지 큐에 추가
            if (this._connectionState === 'connecting') {
                this.pendingMessages.push(message);
                return;
            }
            throw new Error('WebSocket is not open');
        }

        this.socket.send(JSON.stringify(message));
    }

    // 원시 메시지 처리
    private handleRawMessage(data: string): void {
        try {
            const message = JSON.parse(data);

            if (isValidMessage(message)) {
                // 자신의 메시지 무시
                if (message.senderId === this.config?.deviceId) {
                    return;
                }
                this.handleMessage(message);
            }
        } catch (error) {
            console.error('Failed to parse WebSocket message:', error);
        }
    }

    // Ping 시작
    private startPing(interval: number): void {
        this.pingInterval = setInterval(() => {
            if (this.socket?.readyState === WebSocket.OPEN) {
                this.socket.send(JSON.stringify({ type: 'ping' }));
            }
        }, interval);
    }

    // Ping 중지
    private stopPing(): void {
        if (this.pingInterval) {
            clearInterval(this.pingInterval);
            this.pingInterval = null;
        }
    }

    // 대기 중인 메시지 전송
    private flushPendingMessages(): void {
        while (this.pendingMessages.length > 0) {
            const message = this.pendingMessages.shift();
            if (message) {
                this.doSend(message).catch(console.error);
            }
        }
    }

    // 정리 오버라이드
    protected cleanup(): void {
        this.stopPing();
        this.pendingMessages = [];
        super.cleanup();
    }
}
