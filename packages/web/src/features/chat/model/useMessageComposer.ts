'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { TeamMemberSummary } from '@/src/entities/team/types';

interface Props {
    members: TeamMemberSummary[];
    onTyping: () => void;
    onUpload: (files: File[], content: string) => Promise<void>;
    onSend: (content: string) => void | Promise<void>;
}

function hasFilesTransfer(dataTransfer: DataTransfer | null) {
    if (!dataTransfer) return false;
    return Array.from(dataTransfer.types ?? []).includes('Files');
}

export function useMessageComposer({ members, onTyping, onUpload, onSend }: Props) {
    const [content, setContent] = useState('');
    const [pendingFiles, setPendingFiles] = useState<File[]>([]);
    const [isDraggingFiles, setIsDraggingFiles] = useState(false);
    const [mentionQuery, setMentionQuery] = useState<string | null>(null);
    const [mentionIndex, setMentionIndex] = useState(0);
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const textareaRef = useRef<HTMLTextAreaElement | null>(null);
    const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const dragDepthRef = useRef(0);

    const autoResize = useCallback(() => {
        const element = textareaRef.current;
        if (!element) return;
        element.style.height = 'auto';
        element.style.height = `${Math.min(element.scrollHeight, 160)}px`;
    }, []);

    useEffect(() => { autoResize(); }, [autoResize, content]);

    const mentionCandidates = useMemo(() => {
        if (mentionQuery === null || members.length === 0) return [];
        const query = mentionQuery.toLowerCase();
        return members.filter((member) => (member.user?.username?.toLowerCase() ?? '').includes(query)).slice(0, 6);
    }, [members, mentionQuery]);

    const detectMention = (value: string, cursorPosition: number) => {
        const before = value.slice(0, cursorPosition);
        const match = before.match(/@(\S*)$/);
        setMentionQuery(match ? match[1] : null);
        if (match) setMentionIndex(0);
    };

    const insertMention = (username: string) => {
        const element = textareaRef.current;
        if (!element) return;
        const position = element.selectionStart;
        const before = content.slice(0, position);
        const after = content.slice(position);
        const atIndex = before.lastIndexOf('@');
        const nextContent = `${before.slice(0, atIndex)}@${username} ${after}`;
        setContent(nextContent);
        setMentionQuery(null);
        setTimeout(() => {
            element.focus();
            const nextPosition = atIndex + username.length + 2;
            element.selectionStart = nextPosition;
            element.selectionEnd = nextPosition;
        }, 0);
    };

    const handleChange = useCallback((value: string, cursorPosition: number) => {
        setContent(value);
        detectMention(value, cursorPosition);
        onTyping();
        if (typingTimer.current) clearTimeout(typingTimer.current);
        typingTimer.current = setTimeout(() => {}, 2000);
    }, [onTyping]);

    const submit = async () => {
        const trimmed = content.trim();
        if (!trimmed && pendingFiles.length === 0) return;
        if (pendingFiles.length > 0) {
            await onUpload(pendingFiles, trimmed);
            setPendingFiles([]);
        } else {
            await onSend(trimmed);
        }
        setContent('');
        setMentionQuery(null);
    };

    const appendFiles = useCallback((nextFiles: File[]) => {
        if (nextFiles.length === 0) return;
        setPendingFiles((current) => [...current, ...nextFiles]);
    }, []);

    const removePendingFile = useCallback((index: number) => {
        setPendingFiles((current) => current.filter((_, currentIndex) => currentIndex !== index));
    }, []);

    const handleFileChange = async (files: FileList | null) => {
        const nextFiles = Array.from(files ?? []);
        if (nextFiles.length === 0) return;
        appendFiles(nextFiles);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleDragEnter = useCallback((event: React.DragEvent<HTMLElement>) => {
        if (!hasFilesTransfer(event.dataTransfer)) return;
        event.preventDefault();
        dragDepthRef.current += 1;
        setIsDraggingFiles(true);
    }, []);

    const handleDragOver = useCallback((event: React.DragEvent<HTMLElement>) => {
        if (!hasFilesTransfer(event.dataTransfer)) return;
        event.preventDefault();
        event.dataTransfer.dropEffect = 'copy';
    }, []);

    const handleDragLeave = useCallback((event: React.DragEvent<HTMLElement>) => {
        if (!hasFilesTransfer(event.dataTransfer)) return;
        event.preventDefault();
        dragDepthRef.current = Math.max(0, dragDepthRef.current - 1);
        if (dragDepthRef.current === 0) {
            setIsDraggingFiles(false);
        }
    }, []);

    const handleDrop = useCallback((event: React.DragEvent<HTMLElement>) => {
        if (!hasFilesTransfer(event.dataTransfer)) return;
        event.preventDefault();
        dragDepthRef.current = 0;
        setIsDraggingFiles(false);
        appendFiles(Array.from(event.dataTransfer.files ?? []));
    }, [appendFiles]);

    return {
        content,
        fileInputRef,
        handleChange,
        handleDragEnter,
        handleDragLeave,
        handleDragOver,
        handleDrop,
        handleFileChange,
        isDraggingFiles,
        insertMention,
        mentionCandidates,
        mentionIndex,
        mentionQuery,
        pendingFiles,
        removePendingFile,
        setMentionIndex,
        setMentionQuery,
        setContent,
        submit,
        textareaRef,
    };
}
