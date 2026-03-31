import type { Page } from 'playwright/test';
import type { AuthSession } from './slacord-api';

export async function loginWithSession(page: Page, session: AuthSession) {
    await page.goto('/auth/login');
    await page.getByPlaceholder('team@company.com').fill(session.email);
    await page.getByPlaceholder('비밀번호 입력').fill(session.password);
    await page.getByRole('button', { name: '로그인' }).click();
    await page.waitForURL('**/dashboard');
}
