import Link from 'next/link';
import { siteConfig } from '@/src/shared/config/site';

const metrics = [
    { label: 'Workspace', value: '채팅 · 이슈 · 문서' },
    { label: 'Flow', value: '실행 흐름 한 화면 정리' },
    { label: 'Realtime', value: 'Socket 기반 실시간 협업' },
];

export function HeroSection() {
    return (
        <section className="relative overflow-hidden">
            <video
                autoPlay
                muted
                loop
                playsInline
                className="absolute inset-0 h-full w-full object-cover opacity-15"
            >
                <source src="/assets/background.mp4" type="video/mp4" />
            </video>
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#120f0b]/60 to-[#120f0b]" />

            <div className="relative mx-auto grid max-w-6xl gap-6 px-4 py-14 sm:px-6 sm:py-20 lg:grid-cols-[1.08fr,0.92fr] lg:gap-10 lg:py-24">
                <div className="max-w-3xl">
                    <p className="inline-flex rounded-full border border-white/10 bg-black/15 px-3 py-1 text-xs text-[#e2c29a]">
                        Built for operators and builders
                    </p>
                    <h1 className="mt-5 max-w-[11ch] text-[clamp(2.75rem,8vw,5.6rem)] font-bold leading-[0.94] tracking-[-0.05em] text-white">
                        {siteConfig.headline}
                    </h1>
                    <p className="mt-5 max-w-2xl text-base leading-7 text-[#d7c5b3] sm:text-lg sm:leading-8">
                        {siteConfig.description}
                    </p>
                    <div className="mt-8 grid gap-3 sm:flex sm:flex-wrap">
                        <Link
                            href="/auth/register"
                            className="flex min-h-12 items-center justify-center rounded-full bg-[#b97532] px-6 py-3 font-semibold text-white transition hover:bg-[#cf8640]"
                        >
                            워크스페이스 열기
                        </Link>
                        <Link
                            href="/dashboard"
                            className="flex min-h-12 items-center justify-center rounded-full border border-white/10 px-6 py-3 font-semibold text-white transition hover:bg-white/5"
                        >
                            제품 둘러보기
                        </Link>
                    </div>
                </div>

                <div className="rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,#20170f_0%,#14100b_100%)] p-4 shadow-[0_20px_80px_rgba(0,0,0,0.35)] backdrop-blur-sm sm:p-6">
                    <div className="rounded-[22px] border border-white/8 bg-black/20 p-4 sm:p-5">
                        <p className="text-xs uppercase tracking-[0.24em] text-[#c9ab84]">Workspace Brief</p>
                        <div className="mt-4 grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
                            {metrics.map((item) => (
                                <div key={item.label} className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
                                    <p className="text-[11px] uppercase tracking-[0.22em] text-[#c9ab84]">{item.label}</p>
                                    <p className="mt-2 text-base font-semibold text-white sm:text-lg">{item.value}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                    <p className="mt-4 text-sm leading-6 text-[#c7b7a5] sm:mt-5">
                        대화는 채널에서 이어지고, 해야 할 일은 이슈로 넘어가고, 결정은 문서와 공지로 남습니다.
                    </p>
                </div>
            </div>
        </section>
    );
}
