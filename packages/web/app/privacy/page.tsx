import { MarketingHeader } from '@/src/widgets/marketing/ui/MarketingHeader';
import { ProductFooter } from '@/src/widgets/marketing/ui/ProductFooter';

const SECTIONS = [
    {
        title: '어떤 정보를 수집하나요',
        body: [
            '회원가입과 로그인에 필요한 이메일, 사용자 이름, 비밀번호를 수집해요.',
            '워크스페이스 운영을 위해 메시지, 문서, 이슈, 공지, 첨부 파일 같은 협업 데이터를 저장해요.',
            '서비스 안정성을 위해 접속 로그, 오류 정보, 기기 환경 정보 일부를 처리할 수 있어요.',
        ],
    },
    {
        title: '어디에 사용하나요',
        body: [
            '로그인 상태를 유지하고, 워크스페이스에 맞는 데이터를 보여주기 위해 사용해요.',
            '실시간 채팅, 알림, 문서 검색, 이슈 관리처럼 서비스 핵심 기능을 제공하는 데 사용해요.',
            '오류를 확인하고 성능을 개선해 더 안정적인 서비스를 제공하는 데 활용해요.',
        ],
    },
    {
        title: '첨부 파일과 문서는 어떻게 보관하나요',
        body: [
            '문서 첨부 파일과 채팅 파일은 오브젝트 스토리지에 저장돼요.',
            '워크스페이스 문서와 메시지는 협업 이력을 유지하기 위해 서비스 데이터베이스에 보관돼요.',
            '관리자 요청이나 법령상 보관 의무가 없는 한, 탈퇴 또는 삭제 요청 시 합리적인 기간 안에 정리해요.',
        ],
    },
    {
        title: '제3자에게 제공하나요',
        body: [
            '기본적으로 이용자 데이터를 판매하거나 광고 목적으로 외부에 제공하지 않아요.',
            'GitHub, Discord, Confluence 같은 외부 연동은 사용자가 직접 연결한 범위 안에서만 처리해요.',
            '법령에 따른 요청이 있는 경우에만 필요한 범위에서 제공할 수 있어요.',
        ],
    },
    {
        title: '이용자가 할 수 있는 일',
        body: [
            '워크스페이스 관리자나 서비스 운영자에게 문서, 메시지, 계정 데이터 정정이나 삭제를 요청할 수 있어요.',
            '데스크톱 앱에서는 마이크와 카메라 권한을 시스템 설정에서 언제든지 변경할 수 있어요.',
            '개인정보 관련 문의는 아래 연락처로 보내주시면 확인 후 안내해드려요.',
        ],
    },
];

export default function PrivacyPage() {
    return (
        <div className="min-h-screen bg-[radial-gradient(circle_at_top,#2b1d11_0%,#120f0b_42%,#0c0a08_100%)]">
            <MarketingHeader />
            <main className="mx-auto max-w-5xl px-4 py-14 sm:px-6 sm:py-20">
                <section className="rounded-[2rem] border border-white/10 bg-black/25 p-6 backdrop-blur-sm sm:p-10">
                    <p className="marketing-kicker">PRIVACY POLICY</p>
                    <h1 className="mt-4 text-3xl font-bold tracking-[-0.04em] text-white sm:text-5xl">
                        Slacord 개인정보 처리 방침
                    </h1>
                    <p className="mt-5 max-w-3xl text-base leading-8 text-[#d7ccbf] sm:text-lg">
                        Slacord는 팀 협업에 필요한 정보만 수집하고, 서비스 운영에 필요한 범위 안에서만 사용해요.
                        아래 내용은 2026년 3월 30일 기준 정책이에요.
                    </p>
                </section>

                <section className="mt-8 grid gap-4 sm:mt-10 sm:grid-cols-2">
                    {SECTIONS.map((section) => (
                        <article
                            key={section.title}
                            className="rounded-[1.75rem] border border-white/8 bg-white/[0.03] p-6"
                        >
                            <h2 className="text-xl font-semibold tracking-[-0.03em] text-white">
                                {section.title}
                            </h2>
                            <div className="mt-4 space-y-3 text-sm leading-7 text-[#c8bbac] sm:text-[0.98rem]">
                                {section.body.map((line) => (
                                    <p key={line}>{line}</p>
                                ))}
                            </div>
                        </article>
                    ))}
                </section>

                <section className="mt-8 rounded-[1.75rem] border border-white/8 bg-white/[0.03] p-6 sm:mt-10 sm:p-8">
                    <h2 className="text-xl font-semibold tracking-[-0.03em] text-white">
                        문의처
                    </h2>
                    <div className="mt-4 space-y-2 text-sm leading-7 text-[#c8bbac] sm:text-[0.98rem]">
                        <p>상호: 콜딩(Colding)</p>
                        <p>대표: 김승찬</p>
                        <p>이메일: coldingcontact@gmail.com</p>
                        <p>주소: 경기도 김포시 김포한강9로75번길 66, 5층</p>
                    </div>
                </section>
            </main>
            <ProductFooter />
        </div>
    );
}
