interface Props {
    canWrite: boolean;
    onCreate: () => void;
}

export function IssueBoardHeader({ canWrite, onCreate }: Props) {
    return (
        <div className="flex shrink-0 items-center justify-between border-b border-border-primary px-6 py-4">
            <div>
                <h2 className="text-xl font-bold text-white">이슈 트래커</h2>
                {!canWrite ? <p className="mt-1 text-xs text-text-tertiary">guest는 이슈를 조회만 할 수 있습니다.</p> : null}
            </div>
            {canWrite ? (
                <button
                    onClick={onCreate}
                    className="flex items-center gap-2 rounded-lg bg-slack-green px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slack-green/90"
                >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    이슈 생성
                </button>
            ) : null}
        </div>
    );
}
