'use client';

interface Props {
    title: string;
    children: React.ReactNode;
}

export function SidebarSection({ title, children }: Props) {
    return (
        <div>
            <p className="mb-1 px-3 text-xs font-semibold uppercase tracking-wider text-text-tertiary">{title}</p>
            {children}
        </div>
    );
}
