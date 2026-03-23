import { io, Socket } from 'socket.io-client';
import { socketUrl } from '@/lib/runtime-config';

/** 채팅 Socket.IO 싱글톤 */
let chatSocket: Socket | null = null;

export function getChatSocket(): Socket {
    if (!chatSocket || !chatSocket.connected) {
        const options = {
            path: '/socket.io',
            transports: ['websocket'],
            withCredentials: true,
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
