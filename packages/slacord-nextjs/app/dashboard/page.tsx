'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { teamApi } from '@/lib/api-client';

interface Team {
    _id: string;
    name: string;
    description?: string;
    slackConfig: {
        workspaceName: string;
    };
    discordConfig: {
        serverName: string;
    };
    isActive: boolean;
    createdAt: string;
}

export default function DashboardPage() {
    const [teams, setTeams] = useState<Team[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchTeams();
    }, []);

    const fetchTeams = async () => {
        try {
            // API 클라이언트 사용 - 쿠키 자동 전송
            const response = await teamApi.getTeams();
            if (response.success && response.data) {
                setTeams(response.data);
            }
        } catch (error) {
            console.error('Failed to fetch teams:', error);
        } finally {
            setLoading(false);
        }
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
                        className="flex items-center gap-3 px-4 py-3 rounded-lg bg-bg-hover text-white transition-colors"
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
                        className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-bg-hover text-text-secondary hover:text-white transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 4v16m8-8H4"
                            />
                        </svg>
                        <span className="font-medium">새 팀 만들기</span>
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
                    <p className="font-semibold text-slack-green">v1.0.0</p>
                    <p className="mt-1">90일 제한 없는 무료 백업</p>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-auto">
                <div className="p-8">
                    <div className="mb-8">
                        <h2 className="text-3xl font-bold text-white">채널 목록</h2>
                        <p className="text-text-secondary mt-2">Slack 메시지를 Discord로 백업하는 채널을 관리하세요</p>
                    </div>

                    {loading ? (
                        <div className="text-center py-12">
                            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-slack-green border-t-transparent"></div>
                            <p className="text-text-secondary mt-4">로딩 중...</p>
                        </div>
                    ) : teams.length === 0 ? (
                        <div className="text-center py-16 bg-bg-secondary rounded-2xl border-2 border-dashed border-border-primary">
                            <div className="text-7xl mb-6">🚀</div>
                            <h3 className="text-2xl font-semibold text-white mb-3">첫 채널을 만들어보세요!</h3>
                            <p className="text-text-secondary mb-8 text-lg">
                                Slack과 Discord를 연결하여 메시지 백업을 시작하세요
                            </p>
                            <Link
                                href="/dashboard/teams/new"
                                className="inline-flex items-center gap-2 bg-gradient-to-r from-slack-green to-slack-teal hover:from-slack-green/90 hover:to-slack-teal/90 text-white font-semibold px-8 py-4 rounded-xl transition-all shadow-lg shadow-slack-green/20 hover:shadow-xl hover:shadow-slack-green/30"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M12 4v16m8-8H4"
                                    />
                                </svg>
                                새 채널 만들기
                            </Link>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {teams.map((team) => (
                                <Link
                                    key={team._id}
                                    href={`/dashboard/teams/${team._id}`}
                                    className="group block bg-bg-secondary rounded-2xl hover:bg-bg-hover transition-all p-6 border border-border-primary hover:border-slack-green/40"
                                >
                                    <div className="flex items-start justify-between mb-4">
                                        <h3 className="text-xl font-bold text-white group-hover:text-slack-green transition-colors">
                                            {team.name}
                                        </h3>
                                        <span
                                            className={`px-3 py-1 text-xs font-semibold rounded-full ${
                                                team.isActive
                                                    ? 'bg-slack-green/20 text-slack-green border border-slack-green/30'
                                                    : 'bg-bg-tertiary text-text-tertiary border border-border-primary'
                                            }`}
                                        >
                                            {team.isActive ? '활성' : '비활성'}
                                        </span>
                                    </div>

                                    {team.description && (
                                        <p className="text-text-secondary text-sm mb-4 line-clamp-2">{team.description}</p>
                                    )}

                                    <div className="space-y-3 text-sm">
                                        <div className="flex items-center gap-3 text-text-secondary">
                                            <div className="w-8 h-8 rounded-lg bg-slack-teal/10 flex items-center justify-center">
                                                <span className="text-slack-teal">💼</span>
                                            </div>
                                            <div>
                                                <p className="text-xs text-text-tertiary">Slack Workspace</p>
                                                <p className="font-medium text-white">{team.slackConfig.workspaceName}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3 text-text-secondary">
                                            <div className="w-8 h-8 rounded-lg bg-discord-blue/10 flex items-center justify-center">
                                                <span className="text-discord-blue">💬</span>
                                            </div>
                                            <div>
                                                <p className="text-xs text-text-tertiary">Discord Server</p>
                                                <p className="font-medium text-white">{team.discordConfig.serverName}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-6 pt-4 border-t border-border-primary text-xs text-text-tertiary">
                                        생성일: {new Date(team.createdAt).toLocaleDateString('ko-KR')}
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
