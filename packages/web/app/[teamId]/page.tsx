import Link from 'next/link';
import { fetchWorkspaceLayoutData } from '@/lib/server-workspace-data';
import { WorkspaceQuickStart } from '@/src/features/workspace/ui/WorkspaceQuickStart';

interface Props {
    params: Promise<{ teamId: string }>;
}

export default async function TeamHomePage({ params }: Props) {
    const { teamId } = await params;
    const { teamName, channels } = await fetchWorkspaceLayoutData(teamId).catch(() => ({ teamName: '워크스페이스', channels: [] }));
    const firstChannel = channels[0];

    return (
        <div className="flex items-center justify-center h-full text-center p-8">
            <div>
                <h2 className="text-2xl font-bold text-white mb-3">{teamName}에 오신 것을 환영합니다</h2>
                <p className="text-text-secondary mb-6">대화는 채널에서 시작하고, 이슈와 문서로 실행 흐름을 이어갈 수 있습니다.</p>
                <div className="flex gap-3 justify-center flex-wrap">
                    {firstChannel ? (
                        <Link href={`/${teamId}/channel/${firstChannel.id}`} className="px-5 py-2.5 rounded-lg bg-[#b97532] text-white hover:bg-[#cf8640] transition-colors text-sm font-medium">
                            대화 시작하기
                        </Link>
                    ) : (
                        <WorkspaceQuickStart teamId={teamId} />
                    )}
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
                        공지 열기
                    </Link>
                </div>
            </div>
        </div>
    );
}
