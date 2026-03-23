const features = [
    {
        title: '실시간 채팅',
        description: '워크스페이스와 채널 구조 안에서 바로 대화하고, 반응과 타이핑 상태까지 이어집니다.',
    },
    {
        title: '이슈와 실행 관리',
        description: '칸반 흐름으로 할 일, 진행 중, 리뷰, 완료를 분리해 팀 실행을 끊기지 않게 관리합니다.',
    },
    {
        title: '문서와 공지',
        description: '결정 사항과 운영 문서를 워크스페이스 안에서 함께 보관해 컨텍스트가 흩어지지 않습니다.',
    },
];

export function FeatureGrid() {
    return (
        <section className="mx-auto max-w-6xl px-6 py-6">
            <div className="grid gap-5 lg:grid-cols-3">
                {features.map((feature) => (
                    <article key={feature.title} className="rounded-[28px] border border-white/10 bg-bg-secondary p-6">
                        <p className="text-xs uppercase tracking-[0.18em] text-[#c9ab84]">Core Flow</p>
                        <h2 className="mt-4 text-2xl font-bold text-white">{feature.title}</h2>
                        <p className="mt-4 text-sm leading-7 text-text-secondary">{feature.description}</p>
                    </article>
                ))}
            </div>
        </section>
    );
}
