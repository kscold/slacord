'use client';

interface Props {
    query: string;
    onChange: (value: string) => void;
}

export function DocumentTreeSearch({ query, onChange }: Props) {
    return (
        <label className="flex items-center gap-2 rounded-2xl border border-border-primary bg-bg-secondary px-4 py-3">
            <svg className="h-4 w-4 shrink-0 text-text-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="m21 21-4.35-4.35m1.85-5.15a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z" />
            </svg>
            <input
                value={query}
                onChange={(event) => onChange(event.target.value)}
                placeholder="문서 제목으로 찾기"
                className="w-full bg-transparent text-sm text-white outline-none placeholder:text-text-tertiary"
            />
        </label>
    );
}
