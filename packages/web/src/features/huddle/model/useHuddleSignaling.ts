'use client';

import { useEffect, useRef } from 'react';
import { getChatSocket } from '@/lib/socket';
import { useHuddleStore } from './huddle.store';

interface HuddleParticipantState {
    userId: string;
    audio: boolean;
    video: boolean;
}

export interface HuddleSignalingHandlers {
    currentUserId: string;
    /** 현재 참여 중인 허들 채널이면 true */
    isActiveChannel: (channelId: string) => boolean;
    emitMediaState: (channelId: string) => void;
    onUserJoined: (channelId: string, userId: string) => void;
    onUserLeft: (userId: string) => void;
    onOffer: (channelId: string, fromUserId: string, offer: RTCSessionDescriptionInit) => Promise<void> | void;
    onAnswer: (fromUserId: string, answer: RTCSessionDescriptionInit) => Promise<void> | void;
    onIceCandidate: (fromUserId: string, candidate: RTCIceCandidateInit) => Promise<void> | void;
    onCleanup: () => void;
}

/**
 * 허들 시그널링 소켓 이벤트 바인딩만 담당하는 훅.
 *
 * useHuddle에서 이 훅을 호출해 WebRTC peer 제어 함수들을 핸들러로 넘김.
 * 핸들러 구현은 useHuddle에 남음 — 이 훅은 순수 소켓 배선/해제만.
 *
 * 핸들러는 매 렌더마다 새 객체일 수 있어 ref로 안정화 — effect는
 * currentUserId가 바뀔 때만 재구독.
 */
export function useHuddleSignaling(handlers: HuddleSignalingHandlers): void {
    const handlersRef = useRef(handlers);
    handlersRef.current = handlers;

    useEffect(() => {
        const socket = getChatSocket();
        const currentUserId = handlersRef.current.currentUserId;

        const onConnect = () => {
            const channelId = useHuddleStore.getState().activeChannelId;
            if (!channelId) return;
            socket.emit('huddle:join', { channelId });
            handlersRef.current.emitMediaState(channelId);
        };

        const onUserJoined = (data: { channelId: string; userId: string }) => {
            const h = handlersRef.current;
            if (data.userId === h.currentUserId || !h.isActiveChannel(data.channelId)) return;
            h.onUserJoined(data.channelId, data.userId);
        };

        const onUserLeft = (data: { userId: string }) => {
            handlersRef.current.onUserLeft(data.userId);
        };

        const onOffer = async (data: { channelId: string; fromUserId: string; offer: RTCSessionDescriptionInit }) => {
            await handlersRef.current.onOffer(data.channelId, data.fromUserId, data.offer);
        };

        const onAnswer = async (data: { fromUserId: string; answer: RTCSessionDescriptionInit }) => {
            await handlersRef.current.onAnswer(data.fromUserId, data.answer);
        };

        const onIceCandidate = async (data: { fromUserId: string; candidate: RTCIceCandidateInit }) => {
            await handlersRef.current.onIceCandidate(data.fromUserId, data.candidate);
        };

        const onParticipants = (data: { channelId: string; participants: HuddleParticipantState[] }) => {
            const h = handlersRef.current;
            if (!h.isActiveChannel(data.channelId)) return;
            useHuddleStore.getState().setParticipants(
                data.participants.filter((participant) => participant.userId !== h.currentUserId),
            );
        };

        socket.on('connect', onConnect);
        socket.on('huddle:user-joined', onUserJoined);
        socket.on('huddle:user-left', onUserLeft);
        socket.on('huddle:offer', onOffer);
        socket.on('huddle:answer', onAnswer);
        socket.on('huddle:ice-candidate', onIceCandidate);
        socket.on('huddle:participants', onParticipants);

        return () => {
            socket.off('connect', onConnect);
            socket.off('huddle:user-joined', onUserJoined);
            socket.off('huddle:user-left', onUserLeft);
            socket.off('huddle:offer', onOffer);
            socket.off('huddle:answer', onAnswer);
            socket.off('huddle:ice-candidate', onIceCandidate);
            socket.off('huddle:participants', onParticipants);
            handlersRef.current.onCleanup();
        };
        // currentUserId가 바뀌면 재구독 (로그인 계정이 바뀐 케이스 정도).
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [handlers.currentUserId]);
}
