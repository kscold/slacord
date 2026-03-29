'use client';

import { useState } from 'react';
import { useDiscordImportSettings } from '../model/useDiscordImportSettings';

interface Props {
    teamId: string;
}

function DiscordHelpModal({ onClose }: { onClose: () => void }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md" onClick={onClose}>
            <div onClick={(e) => e.stopPropagation()} className="w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-2xl border border-[rgba(201,162,114,0.25)] bg-[#1e1814] p-6 shadow-2xl">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-white">Discord 임포트 가이드</h3>
                    <button onClick={onClose} className="text-text-tertiary hover:text-white transition-colors">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                <div className="space-y-5 text-sm text-text-secondary leading-relaxed">
                    <section>
                        <h4 className="text-white font-semibold mb-2">1단계: Discord 봇 생성</h4>
                        <ol className="list-decimal pl-5 space-y-1.5">
                            <li><a href="https://discord.com/developers/applications" target="_blank" rel="noopener noreferrer" className="text-[#61afef] underline">Discord Developer Portal</a> 접속</li>
                            <li><strong className="text-white">New Application</strong> 클릭 → 이름 입력 (예: "Slacord Import") → 만들기</li>
                            <li>왼쪽 메뉴에서 <strong className="text-white">Bot</strong> 클릭</li>
                            <li><strong className="text-white">Reset Token</strong> → 토큰 복사 (이 토큰은 한 번만 보여요!)</li>
                        </ol>
                    </section>

                    <section>
                        <h4 className="text-white font-semibold mb-2">2단계: 봇 권한 설정</h4>
                        <ol className="list-decimal pl-5 space-y-1.5">
                            <li>Bot 페이지에서 아래로 스크롤 → <strong className="text-white">Privileged Gateway Intents</strong></li>
                            <li>3개 모두 켜기:
                                <ul className="list-disc pl-5 mt-1 space-y-0.5 text-text-tertiary">
                                    <li>Presence Intent</li>
                                    <li>Server Members Intent</li>
                                    <li><strong className="text-[#e5c07b]">Message Content Intent</strong> (필수!)</li>
                                </ul>
                            </li>
                            <li><strong className="text-white">Save Changes</strong> 클릭</li>
                        </ol>
                    </section>

                    <section>
                        <h4 className="text-white font-semibold mb-2">3단계: 봇을 Discord 서버에 초대</h4>
                        <ol className="list-decimal pl-5 space-y-1.5">
                            <li>왼쪽 메뉴 → <strong className="text-white">OAuth2 → URL Generator</strong></li>
                            <li>Scopes에서 <strong className="text-white">bot</strong> 체크</li>
                            <li>Bot Permissions에서 체크:
                                <ul className="list-disc pl-5 mt-1 space-y-0.5 text-text-tertiary">
                                    <li>Read Messages/View Channels</li>
                                    <li>Read Message History</li>
                                </ul>
                            </li>
                            <li>하단 URL 복사 → 브라우저에서 열기 → 서버 선택 후 초대</li>
                        </ol>
                    </section>

                    <section>
                        <h4 className="text-white font-semibold mb-2">4단계: 서버 ID 복사</h4>
                        <ol className="list-decimal pl-5 space-y-1.5">
                            <li>Discord 설정 → 고급 → <strong className="text-white">개발자 모드</strong> 켜기</li>
                            <li>서버 이름 우클릭 → <strong className="text-white">서버 아이디 복사</strong></li>
                        </ol>
                    </section>

                    <section>
                        <h4 className="text-white font-semibold mb-2">5단계: 가져오기 실행</h4>
                        <ol className="list-decimal pl-5 space-y-1.5">
                            <li>아래 <strong className="text-white">Guild ID</strong>에 서버 아이디 붙여넣기</li>
                            <li><strong className="text-white">Bot Token</strong>에 봇 토큰 붙여넣기</li>
                            <li>특정 채널만 원하면 채널 ID를 쉼표로 구분 입력 (비우면 전체)</li>
                            <li><strong className="text-white">Discord 전체 가져오기</strong> 클릭</li>
                        </ol>
                    </section>

                    <div className="rounded-xl border border-[rgba(201,162,114,0.2)] bg-black/20 p-3 text-xs text-text-tertiary">
                        <p className="text-[#e5c07b] font-medium mb-1">참고</p>
                        <ul className="space-y-0.5">
                            <li>• 텍스트/뉴스/스레드 채널만 임포트 (음성 채널 제외)</li>
                            <li>• 봇 토큰은 서버에 저장되지 않아요</li>
                            <li>• 메시지가 많으면 시간이 좀 걸려요 (Discord API 속도 제한)</li>
                            <li>• 재실행 시 기존 메시지는 업데이트, 새 메시지만 추가됨</li>
                            <li>• 기존 봇이 있다면 새로 만들 필요 없이 그 봇 토큰을 써도 OK</li>
                        </ul>
                    </div>
                </div>

                <button onClick={onClose} className="mt-5 w-full rounded-lg bg-brand-500 py-2.5 text-sm font-semibold text-white hover:bg-brand-400 transition-colors">
                    이해했어요
                </button>
            </div>
        </div>
    );
}

export function DiscordImportPanel({ teamId }: Props) {
    const importer = useDiscordImportSettings(teamId);
    const [showHelp, setShowHelp] = useState(false);

    return (
        <section className="rounded-[28px] border border-border-primary bg-bg-secondary p-5 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="max-w-2xl">
                    <div className="flex items-center gap-2">
                        <p className="text-xs uppercase tracking-[0.24em] text-brand-200">Discord Import</p>
                        <button
                            onClick={() => setShowHelp(true)}
                            className="flex h-5 w-5 items-center justify-center rounded-full border border-brand-200/30 text-[11px] font-bold text-brand-200 hover:bg-brand-200/10 transition-colors"
                            title="임포트 가이드 보기"
                        >
                            ?
                        </button>
                    </div>
                    <h2 className="mt-3 text-lg font-semibold text-white sm:text-xl">Discord 채널과 대화 기록을 워크스페이스로 가져와요</h2>
                    <p className="mt-2 text-sm leading-7 text-text-secondary">
                        이미 운영 중인 Discord 서버가 있으면, 채널과 메시지 기록을 한 번에 옮길 수 있어요.
                        토큰은 저장하지 않고 가져오는 동안에만 사용해요.
                    </p>
                </div>
                <button
                    type="button"
                    onClick={importer.submit}
                    disabled={importer.saving}
                    className="min-h-12 rounded-2xl bg-brand-500 px-5 text-sm font-semibold text-white transition hover:bg-brand-400 disabled:opacity-50"
                >
                    {importer.saving ? '가져오는 중...' : 'Discord 전체 가져오기'}
                </button>
            </div>
            <div className="mt-6 grid gap-3 md:grid-cols-2">
                <input
                    value={importer.form.guildId}
                    onChange={(event) => importer.updateField('guildId', event.target.value)}
                    placeholder="Discord Guild ID"
                    className="rounded-2xl border border-border-primary bg-bg-primary px-4 py-3 text-sm text-white outline-none transition focus:border-[#d6b08a]/60"
                />
                <input
                    type="password"
                    value={importer.form.botToken}
                    onChange={(event) => importer.updateField('botToken', event.target.value)}
                    placeholder="Discord Bot Token"
                    className="rounded-2xl border border-border-primary bg-bg-primary px-4 py-3 text-sm text-white outline-none transition focus:border-[#d6b08a]/60"
                />
                <textarea
                    value={importer.form.channelIds}
                    onChange={(event) => importer.updateField('channelIds', event.target.value)}
                    placeholder="특정 채널만 가져오려면 Discord Channel ID를 , 로 구분해서 넣어 주세요. 비우면 전체 채널을 가져와요."
                    rows={3}
                    className="rounded-2xl border border-border-primary bg-bg-primary px-4 py-3 text-sm leading-6 text-white outline-none transition focus:border-[#d6b08a]/60 md:col-span-2"
                />
            </div>
            {importer.summary ? (
                <div className="mt-4 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100">
                    {importer.summary.guildName}에서 채널 {importer.summary.importedChannels}개, 메시지 {importer.summary.importedMessages}개를 가져왔어요.
                    이미 있던 메시지 {importer.summary.updatedMessages}개는 최신 상태로 맞췄어요.
                </div>
            ) : null}
            {importer.error ? (
                <div className="mt-4 rounded-2xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-200">
                    {importer.error}
                </div>
            ) : null}
            {showHelp && <DiscordHelpModal onClose={() => setShowHelp(false)} />}
        </section>
    );
}
