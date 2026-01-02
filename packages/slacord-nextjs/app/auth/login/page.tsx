'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api-client';

export default function LoginPage() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            // 순수 쿠키 기반 인증 - API 클라이언트 사용
            await authApi.login(formData.email, formData.password);

            // 쿠키는 서버에서 자동으로 Set-Cookie 헤더를 통해 설정됨
            // localStorage 사용 안 함

            // 대시보드로 이동
            router.push('/dashboard');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-bg-primary flex items-center justify-center px-4">
            <div className="max-w-md w-full">
                {/* Logo */}
                <div className="text-center mb-8">
                    <Link href="/" className="inline-flex flex-col items-center gap-3 mb-4">
                        <Image
                            src="/assets/slacord-logo.jpeg"
                            alt="Slacord Logo"
                            width={80}
                            height={80}
                            className="rounded-2xl ring-2 ring-slack-green/30"
                        />
                        <span className="text-3xl font-bold text-white">Slacord</span>
                    </Link>
                    <h1 className="text-2xl font-bold text-text-primary mb-2">로그인</h1>
                    <p className="text-text-secondary">Slack 메시지를 영구 보관하세요</p>
                </div>

                {/* Form */}
                <div className="bg-bg-secondary border border-border-primary rounded-xl p-8">
                    {error && (
                        <div className="mb-6 p-4 bg-error/10 border border-error/30 rounded-lg">
                            <p className="text-error text-sm">{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-text-primary mb-2">
                                이메일
                            </label>
                            <input
                                id="email"
                                type="email"
                                required
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                className="w-full px-4 py-3 bg-bg-tertiary border border-border-primary rounded-lg text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
                                placeholder="your@email.com"
                            />
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-text-primary mb-2">
                                비밀번호
                            </label>
                            <input
                                id="password"
                                type="password"
                                required
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                className="w-full px-4 py-3 bg-bg-tertiary border border-border-primary rounded-lg text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
                                placeholder="••••••••"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 bg-gradient-to-r from-brand-600 to-brand-700 hover:from-brand-700 hover:to-brand-800 text-white font-semibold rounded-lg transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? '로그인 중...' : '로그인'}
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <p className="text-text-secondary text-sm">
                            계정이 없으신가요?{' '}
                            <Link href="/auth/register" className="text-brand-500 hover:text-brand-400 font-medium">
                                회원가입
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
