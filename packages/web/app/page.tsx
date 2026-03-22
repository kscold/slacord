'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { fadeInUp, fadeIn, staggerContainer, zoomInPerspective } from '@/shared/animations';

export default function Home() {
    return (
        <div className="min-h-screen bg-black relative">
            {/* 배경 영상 - 초기 화면에만 표시 */}
            <div className="absolute inset-x-0 top-[73px] h-screen z-0 flex items-center justify-center bg-black overflow-hidden">
                <video autoPlay loop muted playsInline className="w-full h-auto">
                    <source src="/assets/backgroud.mp4" type="video/mp4" />
                </video>
            </div>

            {/* Navigation */}
            <motion.nav
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className="relative z-10 px-6 py-6 bg-black border-b border-slack-green/10"
            >
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <Image
                            src="/assets/slacord-logo.jpeg"
                            alt="Slacord Logo"
                            width={48}
                            height={48}
                            className="rounded-2xl ring-2 ring-slack-green/40"
                        />
                        <span className="text-2xl font-bold text-white">Slacord</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <Link
                            href="/auth/login"
                            className="px-5 py-2 text-text-secondary hover:text-white transition-colors"
                        >
                            로그인
                        </Link>
                        <Link
                            href="/auth/register"
                            className="px-6 py-2.5 bg-gradient-to-r from-slack-green to-slack-yellow text-bg-primary rounded-xl font-semibold hover:shadow-lg hover:shadow-slack-green/30 transition-all"
                        >
                            시작하기
                        </Link>
                    </div>
                </div>
            </motion.nav>

            {/* Hero Section - 비디오 위에 텍스트 오버레이 */}
            <div className="relative z-10 h-screen flex items-center justify-center">
                <motion.div
                    initial="hidden"
                    animate="visible"
                    variants={staggerContainer}
                    className="text-center max-w-5xl mx-auto px-6"
                >
                    {/* Hero Text - 3D Zoom In */}
                    <motion.h1
                        variants={zoomInPerspective}
                        className="text-7xl font-bold mb-8 leading-tight text-white drop-shadow-2xl"
                    >
                        Slack 메시지를
                        <br />
                        <span className="text-8xl text-slack-green">영구 보관</span>하세요
                    </motion.h1>

                    <motion.p
                        variants={zoomInPerspective}
                        className="text-2xl text-white mb-14 leading-relaxed drop-shadow-lg"
                    >
                        Slack Free 플랜의 <span className="text-slack-coral font-semibold">90일 메시지 제한</span>을
                        극복하고,
                        <br />
                        Discord를 무료 영구 저장소로 활용하여{' '}
                        <span className="text-slack-yellow font-semibold">중요한 메시지</span>를 보관합니다.
                    </motion.p>

                    {/* CTA Buttons - 3D Zoom In */}
                    <motion.div variants={zoomInPerspective} className="flex items-center justify-center gap-6">
                        <Link
                            href="/auth/register"
                            className="px-10 py-5 bg-slack-green hover:bg-slack-green/90 text-white rounded-2xl text-xl font-bold transition-all shadow-2xl shadow-black/50 hover:shadow-2xl hover:shadow-slack-green/50 ring-2 ring-white/20 hover:ring-white/40 backdrop-blur-sm"
                        >
                            무료로 시작하기
                        </Link>
                        <Link
                            href="/dashboard"
                            className="px-10 py-5 bg-black/60 hover:bg-black/80 text-white rounded-2xl text-xl font-bold transition-all border-2 border-white/40 hover:border-white/60 shadow-2xl shadow-black/50 backdrop-blur-md"
                        >
                            둘러보기
                        </Link>
                    </motion.div>
                </motion.div>
            </div>

            {/* Content Section - 비디오 아래 검은 배경 */}
            <div className="relative z-10 bg-black max-w-7xl mx-auto px-6 py-20" style={{ perspective: '1200px' }}>
                {/* Feature Cards */}
                <div style={{ perspective: '1200px' }}>
                    <motion.div
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: '-100px' }}
                        variants={staggerContainer}
                        className="grid md:grid-cols-3 gap-10"
                    >
                        {/* Feature 1 - 3D Zoom In */}
                        <motion.div
                            variants={zoomInPerspective}
                            className="relative group bg-gradient-to-br from-bg-secondary to-bg-tertiary border-2 border-slack-teal/20 hover:border-slack-teal/40 rounded-3xl p-10 transition-all"
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-slack-teal/5 to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity" />

                            <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-slack-teal to-slack-green mb-8 flex items-center justify-center shadow-lg shadow-slack-teal/30">
                                <svg
                                    className="w-8 h-8 text-white"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                                    />
                                </svg>
                            </div>

                            <h3 className="text-2xl font-bold text-white mb-4">웹에서 바로 채팅</h3>
                            <p className="text-lg text-text-secondary leading-relaxed">
                                Discord나 Slack을 사용하지 않으신다면, 웹사이트에서 바로 채팅을 관리하세요. Slacord가
                                모두 관리해드립니다.
                            </p>
                        </motion.div>

                        {/* Feature 2 - 3D Zoom In */}
                        <motion.div
                            variants={zoomInPerspective}
                            className="relative group bg-gradient-to-br from-bg-secondary to-bg-tertiary border-2 border-discord-blue/20 hover:border-discord-blue/40 rounded-3xl p-10 transition-all"
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-discord-blue/5 to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity" />

                            <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-discord-blue to-brand-600 mb-8 flex items-center justify-center shadow-lg shadow-discord-blue/30">
                                <svg
                                    className="w-8 h-8 text-white"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                    />
                                </svg>
                            </div>

                            <div className="flex items-center gap-2 mb-4">
                                <h3 className="text-2xl font-bold text-white">채널 정보 연동</h3>
                                <span className="px-2 py-1 bg-slack-coral/20 text-slack-coral text-xs font-bold rounded-lg">
                                    BETA
                                </span>
                            </div>
                            <p className="text-lg text-text-secondary leading-relaxed">
                                Slack과 Discord 채널 정보를 입력하면, 실시간 메시지 동기화와 90일 이후 영구 조회가
                                가능합니다.
                            </p>
                        </motion.div>

                        {/* Feature 3 - 3D Zoom In */}
                        <motion.div
                            variants={zoomInPerspective}
                            className="relative group bg-gradient-to-br from-bg-secondary to-bg-tertiary border-2 border-slack-yellow/20 hover:border-slack-yellow/40 rounded-3xl p-10 transition-all"
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-slack-yellow/5 to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity" />

                            <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-slack-yellow to-slack-coral mb-8 flex items-center justify-center shadow-lg shadow-slack-yellow/30">
                                <svg
                                    className="w-8 h-8 text-white"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                                    />
                                </svg>
                            </div>

                            <h3 className="text-2xl font-bold text-white mb-4">영구 보관</h3>
                            <p className="text-lg text-text-secondary leading-relaxed">
                                Slack Free 플랜의 90일 제한을 극복하고, Discord를 활용하여 중요한 메시지를 영구
                                보관합니다.
                            </p>
                        </motion.div>
                    </motion.div>
                </div>
            </div>

            {/* Footer */}
            <motion.footer
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className="relative z-10 border-t border-slack-green/10 bg-black py-16 mt-32"
            >
                <div className="max-w-7xl mx-auto px-6 text-center">
                    <p className="text-text-tertiary mb-4 text-lg">Made by kscold</p>
                    <div className="flex items-center justify-center gap-3 text-text-muted">
                        <span className="inline-block w-2 h-2 rounded-full bg-slack-teal animate-pulse" />
                        <span className="text-lg">Inspired by Slack</span>
                        <span className="mx-3 text-slack-green">×</span>
                        <span className="inline-block w-2 h-2 rounded-full bg-discord-blue animate-pulse" />
                        <span className="text-lg">Discord</span>
                    </div>
                </div>
            </motion.footer>
        </div>
    );
}
