import Link from 'next/link';
import { siteConfig } from '@/src/shared/config/site';

const version = siteConfig.desktopVersion;
const baseRelease = `https://github.com/kscold/slacord/releases/download/v${version}`;
const packages = [
    {
        title: 'Windows NSIS',
        hint: `Slacord-${version}-x64.exe`,
        href: `${baseRelease}/Slacord-${version}-x64.exe`,
        status: '권장',
        description: '설치 뒤 앱 안에서 새 버전을 바로 확인하고 내려받을 수 있습니다.',
    },
    {
        title: 'macOS Apple Silicon',
        hint: `Slacord-${version}-arm64.dmg`,
        href: `${baseRelease}/Slacord-${version}-arm64.dmg`,
        status: '수동 설치',
        description: '현재는 새 DMG를 다시 설치하는 방식으로 운영하고 있습니다.',
    },
    {
        title: 'macOS ZIP',
        hint: `Slacord-${version}-arm64.zip`,
        href: `${baseRelease}/Slacord-${version}-arm64.zip`,
        status: '보조 파일',
        description: 'DMG가 막힐 때 확인용으로 쓸 수 있는 보조 패키지입니다.',
    },
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
                            설치 후 로그인하면 바로 워크스페이스로 이어집니다. Windows는 앱 안에서 업데이트까지 바로 이어지고, macOS는 당분간 다운로드 페이지에서 새 설치 파일을 다시 받는 기준으로 운영합니다. 현재 공개 버전은 <span className="font-semibold text-white">v{version}</span>입니다.
                        </p>
                    </div>
                    <div className="marketing-card rounded-[32px] p-6 sm:p-7">
                        <p className="marketing-kicker">운영 기준</p>
                        <p className="mt-4 text-[1.4rem] font-bold tracking-[-0.04em] text-white">Windows는 앱 안 업데이트, macOS는 수동 설치 기준으로 안내합니다</p>
                        <p className="marketing-caption mt-4 text-sm sm:text-[0.98rem]">
                            지금은 사용자가 헷갈리지 않도록 플랫폼별로 다른 운영 기준을 분명하게 안내합니다. Windows는 앱 안에서 내려받고 재시작하면 되고, macOS는 최신 DMG를 다시 설치하는 흐름을 우선 사용합니다.
                        </p>
                    </div>
                </div>
                <div className="grid gap-4 xl:grid-cols-3">
                    {packages.map((item) => (
                        <a key={item.title} href={item.href} className="marketing-card rounded-[30px] p-7 transition hover:border-brand-300/40 hover:bg-bg-hover">
                            <p className="marketing-kicker text-[11px]">Installer</p>
                            <p className="mt-3 inline-flex rounded-full border border-white/10 px-3 py-1 text-[11px] text-[#d8c4a8]">{item.status}</p>
                            <h2 className="mt-5 text-[2rem] font-bold tracking-[-0.05em] text-white">{item.title}</h2>
                            <p className="mt-3 font-mono text-[0.95rem] text-[#d4c2af]">{item.hint}</p>
                            <p className="marketing-caption mt-4 text-sm">{item.description}</p>
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
                        Windows는 앱 안에서 새 버전을 확인하고 내려받은 뒤 재시작으로 바로 적용할 수 있습니다.
                    </p>
                    <p className="marketing-caption mt-3 text-[1rem]">
                        macOS는 정식 서명과 공증이 붙는 릴리즈 전까지 새 설치 파일을 다시 설치하는 기준으로 운영합니다. 업데이트 알림이 보이더라도 다운로드 페이지에서 최신 DMG를 받는 쪽이 가장 안전합니다.
                    </p>
                </div>
            </div>
        </div>
    );
}
