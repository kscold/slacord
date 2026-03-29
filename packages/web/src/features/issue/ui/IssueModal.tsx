'use client';

import { useState } from 'react';
import type { Issue, IssuePriority, IssueStatus } from '@/src/entities/issue/types';
import type { TeamMemberSummary } from '@/src/entities/team/types';
import { getAvatarColor } from '@/src/shared/lib/avatar';
import { PRIORITIES, PRIORITY_LABELS, STATUSES, STATUS_LABELS } from '../lib/issue.constants';

interface CreateProps {
    mode: 'create';
    teamId: string;
    members?: TeamMemberSummary[];
    onSubmit: (data: { title: string; description?: string; priority: IssuePriority; assigneeIds?: string[] }) => void;
    onClose: () => void;
}

interface EditProps {
    mode: 'edit';
    issue: Issue;
    members?: TeamMemberSummary[];
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
    const [assigneeIds, setAssigneeIds] = useState<string[]>(isEdit ? (props.issue.assigneeIds ?? []) : []);
    const [showAssignees, setShowAssignees] = useState(false);
    const members = props.members ?? [];

    const toggleAssignee = (userId: string) => {
        setAssigneeIds((prev) => prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) return;
        if (isEdit) {
            props.onSubmit({ title, description, priority, status, assigneeIds });
        } else {
            props.onSubmit({ title, description, priority, assigneeIds });
        }
        props.onClose();
    };

    const selectedMembers = members.filter((m) => assigneeIds.includes(m.userId));

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md" onClick={props.onClose}>
            <form
                onClick={(e) => e.stopPropagation()}
                onSubmit={handleSubmit}
                className="bg-[#1e1814] border border-[rgba(201,162,114,0.25)] rounded-2xl p-6 w-full max-w-md shadow-2xl max-h-[85vh] overflow-y-auto"
            >
                <h3 className="text-lg font-bold text-white mb-4">{isEdit ? '이슈 수정' : '이슈 생성'}</h3>

                <label className="block text-xs text-text-tertiary mb-1">제목 *</label>
                <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-bg-primary border border-border-primary rounded-lg px-3 py-2 text-sm text-white mb-3 focus:outline-none focus:border-[#d6b08a]/60"
                    placeholder="이슈 제목"
                    required
                />

                <label className="block text-xs text-text-tertiary mb-1">설명</label>
                <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full bg-bg-primary border border-border-primary rounded-lg px-3 py-2 text-sm text-white mb-3 focus:outline-none focus:border-[#d6b08a]/60 resize-none"
                    rows={3}
                    placeholder="이슈 설명 (선택)"
                />

                <div className="flex gap-3 mb-3">
                    <div className="flex-1">
                        <label className="block text-xs text-text-tertiary mb-1">우선순위</label>
                        <select
                            value={priority}
                            onChange={(e) => setPriority(e.target.value as IssuePriority)}
                            className="w-full bg-bg-primary border border-border-primary rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#d6b08a]/60"
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
                                className="w-full bg-bg-primary border border-border-primary rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#d6b08a]/60"
                            >
                                {STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
                            </select>
                        </div>
                    )}
                </div>

                {/* 담당자 선택 */}
                {members.length > 0 && (
                    <div className="mb-4">
                        <label className="block text-xs text-text-tertiary mb-1">담당자</label>
                        <button
                            type="button"
                            onClick={() => setShowAssignees(!showAssignees)}
                            className="w-full flex items-center gap-2 bg-bg-primary border border-border-primary rounded-lg px-3 py-2 text-sm text-left transition hover:border-[#d6b08a]/40"
                        >
                            {selectedMembers.length > 0 ? (
                                <div className="flex items-center gap-1.5 flex-wrap">
                                    {selectedMembers.map((m) => {
                                        const name = m.user?.username ?? m.userId.slice(-4);
                                        return (
                                            <span key={m.userId} className="flex items-center gap-1 rounded-full bg-bg-tertiary px-2 py-0.5 text-xs text-white">
                                                <span className="w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold text-white" style={{ backgroundColor: getAvatarColor(m.userId) }}>
                                                    {name.slice(0, 1).toUpperCase()}
                                                </span>
                                                {name}
                                            </span>
                                        );
                                    })}
                                </div>
                            ) : (
                                <span className="text-text-tertiary">담당자 선택...</span>
                            )}
                        </button>
                        {showAssignees && (
                            <div className="mt-1 max-h-40 overflow-y-auto rounded-lg border border-border-primary bg-bg-primary">
                                {members.map((m) => {
                                    const name = m.user?.username ?? m.userId.slice(-4);
                                    const selected = assigneeIds.includes(m.userId);
                                    return (
                                        <button
                                            key={m.userId}
                                            type="button"
                                            onClick={() => toggleAssignee(m.userId)}
                                            className={`flex w-full items-center gap-2.5 px-3 py-2 text-sm transition-colors ${selected ? 'bg-white/8 text-white' : 'text-text-secondary hover:bg-white/5'}`}
                                        >
                                            <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0" style={{ backgroundColor: getAvatarColor(m.userId) }}>
                                                {name.slice(0, 1).toUpperCase()}
                                            </div>
                                            <span className="flex-1 text-left">{name}</span>
                                            {selected && (
                                                <svg className="w-4 h-4 text-slack-green shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                </svg>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}

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
