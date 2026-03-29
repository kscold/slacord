import { io, Socket } from 'socket.io-client';
import { socketUrl } from './runtime-config';

/** 채팅 Socket.IO 싱글톤 */
let chatSocket: Socket | null = null;

export function getChatSocket(): Socket {
    if (!chatSocket) {
        const options = {
            path: '/socket.io',
            transports: ['websocket'] as string[],
            withCredentials: true,
            reconnection: true,
        };
        const endpoint = socketUrl();
        chatSocket = endpoint ? io(`${endpoint}/chat`, options) : io('/chat', options);
    }
    return chatSocket;
}

export function disconnectChatSocket() {
    chatSocket?.disconnect();
    chatSocket = null;
}
