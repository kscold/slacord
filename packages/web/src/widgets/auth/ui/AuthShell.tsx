'use client';

import Image from 'next/image';
import Link from 'next/link';
import { siteConfig } from '@/src/shared/config/site';

interface Props {
    title: string;
    description: string;
    alternateHref: string;
    alternateLabel: string;
    alternateText: string;
    children: React.ReactNode;
}

export function AuthShell({ title, description, alternateHref, alternateLabel, alternateText, children }: Props) {
    return (
        <div className="min-h-screen bg-[radial-gradient(circle_at_top,#2a1d11_0%,#120f0b_46%,#0c0a08_100%)] px-3 py-4 sm:px-4 sm:py-8 lg:px-6">
            <div className="mx-auto grid max-w-6xl gap-4 lg:min-h-[calc(100vh-4rem)] lg:grid-cols-[minmax(0,1fr)_minmax(360px,420px)] lg:gap-6">
                <section className="overflow-hidden rounded-[30px] border border-border-primary bg-[linear-gradient(160deg,#1c1711_0%,#120f0b_100%)] p-5 sm:p-8 lg:p-10">
                    <div className="flex h-full flex-col gap-8 lg:justify-between">
                        <div className="flex flex-col gap-5 sm:gap-6">
                            <p className="w-fit rounded-full border border-white/10 px-3 py-1 text-xs text-[#e5c9aa]">{siteConfig.badge}</p>
                            <Link href="/" className="flex w-fit items-center gap-3 rounded-[24px] border border-white/8 bg-white/[0.03] px-4 py-3">
                                <Image src="/logo.svg" alt="Slacord Logo" width={48} height={48} className="shrink-0 rounded-xl" />
                                <div className="min-w-0">
                                    <p className="text-xl font-bold leading-tight text-white sm:text-2xl">{siteConfig.name}</p>
                                    <p className="text-xs tracking-[0.16em] text-[#cbb79f] sm:text-sm">{siteConfig.footerLabel}</p>
                                </div>
                            </Link>
                            <h1 className="max-w-2xl whitespace-pre-line text-[clamp(2.1rem,7vw,4.6rem)] font-bold leading-[1.1] tracking-[-0.04em] text-white">
                                {siteConfig.headline}
                            </h1>
                            <p className="max-w-xl text-sm leading-7 text-[#d8c8b7] sm:text-base">{siteConfig.authDescription}</p>
                        </div>
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="rounded-[24px] border border-white/8 bg-white/4 p-4 sm:p-5">
                                <p className="text-sm font-semibold text-white">💬 실시간 대화</p>
                                <p className="mt-2 text-sm leading-6 text-[#cbb79f]">채널에서 바로 대화하고, 반응과 타이핑 표시까지. 팀원이 옆에 있는 것처럼요.</p>
                            </div>
                            <div className="rounded-[24px] border border-white/8 bg-white/4 p-4 sm:p-5">
                                <p className="text-sm font-semibold text-white">📋 이슈 · 문서 · 공지</p>
                                <p className="mt-2 text-sm leading-6 text-[#cbb79f]">할 일은 칸반으로, 결정은 문서로, 전달은 공지로. 흩어질 일이 없어요.</p>
                            </div>
                        </div>
                    </div>
                </section>
                <section className="rounded-[30px] border border-border-primary bg-bg-secondary p-5 sm:p-8 lg:p-10">
                    <p className="text-sm font-medium text-[#d6b08a]">{title}</p>
                    <h2 className="mt-3 text-2xl font-bold leading-tight text-white sm:text-3xl">{description}</h2>
                    <div className="mt-8">{children}</div>
                    <p className="mt-6 text-sm leading-6 text-text-secondary">
                        {alternateText}{' '}
                        <Link href={alternateHref} className="font-semibold text-[#d6b08a] hover:text-white">
                            {alternateLabel}
                        </Link>
                    </p>
                </section>
            </div>
        </div>
    );
}
