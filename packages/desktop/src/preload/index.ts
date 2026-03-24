import { contextBridge, ipcRenderer } from 'electron';
import type { DesktopUpdateStatus, SlacordDesktopBridge } from '@slacord/contracts';

const desktopBridge: SlacordDesktopBridge = {
    isDesktop: true,
    platform: process.platform,
    notify: (title: string, body: string) => ipcRenderer.invoke('desktop:notify', { title, body }),
    checkForUpdates: () => ipcRenderer.invoke('desktop:check-for-updates'),
    onUpdateStatus: (listener) => {
        const handler = (_event: Electron.IpcRendererEvent, payload: DesktopUpdateStatus) => listener(payload);
        ipcRenderer.on('desktop:update-status', handler);
        return () => ipcRenderer.off('desktop:update-status', handler);
    },
};

contextBridge.exposeInMainWorld('slacordDesktop', desktopBridge);
