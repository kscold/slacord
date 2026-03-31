'use client';

import { useEffect, useRef, useState } from 'react';

export function useMessageItemEditor(initialContent: string) {
    const [editing, setEditing] = useState(false);
    const [editContent, setEditContent] = useState('');
    const editRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        if (!editing || !editRef.current) return;
        editRef.current.focus();
        editRef.current.selectionStart = editRef.current.value.length;
    }, [editing]);

    const startEdit = () => {
        setEditContent(initialContent);
        setEditing(true);
    };

    const cancelEdit = () => {
        setEditing(false);
        setEditContent('');
    };

    return {
        cancelEdit,
        editContent,
        editRef,
        editing,
        setEditContent,
        setEditing,
        startEdit,
    };
}
