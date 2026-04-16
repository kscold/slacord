'use client';

import { use, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useChannelRoom } from '@/src/features/chat/model/useChannelRoom';
import { useChatStore } from '@/src/features/chat/model/chat.store';
import { readChannelViewportAnchor, writeChannelViewportAnchor } from '@/src/features/chat/model/channelViewportAnchor';
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

type RestoreTarget = { createdAt: string; kind: 'message'; messageId: string } | { after: string; kind: 'unread' };

export default function ChannelPage({ params }: Props) {
    const { teamId, channelId } = use(params);
    const searchParams = useSearchParams();
    const room = useChannelRoom(teamId, channelId);
    const messages = useChatStore((state) => state.messages);
    const [threadMessageId, setThreadMessageId] = useState<string | null>(null);
    const [showPins, setShowPins] = useState(false);
    const threadMessage = useMemo(
        () => messages.find((message) => message.id === threadMessageId) ?? null,
        [messages, threadMessageId],
    );
    const targetMessageId = searchParams.get('message');
    const targetMessageAt = searchParams.get('at');
    const [restoreTarget, setRestoreTarget] = useState<RestoreTarget | null>(null);
    const [highlightMessageId, setHighlightMessageId] = useState<string | null>(targetMessageId);
    const persistAnchorRef = useRef(false);
    const restoreInitializedRef = useRef(false);

    const huddle = useHuddle(room.currentUserId);
    const huddleActive = huddle.activeChannelId === channelId;

    const handleStartHuddle = () => {
        if (huddleActive) {
            huddle.leaveHuddle();
        } else {
            huddle.joinHuddle(channelId);
        }
    };

    useEffect(() => {
        persistAnchorRef.current = false;
        restoreInitializedRef.current = false;
        setRestoreTarget(null);
        setHighlightMessageId(targetMessageId);
    }, [channelId, targetMessageId]);

    useEffect(() => {
        if (restoreInitializedRef.current) return;

        if (targetMessageId && targetMessageAt) {
            restoreInitializedRef.current = true;
            setRestoreTarget({
                kind: 'message',
                messageId: targetMessageId,
                createdAt: targetMessageAt,
            });
            return;
        }

        if (!room.channel) return;

        restoreInitializedRef.current = true;

        if ((room.channel.unreadCount ?? 0) > 0 && room.channel.lastReadAt) {
            setRestoreTarget({
                kind: 'unread',
                after: room.channel.lastReadAt,
            });
            return;
        }

        const storedAnchor = readChannelViewportAnchor(teamId, channelId);
        if (storedAnchor) {
            setRestoreTarget({
                kind: 'message',
                messageId: storedAnchor.messageId,
                createdAt: storedAnchor.createdAt,
            });
            return;
        }

        persistAnchorRef.current = true;
    }, [channelId, room.channel, targetMessageAt, targetMessageId, teamId]);

    useEffect(() => {
        if (!restoreTarget) return;

        const oldestMessage = messages[0];

        if (restoreTarget.kind === 'message') {
            if (messages.some((message) => message.id === restoreTarget.messageId)) {
                setHighlightMessageId(restoreTarget.messageId);
                persistAnchorRef.current = true;
                return;
            }

            if (!oldestMessage?.createdAt || room.isLoadingOlder || !room.hasOlderMessages) return;
            if (new Date(oldestMessage.createdAt).getTime() > new Date(restoreTarget.createdAt).getTime()) {
                void room.loadOlderMessages();
                return;
            }

            persistAnchorRef.current = true;
            setRestoreTarget(null);
            return;
        }

        const unreadAnchor = messages.find(
            (message) =>
                !message.replyToId && new Date(message.createdAt).getTime() > new Date(restoreTarget.after).getTime(),
        );

        if (unreadAnchor) {
            setHighlightMessageId(unreadAnchor.id);
            persistAnchorRef.current = true;
            return;
        }

        if (!oldestMessage?.createdAt || room.isLoadingOlder || !room.hasOlderMessages) return;
        if (new Date(oldestMessage.createdAt).getTime() > new Date(restoreTarget.after).getTime()) {
            void room.loadOlderMessages();
            return;
        }

        persistAnchorRef.current = true;
        setRestoreTarget(null);
    }, [messages, restoreTarget, room.hasOlderMessages, room.isLoadingOlder, room.loadOlderMessages]);

    return (
        <div className="flex flex-col h-full">
            <ChannelHeader
                canStartHuddle={room.canWrite}
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
                        hasOlderMessages={room.hasOlderMessages}
                        highlightMessageId={highlightMessageId}
                        isLoadingOlder={room.isLoadingOlder}
                        onLoadOlder={room.loadOlderMessages}
                        onViewportAnchorChange={(anchor) => {
                            if (!persistAnchorRef.current) return;
                            writeChannelViewportAnchor(teamId, channelId, anchor);
                        }}
                        onReact={room.reactToMessage}
                        onDelete={room.deleteMessage}
                        onEdit={room.editMessage}
                        onOpenThread={(message) => setThreadMessageId(message.id)}
                        onTogglePin={room.togglePinMessage}
                    />
                    <MessageInput
                        channelName={room.channelLabel}
                        members={room.members}
                        readOnly={!room.canWrite}
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
                        canWrite={room.canWrite}
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
            {room.currentUserId && (
                <HuddlePanel
                    activeChannelId={huddle.activeChannelId}
                    participants={huddle.participants}
                    localStream={huddle.localStream}
                    localAudio={huddle.localAudio}
                    localVideo={huddle.localVideo}
                    sharingScreen={huddle.sharingScreen}
                    error={huddle.error}
                    clearError={huddle.clearError}
                    leaveHuddle={huddle.leaveHuddle}
                    toggleAudio={huddle.toggleAudio}
                    toggleVideo={huddle.toggleVideo}
                    toggleScreenShare={huddle.toggleScreenShare}
                    currentUsername={room.currentUsername || room.channelLabel}
                    channelName={room.channelLabel}
                />
            )}
        </div>
    );
}
