interface Props {
    channelName: string;
    channelType?: string;
    onOpenPins: () => void;
}

export function ChannelHeader({ channelName, channelType, onOpenPins }: Props) {
    return (
        <header className="flex items-start justify-between border-b border-border-primary px-6 py-4">
            <div>
                <p className="text-xs uppercase tracking-[0.2em] text-[#d6b08a]">{channelType === 'dm' ? 'Direct Room' : 'Live Channel'}</p>
                <h2 className="mt-2 text-2xl font-bold text-white">{channelType === 'dm' ? channelName : `# ${channelName}`}</h2>
                <p className="mt-2 text-sm text-text-secondary">실시간 대화와 반응이 워크스페이스 기록으로 바로 남습니다.</p>
            </div>
            <button onClick={onOpenPins} className="rounded-lg border border-border-primary px-3 py-2 text-sm text-text-secondary transition-colors hover:border-slack-green/40 hover:text-white">
                핀 보기
            </button>
        </header>
    );
}
