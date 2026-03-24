interface Props {
    stats: Array<{
        id: string;
        name: string;
        channels: number;
        members: number;
        messages: number;
        todayMessages: number;
        githubLinked: boolean;
    }>;
}

export function WorkspaceStatsList({ stats }: Props) {
    return (
        <div className="rounded-[28px] border border-border-primary bg-bg-secondary p-5 sm:p-6">
            <div className="flex items-center justify-between gap-3">
                <div>
                    <h2 className="text-lg font-semibold text-white">워크스페이스 활동</h2>
                    <p className="mt-1 text-sm text-text-secondary">채널별 최근 메시지 집계를 워크스페이스 단위로 묶어서 보여줌.</p>
                </div>
            </div>
            <div className="mt-6 space-y-3">
                {stats.map((item) => (
                    <div key={item.id} className="rounded-2xl border border-border-primary bg-bg-primary/60 px-4 py-4">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <div>
                                <p className="font-semibold text-white">{item.name}</p>
                                <p className="mt-1 text-xs text-text-tertiary">{item.githubLinked ? 'GitHub webhook 연결됨' : 'GitHub 미연결'}</p>
                            </div>
                            <div className="flex flex-wrap gap-3 text-xs text-text-secondary">
                                <span>채널 {item.channels}</span>
                                <span>멤버 {item.members}</span>
                                <span>메시지 {item.messages}</span>
                                <span>오늘 {item.todayMessages}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
