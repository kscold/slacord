import Link from 'next/link';
import { siteConfig } from '@/src/shared/config/site';

const version = siteConfig.desktopVersion;
const baseRelease = `https://github.com/kscold/slacord/releases/download/v${version}`;
const packages = [
    { title: 'macOS Apple Silicon', hint: `Slacord-${version}-arm64.dmg`, href: `${baseRelease}/Slacord-${version}-arm64.dmg` },
    { title: 'macOS ZIP', hint: `Slacord-${version}-arm64.zip`, href: `${baseRelease}/Slacord-${version}-arm64.zip` },
    { title: 'Windows NSIS', hint: `Slacord-${version}-x64.exe`, href: `${baseRelease}/Slacord-${version}-x64.exe` },
];

export default function DownloadPage() {
    return (
        <div className="min-h-screen bg-[radial-gradient(circle_at_top,#2b1d11_0%,#120f0b_42%,#0c0a08_100%)] px-4 py-16 sm:px-6 sm:py-20">
            <div className="mx-auto max-w-6xl space-y-12">
                <div className="grid gap-8 lg:grid-cols-[minmax(0,1.5fr)_minmax(320px,0.9fr)] lg:items-end">
                    <div className="max-w-3xl">
                        <p className="marketing-kicker">Desktop Download</p>
                        <h1 className="marketing-display mt-5 text-[clamp(3rem,6vw,5.3rem)] text-white">
                            브라우저 밖에서도<br />
                            <span className="text-brand-200">바로 이어지는 Slacord</span>
                        </h1>
                        <p className="marketing-lead mt-6 max-w-2xl text-[1.05rem]">
                            설치 후 로그인하면 바로 워크스페이스로 이어집니다. 알림은 앱 안에서 바로 받고, 업데이트도 같은 화면에서 확인할 수 있어요. 현재 공개 버전은 <span className="font-semibold text-white">v{version}</span>입니다.
                        </p>
                    </div>
                    <div className="marketing-card rounded-[32px] p-6 sm:p-7">
                        <p className="marketing-kicker">Release Note</p>
                        <p className="mt-4 text-[1.4rem] font-bold tracking-[-0.04em] text-white">설치 뒤 바로 팀 공간으로 연결됩니다</p>
                        <p className="marketing-caption mt-4 text-sm sm:text-[0.98rem]">
                            데스크톱 알림, 앱 내 업데이트 확인, 로그인 뒤 바로 워크스페이스로 이어지는 흐름을 기준으로 정리한 배포판입니다.
                        </p>
                    </div>
                </div>
                <div className="grid gap-4 xl:grid-cols-3">
                    {packages.map((item) => (
                        <a key={item.title} href={item.href} className="marketing-card rounded-[30px] p-7 transition hover:border-brand-300/40 hover:bg-bg-hover">
                            <p className="marketing-kicker text-[11px]">Installer</p>
                            <h2 className="mt-5 text-[2rem] font-bold tracking-[-0.05em] text-white">{item.title}</h2>
                            <p className="mt-3 font-mono text-[0.95rem] text-[#d4c2af]">{item.hint}</p>
                            <span className="mt-8 inline-flex rounded-full bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white">다운로드</span>
                        </a>
                    ))}
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <Link href={siteConfig.releasePage} className="rounded-full border border-border-primary px-5 py-3 text-sm text-text-secondary transition hover:bg-bg-hover hover:text-white">
                        GitHub Releases 열기
                    </Link>
                    <Link href="/auth/register" className="rounded-full bg-brand-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-400">
                        웹에서 바로 시작하기
                    </Link>
                </div>
                <div className="marketing-card rounded-[30px] p-6 sm:p-7">
                    <p className="marketing-kicker text-[11px]">Install Guide</p>
                    <p className="marketing-caption mt-4 text-[1rem]">
                        macOS는 정식 서명과 공증이 붙은 릴리즈부터 앱 안에서 자동 업데이트가 자연스럽게 이어집니다. 그 전 버전은 한 번만 새 설치 파일로 다시 설치해 주세요.
                    </p>
                    <p className="marketing-caption mt-3 text-[1rem]">
                        새 릴리즈가 올라오면 앱에서 먼저 알려드리고, 직접 받을지 고를 수 있어요. 준비가 끝나면 재시작만으로 바로 적용됩니다.
                    </p>
                </div>
            </div>
        </div>
    );
}
