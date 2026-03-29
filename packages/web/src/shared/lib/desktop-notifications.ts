export async function showDesktopMessageNotification(input: { title: string; body: string; force?: boolean }) {
    if (typeof window === 'undefined') return;
    // force가 아닌 경우, 앱이 포커스 중이면 알림 안 보냄
    if (!input.force && document.visibilityState === 'visible') return;
    if (window.slacordDesktop?.isDesktop) {
        await window.slacordDesktop.notify(input.title, input.body);
        return;
    }
    if (!('Notification' in window)) return;
    if (Notification.permission === 'default') {
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') return;
    }
    if (Notification.permission === 'granted') {
        new Notification(input.title, { body: input.body });
    }
}
