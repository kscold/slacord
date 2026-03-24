import { StatsCard } from './StatsCard';

interface Props {
    totals: {
        workspaces: number;
        channels: number;
        members: number;
        messages: number;
        todayMessages: number;
        githubLinked: number;
    };
}

export function StatsGrid({ totals }: Props) {
    const cards = [
        { label: '워크스페이스', value: totals.workspaces, sub: '접근 가능한 팀 수' },
        { label: '채널', value: totals.channels, sub: 'DM 제외 채널 기준' },
        { label: 'GitHub 연결', value: totals.githubLinked, sub: 'webhook 저장소 연결 팀 수' },
        { label: '오늘 메시지', value: totals.todayMessages, sub: '최근 조회된 메시지 중 오늘 생성분' },
    ];
    return <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">{cards.map((card) => <StatsCard key={card.label} {...card} />)}</div>;
}
