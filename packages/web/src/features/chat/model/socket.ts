import { io, Socket } from 'socket.io-client';
import { socketUrl } from '@/lib/runtime-config';

/** 채팅 Socket.IO 싱글톤 */
let chatSocket: Socket | null = null;

export function getChatSocket(token: string): Socket {
    if (!chatSocket || !chatSocket.connected) {
        const options = {
            path: '/socket.io',
            auth: { token },
            transports: ['websocket'],
        };
        chatSocket = socketUrl() ? io(socketUrl(), options) : io(options);
    }
    return chatSocket;
}

export function disconnectChatSocket() {
    chatSocket?.disconnect();
    chatSocket = null;
}
