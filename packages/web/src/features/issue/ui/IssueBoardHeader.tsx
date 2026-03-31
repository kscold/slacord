interface Props {
    onCreate: () => void;
}

export function IssueBoardHeader({ onCreate }: Props) {
    return (
        <div className="flex shrink-0 items-center justify-between border-b border-border-primary px-6 py-4">
            <h2 className="text-xl font-bold text-white">이슈 트래커</h2>
            <button
                onClick={onCreate}
                className="flex items-center gap-2 rounded-lg bg-slack-green px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slack-green/90"
            >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                이슈 생성
            </button>
        </div>
    );
}
