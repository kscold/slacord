'use client';

import { useState } from 'react';
import { useNotifications } from '../model/useNotifications';
import { NotificationPanel } from './NotificationPanel';

interface Props {
    teamId: string;
}

export function NotificationBell({ teamId }: Props) {
    const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications(teamId);
    const [open, setOpen] = useState(false);

    return (
        <>
            <button
                onClick={() => setOpen(!open)}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-text-secondary transition-colors hover:bg-bg-hover hover:text-white"
            >
                <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                <span className="flex-1 text-left">알림</span>
                {unreadCount > 0 && (
                    <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-[11px] font-bold text-white">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </button>
            {open && (
                <div className="fixed inset-0 z-50 flex lg:static lg:z-auto">
                    <div className="flex-1 lg:hidden" onClick={() => setOpen(false)} />
                    <NotificationPanel
                        notifications={notifications}
                        onClose={() => setOpen(false)}
                        onMarkAsRead={markAsRead}
                        onMarkAllAsRead={markAllAsRead}
                    />
                </div>
            )}
        </>
    );
}
