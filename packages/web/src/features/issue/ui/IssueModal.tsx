'use client';

import { useRef, useState } from 'react';
import type { Issue, IssuePriority, IssueStatus } from '@/src/entities/issue/types';
import type { TeamMemberSummary } from '@/src/entities/team/types';
import { IssueAssigneePicker } from './IssueAssigneePicker';
import { IssueModalFields } from './IssueModalFields';

interface CreateProps {
    initialTitle?: string;
    mode: 'create';
    readOnly?: boolean;
    teamId: string;
    members?: TeamMemberSummary[];
    onSubmit: (data: {
        title: string;
        description?: string;
        priority: IssuePriority;
        assigneeIds?: string[];
        labels?: string[];
    }) => void;
    onClose: () => void;
}

interface EditProps {
    mode: 'edit';
    issue: Issue;
    readOnly?: boolean;
    members?: TeamMemberSummary[];
    onSubmit: (data: Partial<Issue>) => void;
    onClose: () => void;
}

type Props = CreateProps | EditProps;

export function IssueModal(props: Props) {
    const isEdit = props.mode === 'edit';
    const [title, setTitle] = useState(isEdit ? props.issue.title : (props.initialTitle ?? ''));
    const [description, setDescription] = useState(isEdit ? (props.issue.description ?? '') : '');
    const [priority, setPriority] = useState<IssuePriority>(isEdit ? props.issue.priority : 'medium');
    const [status, setStatus] = useState<IssueStatus>(isEdit ? props.issue.status : 'todo');
    const [assigneeIds, setAssigneeIds] = useState<string[]>(isEdit ? (props.issue.assigneeIds ?? []) : []);
    const [labels, setLabels] = useState<string[]>(isEdit ? (props.issue.labels ?? []) : []);
    const [labelInput, setLabelInput] = useState('');
    const [showAssignees, setShowAssignees] = useState(false);
    const labelInputRef = useRef<HTMLInputElement>(null);
    const members = props.members ?? [];
    const readOnly = props.readOnly ?? false;

    const toggleAssignee = (userId: string) => {
        setAssigneeIds((prev) => prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]);
    };

    const addLabel = () => {
        const trimmed = labelInput.trim();
        if (!trimmed || labels.includes(trimmed)) {
            setLabelInput('');
            return;
        }
        setLabels((prev) => [...prev, trimmed]);
        setLabelInput('');
    };

    const removeLabel = (label: string) => {
        setLabels((prev) => prev.filter((l) => l !== label));
    };

    const handleLabelKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            addLabel();
        } else if (e.key === 'Backspace' && labelInput === '' && labels.length > 0) {
            setLabels((prev) => prev.slice(0, -1));
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (readOnly) {
            props.onClose();
            return;
        }
        if (!title.trim()) return;
        if (isEdit) {
            props.onSubmit({ title, description, priority, status, assigneeIds, labels });
        } else {
            props.onSubmit({ title, description, priority, assigneeIds, labels });
        }
        props.onClose();
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md"
            onClick={props.onClose}
        >
            <form
                onClick={(e) => e.stopPropagation()}
                onSubmit={handleSubmit}
                className="bg-[#1e1814] border border-[rgba(201,162,114,0.25)] rounded-2xl p-6 w-full max-w-md shadow-2xl max-h-[85vh] overflow-y-auto"
            >
                <h3 className="text-lg font-bold text-white mb-4">
                    {readOnly ? '이슈 보기' : isEdit ? '이슈 수정' : '이슈 생성'}
                </h3>
                <IssueModalFields
                    description={description}
                    isEdit={isEdit}
                    priority={priority}
                    readOnly={readOnly}
                    setDescription={setDescription}
                    setPriority={setPriority}
                    setStatus={setStatus}
                    setTitle={setTitle}
                    status={status}
                    title={title}
                />

                {/* 라벨 태그 입력 */}
                <div className="mb-4">
                    <label className="mb-1.5 block text-xs font-medium text-text-secondary">라벨</label>
                    {/* 태그 목록 + 입력창 */}
                    <div
                        className="flex min-h-[38px] flex-wrap items-center gap-1.5 rounded-lg border border-border-primary bg-bg-secondary px-2.5 py-1.5 focus-within:border-slack-green/50 cursor-text"
                        onClick={() => labelInputRef.current?.focus()}
                    >
                        {labels.map((label) => (
                            <span
                                key={label}
                                className="flex items-center gap-1 rounded-full border border-slack-green/20 bg-slack-green/10 px-2 py-0.5 text-xs text-slack-green"
                            >
                                {label}
                                {!readOnly && (
                                    <button
                                        type="button"
                                        onClick={(e) => { e.stopPropagation(); removeLabel(label); }}
                                        className="ml-0.5 text-slack-green/50 hover:text-slack-green transition-colors leading-none"
                                        aria-label={`${label} 라벨 제거`}
                                    >
                                        ×
                                    </button>
                                )}
                            </span>
                        ))}
                        {!readOnly && (
                            <input
                                ref={labelInputRef}
                                type="text"
                                value={labelInput}
                                onChange={(e) => setLabelInput(e.target.value)}
                                onKeyDown={handleLabelKeyDown}
                                onBlur={addLabel}
                                placeholder={labels.length === 0 ? '라벨 입력 후 Enter' : ''}
                                className="min-w-[120px] flex-1 bg-transparent text-xs text-white placeholder:text-text-tertiary outline-none"
                            />
                        )}
                    </div>
                    {!readOnly && (
                        <p className="mt-1 text-[11px] text-text-tertiary">
                            Enter로 추가 · Backspace로 마지막 라벨 삭제
                        </p>
                    )}
                </div>

                {members.length > 0 ? (
                    <IssueAssigneePicker
                        assigneeIds={assigneeIds}
                        disabled={readOnly}
                        members={members}
                        open={showAssignees}
                        onToggleAssignee={toggleAssignee}
                        onToggleOpen={() => setShowAssignees((current) => !current)}
                    />
                ) : null}

                <div className="flex gap-3 mt-2">
                    <button
                        type="button"
                        onClick={props.onClose}
                        className="flex-1 py-2 rounded-lg border border-border-primary text-text-secondary hover:text-white hover:bg-bg-hover transition-colors text-sm"
                    >
                        {readOnly ? '닫기' : '취소'}
                    </button>
                    {!readOnly ? (
                        <button
                            type="submit"
                            className="flex-1 py-2 rounded-lg bg-slack-green text-white hover:bg-slack-green/90 transition-colors text-sm font-medium"
                        >
                            {isEdit ? '저장' : '생성'}
                        </button>
                    ) : null}
                </div>
            </form>
        </div>
    );
}
