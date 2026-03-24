'use client';

import { useDashboardMessages } from '@/src/features/dashboard/model/useDashboardMessages';
import { DashboardShell } from '@/src/widgets/dashboard/ui/DashboardShell';
import { SearchInput } from '@/src/widgets/dashboard/ui/search/SearchInput';
import { SearchResultList } from '@/src/widgets/dashboard/ui/search/SearchResultList';

export default function MessagesPage() {
    const search = useDashboardMessages();

    return (
        <DashboardShell title="메시지 검색" description="접근 가능한 워크스페이스의 최근 메시지를 한 번에 찾아서 바로 채널로 이동할 수 있게 구성했음." currentUserName={search.currentUserName}>
            <div className="space-y-6">
                <SearchInput query={search.query} onChange={search.setQuery} />
                {search.error ? <p className="text-sm text-red-400">{search.error}</p> : null}
                {search.booting ? <div className="rounded-[28px] border border-border-primary bg-bg-secondary px-6 py-16 text-center text-sm text-text-secondary">검색에 필요한 워크스페이스 정보를 불러오는 중...</div> : null}
                {!search.booting ? <SearchResultList indexing={search.indexing} query={search.query} results={search.results} teamCount={search.teamCount} /> : null}
            </div>
        </DashboardShell>
    );
}
