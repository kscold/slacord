'use client';

import { useState } from 'react';
import type { IssueStatus } from '@/src/entities/issue/types';

export function useIssueBoardFilters() {
    const [query, setQuery] = useState('');
    const [assigneeId, setAssigneeId] = useState('');
    const [statusFilter, setStatusFilter] = useState<IssueStatus | 'all'>('all');

    return {
        query,
        assigneeId,
        statusFilter,
        setQuery,
        setAssigneeId,
        setStatusFilter,
    };
}
