interface Props {
    onClick: () => void;
}

export function MessageActionToggle({ onClick }: Props) {
    return (
        <button
            type="button"
            aria-label="메시지 작업 열기"
            onClick={onClick}
            className="rounded-full p-1.5 text-text-tertiary transition-colors hover:bg-white/10 hover:text-white"
        >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6h.01M12 12h.01M12 18h.01" />
            </svg>
        </button>
    );
}
