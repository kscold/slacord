import { LoginForm } from '@/src/features/auth/ui/LoginForm';
import { AuthShell } from '@/src/widgets/auth/ui/AuthShell';

interface Props {
    searchParams: Promise<{ next?: string }>;
}

export default async function LoginPage({ searchParams }: Props) {
    const { next } = await searchParams;
    const nextPath = next || undefined;
    const registerHref = nextPath ? `/auth/register?next=${encodeURIComponent(nextPath)}` : '/auth/register';

    return (
        <AuthShell title="Sign In" description="워크스페이스에 로그인" alternateHref={registerHref} alternateLabel="회원가입" alternateText="아직 계정이 없나요?">
            <LoginForm nextPath={nextPath} />
        </AuthShell>
    );
}
