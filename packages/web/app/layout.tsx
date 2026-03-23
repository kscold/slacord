import type { Metadata } from 'next';
import { Geist } from 'next/font/google';
import { siteConfig } from '@/src/shared/config/site';
import './globals.css';

const geist = Geist({
    subsets: ['latin'],
    display: 'swap',
    weight: ['400', '500', '600', '700', '800'],
});

export const metadata: Metadata = {
    title: `${siteConfig.name} | Team Collaboration Cloud`,
    description: siteConfig.description,
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="ko" className={geist.className}>
            <body>{children}</body>
        </html>
    );
}
