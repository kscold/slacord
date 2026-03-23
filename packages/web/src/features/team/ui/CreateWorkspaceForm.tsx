'use client';

import { useState } from 'react';
import { useCreateWorkspace } from '../model/useCreateWorkspace';

export function CreateWorkspaceForm() {
    const { createWorkspace, error, loading } = useCreateWorkspace();
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        await createWorkspace(name, description);
    };

    return (
        <form onSubmit={handleSubmit} className="rounded-[28px] border border-border-primary bg-bg-secondary p-8">
            {error && <p className="mb-5 rounded-2xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-200">{error}</p>}
            <label className="block">
                <span className="mb-2 block text-sm text-text-primary">워크스페이스 이름</span>
                <input value={name} onChange={(e) => setName(e.target.value)} required placeholder="예: Product Ops" className="w-full rounded-2xl border border-border-primary bg-bg-tertiary px-4 py-3 text-white outline-none transition focus:border-[#d6b08a]" />
            </label>
            <label className="mt-5 block">
                <span className="mb-2 block text-sm text-text-primary">설명</span>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} placeholder="이 워크스페이스가 다루는 팀, 목적, 운영 흐름을 적어주세요." className="w-full rounded-2xl border border-border-primary bg-bg-tertiary px-4 py-3 text-white outline-none transition focus:border-[#d6b08a]" />
            </label>
            <p className="mt-3 text-xs leading-5 text-text-tertiary">생성되면 기본 채널 general도 함께 열어서 바로 대화를 시작할 수 있게 맞춥니다.</p>
            <button type="submit" disabled={loading} className="mt-6 rounded-2xl bg-[#b97532] px-5 py-3 font-semibold text-white transition hover:bg-[#cf8640] disabled:opacity-50">
                {loading ? '워크스페이스 준비 중...' : '워크스페이스 만들기'}
            </button>
        </form>
    );
}
