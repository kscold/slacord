'use client';

import { use } from 'react';
import { publicAppUrl } from '@/lib/runtime-config';
import { useGitHubSettings } from '@/src/features/team/model/useGitHubSettings';
import { GitHubSettingsForm } from '@/src/features/team/ui/GitHubSettingsForm';
import { GitHubWebhookGuide } from '@/src/features/team/ui/GitHubWebhookGuide';
import { TeamInviteSettingsPanel } from '@/src/features/team/ui/TeamInviteSettingsPanel';
import { ConfluenceImportPanel } from '@/src/features/document/ui/ConfluenceImportPanel';
import { DiscordImportPanel } from '@/src/features/team/ui/DiscordImportPanel';

interface Props {
    params: Promise<{ teamId: string }>;
}

export default function SettingsPage({ params }: Props) {
    const { teamId } = use(params);
    const settings = useGitHubSettings(teamId);
    const webhookUrl = `${publicAppUrl()}/api/github/webhook`;
    const channelName = settings.selectedChannel?.name ?? null;

    return (
        <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
            <div className="max-w-2xl">
                <p className="text-xs uppercase tracking-[0.24em] text-brand-200">Team Settings</p>
                <h1 className="mt-3 text-3xl font-bold tracking-[-0.04em] text-white sm:text-4xl">GitHub 연동을 바로 운영 가능한 상태로 맞춤</h1>
                <p className="mt-3 text-sm leading-7 text-text-secondary sm:text-base">설정 저장 후 GitHub webhook만 등록하면 PR, 리뷰, CI 이벤트가 채널 카드로 바로 흘러옴.</p>
            </div>
            {settings.loading ? <div className="mt-8 rounded-[28px] border border-border-primary bg-bg-secondary p-6 text-sm text-text-secondary">설정과 채널 목록 불러오는 중...</div> : null}
            {!settings.loading ? (
                <div className="mt-8 space-y-6">
                    <TeamInviteSettingsPanel teamId={teamId} />
                    <div className="grid gap-5 lg:grid-cols-[0.92fr,1.08fr]">
                        <GitHubWebhookGuide channelName={channelName} repoUrl={settings.form.repoUrl} webhookUrl={webhookUrl} />
                        <GitHubSettingsForm
                            channels={settings.channels}
                            error={settings.error}
                            form={settings.form}
                            onGenerateSecret={settings.generateSecret}
                            onSave={settings.save}
                            onUpdateField={settings.updateField}
                            saved={settings.saved}
                            saving={settings.saving}
                        />
                    </div>
                    <div className="space-y-5">
                        <p className="text-xs uppercase tracking-[0.24em] text-brand-200">외부 서비스 연동</p>
                        <ConfluenceImportPanel teamId={teamId} onImported={async () => {}} />
                        <DiscordImportPanel teamId={teamId} />
                    </div>
                </div>
            ) : null}
        </div>
    );
}
