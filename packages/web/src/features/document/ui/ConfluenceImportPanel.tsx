'use client';

import { useConfluenceImport } from '../model/useConfluenceImport';

interface Props {
    teamId: string;
    onImported: () => Promise<void>;
}

export function ConfluenceImportPanel({ teamId, onImported }: Props) {
    const importer = useConfluenceImport(teamId, onImported);

    return (
        <section className="rounded-[24px] border border-border-primary bg-bg-secondary p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                    <p className="text-xs uppercase tracking-[0.22em] text-brand-200">Confluence Import</p>
                    <h3 className="mt-2 text-xl font-semibold text-white">Confluence space 본문까지 전부 가져오기</h3>
                    <p className="mt-2 text-sm leading-7 text-text-secondary">Atlassian email, API token, space key를 넣으면 페이지 본문과 부모-자식 구조를 문서 트리로 동기화함.</p>
                </div>
                <button onClick={importer.submit} disabled={importer.loading} className="rounded-full bg-brand-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-400 disabled:opacity-40">
                    {importer.loading ? '가져오는 중...' : '전체 가져오기'}
                </button>
            </div>
            <div className="mt-5 grid gap-3 md:grid-cols-2">
                <input value={importer.form.siteUrl} onChange={(event) => importer.updateField('siteUrl', event.target.value)} placeholder="https://company.atlassian.net" className="rounded-2xl border border-border-primary bg-bg-tertiary px-4 py-3 text-sm text-white outline-none" />
                <input value={importer.form.email} onChange={(event) => importer.updateField('email', event.target.value)} placeholder="Atlassian email" className="rounded-2xl border border-border-primary bg-bg-tertiary px-4 py-3 text-sm text-white outline-none" />
                <input value={importer.form.apiToken} onChange={(event) => importer.updateField('apiToken', event.target.value)} placeholder="API token" className="rounded-2xl border border-border-primary bg-bg-tertiary px-4 py-3 text-sm text-white outline-none" />
                <input value={importer.form.spaceKey} onChange={(event) => importer.updateField('spaceKey', event.target.value.toUpperCase())} placeholder="BREEDER" className="rounded-2xl border border-border-primary bg-bg-tertiary px-4 py-3 text-sm text-white outline-none" />
                <input value={importer.form.rootPageId} onChange={(event) => importer.updateField('rootPageId', event.target.value)} placeholder="특정 루트 page id만 가져오려면 입력" className="rounded-2xl border border-border-primary bg-bg-tertiary px-4 py-3 text-sm text-white outline-none md:col-span-2" />
            </div>
            {importer.message ? <p className="mt-4 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-200">{importer.message}</p> : null}
            {importer.error ? <p className="mt-4 rounded-2xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-200">{importer.error}</p> : null}
        </section>
    );
}
