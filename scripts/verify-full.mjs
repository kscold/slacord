import process from "node:process";
import { spawn } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";
import { loadProfileEnv, repoRoot } from "./lib/profile-env.mjs";
import { resolveProfileCommand } from "./lib/profile-commands.mjs";

const managedChildren = new Set();

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const runtimeProfile =
    args.profileName || process.env.SLACORD_PROFILE || "local-container";
  const mockProfile =
    args.mockProfileName ||
    process.env.SLACORD_MOCK_PROFILE ||
    "local-container-discord-mock";
  const runtime = await loadProfileEnv({ profileName: runtimeProfile });
  const mock = await loadProfileEnv({ profileName: mockProfile });

  console.log("Runtime profile");
  console.log(JSON.stringify(runtime.summary, null, 2));
  console.log("");
  console.log("Discord mock profile");
  console.log(JSON.stringify(mock.summary, null, 2));
  console.log("");

  installSignalHandlers();

  await runStep(
    "Playwright browser 준비",
    "yarn",
    ["test:e2e:web:prepare"],
    runtime.env,
  );
  await runStep("Server unit test", "yarn", ["test:server"], runtime.env);
  await runStep("Server build", "yarn", ["build:server"], runtime.env);
  await runStep("Web unit test", "yarn", ["test:web"], runtime.env);
  await runStep(
    "Web build",
    "node",
    [
      "scripts/slacord-profile.mjs",
      "run",
      "web:build",
      "--profile",
      runtimeProfile,
    ],
    runtime.env,
  );
  await runStep("Desktop unit test", "yarn", ["test:desktop"], runtime.env);
  await runStep("Desktop build", "yarn", ["build:desktop"], runtime.env);

  let serverProcess;
  let webProcess;
  let mockServerProcess;

  try {
    serverProcess = await startManagedProcess(
      "app server",
      resolveProfileCommand("server:start", runtime.env),
      runtime.env,
    );
    await waitForUrl(
      `${runtime.env.SLACORD_SERVER_BASE_URL}/api/health`,
      "server health",
    );

    webProcess = await startManagedProcess(
      "web app",
      resolveProfileCommand("web:start", runtime.env),
      runtime.env,
    );
    await waitForUrl(runtime.env.SLACORD_E2E_BASE_URL, "web app");

    await runStep("Web E2E", "yarn", ["test:e2e:web"], runtime.env);
    await runStep(
      "Live surface",
      "node",
      ["scripts/live-surface-check.mjs"],
      runtime.env,
    );

    mockServerProcess = await startManagedProcess(
      "discord mock server",
      resolveProfileCommand("server:start", mock.env),
      mock.env,
    );
    await waitForUrl(
      `${mock.env.SLACORD_SERVER_BASE_URL}/api/health`,
      "discord mock server health",
    );
    await runStep(
      "Discord import mock",
      "node",
      ["scripts/discord-import-mock-check.mjs"],
      mock.env,
    );
  } finally {
    await stopManagedProcess(mockServerProcess);
    await stopManagedProcess(webProcess);
    await stopManagedProcess(serverProcess);
  }
}

function parseArgs(args) {
  const result = {
    profileName: "",
    mockProfileName: "",
  };

  const rest = [...args];
  while (rest.length > 0) {
    const token = rest.shift();
    if (token === "--profile") {
      result.profileName = rest.shift() || "";
      continue;
    }
    if (token === "--mock-profile") {
      result.mockProfileName = rest.shift() || "";
      continue;
    }
  }

  return result;
}

async function runStep(label, command, args, env) {
  console.log(`\n== ${label} ==`);
  await runCommand(command, args, { env, label });
}

async function runCommand(command, args, options = {}) {
  await new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: options.cwd || repoRoot,
      env: options.env,
      stdio: "inherit",
      shell: false,
    });

    child.on("error", reject);
    child.on("exit", (code, signal) => {
      if (signal) {
        reject(
          new Error(
            `${options.label || command}가 ${signal}로 종료되었습니다.`,
          ),
        );
        return;
      }
      if (code !== 0) {
        reject(new Error(`${options.label || command} 실패 (exit ${code})`));
        return;
      }
      resolve();
    });
  });
}

async function startManagedProcess(label, descriptor, env) {
  console.log(`\n== start ${label} ==`);
  const child = spawn(descriptor.command, descriptor.args, {
    cwd: descriptor.cwd,
    env,
    stdio: "inherit",
    shell: false,
  });

  managedChildren.add(child);
  child.slacordStopping = false;

  child.on("exit", (code, signal) => {
    managedChildren.delete(child);
    if (child.slacordStopping) {
      return;
    }
    if (code !== null && code !== 0) {
      console.error(
        `${label} exited early with code ${code}${signal ? ` (${signal})` : ""}`,
      );
    }
  });

  return child;
}

async function waitForUrl(url, label) {
  const deadline = Date.now() + 60_000;
  let lastError = "";

  while (Date.now() < deadline) {
    try {
      const response = await fetch(url, { redirect: "manual" });
      if (response.ok || response.status === 307 || response.status === 308) {
        return;
      }
      lastError = `HTTP ${response.status}`;
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
    }

    await delay(1_000);
  }

  throw new Error(`${label} 준비를 기다리다 시간 초과: ${lastError}`);
}

async function stopManagedProcess(child) {
  if (!child || child.exitCode !== null) return;

  await new Promise((resolve) => {
    child.slacordStopping = true;
    const timer = setTimeout(() => {
      child.kill("SIGKILL");
    }, 5_000);

    child.once("exit", () => {
      clearTimeout(timer);
      managedChildren.delete(child);
      resolve();
    });

    child.kill("SIGTERM");
  });
}

function installSignalHandlers() {
  const terminate = async (signal) => {
    for (const child of [...managedChildren]) {
      try {
        child.kill("SIGTERM");
      } catch {}
    }
    await delay(500);
    process.exit(signal === "SIGINT" ? 130 : 143);
  };

  process.once("SIGINT", () => {
    void terminate("SIGINT");
  });
  process.once("SIGTERM", () => {
    void terminate("SIGTERM");
  });
}

main().catch(async (error) => {
  console.error(error instanceof Error ? error.message : String(error));
  for (const child of [...managedChildren]) {
    try {
      child.kill("SIGTERM");
    } catch {}
  }
  process.exit(1);
});
