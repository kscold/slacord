export type DesktopUpdateStage =
    | 'idle'
    | 'checking'
    | 'available'
    | 'downloading'
    | 'downloaded'
    | 'error';

export interface DesktopUpdateStatus {
    stage: DesktopUpdateStage;
    detail: string;
}

export interface SlacordDesktopBridge {
    isDesktop: boolean;
    platform: string;
    notify: (title: string, body: string) => Promise<boolean>;
    checkForUpdates: () => Promise<void>;
    onUpdateStatus: (listener: (payload: DesktopUpdateStatus) => void) => () => void;
}
