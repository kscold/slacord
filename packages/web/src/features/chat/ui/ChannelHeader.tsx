interface Props {
    channelName: string;
    channelDescription?: string | null;
    channelType?: string;
    onOpenPins: () => void;
    onStartHuddle?: () => void;
    huddleActive?: boolean;
}

export function ChannelHeader({ channelName, channelDescription, channelType, onOpenPins, onStartHuddle, huddleActive }: Props) {
    const label = channelType === 'dm' ? 'Direct Message' : channelType === 'voice' ? 'Voice Channel' : 'Channel';

    return (
        <header className="flex items-center justify-between border-b border-border-primary px-4 py-3 sm:px-6">
            <div className="min-w-0">
                <div className="flex items-center gap-2">
                    <h2 className="truncate text-lg font-bold text-white">{channelType === 'dm' ? channelName : `# ${channelName}`}</h2>
                    <span className="shrink-0 rounded-full bg-white/5 px-2 py-0.5 text-[10px] uppercase tracking-wider text-text-tertiary">{label}</span>
                </div>
                {channelDescription && <p className="mt-0.5 truncate text-xs text-text-tertiary">{channelDescription}</p>}
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
                {onStartHuddle && (
                    <button
                        onClick={onStartHuddle}
                        className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs transition ${huddleActive ? 'border-green-500/40 bg-green-500/10 text-green-400' : 'border-border-primary text-text-secondary hover:text-white hover:border-text-tertiary'}`}
                        title={huddleActive ? '허들 나가기' : '허들 시작'}
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.536 8.464a5 5 0 010 7.072M12 6a6.978 6.978 0 00-3 .682M18.364 5.636a9 9 0 010 12.728M6.343 6.343a8.96 8.96 0 00-1.659 2.3M9.879 9.879a3 3 0 010 4.242" />
                        </svg>
                        {huddleActive ? '통화 중' : '허들'}
                        {huddleActive && <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />}
                    </button>
                )}
                <button onClick={onOpenPins} className="rounded-lg border border-border-primary px-3 py-1.5 text-xs text-text-secondary transition hover:text-white hover:border-text-tertiary" title="고정 메시지">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                    </svg>
                </button>
            </div>
        </header>
    );
}
