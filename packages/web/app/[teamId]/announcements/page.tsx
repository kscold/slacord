'use client';

import { useEffect, useState } from 'react';
import { use } from 'react';
import { announcementApi } from '@/lib/api-client';
import type { Announcement } from '@/src/entities/announcement/types';

interface Props {
    params: Promise<{ teamId: string }>;
}

export default function AnnouncementsPage({ params }: Props) {
    const { teamId } = use(params);
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [showCreate, setShowCreate] = useState(false);
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');

    useEffect(() => {
        announcementApi.getAnnouncements(teamId).then((res) => {
            if (res.success && Array.isArray(res.data)) setAnnouncements(res.data as Announcement[]);
        });
    }, [teamId]);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim() || !content.trim()) return;
        const res = await announcementApi.createAnnouncement(teamId, { title, content });
        if (res.success && res.data) {
            setAnnouncements((prev) => [res.data as Announcement, ...prev]);
            setTitle(''); setContent(''); setShowCreate(false);
        }
    };

    const handlePin = async (id: string, isPinned: boolean) => {
        const res = await announcementApi.pinAnnouncement(teamId, id, !isPinned);
        if (res.success && res.data) {
            setAnnouncements((prev) => prev.map((a) => a.id === id ? { ...a, isPinned: !isPinned } : a));
        }
    };

    return (
        <div className="max-w-3xl mx-auto p-6">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white">공지사항</h2>
                <button onClick={() => setShowCreate(true)} className="px-4 py-2 rounded-lg bg-slack-green text-white text-sm font-medium hover:bg-slack-green/90 transition-colors">
                    공지 작성
                </button>
            </div>

            {showCreate && (
                <form onSubmit={handleCreate} className="bg-bg-secondary rounded-xl border border-border-primary p-5 mb-6">
                    <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="공지 제목" className="w-full bg-bg-primary border border-border-primary rounded-lg px-3 py-2 text-sm text-white mb-3 focus:outline-none focus:border-slack-green/50" required />
                    <textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="공지 내용" rows={4} className="w-full bg-bg-primary border border-border-primary rounded-lg px-3 py-2 text-sm text-white mb-3 focus:outline-none focus:border-slack-green/50 resize-none" required />
                    <div className="flex gap-3">
                        <button type="button" onClick={() => setShowCreate(false)} className="flex-1 py-2 rounded-lg border border-border-primary text-text-secondary text-sm hover:text-white hover:bg-bg-hover transition-colors">취소</button>
                        <button type="submit" className="flex-1 py-2 rounded-lg bg-slack-green text-white text-sm font-medium hover:bg-slack-green/90 transition-colors">등록</button>
                    </div>
                </form>
            )}

            <div className="space-y-4">
                {announcements.map((a) => (
                    <div key={a.id} className={`bg-bg-secondary rounded-xl border p-5 ${a.isPinned ? 'border-slack-green/40' : 'border-border-primary'}`}>
                        <div className="flex items-start justify-between gap-3 mb-2">
                            <div className="flex items-center gap-2">
                                {a.isPinned && <span className="text-xs bg-slack-green/20 text-slack-green border border-slack-green/30 rounded-full px-2 py-0.5 font-semibold">고정</span>}
                                <h3 className="font-semibold text-white">{a.title}</h3>
                            </div>
                            <button onClick={() => handlePin(a.id, a.isPinned)} className="text-xs text-text-tertiary hover:text-slack-green transition-colors shrink-0">
                                {a.isPinned ? '고정 해제' : '고정'}
                            </button>
                        </div>
                        <p className="text-sm text-text-secondary whitespace-pre-wrap">{a.content}</p>
                        <p className="text-xs text-text-tertiary mt-3">{new Date(a.createdAt).toLocaleDateString('ko-KR')}</p>
                    </div>
                ))}
                {announcements.length === 0 && (
                    <p className="text-center text-text-tertiary py-12 text-sm">공지사항이 없습니다.</p>
                )}
            </div>
        </div>
    );
}
