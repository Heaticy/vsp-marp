import path from "node:path";
import { spawnSync } from "node:child_process";
import { promises as fs } from "node:fs";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const repoRoot = path.resolve(__dirname, "../..");

export async function ensureDir(dirPath: string) {
  await fs.mkdir(dirPath, { recursive: true });
}

export function marpCommand(): { command: string; args: string[] } {
  const cliEntry = path.join(repoRoot, "node_modules", "@marp-team", "marp-cli", "marp-cli.js");
  return {
    command: process.execPath,
    args: [cliEntry],
  };
}

export function firefoxBinary(): string | null {
  const result = spawnSync("sh", ["-lc", "command -v firefox || true"], {
    cwd: repoRoot,
    encoding: "utf8",
    stdio: "pipe",
  });

  const binary = result.stdout.trim();
  return binary || null;
}

export function runCommand(command: string, args: string[], options: { cwd?: string } = {}) {
  const result = spawnSync(command, args, {
    cwd: options.cwd ?? repoRoot,
    encoding: "utf8",
    stdio: "pipe",
  });

  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);

  if (result.status !== 0) {
    throw new Error(`Command failed: ${command} ${args.join(" ")}`);
  }
}

export async function cleanDirectory(dirPath: string) {
  await fs.rm(dirPath, { recursive: true, force: true });
  await fs.mkdir(dirPath, { recursive: true });
}
