/**
 * Slacord API 클라이언트
 * - 순수 HttpOnly 쿠키 기반 인증
 * - localStorage 사용 안 함
 */

import { toApiUrl } from './runtime-config';
import type { ChannelType } from '@/src/entities/channel/types';
import type { TeamInvitePreview } from '@/src/entities/team/types';

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
    const isFormData = typeof FormData !== 'undefined' && options?.body instanceof FormData;
    const response = await fetch(toApiUrl(url), {
        ...options,
        credentials: 'include', // 모든 요청에 쿠키 포함
        headers: {
            ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
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

    async getMe() {
        return apiFetch('/api/auth/me');
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
    async getMembers(teamId: string) {
        return apiFetch(`/api/team/${teamId}/member`);
    },
    async joinTeam(slug: string) {
        return apiFetch(`/api/team/${slug}/join`, { method: 'POST' });
    },
    async updateGithubConfig(teamId: string, data: { repoUrl: string; webhookSecret: string; notifyChannelId: string }) {
        return apiFetch(`/api/team/${teamId}/github`, { method: 'PATCH', body: JSON.stringify(data) });
    },
    async getInviteLinks(teamId: string) {
        return apiFetch(`/api/team/${teamId}/invite-links`);
    },
    async createInviteLink(teamId: string, data: { label?: string; defaultRole?: 'admin' | 'member'; maxUses?: number; expiresInDays?: number }) {
        return apiFetch(`/api/team/${teamId}/invite-links`, { method: 'POST', body: JSON.stringify(data) });
    },
    async revokeInviteLink(teamId: string, code: string) {
        return apiFetch(`/api/team/${teamId}/invite-links/${code}/revoke`, { method: 'PATCH' });
    },
    async updateMemberAccess(teamId: string, memberId: string, data: { role?: 'admin' | 'member'; canManageInvites?: boolean }) {
        return apiFetch(`/api/team/${teamId}/member/${memberId}/access`, { method: 'PATCH', body: JSON.stringify(data) });
    },
    async getInvitePreview(code: string) {
        return apiFetch<TeamInvitePreview>(`/api/team/invite/${code}`);
    },
    async joinByInvite(code: string) {
        return apiFetch(`/api/team/invite/${code}/join`, { method: 'POST' });
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
    async createChannel(teamId: string, data: { name: string; description?: string; type?: ChannelType; memberIds?: string[] }) {
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
    async getPinnedMessages(channelId: string) {
        return apiFetch(`/api/channel/${channelId}/message/pinned`);
    },
    async getThreadMessages(channelId: string, messageId: string) {
        return apiFetch(`/api/channel/${channelId}/message/${messageId}/thread`);
    },
    async uploadAttachment(channelId: string, teamId: string, file: File) {
        const formData = new FormData();
        formData.append('teamId', teamId);
        formData.append('file', file);
        return apiFetch(`/api/channel/${channelId}/message/attachment`, {
            method: 'POST',
            body: formData,
        });
    },
    async pinMessage(channelId: string, messageId: string, isPinned: boolean) {
        return apiFetch(`/api/channel/${channelId}/message/${messageId}/pin`, {
            method: 'PATCH',
            body: JSON.stringify({ isPinned }),
        });
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
    async importConfluence(teamId: string, data: { siteUrl: string; email: string; apiToken: string; spaceKey: string; rootPageId?: string }) {
        return apiFetch(`/api/team/${teamId}/document/import/confluence`, { method: 'POST', body: JSON.stringify(data) });
    },
    async updateDocument(teamId: string, documentId: string, data: { title?: string; content?: string; contentFormat?: 'plain' | 'html' | 'json' }) {
        return apiFetch(`/api/team/${teamId}/document/${documentId}`, { method: 'PATCH', body: JSON.stringify(data) });
    },
    async getDocumentVersions(teamId: string, documentId: string) {
        return apiFetch(`/api/team/${teamId}/document/${documentId}/version`);
    },
    async restoreDocumentVersion(teamId: string, documentId: string, versionId: string) {
        return apiFetch(`/api/team/${teamId}/document/${documentId}/version/${versionId}/restore`, { method: 'POST' });
    },
    async deleteDocument(teamId: string, documentId: string) {
        return apiFetch(`/api/team/${teamId}/document/${documentId}`, { method: 'DELETE' });
    },
    async archiveDocument(teamId: string, documentId: string) {
        return apiFetch(`/api/team/${teamId}/document/${documentId}/archive`, { method: 'POST' });
    },
    async restoreDocument(teamId: string, documentId: string) {
        return apiFetch(`/api/team/${teamId}/document/${documentId}/restore`, { method: 'POST' });
    },
    async getArchivedDocuments(teamId: string) {
        return apiFetch(`/api/team/${teamId}/document/archived/list`);
    },
    async uploadDocumentImage(teamId: string, file: File) {
        const formData = new FormData();
        formData.append('file', file);
        return apiFetch(`/api/team/${teamId}/document/upload/image`, { method: 'POST', body: formData });
    },
    async uploadDocumentFile(teamId: string, documentId: string, file: File) {
        const formData = new FormData();
        formData.append('file', file);
        return apiFetch(`/api/team/${teamId}/document/${documentId}/file`, { method: 'POST', body: formData });
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
