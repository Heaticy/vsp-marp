import path from "node:path";
import { promises as fs } from "node:fs";
import { fileURLToPath } from "node:url";
import { compile } from "sass";

import { repoRoot, ensureDir } from "./lib/runtime.ts";
import { toDistThemePath, walkFiles } from "./lib/theme-utils.ts";

export async function buildThemes() {
  const presetFiles = await walkFiles(path.join(repoRoot, "themes", "presets"), (file) => file.endsWith(".scss"));

  await ensureDir(path.join(repoRoot, "dist", "themes"));

  for (const presetFile of presetFiles) {
    const relativePreset = path.relative(repoRoot, presetFile);
    const outFile = path.join(repoRoot, toDistThemePath(relativePreset));
    const themeName = path.basename(presetFile, ".scss");
    const result = compile(presetFile, { charset: false, style: "expanded" });
    await ensureDir(path.dirname(outFile));
    await fs.writeFile(outFile, normalizeBuiltThemeCss(result.css, themeName));
    console.log(`[build-themes] ${relativePreset} -> ${path.relative(repoRoot, outFile)}`);
  }
}

function normalizeBuiltThemeCss(source: string, themeName: string): string {
  const withoutCharset = source.replace(/^\uFEFF?@charset\s+"UTF-8";\r?\n?/i, "");
  const withoutThemeComment = withoutCharset.replace(/^\s*\/\*\s*@theme\s+[^\s*]+\s*\*\/\r?\n?/, "");
  return `/* @theme ${themeName} */\n${withoutThemeComment.replace(/^\s+/, "")}`;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  await buildThemes();
}
