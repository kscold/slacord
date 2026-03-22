import Link from 'next/link';

export default function NotFound() {
    return (
        <div className="min-h-screen bg-bg-primary flex items-center justify-center">
            <div className="text-center">
                <p className="text-8xl font-extrabold text-slack-green mb-4">404</p>
                <h1 className="text-2xl font-bold text-white mb-2">페이지를 찾을 수 없습니다</h1>
                <p className="text-text-secondary mb-8">요청하신 페이지가 존재하지 않거나 이동되었습니다.</p>
                <Link
                    href="/dashboard"
                    className="inline-block px-6 py-3 bg-slack-green text-white font-semibold rounded-xl hover:bg-slack-green/90 transition-colors"
                >
                    대시보드로 이동
                </Link>
            </div>
        </div>
    );
}
