'use client';

import { useState } from 'react';
import type { Issue, IssuePriority, IssueStatus } from '@/src/entities/issue/types';
import type { TeamMemberSummary } from '@/src/entities/team/types';
import { IssueAssigneePicker } from './IssueAssigneePicker';
import { IssueModalFields } from './IssueModalFields';

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

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md" onClick={props.onClose}>
            <form
                onClick={(e) => e.stopPropagation()}
                onSubmit={handleSubmit}
                className="bg-[#1e1814] border border-[rgba(201,162,114,0.25)] rounded-2xl p-6 w-full max-w-md shadow-2xl max-h-[85vh] overflow-y-auto"
            >
                <h3 className="text-lg font-bold text-white mb-4">{isEdit ? '이슈 수정' : '이슈 생성'}</h3>
                <IssueModalFields
                    description={description}
                    isEdit={isEdit}
                    priority={priority}
                    setDescription={setDescription}
                    setPriority={setPriority}
                    setStatus={setStatus}
                    setTitle={setTitle}
                    status={status}
                    title={title}
                />
                {members.length > 0 ? (
                    <IssueAssigneePicker
                        assigneeIds={assigneeIds}
                        members={members}
                        open={showAssignees}
                        onToggleAssignee={toggleAssignee}
                        onToggleOpen={() => setShowAssignees((current) => !current)}
                    />
                ) : null}

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
