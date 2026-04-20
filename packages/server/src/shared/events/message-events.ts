/**
 * 메시지 채널 브로드캐스트 도메인 이벤트.
 *
 * HTTP 컨트롤러가 MessageGateway의 emit 메서드를 직접 호출하는 결합을 끊기 위해
 * 이벤트만 발행하고, MessageBroadcastListener(gateway 측)가 수신해서 WS로 발신.
 *
 * 장점:
 * - HTTP 레이어가 WebSocket 인프라를 몰라도 됨
 * - 새로운 adapter(예: Redis pub/sub, GraphQL subscription)가 같은 이벤트를 구독할 수 있음
 */

export const MESSAGE_EVENTS = {
    PINNED: 'message.pinned',
    DELETED: 'message.deleted',
    BROADCASTED: 'message.broadcasted',
} as const;

export interface MessagePinnedEvent {
    channelId: string;
    message: Record<string, unknown>;
}

export interface MessageDeletedEvent {
    channelId: string;
    messageId: string;
}

/** HTTP 경로로 생성된 메시지(예: GitHub webhook)를 소켓 룸에 브로드캐스트 */
export interface MessageBroadcastedEvent {
    channelId: string;
    message: Record<string, unknown>;
}
