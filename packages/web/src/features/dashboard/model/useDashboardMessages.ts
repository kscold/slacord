'use client';

import { useDeferredValue, useEffect, useState } from 'react';
import { authApi, messageApi, unwrapApiData } from '@/lib/api-client';
import type { MessageSearchResult } from '@/src/entities/message/search.types';

export function useDashboardMessages() {
    const [query, setQuery] = useState('');
    const [currentUserName, setCurrentUserName] = useState<string>();
    const [teamCount, setTeamCount] = useState(0);
    const [results, setResults] = useState<MessageSearchResult[]>([]);
    const [recentResults, setRecentResults] = useState<MessageSearchResult[]>([]);
    const [pinnedResults, setPinnedResults] = useState<MessageSearchResult[]>([]);
    const [booting, setBooting] = useState(true);
    const [indexing, setIndexing] = useState(false);
    const [error, setError] = useState('');
    const deferredQuery = useDeferredValue(query.trim());

    useEffect(() => {
        let active = true;

        Promise.all([authApi.getMe().catch(() => null), messageApi.searchMessages(undefined).catch(() => null)])
            .then(([meRes, searchRes]) => {
                if (!active) return;
                const meData = meRes && unwrapApiData<{ username?: string }>(meRes);
                if (meData) setCurrentUserName(meData.username);
                const searchData = searchRes && unwrapApiData<{ pinnedResults?: MessageSearchResult[]; recentResults?: MessageSearchResult[]; teamCount?: number }>(searchRes);
                if (searchData) {
                    setPinnedResults(searchData.pinnedResults ?? []);
                    setRecentResults(searchData.recentResults ?? []);
                    setTeamCount(searchData.teamCount ?? 0);
                }
                setBooting(false);
            })
            .catch((err: Error) => {
                if (!active) return;
                setError(err.message || '메시지 검색 개요를 불러오지 못했습니다.');
                setBooting(false);
            });

        return () => {
            active = false;
        };
    }, []);

    useEffect(() => {
        let active = true;

        if (booting)
            return () => {
                active = false;
            };

        if (!deferredQuery) {
            setResults([]);
            setIndexing(false);
            return () => {
                active = false;
            };
        }

        if (deferredQuery.length < 2) {
            setResults([]);
            setIndexing(false);
            return () => {
                active = false;
            };
        }

        setIndexing(true);
        setError('');

        messageApi
            .searchMessages(deferredQuery)
            .then((response) => {
                if (!active || !response.success || !response.data) return;
                setResults(response.data.results ?? []);
                setTeamCount(response.data.teamCount ?? 0);
            })
            .catch((err: Error) => {
                if (!active) return;
                setError(err.message || '메시지 검색 결과를 불러오지 못했습니다.');
            })
            .finally(() => {
                if (active) setIndexing(false);
            });

        return () => {
            active = false;
        };
    }, [booting, deferredQuery]);

    return {
        booting,
        currentUserName,
        error,
        indexing,
        pinnedResults,
        query,
        recentResults,
        results,
        setQuery,
        teamCount,
    };
}
