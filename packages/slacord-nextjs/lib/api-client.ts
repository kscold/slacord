/**
 * Slacord API 클라이언트
 * - 순수 HttpOnly 쿠키 기반 인증
 * - localStorage 사용 안 함
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8082';

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
    const response = await fetch(`${API_URL}${url}`, {
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
    /**
     * 팀 목록 조회
     */
    async getTeams() {
        return apiFetch('/api/teams');
    },

    /**
     * 팀 생성
     */
    async createTeam(name: string, description?: string) {
        return apiFetch('/api/teams', {
            method: 'POST',
            body: JSON.stringify({ name, description }),
        });
    },

    /**
     * 팀 상세 조회
     */
    async getTeam(teamId: string) {
        return apiFetch(`/api/teams/${teamId}`);
    },
};

/**
 * 메시지 API
 */
export const messageApi = {
    /**
     * 메시지 전송
     */
    async sendMessage(teamId: string, content: string, username?: string) {
        return apiFetch('/api/messages', {
            method: 'POST',
            body: JSON.stringify({ teamId, content, username }),
        });
    },

    /**
     * 메시지 조회
     */
    async getMessages(teamId: string, before?: string, limit: number = 50) {
        const params = new URLSearchParams({ teamId, limit: limit.toString() });
        if (before) params.append('before', before);
        return apiFetch(`/api/messages?${params.toString()}`);
    },
};
