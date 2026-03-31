import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { webkit } from 'playwright';

function getArg(name, fallback) {
    const flag = process.argv.find((arg) => arg.startsWith(`--${name}=`));
    return flag ? flag.slice(name.length + 3) : fallback;
}

const baseUrl = getArg('base-url', process.env.SLACORD_VERIFY_BASE_URL || 'http://127.0.0.1:3003');
const apiBaseUrl = getArg('api-url', process.env.SLACORD_VERIFY_API_URL || 'http://127.0.0.1:8084/api');
const outputDir = path.resolve(getArg('output-dir', process.env.SLACORD_VERIFY_OUTPUT_DIR || './artifacts/web-mobile-verify'));
const existingEmail = getArg('email', process.env.SLACORD_VERIFY_EMAIL || '');
const existingPassword = getArg('password', process.env.SLACORD_VERIFY_PASSWORD || '');
const existingTeamId = getArg('team-id', process.env.SLACORD_VERIFY_TEAM_ID || '');
const existingChannelId = getArg('channel-id', process.env.SLACORD_VERIFY_CHANNEL_ID || '');
const existingDocumentId = getArg('document-id', process.env.SLACORD_VERIFY_DOCUMENT_ID || '');

async function jsonFetch(pathName, { method = 'GET', token, body } = {}) {
    const response = await fetch(`${apiBaseUrl}${pathName}`, {
        method,
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: body ? JSON.stringify(body) : undefined,
    });

    const text = await response.text();
    const payload = text ? JSON.parse(text) : null;
    return { status: response.status, payload };
}

async function seedWorkspace() {
    const stamp = Date.now().toString();
    const email = `mobile_verify_${stamp}@example.com`;
    const password = 'test1234';
    const username = `mobileverify${stamp.slice(-6)}`;
    const slug = `mobile-verify-${stamp.slice(-6)}`;

    const register = await jsonFetch('/auth/register', {
        method: 'POST',
        body: { email, username, password },
    });

    if (register.status >= 400) {
        throw new Error(`회원가입 실패: ${JSON.stringify(register.payload)}`);
    }

    const login = await jsonFetch('/auth/login', {
        method: 'POST',
        body: { email, password },
    });

    const token = login.payload?.data?.accessToken;
    if (!token) throw new Error(`로그인 실패: ${JSON.stringify(login.payload)}`);

    const team = await jsonFetch('/team', {
        method: 'POST',
        token,
        body: { name: '모바일 검증 팀', slug },
    });
    const teamId = team.payload?.data?.id;
    if (!teamId) throw new Error(`팀 생성 실패: ${JSON.stringify(team.payload)}`);

    const channel = await jsonFetch(`/team/${teamId}/channel`, {
        method: 'POST',
        token,
        body: { name: 'general', type: 'public' },
    });

    const document = await jsonFetch(`/team/${teamId}/document`, {
        method: 'POST',
        token,
        body: {
            title: '모바일 검증 문서',
            content: '<table><tbody><tr><td>화면명</td><td>모바일에서도 정상 렌더링되어야 합니다.</td></tr></tbody></table>',
            contentFormat: 'html',
        },
    });

    await jsonFetch(`/team/${teamId}/issue`, {
        method: 'POST',
        token,
        body: {
            title: '모바일 이슈 검증',
            description: '모바일 보드와 필터 동작 확인',
            priority: 'medium',
        },
    });

    return {
        email,
        password,
        teamId,
        channelId: channel.payload?.data?.id,
        documentId: document.payload?.data?.id,
    };
}

async function loginForVerification(email, password) {
    const login = await jsonFetch('/auth/login', {
        method: 'POST',
        body: { email, password },
    });

    const token = login.payload?.data?.accessToken;
    if (!token) throw new Error(`로그인 실패: ${JSON.stringify(login.payload)}`);
    return token;
}

async function getVerificationTarget() {
    if (existingEmail && existingPassword && existingTeamId && existingChannelId && existingDocumentId) {
        await loginForVerification(existingEmail, existingPassword);
        return {
            email: existingEmail,
            password: existingPassword,
            teamId: existingTeamId,
            channelId: existingChannelId,
            documentId: existingDocumentId,
            seeded: false,
        };
    }

    return {
        ...(await seedWorkspace()),
        seeded: true,
    };
}

async function collectMetrics(page) {
    return page.evaluate(() => {
        const doc = document.documentElement;
        const body = document.body;
        const viewport = window.innerWidth;
        const scrollWidth = Math.max(doc.scrollWidth, body?.scrollWidth ?? 0);
        const isInsideSafeOverflow = (element) => {
            let current = element.parentElement;
            while (current) {
                const style = window.getComputedStyle(current);
                const allowsHorizontalScroll = ['auto', 'scroll'].includes(style.overflowX) && current.scrollWidth > current.clientWidth;
                if (allowsHorizontalScroll) return true;
                current = current.parentElement;
            }
            return false;
        };
        const offenders = [...document.querySelectorAll('*')]
            .map((element) => {
                const rect = element.getBoundingClientRect();
                return {
                    tag: element.tagName,
                    className: element.className,
                    right: rect.right,
                    left: rect.left,
                    width: rect.width,
                    safeOverflow: isInsideSafeOverflow(element),
                };
            })
            .filter((item) => !item.safeOverflow && (item.right > viewport + 1 || item.left < -1))
            .slice(0, 10);

        return {
            viewport,
            scrollWidth,
            horizontalOverflow: Math.max(0, scrollWidth - viewport),
            offenderCount: offenders.length,
            offenders,
            text: document.body.innerText.slice(0, 400),
        };
    });
}

function toResponseKey(rawUrl) {
    try {
        const parsed = new URL(rawUrl);
        return `${parsed.pathname}${parsed.search}`;
    } catch {
        return rawUrl;
    }
}

function extractAccessControlPath(message) {
    const match = message.match(/^\/[^/]+(?<path>\/api\/\S+?) due to access control checks\.$/);
    return match?.groups?.path ?? null;
}

function splitBenignAccessControlEvents(events, responseStatuses) {
    const filtered = [];
    const ignored = [];

    for (const event of events) {
        if (event.type !== 'pageerror') {
            filtered.push(event);
            continue;
        }

        const pathName = extractAccessControlPath(event.message);
        if (!pathName) {
            filtered.push(event);
            continue;
        }

        // WebKit이 same-origin API 성공 응답을 access control pageerror로 잘못 내보내는 경우가 있어,
        // 실제 응답 상태가 2xx/3xx인 요청만 오경보로 분리함.
        const status = responseStatuses.get(pathName);
        if (status && status < 400) {
            ignored.push(event);
            continue;
        }

        filtered.push(event);
    }

    return { filtered, ignored };
}

async function main() {
    const seeded = await getVerificationTarget();
    await fs.mkdir(outputDir, { recursive: true });

    const browser = await webkit.launch({ headless: true });
    const context = await browser.newContext({
        viewport: { width: 425, height: 733 },
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
    });
    const page = await context.newPage();
    const events = [];
    const responseStatuses = new Map();

    page.on('pageerror', (error) => {
        events.push({ type: 'pageerror', message: error.message });
    });

    page.on('console', (message) => {
        if (message.type() === 'error') {
            events.push({ type: 'console', message: message.text() });
        }
    });

    page.on('response', (response) => {
        responseStatuses.set(toResponseKey(response.url()), response.status());
    });

    await page.goto(`${baseUrl}/auth/login`, { waitUntil: 'networkidle' });
    await page.fill('input[type="email"]', seeded.email);
    await page.fill('input[type="password"]', seeded.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');

    const routes = [
        '/dashboard',
        `/${seeded.teamId}`,
        `/${seeded.teamId}/channel/${seeded.channelId}`,
        `/${seeded.teamId}/docs`,
        `/${seeded.teamId}/docs/${seeded.documentId}`,
        `/${seeded.teamId}/issues`,
        `/${seeded.teamId}/settings`,
    ];

    const results = [];
    for (const route of routes) {
        await page.goto(`${baseUrl}${route}`, { waitUntil: 'networkidle' });
        await page.screenshot({
            path: path.join(outputDir, `${route.replaceAll('/', '_') || 'root'}.png`),
            fullPage: true,
        });

        const { filtered, ignored } = splitBenignAccessControlEvents(events, responseStatuses);

        results.push({
            route,
            metrics: await collectMetrics(page),
            events: filtered,
            ignoredEvents: ignored,
        });
    }

    await browser.close();

    const summary = {
        baseUrl,
        apiBaseUrl,
        seeded,
        results,
    };

    await fs.writeFile(path.join(outputDir, 'results.json'), JSON.stringify(summary, null, 2));
    console.log(JSON.stringify(summary, null, 2));
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
