'use client';

import { useState } from 'react';
import { useDiscordImportSettings } from '../model/useDiscordImportSettings';
import { DiscordImportHelpModal } from './DiscordImportHelpModal';

interface Props {
    teamId: string;
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
                    disabled={importer.saving || !importer.form.guildId.trim() || !importer.form.botToken.trim()}
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
            {showHelp && <DiscordImportHelpModal onClose={() => setShowHelp(false)} />}
        </section>
    );
}
