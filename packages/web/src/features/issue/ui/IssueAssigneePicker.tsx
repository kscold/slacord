'use client';

import { getAvatarColor } from '@/src/shared/lib/avatar';
import type { TeamMemberSummary } from '@/src/entities/team/types';

interface Props {
    assigneeIds: string[];
    members: TeamMemberSummary[];
    open: boolean;
    onToggleOpen: () => void;
    onToggleAssignee: (userId: string) => void;
}

export function IssueAssigneePicker({ assigneeIds, members, open, onToggleOpen, onToggleAssignee }: Props) {
    const selectedMembers = members.filter((member) => assigneeIds.includes(member.userId));

    return (
        <div className="mb-4">
            <label className="mb-1 block text-xs text-text-tertiary">담당자</label>
            <button
                type="button"
                onClick={onToggleOpen}
                className="flex w-full items-center gap-2 rounded-lg border border-border-primary bg-bg-primary px-3 py-2 text-left text-sm transition hover:border-[#d6b08a]/40"
            >
                {selectedMembers.length > 0 ? (
                    <div className="flex flex-wrap items-center gap-1.5">
                        {selectedMembers.map((member) => {
                            const name = member.user?.username ?? member.userId.slice(-4);
                            return (
                                <span key={member.userId} className="flex items-center gap-1 rounded-full bg-bg-tertiary px-2 py-0.5 text-xs text-white">
                                    <span
                                        className="h-4 w-4 rounded-full text-[8px] font-bold text-white flex items-center justify-center"
                                        style={{ backgroundColor: getAvatarColor(member.userId) }}
                                    >
                                        {name.slice(0, 1).toUpperCase()}
                                    </span>
                                    {name}
                                </span>
                            );
                        })}
                    </div>
                ) : (
                    <span className="text-text-tertiary">담당자를 선택해 주세요</span>
                )}
            </button>
            {open ? (
                <div className="mt-1 max-h-40 overflow-y-auto rounded-lg border border-border-primary bg-bg-primary">
                    {members.map((member) => {
                        const name = member.user?.username ?? member.userId.slice(-4);
                        const selected = assigneeIds.includes(member.userId);
                        return (
                            <button
                                key={member.userId}
                                type="button"
                                onClick={() => onToggleAssignee(member.userId)}
                                className={`flex w-full items-center gap-2.5 px-3 py-2 text-sm transition-colors ${selected ? 'bg-white/8 text-white' : 'text-text-secondary hover:bg-white/5'}`}
                            >
                                <div
                                    className="h-6 w-6 shrink-0 rounded-full text-[10px] font-bold text-white flex items-center justify-center"
                                    style={{ backgroundColor: getAvatarColor(member.userId) }}
                                >
                                    {name.slice(0, 1).toUpperCase()}
                                </div>
                                <span className="flex-1 text-left">{name}</span>
                                {selected ? (
                                    <svg className="h-4 w-4 shrink-0 text-slack-green" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                ) : null}
                            </button>
                        );
                    })}
                </div>
            ) : null}
        </div>
    );
}
