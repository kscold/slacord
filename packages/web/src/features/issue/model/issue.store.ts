import { create } from 'zustand';
import type { Issue, IssueStatus } from '@/src/entities/issue/types';

interface IssueState {
    issues: Issue[];
    isLoading: boolean;
    setIssues: (issues: Issue[]) => void;
    addIssue: (issue: Issue) => void;
    updateIssue: (id: string, patch: Partial<Issue>) => void;
    removeIssue: (id: string) => void;
    setLoading: (v: boolean) => void;
    byStatus: (status: IssueStatus) => Issue[];
}

export const useIssueStore = create<IssueState>((set, get) => ({
    issues: [],
    isLoading: false,

    setIssues: (issues) => set({ issues }),
    addIssue: (issue) => set((s) => ({ issues: [...s.issues, issue] })),
    updateIssue: (id, patch) =>
        set((s) => ({ issues: s.issues.map((i) => (i.id === id ? { ...i, ...patch } : i)) })),
    removeIssue: (id) => set((s) => ({ issues: s.issues.filter((i) => i.id !== id) })),
    setLoading: (isLoading) => set({ isLoading }),
    byStatus: (status) => get().issues.filter((i) => i.status === status),
}));
