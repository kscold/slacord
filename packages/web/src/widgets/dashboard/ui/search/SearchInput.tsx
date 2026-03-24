interface Props {
    query: string;
    onChange: (value: string) => void;
}

export function SearchInput({ query, onChange }: Props) {
    return (
        <div className="relative">
            <svg className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
                type="text"
                value={query}
                onChange={(e) => onChange(e.target.value)}
                placeholder="메시지, 작성자, 팀, 채널로 검색..."
                className="w-full rounded-2xl border border-border-primary bg-bg-secondary py-4 pl-12 pr-4 text-base text-white outline-none transition focus:border-brand-400"
            />
        </div>
    );
}
