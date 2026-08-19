import path from "node:path";
import { promises as fs } from "node:fs";

import { auditThemes } from "./audit-themes.ts";
import { buildThemes } from "./build-themes.ts";
import { repoRoot } from "./lib/runtime.ts";

await buildThemes();
await auditThemes();

const packageManifest = JSON.parse(await fs.readFile(path.join(repoRoot, "package.json"), "utf8"));
const pluginManifest = JSON.parse(await fs.readFile(path.join(repoRoot, ".codex-plugin", "plugin.json"), "utf8"));
const changelog = await fs.readFile(path.join(repoRoot, "CHANGELOG.md"), "utf8");

if (packageManifest.version !== pluginManifest.version) {
  throw new Error(`Release version mismatch: package.json=${packageManifest.version}, plugin.json=${pluginManifest.version}`);
}
if (!changelog.includes(`## v${packageManifest.version} `)) {
  throw new Error(`CHANGELOG.md has no entry for v${packageManifest.version}`);
}

console.log(`[check] release metadata v${packageManifest.version} passed`);
