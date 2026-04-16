import path from "node:path";
import { repoRoot } from "./profile-env.mjs";

export function resolveProfileCommand(target, env) {
  const webPort = env.SLACORD_WEB_PORT || "3103";

  switch (target) {
    case "server:dev":
      return {
        command: "yarn",
        args: ["workspace", "@slacord/server", "start:dev"],
        cwd: repoRoot,
      };
    case "server:start":
      return {
        command: "yarn",
        args: ["workspace", "@slacord/server", "start:prod"],
        cwd: repoRoot,
      };
    case "web:dev":
      return {
        command: "npx",
        args: ["next", "dev", "--port", String(webPort)],
        cwd: path.join(repoRoot, "packages", "web"),
      };
    case "web:build":
      return {
        command: "npx",
        args: ["next", "build"],
        cwd: path.join(repoRoot, "packages", "web"),
      };
    case "web:start":
      return {
        command: "npx",
        args: ["next", "start", "--port", String(webPort)],
        cwd: path.join(repoRoot, "packages", "web"),
      };
    case "verify:e2e":
      return {
        command: "yarn",
        args: ["test:e2e:web"],
        cwd: repoRoot,
      };
    case "verify:live":
      return {
        command: "node",
        args: ["scripts/live-surface-check.mjs"],
        cwd: repoRoot,
      };
    case "verify:discord-mock":
      return {
        command: "node",
        args: ["scripts/discord-import-mock-check.mjs"],
        cwd: repoRoot,
      };
    default:
      throw new Error(`알 수 없는 profile command target: ${target}`);
  }
}
