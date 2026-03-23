import type { Channel } from '../types';
import type { TeamMemberSummary } from '@/src/entities/team/types';

export function resolveChannelLabel(channel: Channel, members: TeamMemberSummary[], currentUserId: string) {
    if (channel.type === 'dm') {
        const target = members.find((member) => member.userId !== currentUserId && channel.memberIds?.includes(member.userId));
        return target?.user?.username || 'Direct Message';
    }
    if (channel.type === 'group') {
        return channel.name || 'Small Group';
    }
    return channel.name;
}
