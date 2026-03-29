'use client';

import { useState } from 'react';
import type { Issue, IssuePriority, IssueStatus } from '@/src/entities/issue/types';
import { PRIORITIES, PRIORITY_LABELS, STATUSES, STATUS_LABELS } from '../lib/issue.constants';

interface CreateProps {
    mode: 'create';
    teamId: string;
    onSubmit: (data: { title: string; description?: string; priority: IssuePriority }) => void;
    onClose: () => void;
}

interface EditProps {
    mode: 'edit';
    issue: Issue;
    onSubmit: (data: Partial<Issue>) => void;
    onClose: () => void;
}

type Props = CreateProps | EditProps;

export function IssueModal(props: Props) {
    const isEdit = props.mode === 'edit';
    const [title, setTitle] = useState(isEdit ? props.issue.title : '');
    const [description, setDescription] = useState(isEdit ? (props.issue.description ?? '') : '');
    const [priority, setPriority] = useState<IssuePriority>(isEdit ? props.issue.priority : 'medium');
    const [status, setStatus] = useState<IssueStatus>(isEdit ? props.issue.status : 'todo');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) return;
        props.onSubmit(isEdit ? { title, description, priority, status } : { title, description, priority });
        props.onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md" onClick={props.onClose}>
            <form
                onClick={(e) => e.stopPropagation()}
                onSubmit={handleSubmit}
                className="bg-[#1e1814] border border-[rgba(201,162,114,0.25)] rounded-2xl p-6 w-full max-w-md shadow-2xl"
            >
                <h3 className="text-lg font-bold text-white mb-4">{isEdit ? '이슈 수정' : '이슈 생성'}</h3>

                <label className="block text-xs text-text-tertiary mb-1">제목 *</label>
                <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-bg-primary border border-border-primary rounded-lg px-3 py-2 text-sm text-white mb-3 focus:outline-none focus:border-slack-green/50"
                    placeholder="이슈 제목"
                    required
                />

                <label className="block text-xs text-text-tertiary mb-1">설명</label>
                <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full bg-bg-primary border border-border-primary rounded-lg px-3 py-2 text-sm text-white mb-3 focus:outline-none focus:border-slack-green/50 resize-none"
                    rows={3}
                    placeholder="이슈 설명 (선택)"
                />

                <div className="flex gap-3 mb-4">
                    <div className="flex-1">
                        <label className="block text-xs text-text-tertiary mb-1">우선순위</label>
                        <select
                            value={priority}
                            onChange={(e) => setPriority(e.target.value as IssuePriority)}
                            className="w-full bg-bg-primary border border-border-primary rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-slack-green/50"
                        >
                            {PRIORITIES.map((p) => <option key={p} value={p}>{PRIORITY_LABELS[p]}</option>)}
                        </select>
                    </div>
                    {isEdit && (
                        <div className="flex-1">
                            <label className="block text-xs text-text-tertiary mb-1">상태</label>
                            <select
                                value={status}
                                onChange={(e) => setStatus(e.target.value as IssueStatus)}
                                className="w-full bg-bg-primary border border-border-primary rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-slack-green/50"
                            >
                                {STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
                            </select>
                        </div>
                    )}
                </div>

                <div className="flex gap-3">
                    <button type="button" onClick={props.onClose} className="flex-1 py-2 rounded-lg border border-border-primary text-text-secondary hover:text-white hover:bg-bg-hover transition-colors text-sm">
                        취소
                    </button>
                    <button type="submit" className="flex-1 py-2 rounded-lg bg-slack-green text-white hover:bg-slack-green/90 transition-colors text-sm font-medium">
                        {isEdit ? '저장' : '생성'}
                    </button>
                </div>
            </form>
        </div>
    );
}
