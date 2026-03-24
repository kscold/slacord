import { siteConfig } from '@/src/shared/config/site';

export function ProductFooter() {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="border-t border-white/8">
            <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
                <div className="flex flex-col gap-6 md:flex-row md:justify-between">
                    <div>
                        <p className="font-semibold text-white">{siteConfig.footerLabel}</p>
                        <p className="mt-2 text-sm text-[#bfae9c]">{siteConfig.footerDescription}</p>
                    </div>
                    <div className="grid grid-cols-1 gap-1 text-xs leading-relaxed text-[#9a8d7f] sm:grid-cols-2 sm:gap-x-10">
                        <p><span className="text-[#bfae9c]">상호</span> 콜딩(Colding)</p>
                        <p><span className="text-[#bfae9c]">대표</span> 김승찬</p>
                        <p><span className="text-[#bfae9c]">사업자등록번호</span> 457-49-00942</p>
                        <p><span className="text-[#bfae9c]">주소</span> 경기도 김포시 김포한강9로75번길 66, 5층</p>
                        <p><span className="text-[#bfae9c]">이메일</span> <a href="mailto:coldingcontact@gmail.com" className="hover:text-white transition-colors">coldingcontact@gmail.com</a></p>
                    </div>
                </div>
                <div className="mt-8 border-t border-white/5 pt-6 text-xs text-[#6b6054]">
                    &copy; {currentYear} Colding. All rights reserved.
                </div>
            </div>
        </footer>
    );
}
