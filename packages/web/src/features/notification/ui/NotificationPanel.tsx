'use client';

import { getAvatarColor } from '@/src/shared/lib/avatar';
import type { AppNotification } from '@/src/entities/notification/types';
import { buildNotificationCopy } from '@/src/entities/notification/lib/buildNotificationCopy';

interface Props {
    notifications: AppNotification[];
    onClose: () => void;
    onMarkAsRead: (id: string) => Promise<void> | void;
    onMarkAllAsRead: () => Promise<void> | void;
    onOpen: (notification: AppNotification) => void;
}

export function NotificationPanel({ notifications, onClose, onMarkAsRead, onMarkAllAsRead, onOpen }: Props) {
    return (
        <aside className="fixed inset-0 z-50 flex flex-col bg-bg-primary lg:static lg:z-auto lg:w-96 lg:border-l lg:border-border-primary">
            <div className="flex items-center justify-between border-b border-border-primary px-4 py-3 shrink-0">
                <h3 className="text-base font-bold text-white">알림</h3>
                <div className="flex items-center gap-2">
                    <button onClick={onMarkAllAsRead} className="text-xs text-text-tertiary hover:text-white transition-colors">
                        전체 읽음
                    </button>
                    <button onClick={onClose} className="rounded-lg p-1.5 text-text-tertiary hover:bg-bg-hover hover:text-white transition-colors">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
            </div>
            <div className="flex-1 overflow-y-auto">
                {notifications.length === 0 && (
                    <p className="px-4 py-8 text-center text-sm text-text-tertiary">알림이 없습니다.</p>
                )}
                {notifications.map((n) => {
                    const copy = buildNotificationCopy(n);
                    const time = new Date(n.createdAt).toLocaleString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
                    return (
                        <button
                            key={n.id}
                            onClick={async () => {
                                if (!n.isRead) await onMarkAsRead(n.id);
                                onOpen(n);
                            }}
                            className={`w-full flex gap-3 px-4 py-3 text-left transition-colors hover:bg-white/[0.03] border-b border-border-primary ${n.isRead ? 'opacity-60' : ''}`}
                        >
                            {!n.isRead && <div className="w-2 h-2 rounded-full bg-blue-400 shrink-0 mt-2" />}
                            <div className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold text-white shrink-0" style={{ backgroundColor: getAvatarColor(n.actorId) }}>
                                {copy.actorName.slice(0, 1).toUpperCase()}
                            </div>
                            <div className="min-w-0 flex-1">
                                <div className="flex items-baseline gap-2">
                                    <span className="text-[13px] font-semibold text-white">{copy.actorName}</span>
                                    <span className="text-[11px] text-text-tertiary">{copy.typeLabel}</span>
                                </div>
                                <p className="mt-0.5 text-[13px] text-text-secondary line-clamp-2">{copy.body}</p>
                                <p className="mt-1 text-[11px] text-text-tertiary">{time}</p>
                            </div>
                        </button>
                    );
                })}
            </div>
        </aside>
    );
}
