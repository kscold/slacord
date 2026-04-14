import { create } from 'zustand';

export interface HuddleParticipant {
    userId: string;
    audio: boolean;
    video: boolean;
    stream?: MediaStream;
}

interface HuddleState {
    activeChannelId: string | null;
    participants: HuddleParticipant[];
    localStream: MediaStream | null;
    localAudio: boolean;
    localVideo: boolean;
    sharingScreen: boolean;
    error: string | null;
    join: (channelId: string) => void;
    leave: () => void;
    setParticipants: (participants: HuddleParticipant[]) => void;
    setLocalStream: (stream: MediaStream | null) => void;
    setLocalAudio: (on: boolean) => void;
    setLocalVideo: (on: boolean) => void;
    setSharingScreen: (on: boolean) => void;
    setParticipantStream: (userId: string, stream: MediaStream) => void;
    removeParticipant: (userId: string) => void;
    setError: (error: string | null) => void;
}

export const useHuddleStore = create<HuddleState>((set) => ({
    activeChannelId: null,
    participants: [],
    localStream: null,
    localAudio: true,
    localVideo: false,
    sharingScreen: false,
    error: null,
    join: (channelId) => set({ activeChannelId: channelId, error: null }),
    leave: () => set({ activeChannelId: null, participants: [], localStream: null, localAudio: true, localVideo: false, sharingScreen: false, error: null }),
    setParticipants: (participants) => set((state) => ({
        participants: participants.map((p) => {
            const existing = state.participants.find((e) => e.userId === p.userId);
            return existing ? { ...p, stream: existing.stream } : p;
        }),
    })),
    setLocalStream: (stream) => set({ localStream: stream }),
    setLocalAudio: (on) => set({ localAudio: on }),
    setLocalVideo: (on) => set({ localVideo: on }),
    setSharingScreen: (on) => set({ sharingScreen: on }),
    setParticipantStream: (userId, stream) => set((state) => ({
        participants: state.participants.map((p) => p.userId === userId ? { ...p, stream } : p),
    })),
    removeParticipant: (userId) => set((state) => ({
        participants: state.participants.filter((p) => p.userId !== userId),
    })),
    setError: (error) => set({ error }),
}));
