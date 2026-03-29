'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { channelApi } from '@/lib/api-client';

interface Props {
    teamId: string;
}

export function CreateChannelButton({ teamId }: Props) {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [name, setName] = useState('');
    const [type, setType] = useState<'public' | 'private' | 'voice'>('public');
    const [loading, setLoading] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!open) return;
        const handleClickOutside = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) { setOpen(false); setName(''); }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [open]);

    const handleCreate = async () => {
        const trimmed = name.trim();
        if (!trimmed) return;
        setLoading(true);
        try {
            const res = await channelApi.createChannel(teamId, { name: trimmed, type });
            if (res.success && res.data?.id) {
                setName('');
                setOpen(false);
                router.push(`/${teamId}/channel/${res.data.id}`);
                router.refresh();
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="relative" ref={ref}>
            <button onClick={() => setOpen(!open)} className="rounded p-0.5 text-text-tertiary transition hover:bg-bg-hover hover:text-white" title="채널 만들기">
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            </button>
            {open && (
                <div className="absolute left-0 top-full z-50 mt-2 w-56 space-y-2 rounded-xl border border-[rgba(201,162,114,0.25)] bg-[#1e1814] p-3 shadow-2xl">
                    <input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                        placeholder="채널 이름"
                        autoFocus
                        className="w-full rounded-lg border border-border-primary bg-bg-primary px-3 py-1.5 text-sm text-white outline-none focus:border-slack-green/50"
                    />
                    <div className="flex items-center gap-1.5">
                        {(['public', 'private', 'voice'] as const).map((t) => (
                            <button
                                key={t}
                                onClick={() => setType(t)}
                                className={`rounded-full px-2 py-0.5 text-[11px] transition ${type === t ? 'bg-slack-green text-white' : 'border border-border-primary text-text-tertiary hover:text-white'}`}
                            >
                                {t === 'public' ? '공개' : t === 'private' ? '비공개' : '음성'}
                            </button>
                        ))}
                    </div>
                    <div className="flex gap-2">
                        <button onClick={() => { setOpen(false); setName(''); }} className="flex-1 rounded-lg border border-border-primary px-2 py-1 text-xs text-text-secondary hover:text-white">취소</button>
                        <button onClick={handleCreate} disabled={loading || !name.trim()} className="flex-1 rounded-lg bg-slack-green px-2 py-1 text-xs font-medium text-white disabled:opacity-50">만들기</button>
                    </div>
                </div>
            )}
        </div>
    );
}
