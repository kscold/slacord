'use client';

import { use } from 'react';
import { TeamSettingsShell } from '@/src/features/team/ui/TeamSettingsShell';

interface Props {
    params: Promise<{ teamId: string }>;
}

export default function SettingsPage({ params }: Props) {
    const { teamId } = use(params);

    return <TeamSettingsShell teamId={teamId} />;
}
