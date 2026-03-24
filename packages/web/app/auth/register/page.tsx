import { RegisterForm } from '@/src/features/auth/ui/RegisterForm';
import { AuthShell } from '@/src/widgets/auth/ui/AuthShell';

interface Props {
    searchParams: Promise<{ next?: string }>;
}

export default async function RegisterPage({ searchParams }: Props) {
    const { next } = await searchParams;
    const nextPath = next || undefined;
    const loginHref = nextPath ? `/auth/login?next=${encodeURIComponent(nextPath)}` : '/auth/login';

    return (
        <AuthShell title="Get Started" description="워크스페이스 계정 만들기" alternateHref={loginHref} alternateLabel="로그인" alternateText="이미 계정이 있나요?">
            <RegisterForm nextPath={nextPath} />
        </AuthShell>
    );
}
