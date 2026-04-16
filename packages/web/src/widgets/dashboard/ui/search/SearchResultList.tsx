import type { MessageSearchResult } from '@/src/entities/message/search.types';
import { SearchResultCard } from './SearchResultCard';

interface Props {
    indexing: boolean;
    onSelectResult?: () => void;
    pinnedResults: MessageSearchResult[];
    query: string;
    recentResults: MessageSearchResult[];
    results: MessageSearchResult[];
    teamCount: number;
}

export function SearchResultList({
    indexing,
    onSelectResult,
    pinnedResults,
    query,
    recentResults,
    results,
    teamCount,
}: Props) {
    if (!query.trim()) {
        return (
            <div className="space-y-6">
                <SearchState
                    title="최근 메시지 흐름"
                    description={`${teamCount}개 워크스페이스 기준으로 최근 대화와 고정 메시지를 서버에서 바로 읽어왔습니다.`}
                />
                <SearchSection
                    title="방금 올라온 메시지"
                    items={recentResults}
                    emptyText="표시할 최근 메시지가 없습니다."
                    onSelectResult={onSelectResult}
                />
                <SearchSection
                    title="고정된 중요 메시지"
                    items={pinnedResults}
                    emptyText="고정된 메시지가 없습니다."
                    onSelectResult={onSelectResult}
                />
            </div>
        );
    }
    if (query.trim().length < 2)
        return (
            <SearchState
                title="두 글자 이상 입력 필요"
                description="너무 짧은 검색어는 결과 노이즈가 커서 두 글자부터 찾도록 맞춤."
            />
        );
    if (indexing)
        return (
            <SearchState
                title="메시지 검색 중"
                description="접근 가능한 워크스페이스와 채널에서 일치하는 대화를 찾는 중입니다."
            />
        );
    if (!results.length)
        return (
            <SearchState
                title={`"${query}" 결과 없음`}
                description="현재 접근 가능한 메시지와 채널 이름 기준으로는 일치하는 항목이 없습니다."
            />
        );
    return (
        <div className="grid gap-4">
            {results.map((result) => (
                <SearchResultCard key={result.id} onSelect={onSelectResult} result={result} />
            ))}
        </div>
    );
}

function SearchSection({
    emptyText,
    items,
    onSelectResult,
    title,
}: {
    emptyText: string;
    items: MessageSearchResult[];
    onSelectResult?: () => void;
    title: string;
}) {
    return (
        <section className="rounded-[28px] border border-border-primary bg-bg-secondary p-5 sm:p-6">
            <div className="mb-4">
                <h2 className="text-lg font-semibold text-white">{title}</h2>
            </div>
            {items.length ? (
                <div className="grid gap-4">
                    {items.map((item) => (
                        <SearchResultCard key={item.id} onSelect={onSelectResult} result={item} />
                    ))}
                </div>
            ) : (
                <p className="text-sm text-text-secondary">{emptyText}</p>
            )}
        </section>
    );
}

function SearchState({ title, description }: { title: string; description: string }) {
    return (
        <div className="rounded-[28px] border border-border-primary bg-bg-secondary px-6 py-16 text-center">
            <p className="text-lg font-semibold text-white">{title}</p>
            <p className="mt-3 text-sm leading-6 text-text-secondary">{description}</p>
        </div>
    );
}
