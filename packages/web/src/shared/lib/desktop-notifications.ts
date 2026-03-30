export async function showDesktopMessageNotification(input: { title: string; body: string; force?: boolean; href?: string }) {
    if (typeof window === 'undefined') return;

    // 데스크톱 앱 — 항상 네이티브 알림 전송 (Electron main process)
    if (window.slacordDesktop?.isDesktop) {
        await window.slacordDesktop.notify(input.title, input.body, input.href);
        return;
    }

    // 웹 브라우저 — 앱이 포커스 중이면 알림 안 보냄 (force일 때는 보냄)
    if (!input.force && document.visibilityState === 'visible') return;

    if (!('Notification' in window)) return;
    if (Notification.permission === 'default') {
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') return;
    }
    if (Notification.permission === 'granted') {
        new Notification(input.title, { body: input.body, icon: '/assets/slacord-bot-icon.png' });
    }
}
