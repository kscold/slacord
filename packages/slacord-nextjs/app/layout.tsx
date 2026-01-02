import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Slacord - Slack to Discord Archive",
  description: "Backup Slack messages to Discord for free permanent storage",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
