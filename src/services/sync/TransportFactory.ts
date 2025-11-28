/**
 * Transport Factory
 * 설정에 따라 적절한 Transport 인스턴스 생성
 */

import type { Transport, TransportType, TransportConfig } from '@types/sync';
import { WebSocketTransport } from './transports/WebSocketTransport';
import { WebRTCTransport } from './transports/WebRTCTransport';

export class TransportFactory {
    private static instance: TransportFactory;
    private transports: Map<string, Transport> = new Map();

    private constructor() {}

    static getInstance(): TransportFactory {
        if (!TransportFactory.instance) {
            TransportFactory.instance = new TransportFactory();
        }
        return TransportFactory.instance;
    }

    /**
     * Transport 생성
     */
    create(type: TransportType): Transport {
        switch (type) {
            case 'websocket':
                return new WebSocketTransport();
            case 'webrtc':
                return new WebRTCTransport();
            default:
                throw new Error(`Unknown transport type: ${type}`);
        }
    }

    /**
     * Transport 가져오기 (캐싱)
     */
    get(id: string, type: TransportType): Transport {
        if (!this.transports.has(id)) {
            this.transports.set(id, this.create(type));
        }
        return this.transports.get(id)!;
    }

    /**
     * Transport 제거
     */
    async remove(id: string): Promise<void> {
        const transport = this.transports.get(id);
        if (transport) {
            await transport.disconnect();
            this.transports.delete(id);
        }
    }

    /**
     * 모든 Transport 정리
     */
    async cleanup(): Promise<void> {
        const promises = Array.from(this.transports.values()).map((t) => t.disconnect());
        await Promise.all(promises);
        this.transports.clear();
    }

    /**
     * 최적의 Transport 타입 추천
     */
    static recommendTransport(config: {
        deviceCount: number;
        requiresServer: boolean;
        latencyPriority: boolean;
    }): TransportType {
        // P2P가 적합한 경우
        if (
            config.deviceCount === 2 &&
            !config.requiresServer &&
            config.latencyPriority
        ) {
            return 'webrtc';
        }

        // 기본적으로 WebSocket 사용
        return 'websocket';
    }
}

// 싱글톤 내보내기
export const transportFactory = TransportFactory.getInstance();
