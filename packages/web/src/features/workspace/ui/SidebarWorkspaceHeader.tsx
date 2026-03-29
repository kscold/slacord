import Link from 'next/link';

interface Props {
    teamId: string;
    teamName: string;
    isDesktopMac: boolean;
}

export function SidebarWorkspaceHeader({ teamId, teamName, isDesktopMac }: Props) {
    const desktopClass = isDesktopMac ? 'min-h-[92px] pl-20 pt-11 pb-5 pr-4 desktop-drag-region' : 'px-4 py-4';
    return (
        <div className={`border-b border-border-primary ${desktopClass}`}>
            <Link href={`/${teamId}`} className="block truncate text-lg font-bold text-white">
                {teamName}
            </Link>
        </div>
    );
}
