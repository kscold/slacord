interface Props {
    hasContent: boolean;
    isUploading: boolean;
    onOpenFiles: () => void;
    onSubmit: () => void;
}

export function MessageComposerActions({ hasContent, isUploading, onOpenFiles, onSubmit }: Props) {
    return (
        <>
            <button
                type="button"
                onClick={onOpenFiles}
                className="mb-2 ml-2 flex h-7 w-7 shrink-0 self-end items-center justify-center rounded-full text-text-tertiary transition-colors hover:bg-white/10 hover:text-white"
            >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
            </button>
            {isUploading ? (
                <div className="mb-2 mr-2 h-7 w-7 shrink-0 self-end animate-spin rounded-full border-2 border-slack-green border-t-transparent" />
            ) : (
                <button
                    onClick={onSubmit}
                    disabled={!hasContent}
                    className="order-1 mb-2 mr-2 flex h-7 w-7 shrink-0 self-end items-center justify-center rounded-md bg-slack-green text-white transition-all disabled:opacity-20 hover:brightness-110"
                >
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                    </svg>
                </button>
            )}
        </>
    );
}
