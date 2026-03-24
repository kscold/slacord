'use client';

import { useEffect, useState } from 'react';
import QRCode from 'qrcode';

interface Props {
    value: string;
}

export function InviteQrCard({ value }: Props) {
    const [src, setSrc] = useState('');

    useEffect(() => {
        if (!value) return void setSrc('');
        QRCode.toDataURL(value, {
            margin: 1,
            width: 176,
            color: { dark: '#f5e4cd', light: '#0000' },
        }).then(setSrc);
    }, [value]);

    return (
        <div className="rounded-[24px] border border-white/8 bg-black/20 p-4 text-center">
            <p className="text-xs uppercase tracking-[0.18em] text-brand-200">QR Invite</p>
            <div className="mt-4 flex justify-center">{src ? <img src={src} alt="Invite QR" className="h-44 w-44 rounded-2xl bg-[#1c1510] p-3" /> : <div className="flex h-44 w-44 items-center justify-center rounded-2xl border border-dashed border-white/10 text-sm text-text-tertiary">초대 링크 생성 후 QR 표시</div>}</div>
            <p className="mt-4 text-xs leading-6 text-text-secondary">모바일 카메라로 스캔하면 팀 초대 링크로 바로 이동함.</p>
        </div>
    );
}
