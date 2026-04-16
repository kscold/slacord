'use client';

import { publicAppUrl } from '@/lib/runtime-config';
import { useGitHubSettings } from '../model/useGitHubSettings';
import { GitHubSettingsForm } from './GitHubSettingsForm';
import { GitHubWebhookGuide } from './GitHubWebhookGuide';

interface Props {
    teamId: string;
}

export function GitHubSettingsSection({ teamId }: Props) {
    const settings = useGitHubSettings(teamId);
    const webhookUrl = `${publicAppUrl()}/api/github/webhook`;
    const channelName = settings.selectedChannel?.name ?? null;

    if (settings.loading) {
        return (
            <div className="rounded-[28px] border border-border-primary bg-bg-secondary p-6 text-sm text-text-secondary">
                GitHub 설정과 채널 정보를 불러오는 중...
            </div>
        );
    }

    return (
        <div className="grid gap-5 lg:grid-cols-[0.92fr,1.08fr]">
            <GitHubWebhookGuide channelName={channelName} repoUrl={settings.form.repoUrl} webhookUrl={webhookUrl} />
            <GitHubSettingsForm
                canManageGithub={settings.canManageGithub}
                channels={settings.channels}
                error={settings.error}
                form={settings.form}
                hasStoredSecret={settings.hasStoredSecret}
                onGenerateSecret={settings.generateSecret}
                onSave={settings.save}
                onUpdateField={settings.updateField}
                saved={settings.saved}
                saving={settings.saving}
                viewerRole={settings.viewerRole}
            />
        </div>
    );
}
