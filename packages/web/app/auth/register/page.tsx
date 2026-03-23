'use client';

import { RegisterForm } from '@/src/features/auth/ui/RegisterForm';
import { AuthShell } from '@/src/widgets/auth/ui/AuthShell';

export default function RegisterPage() {
    return (
        <AuthShell title="Get Started" description="워크스페이스 계정 만들기" alternateHref="/auth/login" alternateLabel="로그인" alternateText="이미 계정이 있나요?">
            <RegisterForm />
        </AuthShell>
    );
}
