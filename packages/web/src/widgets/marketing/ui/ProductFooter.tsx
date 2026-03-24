import { siteConfig } from '@/src/shared/config/site';

export function ProductFooter() {
    return (
        <footer className="border-t border-white/8">
            <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-10 text-sm text-[#bfae9c] sm:px-6 md:flex-row md:items-center md:justify-between">
                <div>
                    <p className="font-semibold text-white">{siteConfig.footerLabel}</p>
                    <p className="mt-2">{siteConfig.footerDescription}</p>
                </div>
                <p className="max-w-md leading-6 md:text-right">
                    © 2026 Slacord Cloud. Team conversations, execution, and records in one place.
                </p>
            </div>
        </footer>
    );
}
