'use client';

import { MessageActionBar } from './MessageActionBar';
import { MessageAuthorMeta } from './MessageAuthorMeta';
import { MessageActionToggle } from './MessageActionToggle';
import { MessageBodyContent } from './MessageBodyContent';
import { SystemMessageItem } from './SystemMessageItem';
import { getAvatarColor } from '@/src/shared/lib/avatar';
import type { Message } from '@/src/entities/message/types';
import { useMessageActionMenu } from '../model/useMessageActionMenu';
import { useMessageItemEditor } from '../model/useMessageItemEditor';

interface Props {
    message: Message;
    currentUserId: string;
    onReact: (messageId: string, emoji: string) => void;
    onDelete?: (messageId: string) => void;
    onEdit?: (messageId: string, content: string) => Promise<void>;
    onOpenThread?: (message: Message) => void;
    onTogglePin?: (message: Message) => Promise<unknown>;
}

export function MessageItem({ message, currentUserId, onReact, onDelete, onEdit, onOpenThread, onTogglePin }: Props) {
    const time = new Date(message.createdAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
    const isOwn = message.authorId === currentUserId;
    const authorLabel = message.authorName || message.authorId.slice(-6);
    const { cancelEdit, editContent, editRef, editing, setEditContent, setEditing, startEdit } = useMessageItemEditor(message.content);
    const { closeMenu, containerRef, open, openMenu, supportsHover, toggleMenu } = useMessageActionMenu();

    const saveEdit = async () => {
        const trimmed = editContent.trim();
        if (!trimmed || trimmed === message.content || !onEdit) return;
        await onEdit(message.id, trimmed);
        setEditing(false);
    };

    const handleEditKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Escape') { cancelEdit(); return; }
        if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
            e.preventDefault();
            void saveEdit();
        }
    };

    if (message.type === 'system') return <SystemMessageItem message={message} />;

    return (
        <div
            ref={containerRef}
            onMouseEnter={supportsHover ? openMenu : undefined}
            onMouseLeave={supportsHover ? closeMenu : undefined}
            className={`relative flex items-start gap-3 px-5 py-1.5 transition-colors ${editing ? 'bg-white/[0.04]' : 'hover:bg-white/[0.03]'}`}
        >
            <div
                className="w-9 h-9 rounded-full flex items-center justify-center text-white text-[13px] font-semibold shrink-0 select-none"
                style={{ backgroundColor: getAvatarColor(message.authorId) }}
            >
                {authorLabel.slice(0, 1).toUpperCase()}
            </div>

            <div className="min-w-0 flex-1 pt-[1px]">
                <MessageAuthorMeta authorLabel={authorLabel} time={time} isEdited={message.isEdited} isPinned={message.isPinned} />
                <MessageBodyContent
                    currentUserId={currentUserId}
                    editRef={editRef}
                    editing={editing}
                    editValue={editContent}
                    message={message}
                    onChangeEdit={setEditContent}
                    onEditKeyDown={handleEditKeyDown}
                    onOpenThread={onOpenThread}
                    onReact={(emoji) => onReact(message.id, emoji)}
                />
            </div>
            <div className="shrink-0 pt-1 sm:hidden">
                <MessageActionToggle onClick={toggleMenu} />
            </div>

            {!editing ? (
                <MessageActionBar
                    isOwn={isOwn}
                    message={message}
                    onDelete={onDelete}
                    onEdit={onEdit ? () => { startEdit(); closeMenu(); } : undefined}
                    onOpenThread={onOpenThread && !message.replyToId ? () => onOpenThread(message) : undefined}
                    onReact={(emoji) => onReact(message.id, emoji)}
                    onTogglePin={onTogglePin ? () => void onTogglePin(message) : undefined}
                    visible={open}
                />
            ) : null}
        </div>
    );
}
