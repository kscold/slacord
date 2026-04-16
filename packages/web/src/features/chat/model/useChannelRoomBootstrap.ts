'use client';

import { useEffect, useRef, useState } from 'react';
import { messageApi } from '@/lib/api-client';
import { resolveChannelLabel } from '@/src/entities/channel/lib/resolveChannelLabel';
import type { Channel } from '@/src/entities/channel/types';
import type { Message } from '@/src/entities/message/types';
import type { TeamMemberSummary } from '@/src/entities/team/types';
import type { User } from '@/src/entities/user/types';
import { useTeamWorkspaceData } from '@/src/features/team/model/useTeamWorkspaceData';

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
    const workspace = useTeamWorkspaceData(teamId);
    const [channel, setChannel] = useState<Channel | null>(null);
    const [channelLabel, setChannelLabel] = useState('general');
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [initialMessageCount, setInitialMessageCount] = useState(0);
    const [members, setMembers] = useState<TeamMemberSummary[]>([]);
    const [messagesLoaded, setMessagesLoaded] = useState(false);
    const channelLabelRef = useRef('general');
    const currentUserIdRef = useRef('');

    useEffect(() => {
        let active = true;
        reset();
        setInitialMessageCount(0);
        setMessagesLoaded(false);

        messageApi
            .getMessages(channelId)
            .then((messageRes) => {
                if (!active) return;

                if (messageRes.success && Array.isArray(messageRes.data)) {
                    const nextMessages = messageRes.data as Message[];
                    setMessages(nextMessages);
                    setInitialMessageCount(nextMessages.length);
                }
                setMessagesLoaded(true);
            })
            .finally(() => {
                if (active) setMessagesLoaded(true);
            });

        return () => {
            active = false;
        };
    }, [channelId, reset, setMessages]);

    useEffect(() => {
        const nextUser = workspace.me ?? null;
        currentUserIdRef.current = nextUser?.id ?? '';
        setCurrentUser(nextUser);
        setMembers(workspace.members);

        const activeChannel = workspace.channels.find((item) => item.id === channelId) ?? null;
        const label = activeChannel
            ? resolveChannelLabel(activeChannel, workspace.members, nextUser?.id ?? '')
            : 'general';
        setChannel(activeChannel);
        setChannelLabel(label);
        channelLabelRef.current = label;
    }, [channelId, workspace.channels, workspace.me, workspace.members]);

    useEffect(() => {
        setLoading(workspace.isInitialLoading || !messagesLoaded);
    }, [messagesLoaded, setLoading, workspace.isInitialLoading]);

    return {
        channel,
        channelLabel,
        channelLabelRef,
        currentUser,
        currentUserIdRef,
        initialMessageCount,
        members,
    };
}
