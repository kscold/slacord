'use client';

import Link from 'next/link';

interface Props {
    href: string;
    label: string;
    active: boolean;
    icon?: React.ReactNode;
}

export function SidebarNavLink({ href, label, active, icon }: Props) {
    return (
        <Link
            href={href}
            className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${
                active
                    ? 'bg-slack-green/20 font-medium text-slack-green'
                    : 'text-text-secondary hover:bg-bg-hover hover:text-white'
            }`}
        >
            {icon}
            {label}
        </Link>
    );
}
