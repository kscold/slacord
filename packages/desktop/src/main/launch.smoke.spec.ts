import http from 'node:http';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { execFileSync, spawn, type ChildProcess } from 'node:child_process';

const require = createRequire(import.meta.url);
const currentDir = path.dirname(fileURLToPath(import.meta.url));
const packageRoot = path.resolve(currentDir, '../..');
const electronBinary = require('electron');

function createSmokeServer() {
    let resolveReady: ((payload: Record<string, string>) => void) | null = null;
    const readyPromise = new Promise<Record<string, string>>((resolve) => {
        resolveReady = resolve;
    });

    const server = http.createServer((request, response) => {
        if (request.url === '/favicon.ico') {
            response.writeHead(204).end();
            return;
        }

        if (request.url?.startsWith('/__desktop_ready__')) {
            const url = new URL(request.url, 'http://127.0.0.1');
            resolveReady?.(Object.fromEntries(url.searchParams.entries()));
            response.writeHead(204).end();
            return;
        }

        response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        response.end(`<!doctype html>
<html lang="ko">
  <head>
    <meta charset="utf-8" />
    <title>Slacord Desktop Smoke</title>
  </head>
  <body>
    <h1 id="status">대기 중</h1>
    <script>
      const bridge = window.slacordDesktop;
      const target = document.getElementById('status');
      if (bridge && bridge.isDesktop && typeof bridge.getUpdateStatus === 'function') {
        target.textContent = '데스크톱 브리지 준비';
        fetch('/__desktop_ready__?desktop=1&notify=' + Number(typeof bridge.notify === 'function') + '&updater=' + Number(typeof bridge.getUpdateStatus === 'function') + '&href=' + encodeURIComponent(window.location.pathname));
      } else {
        target.textContent = '브리지 누락';
        fetch('/__desktop_ready__?desktop=0&notify=0&updater=0&href=' + encodeURIComponent(window.location.pathname));
      }
    </script>
  </body>
</html>`);
    }) as http.Server & {
        waitForReady: () => Promise<Record<string, string>>;
    };

    (server as any).waitForReady = () => readyPromise;
    return server;
}

describe('desktop launch smoke', () => {
    let server: http.Server & {
        waitForReady: () => Promise<Record<string, string>>;
    };
    let baseUrl = '';

    beforeAll(async () => {
        execFileSync('yarn', ['build'], { cwd: packageRoot, stdio: 'pipe' });
        server = createSmokeServer();
        await new Promise<void>((resolve) => {
            server.listen(0, '127.0.0.1', () => resolve());
        });
        const address = server.address();
        if (!address || typeof address === 'string') {
            throw new Error('스모크 서버 포트를 확인하지 못했어요.');
        }
        baseUrl = `http://127.0.0.1:${address.port}/auth/login`;
    });

    afterAll(async () => {
        await new Promise<void>((resolve, reject) => {
            server.close((error) => {
                if (error) reject(error);
                else resolve();
            });
        });
    });

    it('Electron 앱이 실행되고 preload 브리지가 렌더러에 노출됨', async () => {
        const logs: string[] = [];
        const appEnv = {
            ...process.env,
            ELECTRON_DISABLE_SECURITY_WARNINGS: '1',
            SLACORD_DESKTOP_START_URL: baseUrl,
        };
        delete appEnv.ELECTRON_RUN_AS_NODE;
        const app = spawn(electronBinary, ['.'], {
            cwd: packageRoot,
            env: appEnv,
            stdio: ['ignore', 'pipe', 'pipe'],
        });

        app.stdout?.on('data', (chunk) => {
            logs.push(String(chunk));
        });
        app.stderr?.on('data', (chunk) => {
            logs.push(String(chunk));
        });

        try {
            const ready = await Promise.race([
                server.waitForReady(),
                new Promise<Record<string, string>>((_, reject) => {
                    const timeout = setTimeout(() => {
                        reject(new Error(`Electron 스모크 준비 콜백을 기다리다 시간 초과가 났어요.\n${logs.join('')}`));
                    }, 20000);
                    app.once('exit', (code) => {
                        clearTimeout(timeout);
                        reject(new Error(`Electron 프로세스가 먼저 종료됐어요. code=${code}\n${logs.join('')}`));
                    });
                }),
            ]);

            expect(ready).toEqual({
                desktop: '1',
                notify: '1',
                updater: '1',
                href: '/auth/login',
            });
        } finally {
            await stopProcess(app);
        }
    });
});

async function stopProcess(process: ChildProcess) {
    if (process.exitCode !== null) return;
    process.kill('SIGTERM');
    await new Promise<void>((resolve) => {
        const fallback = setTimeout(() => {
            if (process.exitCode === null) process.kill('SIGKILL');
        }, 3000);
        process.once('exit', () => {
            clearTimeout(fallback);
            resolve();
        });
    });
}
