import Link from 'next/link';
import Image from 'next/image';
import { siteConfig } from '@/src/shared/config/site';

export function MarketingHeader() {
    return (
        <header className="relative z-10 border-b border-white/8 bg-black/10 backdrop-blur-md">
            <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-4 sm:px-6 sm:py-5 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-center gap-3">
                    <Image src="/logo.svg" alt="Slacord" width={36} height={36} />
                    <div className="space-y-1">
                        <p className="text-[11px] uppercase tracking-[0.24em] text-[#d6b08a] sm:text-xs">
                            {siteConfig.badge}
                        </p>
                        <p className="text-xl font-bold text-white">{siteConfig.name}</p>
                    </div>
                </div>
                <nav className="grid w-full grid-cols-2 gap-2 sm:w-auto sm:grid-cols-none sm:auto-cols-max sm:grid-flow-col sm:gap-3">
                    <Link
                        href="/auth/login"
                        className="flex min-h-11 items-center justify-center rounded-full border border-white/8 px-4 py-2 text-sm text-text-secondary transition hover:border-white/16 hover:text-white"
                    >
                        로그인
                    </Link>
                    <Link
                        href="/auth/register"
                        className="flex min-h-11 items-center justify-center rounded-full bg-[#b97532] px-5 py-2 text-sm font-semibold text-white transition hover:bg-[#cf8640]"
                    >
                        시작하기
                    </Link>
                </nav>
            </div>
        </header>
    );
}
