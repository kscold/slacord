const features = [
    {
        label: 'Chat',
        title: '실시간 채팅',
        description: '채널에서 대화하고, 이모지로 반응하고, 타이핑 상태도 보여요.',
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
        <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
            <div className="mb-6 max-w-2xl">
                <p className="text-xs uppercase tracking-[0.24em] text-[#c9ab84]">Core Flow</p>
                <h2 className="mt-3 text-3xl font-bold tracking-[-0.04em] text-white sm:text-4xl">
                    대화에서 실행, 기록까지 하나로
                </h2>
            </div>
            <div className="grid gap-4 lg:grid-cols-3 lg:gap-5">
                {features.map((feature) => (
                    <article key={feature.title} className="rounded-[24px] border border-white/10 bg-bg-secondary p-5 sm:p-6">
                        <p className="text-xs uppercase tracking-[0.18em] text-[#c9ab84]">{feature.label}</p>
                        <h2 className="mt-4 text-2xl font-bold tracking-[-0.03em] text-white">{feature.title}</h2>
                        <p className="mt-3 text-sm leading-7 text-text-secondary">{feature.description}</p>
                    </article>
                ))}
            </div>
        </section>
    );
}
