import { configurePermissions, pickDisplaySource } from './permissions';

describe('desktop permissions', () => {
    it('화면 캡처 소스는 전체 화면을 우선 선택함', () => {
        const source = pickDisplaySource([
            { id: 'window:1:0', name: 'Browser' },
            { id: 'screen:2:0', name: 'Main Display' },
        ] as Electron.DesktopCapturerSource[]);

        expect(source?.id).toBe('screen:2:0');
    });

    it('허용된 origin에서는 display-capture 요청을 승인함', async () => {
        let requestHandler: ((...args: any[]) => void) | null = null;

        configurePermissions({
            setPermissionCheckHandler: vi.fn(),
            setPermissionRequestHandler: vi.fn((handler) => {
                requestHandler = handler;
            }),
            setDisplayMediaRequestHandler: vi.fn(),
        }, {
            getSources: vi.fn(),
        });

        const result = await new Promise<boolean>((resolve) => {
            requestHandler?.({} as Electron.WebContents, 'display-capture', resolve, {
                requestingUrl: 'https://slacord.cloud/team/demo',
            } as Electron.PermissionRequest);
        });

        expect(result).toBe(true);
    });

    it('화면 공유 handler가 전체 화면 소스를 반환함', async () => {
        let displayHandler: ((...args: any[]) => Promise<void> | void) | null = null;
        const getSources = vi.fn().mockResolvedValue([
            { id: 'window:1:0', name: 'Browser' },
            { id: 'screen:1:0', name: 'Main Display' },
        ]);

        configurePermissions({
            setPermissionCheckHandler: vi.fn(),
            setPermissionRequestHandler: vi.fn(),
            setDisplayMediaRequestHandler: vi.fn((handler) => {
                displayHandler = handler;
            }),
        }, {
            getSources,
        });

        const callback = vi.fn();
        await displayHandler?.({
            frame: null,
            securityOrigin: 'https://slacord.cloud',
            videoRequested: true,
            audioRequested: false,
            userGesture: true,
        }, callback);

        expect(getSources).toHaveBeenCalledWith({ types: ['screen', 'window'] });
        expect(callback).toHaveBeenCalledWith({
            video: {
                id: 'screen:1:0',
                name: 'Main Display',
            },
        });
    });

    it('허용되지 않은 origin이면 화면 공유를 비워서 거절함', async () => {
        let displayHandler: ((...args: any[]) => Promise<void> | void) | null = null;

        configurePermissions({
            setPermissionCheckHandler: vi.fn(),
            setPermissionRequestHandler: vi.fn(),
            setDisplayMediaRequestHandler: vi.fn((handler) => {
                displayHandler = handler;
            }),
        }, {
            getSources: vi.fn(),
        });

        const callback = vi.fn();
        await displayHandler?.({
            frame: null,
            securityOrigin: 'https://malicious.example.com',
            videoRequested: true,
            audioRequested: false,
            userGesture: true,
        }, callback);

        expect(callback).toHaveBeenCalledWith({});
    });
});
