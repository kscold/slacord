/**
 * Slacord API 클라이언트
 * - 순수 HttpOnly 쿠키 기반 인증
 * - localStorage 사용 안 함
 */

import { toApiUrl } from './runtime-config';

interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    message?: string;
    error?: string;
}

/**
 * 공통 fetch 래퍼
 * - credentials: 'include'를 자동으로 추가
 */
async function apiFetch<T = any>(url: string, options?: RequestInit): Promise<ApiResponse<T>> {
    const response = await fetch(toApiUrl(url), {
        ...options,
        credentials: 'include', // 모든 요청에 쿠키 포함
        headers: {
            'Content-Type': 'application/json',
            ...options?.headers,
        },
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || '요청에 실패했습니다.');
    }

    return data;
}

/**
 * 인증 API
 */
export const authApi = {
    /**
     * 회원가입
     */
    async register(email: string, password: string, username: string) {
        return apiFetch('/api/auth/register', {
            method: 'POST',
            body: JSON.stringify({ email, password, username }),
        });
    },

    /**
     * 로그인
     */
    async login(email: string, password: string) {
        return apiFetch('/api/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
        });
    },

    /**
     * 로그아웃
     */
    async logout() {
        return apiFetch('/api/auth/logout', {
            method: 'POST',
        });
    },
};

/**
 * 팀 API
 */
export const teamApi = {
    async getMyTeams() {
        return apiFetch('/api/team');
    },
    async createTeam(data: { name: string; slug: string; description?: string }) {
        return apiFetch('/api/team', { method: 'POST', body: JSON.stringify(data) });
    },
    async joinTeam(slug: string) {
        return apiFetch(`/api/team/${slug}/join`, { method: 'POST' });
    },
    async updateGithubConfig(teamId: string, data: { repoUrl: string; webhookSecret: string; notifyChannelId: string }) {
        return apiFetch(`/api/team/${teamId}/github`, { method: 'PATCH', body: JSON.stringify(data) });
    },
    /** @deprecated 이전 코드 호환성 */
    async getTeams() {
        return apiFetch('/api/team');
    },
    /** @deprecated 이전 코드 호환성 */
    async getTeam(teamId: string) {
        return apiFetch(`/api/team/${teamId}`);
    },
};

/**
 * 채널 API
 */
export const channelApi = {
    async getChannels(teamId: string) {
        return apiFetch(`/api/team/${teamId}/channel`);
    },
    async createChannel(teamId: string, data: { name: string; type?: string }) {
        return apiFetch(`/api/team/${teamId}/channel`, { method: 'POST', body: JSON.stringify(data) });
    },
};

/**
 * 메시지 API
 */
export const messageApi = {
    async getMessages(channelId: string, before?: string, limit = 50) {
        const params = new URLSearchParams({ limit: String(limit) });
        if (before) params.set('before', before);
        return apiFetch(`/api/channel/${channelId}/message?${params}`);
    },
    async editMessage(channelId: string, messageId: string, content: string) {
        return apiFetch(`/api/channel/${channelId}/message/${messageId}`, {
            method: 'PATCH',
            body: JSON.stringify({ content }),
        });
    },
    async deleteMessage(channelId: string, messageId: string) {
        return apiFetch(`/api/channel/${channelId}/message/${messageId}`, { method: 'DELETE' });
    },
};

/**
 * 이슈 API
 */
export const issueApi = {
    async getIssues(teamId: string, status?: string) {
        const params = status ? `?status=${status}` : '';
        return apiFetch(`/api/team/${teamId}/issue${params}`);
    },
    async createIssue(teamId: string, data: { title: string; description?: string; priority?: string; assigneeIds?: string[]; labels?: string[] }) {
        return apiFetch(`/api/team/${teamId}/issue`, { method: 'POST', body: JSON.stringify(data) });
    },
    async updateIssue(teamId: string, issueId: string, data: object) {
        return apiFetch(`/api/team/${teamId}/issue/${issueId}`, { method: 'PATCH', body: JSON.stringify(data) });
    },
    async deleteIssue(teamId: string, issueId: string) {
        return apiFetch(`/api/team/${teamId}/issue/${issueId}`, { method: 'DELETE' });
    },
};

/**
 * 공지사항 API
 */
export const announcementApi = {
    async getAnnouncements(teamId: string) {
        return apiFetch(`/api/team/${teamId}/announcement`);
    },
    async createAnnouncement(teamId: string, data: { title: string; content: string }) {
        return apiFetch(`/api/team/${teamId}/announcement`, { method: 'POST', body: JSON.stringify(data) });
    },
    async pinAnnouncement(teamId: string, announcementId: string, isPinned: boolean) {
        return apiFetch(`/api/team/${teamId}/announcement/${announcementId}/pin`, {
            method: 'PATCH',
            body: JSON.stringify({ isPinned }),
        });
    },
};

/**
 * 문서 API
 */
export const documentApi = {
    async getDocuments(teamId: string) {
        return apiFetch(`/api/team/${teamId}/document`);
    },
    async getDocument(teamId: string, documentId: string) {
        return apiFetch(`/api/team/${teamId}/document/${documentId}`);
    },
    async createDocument(teamId: string, data: { title: string; content?: string; parentId?: string | null }) {
        return apiFetch(`/api/team/${teamId}/document`, { method: 'POST', body: JSON.stringify(data) });
    },
    async updateDocument(teamId: string, documentId: string, data: { title?: string; content?: string }) {
        return apiFetch(`/api/team/${teamId}/document/${documentId}`, { method: 'PATCH', body: JSON.stringify(data) });
    },
    async deleteDocument(teamId: string, documentId: string) {
        return apiFetch(`/api/team/${teamId}/document/${documentId}`, { method: 'DELETE' });
    },
};

/**
 * 프레즌스 API
 */
export const presenceApi = {
    async getPresence(teamId: string) {
        return apiFetch(`/api/team/${teamId}/presence`);
    },
};
