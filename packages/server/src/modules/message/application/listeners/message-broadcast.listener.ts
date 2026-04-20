import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { MessageGateway } from '../../infrastructure/websocket/message.gateway';
import {
    MESSAGE_EVENTS,
    type MessageBroadcastedEvent,
    type MessageDeletedEvent,
    type MessagePinnedEvent,
} from '../../../../shared/events/message-events';

/**
 * 도메인 이벤트 → WebSocket emit 브리지.
 * HTTP 컨트롤러가 gateway를 직접 import하지 않아도 되도록 중간층 역할.
 */
@Injectable()
export class MessageBroadcastListener {
    constructor(private readonly gateway: MessageGateway) {}

    @OnEvent(MESSAGE_EVENTS.BROADCASTED)
    handleBroadcasted(event: MessageBroadcastedEvent): void {
        this.gateway.emitNewMessage(event.channelId, event.message);
    }

    @OnEvent(MESSAGE_EVENTS.DELETED)
    handleDeleted(event: MessageDeletedEvent): void {
        this.gateway.emitMessageDeleted(event.channelId, event.messageId);
    }

    @OnEvent(MESSAGE_EVENTS.PINNED)
    handlePinned(event: MessagePinnedEvent): void {
        this.gateway.emitPinnedUpdated(event.channelId, event.message);
    }
}
