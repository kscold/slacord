export type DesktopUpdateStage =
    | 'idle'
    | 'checking'
    | 'available'
    | 'downloading'
    | 'downloaded'
    | 'installing'
    | 'error';

export interface DesktopUpdateStatus {
    stage: DesktopUpdateStage;
    detail: string;
}

export interface DesktopUpdateCheckResult {
    ok: boolean;
    status: DesktopUpdateStatus;
}

export interface DesktopUpdateDownloadResult {
    ok: boolean;
    status: DesktopUpdateStatus;
}

export interface DesktopUpdateInstallResult {
    ok: boolean;
    status: DesktopUpdateStatus;
}

export interface SlacordDesktopBridge {
    isDesktop: boolean;
    platform: string;
    notify: (title: string, body: string) => Promise<boolean>;
    requestMediaAccess: () => Promise<{ microphone: boolean; camera: boolean }>;
    getUpdateStatus: () => Promise<DesktopUpdateStatus>;
    checkForUpdates: () => Promise<DesktopUpdateCheckResult>;
    downloadUpdate: () => Promise<DesktopUpdateDownloadResult>;
    restartToUpdate: () => Promise<DesktopUpdateInstallResult>;
    onUpdateStatus: (listener: (payload: DesktopUpdateStatus) => void) => () => void;
}
