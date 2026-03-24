'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api-client';

function resolveNextPath(nextPath?: string) {
    return nextPath?.startsWith('/') ? nextPath : '/dashboard';
}

export function useLogin(nextPath?: string) {
    const router = useRouter();
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const login = async (email: string, password: string) => {
        setError('');
        setLoading(true);
        try {
            await authApi.login(email, password);
            router.push(resolveNextPath(nextPath));
        } catch (caught) {
            setError(caught instanceof Error ? caught.message : '로그인에 실패했습니다.');
        } finally {
            setLoading(false);
        }
    };

    return { login, error, loading };
}

export function useRegister(nextPath?: string) {
    const router = useRouter();
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const register = async (email: string, password: string, username: string) => {
        setError('');
        setLoading(true);
        try {
            await authApi.register(email, password, username);
            await authApi.login(email, password);
            router.push(resolveNextPath(nextPath));
        } catch (caught) {
            setError(caught instanceof Error ? caught.message : '회원가입에 실패했습니다.');
        } finally {
            setLoading(false);
        }
    };

    return { register, error, loading };
}
