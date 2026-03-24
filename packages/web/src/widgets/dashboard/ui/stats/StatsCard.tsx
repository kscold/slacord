interface Props {
    label: string;
    value: number;
    sub: string;
}

export function StatsCard({ label, value, sub }: Props) {
    return (
        <div className="rounded-[24px] border border-border-primary bg-bg-secondary p-5">
            <p className="text-sm text-text-tertiary">{label}</p>
            <p className="mt-3 text-4xl font-bold tracking-[-0.04em] text-white">{value}</p>
            <p className="mt-2 text-xs leading-5 text-text-muted">{sub}</p>
        </div>
    );
}
