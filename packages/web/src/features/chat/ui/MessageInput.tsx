'use client';

import type { TeamMemberSummary } from '@/src/entities/team/types';
import { MentionSuggestions } from './MentionSuggestions';
import { MessageComposerActions } from './MessageComposerActions';
import { useMessageComposer } from '../model/useMessageComposer';

interface Props {
    channelName: string;
    members?: TeamMemberSummary[];
    onSend: (content: string) => void;
    onUpload: (files: File[], content: string) => Promise<void>;
    onTyping: () => void;
    isUploading: boolean;
}

export function MessageInput({ channelName, members = [], onSend, onUpload, onTyping, isUploading }: Props) {
    const composer = useMessageComposer({ members, onTyping, onUpload, onSend });

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (composer.mentionQuery !== null && composer.mentionCandidates.length > 0) {
            if (e.key === 'ArrowUp') { e.preventDefault(); composer.setMentionIndex((i) => Math.max(0, i - 1)); return; }
            if (e.key === 'ArrowDown') { e.preventDefault(); composer.setMentionIndex((i) => Math.min(composer.mentionCandidates.length - 1, i + 1)); return; }
            if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
                e.preventDefault();
                composer.insertMention(composer.mentionCandidates[composer.mentionIndex]?.user?.username ?? '');
                return;
            }
            if (e.key === 'Escape') { composer.setMentionQuery(null); return; }
        }

        if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
            e.preventDefault();
            composer.submit();
        }
    };

    return (
        <div className="shrink-0 px-5 pb-4 pt-1">
            <input ref={composer.fileInputRef} type="file" multiple className="hidden" onChange={(event) => void composer.handleFileChange(event.target.files)} />
            <div className="relative flex items-end gap-2 rounded-lg border border-border-primary bg-[#1e1814] transition-colors focus-within:border-[#d6b08a]/60">
                {composer.mentionQuery !== null && composer.mentionCandidates.length > 0 ? (
                    <MentionSuggestions activeIndex={composer.mentionIndex} members={composer.mentionCandidates} onSelect={composer.insertMention} />
                ) : null}
                <MessageComposerActions
                    hasContent={Boolean(composer.content.trim())}
                    isUploading={isUploading}
                    onOpenFiles={() => composer.fileInputRef.current?.click()}
                    onSubmit={composer.submit}
                />
                <textarea
                    ref={composer.textareaRef}
                    value={composer.content}
                    onChange={(event) => composer.handleChange(event.target.value, event.target.selectionStart)}
                    onKeyDown={handleKeyDown}
                    placeholder={`#${channelName}에 메시지 보내기`}
                    rows={1}
                    className="flex-1 bg-transparent py-2.5 text-[14px] text-white resize-none outline-none placeholder:text-text-tertiary leading-[1.5]"
                    style={{ minHeight: '22px', maxHeight: '160px' }}
                />
            </div>
        </div>
    );
}
