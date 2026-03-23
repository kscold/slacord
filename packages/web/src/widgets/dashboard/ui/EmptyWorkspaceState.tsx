import Link from 'next/link';

export function EmptyWorkspaceState() {
    return (
        <div className="rounded-[28px] border border-dashed border-border-primary bg-bg-secondary px-6 py-12 text-center">
            <p className="text-sm font-medium text-[#d6b08a]">Workspace Ready</p>
            <h2 className="mt-3 text-2xl font-bold text-white">첫 워크스페이스를 열어보세요</h2>
            <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-text-secondary">Slacord는 채팅, 이슈, 문서를 같은 흐름으로 묶습니다. 먼저 워크스페이스를 만들고 기본 채널부터 열면 됩니다.</p>
            <Link href="/dashboard/teams/new" className="mt-6 inline-flex rounded-2xl bg-[#b97532] px-5 py-3 font-semibold text-white transition hover:bg-[#cf8640]">
                워크스페이스 만들기
            </Link>
        </div>
    );
}
