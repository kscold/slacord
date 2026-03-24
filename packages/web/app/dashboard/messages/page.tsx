'use client';

import { useState } from 'react';
import { DashboardSidebar } from '@/src/widgets/dashboard/ui/DashboardSidebar';

export default function MessagesPage() {
    const [query, setQuery] = useState('');

    return (
        <div className="min-h-screen flex bg-bg-primary">
            <DashboardSidebar />
            <main className="flex-1 overflow-auto">
                <div className="p-8">
                    <div className="mb-8">
                        <h2 className="text-3xl font-bold text-white">메시지 검색</h2>
                        <p className="text-text-secondary mt-2">모든 팀 채널의 메시지를 검색합니다</p>
                    </div>
                    <div className="mb-8">
                        <div className="relative">
                            <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
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
                    <div className="text-center py-20 bg-bg-secondary rounded-2xl border border-border-primary">
                        <svg className="w-16 h-16 mx-auto text-text-muted mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        {query === '' ? (
                            <>
                                <p className="text-text-secondary text-lg">검색어를 입력하세요</p>
                                <p className="text-text-muted text-sm mt-2">팀과 채널을 선택하면 실시간 채팅으로 연결됩니다</p>
                            </>
                        ) : (
                            <>
                                <p className="text-text-secondary"><span className="text-white font-semibold">&quot;{query}&quot;</span> 검색 결과가 없습니다</p>
                                <p className="text-text-muted text-sm mt-2">현재 메시지 검색 기능은 준비 중입니다</p>
                            </>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}