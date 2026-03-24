const features = [
    {
        title: '실시간 채팅',
        description: '채널에서 바로 대화하고, 이모지 반응과 타이핑 표시까지. 팀원이 옆에 있는 것처럼요.',
    },
    {
        title: '이슈 관리',
        description: '할 일, 진행 중, 리뷰, 완료. 칸반 보드에서 누가 뭘 하고 있는지 바로 보여요.',
    },
    {
        title: '문서와 공지',
        description: '회의에서 정한 건 문서로, 팀 전체에 알릴 건 공지로. 흩어질 일이 없어요.',
    },
];

export function FeatureGrid() {
    return (
        <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
            <div className="mb-6 max-w-2xl">
                <p className="text-xs uppercase tracking-[0.24em] text-[#c9ab84]">Core Flow</p>
                <h2 className="mt-3 text-3xl font-bold tracking-[-0.04em] text-white sm:text-4xl">
                    대화부터 실행, 기록까지 끊기지 않아요
                </h2>
            </div>
            <div className="grid gap-4 lg:grid-cols-3 lg:gap-5">
                {features.map((feature) => (
                    <article key={feature.title} className="rounded-[24px] border border-white/10 bg-bg-secondary p-5 sm:p-6">
                        <p className="text-xs uppercase tracking-[0.18em] text-[#c9ab84]">Core Flow</p>
                        <h2 className="mt-4 text-2xl font-bold tracking-[-0.03em] text-white">{feature.title}</h2>
                        <p className="mt-4 text-sm leading-7 text-text-secondary">{feature.description}</p>
                    </article>
                ))}
            </div>
        </section>
    );
}
