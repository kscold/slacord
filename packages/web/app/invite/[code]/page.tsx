'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { use, useEffect, useState } from 'react';
import { authApi, teamApi } from '@/lib/api-client';
import type { TeamInvitePreview, TeamSummary } from '@/src/entities/team/types';

interface Props {
    params: Promise<{ code: string }>;
}

export default function InvitePage({ params }: Props) {
    const { code } = use(params);
    const router = useRouter();
    const [preview, setPreview] = useState<TeamInvitePreview | null>(null);
    const [loggedIn, setLoggedIn] = useState(false);
    const [joining, setJoining] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        let active = true;
        setLoading(true);
        Promise.allSettled([teamApi.getInvitePreview(code), authApi.getMe()])
            .then(([previewResult, meResult]) => {
                if (!active) return;
                if (previewResult.status === 'fulfilled') setPreview((previewResult.value.data ?? null) as TeamInvitePreview | null);
                if (previewResult.status === 'rejected') setError(previewResult.reason?.message ?? '초대 링크를 찾지 못했습니다.');
                setLoggedIn(meResult.status === 'fulfilled');
            })
            .finally(() => active && setLoading(false));
        return () => {
            active = false;
        };
    }, [code]);

    const handleJoin = async () => {
        setJoining(true);
        setError('');
        try {
            const response = await teamApi.joinByInvite(code);
            const team = (response.data ?? null) as TeamSummary | null;
            if (team?.id) router.push(`/${team.id}`);
        } catch (caught) {
            setError(caught instanceof Error ? caught.message : '초대 참여에 실패했습니다.');
        } finally {
            setJoining(false);
        }
    };

    const loginHref = `/auth/login?next=${encodeURIComponent(`/invite/${code}`)}`;
    const registerHref = `/auth/register?next=${encodeURIComponent(`/invite/${code}`)}`;

    return (
        <main className="min-h-screen bg-[#120d09] px-4 py-10 text-white sm:px-6">
            <section className="mx-auto max-w-xl rounded-[32px] border border-[#4d3621] bg-[linear-gradient(180deg,rgba(34,23,13,0.96),rgba(21,15,10,0.98))] p-6 shadow-[0_32px_120px_rgba(0,0,0,0.42)] sm:p-8">
                <p className="text-xs uppercase tracking-[0.24em] text-brand-200">Invite Preview</p>
                <h1 className="mt-3 text-3xl font-bold tracking-[-0.05em] text-white sm:text-4xl">Slacord 초대 링크</h1>
                <p className="mt-3 text-sm leading-7 text-text-secondary">QR 스캔 또는 초대 링크로 들어오면 여기서 팀 정보를 확인하고 바로 참여할 수 있음.</p>
                {loading ? <div className="mt-6 rounded-[24px] border border-white/8 bg-black/20 p-4 text-sm text-text-secondary">초대 정보 불러오는 중...</div> : null}
                {error ? <div className="mt-6 rounded-[24px] border border-red-400/20 bg-red-400/10 p-4 text-sm text-red-200">{error}</div> : null}
                {preview ? (
                    <div className="mt-6 space-y-4 rounded-[24px] border border-white/8 bg-black/20 p-5">
                        <div>
                            <p className="text-sm text-brand-100">워크스페이스</p>
                            <h2 className="mt-2 text-2xl font-semibold text-white">{preview.teamName}</h2>
                            <p className="mt-2 text-sm text-text-secondary">/{preview.teamSlug} · 기본 권한 {preview.defaultRole}</p>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2">
                            <div className="rounded-[20px] border border-white/8 bg-white/[0.03] p-4 text-sm text-text-secondary">상태: <span className={preview.active ? 'text-emerald-200' : 'text-red-200'}>{preview.active ? '활성' : '만료 또는 비활성'}</span></div>
                            <div className="rounded-[20px] border border-white/8 bg-white/[0.03] p-4 text-sm text-text-secondary">사용 횟수: {preview.useCount}{preview.maxUses ? ` / ${preview.maxUses}` : ''}</div>
                        </div>
                        <p className="text-sm text-text-secondary">{preview.expiresAt ? `만료일 ${new Date(preview.expiresAt).toLocaleString()}` : '만료 없음'}</p>
                        <div className="flex flex-wrap gap-3">
                            {loggedIn ? <button onClick={handleJoin} disabled={!preview.active || joining} className="rounded-full bg-brand-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-400 disabled:opacity-40">{joining ? '참여 중...' : '이 초대로 참여'}</button> : <Link href={loginHref} className="rounded-full bg-brand-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-400">로그인 후 참여</Link>}
                            {!loggedIn ? <Link href={registerHref} className="rounded-full border border-white/10 px-5 py-3 text-sm text-white transition hover:bg-white/6">회원가입하고 참여</Link> : null}
                            <Link href="/" className="rounded-full border border-white/10 px-5 py-3 text-sm text-white transition hover:bg-white/6">홈으로</Link>
                        </div>
                    </div>
                ) : null}
            </section>
        </main>
    );
}
