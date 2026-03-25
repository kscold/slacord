'use client';

import type { DocumentFull } from '@/src/entities/document/types';

interface Props {
    doc: DocumentFull;
    editing: boolean;
    onArchive: () => Promise<void>;
    onCancel: () => void;
    onEdit: () => void;
    onSave: () => Promise<void>;
    onTitleChange: (value: string) => void;
    title: string;
}

export function DocumentDetailHeader({ doc, editing, onArchive, onCancel, onEdit, onSave, onTitleChange, title }: Props) {
    return (
        <div className="mb-6 flex items-center justify-between gap-4">
            {editing ? (
                <input value={title} onChange={(event) => onTitleChange(event.target.value)} className="flex-1 border-b border-slack-green/50 bg-transparent text-2xl font-bold text-white focus:outline-none" />
            ) : (
                <div>
                    <h2 className="text-2xl font-bold text-white">{doc.title}</h2>
                    {doc.externalUrl ? <a href={doc.externalUrl} target="_blank" rel="noreferrer" className="mt-2 inline-flex text-xs text-brand-100 underline underline-offset-4">Confluence 원본 열기</a> : null}
                </div>
            )}
            <div className="flex shrink-0 gap-2">
                {editing ? (
                    <>
                        <button onClick={onCancel} className="rounded-lg border border-border-primary px-3 py-1.5 text-sm text-text-secondary transition hover:bg-bg-hover hover:text-white">취소</button>
                        <button onClick={() => void onSave()} className="rounded-lg bg-slack-green px-3 py-1.5 text-sm font-medium text-white transition hover:bg-slack-green/90">저장</button>
                    </>
                ) : (
                    <>
                        {doc.canEdit !== false ? <button onClick={onEdit} className="rounded-lg border border-border-primary px-3 py-1.5 text-sm text-text-secondary transition hover:bg-bg-hover hover:text-white">편집</button> : null}
                        {doc.canDelete !== false ? <button onClick={() => void onArchive()} className="rounded-lg border border-error/30 px-3 py-1.5 text-sm text-error transition hover:bg-error/10">삭제</button> : null}
                        {doc.visibility === 'restricted' ? <span className="rounded-full bg-warning/20 px-2 py-1 text-xs text-warning">제한 문서</span> : null}
                    </>
                )}
            </div>
        </div>
    );
}
