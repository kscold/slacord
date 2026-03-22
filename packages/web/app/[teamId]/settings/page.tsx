'use client';

import { useState } from 'react';
import { use } from 'react';
import { teamApi } from '@/lib/api-client';

interface Props {
    params: Promise<{ teamId: string }>;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8082';

export default function SettingsPage({ params }: Props) {
    const { teamId } = use(params);
    const [repoUrl, setRepoUrl] = useState('');
    const [webhookSecret, setWebhookSecret] = useState('');
    const [notifyChannelId, setNotifyChannelId] = useState('');
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState('');

    const generateSecret = () => {
        const arr = new Uint8Array(24);
        crypto.getRandomValues(arr);
        setWebhookSecret(Array.from(arr).map((b) => b.toString(16).padStart(2, '0')).join(''));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        try {
            const res = await teamApi.updateGithubConfig(teamId, { repoUrl, webhookSecret, notifyChannelId });
            if (res.success) { setSaved(true); setTimeout(() => setSaved(false), 3000); }
            else setError('저장 실패');
        } catch (err: any) {
            setError(err.message ?? '저장 실패');
        }
    };

    const webhookUrl = `${API_URL}/api/github/webhook`;

    return (
        <div className="max-w-2xl mx-auto p-6">
            <h2 className="text-xl font-bold text-white mb-6">팀 설정</h2>

            <div className="bg-bg-secondary rounded-xl border border-border-primary p-6">
                <h3 className="text-base font-semibold text-white mb-1">GitHub Webhook 연동</h3>
                <p className="text-sm text-text-secondary mb-5">PR, CI 상태를 채팅 채널에 자동으로 알려드립니다.</p>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs text-text-tertiary mb-1">레포지토리 URL</label>
                        <input value={repoUrl} onChange={(e) => setRepoUrl(e.target.value)} placeholder="https://github.com/org/repo" required className="w-full bg-bg-primary border border-border-primary rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-slack-green/50" />
                    </div>

                    <div>
                        <label className="block text-xs text-text-tertiary mb-1">Webhook Secret</label>
                        <div className="flex gap-2">
                            <input value={webhookSecret} onChange={(e) => setWebhookSecret(e.target.value)} placeholder="최소 8자" required className="flex-1 bg-bg-primary border border-border-primary rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-slack-green/50 font-mono" />
                            <button type="button" onClick={generateSecret} className="px-3 py-2 rounded-lg border border-border-primary text-text-secondary text-sm hover:text-white hover:bg-bg-hover transition-colors shrink-0">자동 생성</button>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs text-text-tertiary mb-1">알림받을 채널 ID</label>
                        <input value={notifyChannelId} onChange={(e) => setNotifyChannelId(e.target.value)} placeholder="채널 ID (MongoDB ObjectId)" required className="w-full bg-bg-primary border border-border-primary rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-slack-green/50" />
                    </div>

                    {error && <p className="text-sm text-red-400">{error}</p>}
                    {saved && <p className="text-sm text-slack-green">저장되었습니다!</p>}

                    <button type="submit" className="w-full py-2.5 rounded-lg bg-slack-green text-white font-medium hover:bg-slack-green/90 transition-colors">저장</button>
                </form>

                <div className="mt-6 p-4 bg-bg-primary rounded-lg border border-border-primary">
                    <p className="text-xs text-text-tertiary mb-1">GitHub에 등록할 Webhook URL</p>
                    <code className="text-sm text-slack-green break-all">{webhookUrl}</code>
                </div>
            </div>
        </div>
    );
}
