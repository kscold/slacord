import { SearchResultCard } from './SearchResultCard';

interface Props {
    indexing: boolean;
    query: string;
    results: Array<{
        id: string;
        teamId: string;
        teamName: string;
        channelId: string;
        channelName: string;
        authorName: string;
        content: string;
        createdAt: string;
        isPinned: boolean;
        attachmentCount: number;
        type: string;
    }>;
    teamCount: number;
}

export function SearchResultList({ indexing, query, results, teamCount }: Props) {
    if (!query.trim()) return <SearchState title="검색어를 입력하면 바로 찾음" description={`${teamCount}개 워크스페이스 기준으로 최근 메시지 인덱스를 준비함.`} />;
    if (query.trim().length < 2) return <SearchState title="두 글자 이상 입력 필요" description="너무 짧은 검색어는 결과 노이즈가 커서 두 글자부터 찾도록 맞춤." />;
    if (indexing) return <SearchState title="메시지 인덱스 만드는 중" description="접근 가능한 채널의 최근 메시지를 읽는 중임." />;
    if (!results.length) return <SearchState title={`"${query}" 결과 없음`} description="최근 메시지 기준으로는 일치하는 항목이 없었음." />;
    return <div className="grid gap-4">{results.map((result) => <SearchResultCard key={result.id} result={result} />)}</div>;
}

function SearchState({ title, description }: { title: string; description: string }) {
    return (
        <div className="rounded-[28px] border border-border-primary bg-bg-secondary px-6 py-16 text-center">
            <p className="text-lg font-semibold text-white">{title}</p>
            <p className="mt-3 text-sm leading-6 text-text-secondary">{description}</p>
        </div>
    );
}
