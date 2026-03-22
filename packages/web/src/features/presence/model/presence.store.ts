import { create } from 'zustand';
import type { Presence, PresenceStatus } from '@/src/entities/user/types';

interface PresenceState {
    presences: Record<string, Presence>;
    setPresence: (userId: string, status: PresenceStatus, lastSeen: string) => void;
    setPresences: (list: Presence[]) => void;
    getStatus: (userId: string) => PresenceStatus;
}

export const usePresenceStore = create<PresenceState>((set, get) => ({
    presences: {},

    setPresences: (list) => {
        const presences: Record<string, Presence> = {};
        list.forEach((p) => (presences[p.userId] = p));
        set({ presences });
    },
    setPresence: (userId, status, lastSeen) =>
        set((s) => ({ presences: { ...s.presences, [userId]: { userId, status, lastSeen } } })),
    getStatus: (userId) => get().presences[userId]?.status ?? 'offline',
}));
