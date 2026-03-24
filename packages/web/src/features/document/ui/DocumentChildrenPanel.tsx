import Link from 'next/link';
import type { DocumentNode } from '@/src/entities/document/types';

interface Props {
    teamId: string;
    children: DocumentNode[];
}

export function DocumentChildrenPanel({ teamId, children }: Props) {
    if (children.length === 0) return null;
    return (
        <section className="mb-6 rounded-3xl border border-border-primary bg-black/10 p-5">
            <div className="mb-4 flex items-center justify-between">
                <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-brand-200">Children</p>
                    <h3 className="mt-2 text-lg font-semibold text-white">하위 문서 {children.length}개</h3>
                </div>
                <p className="text-xs text-text-tertiary">카테고리 문서면 아래에서 실제 문서를 바로 열 수 있음</p>
            </div>
            <div className="grid gap-3">
                {children.map((child) => (
                    <Link key={child.id} href={`/${teamId}/docs/${child.id}`} className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3 text-sm text-white transition hover:border-brand-300/40 hover:bg-white/[0.06]">
                        {child.title}
                    </Link>
                ))}
            </div>
        </section>
    );
}
