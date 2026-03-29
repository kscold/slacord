'use client';

import { use, useMemo, useState } from 'react';
import { useChannelRoom } from '@/src/features/chat/model/useChannelRoom';
import { useChatStore } from '@/src/features/chat/model/chat.store';
import { useHuddle } from '@/src/features/huddle/model/useHuddle';
import { ChannelHeader } from '@/src/features/chat/ui/ChannelHeader';
import { MessageList } from '@/src/features/chat/ui/MessageList';
import { MessageInput } from '@/src/features/chat/ui/MessageInput';
import { PinnedMessagesPanel } from '@/src/features/chat/ui/PinnedMessagesPanel';
import { ThreadPanel } from '@/src/features/chat/ui/ThreadPanel';
import { HuddlePanel } from '@/src/features/huddle/ui/HuddlePanel';

interface Props {
    params: Promise<{ teamId: string; channelId: string }>;
}

export default function ChannelPage({ params }: Props) {
    const { teamId, channelId } = use(params);
    const room = useChannelRoom(teamId, channelId);
    const messages = useChatStore((state) => state.messages);
    const [threadMessageId, setThreadMessageId] = useState<string | null>(null);
    const [showPins, setShowPins] = useState(false);
    const threadMessage = useMemo(() => messages.find((message) => message.id === threadMessageId) ?? null, [messages, threadMessageId]);

    const huddle = useHuddle(room.currentUserId);
    const huddleActive = huddle.activeChannelId === channelId;

    const handleStartHuddle = () => {
        if (huddleActive) {
            huddle.leaveHuddle();
        } else {
            huddle.joinHuddle(channelId);
        }
    };

    return (
        <div className="flex flex-col h-full">
            <ChannelHeader
                channelName={room.channelLabel}
                channelType={room.channel?.type}
                onOpenPins={() => setShowPins(true)}
                onStartHuddle={handleStartHuddle}
                huddleActive={huddleActive}
            />
            <div className="flex min-h-0 flex-1">
                <div className="flex min-h-0 flex-1 flex-col">
                    <MessageList
                        currentUserId={room.currentUserId}
                        onReact={room.reactToMessage}
                        onDelete={room.deleteMessage}
                        onEdit={room.editMessage}
                        onOpenThread={(message) => setThreadMessageId(message.id)}
                        onTogglePin={room.togglePinMessage}
                    />
                    <MessageInput
                        channelName={room.channelLabel}
                        members={room.members}
                        onSend={(content) => room.sendMessage(content)}
                        onUpload={(files, content) => room.sendAttachments(files, content)}
                        onTyping={room.sendTyping}
                        isUploading={room.isUploading}
                    />
                </div>
                {showPins && (
                    <PinnedMessagesPanel
                        channelId={channelId}
                        onClose={() => setShowPins(false)}
                        onOpenThread={(message) => setThreadMessageId(message.id)}
                        onTogglePin={room.togglePinMessage}
                    />
                )}
                {threadMessage && (
                    <ThreadPanel
                        channelId={channelId}
                        parentMessage={threadMessage}
                        currentUserId={room.currentUserId}
                        onClose={() => setThreadMessageId(null)}
                        onSendReply={room.sendMessage}
                        onUploadReply={room.sendAttachments}
                        onDelete={room.deleteMessage}
                        isUploading={room.isUploading}
                    />
                )}
            </div>
            {/* 허들 패널 - 하단 고정 (슬랙처럼) */}
            {room.currentUserId && (
                <HuddlePanel currentUserId={room.currentUserId} currentUsername={room.channelLabel} channelName={room.channelLabel} />
            )}
        </div>
    );
}
