import crypto from "node:crypto";
import fs from "node:fs/promises";
import http from "node:http";
import path from "node:path";
import process from "node:process";
import { io } from "socket.io-client";

const apiBaseUrl = normalizeBaseUrl(
  process.env.SLACORD_LIVE_API_URL || "http://127.0.0.1:8084/api",
);
const socketBaseUrl = normalizeBaseUrl(
  process.env.SLACORD_LIVE_SOCKET_URL || apiBaseUrl.replace(/\/api$/, ""),
);
const reportDir = path.resolve(
  process.env.SLACORD_LIVE_REPORT_DIR || "./artifacts/live-surface-check",
);
const reportPath = path.join(reportDir, "report.json");

const results = [];
const context = {
  teamId: null,
  teamSlug: null,
  channels: {},
  users: {},
  messageIds: {},
  documentIds: {},
  issueIds: {},
  notificationIds: [],
};

function normalizeBaseUrl(value) {
  return value.replace(/\/+$/, "");
}

function formatError(error) {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

function summarize(payload) {
  if (payload === undefined || payload === null) return "";
  if (typeof payload === "string") return payload;
  return JSON.stringify(payload);
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function log(status, scope, name, detail = "") {
  const suffix = detail ? ` - ${detail}` : "";
  console.log(`[${status.toUpperCase()}] ${scope} :: ${name}${suffix}`);
}

async function check(scope, name, fn) {
  try {
    const detail = await fn();
    results.push({ scope, name, status: "passed", detail: summarize(detail) });
    log("pass", scope, name, summarize(detail));
  } catch (error) {
    results.push({ scope, name, status: "failed", detail: formatError(error) });
    log("fail", scope, name, formatError(error));
  }
}

async function skip(scope, name, detail) {
  results.push({ scope, name, status: "skipped", detail });
  log("skip", scope, name, detail);
}

async function api(pathName, options = {}) {
  const url = `${apiBaseUrl}${pathName}`;
  const headers = {
    ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
    ...(options.headers || {}),
  };
  const init = {
    method: options.method || "GET",
    headers,
  };

  if (options.formData) {
    init.body = options.formData;
  } else if (options.body !== undefined) {
    init.body = JSON.stringify(options.body);
    init.headers = {
      "Content-Type": "application/json",
      ...headers,
    };
  }

  const response = await fetch(url, init);
  const text = await response.text();
  const payload = parsePayload(text);

  if (options.expectOk !== false && !response.ok) {
    throw new Error(
      `HTTP ${response.status} ${pathName}: ${summarize(payload)}`,
    );
  }

  return { status: response.status, payload };
}

function parsePayload(text) {
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

async function expectFailure(pathName, options = {}, matcher) {
  const response = await api(pathName, { ...options, expectOk: false });
  if (response.status < 400) {
    throw new Error(`실패를 기대했지만 ${response.status} 응답을 받았습니다.`);
  }
  if (matcher && !matcher(response)) {
    throw new Error(
      `실패 응답이 기대와 다릅니다: ${summarize(response.payload)}`,
    );
  }
  return response;
}

async function createSession(label) {
  const stamp = `${Date.now()}-${Math.round(Math.random() * 1000)}`;
  const email = `live_${label}_${stamp}@example.com`;
  const password = "test1234";
  const username = `${label}_${stamp.slice(-6)}`;

  await api("/auth/register", {
    method: "POST",
    body: { email, password, username },
  });

  const login = await api("/auth/login", {
    method: "POST",
    body: { email, password },
  });
  const token = login.payload?.data?.accessToken;
  assert(token, `${label} 로그인 토큰이 없습니다.`);

  const me = await api("/auth/me", { token });
  assert(me.payload?.data?.id, `${label} 내 정보 조회가 실패했습니다.`);

  return {
    email,
    password,
    token,
    userId: me.payload.data.id,
    username: me.payload.data.username,
  };
}

function createTextFile(name, content, type = "text/plain") {
  return new File([content], name, { type });
}

function createTinyPngFile(name = "pixel.png") {
  const png = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9WlAbVYAAAAASUVORK5CYII=",
    "base64",
  );
  return new File([png], name, { type: "image/png" });
}

function createTinyMp4File(name = "clip.mp4") {
  const mp4 = Buffer.from("00000020667479706d703432000000006d70343269736f6d", "hex");
  return new File([mp4], name, { type: "video/mp4" });
}

async function connectSocket(namespace, token, label) {
  const socket = io(`${socketBaseUrl}/${namespace}`, {
    path: "/socket.io",
    transports: ["websocket"],
    auth: { token },
    forceNew: true,
    reconnection: false,
  });

  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      cleanup();
      reject(new Error(`${label} 소켓 연결 시간 초과`));
    }, 5000);

    const cleanup = () => {
      clearTimeout(timer);
      socket.off("connect", onConnect);
      socket.off("connect_error", onError);
    };

    const onConnect = () => {
      cleanup();
      resolve();
    };

    const onError = (error) => {
      cleanup();
      reject(new Error(`${label} 소켓 연결 실패: ${formatError(error)}`));
    };

    socket.on("connect", onConnect);
    socket.on("connect_error", onError);
  });

  return socket;
}

function waitForEvent(
  socket,
  eventName,
  predicate = () => true,
  timeoutMs = 5000,
) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      cleanup();
      reject(
        new Error(`${eventName} 이벤트를 ${timeoutMs}ms 안에 받지 못했습니다.`),
      );
    }, timeoutMs);

    const cleanup = () => {
      clearTimeout(timer);
      socket.off(eventName, onEvent);
      socket.off("error", onError);
    };

    const onEvent = (payload) => {
      try {
        if (!predicate(payload)) return;
        cleanup();
        resolve(payload);
      } catch (error) {
        cleanup();
        reject(error);
      }
    };

    const onError = (payload) => {
      cleanup();
      reject(new Error(`소켓 에러: ${summarize(payload)}`));
    };

    socket.on(eventName, onEvent);
    socket.on("error", onError);
  });
}

function expectNoEvent(
  socket,
  eventName,
  predicate = () => true,
  timeoutMs = 1200,
) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      cleanup();
      resolve(null);
    }, timeoutMs);

    const cleanup = () => {
      clearTimeout(timer);
      socket.off(eventName, onEvent);
    };

    const onEvent = (payload) => {
      try {
        if (!predicate(payload)) return;
        cleanup();
        reject(
          new Error(
            `${eventName} 이벤트가 오면 안 되는데 수신했습니다: ${summarize(payload)}`,
          ),
        );
      } catch (error) {
        cleanup();
        reject(error);
      }
    };

    socket.on(eventName, onEvent);
  });
}

async function emitWithAck(socket, eventName, payload) {
  if (
    typeof socket.timeout === "function" &&
    typeof socket.timeout(5000).emitWithAck === "function"
  ) {
    return socket.timeout(5000).emitWithAck(eventName, payload);
  }

  return new Promise((resolve, reject) => {
    socket.timeout(5000).emit(eventName, payload, (error, response) => {
      if (error) {
        reject(new Error(`${eventName} ACK 실패: ${formatError(error)}`));
        return;
      }
      resolve(response);
    });
  });
}

async function joinChannel(socket, channelId) {
  const joined = waitForEvent(
    socket,
    "joined_channel",
    (payload) => payload?.channelId === channelId,
  );
  socket.emit("join_channel", { channelId });
  await joined;
}

async function startConfluenceStub() {
  const pages = [
    {
      id: "100",
      title: "Confluence Root",
      parentId: null,
      body: { storage: { value: "<p>Imported root page</p>" } },
      _links: { webui: "/wiki/spaces/SLACORD/pages/100" },
    },
    {
      id: "101",
      title: "Confluence Child",
      parentId: "100",
      body: { storage: { value: "<p>Imported child page</p>" } },
      _links: { webui: "/wiki/spaces/SLACORD/pages/101" },
    },
  ];

  const server = http.createServer((req, res) => {
    const url = new URL(req.url || "/", "http://127.0.0.1");
    res.setHeader("Content-Type", "application/json");

    if (url.pathname === "/wiki/api/v2/spaces") {
      res.end(JSON.stringify({ results: [{ id: "space-1", key: "SLACORD" }] }));
      return;
    }

    if (url.pathname === "/wiki/api/v2/pages") {
      res.end(JSON.stringify({ results: pages, _links: { next: "" } }));
      return;
    }

    res.statusCode = 404;
    res.end(JSON.stringify({ message: "not found" }));
  });

  await new Promise((resolve) => server.listen(0, "0.0.0.0", resolve));
  const address = server.address();
  return {
    server,
    port: typeof address === "object" && address ? address.port : null,
  };
}

async function writeReport() {
  await fs.mkdir(reportDir, { recursive: true });
  const summary = results.reduce(
    (acc, result) => {
      acc[result.status] += 1;
      return acc;
    },
    { passed: 0, failed: 0, skipped: 0 },
  );

  await fs.writeFile(
    reportPath,
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        apiBaseUrl,
        socketBaseUrl,
        summary,
        context: {
          teamId: context.teamId,
          teamSlug: context.teamSlug,
          channels: context.channels,
          documents: context.documentIds,
          issues: context.issueIds,
          notifications: context.notificationIds,
        },
        results,
      },
      null,
      2,
    ),
  );

  return summary;
}

async function main() {
  const health = await api("/health");
  assert(
    health.payload?.status === "ok" || health.payload?.success !== false,
    "대상 API가 정상 응답하지 않습니다.",
  );

  await check("setup", "사용자 6명 생성", async () => {
    context.users.owner = await createSession("owner");
    context.users.actor = await createSession("actor");
    context.users.allowedMember = await createSession("allowed");
    context.users.deniedMember = await createSession("denied");
    context.users.guest = await createSession("guest");
    context.users.outsider = await createSession("outsider");
    return Object.keys(context.users).join(", ");
  });

  await check("team", "워크스페이스 생성", async () => {
    const slug = `live-surface-${Date.now().toString().slice(-6)}`;
    const response = await api("/team", {
      method: "POST",
      token: context.users.owner.token,
      body: {
        name: "Live Surface Team",
        slug,
        description: "자동 라이브 기능 검증용 팀",
      },
    });
    context.teamId = response.payload?.data?.id;
    context.teamSlug = slug;
    assert(context.teamId, "teamId를 받지 못했습니다.");
    return `${context.teamId} (${context.teamSlug})`;
  });

  await check("team", "슬러그로 팀 참여", async () => {
    await api(`/team/${context.teamSlug}/join`, {
      method: "POST",
      token: context.users.actor.token,
    });
    await api(`/team/${context.teamSlug}/join`, {
      method: "POST",
      token: context.users.allowedMember.token,
    });
    return "actor, allowedMember joined";
  });

  let oneTimeInvite = null;
  await check("team", "1회용 초대 링크 생성", async () => {
    const response = await api(`/team/${context.teamId}/invite-links`, {
      method: "POST",
      token: context.users.owner.token,
      body: {
        label: "one-time",
        maxUses: 1,
        expiresInDays: 7,
      },
    });
    oneTimeInvite = response.payload?.data?.code;
    assert(oneTimeInvite, "초대 코드가 없습니다.");
    return oneTimeInvite;
  });

  await check("team", "초대 링크 미리보기", async () => {
    const response = await api(`/team/invite/${oneTimeInvite}`, {
      expectOk: true,
    });
    assert(
      response.payload?.data?.code === oneTimeInvite,
      "초대 미리보기 코드가 다릅니다.",
    );
    return response.payload?.data?.label || "preview ok";
  });

  await check("team", "초대 링크로 일반 멤버 참여", async () => {
    await api(`/team/invite/${oneTimeInvite}/join`, {
      method: "POST",
      token: context.users.deniedMember.token,
    });
    return context.users.deniedMember.userId;
  });

  await check("team", "초대 링크 최대 사용 횟수 차단", async () => {
    await expectFailure(`/team/invite/${oneTimeInvite}/join`, {
      method: "POST",
      token: context.users.outsider.token,
    });
    return "2nd join denied";
  });

  await check("team", "일반 멤버 초대 생성 차단", async () => {
    await expectFailure(`/team/${context.teamId}/invite-links`, {
      method: "POST",
      token: context.users.deniedMember.token,
      body: { label: "should-fail" },
    });
    return "member invite denied";
  });

  await check("team", "오너가 actor를 admin으로 승격", async () => {
    const response = await api(
      `/team/${context.teamId}/member/${context.users.actor.userId}/access`,
      {
        method: "PATCH",
        token: context.users.owner.token,
        body: { role: "admin" },
      },
    );
    assert(
      response.payload?.data?.role === "admin",
      "admin 승격이 반영되지 않았습니다.",
    );
    return "actor -> admin";
  });

  await check("team", "admin이 초대 링크 생성 가능", async () => {
    const response = await api(`/team/${context.teamId}/invite-links`, {
      method: "POST",
      token: context.users.actor.token,
      body: { label: "admin-created", expiresInDays: 3 },
    });
    assert(response.payload?.data?.code, "admin 초대 코드가 없습니다.");
    return response.payload.data.code;
  });

  let revokeInvite = null;
  await check("team", "초대 링크 revoke 후 참여 차단", async () => {
    const created = await api(`/team/${context.teamId}/invite-links`, {
      method: "POST",
      token: context.users.owner.token,
      body: { label: "revokable" },
    });
    revokeInvite = created.payload?.data?.code;
    await api(`/team/${context.teamId}/invite-links/${revokeInvite}/revoke`, {
      method: "PATCH",
      token: context.users.owner.token,
    });
    await expectFailure(`/team/invite/${revokeInvite}/join`, {
      method: "POST",
      token: context.users.outsider.token,
    });
    return revokeInvite;
  });

  await check("team", "초대 링크 삭제 후 미리보기 차단", async () => {
    const created = await api(`/team/${context.teamId}/invite-links`, {
      method: "POST",
      token: context.users.owner.token,
      body: { label: "deletable" },
    });
    const deleteCode = created.payload?.data?.code;
    await api(`/team/${context.teamId}/invite-links/${deleteCode}`, {
      method: "DELETE",
      token: context.users.owner.token,
    });
    await expectFailure(
      `/team/invite/${deleteCode}`,
      {},
      (response) => response.status >= 400,
    );
    return deleteCode;
  });

  await check("team", "guest 초대 링크로 읽기 전용 멤버 참여", async () => {
    const invite = await api(`/team/${context.teamId}/invite-links`, {
      method: "POST",
      token: context.users.owner.token,
      body: {
        label: "guest-invite",
        defaultRole: "guest",
        expiresInDays: 7,
      },
    });
    const code = invite.payload?.data?.code;
    assert(code, "guest 초대 코드가 없습니다.");

    const preview = await api(`/team/invite/${code}`, {});
    assert(
      preview.payload?.data?.defaultRole === "guest",
      "guest 초대 미리보기 기본 역할이 guest가 아닙니다.",
    );

    await api(`/team/invite/${code}/join`, {
      method: "POST",
      token: context.users.guest.token,
    });

    return code;
  });

  await check("team", "팀 멤버 목록 조회", async () => {
    const response = await api(`/team/${context.teamId}/member`, {
      token: context.users.owner.token,
    });
    const memberIds = new Set(
      (response.payload?.data || []).map((member) => member.userId),
    );
    assert(
      memberIds.has(context.users.owner.userId),
      "owner가 멤버 목록에 없습니다.",
    );
    assert(
      memberIds.has(context.users.actor.userId),
      "actor가 멤버 목록에 없습니다.",
    );
    assert(
      memberIds.has(context.users.allowedMember.userId),
      "allowedMember가 멤버 목록에 없습니다.",
    );
    assert(
      memberIds.has(context.users.deniedMember.userId),
      "deniedMember가 멤버 목록에 없습니다.",
    );
    assert(
      memberIds.has(context.users.guest.userId),
      "guest가 멤버 목록에 없습니다.",
    );
    const guestMember = (response.payload?.data || []).find(
      (member) => member.userId === context.users.guest.userId,
    );
    assert(guestMember?.role === "guest", "guest 역할이 저장되지 않았습니다.");
    assert(
      guestMember?.canManageInvites === false,
      "guest에게 초대 위임 권한이 남아 있습니다.",
    );
    return `${memberIds.size} members`;
  });

  await check("channel", "공개 채널 생성", async () => {
    const response = await api(`/team/${context.teamId}/channel`, {
      method: "POST",
      token: context.users.owner.token,
      body: {
        name: `general-${Date.now().toString().slice(-4)}`,
        type: "public",
      },
    });
    context.channels.public = response.payload?.data?.id;
    assert(context.channels.public, "public channel id가 없습니다.");
    return context.channels.public;
  });

  await check("channel", "비공개 채널 생성", async () => {
    const response = await api(`/team/${context.teamId}/channel`, {
      method: "POST",
      token: context.users.owner.token,
      body: {
        name: `private-${Date.now().toString().slice(-4)}`,
        type: "private",
        memberIds: [context.users.actor.userId],
      },
    });
    context.channels.private = response.payload?.data?.id;
    assert(context.channels.private, "private channel id가 없습니다.");
    return context.channels.private;
  });

  await check("channel", "DM 생성 및 중복 생성 시 재사용", async () => {
    const first = await api(`/team/${context.teamId}/channel`, {
      method: "POST",
      token: context.users.owner.token,
      body: {
        name: "owner-actor-dm",
        type: "dm",
        memberIds: [context.users.actor.userId],
      },
    });
    const second = await api(`/team/${context.teamId}/channel`, {
      method: "POST",
      token: context.users.owner.token,
      body: {
        name: "owner-actor-dm-duplicate",
        type: "dm",
        memberIds: [context.users.actor.userId],
      },
    });
    context.channels.dm = first.payload?.data?.id;
    assert(
      first.payload?.data?.id === second.payload?.data?.id,
      "같은 DM이 재사용되지 않았습니다.",
    );
    return context.channels.dm;
  });

  await check("channel", "소그룹 채널 생성", async () => {
    const response = await api(`/team/${context.teamId}/channel`, {
      method: "POST",
      token: context.users.owner.token,
      body: {
        name: "group-room",
        type: "group",
        memberIds: [
          context.users.actor.userId,
          context.users.allowedMember.userId,
        ],
      },
    });
    context.channels.group = response.payload?.data?.id;
    assert(context.channels.group, "group channel id가 없습니다.");
    return context.channels.group;
  });

  await check("channel", "채널 가시성 필터링", async () => {
    const actorChannels = await api(`/team/${context.teamId}/channel`, {
      token: context.users.actor.token,
    });
    const deniedChannels = await api(`/team/${context.teamId}/channel`, {
      token: context.users.deniedMember.token,
    });
    const actorIds = new Set(
      (actorChannels.payload?.data || []).map((channel) => channel.id),
    );
    const deniedIds = new Set(
      (deniedChannels.payload?.data || []).map((channel) => channel.id),
    );
    assert(
      actorIds.has(context.channels.private),
      "private channel이 actor에게 보여야 합니다.",
    );
    assert(
      actorIds.has(context.channels.dm),
      "dm channel이 actor에게 보여야 합니다.",
    );
    assert(
      deniedIds.has(context.channels.public),
      "public channel이 일반 멤버에게 보여야 합니다.",
    );
    assert(
      !deniedIds.has(context.channels.private),
      "private channel이 비멤버에게 보이면 안 됩니다.",
    );
    assert(
      !deniedIds.has(context.channels.dm),
      "dm channel이 비멤버에게 보이면 안 됩니다.",
    );
    return `actor=${actorIds.size}, deniedMember=${deniedIds.size}`;
  });

  await check("channel", "voice 채널 생성", async () => {
    const response = await api(`/team/${context.teamId}/channel`, {
      method: "POST",
      token: context.users.owner.token,
      body: { name: "voice-room", type: "voice" },
    });
    context.channels.voice = response.payload?.data?.id;
    assert(context.channels.voice, "voice channel id가 없습니다.");
    return context.channels.voice;
  });

  await check("channel", "voice 채널 가시성", async () => {
    const ownerChannels = await api(`/team/${context.teamId}/channel`, {
      token: context.users.owner.token,
    });
    const deniedChannels = await api(`/team/${context.teamId}/channel`, {
      token: context.users.deniedMember.token,
    });
    const ownerIds = new Set(
      (ownerChannels.payload?.data || []).map((channel) => channel.id),
    );
    const deniedIds = new Set(
      (deniedChannels.payload?.data || []).map((channel) => channel.id),
    );
    assert(
      ownerIds.has(context.channels.voice),
      "voice channel이 owner에게 보여야 합니다.",
    );
    assert(
      deniedIds.has(context.channels.voice),
      "voice channel이 일반 멤버에게 보여야 합니다.",
    );
    return `owner=${ownerIds.size}, deniedMember=${deniedIds.size}`;
  });

  await check("security", "guest는 채널 생성이 차단되어야 함", async () => {
    await expectFailure(`/team/${context.teamId}/channel`, {
      method: "POST",
      token: context.users.guest.token,
      body: { name: "guest-should-fail", type: "public" },
    });
    return "guest channel create denied";
  });

  await check("channel", "guest 채널 가시성은 읽기 전용 범위와 일치", async () => {
    const guestChannels = await api(`/team/${context.teamId}/channel`, {
      token: context.users.guest.token,
    });
    const guestIds = new Set(
      (guestChannels.payload?.data || []).map((channel) => channel.id),
    );
    assert(
      guestIds.has(context.channels.public),
      "guest에게 public channel이 보여야 합니다.",
    );
    assert(
      guestIds.has(context.channels.voice),
      "guest에게 voice channel이 보여야 합니다.",
    );
    assert(
      !guestIds.has(context.channels.private),
      "guest에게 private channel이 보이면 안 됩니다.",
    );
    assert(
      !guestIds.has(context.channels.dm),
      "guest에게 dm channel이 보이면 안 됩니다.",
    );
    return `guest=${guestIds.size}`;
  });

  const sockets = {};

  await check("notification", "알림 소켓 연결 및 팀 룸 참여", async () => {
    sockets.ownerNotification = await connectSocket(
      "notification",
      context.users.owner.token,
      "owner notification",
    );
    const joined = waitForEvent(
      sockets.ownerNotification,
      "joined_team_notifications",
      (payload) => payload?.teamId === context.teamId,
    );
    sockets.ownerNotification.emit("join_team_notifications", {
      teamId: context.teamId,
    });
    await joined;
    return "notification room joined";
  });

  await check("message", "채팅 소켓 연결 및 공개 채널 입장", async () => {
    sockets.ownerChat = await connectSocket(
      "chat",
      context.users.owner.token,
      "owner chat",
    );
    sockets.actorChat = await connectSocket(
      "chat",
      context.users.actor.token,
      "actor chat",
    );
    sockets.allowedChat = await connectSocket(
      "chat",
      context.users.allowedMember.token,
      "allowed chat",
    );
    sockets.deniedChat = await connectSocket(
      "chat",
      context.users.deniedMember.token,
      "denied chat",
    );
    sockets.guestChat = await connectSocket(
      "chat",
      context.users.guest.token,
      "guest chat",
    );
    sockets.outsiderChat = await connectSocket(
      "chat",
      context.users.outsider.token,
      "outsider chat",
    );
    await joinChannel(sockets.ownerChat, context.channels.public);
    await joinChannel(sockets.actorChat, context.channels.public);
    await joinChannel(sockets.allowedChat, context.channels.public);
    await joinChannel(sockets.deniedChat, context.channels.public);
    await joinChannel(sockets.guestChat, context.channels.public);
    return "public room joined by 5 sockets";
  });

  await check(
    "security",
    "outsider는 공개 채널 소켓 join을 할 수 없어야 함",
    async () => {
      const joined = expectNoEvent(
        sockets.outsiderChat,
        "joined_channel",
        (payload) => payload?.channelId === context.channels.public,
        1200,
      );
      const denied = waitForEvent(
        sockets.outsiderChat,
        "error",
        (payload) =>
          typeof payload?.message === "string" && payload.message.length > 0,
        4000,
      );
      sockets.outsiderChat.emit("join_channel", {
        channelId: context.channels.public,
      });
      await denied;
      await joined;
      return "outsider public join denied";
    },
  );

  await check("message", "공개 채널 메시지 전송 및 실시간 수신", async () => {
    const incoming = waitForEvent(
      sockets.actorChat,
      "new_message",
      (payload) =>
        payload?.channelId === context.channels.public &&
        payload?.content?.includes(`@${context.users.actor.username}`),
    );

    const ack = await emitWithAck(sockets.ownerChat, "send_message", {
      teamId: context.teamId,
      channelId: context.channels.public,
      content: `hello @${context.users.actor.username}`,
    });

    const sent = ack?.data || ack;
    const received = await incoming;
    context.messageIds.publicMessage = sent?.id;
    assert(sent?.id, "보낸 메시지 id가 없습니다.");
    assert(received?.id === sent.id, "수신 메시지와 ACK 메시지가 다릅니다.");
    return sent.id;
  });

  await check("message", "메시지 REST 조회와 mention 파싱", async () => {
    const response = await api(`/channel/${context.channels.public}/message`, {
      token: context.users.owner.token,
    });
    const message = (response.payload?.data || []).find(
      (item) => item.id === context.messageIds.publicMessage,
    );
    assert(message, "방금 보낸 메시지를 조회하지 못했습니다.");
    assert(
      Array.isArray(message.mentions) &&
        (message.mentions.includes(context.users.actor.userId) ||
          message.mentions.includes(context.users.actor.username)),
      "mention 파싱이 되지 않았습니다.",
    );
    return `mentions=${message.mentions.join(",")}`;
  });

  await check(
    "security",
    "guest는 공개 채널을 읽을 수 있지만 메시지 작성과 허들은 막혀야 함",
    async () => {
      const listed = await api(`/channel/${context.channels.public}/message`, {
        token: context.users.guest.token,
      });
      assert(
        (listed.payload?.data || []).some(
          (item) => item.id === context.messageIds.publicMessage,
        ),
        "guest가 공개 채널 메시지를 읽지 못합니다.",
      );

      const messageDenied = waitForEvent(
        sockets.guestChat,
        "error",
        (payload) => typeof payload?.message === "string" && payload.message.length > 0,
        4000,
      );
      const noGuestMessage = expectNoEvent(
        sockets.ownerChat,
        "new_message",
        (payload) => payload?.content === "guest should fail",
        1200,
      );
      sockets.guestChat.emit("send_message", {
        teamId: context.teamId,
        channelId: context.channels.public,
        content: "guest should fail",
      });
      const sendError = await messageDenied;
      await noGuestMessage;

      const typingDenied = waitForEvent(
        sockets.guestChat,
        "error",
        (payload) => payload?.message === "게스트는 읽기 전용입니다.",
        4000,
      );
      const noTyping = expectNoEvent(
        sockets.ownerChat,
        "user_typing",
        (payload) => payload?.userId === context.users.guest.userId,
        1200,
      );
      sockets.guestChat.emit("typing", { channelId: context.channels.public });
      await typingDenied;
      await noTyping;

      const huddleDenied = waitForEvent(
        sockets.guestChat,
        "error",
        (payload) => payload?.message === "게스트는 읽기 전용입니다.",
        4000,
      );
      sockets.guestChat.emit("huddle:join", { channelId: context.channels.public });
      await huddleDenied;

      return sendError.message;
    },
  );

  await check("message", "반응 추가/제거", async () => {
    const addedEvent = waitForEvent(
      sockets.ownerChat,
      "reaction_updated",
      (payload) =>
        payload?.id === context.messageIds.publicMessage &&
        payload?.reactions?.[0]?.emoji === "👍",
    );
    await emitWithAck(sockets.actorChat, "add_reaction", {
      channelId: context.channels.public,
      messageId: context.messageIds.publicMessage,
      emoji: "👍",
    });
    const added = await addedEvent;
    assert(
      added.reactions[0].userIds.includes(context.users.actor.userId),
      "반응 userIds가 비어 있습니다.",
    );

    const removedEvent = waitForEvent(
      sockets.ownerChat,
      "reaction_updated",
      (payload) =>
        payload?.id === context.messageIds.publicMessage &&
        (payload?.reactions?.length || 0) === 0,
    );
    await emitWithAck(sockets.actorChat, "add_reaction", {
      channelId: context.channels.public,
      messageId: context.messageIds.publicMessage,
      emoji: "👍",
    });
    await removedEvent;
    return "toggle ok";
  });

  await check("message", "작성자만 메시지 편집 가능", async () => {
    await expectFailure(
      `/channel/${context.channels.public}/message/${context.messageIds.publicMessage}`,
      {
        method: "PATCH",
        token: context.users.deniedMember.token,
        body: { content: "hijacked edit" },
      },
    );
    await api(
      `/channel/${context.channels.public}/message/${context.messageIds.publicMessage}`,
      {
        method: "PATCH",
        token: context.users.owner.token,
        body: { content: "edited by owner" },
      },
    );
    const response = await api(`/channel/${context.channels.public}/message`, {
      token: context.users.owner.token,
    });
    const edited = (response.payload?.data || []).find(
      (item) => item.id === context.messageIds.publicMessage,
    );
    assert(edited?.isEdited === true, "isEdited가 true가 아닙니다.");
    assert(
      edited?.content === "edited by owner",
      "편집 내용이 반영되지 않았습니다.",
    );
    return "edit ok";
  });

  await check("message", "비공개 채널 메시지 전송", async () => {
    await joinChannel(sockets.ownerChat, context.channels.private);
    await joinChannel(sockets.actorChat, context.channels.private);
    const ack = await emitWithAck(sockets.ownerChat, "send_message", {
      teamId: context.teamId,
      channelId: context.channels.private,
      content: "private hello",
    });
    const sent = ack?.data || ack;
    context.messageIds.privateMessage = sent?.id;
    assert(context.messageIds.privateMessage, "private message id가 없습니다.");
    return context.messageIds.privateMessage;
  });

  await check(
    "security",
    "outsider는 비공개 채널 소켓 join을 할 수 없어야 함",
    async () => {
      const joined = expectNoEvent(
        sockets.outsiderChat,
        "joined_channel",
        (payload) => payload?.channelId === context.channels.private,
        1200,
      );
      const denied = waitForEvent(
        sockets.outsiderChat,
        "error",
        (payload) =>
          typeof payload?.message === "string" && payload.message.length > 0,
        4000,
      );
      sockets.outsiderChat.emit("join_channel", {
        channelId: context.channels.private,
      });
      await denied;
      await joined;
      return "outsider private join denied";
    },
  );

  await check(
    "security",
    "비멤버는 비공개 채널 메시지를 조회할 수 없어야 함",
    async () => {
      await expectFailure(`/channel/${context.channels.private}/message`, {
        token: context.users.outsider.token,
      });
      return "non-member denied";
    },
  );

  await check(
    "security",
    "비멤버는 다른 팀 메시지를 핀할 수 없어야 함",
    async () => {
      await expectFailure(
        `/channel/${context.channels.public}/message/${context.messageIds.publicMessage}/pin`,
        {
          method: "PATCH",
          token: context.users.outsider.token,
          body: { isPinned: true },
        },
      );
      return "non-member pin denied";
    },
  );

  await check("message", "메시지 핀과 핀 목록 조회", async () => {
    await api(
      `/channel/${context.channels.public}/message/${context.messageIds.publicMessage}/pin`,
      {
        method: "PATCH",
        token: context.users.owner.token,
        body: { isPinned: true },
      },
    );
    const pinned = await api(
      `/channel/${context.channels.public}/message/pinned`,
      {
        token: context.users.owner.token,
      },
    );
    const found = (pinned.payload?.data || []).find(
      (item) => item.id === context.messageIds.publicMessage,
    );
    assert(found?.isPinned, "핀 목록에 메시지가 없습니다.");
    return `pinned=${found.id}`;
  });

  await check("notification", "스레드 답글 알림 생성", async () => {
    const incoming = waitForEvent(
      sockets.ownerNotification,
      "notification:new",
      (payload) =>
        payload?.type === "thread_reply" &&
        payload?.channelId === context.channels.public,
      7000,
    );

    const ack = await emitWithAck(sockets.actorChat, "send_message", {
      teamId: context.teamId,
      channelId: context.channels.public,
      content: "thread reply",
      replyToId: context.messageIds.publicMessage,
    });
    const sent = ack?.data || ack;
    context.messageIds.threadReply = sent?.id;
    assert(context.messageIds.threadReply, "thread reply id가 없습니다.");

    const notification = await incoming;
    context.notificationIds.push(notification.id);
    assert(
      notification.resourceType === "message",
      "thread reply 알림 resourceType이 다릅니다.",
    );
    return notification.id;
  });

  await check("message", "스레드 답글 조회", async () => {
    const response = await api(
      `/channel/${context.channels.public}/message/${context.messageIds.publicMessage}/thread`,
      {
        token: context.users.owner.token,
      },
    );
    const found = (response.payload?.data || []).find(
      (item) => item.id === context.messageIds.threadReply,
    );
    assert(found, "스레드 답글 조회에 실패했습니다.");
    return found.id;
  });

  await check("message", "첨부 업로드 후 파일 메시지 전송", async () => {
    const uploadAttachment = async (file) => {
      const formData = new FormData();
      formData.append("teamId", context.teamId);
      formData.append("file", file);

      const uploaded = await api(
        `/channel/${context.channels.public}/message/attachment`,
        {
          method: "POST",
          token: context.users.owner.token,
          formData,
        },
      );
      const attachment = uploaded.payload?.data;
      assert(attachment?.url, "첨부 업로드 URL이 없습니다.");
      assert(
        attachment.url.includes("/chat/"),
        `채팅 첨부 URL이 chat 경로를 포함하지 않습니다: ${attachment.url}`,
      );
      return attachment;
    };

    const attachments = await Promise.all([
      uploadAttachment(createTextFile("note.txt", "attachment smoke")),
      uploadAttachment(createTinyPngFile("preview.png")),
      uploadAttachment(createTinyMp4File("clip.mp4")),
    ]);

    const ack = await emitWithAck(sockets.ownerChat, "send_message", {
      teamId: context.teamId,
      channelId: context.channels.public,
      attachments,
    });
    const sent = ack?.data || ack;
    context.messageIds.fileMessage = sent?.id;
    assert(sent?.type === "file", "파일 메시지 타입이 file이 아닙니다.");
    assert(
      (sent?.attachments || []).length === attachments.length,
      "다중 첨부 메시지에 첨부 개수가 반영되지 않았습니다.",
    );
    return {
      messageId: sent.id,
      hosts: attachments.map((attachment) => new URL(attachment.url).host),
      paths: attachments.map((attachment) => new URL(attachment.url).pathname),
    };
  });

  await check(
    "message",
    "admin이 다른 사람 메시지를 삭제할 수 있어야 함",
    async () => {
      await api(
        `/channel/${context.channels.public}/message/${context.messageIds.publicMessage}`,
        {
          method: "DELETE",
          token: context.users.actor.token,
        },
      );
      return "admin delete ok";
    },
  );

  await check("announcement", "공지 생성과 핀 우선 정렬", async () => {
    const first = await api(`/team/${context.teamId}/announcement`, {
      method: "POST",
      token: context.users.owner.token,
      body: { title: "공지 1", content: "첫 번째 공지" },
    });
    const second = await api(`/team/${context.teamId}/announcement`, {
      method: "POST",
      token: context.users.owner.token,
      body: { title: "공지 2", content: "두 번째 공지" },
    });
    await api(
      `/team/${context.teamId}/announcement/${second.payload?.data?.id}/pin`,
      {
        method: "PATCH",
        token: context.users.owner.token,
        body: { isPinned: true },
      },
    );
    const list = await api(`/team/${context.teamId}/announcement`, {
      token: context.users.owner.token,
    });
    assert(
      list.payload?.data?.[0]?.id === second.payload?.data?.id,
      "핀된 공지가 첫 번째에 오지 않습니다.",
    );
    return `pinned=${second.payload?.data?.id}`;
  });

  await check("security", "guest는 공지를 작성할 수 없어야 함", async () => {
    await expectFailure(`/team/${context.teamId}/announcement`, {
      method: "POST",
      token: context.users.guest.token,
      body: { title: "guest notice", content: "blocked" },
    });
    return "guest announcement denied";
  });

  await check("issue", "이슈 생성과 할당 알림", async () => {
    const incoming = waitForEvent(
      sockets.ownerNotification,
      "notification:new",
      (payload) => payload?.type === "issue_assigned",
      7000,
    );
    const response = await api(`/team/${context.teamId}/issue`, {
      method: "POST",
      token: context.users.actor.token,
      body: {
        title: "자동 테스트 이슈",
        description: "이슈 필터/알림 테스트",
        priority: "high",
        assigneeIds: [context.users.owner.userId],
        labels: ["smoke"],
      },
    });
    context.issueIds.primary = response.payload?.data?.id;
    assert(context.issueIds.primary, "issue id가 없습니다.");
    const notification = await incoming;
    context.notificationIds.push(notification.id);
    return `${context.issueIds.primary} / ${notification.id}`;
  });

  await check("security", "guest는 이슈를 생성할 수 없어야 함", async () => {
    await expectFailure(`/team/${context.teamId}/issue`, {
      method: "POST",
      token: context.users.guest.token,
      body: {
        title: "guest issue",
        description: "blocked",
      },
    });
    return "guest issue denied";
  });

  await check("issue", "이슈 필터와 상태 업데이트", async () => {
    await api(`/team/${context.teamId}/issue/${context.issueIds.primary}`, {
      method: "PATCH",
      token: context.users.actor.token,
      body: { status: "in_progress" },
    });
    const byQuery = await api(
      `/team/${context.teamId}/issue?q=${encodeURIComponent("자동 테스트 이슈")}`,
      {
        token: context.users.owner.token,
      },
    );
    const byStatus = await api(
      `/team/${context.teamId}/issue?status=in_progress`,
      {
        token: context.users.owner.token,
      },
    );
    const byAssignee = await api(
      `/team/${context.teamId}/issue?assigneeId=${context.users.owner.userId}`,
      {
        token: context.users.owner.token,
      },
    );
    assert(
      (byQuery.payload?.data || []).some(
        (issue) => issue.id === context.issueIds.primary,
      ),
      "q 필터가 동작하지 않습니다.",
    );
    assert(
      (byStatus.payload?.data || []).some(
        (issue) => issue.id === context.issueIds.primary,
      ),
      "status 필터가 동작하지 않습니다.",
    );
    assert(
      (byAssignee.payload?.data || []).some(
        (issue) => issue.id === context.issueIds.primary,
      ),
      "assignee 필터가 동작하지 않습니다.",
    );
    return "filters ok";
  });

  await check("issue", "이슈 삭제", async () => {
    const temp = await api(`/team/${context.teamId}/issue`, {
      method: "POST",
      token: context.users.owner.token,
      body: {
        title: "삭제용 이슈",
        description: "삭제 테스트",
      },
    });
    const tempId = temp.payload?.data?.id;
    await api(`/team/${context.teamId}/issue/${tempId}`, {
      method: "DELETE",
      token: context.users.owner.token,
    });
    const list = await api(
      `/team/${context.teamId}/issue?q=${encodeURIComponent("삭제용 이슈")}`,
      {
        token: context.users.owner.token,
      },
    );
    assert(
      !(list.payload?.data || []).some((issue) => issue.id === tempId),
      "삭제한 이슈가 남아 있습니다.",
    );
    return tempId;
  });

  await check("notification", "알림 목록/개수 조회와 읽음 처리", async () => {
    const list = await api(`/team/${context.teamId}/notification`, {
      token: context.users.owner.token,
    });
    const count = await api(
      `/team/${context.teamId}/notification/unread-count`,
      {
        token: context.users.owner.token,
      },
    );
    const notifications = list.payload?.data || [];
    assert(notifications.length >= 2, "알림이 2개 이상 쌓이지 않았습니다.");
    assert(
      count.payload?.data?.count >= 2,
      "읽지 않은 알림 수가 기대보다 적습니다.",
    );
    const firstId = notifications[0]?.id;
    await api(`/team/${context.teamId}/notification/${firstId}/read`, {
      method: "PATCH",
      token: context.users.owner.token,
    });
    await api(`/team/${context.teamId}/notification/read-all`, {
      method: "PATCH",
      token: context.users.owner.token,
    });
    const after = await api(
      `/team/${context.teamId}/notification/unread-count`,
      {
        token: context.users.owner.token,
      },
    );
    assert(
      after.payload?.data?.count === 0,
      "read-all 이후 unread count가 0이 아닙니다.",
    );
    return `${notifications.length} notifications`;
  });

  await check("presence", "프레즌스 소켓 연결과 상태 변경", async () => {
    sockets.ownerPresence = await connectSocket(
      "presence",
      context.users.owner.token,
      "owner presence",
    );
    sockets.actorPresence = await connectSocket(
      "presence",
      context.users.actor.token,
      "actor presence",
    );

    const ownerOnline = waitForEvent(
      sockets.ownerPresence,
      "presence_update",
      (payload) =>
        payload?.userId === context.users.actor.userId &&
        payload?.status === "online",
      7000,
    );
    sockets.actorPresence.emit("set_status", { status: "away" });
    await ownerOnline.catch(() => null);

    const awayUpdate = waitForEvent(
      sockets.ownerPresence,
      "presence_update",
      (payload) =>
        payload?.userId === context.users.actor.userId &&
        payload?.status === "away",
      7000,
    );
    sockets.actorPresence.emit("set_status", { status: "away" });
    await awayUpdate;

    const rest = await api(`/team/${context.teamId}/presence`, {
      token: context.users.owner.token,
    });
    const actorPresence = (rest.payload?.data || []).find(
      (item) => item.userId === context.users.actor.userId,
    );
    assert(
      actorPresence?.status === "away",
      "REST presence가 away를 반환하지 않습니다.",
    );
    return actorPresence.status;
  });

  await check(
    "security",
    "비멤버는 프레즌스 조회를 할 수 없어야 함",
    async () => {
      await expectFailure(`/team/${context.teamId}/presence`, {
        token: context.users.outsider.token,
      });
      return "outsider denied";
    },
  );

  await check("document", "문서 생성과 트리 조회", async () => {
    const root = await api(`/team/${context.teamId}/document`, {
      method: "POST",
      token: context.users.owner.token,
      body: {
        title: "Root Doc",
        content: "<p>hello document</p>",
        contentFormat: "html",
      },
    });
    context.documentIds.root = root.payload?.data?.id;
    const child = await api(`/team/${context.teamId}/document`, {
      method: "POST",
      token: context.users.owner.token,
      body: {
        title: "Child Doc",
        parentId: context.documentIds.root,
        content: "<p>child</p>",
        contentFormat: "html",
      },
    });
    context.documentIds.child = child.payload?.data?.id;
    assert(
      context.documentIds.root && context.documentIds.child,
      "문서 생성 id가 없습니다.",
    );

    const tree = await api(`/team/${context.teamId}/document`, {
      token: context.users.owner.token,
    });
    const ids = new Set((tree.payload?.data || []).map((doc) => doc.id));
    assert(ids.has(context.documentIds.root), "root doc이 트리에 없습니다.");
    assert(ids.has(context.documentIds.child), "child doc이 트리에 없습니다.");
    return `${context.documentIds.root}, ${context.documentIds.child}`;
  });

  await check("security", "guest는 문서를 생성할 수 없어야 함", async () => {
    await expectFailure(`/team/${context.teamId}/document`, {
      method: "POST",
      token: context.users.guest.token,
      body: {
        title: "guest doc",
        content: "blocked",
        contentFormat: "plain",
      },
    });
    return "guest document denied";
  });

  await check("document", "문서 수정과 버전 복원", async () => {
    await api(`/team/${context.teamId}/document/${context.documentIds.root}`, {
      method: "PATCH",
      token: context.users.owner.token,
      body: {
        title: "Root Doc v2",
        content: "<p>updated</p>",
        contentFormat: "html",
      },
    });
    const versions = await api(
      `/team/${context.teamId}/document/${context.documentIds.root}/version`,
      {
        token: context.users.owner.token,
      },
    );
    const versionId = versions.payload?.data?.[0]?.id;
    assert(versionId, "문서 버전이 생성되지 않았습니다.");
    await api(
      `/team/${context.teamId}/document/${context.documentIds.root}/version/${versionId}/restore`,
      {
        method: "POST",
        token: context.users.owner.token,
      },
    );
    const restored = await api(
      `/team/${context.teamId}/document/${context.documentIds.root}`,
      {
        token: context.users.owner.token,
      },
    );
    assert(
      restored.payload?.data?.title === "Root Doc",
      "버전 복원 후 title이 원복되지 않았습니다.",
    );
    return versionId;
  });

  await check("document", "제한 문서 RBAC", async () => {
    await api(`/team/${context.teamId}/document/${context.documentIds.root}`, {
      method: "PATCH",
      token: context.users.owner.token,
      body: {
        visibility: "restricted",
        editPolicy: "restricted",
        allowedViewerIds: [context.users.allowedMember.userId],
        allowedEditorIds: [context.users.allowedMember.userId],
      },
    });

    const allowedGet = await api(
      `/team/${context.teamId}/document/${context.documentIds.root}`,
      {
        token: context.users.allowedMember.token,
      },
    );
    assert(
      allowedGet.payload?.data?.id === context.documentIds.root,
      "허용 멤버가 문서를 보지 못합니다.",
    );

    await expectFailure(
      `/team/${context.teamId}/document/${context.documentIds.root}`,
      {
        token: context.users.deniedMember.token,
      },
    );

    await api(`/team/${context.teamId}/document/${context.documentIds.root}`, {
      method: "PATCH",
      token: context.users.allowedMember.token,
      body: {
        content: "<p>allowed member edit</p>",
        contentFormat: "html",
      },
    });

    return "restricted access ok";
  });

  await check("document", "문서 이미지/파일 업로드", async () => {
    const imageForm = new FormData();
    imageForm.append("file", createTinyPngFile());
    const image = await api(`/team/${context.teamId}/document/upload/image`, {
      method: "POST",
      token: context.users.owner.token,
      formData: imageForm,
    });
    assert(image.payload?.data?.url, "문서 이미지 업로드 URL이 없습니다.");
    assert(
      image.payload.data.url.includes("/docs/"),
      `문서 이미지 URL이 docs 경로를 포함하지 않습니다: ${image.payload.data.url}`,
    );

    const fileForm = new FormData();
    fileForm.append("file", createTextFile("doc.txt", "document attachment"));
    const file = await api(
      `/team/${context.teamId}/document/${context.documentIds.root}/file`,
      {
        method: "POST",
        token: context.users.owner.token,
        formData: fileForm,
      },
    );
    assert(file.payload?.data?.url, "문서 파일 업로드 URL이 없습니다.");
    assert(
      file.payload.data.url.includes("/docs/"),
      `문서 파일 URL이 docs 경로를 포함하지 않습니다: ${file.payload.data.url}`,
    );
    return {
      imageHost: new URL(image.payload.data.url).host,
      imagePath: new URL(image.payload.data.url).pathname,
      fileHost: new URL(file.payload.data.url).host,
      filePath: new URL(file.payload.data.url).pathname,
    };
  });

  await check("document", "문서 아카이브와 복원", async () => {
    await api(
      `/team/${context.teamId}/document/${context.documentIds.child}/archive`,
      {
        method: "POST",
        token: context.users.owner.token,
      },
    );
    const archived = await api(
      `/team/${context.teamId}/document/archived/list`,
      {
        token: context.users.owner.token,
      },
    );
    assert(
      (archived.payload?.data || []).some(
        (doc) => doc.id === context.documentIds.child,
      ),
      "아카이브 문서 목록에 child가 없습니다.",
    );
    await api(
      `/team/${context.teamId}/document/${context.documentIds.child}/restore`,
      {
        method: "POST",
        token: context.users.owner.token,
      },
    );
    const tree = await api(`/team/${context.teamId}/document`, {
      token: context.users.owner.token,
    });
    assert(
      (tree.payload?.data || []).some(
        (doc) => doc.id === context.documentIds.child,
      ),
      "복원 후 child doc이 트리에 없습니다.",
    );
    return context.documentIds.child;
  });

  await check("document", "문서 삭제", async () => {
    const temp = await api(`/team/${context.teamId}/document`, {
      method: "POST",
      token: context.users.owner.token,
      body: { title: "Delete Doc", content: "bye" },
    });
    const tempId = temp.payload?.data?.id;
    await api(`/team/${context.teamId}/document/${tempId}/archive`, {
      method: "POST",
      token: context.users.owner.token,
    });
    await api(`/team/${context.teamId}/document/${tempId}`, {
      method: "DELETE",
      token: context.users.owner.token,
    });
    await expectFailure(`/team/${context.teamId}/document/${tempId}`, {
      token: context.users.owner.token,
    });
    return tempId;
  });

  await check(
    "integration",
    "일반 멤버는 Discord import를 실행할 수 없어야 함",
    async () => {
      await expectFailure(`/team/${context.teamId}/discord/import`, {
        method: "POST",
        token: context.users.deniedMember.token,
        body: {
          guildId: "fake-guild",
          botToken: "fake-token",
          channelIds: [],
        },
      });
      return "member denied";
    },
  );

  await check(
    "integration",
    "Discord import 엔드포인트 실행 경로 확인",
    async () => {
      await expectFailure(`/team/${context.teamId}/discord/import`, {
        method: "POST",
        token: context.users.owner.token,
        body: {
          guildId: "fake-guild",
          botToken: "fake-token",
          channelIds: [],
        },
      });
      return "owner path exercised";
    },
  );

  await check(
    "integration",
    "비멤버는 GitHub 설정을 바꾸면 안 됨",
    async () => {
      await expectFailure(`/team/${context.teamId}/github`, {
        method: "PATCH",
        token: context.users.outsider.token,
        body: {
          repoUrl: "https://github.com/outsider/repo",
          webhookSecret: "outsider-secret",
          notifyChannelId: context.channels.public,
        },
      });
      return "outsider denied";
    },
  );

  await check("integration", "GitHub 설정과 Webhook 수신", async () => {
    const repoFullName = `acme/slacord-live-${Date.now()}`;
    await api(`/team/${context.teamId}/github`, {
      method: "PATCH",
      token: context.users.owner.token,
      body: {
        repoUrl: `https://github.com/${repoFullName}`,
        webhookSecret: "topsecret",
        notifyChannelId: context.channels.public,
      },
    });

    const invalid = await api("/github/webhook", {
      method: "POST",
      headers: {
        "x-github-event": "pull_request",
        "x-hub-signature-256": "sha256=invalid",
      },
      body: {
        action: "opened",
        repository: { full_name: repoFullName },
        sender: { login: "octocat" },
        pull_request: {
          number: 7,
          title: "Webhook test",
          html_url: `https://github.com/${repoFullName}/pull/7`,
        },
      },
      expectOk: true,
    });
    assert(
      invalid.payload?.success === false,
      "잘못된 서명이 거절되지 않았습니다.",
    );

    const webhookBody = JSON.stringify({
      action: "opened",
      repository: { full_name: repoFullName },
      sender: { login: "octocat" },
      pull_request: {
        number: 7,
        title: "Webhook test",
        html_url: `https://github.com/${repoFullName}/pull/7`,
      },
    });
    const signature = `sha256=${crypto.createHmac("sha256", "topsecret").update(webhookBody).digest("hex")}`;
    const valid = await fetch(`${apiBaseUrl}/github/webhook`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-github-event": "pull_request",
        "x-hub-signature-256": signature,
      },
      body: webhookBody,
    });
    const validPayload = parsePayload(await valid.text());
    assert(valid.ok, `GitHub webhook HTTP 실패: ${valid.status}`);
    assert(
      validPayload?.success === true,
      "유효한 GitHub webhook이 처리되지 않았습니다.",
    );

    const messages = await api(`/channel/${context.channels.public}/message`, {
      token: context.users.owner.token,
    });
    const githubMessage = (messages.payload?.data || []).find(
      (message) =>
        typeof message.content === "string" &&
        message.content.includes("[PR #7] Webhook test"),
    );
    assert(
      githubMessage,
      "GitHub webhook 메시지가 채널에 저장되지 않았습니다.",
    );
    return githubMessage.id;
  });

  await check("integration", "Confluence 가져오기", async () => {
    const stub = await startConfluenceStub();
    if (!stub.port) {
      await skip(
        "integration",
        "Confluence 가져오기",
        "stub port를 잡지 못했습니다.",
      );
      return "skipped";
    }

    try {
      const response = await api(
        `/team/${context.teamId}/document/import/confluence`,
        {
          method: "POST",
          token: context.users.owner.token,
          body: {
            siteUrl: `http://127.0.0.1:${stub.port}`,
            email: "stub@example.com",
            apiToken: "stub-token",
            spaceKey: "SLACORD",
          },
        },
      );
      assert(
        response.payload?.data?.importedCount === 2,
        "Confluence importedCount가 2가 아닙니다.",
      );

      const docs = await api(`/team/${context.teamId}/document`, {
        token: context.users.owner.token,
      });
      const titles = new Set(
        (docs.payload?.data || []).map((doc) => doc.title),
      );
      assert(titles.has("Confluence Root"), "Confluence Root 문서가 없습니다.");
      assert(
        titles.has("Confluence Child"),
        "Confluence Child 문서가 없습니다.",
      );
      return "2 imported";
    } finally {
      await new Promise((resolve) => stub.server.close(resolve));
    }
  });

  await check("presence", "프레즌스 오프라인 전환", async () => {
    const offlineEvent = waitForEvent(
      sockets.ownerPresence,
      "presence_update",
      (payload) =>
        payload?.userId === context.users.actor.userId &&
        payload?.status === "offline",
      7000,
    );
    sockets.actorPresence.disconnect();
    await offlineEvent;
    const rest = await api(`/team/${context.teamId}/presence`, {
      token: context.users.owner.token,
    });
    const actorPresence = (rest.payload?.data || []).find(
      (item) => item.userId === context.users.actor.userId,
    );
    assert(
      actorPresence?.status === "offline",
      "REST presence가 offline을 반환하지 않습니다.",
    );
    return "offline ok";
  });

  await check("huddle", "허들 참여자 목록과 미디어 토글", async () => {
    const ownerParticipants = waitForEvent(
      sockets.ownerChat,
      "huddle:participants",
      (payload) =>
        payload?.channelId === context.channels.public &&
        Array.isArray(payload.participants) &&
        payload.participants.length >= 1,
      7000,
    );
    sockets.ownerChat.emit("huddle:join", {
      channelId: context.channels.public,
    });
    await ownerParticipants;

    const actorParticipants = waitForEvent(
      sockets.ownerChat,
      "huddle:participants",
      (payload) =>
        payload?.channelId === context.channels.public &&
        payload.participants.some(
          (item) => item.userId === context.users.actor.userId,
        ),
      7000,
    );
    sockets.actorChat.emit("huddle:join", {
      channelId: context.channels.public,
    });
    await actorParticipants;

    const toggleEvent = waitForEvent(
      sockets.ownerChat,
      "huddle:participants",
      (payload) =>
        payload?.channelId === context.channels.public &&
        payload.participants.some(
          (item) =>
            item.userId === context.users.actor.userId && item.video === true,
        ),
      7000,
    );
    sockets.actorChat.emit("huddle:toggle-media", {
      channelId: context.channels.public,
      audio: true,
      video: true,
    });
    await toggleEvent;
    return "join/toggle ok";
  });

  await check("huddle", "허들 offer는 targetUserId에게만 가야 함", async () => {
    const participantEvent = waitForEvent(
      sockets.ownerChat,
      "huddle:participants",
      (payload) =>
        payload?.channelId === context.channels.public &&
        payload.participants.some(
          (item) => item.userId === context.users.allowedMember.userId,
        ),
      7000,
    );
    sockets.allowedChat.emit("huddle:join", {
      channelId: context.channels.public,
    });
    await participantEvent;

    const targetOffer = waitForEvent(
      sockets.actorChat,
      "huddle:offer",
      (payload) => payload?.fromUserId === context.users.owner.userId,
      4000,
    );
    const strayOffer = expectNoEvent(
      sockets.allowedChat,
      "huddle:offer",
      (payload) => payload?.fromUserId === context.users.owner.userId,
      1200,
    );

    sockets.ownerChat.emit("huddle:offer", {
      channelId: context.channels.public,
      targetUserId: context.users.actor.userId,
      offer: { type: "offer", sdp: "fake-sdp" },
    });

    await targetOffer;
    await strayOffer;
    return "offer routing ok";
  });

  await check("cleanup", "소켓 정리", async () => {
    for (const socket of Object.values(sockets)) {
      if (socket && typeof socket.disconnect === "function") {
        socket.disconnect();
      }
    }
    return `${Object.keys(sockets).length} sockets disconnected`;
  });
}

try {
  await main();
} finally {
  const summary = await writeReport();
  console.log(`report: ${reportPath}`);
  console.log(
    `summary: passed=${summary.passed} failed=${summary.failed} skipped=${summary.skipped}`,
  );
  if (summary.failed > 0) {
    process.exitCode = 1;
  }
}
