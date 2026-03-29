import type { Metadata, Viewport } from 'next';
import { Geist } from 'next/font/google';
import { siteConfig } from '@/src/shared/config/site';
import { DesktopRuntimeBadge } from '@/src/widgets/desktop/ui/DesktopRuntimeBadge';
import { DesktopDragBar } from '@/src/widgets/desktop/ui/DesktopDragBar';
import './globals.css';

const geist = Geist({
    subsets: ['latin'],
    display: 'swap',
    weight: ['400', '500', '600', '700', '800'],
});

export const metadata: Metadata = {
    title: `${siteConfig.name} | Team Collaboration Cloud`,
    description: siteConfig.description,
    icons: {
        icon: [
            { url: '/icon.svg', type: 'image/svg+xml' },
            { url: '/assets/slacord-bot-icon.png', sizes: '512x512', type: 'image/png' },
        ],
        shortcut: ['/icon.svg'],
        apple: [{ url: '/assets/slacord-bot-icon.png', sizes: '180x180', type: 'image/png' }],
    },
};

export const viewport: Viewport = {
    themeColor: '#0f0c09',
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="ko" className={geist.className}>
            <body>
                <DesktopDragBar />
                <DesktopRuntimeBadge />
                {children}
            </body>
        </html>
    );
}
