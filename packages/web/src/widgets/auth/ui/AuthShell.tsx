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
        <div className="min-h-screen bg-bg-primary px-4 py-10">
            <div className="mx-auto grid min-h-[calc(100vh-5rem)] max-w-5xl gap-6 lg:grid-cols-[1.1fr,0.9fr]">
                <section className="rounded-[28px] border border-border-primary bg-[linear-gradient(160deg,#1c1711_0%,#120f0b_100%)] p-8">
                    <p className="mb-6 inline-flex rounded-full border border-white/10 px-3 py-1 text-xs text-[#e5c9aa]">{siteConfig.badge}</p>
                    <Link href="/" className="mb-8 inline-flex items-center gap-3">
                        <Image src="/assets/slacord-logo.jpeg" alt="Slacord Logo" width={56} height={56} className="rounded-2xl" />
                        <div>
                            <p className="text-2xl font-bold text-white">{siteConfig.name}</p>
                            <p className="text-sm text-[#cbb79f]">{siteConfig.footerLabel}</p>
                        </div>
                    </Link>
                    <h1 className="max-w-md text-4xl font-bold leading-tight text-white">{siteConfig.headline}</h1>
                    <p className="mt-5 max-w-lg text-base leading-7 text-[#d8c8b7]">{siteConfig.authDescription}</p>
                    <div className="mt-10 grid gap-4 sm:grid-cols-2">
                        <div className="rounded-2xl border border-white/8 bg-white/4 p-4">
                            <p className="text-sm font-semibold text-white">실시간 대화</p>
                            <p className="mt-2 text-sm leading-6 text-[#cbb79f]">워크스페이스 안에서 바로 채팅, 반응, 타이핑 상태를 이어갑니다.</p>
                        </div>
                        <div className="rounded-2xl border border-white/8 bg-white/4 p-4">
                            <p className="text-sm font-semibold text-white">실행 관리</p>
                            <p className="mt-2 text-sm leading-6 text-[#cbb79f]">이슈, 문서, 공지를 같은 맥락에서 관리해 기록이 흩어지지 않습니다.</p>
                        </div>
                    </div>
                </section>
                <section className="rounded-[28px] border border-border-primary bg-bg-secondary p-8">
                    <p className="text-sm font-medium text-[#d6b08a]">{title}</p>
                    <h2 className="mt-3 text-3xl font-bold text-white">{description}</h2>
                    <div className="mt-8">{children}</div>
                    <p className="mt-6 text-sm text-text-secondary">
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
