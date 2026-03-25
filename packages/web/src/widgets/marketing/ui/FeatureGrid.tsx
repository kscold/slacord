const features = [
    {
        label: 'Chat & Call',
        title: '실시간 채팅 및 통화',
        description: '채널에서 대화하고, 이모지로 반응하고, 허들로 바로 음성 통화까지 이어져요.',
    },
    {
        label: 'Issue',
        title: '이슈 트래커',
        description: '칸반 보드에서 할 일을 만들고, 진행 상태를 한눈에 파악해요.',
    },
    {
        label: 'Docs',
        title: '문서와 공지',
        description: '회의 내용은 문서로, 팀 공유 사항은 공지로 기록해요.',
    },
];

export function FeatureGrid() {
    return (
        <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
            <div className="mb-7 max-w-3xl">
                <p className="marketing-kicker">Core Flow</p>
                <h2 className="marketing-display mt-4 text-[clamp(2.4rem,5vw,4.2rem)] text-white">
                    대화에서 실행,<br />기록까지 하나로
                </h2>
                <p className="marketing-lead mt-4 max-w-2xl text-[1.02rem]">
                    채팅에서 나온 맥락을 이슈와 문서로 바로 연결해서 팀의 흐름이 끊기지 않습니다.
                </p>
            </div>
            <div className="grid gap-4 lg:grid-cols-3 lg:gap-5">
                {features.map((feature) => (
                    <article key={feature.title} className="marketing-card rounded-[28px] p-6 sm:p-7">
                        <p className="marketing-kicker text-[11px]">{feature.label}</p>
                        <h2 className="mt-5 text-[2rem] font-bold tracking-[-0.05em] text-white">{feature.title}</h2>
                        <p className="marketing-caption mt-4 text-[1.02rem] leading-8">{feature.description}</p>
                    </article>
                ))}
            </div>
        </section>
    );
}
