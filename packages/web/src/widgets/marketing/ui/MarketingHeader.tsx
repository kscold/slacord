import Link from 'next/link';
import { siteConfig } from '@/src/shared/config/site';

export function MarketingHeader() {
    return (
        <header className="border-b border-white/8">
            <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
                <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-[#d6b08a]">{siteConfig.badge}</p>
                    <p className="mt-2 text-2xl font-bold text-white">{siteConfig.name}</p>
                </div>
                <nav className="flex items-center gap-3">
                    <Link href="/auth/login" className="rounded-full px-4 py-2 text-sm text-text-secondary transition hover:text-white">
                        로그인
                    </Link>
                    <Link href="/auth/register" className="rounded-full bg-[#b97532] px-5 py-2 text-sm font-semibold text-white transition hover:bg-[#cf8640]">
                        시작하기
                    </Link>
                </nav>
            </div>
        </header>
    );
}
