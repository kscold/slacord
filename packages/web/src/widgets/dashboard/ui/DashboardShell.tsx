import { DashboardSidebar } from './DashboardSidebar';

interface Props {
    title: string;
    description: string;
    currentUserName?: string;
    children: React.ReactNode;
}

export function DashboardShell({ title, description, currentUserName, children }: Props) {
    return (
        <div className="min-h-screen bg-bg-primary lg:flex">
            <DashboardSidebar currentUserName={currentUserName} />
            <main className="flex-1 p-6 lg:p-10">
                <header className="mb-8">
                    <p className="text-sm font-medium text-[#d6b08a]">Workspace Console</p>
                    <h1 className="mt-2 text-3xl font-bold text-white">{title}</h1>
                    <p className="mt-3 max-w-2xl text-sm leading-6 text-text-secondary">{description}</p>
                </header>
                {children}
            </main>
        </div>
    );
}
