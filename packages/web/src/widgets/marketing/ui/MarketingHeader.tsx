import Link from 'next/link';
import Image from 'next/image';
import { siteConfig } from '@/src/shared/config/site';

export function MarketingHeader() {
    return (
        <header className="relative z-10 border-b border-white/8 bg-black/10 backdrop-blur-md">
            <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6 sm:py-4">
                <Link href="/" className="flex items-center gap-3">
                    <Image
                        src="/assets/slacord-logo.svg"
                        alt="Slacord"
                        width={40}
                        height={40}
                        className="rounded-xl"
                    />
                    <div>
                        <p className="text-lg font-bold leading-tight text-white sm:text-xl">{siteConfig.name}</p>
                        <p className="text-[10px] tracking-[0.15em] text-[#c9ab84] sm:text-[11px]">
                            {siteConfig.footerLabel}
                        </p>
                    </div>
                </Link>
                <nav className="flex items-center gap-2 sm:gap-3">
                    <Link
                        href="/auth/login"
                        className="flex min-h-10 items-center justify-center rounded-full border border-white/8 px-4 py-2 text-sm text-text-secondary transition hover:border-white/16 hover:text-white sm:min-h-11 sm:px-5"
                    >
                        로그인
                    </Link>
                    <Link
                        href="/auth/register"
                        className="flex min-h-10 items-center justify-center rounded-full bg-[#b97532] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#cf8640] sm:min-h-11 sm:px-6"
                    >
                        시작하기
                    </Link>
                </nav>
            </div>
        </header>
    );
}
