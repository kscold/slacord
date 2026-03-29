import type { Message } from '@/src/entities/message/types';
import { showDesktopMessageNotification } from '@/src/shared/lib/desktop-notifications';

export async function notifyIncomingMessage(message: Message, channelLabel: string, currentUserId: string) {
    if (message.authorId === currentUserId) return;
    const author = message.authorName || '새 메시지';
    const body = message.content.trim() || message.attachments.map((item) => item.name).join(', ') || '새 파일이 도착했음';
    // 데스크톱 앱에서는 앱이 포커스 중이어도 알림 전송 (슬랙 동작과 동일)
    const isDesktop = typeof window !== 'undefined' && !!window.slacordDesktop?.isDesktop;
    await showDesktopMessageNotification({ title: `${channelLabel} · ${author}`, body, force: isDesktop });
}
