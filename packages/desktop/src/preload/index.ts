import { contextBridge, ipcRenderer } from 'electron';
import type { DesktopUpdateCheckResult, DesktopUpdateInstallResult, DesktopUpdateStatus, SlacordDesktopBridge } from '@slacord/contracts';

const desktopBridge: SlacordDesktopBridge = {
    isDesktop: true,
    platform: process.platform,
    notify: (title: string, body: string) => ipcRenderer.invoke('desktop:notify', { title, body }),
    getUpdateStatus: () => ipcRenderer.invoke('desktop:get-update-status') as Promise<DesktopUpdateStatus>,
    checkForUpdates: () => ipcRenderer.invoke('desktop:check-for-updates') as Promise<DesktopUpdateCheckResult>,
    restartToUpdate: () => ipcRenderer.invoke('desktop:restart-to-update') as Promise<DesktopUpdateInstallResult>,
    onUpdateStatus: (listener) => {
        const handler = (_event: Electron.IpcRendererEvent, payload: DesktopUpdateStatus) => listener(payload);
        ipcRenderer.on('desktop:update-status', handler);
        return () => ipcRenderer.off('desktop:update-status', handler);
    },
};

contextBridge.exposeInMainWorld('slacordDesktop', desktopBridge);
