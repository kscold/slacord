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

export interface DesktopUpdateCheckResult {
    ok: boolean;
    status: DesktopUpdateStatus;
}

export interface SlacordDesktopBridge {
    isDesktop: boolean;
    platform: string;
    notify: (title: string, body: string) => Promise<boolean>;
    getUpdateStatus: () => Promise<DesktopUpdateStatus>;
    checkForUpdates: () => Promise<DesktopUpdateCheckResult>;
    onUpdateStatus: (listener: (payload: DesktopUpdateStatus) => void) => () => void;
}
