'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function NewTeamPage() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        slackWorkspaceName: '',
        slackBotToken: '',
        slackSigningSecret: '',
        slackAppToken: '',
        discordServerName: '',
        discordWebhookUrl: '',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await fetch('http://localhost:8082/api/teams', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: formData.name,
                    description: formData.description,
                    slackConfig: {
                        workspaceId: `ws-${Date.now()}`, // 임시 ID
                        workspaceName: formData.slackWorkspaceName,
                        botToken: formData.slackBotToken,
                        signingSecret: formData.slackSigningSecret,
                        appToken: formData.slackAppToken,
                    },
                    discordConfig: {
                        serverId: `server-${Date.now()}`, // 임시 ID
                        serverName: formData.discordServerName,
                        webhookUrl: formData.discordWebhookUrl,
                    },
                    isActive: true,
                }),
            });

            const data = await response.json();

            if (data.success) {
                alert('팀이 생성되었습니다!');
                router.push('/dashboard');
            } else {
                setError('팀 생성에 실패했습니다.');
            }
        } catch (err) {
            setError('서버 연결에 실패했습니다.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    return (
        <div className="min-h-screen flex bg-neutral-100">
            {/* Slack-style Sidebar */}
            <aside className="w-64 bg-primary-800 text-white flex flex-col">
                <div className="p-4 border-b border-primary-700">
                    <h1 className="text-xl font-bold">Slacord</h1>
                    <p className="text-sm text-primary-300 mt-1">메시지 백업 대시보드</p>
                </div>

                <nav className="flex-1 p-4 space-y-2">
                    <Link href="/dashboard" className="block px-3 py-2 rounded hover:bg-primary-700 transition-colors">
                        🏠 대시보드
                    </Link>
                    <Link
                        href="/dashboard/teams/new"
                        className="block px-3 py-2 rounded hover:bg-primary-700 transition-colors bg-primary-700"
                    >
                        ➕ 새 팀 만들기
                    </Link>
                    <Link href="/dashboard/messages" className="block px-3 py-2 rounded hover:bg-primary-700 transition-colors">
                        💬 메시지 검색
                    </Link>
                    <Link href="/dashboard/stats" className="block px-3 py-2 rounded hover:bg-primary-700 transition-colors">
                        📊 통계
                    </Link>
                </nav>

                <div className="p-4 border-t border-primary-700 text-xs text-primary-300">
                    <p>v1.0.0</p>
                    <p>90일 제한 없는 무료 백업</p>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-auto">
                <div className="max-w-4xl mx-auto p-8">
                    <div className="mb-8">
                        <h2 className="text-3xl font-bold text-neutral-900">새 팀 만들기</h2>
                        <p className="text-neutral-600 mt-2">Slack Workspace와 Discord Server를 연결하세요</p>
                    </div>

                    {error && (
                        <div className="mb-6 bg-accent-coral bg-opacity-10 border border-accent-coral text-accent-coral px-4 py-3 rounded">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-8 space-y-6">
                        {/* 기본 정보 */}
                        <div>
                            <h3 className="text-lg font-semibold text-neutral-900 mb-4">기본 정보</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-neutral-700 mb-2">팀 이름 *</label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        required
                                        className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-accent-teal focus:border-transparent"
                                        placeholder="예: 마케팅팀"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-neutral-700 mb-2">설명</label>
                                    <textarea
                                        name="description"
                                        value={formData.description}
                                        onChange={handleChange}
                                        rows={3}
                                        className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-accent-teal focus:border-transparent"
                                        placeholder="팀에 대한 간단한 설명"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Slack 설정 */}
                        <div className="border-t border-neutral-200 pt-6">
                            <h3 className="text-lg font-semibold text-neutral-900 mb-4">💼 Slack 설정</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-neutral-700 mb-2">Workspace 이름 *</label>
                                    <input
                                        type="text"
                                        name="slackWorkspaceName"
                                        value={formData.slackWorkspaceName}
                                        onChange={handleChange}
                                        required
                                        className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-accent-teal focus:border-transparent"
                                        placeholder="예: my-workspace"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-neutral-700 mb-2">Bot Token *</label>
                                    <input
                                        type="text"
                                        name="slackBotToken"
                                        value={formData.slackBotToken}
                                        onChange={handleChange}
                                        required
                                        className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-accent-teal focus:border-transparent font-mono text-sm"
                                        placeholder="xoxb-..."
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-neutral-700 mb-2">Signing Secret *</label>
                                    <input
                                        type="text"
                                        name="slackSigningSecret"
                                        value={formData.slackSigningSecret}
                                        onChange={handleChange}
                                        required
                                        className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-accent-teal focus:border-transparent font-mono text-sm"
                                        placeholder="your-signing-secret"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-neutral-700 mb-2">App Token *</label>
                                    <input
                                        type="text"
                                        name="slackAppToken"
                                        value={formData.slackAppToken}
                                        onChange={handleChange}
                                        required
                                        className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-accent-teal focus:border-transparent font-mono text-sm"
                                        placeholder="xapp-..."
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Discord 설정 */}
                        <div className="border-t border-neutral-200 pt-6">
                            <h3 className="text-lg font-semibold text-neutral-900 mb-4">💬 Discord 설정</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-neutral-700 mb-2">Server 이름 *</label>
                                    <input
                                        type="text"
                                        name="discordServerName"
                                        value={formData.discordServerName}
                                        onChange={handleChange}
                                        required
                                        className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-accent-teal focus:border-transparent"
                                        placeholder="예: My Discord Server"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-neutral-700 mb-2">Webhook URL *</label>
                                    <input
                                        type="url"
                                        name="discordWebhookUrl"
                                        value={formData.discordWebhookUrl}
                                        onChange={handleChange}
                                        required
                                        className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-accent-teal focus:border-transparent font-mono text-sm"
                                        placeholder="https://discord.com/api/webhooks/..."
                                    />
                                </div>
                            </div>
                        </div>

                        {/* 버튼 */}
                        <div className="flex gap-4 pt-6">
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex-1 bg-accent-teal hover:opacity-90 text-white font-semibold px-6 py-3 rounded-lg transition-all shadow-lg disabled:opacity-50"
                            >
                                {loading ? '생성 중...' : '팀 만들기'}
                            </button>
                            <Link
                                href="/dashboard"
                                className="px-6 py-3 border border-neutral-300 text-neutral-700 font-semibold rounded-lg hover:bg-neutral-50 transition-colors"
                            >
                                취소
                            </Link>
                        </div>
                    </form>
                </div>
            </main>
        </div>
    );
}
