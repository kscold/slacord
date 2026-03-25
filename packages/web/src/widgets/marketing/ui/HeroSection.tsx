import Link from 'next/link';
import Image from 'next/image';
import { siteConfig } from '@/src/shared/config/site';

const metrics = [
    { icon: '💬', label: 'Chat', value: '대화부터 문서까지 한 곳에' },
    { icon: '📋', label: 'Flow', value: '할 일 흐름이 한눈에' },
    { icon: '⚡', label: 'Realtime', value: '실시간으로 같이 작업' },
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

            <div className="relative mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24 lg:py-32">
                <div className="mx-auto max-w-4xl text-center">
                    <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/25 px-4 py-2 backdrop-blur-md">
                        <Image
                            src="/logo.svg"
                            alt=""
                            width={20}
                            height={20}
                            className="rounded-md"
                        />
                        <span className="text-xs font-medium tracking-[0.08em] text-[#e2c29a]">{siteConfig.badge}</span>
                    </div>
                    <h1 className="marketing-display mt-7 whitespace-pre-line text-[clamp(3.25rem,8vw,6.2rem)] text-white sm:mt-9">
                        {siteConfig.headline}
                    </h1>
                    <p className="marketing-lead mx-auto mt-6 max-w-2xl whitespace-pre-line text-[clamp(1.05rem,2vw,1.35rem)] sm:mt-7">
                        {siteConfig.description}
                    </p>
                    <div className="mt-8 flex flex-col items-center gap-3 sm:mt-10 sm:flex-row sm:justify-center">
                        <Link
                            href="/download"
                            className="flex min-h-12 w-full items-center justify-center rounded-full border border-white/10 px-8 py-3 font-semibold text-white transition hover:bg-white/5 sm:w-auto"
                        >
                            앱 다운로드
                        </Link>
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

                <div className="mx-auto mt-14 grid max-w-4xl gap-4 sm:mt-18 sm:grid-cols-3 sm:gap-5">
                    {metrics.map((item) => (
                        <div
                            key={item.label}
                            className="marketing-card rounded-[26px] p-6 backdrop-blur-md transition hover:border-white/18 hover:bg-white/[0.06]"
                        >
                            <div className="flex items-center gap-2">
                                <span className="text-xl">{item.icon}</span>
                                <p className="marketing-kicker text-[11px]">
                                    {item.label}
                                </p>
                            </div>
                            <p className="mt-4 text-[1.15rem] font-semibold tracking-[-0.03em] text-white">{item.value}</p>
                        </div>
                    ))}
                </div>

                <p className="marketing-caption mx-auto mt-9 max-w-xl text-center text-sm sm:text-[0.95rem]">
                    대화 중 생긴 할 일은 바로 이슈로, 결정은 문서로 남겨요.
                </p>
            </div>
        </section>
    );
}
