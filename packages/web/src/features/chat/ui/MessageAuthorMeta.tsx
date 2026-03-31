interface Props {
    authorLabel: string;
    time: string;
    isEdited?: boolean;
    isPinned?: boolean;
}

export function MessageAuthorMeta({ authorLabel, time, isEdited, isPinned }: Props) {
    return (
        <div className="flex items-baseline gap-2 leading-[22px]">
            <span className="text-[15px] font-bold text-white">{authorLabel}</span>
            <span className="text-[12px] text-text-tertiary">{time}</span>
            {isEdited ? <span className="text-[12px] text-text-tertiary">(수정됨)</span> : null}
            {isPinned ? <span className="text-[12px] font-medium text-[#e5c07b]">고정됨</span> : null}
        </div>
    );
}
