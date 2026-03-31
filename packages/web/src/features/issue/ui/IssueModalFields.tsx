import type { IssuePriority, IssueStatus } from '@/src/entities/issue/types';
import { PRIORITIES, PRIORITY_LABELS, STATUSES, STATUS_LABELS } from '../lib/issue.constants';

interface Props {
    description: string;
    isEdit: boolean;
    priority: IssuePriority;
    setDescription: (value: string) => void;
    setPriority: (value: IssuePriority) => void;
    setStatus: (value: IssueStatus) => void;
    setTitle: (value: string) => void;
    status: IssueStatus;
    title: string;
}

export function IssueModalFields(props: Props) {
    return (
        <>
            <label className="mb-1 block text-xs text-text-tertiary">제목 *</label>
            <input
                value={props.title}
                onChange={(event) => props.setTitle(event.target.value)}
                className="mb-3 w-full rounded-lg border border-border-primary bg-bg-primary px-3 py-2 text-sm text-white focus:outline-none focus:border-[#d6b08a]/60"
                placeholder="이슈 제목"
                required
            />

            <label className="mb-1 block text-xs text-text-tertiary">설명</label>
            <textarea
                value={props.description}
                onChange={(event) => props.setDescription(event.target.value)}
                className="mb-3 w-full resize-none rounded-lg border border-border-primary bg-bg-primary px-3 py-2 text-sm text-white focus:outline-none focus:border-[#d6b08a]/60"
                rows={3}
                placeholder="이슈 설명을 입력해 주세요"
            />

            <div className="mb-3 flex gap-3">
                <div className="flex-1">
                    <label className="mb-1 block text-xs text-text-tertiary">우선순위</label>
                    <select
                        value={props.priority}
                        onChange={(event) => props.setPriority(event.target.value as IssuePriority)}
                        className="w-full rounded-lg border border-border-primary bg-bg-primary px-3 py-2 text-sm text-white focus:outline-none focus:border-[#d6b08a]/60"
                    >
                        {PRIORITIES.map((priority) => <option key={priority} value={priority}>{PRIORITY_LABELS[priority]}</option>)}
                    </select>
                </div>
                {props.isEdit ? (
                    <div className="flex-1">
                        <label className="mb-1 block text-xs text-text-tertiary">상태</label>
                        <select
                            value={props.status}
                            onChange={(event) => props.setStatus(event.target.value as IssueStatus)}
                            className="w-full rounded-lg border border-border-primary bg-bg-primary px-3 py-2 text-sm text-white focus:outline-none focus:border-[#d6b08a]/60"
                        >
                            {STATUSES.map((status) => <option key={status} value={status}>{STATUS_LABELS[status]}</option>)}
                        </select>
                    </div>
                ) : null}
            </div>
        </>
    );
}
