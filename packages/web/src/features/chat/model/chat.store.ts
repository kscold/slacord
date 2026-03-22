import { create } from 'zustand';
import type { Message } from '@/src/entities/message/types';

interface ChatState {
    messages: Message[];
    typingUsers: string[];
    isLoading: boolean;

    setMessages: (msgs: Message[]) => void;
    prependMessages: (msgs: Message[]) => void;
    addMessage: (msg: Message) => void;
    updateMessage: (id: string, patch: Partial<Message>) => void;
    removeMessage: (id: string) => void;
    setTypingUsers: (users: string[]) => void;
    setLoading: (v: boolean) => void;
    reset: () => void;
}

export const useChatStore = create<ChatState>((set) => ({
    messages: [],
    typingUsers: [],
    isLoading: false,

    setMessages: (messages) => set({ messages }),
    prependMessages: (msgs) => set((s) => ({ messages: [...msgs, ...s.messages] })),
    addMessage: (msg) => set((s) => ({ messages: [...s.messages, msg] })),
    updateMessage: (id, patch) =>
        set((s) => ({ messages: s.messages.map((m) => (m.id === id ? { ...m, ...patch } : m)) })),
    removeMessage: (id) => set((s) => ({ messages: s.messages.filter((m) => m.id !== id) })),
    setTypingUsers: (typingUsers) => set({ typingUsers }),
    setLoading: (isLoading) => set({ isLoading }),
    reset: () => set({ messages: [], typingUsers: [], isLoading: false }),
}));
