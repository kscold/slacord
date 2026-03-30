'use client';

import { use } from 'react';
import { DragDropContext, type DropResult } from '@hello-pangea/dnd';
import { KanbanColumn } from '@/src/features/issue/ui/KanbanColumn';
import { IssueModal } from '@/src/features/issue/ui/IssueModal';
import { IssueBoardFilters } from '@/src/features/issue/ui/IssueBoardFilters';
import type { IssueStatus } from '@/src/entities/issue/types';
import { ISSUE_STATUS_LABELS } from '@/src/entities/issue/types';
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
            <div className="flex items-center justify-between px-6 py-4 border-b border-border-primary shrink-0">
                <h2 className="text-xl font-bold text-white">이슈 트래커</h2>
                <button
                    onClick={() => { board.setCreateStatus('todo'); board.setShowCreate(true); }}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slack-green text-white text-sm font-medium hover:bg-slack-green/90 transition-colors"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    이슈 생성
                </button>
            </div>
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

            <div className="flex-1 overflow-x-auto p-6">
                <DragDropContext onDragEnd={handleDragEnd}>
                    <div className="flex gap-4 h-full">
                        {COLUMNS.map((status) => (
                            <KanbanColumn
                                key={status}
                                status={status}
                                label={ISSUE_STATUS_LABELS[status]}
                                issues={board.issuesByStatus[status]}
                                members={board.members}
                                onCardClick={board.setSelectedIssue}
                                onAddClick={() => { board.setCreateStatus(status); board.setShowCreate(true); }}
                            />
                        ))}
                    </div>
                </DragDropContext>
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
