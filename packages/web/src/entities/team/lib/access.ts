import type { TeamMemberSummary } from '../types';

export function resolveCurrentTeamMember(
    members: TeamMemberSummary[],
    currentUserId: string,
) {
    return members.find((member) => member.userId === currentUserId) ?? null;
}

export function hasTeamWriteAccess(
    role: TeamMemberSummary['role'] | null | undefined,
) {
    return !!role && role !== 'guest';
}
