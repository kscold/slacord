export async function showDesktopMessageNotification(input: { title: string; body: string }) {
    if (typeof window === 'undefined' || document.visibilityState === 'visible') return;
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
