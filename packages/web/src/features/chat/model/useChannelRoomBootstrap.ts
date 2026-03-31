'use client';

import { useEffect, useRef, useState } from 'react';
import { authApi, channelApi, messageApi, teamApi } from '@/lib/api-client';
import { resolveChannelLabel } from '@/src/entities/channel/lib/resolveChannelLabel';
import type { Channel } from '@/src/entities/channel/types';
import type { Message } from '@/src/entities/message/types';
import type { TeamMemberSummary } from '@/src/entities/team/types';
import type { User } from '@/src/entities/user/types';

interface ChatBootstrapActions {
    reset: () => void;
    setLoading: (value: boolean) => void;
    setMessages: (messages: Message[]) => void;
}

interface Props {
    teamId: string;
    channelId: string;
    reset: ChatBootstrapActions['reset'];
    setLoading: ChatBootstrapActions['setLoading'];
    setMessages: ChatBootstrapActions['setMessages'];
}

export function useChannelRoomBootstrap({ teamId, channelId, reset, setLoading, setMessages }: Props) {
    const [channel, setChannel] = useState<Channel | null>(null);
    const [channelLabel, setChannelLabel] = useState('general');
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [members, setMembers] = useState<TeamMemberSummary[]>([]);
    const channelLabelRef = useRef('general');
    const currentUserIdRef = useRef('');

    useEffect(() => {
        let active = true;
        reset();
        setLoading(true);

        Promise.all([authApi.getMe(), messageApi.getMessages(channelId), channelApi.getChannels(teamId), teamApi.getMembers(teamId)])
            .then(([meRes, messageRes, channelRes, memberRes]) => {
                if (!active) return;

                if (meRes.success && meRes.data) {
                    const user = meRes.data as User;
                    currentUserIdRef.current = user.id;
                    setCurrentUser(user);
                }

                if (messageRes.success && Array.isArray(messageRes.data)) {
                    setMessages(messageRes.data as Message[]);
                }

                const teamMembers = memberRes.success && Array.isArray(memberRes.data) ? (memberRes.data as TeamMemberSummary[]) : [];
                setMembers(teamMembers);

                if (channelRes.success && Array.isArray(channelRes.data)) {
                    const activeChannel = (channelRes.data as Channel[]).find((item) => item.id === channelId) ?? null;
                    const label = activeChannel ? resolveChannelLabel(activeChannel, teamMembers, currentUserIdRef.current) : 'general';
                    setChannel(activeChannel);
                    setChannelLabel(label);
                    channelLabelRef.current = label;
                }
            })
            .finally(() => {
                if (active) setLoading(false);
            });

        return () => {
            active = false;
        };
    }, [channelId, reset, setLoading, setMessages, teamId]);

    return {
        channel,
        channelLabel,
        channelLabelRef,
        currentUser,
        currentUserIdRef,
        members,
    };
}
