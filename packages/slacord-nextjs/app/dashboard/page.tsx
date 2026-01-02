'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

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
            const response = await fetch('http://localhost:8082/api/teams');
            const data = await response.json();
            if (data.success) {
                setTeams(data.data);
            }
        } catch (error) {
            console.error('Failed to fetch teams:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex bg-neutral-100">
            {/* Slack-style Sidebar */}
            <aside className="w-64 bg-primary-800 text-white flex flex-col">
                <div className="p-4 border-b border-primary-700">
                    <h1 className="text-xl font-bold">Slacord</h1>
                    <p className="text-sm text-primary-300 mt-1">메시지 백업 대시보드</p>
                </div>

                <nav className="flex-1 p-4 space-y-2">
                    <Link
                        href="/dashboard"
                        className="block px-3 py-2 rounded hover:bg-primary-700 transition-colors bg-primary-700"
                    >
                        🏠 대시보드
                    </Link>
                    <Link href="/dashboard/teams/new" className="block px-3 py-2 rounded hover:bg-primary-700 transition-colors">
                        ➕ 새 팀 만들기
                    </Link>
                    <Link href="/dashboard/messages" className="block px-3 py-2 rounded hover:bg-primary-700 transition-colors">
                        💬 메시지 검색
                    </Link>
                    <Link href="/dashboard/stats" className="block px-3 py-2 rounded hover:bg-primary-700 transition-colors">
                        📊 통계
                    </Link>
                </nav>

                <div className="p-4 border-t border-primary-700 text-xs text-primary-300">
                    <p>v1.0.0</p>
                    <p>90일 제한 없는 무료 백업</p>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-auto">
                <div className="p-8">
                    <div className="mb-8">
                        <h2 className="text-3xl font-bold text-neutral-900">팀 목록</h2>
                        <p className="text-neutral-600 mt-2">Slack 메시지를 Discord로 백업하는 팀을 관리하세요</p>
                    </div>

                    {loading ? (
                        <div className="text-center py-12">
                            <div className="text-neutral-500">로딩 중...</div>
                        </div>
                    ) : teams.length === 0 ? (
                        <div className="text-center py-12 bg-white rounded-lg border-2 border-dashed border-neutral-300">
                            <div className="text-6xl mb-4">🚀</div>
                            <h3 className="text-xl font-semibold text-neutral-800 mb-2">첫 팀을 만들어보세요!</h3>
                            <p className="text-neutral-600 mb-6">Slack과 Discord를 연결하여 메시지 백업을 시작하세요</p>
                            <Link
                                href="/dashboard/teams/new"
                                className="inline-block bg-accent-teal hover:opacity-90 text-white font-semibold px-6 py-3 rounded-lg transition-all shadow-lg"
                            >
                                새 팀 만들기
                            </Link>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {teams.map((team) => (
                                <Link
                                    key={team._id}
                                    href={`/dashboard/teams/${team._id}`}
                                    className="block bg-white rounded-lg shadow hover:shadow-xl transition-all p-6 border border-neutral-200 hover:border-accent-teal"
                                >
                                    <div className="flex items-start justify-between mb-4">
                                        <h3 className="text-xl font-bold text-neutral-900">{team.name}</h3>
                                        <span
                                            className={`px-2 py-1 text-xs rounded-full ${
                                                team.isActive ? 'bg-accent-sage text-white' : 'bg-neutral-300 text-neutral-700'
                                            }`}
                                        >
                                            {team.isActive ? '활성' : '비활성'}
                                        </span>
                                    </div>

                                    {team.description && <p className="text-neutral-600 text-sm mb-4">{team.description}</p>}

                                    <div className="space-y-2 text-sm">
                                        <div className="flex items-center text-neutral-700">
                                            <span className="mr-2">💼</span>
                                            <span>Slack: {team.slackConfig.workspaceName}</span>
                                        </div>
                                        <div className="flex items-center text-neutral-700">
                                            <span className="mr-2">💬</span>
                                            <span>Discord: {team.discordConfig.serverName}</span>
                                        </div>
                                    </div>

                                    <div className="mt-4 pt-4 border-t border-neutral-200 text-xs text-neutral-500">
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
