import { io, Socket } from 'socket.io-client';

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8082';

/** 채팅 Socket.IO 싱글톤 */
let chatSocket: Socket | null = null;

export function getChatSocket(token: string): Socket {
    if (!chatSocket || !chatSocket.connected) {
        chatSocket = io(SOCKET_URL, {
            path: '/socket.io',
            auth: { token },
            transports: ['websocket'],
        });
    }
    return chatSocket;
}

export function disconnectChatSocket() {
    chatSocket?.disconnect();
    chatSocket = null;
}
