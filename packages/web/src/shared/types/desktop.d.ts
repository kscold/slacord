import type { SlacordDesktopBridge } from '@slacord/contracts';

export {};

declare global {
    interface Window {
        slacordDesktop?: SlacordDesktopBridge;
    }
}
