'use client';

import { useEffect, useState } from 'react';
import { use } from 'react';
import { DragDropContext, type DropResult } from '@hello-pangea/dnd';
import { KanbanColumn } from '@/src/features/issue/ui/KanbanColumn';
import { IssueModal } from '@/src/features/issue/ui/IssueModal';
import { useIssueStore } from '@/src/features/issue/model/issue.store';
import { issueApi, teamApi } from '@/lib/api-client';
import type { Issue, IssueStatus, IssuePriority } from '@/src/entities/issue/types';
import { ISSUE_STATUS_LABELS } from '@/src/entities/issue/types';
import type { TeamMemberSummary } from '@/src/entities/team/types';

const COLUMNS: IssueStatus[] = ['todo', 'in_progress', 'in_review', 'done'];

interface Props {
    params: Promise<{ teamId: string }>;
}

export default function IssuesPage({ params }: Props) {
    const { teamId } = use(params);
    const { issues, setIssues, addIssue, updateIssue, removeIssue, byStatus } = useIssueStore();
    const [members, setMembers] = useState<TeamMemberSummary[]>([]);
    const [showCreate, setShowCreate] = useState(false);
    const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
    const [createStatus, setCreateStatus] = useState<IssueStatus>('todo');

    useEffect(() => {
        Promise.all([
            issueApi.getIssues(teamId),
            teamApi.getMembers(teamId),
        ]).then(([issueRes, memberRes]) => {
            if (issueRes.success && Array.isArray(issueRes.data)) setIssues(issueRes.data as Issue[]);
            if (memberRes.success && Array.isArray(memberRes.data)) setMembers(memberRes.data as TeamMemberSummary[]);
        });
    }, [teamId]);

    const handleCreate = async (data: { title: string; description?: string; priority: IssuePriority; assigneeIds?: string[] }) => {
        const res = await issueApi.createIssue(teamId, { ...data, status: createStatus } as any);
        if (res.success && res.data) addIssue(res.data as Issue);
    };

    const handleUpdate = async (data: Partial<Issue>) => {
        if (!selectedIssue) return;
        const res = await issueApi.updateIssue(teamId, selectedIssue.id, data);
        if (res.success && res.data) updateIssue(selectedIssue.id, res.data as Issue);
    };

    const handleDelete = async (issueId: string) => {
        await issueApi.deleteIssue(teamId, issueId);
        removeIssue(issueId);
    };

    const handleDragEnd = async (result: DropResult) => {
        const { draggableId, destination, source } = result;
        if (!destination || destination.droppableId === source.droppableId) return;

        const newStatus = destination.droppableId as IssueStatus;
        // optimistic update
        const issue = issues.find((i) => i.id === draggableId);
        if (issue) updateIssue(draggableId, { ...issue, status: newStatus } as Issue);
        // persist
        await issueApi.updateIssue(teamId, draggableId, { status: newStatus });
    };

    return (
        <div className="h-full flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border-primary shrink-0">
                <h2 className="text-xl font-bold text-white">이슈 트래커</h2>
                <button
                    onClick={() => { setCreateStatus('todo'); setShowCreate(true); }}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slack-green text-white text-sm font-medium hover:bg-slack-green/90 transition-colors"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    이슈 생성
                </button>
            </div>

            <div className="flex-1 overflow-x-auto p-6">
                <DragDropContext onDragEnd={handleDragEnd}>
                    <div className="flex gap-4 h-full">
                        {COLUMNS.map((status) => (
                            <KanbanColumn
                                key={status}
                                status={status}
                                label={ISSUE_STATUS_LABELS[status]}
                                issues={byStatus(status)}
                                members={members}
                                onCardClick={(issue) => setSelectedIssue(issue)}
                                onAddClick={() => { setCreateStatus(status); setShowCreate(true); }}
                            />
                        ))}
                    </div>
                </DragDropContext>
            </div>

            {showCreate && (
                <IssueModal
                    mode="create"
                    teamId={teamId}
                    members={members}
                    onSubmit={handleCreate}
                    onClose={() => setShowCreate(false)}
                />
            )}
            {selectedIssue && (
                <IssueModal
                    mode="edit"
                    issue={selectedIssue}
                    members={members}
                    onSubmit={handleUpdate}
                    onClose={() => setSelectedIssue(null)}
                />
            )}
        </div>
    );
}
