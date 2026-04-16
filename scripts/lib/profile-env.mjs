import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const repoRoot = path.resolve(__dirname, "../..");
const profilesDir = path.join(repoRoot, "config", "profiles");
const defaultProfileName = "local-container";
const secretKeys = [
  "MONGODB_URI",
  "MINIO_SECRET_KEY",
  "MINIO_ACCESS_KEY",
  "SLACORD_MONGO_PASSWORD",
  "MONGO_APP_PASSWORD",
  "MONGO_ROOT_PASSWORD",
  "COOKIE_SECRET",
  "JWT_SECRET",
];

export async function loadProfileEnv(options = {}) {
  const profileName =
    options.profileName || process.env.SLACORD_PROFILE || defaultProfileName;
  const localOverride = options.localOverride !== false;
  const profileEnv = await readProfileChain(profileName, localOverride);
  const merged = { ...profileEnv, ...process.env };
  const derived = await deriveEnv(merged, {
    profileName,
    strictMongoCredentials: options.strictMongoCredentials !== false,
  });

  return {
    profileName,
    env: derived,
    summary: summarizeProfile(derived, profileName),
  };
}

export function redactValue(key, value) {
  if (!value) return value;
  if (secretKeys.includes(key)) return "<redacted>";
  if (key === "NODE_OPTIONS" && value.includes("mock-discord-fetch.cjs")) {
    return value.replace(
      /--require=[^\s]+/g,
      "--require=<mock-discord-fetch.cjs>",
    );
  }
  return value;
}

export function summarizeProfile(
  env,
  profileName = env.SLACORD_PROFILE || defaultProfileName,
) {
  return {
    profile: profileName,
    server: {
      host: env.SLACORD_SERVER_HOST,
      port: env.SLACORD_SERVER_PORT,
      baseUrl: env.SLACORD_SERVER_BASE_URL,
      apiUrl: env.SLACORD_E2E_API_URL,
      fetchMock: env.SLACORD_FETCH_MOCK || "off",
    },
    web: {
      host: env.SLACORD_WEB_HOST,
      port: env.SLACORD_WEB_PORT,
      appUrl: env.NEXT_PUBLIC_APP_URL,
      apiUrl: env.NEXT_PUBLIC_API_URL,
      socketUrl: env.NEXT_PUBLIC_SOCKET_URL,
    },
    verify: {
      e2eBaseUrl: env.SLACORD_E2E_BASE_URL,
      liveApiUrl: env.SLACORD_LIVE_API_URL,
      discordMockApiUrl: env.SLACORD_DISCORD_MOCK_API_URL,
      liveReportDir: env.SLACORD_LIVE_REPORT_DIR,
      discordMockReport: env.SLACORD_DISCORD_MOCK_REPORT,
    },
    storage: {
      mongoUri: redactMongoUri(env.MONGODB_URI),
      minioEndpoint: env.MINIO_ENDPOINT,
      minioBucket: env.MINIO_BUCKET,
      minioPublicUrl: env.MINIO_PUBLIC_URL,
    },
    localOverrideFile: path.join(profilesDir, `${profileName}.local.env`),
  };
}

async function readProfileChain(profileName, includeLocal, seen = new Set()) {
  if (seen.has(profileName)) {
    throw new Error(`프로필 extends 순환이 감지되었습니다: ${profileName}`);
  }
  seen.add(profileName);

  const profilePath = path.join(profilesDir, `${profileName}.env`);
  const parsed = await readEnvFile(profilePath);
  let combined = {};

  const parentProfile = parsed.SLACORD_PROFILE_EXTENDS;
  if (parentProfile) {
    combined = await readProfileChain(parentProfile, includeLocal, seen);
  }

  const current = { ...parsed };
  delete current.SLACORD_PROFILE_EXTENDS;
  combined = { ...combined, ...current };

  if (includeLocal) {
    const localPath = path.join(profilesDir, `${profileName}.local.env`);
    const localEnv = await readEnvFile(localPath, { optional: true });
    combined = { ...combined, ...localEnv };
  }

  return combined;
}

async function readEnvFile(filePath, options = {}) {
  try {
    const source = await fs.readFile(filePath, "utf8");
    const entries = {};

    for (const rawLine of source.split(/\r?\n/)) {
      const line = rawLine.trim();
      if (!line || line.startsWith("#")) continue;
      const separatorIndex = line.indexOf("=");
      if (separatorIndex < 0) continue;

      const key = line.slice(0, separatorIndex).trim();
      const rawValue = line.slice(separatorIndex + 1).trim();
      entries[key] = stripQuotes(rawValue);
    }

    return entries;
  } catch (error) {
    if (
      options.optional &&
      error &&
      typeof error === "object" &&
      error.code === "ENOENT"
    ) {
      return {};
    }
    throw error;
  }
}

function stripQuotes(value) {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }
  return value;
}

async function deriveEnv(baseEnv, options) {
  const env = { ...baseEnv };
  const profileName = options.profileName || defaultProfileName;

  const serverHost = env.SLACORD_SERVER_HOST || env.HOST || "127.0.0.1";
  const serverPort = normalizeInteger(
    env.SLACORD_SERVER_PORT || env.PORT,
    18084,
  );
  const webHost = env.SLACORD_WEB_HOST || serverHost;
  const webPort = normalizeInteger(env.SLACORD_WEB_PORT, 3103);
  const mockServerPort = normalizeInteger(
    env.SLACORD_MOCK_SERVER_PORT,
    serverPort + 1,
  );

  const serverBaseUrl =
    env.SLACORD_SERVER_BASE_URL || `http://${serverHost}:${serverPort}`;
  const mockServerBaseUrl =
    env.SLACORD_MOCK_SERVER_BASE_URL ||
    `http://${serverHost}:${mockServerPort}`;
  const appUrl = env.NEXT_PUBLIC_APP_URL || `http://${webHost}:${webPort}`;
  const socketUrl =
    env.NEXT_PUBLIC_SOCKET_URL || serverBaseUrl.replace(/\/api$/, "");

  env.SLACORD_PROFILE = profileName;
  env.HOST = serverHost;
  env.PORT = String(serverPort);
  env.SLACORD_SERVER_HOST = serverHost;
  env.SLACORD_SERVER_PORT = String(serverPort);
  env.SLACORD_WEB_HOST = webHost;
  env.SLACORD_WEB_PORT = String(webPort);
  env.SLACORD_MOCK_SERVER_PORT = String(mockServerPort);
  env.SLACORD_SERVER_BASE_URL = serverBaseUrl;
  env.SLACORD_MOCK_SERVER_BASE_URL = mockServerBaseUrl;
  env.INTERNAL_API_URL = env.INTERNAL_API_URL || serverBaseUrl;
  env.NEXT_PUBLIC_API_URL = env.NEXT_PUBLIC_API_URL || serverBaseUrl;
  env.NEXT_PUBLIC_SOCKET_URL = socketUrl;
  env.NEXT_PUBLIC_APP_URL = appUrl;
  env.SLACORD_E2E_BASE_URL = env.SLACORD_E2E_BASE_URL || appUrl;
  env.SLACORD_E2E_API_URL = env.SLACORD_E2E_API_URL || `${serverBaseUrl}/api`;
  env.SLACORD_E2E_SOCKET_URL = env.SLACORD_E2E_SOCKET_URL || socketUrl;
  env.SLACORD_LIVE_API_URL = env.SLACORD_LIVE_API_URL || `${serverBaseUrl}/api`;
  env.SLACORD_LIVE_SOCKET_URL = env.SLACORD_LIVE_SOCKET_URL || socketUrl;
  env.SLACORD_LIVE_REPORT_DIR =
    env.SLACORD_LIVE_REPORT_DIR || "./artifacts/live-surface-check";
  env.SLACORD_DISCORD_MOCK_API_URL =
    env.SLACORD_DISCORD_MOCK_API_URL || `${mockServerBaseUrl}/api`;
  env.SLACORD_DISCORD_MOCK_REPORT =
    env.SLACORD_DISCORD_MOCK_REPORT ||
    "./artifacts/live-surface-check/discord-import-mock-report.json";
  env.MINIO_ENDPOINT = env.MINIO_ENDPOINT || "http://127.0.0.1:9000";
  env.MINIO_BUCKET = env.MINIO_BUCKET || "slacord";
  env.MINIO_PUBLIC_URL = env.MINIO_PUBLIC_URL || "https://bucket.kscold.com";
  env.MINIO_ACCESS_KEY = env.MINIO_ACCESS_KEY || "minioadmin";
  env.MINIO_SECRET_KEY = env.MINIO_SECRET_KEY || "minioadmin";

  await ensureMongoUri(env, { strict: options.strictMongoCredentials });
  applyFetchMock(env);
  return env;
}

async function ensureMongoUri(env, options) {
  if (env.MONGODB_URI) return;

  const authSource =
    env.SLACORD_MONGO_AUTH_SOURCE || env.MONGO_AUTH_SOURCE || "";
  const discoveredCredentials = await maybeDiscoverMongoCredentials(env);
  const username =
    env.SLACORD_MONGO_USERNAME ||
    env.MONGO_APP_USERNAME ||
    discoveredCredentials.username ||
    "";
  const password =
    env.SLACORD_MONGO_PASSWORD ||
    env.MONGO_APP_PASSWORD ||
    discoveredCredentials.password ||
    "";
  const host = env.SLACORD_MONGO_HOST || "127.0.0.1";
  const port = normalizeInteger(env.SLACORD_MONGO_PORT, 27017);
  const database = env.SLACORD_MONGO_DB || "slacord";
  const query = authSource
    ? `?authSource=${encodeURIComponent(authSource)}`
    : "";

  if (username && password) {
    env.MONGODB_URI =
      `mongodb://${encodeURIComponent(username)}:${encodeURIComponent(password)}` +
      `@${host}:${port}/${database}${query}`;
    return;
  }

  if (env.SLACORD_MONGO_REQUIRE_CREDENTIALS === "1" && options.strict) {
    const localPath = path.join(
      profilesDir,
      `${env.SLACORD_PROFILE}.local.env`,
    );
    throw new Error(
      [
        "MongoDB 인증 정보를 찾지 못했습니다.",
        `- docker 자동 탐색 힌트: ${env.SLACORD_DOCKER_IMAGE_HINT || "없음"}`,
        `- 로컬 override 파일에 SLACORD_MONGO_USERNAME / SLACORD_MONGO_PASSWORD를 추가해 주세요: ${localPath}`,
      ].join("\n"),
    );
  }

  env.MONGODB_URI = `mongodb://${host}:${port}/${database}${query}`;
}

async function maybeDiscoverMongoCredentials(env) {
  if (env.SLACORD_MONGO_DISCOVER_FROM_DOCKER !== "1") {
    return { username: "", password: "" };
  }

  try {
    const container = findDockerContainer(env);
    if (!container) return { username: "", password: "" };

    const inspectJson = execFileSync("docker", ["inspect", container], {
      cwd: repoRoot,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    });
    const [details] = JSON.parse(inspectJson);
    const envMap = Object.fromEntries(
      (details?.Config?.Env || []).map((entry) => {
        const separatorIndex = entry.indexOf("=");
        return [
          entry.slice(0, separatorIndex),
          entry.slice(separatorIndex + 1),
        ];
      }),
    );

    return {
      username: envMap.MONGO_APP_USERNAME || envMap.MONGO_ROOT_USERNAME || "",
      password: envMap.MONGO_APP_PASSWORD || envMap.MONGO_ROOT_PASSWORD || "",
    };
  } catch {
    return { username: "", password: "" };
  }
}

function findDockerContainer(env) {
  const explicitName = env.SLACORD_DOCKER_CONTAINER;
  if (explicitName) return explicitName;

  const hint = env.SLACORD_DOCKER_IMAGE_HINT || "slacord";
  const output = execFileSync(
    "docker",
    ["ps", "-a", "--format", "{{.ID}}\t{{.Image}}\t{{.Names}}"],
    {
      cwd: repoRoot,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    },
  );

  const match = output
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [id, image, name] = line.split("\t");
      return { id, image, name };
    })
    .find((entry) => entry.image?.includes(hint) || entry.name?.includes(hint));

  return match?.id || "";
}

function applyFetchMock(env) {
  if (env.SLACORD_FETCH_MOCK !== "discord") return;

  const requireArg = `--require=${path.join(repoRoot, "scripts", "mock-discord-fetch.cjs")}`;
  const currentOptions = env.NODE_OPTIONS || "";
  if (currentOptions.includes(requireArg)) return;
  env.NODE_OPTIONS = `${currentOptions} ${requireArg}`.trim();
}

function normalizeInteger(value, fallback) {
  const normalized = Number(value);
  return Number.isFinite(normalized) ? normalized : fallback;
}

function redactMongoUri(uri) {
  if (!uri) return "";

  try {
    const url = new URL(uri);
    if (url.password) url.password = "<redacted>";
    return url.toString();
  } catch {
    return "<redacted>";
  }
}
