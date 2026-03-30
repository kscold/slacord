'use client';

function HelpSection({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <section>
            <h4 className="mb-2 font-semibold text-white">{title}</h4>
            <div className="space-y-1.5">{children}</div>
        </section>
    );
}

export function DiscordImportHelpModal({ onClose }: { onClose: () => void }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md" onClick={onClose}>
            <div onClick={(event) => event.stopPropagation()} className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-[rgba(201,162,114,0.25)] bg-[#1e1814] p-6 shadow-2xl">
                <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-lg font-bold text-white">Discord 임포트 가이드</h3>
                    <button onClick={onClose} className="text-text-tertiary transition-colors hover:text-white">
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                <div className="space-y-5 text-sm leading-relaxed text-text-secondary">
                    <HelpSection title="1단계: Discord 봇 생성">
                        <ol className="list-decimal space-y-1.5 pl-5">
                            <li><a href="https://discord.com/developers/applications" target="_blank" rel="noopener noreferrer" className="text-[#61afef] underline">Discord Developer Portal</a>에 접속해 주세요.</li>
                            <li><strong className="text-white">New Application</strong>을 누르고 앱 이름을 만든 뒤 저장해 주세요.</li>
                            <li>왼쪽 메뉴에서 <strong className="text-white">Bot</strong>을 선택해 주세요.</li>
                            <li><strong className="text-white">Reset Token</strong>을 눌러 토큰을 복사해 주세요.</li>
                        </ol>
                    </HelpSection>
                    <HelpSection title="2단계: 봇 권한 설정">
                        <ol className="list-decimal space-y-1.5 pl-5">
                            <li><strong className="text-white">Privileged Gateway Intents</strong>에서 세 항목을 모두 켜 주세요.</li>
                            <li><strong className="text-[#e5c07b]">Message Content Intent</strong>는 꼭 켜야 해요.</li>
                            <li><strong className="text-white">Save Changes</strong>를 눌러 저장해 주세요.</li>
                        </ol>
                    </HelpSection>
                    <HelpSection title="3단계: 봇을 서버에 초대">
                        <ol className="list-decimal space-y-1.5 pl-5">
                            <li><strong className="text-white">OAuth2 → URL Generator</strong>로 이동해 주세요.</li>
                            <li>Scopes에서 <strong className="text-white">bot</strong>을 체크해 주세요.</li>
                            <li>권한은 <strong className="text-white">Read Messages/View Channels</strong>, <strong className="text-white">Read Message History</strong>를 켜 주세요.</li>
                            <li>생성된 URL로 서버에 봇을 초대해 주세요.</li>
                        </ol>
                    </HelpSection>
                    <HelpSection title="4단계: 서버 ID 복사">
                        <ol className="list-decimal space-y-1.5 pl-5">
                            <li>Discord 설정의 고급 메뉴에서 <strong className="text-white">개발자 모드</strong>를 켜 주세요.</li>
                            <li>서버 이름을 우클릭해서 <strong className="text-white">서버 아이디 복사</strong>를 눌러 주세요.</li>
                        </ol>
                    </HelpSection>
                    <HelpSection title="5단계: 가져오기 실행">
                        <ol className="list-decimal space-y-1.5 pl-5">
                            <li><strong className="text-white">Guild ID</strong>에 서버 아이디를 넣어 주세요.</li>
                            <li><strong className="text-white">Bot Token</strong>에 봇 토큰을 넣어 주세요.</li>
                            <li>특정 채널만 원하면 채널 ID를 쉼표로 나눠 입력해 주세요.</li>
                            <li><strong className="text-white">Discord 전체 가져오기</strong>를 눌러 주세요.</li>
                        </ol>
                    </HelpSection>
                    <div className="rounded-xl border border-[rgba(201,162,114,0.2)] bg-black/20 p-3 text-xs text-text-tertiary">
                        <p className="mb-1 font-medium text-[#e5c07b]">참고</p>
                        <ul className="space-y-0.5">
                            <li>• 텍스트, 뉴스, 스레드 채널만 가져와요.</li>
                            <li>• 봇 토큰은 저장하지 않고, 가져오는 동안에만 써요.</li>
                            <li>• 메시지가 많으면 시간이 조금 걸릴 수 있어요.</li>
                            <li>• 다시 실행하면 기존 메시지는 업데이트하고, 새 메시지만 더해요.</li>
                        </ul>
                    </div>
                </div>

                <button onClick={onClose} className="mt-5 w-full rounded-lg bg-brand-500 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-400">
                    이해했어요
                </button>
            </div>
        </div>
    );
}
