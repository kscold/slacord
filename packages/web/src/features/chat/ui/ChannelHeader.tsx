interface Props {
    channelName: string;
    channelType?: string;
    onOpenPins: () => void;
}

export function ChannelHeader({ channelName, channelType, onOpenPins }: Props) {
    return (
        <header className="flex flex-col gap-3 border-b border-border-primary px-4 py-3 sm:flex-row sm:items-start sm:justify-between sm:px-6 sm:py-4">
            <div className="min-w-0 flex-1">
                <p className="text-xs uppercase tracking-[0.2em] text-[#d6b08a]">{channelType === 'dm' ? 'Direct Room' : 'Live Channel'}</p>
                <h2 className="mt-1 truncate text-lg font-bold text-white sm:mt-2 sm:text-2xl">{channelType === 'dm' ? channelName : `# ${channelName}`}</h2>
                <p className="mt-1 hidden text-sm text-text-secondary sm:block sm:mt-2">실시간 대화와 반응이 워크스페이스 기록으로 바로 남습니다.</p>
            </div>
            <button onClick={onOpenPins} className="shrink-0 self-start rounded-lg border border-border-primary px-3 py-2 text-sm text-text-secondary transition-colors hover:border-slack-green/40 hover:text-white">
                핀 보기
            </button>
        </header>
    );
}
