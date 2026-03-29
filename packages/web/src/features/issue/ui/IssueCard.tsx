import { Draggable } from '@hello-pangea/dnd';
import type { Issue, IssuePriority } from '@/src/entities/issue/types';
import type { TeamMemberSummary } from '@/src/entities/team/types';
import { getAvatarColor } from '@/src/shared/lib/avatar';

const PRIORITY_COLORS: Record<IssuePriority, string> = {
    low: 'text-text-tertiary border-text-tertiary/30',
    medium: 'text-blue-400 border-blue-400/30',
    high: 'text-yellow-400 border-yellow-400/30',
    urgent: 'text-red-400 border-red-400/30',
};

const PRIORITY_LABELS: Record<IssuePriority, string> = {
    low: '낮음',
    medium: '보통',
    high: '높음',
    urgent: '긴급',
};

interface Props {
    issue: Issue;
    index: number;
    members: TeamMemberSummary[];
    onClick: (issue: Issue) => void;
}

export function IssueCard({ issue, index, members, onClick }: Props) {
    const priorityClass = PRIORITY_COLORS[issue.priority];
    const assignees = members.filter((m) => issue.assigneeIds.includes(m.userId));

    return (
        <Draggable draggableId={issue.id} index={index}>
            {(provided, snapshot) => (
                <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    onClick={() => onClick(issue)}
                    className={`w-full text-left bg-[#1e1814] hover:bg-bg-hover border border-border-primary rounded-lg p-3 transition-colors cursor-grab active:cursor-grabbing ${snapshot.isDragging ? 'shadow-xl rotate-[2deg] border-[rgba(201,162,114,0.35)]' : ''}`}
                >
                    <p className="text-sm text-white font-medium mb-2 line-clamp-2">{issue.title}</p>
                    <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className={`text-xs border rounded-full px-2 py-0.5 ${priorityClass}`}>
                                {PRIORITY_LABELS[issue.priority]}
                            </span>
                            {issue.labels.slice(0, 2).map((label) => (
                                <span key={label} className="text-xs bg-slack-green/10 text-slack-green border border-slack-green/20 rounded-full px-2 py-0.5">
                                    {label}
                                </span>
                            ))}
                        </div>
                        {assignees.length > 0 && (
                            <div className="flex -space-x-1.5 shrink-0">
                                {assignees.slice(0, 3).map((m) => {
                                    const name = m.user?.username ?? m.userId.slice(-4);
                                    return (
                                        <div
                                            key={m.userId}
                                            title={name}
                                            className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold text-white border-2 border-[#1e1814]"
                                            style={{ backgroundColor: getAvatarColor(m.userId) }}
                                        >
                                            {name.slice(0, 1).toUpperCase()}
                                        </div>
                                    );
                                })}
                                {assignees.length > 3 && (
                                    <div className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold text-text-tertiary bg-bg-tertiary border-2 border-[#1e1814]">
                                        +{assignees.length - 3}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </Draggable>
    );
}
