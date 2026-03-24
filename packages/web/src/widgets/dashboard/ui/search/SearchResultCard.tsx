import Link from 'next/link';

interface Props {
    result: {
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
    };
}

export function SearchResultCard({ result }: Props) {
    return (
        <Link href={`/${result.teamId}/channel/${result.channelId}`} className="block rounded-[24px] border border-border-primary bg-bg-secondary p-5 transition hover:border-brand-400/40 hover:bg-bg-hover">
            <div className="flex flex-wrap items-center gap-2 text-xs text-text-tertiary">
                <span>{result.teamName}</span>
                <span>/</span>
                <span>#{result.channelName}</span>
                <span>/</span>
                <span>{result.authorName}</span>
                {result.isPinned ? <span className="rounded-full bg-brand-500/15 px-2 py-1 text-brand-200">PIN</span> : null}
            </div>
            <p className="mt-3 line-clamp-2 text-sm leading-7 text-white">{result.content}</p>
            <div className="mt-4 flex items-center justify-between text-xs text-text-muted">
                <span>{new Date(result.createdAt).toLocaleString('ko-KR')}</span>
                <span>{result.attachmentCount ? `첨부 ${result.attachmentCount}개` : result.type}</span>
            </div>
        </Link>
    );
}
