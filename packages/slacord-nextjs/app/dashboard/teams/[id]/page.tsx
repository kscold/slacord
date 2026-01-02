'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { teamApi } from '@/lib/api-client';

interface Team {
    _id: string;
    name: string;
    description?: string;
    slackConfig: {
        channelId: string;
        channelName: string;
        workspaceName: string;
    };
    discordConfig: {
        channelId: string;
        channelName: string;
        serverName: string;
    };
    isActive: boolean;
    createdAt: string;
}

interface Message {
    messageId: string;
    content: string;
    username: string;
    timestamp: string;
    source: 'slack' | 'discord';
}

export default function TeamDetailPage() {
    const params = useParams();
    const router = useRouter();
    const teamId = params.id as string;

    const [team, setTeam] = useState<Team | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        fetchTeamDetail();
        fetchMessages();

        // 5초마다 메시지 자동 새로고침
        const interval = setInterval(async () => {
            const shouldContinue = await fetchMessages();

            // 인증 실패 시 폴링 중지
            if (shouldContinue === false) {
                clearInterval(interval);
                console.log('인증 실패로 폴링이 중지되었습니다.');
            }
        }, 5000);

        return () => clearInterval(interval);
    }, [teamId]);

    useEffect(() => {
        // 새 메시지가 추가되면 자동 스크롤
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const fetchTeamDetail = async () => {
        try {
            const response = await fetch(`http://localhost:8082/api/teams/${teamId}`, {
                credentials: 'include',
            });

            if (response.ok) {
                const data = await response.json();
                setTeam(data.data);
            }
        } catch (error) {
            console.error('Failed to fetch team:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchMessages = async () => {
        setLoadingMessages(true);
        try {
            const response = await fetch(`http://localhost:8082/api/messages?teamId=${teamId}&limit=50`, {
                credentials: 'include',
            });

            // 인증 실패 시 폴링 중지 (세션 만료)
            if (response.status === 401) {
                console.log('세션이 만료되었습니다. 폴링을 중지합니다.');
                setMessages([]);
                return false; // 폴링 중지 신호
            }

            if (response.ok) {
                const data = await response.json();
                console.log('Messages API Response:', data); // 디버깅용

                // API 응답 구조: { messages: [...], hasMore: boolean }
                setMessages(data.messages || []);
            }

            return true; // 폴링 계속
        } catch (error) {
            console.error('Failed to fetch messages:', error);
            return true; // 네트워크 에러는 재시도
        } finally {
            setLoadingMessages(false);
        }
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!newMessage.trim()) {
            return;
        }

        setSending(true);

        try {
            // JWT 토큰에서 사용자 정보 가져오기 (백엔드에서 자동 처리)
            const response = await fetch('http://localhost:8082/api/messages', {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    teamId,
                    content: newMessage,
                }),
            });

            if (response.ok) {
                setNewMessage('');
                // 메시지 전송 후 즉시 새로고침
                setTimeout(() => fetchMessages(), 1000);
            } else {
                const errorData = await response.json();
                alert(`메시지 전송 실패: ${errorData.message || '알 수 없는 오류'}`);
            }
        } catch (error) {
            console.error('Failed to send message:', error);
            alert('메시지 전송 중 오류가 발생했습니다.');
        } finally {
            setSending(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-bg-primary">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-slack-green border-t-transparent"></div>
            </div>
        );
    }

    if (!team) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-bg-primary">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-white mb-4">채널을 찾을 수 없습니다</h1>
                    <Link href="/dashboard" className="text-slack-green hover:underline">
                        대시보드로 돌아가기
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex bg-bg-primary">
            {/* Sidebar */}
            <aside className="w-64 bg-bg-secondary border-r border-border-primary flex flex-col">
                <div className="p-6 border-b border-border-primary">
                    <Link href="/" className="flex items-center gap-3">
                        <Image
                            src="/assets/slacord-logo.jpeg"
                            alt="Slacord Logo"
                            width={40}
                            height={40}
                            className="rounded-xl ring-2 ring-slack-green/30"
                        />
                        <div>
                            <h1 className="text-xl font-bold text-white">Slacord</h1>
                            <p className="text-xs text-text-tertiary mt-0.5">메시지 백업 대시보드</p>
                        </div>
                    </Link>
                </div>

                <nav className="flex-1 p-4 space-y-1">
                    <Link
                        href="/dashboard"
                        className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-bg-hover text-text-secondary hover:text-white transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                            />
                        </svg>
                        <span className="font-medium">대시보드</span>
                    </Link>
                </nav>

                <div className="p-4 border-t border-border-primary text-xs text-text-tertiary">
                    <p className="font-semibold text-slack-green">v1.0.0</p>
                    <p className="mt-1">90일 제한 없는 무료 백업</p>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col">
                {/* Header */}
                <div className="bg-bg-secondary border-b border-border-primary p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-bold text-white">#{team.name}</h2>
                            <p className="text-text-secondary mt-1">{team.description || '설명 없음'}</p>
                        </div>
                        <div className="flex gap-4 text-sm">
                            <div className="bg-bg-tertiary rounded-lg px-4 py-2">
                                <p className="text-text-tertiary">Slack</p>
                                <p className="font-medium text-slack-green">{team.slackConfig.channelName}</p>
                            </div>
                            <div className="bg-bg-tertiary rounded-lg px-4 py-2">
                                <p className="text-text-tertiary">Discord</p>
                                <p className="font-medium text-discord-blue">{team.discordConfig.channelName}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    {loadingMessages && messages.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-slack-green border-t-transparent"></div>
                            <p className="text-text-secondary mt-4">메시지 로딩 중...</p>
                        </div>
                    ) : messages.length === 0 ? (
                        <div className="text-center py-16">
                            <div className="text-6xl mb-4">💬</div>
                            <h3 className="text-xl font-semibold text-white mb-2">아직 메시지가 없습니다</h3>
                            <p className="text-text-secondary">첫 메시지를 보내보세요!</p>
                        </div>
                    ) : (
                        messages.map((msg, index) => {
                            // **username**: content 형식 파싱
                            const usernameMatch = msg.content.match(/^\*\*(.+?)\*\*:\s*/);
                            const displayUsername = usernameMatch ? usernameMatch[1] : msg.username;
                            const displayContent = usernameMatch
                                ? msg.content.replace(/^\*\*(.+?)\*\*:\s*/, '')
                                : msg.content;

                            return (
                                <div
                                    key={`${msg.messageId}-${index}`}
                                    className="flex gap-3 hover:bg-bg-secondary p-3 rounded-lg transition-colors"
                                >
                                    <div className="w-10 h-10 rounded-full bg-slack-green flex items-center justify-center text-white font-bold">
                                        {displayUsername[0].toUpperCase()}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-baseline gap-2">
                                            <span className="font-semibold text-white">{displayUsername}</span>
                                            <span className="text-xs text-text-tertiary">
                                                {new Date(msg.timestamp).toLocaleString('ko-KR')}
                                            </span>
                                            <span
                                                className={`text-xs px-2 py-0.5 rounded ${
                                                    msg.source === 'slack'
                                                        ? 'bg-slack-green/20 text-slack-green'
                                                        : 'bg-discord-blue/20 text-discord-blue'
                                                }`}
                                            >
                                                {msg.source === 'slack' ? 'Slack' : 'Discord'}
                                            </span>
                                        </div>
                                        <p className="text-text-primary mt-1">{displayContent}</p>
                                    </div>
                                </div>
                            );
                        })
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Message Input */}
                <div className="bg-bg-secondary border-t border-border-primary p-4">
                    <form onSubmit={handleSendMessage}>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                placeholder="메시지를 입력하세요... (로그인한 사용자명으로 전송됩니다)"
                                disabled={sending}
                                className="flex-1 px-4 py-3 bg-bg-tertiary border border-border-primary rounded-lg text-white placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-slack-green disabled:opacity-50"
                            />
                            <button
                                type="submit"
                                disabled={sending || !newMessage.trim()}
                                className="px-6 py-3 bg-slack-green hover:bg-slack-green/90 disabled:bg-bg-tertiary disabled:text-text-muted text-white font-semibold rounded-lg transition-colors"
                            >
                                {sending ? '전송 중...' : '전송'}
                            </button>
                        </div>
                    </form>
                </div>
            </main>
        </div>
    );
}
