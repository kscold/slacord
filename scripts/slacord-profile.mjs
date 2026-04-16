import process from "node:process";
import { spawn } from "node:child_process";
import { loadProfileEnv, redactValue } from "./lib/profile-env.mjs";
import { resolveProfileCommand } from "./lib/profile-commands.mjs";

async function main() {
  const { command, target, profileName, json } = parseArgs(
    process.argv.slice(2),
  );
  const { env, summary } = await loadProfileEnv({ profileName });

  if (command === "print") {
    if (json) {
      console.log(JSON.stringify(summary, null, 2));
      return;
    }

    console.log(JSON.stringify(summary, null, 2));
    console.log("");
    console.log("Effective environment:");
    for (const key of [
      "HOST",
      "PORT",
      "MONGODB_URI",
      "MINIO_ENDPOINT",
      "MINIO_BUCKET",
      "NEXT_PUBLIC_API_URL",
      "NEXT_PUBLIC_SOCKET_URL",
      "NEXT_PUBLIC_APP_URL",
      "SLACORD_E2E_BASE_URL",
      "SLACORD_E2E_API_URL",
      "SLACORD_LIVE_API_URL",
      "SLACORD_DISCORD_MOCK_API_URL",
      "NODE_OPTIONS",
    ]) {
      if (!env[key]) continue;
      console.log(`${key}=${redactValue(key, env[key])}`);
    }
    return;
  }

  const descriptor = resolveProfileCommand(target, env);
  await runCommand(descriptor.command, descriptor.args, {
    cwd: descriptor.cwd,
    env,
  });
}

function parseArgs(args) {
  const result = {
    command: "",
    target: "",
    profileName: "",
    json: false,
  };

  const rest = [...args];
  while (rest.length > 0) {
    const value = rest.shift();
    if (!value) continue;
    if (value === "--profile") {
      result.profileName = rest.shift() || "";
      continue;
    }
    if (value === "--json") {
      result.json = true;
      continue;
    }
    if (!result.command) {
      result.command = value;
      continue;
    }
    if (!result.target) {
      result.target = value;
      continue;
    }
  }

  if (!result.command) {
    throw new Error(
      "사용법: node scripts/slacord-profile.mjs <print|run> [target] [--profile name]",
    );
  }
  if (result.command === "run" && !result.target) {
    throw new Error("run 명령에는 target이 필요합니다.");
  }

  return result;
}

async function runCommand(command, args, options) {
  await new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: options.cwd,
      env: options.env,
      stdio: "inherit",
      shell: false,
    });

    child.on("error", reject);
    child.on("exit", (code, signal) => {
      if (signal) {
        reject(
          new Error(
            `${command} ${args.join(" ")}가 ${signal}로 종료되었습니다.`,
          ),
        );
        return;
      }
      if (code !== 0) {
        reject(new Error(`${command} ${args.join(" ")} 실패 (exit ${code})`));
        return;
      }
      resolve();
    });
  });
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
