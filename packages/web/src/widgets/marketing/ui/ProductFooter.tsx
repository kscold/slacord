import { siteConfig } from '@/src/shared/config/site';
import Link from 'next/link';

export function ProductFooter() {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="border-t border-white/8">
            <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-14">
                <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
                    <div className="max-w-sm">
                        <p className="marketing-kicker">KSCOLD LABS</p>
                        <p className="mt-4 text-[1.7rem] font-bold tracking-[-0.05em] text-white">{siteConfig.name}</p>
                        <p className="marketing-caption mt-3 text-[1.02rem]">{siteConfig.footerDescription}</p>
                    </div>
                    <div className="grid grid-cols-1 gap-3 text-sm leading-7 text-[#9a8d7f] sm:grid-cols-2 sm:gap-x-12">
                        <p><span className="mr-2 text-[#d2bd9c]">상호</span>콜딩(Colding)</p>
                        <p><span className="mr-2 text-[#d2bd9c]">대표</span>김승찬</p>
                        <p><span className="mr-2 text-[#d2bd9c]">사업자등록번호</span>457-49-00942</p>
                        <p><span className="mr-2 text-[#d2bd9c]">주소</span>경기도 김포시 김포한강9로75번길 66, 5층</p>
                        <p><span className="mr-2 text-[#d2bd9c]">이메일</span><a href="mailto:coldingcontact@gmail.com" className="transition-colors hover:text-white">coldingcontact@gmail.com</a></p>
                    </div>
                </div>
                <div className="mt-10 border-t border-white/5 pt-6">
                    <div className="flex flex-col gap-3 text-sm text-[#8e8072] sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-4">
                            <Link href="/privacy" className="transition-colors hover:text-white">
                                개인정보 처리 방침
                            </Link>
                            <a href={siteConfig.releasePage} target="_blank" rel="noreferrer" className="transition-colors hover:text-white">
                                릴리즈 노트
                            </a>
                        </div>
                        <p className="text-xs tracking-[0.08em] text-[#6b6054]">
                            &copy; {currentYear} Colding. All rights reserved.
                        </p>
                    </div>
                </div>
            </div>
        </footer>
    );
}
