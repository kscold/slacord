'use client';

import { use } from 'react';
import type { DropResult } from '@hello-pangea/dnd';
import { IssueModal } from '@/src/features/issue/ui/IssueModal';
import { IssueBoardFilters } from '@/src/features/issue/ui/IssueBoardFilters';
import { IssueDesktopBoard } from '@/src/features/issue/ui/IssueDesktopBoard';
import { IssueBoardHeader } from '@/src/features/issue/ui/IssueBoardHeader';
import { IssueMobileSection } from '@/src/features/issue/ui/IssueMobileSection';
import type { IssueStatus } from '@/src/entities/issue/types';
import { useIssueBoard } from '@/src/features/issue/model/useIssueBoard';

const COLUMNS: IssueStatus[] = ['todo', 'in_progress', 'in_review', 'done'];

interface Props {
    params: Promise<{ teamId: string }>;
}

export default function IssuesPage({ params }: Props) {
    const { teamId } = use(params);
    const board = useIssueBoard(teamId);

    const handleDragEnd = async (result: DropResult) => {
        const { draggableId, destination, source } = result;
        if (!destination || destination.droppableId === source.droppableId) return;
        await board.handleMove(draggableId, destination.droppableId as IssueStatus);
    };

    return (
        <div className="h-full flex flex-col">
            <IssueBoardHeader onCreate={() => { board.setCreateStatus('todo'); board.setShowCreate(true); }} />
            <IssueBoardFilters
                query={board.query}
                assigneeId={board.assigneeId}
                status={board.statusFilter}
                members={board.members}
                onQueryChange={board.setQuery}
                onAssigneeChange={board.setAssigneeId}
                onStatusChange={board.setStatusFilter}
                onReset={() => {
                    board.setQuery('');
                    board.setAssigneeId('');
                    board.setStatusFilter('all');
                }}
            />

            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
                <div className="space-y-4 lg:hidden">
                    {COLUMNS.map((status) => (
                        <IssueMobileSection
                            key={status}
                            issues={board.issuesByStatus[status]}
                            members={board.members}
                            onAddClick={() => { board.setCreateStatus(status); board.setShowCreate(true); }}
                            onCardClick={board.setSelectedIssue}
                            status={status}
                        />
                    ))}
                </div>
                <div className="hidden h-full lg:block lg:overflow-x-auto">
                    <IssueDesktopBoard
                        columns={COLUMNS}
                        issuesByStatus={board.issuesByStatus}
                        members={board.members}
                        onAddClick={(status) => { board.setCreateStatus(status); board.setShowCreate(true); }}
                        onCardClick={board.setSelectedIssue}
                        onDragEnd={handleDragEnd}
                    />
                </div>
            </div>

            {board.showCreate && (
                <IssueModal
                    mode="create"
                    teamId={teamId}
                    members={board.members}
                    onSubmit={board.handleCreate}
                    onClose={() => board.setShowCreate(false)}
                />
            )}
            {board.selectedIssue && (
                <IssueModal
                    mode="edit"
                    issue={board.selectedIssue}
                    members={board.members}
                    onSubmit={board.handleUpdate}
                    onClose={() => board.setSelectedIssue(null)}
                />
            )}
        </div>
    );
}
