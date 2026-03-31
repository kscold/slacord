import { contextBridge, ipcRenderer } from 'electron';
import type { DesktopUpdateCheckResult, DesktopUpdateDownloadResult, DesktopUpdateInstallResult, DesktopUpdateStatus, SlacordDesktopBridge } from '@slacord/contracts';

type DesktopRenderer = Pick<typeof ipcRenderer, 'invoke' | 'on' | 'off'>;

export function createDesktopBridge(renderer: DesktopRenderer = ipcRenderer): SlacordDesktopBridge {
    return {
        isDesktop: true,
        platform: process.platform,
        notify: (title: string, body: string, href?: string) => renderer.invoke('desktop:notify', { title, body, href }),
        requestMediaAccess: () => renderer.invoke('desktop:request-media-access') as Promise<{ microphone: boolean; camera: boolean }>,
        getUpdateStatus: () => renderer.invoke('desktop:get-update-status') as Promise<DesktopUpdateStatus>,
        checkForUpdates: () => renderer.invoke('desktop:check-for-updates') as Promise<DesktopUpdateCheckResult>,
        downloadUpdate: () => renderer.invoke('desktop:download-update') as Promise<DesktopUpdateDownloadResult>,
        restartToUpdate: () => renderer.invoke('desktop:restart-to-update') as Promise<DesktopUpdateInstallResult>,
        onUpdateStatus: (listener) => {
            const handler = (_event: Electron.IpcRendererEvent, payload: DesktopUpdateStatus) => listener(payload);
            renderer.on('desktop:update-status', handler);
            return () => renderer.off('desktop:update-status', handler);
        },
    };
}

export const desktopBridge = createDesktopBridge();

contextBridge.exposeInMainWorld('slacordDesktop', desktopBridge);
