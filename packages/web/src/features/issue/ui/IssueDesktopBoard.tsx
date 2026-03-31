import { DragDropContext, type DropResult } from '@hello-pangea/dnd';
import { KanbanColumn } from './KanbanColumn';
import type { IssueStatus } from '@/src/entities/issue/types';
import { ISSUE_STATUS_LABELS } from '@/src/entities/issue/types';
import type { TeamMemberSummary } from '@/src/entities/team/types';
import type { Issue } from '@/src/entities/issue/types';

interface Props {
    columns: IssueStatus[];
    issuesByStatus: Record<IssueStatus, Issue[]>;
    members: TeamMemberSummary[];
    onAddClick: (status: IssueStatus) => void;
    onCardClick: (issue: Issue) => void;
    onDragEnd: (result: DropResult) => void;
}

export function IssueDesktopBoard({ columns, issuesByStatus, members, onAddClick, onCardClick, onDragEnd }: Props) {
    return (
        <DragDropContext onDragEnd={onDragEnd}>
            <div className="flex h-full gap-4">
                {columns.map((status) => (
                    <KanbanColumn
                        key={status}
                        status={status}
                        label={ISSUE_STATUS_LABELS[status]}
                        issues={issuesByStatus[status]}
                        members={members}
                        onCardClick={onCardClick}
                        onAddClick={() => onAddClick(status)}
                    />
                ))}
            </div>
        </DragDropContext>
    );
}
