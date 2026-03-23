import Link from 'next/link';
import { siteConfig } from '@/src/shared/config/site';

const metrics = [
    { label: 'Workspace', value: '채팅 · 이슈 · 문서' },
    { label: 'Flow', value: '실행 흐름 한 화면 정리' },
    { label: 'Realtime', value: 'Socket 기반 실시간 협업' },
];

export function HeroSection() {
    return (
        <section className="mx-auto grid max-w-6xl gap-10 px-6 py-18 lg:grid-cols-[1.1fr,0.9fr]">
            <div>
                <p className="inline-flex rounded-full border border-white/10 px-3 py-1 text-xs text-[#e2c29a]">Built for operators and builders</p>
                <h1 className="mt-6 max-w-3xl text-5xl font-bold leading-tight text-white lg:text-6xl">{siteConfig.headline}</h1>
                <p className="mt-6 max-w-2xl text-lg leading-8 text-[#d7c5b3]">{siteConfig.description}</p>
                <div className="mt-8 flex flex-wrap gap-3">
                    <Link href="/auth/register" className="rounded-full bg-[#b97532] px-6 py-3 font-semibold text-white transition hover:bg-[#cf8640]">
                        워크스페이스 열기
                    </Link>
                    <Link href="/dashboard" className="rounded-full border border-white/10 px-6 py-3 font-semibold text-white transition hover:bg-white/5">
                        제품 둘러보기
                    </Link>
                </div>
            </div>
            <div className="rounded-[32px] border border-white/10 bg-[linear-gradient(180deg,#20170f_0%,#14100b_100%)] p-6">
                <div className="rounded-[24px] border border-white/8 bg-black/20 p-5">
                    {metrics.map((item) => (
                        <div key={item.label} className="border-b border-white/6 py-4 last:border-b-0">
                            <p className="text-xs uppercase tracking-[0.2em] text-[#c9ab84]">{item.label}</p>
                            <p className="mt-2 text-lg font-semibold text-white">{item.value}</p>
                        </div>
                    ))}
                </div>
                <p className="mt-5 text-sm leading-6 text-[#c7b7a5]">대화는 채널에서 이어지고, 해야 할 일은 이슈로 넘어가고, 결정은 문서와 공지로 남습니다.</p>
            </div>
        </section>
    );
}
