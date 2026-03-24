import Link from 'next/link';
import Image from 'next/image';
import { siteConfig } from '@/src/shared/config/site';

const metrics = [
    { icon: '💬', label: 'Chat', value: '채팅, 이슈, 문서 한 곳에' },
    { icon: '📋', label: 'Flow', value: '할 일부터 완료까지 한눈에' },
    { icon: '⚡', label: 'Realtime', value: '실시간으로 함께 작업해요' },
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

            <div className="relative mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20 lg:py-28">
                <div className="mx-auto max-w-3xl text-center">
                    <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/20 px-4 py-1.5">
                        <Image
                            src="/logo.svg"
                            alt=""
                            width={20}
                            height={20}
                            className="rounded-md"
                        />
                        <span className="text-xs font-medium text-[#e2c29a]">{siteConfig.badge}</span>
                    </div>
                    <h1 className="mt-6 text-[clamp(2.3rem,8vw,4.5rem)] font-bold leading-[1.02] tracking-[-0.05em] text-white text-balance sm:mt-8">
                        {siteConfig.headline}
                    </h1>
                    <p className="mx-auto mt-5 max-w-xl text-base leading-7 text-[#d7c5b3] sm:mt-6 sm:text-lg sm:leading-8">
                        {siteConfig.description}
                    </p>
                    <div className="mt-8 flex flex-col items-center gap-3 sm:mt-10 sm:flex-row sm:justify-center">
                        <Link
                            href="/auth/register"
                            className="flex min-h-12 w-full items-center justify-center rounded-full bg-[#b97532] px-8 py-3 font-semibold text-white transition hover:bg-[#cf8640] sm:w-auto"
                        >
                            무료로 시작하기
                        </Link>
                        <Link
                            href="/auth/login"
                            className="flex min-h-12 w-full items-center justify-center rounded-full border border-white/10 px-8 py-3 font-semibold text-white transition hover:bg-white/5 sm:w-auto"
                        >
                            로그인
                        </Link>
                    </div>
                </div>

                <div className="mx-auto mt-12 grid max-w-3xl gap-3 sm:mt-16 sm:grid-cols-3 sm:gap-4">
                    {metrics.map((item) => (
                        <div
                            key={item.label}
                            className="rounded-2xl border border-white/8 bg-white/[0.04] p-5 backdrop-blur-sm transition hover:border-white/15 hover:bg-white/[0.06]"
                        >
                            <div className="flex items-center gap-2">
                                <span className="text-lg">{item.icon}</span>
                                <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-[#c9ab84]">
                                    {item.label}
                                </p>
                            </div>
                            <p className="mt-3 text-base font-semibold text-white">{item.value}</p>
                        </div>
                    ))}
                </div>

                <p className="mx-auto mt-8 max-w-lg text-center text-sm leading-6 text-[#9a8d7f]">
                    대화하다 생긴 할 일은 이슈로, 결정된 내용은 문서로. 자연스럽게 이어져요.
                </p>
            </div>
        </section>
    );
}
