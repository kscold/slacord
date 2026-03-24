'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { channelApi } from '@/lib/api-client';
import type { TeamMemberSummary } from '@/src/entities/team/types';

interface Props {
    teamId: string;
    members: TeamMemberSummary[];
}

export function DirectRoomLauncher({ teamId, members }: Props) {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [groupName, setGroupName] = useState('');
    const selectedMembers = useMemo(() => members.filter((member) => selectedIds.includes(member.userId)), [members, selectedIds]);

    const toggle = (userId: string) => setSelectedIds((current) => current.includes(userId) ? current.filter((id) => id !== userId) : [...current, userId]);
    const close = () => { setOpen(false); setSelectedIds([]); setGroupName(''); };

    const createRoom = async () => {
        if (selectedIds.length === 0) return;
        const isDm = selectedIds.length === 1;
        const name = isDm
            ? selectedMembers[0]?.user?.username || 'Direct Message'
            : groupName.trim() || selectedMembers.map((member) => member.user?.username).filter(Boolean).join(', ');
        const response = await channelApi.createChannel(teamId, {
            name,
            type: isDm ? 'dm' : 'group',
            memberIds: selectedIds,
        });
        if (response.success && response.data) {
            close();
            router.push(`/${teamId}/channel/${(response.data as { id: string }).id}`);
        }
    };

    return (
        <>
            <button onClick={() => setOpen(true)} className="w-full rounded-lg border border-border-primary px-3 py-2 text-left text-sm text-text-secondary transition-colors hover:border-slack-green/40 hover:text-white">
                + DM / 소그룹 열기
            </button>
            {open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-md rounded-2xl border border-border-primary bg-bg-secondary p-5">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-white">새 DM / 소그룹</h3>
                            <button onClick={close} className="text-text-tertiary hover:text-white">닫기</button>
                        </div>
                        <div className="mt-4 max-h-72 space-y-2 overflow-y-auto">
                            {members.map((member) => (
                                <label key={member.userId} className="flex items-center gap-3 rounded-xl border border-border-primary px-3 py-2 text-sm text-text-secondary hover:border-slack-green/30">
                                    <input type="checkbox" checked={selectedIds.includes(member.userId)} onChange={() => toggle(member.userId)} />
                                    <span className="font-medium text-white">{member.user?.username || member.userId}</span>
                                    <span className="ml-auto text-xs uppercase text-text-tertiary">{member.role}</span>
                                </label>
                            ))}
                        </div>
                        {selectedIds.length > 1 && (
                            <input
                                value={groupName}
                                onChange={(event) => setGroupName(event.target.value)}
                                placeholder="소그룹 이름"
                                className="mt-4 w-full rounded-xl border border-border-primary bg-bg-primary px-3 py-2 text-sm text-white outline-none focus:border-slack-green/40"
                            />
                        )}
                        <div className="mt-4 flex justify-end gap-2">
                            <button onClick={close} className="rounded-lg px-4 py-2 text-sm text-text-secondary hover:text-white">취소</button>
                            <button onClick={createRoom} disabled={selectedIds.length === 0} className="rounded-lg bg-slack-green px-4 py-2 text-sm font-medium text-white disabled:opacity-40">
                                만들기
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
