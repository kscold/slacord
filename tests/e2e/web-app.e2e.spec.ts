import { expect, test } from 'playwright/test';
import { createAssignedIssue, createWorkspaceFixture, type WorkspaceFixture } from './support/slacord-api';
import { loginWithSession } from './support/slacord-session';

test.describe.serial('slacord web e2e', () => {
    let fixture: WorkspaceFixture;

    test.beforeAll(async () => {
        fixture = await createWorkspaceFixture();
    });

    test('로그인 후 대시보드에서 워크스페이스와 채널로 이동함', async ({ page }) => {
        await loginWithSession(page, fixture.owner);

        await expect(page.getByRole('heading', { name: '워크스페이스' })).toBeVisible();
        await expect(page.getByRole('link', { name: fixture.teamName })).toBeVisible();

        await page.getByRole('link', { name: fixture.teamName }).click();
        await page.waitForURL(`**/${fixture.teamId}`);
        await expect(page.getByRole('heading', { name: `${fixture.teamName} 작업 공간` })).toBeVisible();

        await page.getByRole('link', { name: '대화 시작하기' }).click();
        await page.waitForURL(`**/${fixture.teamId}/channel/${fixture.channelId}`);
        await expect(page.getByRole('textbox', { name: /메시지 보내기/ })).toBeVisible();
    });

    test('문서 목록에서 문서를 찾고 새 문서를 만든 뒤 편집 화면으로 진입함', async ({ page }) => {
        await loginWithSession(page, fixture.owner);
        await page.goto(`/${fixture.teamId}/docs`);

        await page.getByPlaceholder('문서 제목으로 찾기').fill('E2E 문서');
        await page.getByRole('link', { name: /E2E 문서/ }).click();
        await page.waitForURL(`**/${fixture.teamId}/docs/${fixture.documentId}`);
        await expect(page.getByText('문서 검증 본문')).toBeVisible();

        await page.goto(`/${fixture.teamId}/docs`);
        await page.getByRole('button', { name: '문서 생성' }).click();
        const title = `문서 생성 검증 ${Date.now().toString().slice(-4)}`;
        await page.getByRole('textbox', { name: '문서 제목' }).fill(title);
        await page.getByRole('button', { name: '생성', exact: true }).click();

        await page.waitForURL(new RegExp(`/${fixture.teamId}/docs/.+\\?edit=1`));
        await expect(page.getByRole('button', { name: '저장' })).toBeVisible();
        await expect(page.locator('input').first()).toHaveValue(title);
    });

    test('이슈를 만들고 서버 검색 필터로 찾은 뒤 수정 모달을 연다', async ({ page }) => {
        await loginWithSession(page, fixture.owner);
        await page.goto(`/${fixture.teamId}/issues`);

        await page.getByRole('button', { name: '이슈 생성' }).click();
        const title = `이슈 생성 검증 ${Date.now().toString().slice(-4)}`;
        await page.getByRole('textbox', { name: '이슈 제목', exact: true }).fill(title);
        await page.getByPlaceholder('이슈 설명을 입력해 주세요').fill('브라우저 상호작용으로 만든 이슈입니다.');
        await page.getByRole('button', { name: '생성', exact: true }).click();

        await expect(page.getByRole('button', { name: new RegExp(title) }).first()).toBeVisible();
        await page.getByPlaceholder('이슈 제목이나 설명을 검색해 보세요').fill(title);
        await expect(page.getByRole('button', { name: new RegExp(title) }).first()).toBeVisible();

        await page.getByRole('button', { name: new RegExp(title) }).first().click();
        await expect(page.getByRole('heading', { name: '이슈 수정' })).toBeVisible();
    });

    test('알림 센터에서 새 할당 알림을 읽고 이슈 화면으로 이동함', async ({ page }) => {
        await loginWithSession(page, fixture.owner);

        const issueTitle = `알림 검증 이슈 ${Date.now().toString().slice(-4)}`;
        const issueId = await createAssignedIssue({
            actor: fixture.actor,
            owner: fixture.owner,
            teamId: fixture.teamId,
            title: issueTitle,
        });

        await page.goto(`/${fixture.teamId}`);
        await page.getByRole('button', { name: /알림/ }).click();
        await expect(page.getByText(issueTitle)).toBeVisible();

        await page.getByRole('button', { name: new RegExp(issueTitle) }).click();
        await page.waitForURL(`**/${fixture.teamId}/issues?issue=${issueId}`);
        await expect(page.getByRole('heading', { name: '이슈 수정' })).toBeVisible();
    });
});
