// FSD: 소켓 싱글톤은 shared(lib) 레이어에 위치. 기존 import 호환을 위해 re-export.
export { getChatSocket, disconnectChatSocket } from '@/lib/socket';
