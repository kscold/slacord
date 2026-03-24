interface Props {
    channelName: string | null;
    repoUrl: string;
    webhookUrl: string;
}

const EVENT_ITEMS = ['pull_request', 'pull_request_review', 'check_run'];

export function GitHubWebhookGuide({ channelName, repoUrl, webhookUrl }: Props) {
    return (
        <div className="rounded-[28px] border border-border-primary bg-[linear-gradient(180deg,#1e1711_0%,#120f0b_100%)] p-5 sm:p-6">
            <p className="text-xs uppercase tracking-[0.24em] text-brand-200">Webhook Guide</p>
            <h3 className="mt-3 text-lg font-semibold text-white sm:text-xl">GitHub에서 바로 붙이면 됨</h3>
            <div className="mt-5 space-y-4 text-sm text-text-secondary">
                <p>저장소는 <span className="font-medium text-white">{repoUrl || '미설정'}</span>, 알림 채널은 <span className="font-medium text-white">{channelName ?? '미선택'}</span> 기준으로 연결됨.</p>
                <div className="rounded-2xl border border-border-primary bg-black/20 p-4">
                    <p className="text-xs text-text-tertiary">Payload URL</p>
                    <code className="mt-2 block break-all text-sm text-brand-200">{webhookUrl}</code>
                </div>
                <div className="rounded-2xl border border-border-primary bg-black/20 p-4">
                    <p className="text-xs text-text-tertiary">권장 이벤트</p>
                    <p className="mt-2 text-white">{EVENT_ITEMS.join(', ')}</p>
                </div>
                <p className="leading-6">Webhook이 들어오면 GitHub 카드 메시지로 저장되고, 현재 열려 있는 채널에도 실시간으로 전파됨.</p>
            </div>
        </div>
    );
}
