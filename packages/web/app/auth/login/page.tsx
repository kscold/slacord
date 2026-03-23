'use client';

import { LoginForm } from '@/src/features/auth/ui/LoginForm';
import { AuthShell } from '@/src/widgets/auth/ui/AuthShell';

export default function LoginPage() {
    return (
        <AuthShell title="Sign In" description="워크스페이스에 로그인" alternateHref="/auth/register" alternateLabel="회원가입" alternateText="아직 계정이 없나요?">
            <LoginForm />
        </AuthShell>
    );
}
