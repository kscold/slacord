import type { Message } from '@/src/entities/message/types';
import { showDesktopMessageNotification } from '@/src/shared/lib/desktop-notifications';

export async function notifyIncomingMessage(message: Message, channelLabel: string, currentUserId: string) {
    if (message.authorId === currentUserId) return;
    const author = message.authorName || '새 메시지';
    const body = message.content.trim() || message.attachments.map((item) => item.name).join(', ') || '새 파일이 도착했음';
    await showDesktopMessageNotification({ title: `${channelLabel} · ${author}`, body });
}
