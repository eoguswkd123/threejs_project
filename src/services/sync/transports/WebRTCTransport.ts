/**
 * WebRTC Transport 구현
 * P2P 직접 통신 (시그널링 서버 필요)
 */

import { BaseTransport } from './BaseTransport';
import type {
    TransportType,
    TransportConfig,
    WebRTCConfig,
    SyncMessage,
    RTCSignalingMessage,
} from '@types/sync';
import { isValidMessage } from '@types/sync';

const DEFAULT_ICE_SERVERS: RTCIceServer[] = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
];

export class WebRTCTransport extends BaseTransport {
    readonly type: TransportType = 'webrtc';

    private peerConnection: RTCPeerConnection | null = null;
    private dataChannel: RTCDataChannel | null = null;
    private signalingSocket: WebSocket | null = null;
    private pendingCandidates: RTCIceCandidate[] = [];
    private isInitiator = false;

    async connect(config: TransportConfig): Promise<void> {
        const rtcConfig = config as WebRTCConfig;

        if (!rtcConfig.signalingServerUrl) {
            throw new Error('WebRTC signalingServerUrl is required');
        }

        this.config = rtcConfig;
        this.isInitiator = rtcConfig.role === 'master';
        this.setConnectionState('connecting');

        try {
            // 1. 시그널링 서버 연결
            await this.connectSignaling(rtcConfig);

            // 2. Peer Connection 설정
            this.setupPeerConnection(rtcConfig);

            // 3. 초기화 (마스터인 경우 오퍼 생성)
            if (this.isInitiator) {
                await this.createAndSendOffer();
            } else {
                // 슬레이브는 ready 신호 전송
                this.sendSignaling({
                    type: 'ready',
                    from: rtcConfig.deviceId,
                    to: '',
                    payload: null,
                });
            }
        } catch (error) {
            this.cleanup();
            throw error;
        }
    }

    async disconnect(): Promise<void> {
        this.cancelReconnect();

        if (this.dataChannel) {
            this.dataChannel.close();
            this.dataChannel = null;
        }

        if (this.peerConnection) {
            this.peerConnection.close();
            this.peerConnection = null;
        }

        if (this.signalingSocket) {
            this.signalingSocket.close();
            this.signalingSocket = null;
        }

        this.cleanup();
    }

    protected async doSend(message: SyncMessage): Promise<void> {
        if (!this.dataChannel || this.dataChannel.readyState !== 'open') {
            throw new Error('DataChannel is not open');
        }

        this.dataChannel.send(JSON.stringify(message));
    }

    // 시그널링 서버 연결
    private connectSignaling(config: WebRTCConfig): Promise<void> {
        return new Promise((resolve, reject) => {
            const url = new URL(config.signalingServerUrl);
            url.searchParams.set('roomId', config.roomId);
            url.searchParams.set('deviceId', config.deviceId);

            this.signalingSocket = new WebSocket(url.toString());

            this.signalingSocket.onopen = () => resolve();
            this.signalingSocket.onerror = () => reject(new Error('Signaling connection failed'));

            this.signalingSocket.onmessage = (event) => {
                const message = JSON.parse(event.data) as RTCSignalingMessage;
                this.handleSignalingMessage(message);
            };

            this.signalingSocket.onclose = () => {
                if (this._connectionState !== 'disconnected') {
                    this.scheduleReconnect();
                }
            };
        });
    }

    // PeerConnection 설정
    private setupPeerConnection(config: WebRTCConfig): void {
        const iceServers = config.iceServers ?? DEFAULT_ICE_SERVERS;

        this.peerConnection = new RTCPeerConnection({
            iceServers,
        });

        // ICE 후보 수집
        this.peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
                this.sendSignaling({
                    type: 'candidate',
                    from: config.deviceId,
                    to: '',
                    payload: event.candidate.toJSON(),
                });
            }
        };

        // 연결 상태 변경
        this.peerConnection.onconnectionstatechange = () => {
            switch (this.peerConnection?.connectionState) {
                case 'connected':
                    this.setConnectionState('connected');
                    break;
                case 'disconnected':
                case 'failed':
                    this.scheduleReconnect();
                    break;
            }
        };

        // 데이터 채널 (마스터가 생성)
        if (this.isInitiator) {
            this.dataChannel = this.peerConnection.createDataChannel('sync', config.dataChannelOptions);
            this.setupDataChannel();
        } else {
            this.peerConnection.ondatachannel = (event) => {
                this.dataChannel = event.channel;
                this.setupDataChannel();
            };
        }
    }

    // 데이터 채널 설정
    private setupDataChannel(): void {
        if (!this.dataChannel) return;

        this.dataChannel.onopen = () => {
            this.setConnectionState('connected');
            this.flushPendingCandidates();
        };

        this.dataChannel.onclose = () => {
            if (this._connectionState === 'connected') {
                this.scheduleReconnect();
            }
        };

        this.dataChannel.onmessage = (event) => {
            try {
                const message = JSON.parse(event.data);
                if (isValidMessage(message)) {
                    if (message.senderId !== this.config?.deviceId) {
                        this.handleMessage(message);
                    }
                }
            } catch (error) {
                console.error('Failed to parse DataChannel message:', error);
            }
        };
    }

    // 오퍼 생성 및 전송
    private async createAndSendOffer(): Promise<void> {
        if (!this.peerConnection) return;

        const offer = await this.peerConnection.createOffer();
        await this.peerConnection.setLocalDescription(offer);

        this.sendSignaling({
            type: 'offer',
            from: this.config!.deviceId,
            to: '',
            payload: offer,
        });
    }

    // 시그널링 메시지 처리
    private async handleSignalingMessage(message: RTCSignalingMessage): Promise<void> {
        if (!this.peerConnection) return;

        switch (message.type) {
            case 'ready':
                // 슬레이브가 준비됨 - 오퍼 전송
                if (this.isInitiator) {
                    await this.createAndSendOffer();
                }
                break;

            case 'offer':
                if (!this.isInitiator) {
                    await this.peerConnection.setRemoteDescription(
                        message.payload as RTCSessionDescriptionInit
                    );
                    const answer = await this.peerConnection.createAnswer();
                    await this.peerConnection.setLocalDescription(answer);

                    this.sendSignaling({
                        type: 'answer',
                        from: this.config!.deviceId,
                        to: message.from,
                        payload: answer,
                    });
                }
                break;

            case 'answer':
                if (this.isInitiator) {
                    await this.peerConnection.setRemoteDescription(
                        message.payload as RTCSessionDescriptionInit
                    );
                }
                break;

            case 'candidate':
                const candidate = new RTCIceCandidate(message.payload as RTCIceCandidateInit);
                if (this.peerConnection.remoteDescription) {
                    await this.peerConnection.addIceCandidate(candidate);
                } else {
                    this.pendingCandidates.push(candidate);
                }
                break;
        }
    }

    // 시그널링 메시지 전송
    private sendSignaling(message: RTCSignalingMessage): void {
        if (this.signalingSocket?.readyState === WebSocket.OPEN) {
            this.signalingSocket.send(JSON.stringify(message));
        }
    }

    // 대기 중인 ICE 후보 처리
    private async flushPendingCandidates(): Promise<void> {
        for (const candidate of this.pendingCandidates) {
            await this.peerConnection?.addIceCandidate(candidate);
        }
        this.pendingCandidates = [];
    }

    // 정리 오버라이드
    protected cleanup(): void {
        this.pendingCandidates = [];
        super.cleanup();
    }
}
