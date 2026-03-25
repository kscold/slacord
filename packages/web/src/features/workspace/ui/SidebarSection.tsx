'use client';

interface Props {
    title: string;
    action?: React.ReactNode;
    children: React.ReactNode;
}

export function SidebarSection({ title, action, children }: Props) {
    return (
        <div>
            <div className="mb-1 flex items-center justify-between px-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-text-tertiary">{title}</p>
                {action}
            </div>
            {children}
        </div>
    );
}
