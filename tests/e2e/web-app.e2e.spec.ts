import { expect, test, type Page } from "playwright/test";
import {
  createAssignedIssue,
  createChannel,
  createGuestSessionForTeam,
  createWorkspaceFixture,
  e2eBaseUrl,
  jsonFetch,
  sendSocketMessage,
  type WorkspaceFixture,
} from "./support/slacord-api";
import { loginWithSession } from "./support/slacord-session";

async function mockHuddleMedia(page: Page) {
  await page.addInitScript(() => {
    const mediaStore: Array<{
      canvas?: HTMLCanvasElement;
      context?: AudioContext;
      stream: MediaStream;
    }> = [];

    const makeVideoStream = (label: string) => {
      const canvas = document.createElement("canvas");
      canvas.width = 640;
      canvas.height = 360;
      const context = canvas.getContext("2d");
      context?.fillRect(0, 0, canvas.width, canvas.height);
      context?.fillText(label, 24, 48);
      const stream = canvas.captureStream(5);
      mediaStore.push({ canvas, stream });
      return stream;
    };

    const makeAudioTrack = () => {
      const context = new AudioContext();
      const destination = context.createMediaStreamDestination();
      mediaStore.push({ context, stream: destination.stream });
      return destination.stream.getAudioTracks()[0] ?? null;
    };

    Object.defineProperty(navigator.mediaDevices, "getUserMedia", {
      configurable: true,
      value: async (constraints: MediaStreamConstraints) => {
        const stream = new MediaStream();
        if (constraints.audio) {
          const audioTrack = makeAudioTrack();
          if (audioTrack) stream.addTrack(audioTrack);
        }
        if (constraints.video) {
          const videoStream = makeVideoStream("camera");
          const videoTrack = videoStream.getVideoTracks()[0];
          if (videoTrack) stream.addTrack(videoTrack);
        }
        return stream;
      },
    });

    Object.defineProperty(navigator.mediaDevices, "getDisplayMedia", {
      configurable: true,
      value: async () => makeVideoStream("screen"),
    });

    (
      window as typeof window & { __slacordTestMedia?: typeof mediaStore }
    ).__slacordTestMedia = mediaStore;
  });
}

test.describe.serial("slacord web e2e", () => {
  let fixture: WorkspaceFixture;

  test.beforeAll(async () => {
    fixture = await createWorkspaceFixture();
  });

  test("로그인 후 대시보드에서 워크스페이스와 채널로 이동함", async ({
    page,
  }) => {
    await loginWithSession(page, fixture.owner);

    await expect(
      page.getByRole("heading", { name: "워크스페이스" }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: fixture.teamName }),
    ).toBeVisible();

    await page.getByRole("link", { name: fixture.teamName }).click();
    await page.waitForURL(`**/${fixture.teamId}`);
    await expect(
      page.getByRole("heading", { name: /작업 공간/ }),
    ).toBeVisible();

    await page
      .getByRole("link", { name: new RegExp(`# ${fixture.channelName}`) })
      .first()
      .click();
    await page.waitForURL(`**/${fixture.teamId}/channel/${fixture.channelId}`);
    await expect(
      page.getByRole("textbox", { name: /메시지 보내기/ }),
    ).toBeVisible();
  });

  test("문서 목록에서 문서를 찾고 새 문서를 만든 뒤 편집 화면으로 진입함", async ({
    page,
  }) => {
    await loginWithSession(page, fixture.owner);
    await page.goto(`/${fixture.teamId}/docs`);

    await page.getByPlaceholder("문서 제목으로 찾기").fill("E2E 문서");
    await page.getByRole("link", { name: /E2E 문서/ }).click();
    await page.waitForURL(`**/${fixture.teamId}/docs/${fixture.documentId}`);
    await expect(page.getByText("문서 검증 본문")).toBeVisible();

    await page.goto(`/${fixture.teamId}/docs`);
    await page.getByRole("button", { name: "문서 생성" }).click();
    const title = `문서 생성 검증 ${Date.now().toString().slice(-4)}`;
    await page.getByRole("textbox", { name: "문서 제목" }).fill(title);
    await page.getByRole("button", { name: "생성", exact: true }).click();

    await page.waitForURL(new RegExp(`/${fixture.teamId}/docs/.+\\?edit=1`));
    await expect(page.getByRole("button", { name: "저장" })).toBeVisible();
    await expect(page.locator("input").first()).toHaveValue(title);
  });

  test("이슈를 만들고 서버 검색 필터로 찾은 뒤 수정 모달을 연다", async ({
    page,
  }) => {
    await loginWithSession(page, fixture.owner);
    await page.goto(`/${fixture.teamId}/issues`);

    await page.getByRole("button", { name: "이슈 생성" }).click();
    const title = `이슈 생성 검증 ${Date.now().toString().slice(-4)}`;
    await page
      .getByRole("textbox", { name: "이슈 제목", exact: true })
      .fill(title);
    await page
      .getByPlaceholder("이슈 설명을 입력해 주세요")
      .fill("브라우저 상호작용으로 만든 이슈입니다.");
    await page.getByRole("button", { name: "생성", exact: true }).click();

    await expect(
      page.getByRole("button", { name: new RegExp(title) }).first(),
    ).toBeVisible();
    await page
      .getByPlaceholder("이슈 제목이나 설명을 검색해 보세요")
      .fill(title);
    await expect(
      page.getByRole("button", { name: new RegExp(title) }).first(),
    ).toBeVisible();

    await page
      .getByRole("button", { name: new RegExp(title) })
      .first()
      .click();
    await expect(
      page.getByRole("heading", { name: "이슈 수정" }),
    ).toBeVisible();
  });

  test("알림 센터에서 새 할당 알림을 읽고 이슈 화면으로 이동함", async ({
    page,
  }) => {
    await loginWithSession(page, fixture.owner);

    const issueTitle = `알림 검증 이슈 ${Date.now().toString().slice(-4)}`;
    const issueId = await createAssignedIssue({
      actor: fixture.actor,
      owner: fixture.owner,
      teamId: fixture.teamId,
      title: issueTitle,
    });

    await page.goto(`/${fixture.teamId}`);
    await page.getByRole("button", { name: /알림/ }).click();
    await expect(page.getByText(issueTitle)).toBeVisible();

    await page.getByRole("button", { name: new RegExp(issueTitle) }).click();
    await page.waitForURL(`**/${fixture.teamId}/issues?issue=${issueId}`);
    await expect(
      page.getByRole("heading", { name: "이슈 수정" }),
    ).toBeVisible();
  });

  test("허들을 시작하고 화면 공유를 토글함", async ({ page }) => {
    await mockHuddleMedia(page);
    await loginWithSession(page, fixture.owner);
    await page.goto(`/${fixture.teamId}/channel/${fixture.channelId}`);

    await page.getByRole("button", { name: "허들" }).click();
    await expect(page.getByText("허들")).toBeVisible();

    const shareButton = page.getByRole("button", { name: "화면 공유 시작" });
    await expect(shareButton).toBeVisible();
    await shareButton.click();

    await expect(page.getByText("화면 공유 중")).toBeVisible();
    await page.getByRole("button", { name: "화면 공유 중지" }).click();
    await expect(page.getByText("화면 공유 중")).toHaveCount(0);
  });

  test("멘션 알림과 채널 언리드 배지가 화면에 반영됨", async ({ browser }) => {
    const extraChannelName = `focus-${Date.now().toString().slice(-4)}`;
    const extraChannelId = await createChannel({
      teamId: fixture.teamId,
      token: fixture.owner.token,
      name: extraChannelName,
    });

    const ownerContext = await browser.newContext({ baseURL: e2eBaseUrl });
    const ownerPage = await ownerContext.newPage();

    await loginWithSession(ownerPage, fixture.owner);
    await ownerPage.goto(`/${fixture.teamId}/channel/${fixture.channelId}`);
    await ownerPage
      .getByRole("link", { name: `# ${extraChannelName}` })
      .first()
      .click();
    await ownerPage.waitForURL(
      `**/${fixture.teamId}/channel/${extraChannelId}`,
    );
    await ownerPage.waitForTimeout(1000);

    await sendSocketMessage({
      session: fixture.actor,
      teamId: fixture.teamId,
      channelId: fixture.channelId,
      content: `안녕 @${fixture.owner.username}`,
    });

    await ownerPage.bringToFront();
    await ownerPage.reload();

    const unreadLink = ownerPage.getByRole("link", {
      name: new RegExp(`# ${fixture.channelName}`),
    }).first();
    await expect(unreadLink).toContainText("@1");

    const notificationButton = ownerPage
      .getByRole("button", { name: /알림/ })
      .first();
    await notificationButton.click();
    await expect(
      ownerPage.getByText(`안녕 @${fixture.owner.username}`),
    ).toBeVisible();
    await notificationButton.click();

    await unreadLink.click();
    await ownerPage.waitForURL(
      `**/${fixture.teamId}/channel/${fixture.channelId}`,
    );
    await ownerPage.reload();
    await expect(unreadLink).not.toContainText("@1");

    await ownerContext.close();
  });

  test("채팅에서 이미지와 동영상을 함께 올리고 인라인으로 본다", async ({
    page,
  }) => {
    await loginWithSession(page, fixture.owner);
    await page.goto(`/${fixture.teamId}/channel/${fixture.channelId}`);

    const fileChooserPromise = page.waitForEvent("filechooser");
    await page.getByRole("button", { name: "파일 첨부" }).click();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles([
      {
        name: "preview.png",
        mimeType: "image/png",
        buffer: Buffer.from(
          "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9WlAbVYAAAAASUVORK5CYII=",
          "base64",
        ),
      },
      {
        name: "teaser.mp4",
        mimeType: "video/mp4",
        buffer: Buffer.from("00000020667479706d703432000000006d70343269736f6d", "hex"),
      },
    ]);

    await expect(page.getByText("업로드 준비")).toBeVisible();
    await expect(page.getByText("2개 파일")).toBeVisible();
    await expect(page.getByText("preview.png")).toBeVisible();
    await expect(page.getByText("teaser.mp4")).toBeVisible();

    await page.getByRole("button", { name: "메시지 보내기" }).click();

    await expect(page.getByText("preview.png")).toBeVisible();
    await expect(page.locator('img[alt="preview.png"]').first()).toBeVisible();
    await expect(page.locator('video[src*="teaser.mp4"]').first()).toBeVisible();
  });

  test("guest는 워크스페이스를 읽기 전용으로 사용한다", async ({ page }) => {
    const guest = await createGuestSessionForTeam({
      ownerToken: fixture.owner.token,
      teamId: fixture.teamId,
    });

    await loginWithSession(page, guest);
    await page.goto(`/${fixture.teamId}/channel/${fixture.channelId}`);

    const composer = page.locator("textarea").first();
    await expect(composer).toHaveAttribute("readonly", "");
    await expect(
      page.getByRole("button", { name: "메시지 보내기" }),
    ).toBeDisabled();
    await expect(
      page.getByRole("button", { name: "파일 첨부" }),
    ).toBeDisabled();
    await expect(page.getByRole("button", { name: "허들" })).toBeDisabled();
    await expect(
      page.getByText("guest는 메시지 작성, 파일 업로드, 스레드 답글을 보낼 수 없습니다."),
    ).toBeVisible();

    await page.goto(`/${fixture.teamId}/docs`);
    await expect(page.getByRole("button", { name: "문서 생성" })).toHaveCount(0);
    await expect(
      page.getByText("guest는 문서를 읽고 탐색할 수 있지만 새 문서를 만들 수는 없습니다."),
    ).toBeVisible();

    await page.goto(`/${fixture.teamId}/issues`);
    await expect(page.getByRole("button", { name: "이슈 생성" })).toHaveCount(0);
    await expect(
      page.getByText("guest는 이슈를 조회만 할 수 있습니다."),
    ).toBeVisible();

    await page.goto(`/${fixture.teamId}/announcements`);
    await expect(
      page.getByRole("button", { name: "공지 작성" }),
    ).toHaveCount(0);
    await expect(
      page.getByText("guest는 공지를 읽기만 할 수 있습니다."),
    ).toBeVisible();
  });

  test("설정 페이지에서 외부 브리지 relay 구성을 저장함", async ({ page }) => {
    await loginWithSession(page, fixture.owner);
    await page.goto(`/${fixture.teamId}/settings`);

    const slackCard = page.locator("article").filter({
      hasText: "Slack Relay Worker",
    });
    const discordCard = page.locator("article").filter({
      hasText: "Discord Relay Worker",
    });

    await slackCard.getByRole("checkbox", { name: "활성화" }).check();
    await slackCard
      .getByLabel("Webhook URL")
      .fill("https://hooks.slack.com/services/test/e2e/path");
    await slackCard.getByRole("checkbox", { name: "공지 relay" }).check();
    await slackCard.getByRole("checkbox", { name: "GitHub relay" }).check();

    await discordCard.getByRole("checkbox", { name: "활성화" }).check();
    await discordCard
      .getByLabel("Webhook URL")
      .fill("https://discord.com/api/webhooks/test/e2e-path");
    await discordCard.getByRole("checkbox", { name: "공지 relay" }).check();

    await page.getByRole("button", { name: "브리지 설정 저장" }).click();
    await expect(page.getByText("브리지 설정 저장 완료됨")).toBeVisible();

    const team = await jsonFetch<{
      bridgeConfig: {
        slack: {
          enabled: boolean;
          webhookUrl: string;
          relayAnnouncements: boolean;
          relayGithub: boolean;
        };
        discord: {
          enabled: boolean;
          webhookUrl: string;
          relayAnnouncements: boolean;
          relayGithub: boolean;
        };
      };
    }>(`/team/${fixture.teamId}`, {
      token: fixture.owner.token,
    });

    expect(team.data?.bridgeConfig.slack).toMatchObject({
      enabled: true,
      webhookUrl: "https://hooks.slack.com/services/test/e2e/path",
      relayAnnouncements: true,
      relayGithub: true,
    });
    expect(team.data?.bridgeConfig.discord).toMatchObject({
      enabled: true,
      webhookUrl: "https://discord.com/api/webhooks/test/e2e-path",
      relayAnnouncements: true,
      relayGithub: false,
    });
  });
});
