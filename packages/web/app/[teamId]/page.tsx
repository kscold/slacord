import Link from 'next/link';

interface Props {
    params: Promise<{ teamId: string }>;
}

export default async function TeamHomePage({ params }: Props) {
    const { teamId } = await params;

    return (
        <div className="flex items-center justify-center h-full text-center p-8">
            <div>
                <h2 className="text-2xl font-bold text-white mb-3">워크스페이스에 오신 것을 환영합니다</h2>
                <p className="text-text-secondary mb-6">좌측 사이드바에서 채널을 선택하거나 도구를 사용하세요.</p>
                <div className="flex gap-3 justify-center flex-wrap">
                    <Link
                        href={`/${teamId}/issues`}
                        className="px-5 py-2.5 rounded-lg bg-slack-green/20 text-slack-green border border-slack-green/30 hover:bg-slack-green/30 transition-colors text-sm font-medium"
                    >
                        이슈 트래커
                    </Link>
                    <Link
                        href={`/${teamId}/docs`}
                        className="px-5 py-2.5 rounded-lg bg-bg-secondary text-text-secondary border border-border-primary hover:bg-bg-hover hover:text-white transition-colors text-sm font-medium"
                    >
                        문서/위키
                    </Link>
                    <Link
                        href={`/${teamId}/announcements`}
                        className="px-5 py-2.5 rounded-lg bg-bg-secondary text-text-secondary border border-border-primary hover:bg-bg-hover hover:text-white transition-colors text-sm font-medium"
                    >
                        공지사항
                    </Link>
                </div>
            </div>
        </div>
    );
}
