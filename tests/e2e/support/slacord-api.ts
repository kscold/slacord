interface ApiOptions {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  token?: string;
  body?: unknown;
}

interface ApiEnvelope<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface AuthSession {
  email: string;
  password: string;
  token: string;
  userId: string;
  username: string;
}

export interface WorkspaceFixture {
  actor: AuthSession;
  channelId: string;
  channelName: string;
  documentId: string;
  owner: AuthSession;
  teamId: string;
  teamName: string;
  teamSlug: string;
}

export const e2eBaseUrl =
  process.env.SLACORD_E2E_BASE_URL || "http://127.0.0.1:3003";
export const e2eApiUrl =
  process.env.SLACORD_E2E_API_URL || "http://127.0.0.1:8084/api";
const e2eSocketUrl =
  process.env.SLACORD_E2E_SOCKET_URL || e2eApiUrl.replace(/\/api$/, "");

export async function jsonFetch<T = unknown>(
  pathName: string,
  options: ApiOptions = {},
) {
  const response = await fetch(`${e2eApiUrl}${pathName}`, {
    method: options.method ?? "GET",
    headers: {
      "Content-Type": "application/json",
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  const text = await response.text();
  const payload = text ? (JSON.parse(text) as ApiEnvelope<T>) : null;
  if (!response.ok) {
    throw new Error(
      `API 실패 ${response.status} ${pathName}: ${JSON.stringify(payload)}`,
    );
  }
  return payload;
}

export async function createUserSession(label: string) {
  const stamp = `${Date.now()}-${Math.round(Math.random() * 1000)}`;
  const email = `e2e_${label}_${stamp}@example.com`;
  const password = "test1234";
  const username = `e2e_${label}_${stamp.slice(-6)}`;

  await jsonFetch("/auth/register", {
    method: "POST",
    body: { email, password, username },
  });
  const login = await jsonFetch<{ accessToken: string }>("/auth/login", {
    method: "POST",
    body: { email, password },
  });
  const token = login.data?.accessToken;
  if (!token) throw new Error("로그인 토큰을 받지 못했어요.");
  const me = await jsonFetch<{ id: string; username: string }>("/auth/me", {
    token,
  });
  if (!me.data?.id) throw new Error("사용자 정보를 읽지 못했어요.");

  return {
    email,
    password,
    token,
    userId: me.data.id,
    username: me.data.username,
  } satisfies AuthSession;
}

export async function createWorkspaceFixture() {
  ensureRemoteSeedAllowed();

  const owner = await createUserSession("owner");
  const actor = await createUserSession("actor");
  const stamp = `${Date.now()}-${Math.round(Math.random() * 1000)}`;
  const teamName = `E2E 팀 ${stamp.slice(-4)}`;
  const teamSlug = `e2e-${stamp}`;

  const team = await jsonFetch<{ id: string }>("/team", {
    method: "POST",
    token: owner.token,
    body: {
      name: teamName,
      slug: teamSlug,
      description: "웹 E2E 검증용 팀입니다.",
    },
  });
  const teamId = team.data?.id;
  if (!teamId) throw new Error("팀을 만들지 못했어요.");

  await jsonFetch(`/team/${teamSlug}/join`, {
    method: "POST",
    token: actor.token,
  });

  const channelName = `general-${stamp.slice(-4)}`;
  const channel = await jsonFetch<{ id: string }>(
    "/team/" + teamId + "/channel",
    {
      method: "POST",
      token: owner.token,
      body: { name: channelName, type: "public" },
    },
  );
  const channelId = channel.data?.id;
  if (!channelId) throw new Error("채널을 만들지 못했어요.");

  const document = await jsonFetch<{ id: string }>(
    "/team/" + teamId + "/document",
    {
      method: "POST",
      token: owner.token,
      body: {
        title: `E2E 문서 ${stamp.slice(-4)}`,
        content: "<p>문서 검증 본문</p>",
        contentFormat: "html",
      },
    },
  );
  const documentId = document.data?.id;
  if (!documentId) throw new Error("문서를 만들지 못했어요.");

  return {
    actor,
    channelId,
    channelName,
    documentId,
    owner,
    teamId,
    teamName,
    teamSlug,
  } satisfies WorkspaceFixture;
}

export async function createGuestSessionForTeam(input: {
  ownerToken: string;
  teamId: string;
}) {
  const guest = await createUserSession("guest");
  const invite = await jsonFetch<{ code: string }>(
    `/team/${input.teamId}/invite-links`,
    {
      method: "POST",
      token: input.ownerToken,
      body: {
        label: "guest-e2e",
        defaultRole: "guest",
        expiresInDays: 7,
      },
    },
  );

  const code = invite.data?.code;
  if (!code) throw new Error("guest 초대 링크를 만들지 못했어요.");

  await jsonFetch(`/team/invite/${code}/join`, {
    method: "POST",
    token: guest.token,
  });

  return guest;
}

export async function createChannel(input: {
  teamId: string;
  token: string;
  name: string;
  type?: "public" | "private" | "voice";
}) {
  const response = await jsonFetch<{ id: string }>(
    "/team/" + input.teamId + "/channel",
    {
      method: "POST",
      token: input.token,
      body: {
        name: input.name,
        type: input.type ?? "public",
      },
    },
  );

  const channelId = response.data?.id;
  if (!channelId) throw new Error("추가 채널을 만들지 못했어요.");
  return channelId;
}

export async function createAssignedIssue(input: {
  actor: AuthSession;
  owner: AuthSession;
  teamId: string;
  title: string;
}) {
  const response = await jsonFetch<{ id: string }>(
    "/team/" + input.teamId + "/issue",
    {
      method: "POST",
      token: input.actor.token,
      body: {
        title: input.title,
        description: "알림 센터 E2E 검증용 이슈입니다.",
        priority: "medium",
        assigneeIds: [input.owner.userId],
      },
    },
  );

  const issueId = response.data?.id;
  if (!issueId) throw new Error("알림 검증용 이슈를 만들지 못했어요.");
  return issueId;
}

export async function sendSocketMessage(input: {
  session: AuthSession;
  teamId: string;
  channelId: string;
  content: string;
}) {
  const { io } = await import("socket.io-client");
  const socket = io(`${e2eSocketUrl}/chat`, {
    path: "/socket.io",
    transports: ["websocket"],
    auth: { token: input.session.token },
    forceNew: true,
  });

  await new Promise<void>((resolve, reject) => {
    socket.once("connect", () => resolve());
    socket.once("connect_error", (error) => reject(error));
  });

  try {
    const ack = await new Promise<any>((resolve) => {
      socket.emit(
        "send_message",
        {
          teamId: input.teamId,
          channelId: input.channelId,
          content: input.content,
        },
        resolve,
      );
    });

    if (ack?.success === false) {
      throw new Error(`메시지 전송 실패: ${JSON.stringify(ack)}`);
    }

    return ack?.data ?? ack;
  } finally {
    socket.disconnect();
  }
}

function ensureRemoteSeedAllowed() {
  const host = new URL(e2eBaseUrl).hostname;
  const isLocal = host === "127.0.0.1" || host === "localhost";
  if (!isLocal && process.env.SLACORD_E2E_ALLOW_REMOTE_SEED !== "1") {
    throw new Error(
      "원격 환경에서는 SLACORD_E2E_ALLOW_REMOTE_SEED=1 일 때만 테스트 데이터를 만들 수 있어요.",
    );
  }
}
