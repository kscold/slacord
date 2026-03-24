'use client';

import { useState } from 'react';
import { useLogin } from '../model/useAuth';

interface Props {
    nextPath?: string;
}

export function LoginForm({ nextPath }: Props) {
    const { login, error, loading } = useLogin(nextPath);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        await login(email, password);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            {error && <p className="rounded-2xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-200">{error}</p>}
            <label className="block">
                <span className="mb-2 block text-sm text-text-primary">이메일</span>
                <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required placeholder="team@company.com" className="w-full rounded-2xl border border-border-primary bg-bg-tertiary px-4 py-3 text-white outline-none transition focus:border-[#d6b08a]" />
            </label>
            <label className="block">
                <span className="mb-2 block text-sm text-text-primary">비밀번호</span>
                <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required placeholder="비밀번호 입력" className="w-full rounded-2xl border border-border-primary bg-bg-tertiary px-4 py-3 text-white outline-none transition focus:border-[#d6b08a]" />
            </label>
            <button type="submit" disabled={loading} className="w-full rounded-2xl bg-[#b97532] px-4 py-3 font-semibold text-white transition hover:bg-[#cf8640] disabled:opacity-50">
                {loading ? '로그인 중...' : '로그인'}
            </button>
        </form>
    );
}
