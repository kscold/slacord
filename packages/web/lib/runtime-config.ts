const DEFAULT_API_URL = 'http://localhost:8082';
const DEFAULT_APP_URL = 'http://localhost:3002';

function normalizePath(path: string) {
    return path.startsWith('/') ? path : `/${path}`;
}

function browserApiBaseUrl() {
    if (typeof window === 'undefined') {
        return '';
    }
    return '';
}

function serverApiBaseUrl() {
    return process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || DEFAULT_API_URL;
}

export function toApiUrl(path: string) {
    const normalized = normalizePath(path);
    if (typeof window !== 'undefined') {
        return normalized;
    }
    return `${serverApiBaseUrl()}${normalized}`;
}

export function publicAppUrl() {
    if (typeof window !== 'undefined') {
        return window.location.origin;
    }
    return process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_API_URL || DEFAULT_APP_URL;
}

export function socketUrl() {
    if (typeof window !== 'undefined') {
        return browserApiBaseUrl() || window.location.origin;
    }
    return serverApiBaseUrl();
}
