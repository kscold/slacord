'use client';

import { use, useMemo, useState } from 'react';
import { useChannelRoom } from '@/src/features/chat/model/useChannelRoom';
import { useChatStore } from '@/src/features/chat/model/chat.store';
import { ChannelHeader } from '@/src/features/chat/ui/ChannelHeader';
import { MessageList } from '@/src/features/chat/ui/MessageList';
import { MessageInput } from '@/src/features/chat/ui/MessageInput';
import { PinnedMessagesPanel } from '@/src/features/chat/ui/PinnedMessagesPanel';
import { ThreadPanel } from '@/src/features/chat/ui/ThreadPanel';

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

    return (
        <div className="flex flex-col h-full">
            <ChannelHeader channelName={room.channelLabel} channelType={room.channel?.type} onOpenPins={() => setShowPins(true)} />
            <div className="flex min-h-0 flex-1">
                <div className="flex min-h-0 flex-1 flex-col">
                    <MessageList
                        currentUserId={room.currentUserId}
                        onReact={room.reactToMessage}
                        onDelete={room.deleteMessage}
                        onOpenThread={(message) => setThreadMessageId(message.id)}
                        onTogglePin={room.togglePinMessage}
                    />
                    <MessageInput
                        channelName={room.channelLabel}
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
                        onClose={() => setThreadMessageId(null)}
                        onSendReply={room.sendMessage}
                        onUploadReply={room.sendAttachments}
                        isUploading={room.isUploading}
                    />
                )}
            </div>
        </div>
    );
}
