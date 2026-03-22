'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function MessagesPage() {
    const [query, setQuery] = useState('');

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
                            <p className="text-xs text-text-tertiary mt-0.5">팀 협업 툴</p>
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
                        className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-bg-hover text-text-secondary hover:text-white transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        <span className="font-medium">새 팀 만들기</span>
                    </Link>
                    <Link
                        href="/dashboard/messages"
                        className="flex items-center gap-3 px-4 py-3 rounded-lg bg-bg-hover text-white transition-colors"
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
                    <p className="mt-1">팀 올인원 협업 툴</p>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-auto">
                <div className="p-8">
                    <div className="mb-8">
                        <h2 className="text-3xl font-bold text-white">메시지 검색</h2>
                        <p className="text-text-secondary mt-2">모든 팀 채널의 메시지를 검색합니다</p>
                    </div>

                    {/* 검색창 */}
                    <div className="mb-8">
                        <div className="relative">
                            <svg
                                className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                                />
                            </svg>
                            <input
                                type="text"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="메시지 내용, 작성자로 검색..."
                                className="w-full pl-12 pr-4 py-4 bg-bg-secondary border border-border-primary rounded-xl text-white placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-slack-green focus:border-transparent transition-all text-base"
                            />
                        </div>
                    </div>

                    {/* 빈 상태 */}
                    {query === '' && (
                        <div className="text-center py-20 bg-bg-secondary rounded-2xl border border-border-primary">
                            <svg
                                className="w-16 h-16 mx-auto text-text-muted mb-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={1.5}
                                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                                />
                            </svg>
                            <p className="text-text-secondary text-lg">검색어를 입력하세요</p>
                            <p className="text-text-muted text-sm mt-2">팀과 채널을 선택하면 실시간 채팅으로 연결됩니다</p>
                        </div>
                    )}

                    {query !== '' && (
                        <div className="text-center py-20 bg-bg-secondary rounded-2xl border border-border-primary">
                            <p className="text-text-secondary">
                                <span className="text-white font-semibold">&quot;{query}&quot;</span> 검색 결과가 없습니다
                            </p>
                            <p className="text-text-muted text-sm mt-2">현재 메시지 검색 기능은 준비 중입니다</p>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
