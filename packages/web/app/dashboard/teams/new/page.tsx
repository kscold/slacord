'use client';

import { CreateWorkspaceForm } from '@/src/features/team/ui/CreateWorkspaceForm';
import { DashboardShell } from '@/src/widgets/dashboard/ui/DashboardShell';

export default function NewTeamPage() {
    return (
        <DashboardShell title="새 워크스페이스" description="팀 대화가 시작될 공간을 만들고 기본 채널까지 바로 준비합니다.">
            <div className="grid gap-6 lg:grid-cols-[0.9fr,1.1fr]">
                <div className="rounded-[28px] border border-border-primary bg-bg-secondary p-6">
                    <p className="text-sm font-medium text-[#d6b08a]">Provisioning Flow</p>
                    <h2 className="mt-3 text-2xl font-bold text-white">바로 사용할 수 있는 시작점</h2>
                    <ul className="mt-5 space-y-3 text-sm leading-6 text-text-secondary">
                        <li>워크스페이스 이름과 설명을 정하면 슬러그를 정리합니다.</li>
                        <li>생성과 동시에 기본 채널 `general`을 열어 바로 대화를 시작합니다.</li>
                        <li>이후 이슈, 문서, 공지 기능을 같은 워크스페이스 안에서 이어서 사용합니다.</li>
                    </ul>
                </div>
                <CreateWorkspaceForm />
            </div>
        </DashboardShell>
    );
}
