import { defineConfig } from 'playwright/test';

export default defineConfig({
    testDir: './tests/e2e',
    fullyParallel: false,
    workers: 1,
    timeout: 30_000,
    expect: {
        timeout: 10_000,
    },
    use: {
        baseURL: process.env.SLACORD_E2E_BASE_URL || 'http://127.0.0.1:3003',
        trace: 'retain-on-failure',
        screenshot: 'only-on-failure',
        video: 'retain-on-failure',
        viewport: { width: 1440, height: 960 },
    },
    reporter: [['list'], ['html', { open: 'never' }]],
});
