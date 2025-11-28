/**
 * Transport 기본 클래스
 * WebSocket과 WebRTC Transport의 공통 로직
 */

import type {
    Transport,
    TransportType,
    TransportConfig,
    ConnectionState,
    SyncMessage,
    MessageHandler,
    ConnectionHandler,
    Unsubscribe,
} from '@types/sync';

export abstract class BaseTransport implements Transport {
    abstract readonly type: TransportType;

    protected _connectionState: ConnectionState = 'disconnected';
    protected config: TransportConfig | null = null;
    protected messageHandlers: Set<MessageHandler> = new Set();
    protected connectionHandlers: Set<ConnectionHandler> = new Set();
    protected sequenceNumber = 0;
    protected reconnectAttempts = 0;
    protected reconnectTimer: ReturnType<typeof setTimeout> | null = null;

    get isConnected(): boolean {
        return this._connectionState === 'connected';
    }

    get connectionState(): ConnectionState {
        return this._connectionState;
    }

    // 자식 클래스에서 구현
    abstract connect(config: TransportConfig): Promise<void>;
    abstract disconnect(): Promise<void>;
    protected abstract doSend(message: SyncMessage): Promise<void>;

    async send(message: SyncMessage): Promise<void> {
        if (!this.isConnected) {
            throw new Error('Not connected');
        }
        await this.doSend(message);
    }

    onMessage(handler: MessageHandler): Unsubscribe {
        this.messageHandlers.add(handler);
        return () => this.messageHandlers.delete(handler);
    }

    onConnectionChange(handler: ConnectionHandler): Unsubscribe {
        this.connectionHandlers.add(handler);
        // 즉시 현재 상태 전달
        handler(this._connectionState);
        return () => this.connectionHandlers.delete(handler);
    }

    // 상태 변경 알림
    protected setConnectionState(state: ConnectionState): void {
        if (this._connectionState !== state) {
            this._connectionState = state;
            this.connectionHandlers.forEach((handler) => handler(state));
        }
    }

    // 메시지 수신 처리
    protected handleMessage(message: SyncMessage): void {
        this.messageHandlers.forEach((handler) => handler(message));
    }

    // 재연결 시도
    protected scheduleReconnect(): void {
        if (!this.config) return;

        const maxAttempts = this.config.reconnectAttempts ?? 5;
        const interval = this.config.reconnectInterval ?? 3000;

        if (this.reconnectAttempts >= maxAttempts) {
            this.setConnectionState('error');
            return;
        }

        this.setConnectionState('reconnecting');
        this.reconnectTimer = setTimeout(async () => {
            this.reconnectAttempts++;
            try {
                await this.connect(this.config!);
                this.reconnectAttempts = 0;
            } catch {
                this.scheduleReconnect();
            }
        }, interval);
    }

    // 재연결 취소
    protected cancelReconnect(): void {
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = null;
        }
        this.reconnectAttempts = 0;
    }

    // 시퀀스 번호 생성
    protected getNextSequenceNumber(): number {
        return ++this.sequenceNumber;
    }

    // 정리
    protected cleanup(): void {
        this.cancelReconnect();
        this.setConnectionState('disconnected');
    }
}
