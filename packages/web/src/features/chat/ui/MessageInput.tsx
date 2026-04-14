'use client';

import type { TeamMemberSummary } from '@/src/entities/team/types';
import { MentionSuggestions } from './MentionSuggestions';
import { MessageComposerActions } from './MessageComposerActions';
import { PendingAttachmentTray } from './PendingAttachmentTray';
import { useMessageComposer } from '../model/useMessageComposer';

interface Props {
    channelName: string;
    readOnly?: boolean;
    readOnlyMessage?: string;
    members?: TeamMemberSummary[];
    onSend: (content: string) => void | Promise<void>;
    onUpload: (files: File[], content: string) => Promise<void>;
    onTyping: () => void;
    isUploading: boolean;
}

export function MessageInput({ channelName, readOnly = false, readOnlyMessage, members = [], onSend, onUpload, onTyping, isUploading }: Props) {
    const composer = useMessageComposer({ members, onTyping, onUpload, onSend });

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (readOnly) return;
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
            void composer.submit();
        }
    };

    return (
        <div className="shrink-0 px-5 pb-4 pt-1">
            <input
                ref={composer.fileInputRef}
                type="file"
                multiple
                disabled={readOnly}
                className="hidden"
                onChange={(event) => readOnly ? undefined : void composer.handleFileChange(event.target.files)}
            />
            <div
                className={`relative overflow-hidden rounded-2xl border bg-[#1e1814] transition-colors ${
                    composer.isDraggingFiles
                        ? 'border-[#d6b08a] bg-[#2a1d12]'
                        : 'border-border-primary focus-within:border-[#d6b08a]/60'
                }`}
                onDragEnter={readOnly ? undefined : composer.handleDragEnter}
                onDragOver={readOnly ? undefined : composer.handleDragOver}
                onDragLeave={readOnly ? undefined : composer.handleDragLeave}
                onDrop={readOnly ? undefined : composer.handleDrop}
            >
                {composer.isDraggingFiles ? (
                    <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-black/55 backdrop-blur-sm">
                        <div className="rounded-full border border-[#d6b08a]/40 bg-[#1e1814]/90 px-4 py-2 text-sm font-medium text-white">
                            파일을 놓아서 업로드 큐에 추가
                        </div>
                    </div>
                ) : null}
                <PendingAttachmentTray files={composer.pendingFiles} onRemove={composer.removePendingFile} />
                <div className="relative flex items-end gap-2">
                    {composer.mentionQuery !== null && composer.mentionCandidates.length > 0 ? (
                        <MentionSuggestions
                            activeIndex={composer.mentionIndex}
                            members={composer.mentionCandidates}
                            onSelect={composer.insertMention}
                        />
                    ) : null}
                    <MessageComposerActions
                        canSubmit={Boolean(composer.content.trim()) || composer.pendingFiles.length > 0}
                        isUploading={isUploading}
                        readOnly={readOnly}
                        onOpenFiles={() => composer.fileInputRef.current?.click()}
                        onSubmit={() => void composer.submit()}
                    />
                    <textarea
                        ref={composer.textareaRef}
                        value={composer.content}
                        readOnly={readOnly}
                        onChange={(event) => readOnly ? undefined : composer.handleChange(event.target.value, event.target.selectionStart)}
                        onKeyDown={handleKeyDown}
                        placeholder={readOnly ? `${channelName} 채널은 guest에게 읽기 전용입니다.` : `#${channelName}에 메시지 보내기`}
                        rows={1}
                        className="flex-1 resize-none bg-transparent py-2.5 text-[14px] leading-[1.5] text-white outline-none placeholder:text-text-tertiary disabled:cursor-not-allowed"
                        style={{ minHeight: '22px', maxHeight: '160px' }}
                    />
                </div>
                <div className="flex items-center justify-between gap-3 border-t border-border-primary/70 px-3 py-2 text-[11px] text-text-tertiary">
                    <span>{readOnly ? (readOnlyMessage ?? 'guest는 메시지 작성, 파일 업로드, 스레드 답글을 보낼 수 없습니다.') : '이미지, 동영상, 문서를 드래그하거나 여러 파일을 한 번에 올릴 수 있습니다.'}</span>
                    {composer.pendingFiles.length > 0 ? <span>{composer.pendingFiles.length}개 준비됨</span> : null}
                </div>
            </div>
        </div>
    );
}
