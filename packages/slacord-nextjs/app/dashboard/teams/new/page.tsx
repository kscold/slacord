'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { teamApi } from '@/lib/api-client';

export default function NewTeamPage() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        name: '',
        description: '',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            // API 클라이언트 사용 - 순수 쿠키 인증
            const response = await teamApi.createTeam(formData.name, formData.description);

            if (response.success) {
                router.push('/dashboard');
            } else {
                setError(response.message || '채널 생성에 실패했습니다.');
            }
        } catch (err: any) {
            setError(err.message || '서버 오류가 발생했습니다.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    return (
        <div className="min-h-screen flex bg-bg-primary">
            {/* Sidebar */}
            <aside className="w-64 bg-bg-secondary border-r border-border-primary flex flex-col">
                <div className="p-6 border-b border-border-primary">
                    <Link href="/" className="flex items-center gap-3">
                        <Image
                            src="/assets/slacord-logo.jpeg"
                            alt="Slacord Logo"
                            width={40}
                            height={40}
                            className="rounded-xl ring-2 ring-slack-green/30"
                        />
                        <div>
                            <h1 className="text-xl font-bold text-white">Slacord</h1>
                            <p className="text-xs text-text-tertiary mt-0.5">메시지 백업 대시보드</p>
                        </div>
                    </Link>
                </div>

                <nav className="flex-1 p-4 space-y-1">
                    <Link
                        href="/dashboard"
                        className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-bg-hover text-text-secondary hover:text-white transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                            />
                        </svg>
                        <span className="font-medium">대시보드</span>
                    </Link>
                    <Link
                        href="/dashboard/teams/new"
                        className="flex items-center gap-3 px-4 py-3 rounded-lg bg-bg-hover text-white transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        <span className="font-medium">새 채널 만들기</span>
                    </Link>
                    <Link
                        href="/dashboard/messages"
                        className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-bg-hover text-text-secondary hover:text-white transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                            />
                        </svg>
                        <span className="font-medium">메시지 검색</span>
                    </Link>
                    <Link
                        href="/dashboard/stats"
                        className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-bg-hover text-text-secondary hover:text-white transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                            />
                        </svg>
                        <span className="font-medium">통계</span>
                    </Link>
                </nav>

                <div className="p-4 border-t border-border-primary text-xs text-text-tertiary">
                    <p className="font-semibold text-slack-green">v1.0.0 MVP</p>
                    <p className="mt-1">중앙집중식 백업</p>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-auto">
                <div className="max-w-2xl mx-auto p-8">
                    <div className="mb-8">
                        <h2 className="text-3xl font-bold text-white">새 채널 만들기</h2>
                        <p className="text-text-secondary mt-2">
                            Slacord가 자동으로 Slack 채널과 Discord 채널을 생성합니다
                        </p>
                    </div>

                    {/* 설명 카드 */}
                    <div className="mb-8 p-6 bg-gradient-to-r from-slack-teal/10 to-discord-blue/10 border border-slack-green/30 rounded-2xl">
                        <h3 className="text-lg font-semibold text-white mb-3">작동 방식</h3>
                        <div className="space-y-2 text-sm text-text-secondary">
                            <div className="flex items-start gap-2">
                                <span className="text-slack-green mt-0.5">✓</span>
                                <p>Slacord 전용 Slack Workspace에 채널 자동 생성</p>
                            </div>
                            <div className="flex items-start gap-2">
                                <span className="text-discord-blue mt-0.5">✓</span>
                                <p>Slacord 전용 Discord Server에 백업 채널 자동 생성</p>
                            </div>
                            <div className="flex items-start gap-2">
                                <span className="text-slack-yellow mt-0.5">✓</span>
                                <p>두 채널 간 실시간 메시지 동기화</p>
                            </div>
                            <div className="flex items-start gap-2">
                                <span className="text-slack-coral mt-0.5">✓</span>
                                <p>Discord에서 90일 이후 메시지도 영구 조회 가능</p>
                            </div>
                        </div>
                    </div>

                    {error && (
                        <div className="mb-6 bg-error/10 border border-error/30 text-error px-4 py-3 rounded-lg">
                            {error}
                        </div>
                    )}

                    <form
                        onSubmit={handleSubmit}
                        className="bg-bg-secondary rounded-2xl border border-border-primary p-8 space-y-6"
                    >
                        <div>
                            <label className="block text-sm font-medium text-text-primary mb-2">채널 이름 *</label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                required
                                pattern="[a-z0-9-_]+"
                                className="w-full px-4 py-3 bg-bg-tertiary border border-border-primary rounded-lg text-white placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-slack-green focus:border-transparent transition-all"
                                placeholder="예: dev-team, marketing, general"
                            />
                            <div className="mt-2 space-y-1">
                                <p className="text-xs text-slack-yellow">
                                    ⚠️ 영문 소문자, 숫자, 하이픈(-), 언더스코어(_)만 사용 가능
                                </p>
                                <p className="text-xs text-text-muted">
                                    Slack API 정책으로 한글 채널 이름은 지원되지 않습니다
                                </p>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-text-primary mb-2">설명 (선택)</label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                rows={3}
                                className="w-full px-4 py-3 bg-bg-tertiary border border-border-primary rounded-lg text-white placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-slack-green focus:border-transparent transition-all resize-none"
                                placeholder="채널에 대한 간단한 설명 (선택 사항)"
                            />
                        </div>

                        <div className="flex gap-4 pt-6">
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex-1 bg-gradient-to-r from-slack-green to-slack-teal hover:from-slack-green/90 hover:to-slack-teal/90 text-white font-semibold px-6 py-3 rounded-xl transition-all shadow-lg shadow-slack-green/20 hover:shadow-xl hover:shadow-slack-green/30 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? '생성 중...' : '채널 만들기'}
                            </button>
                            <Link
                                href="/dashboard"
                                className="px-6 py-3 border border-border-primary text-text-secondary hover:text-white font-semibold rounded-xl hover:bg-bg-hover transition-all"
                            >
                                취소
                            </Link>
                        </div>
                    </form>
                </div>
            </main>
        </div>
    );
}
