import path from "node:path";
import { promises as fs } from "node:fs";
import { fileURLToPath } from "node:url";

import { repoRoot } from "./lib/runtime.ts";
import { walkFiles } from "./lib/theme-utils.ts";

const THEME_HEADER_RE = /^\/\* @theme ([a-z0-9-]+) \*\/\n/;
const VARIABLE_DEFINITION_RE = /(--[a-zA-Z0-9-]+)\s*:/g;
const VARIABLE_USAGE_RE = /var\((--[a-zA-Z0-9-]+)/g;
const MACHINE_PATH_RE = /(?:file:\/\/|\/home\/|\/Users\/|[A-Za-z]:\\)/;
const UNRESOLVED_SASS_RE = /(?:#\{|\$[a-zA-Z_-][a-zA-Z0-9_-]*)/;
const THEME_BASE_URL = "https://heaticy-1310163554.cos.ap-shanghai.myqcloud.com/vsp-marp/themes";

export async function auditThemes() {
  const presetDir = path.join(repoRoot, "themes", "presets");
  const paletteDir = path.join(repoRoot, "themes", "palettes");
  const layoutDir = path.join(repoRoot, "themes", "layouts");
  const templateDir = path.join(repoRoot, "templates");
  const distDir = path.join(repoRoot, "dist", "themes");
  const skillDir = path.join(repoRoot, "skills", "vsp-marp", "references");

  const presetFiles = await walkFiles(presetDir, file => file.endsWith(".scss"));
  const paletteFiles = await walkFiles(paletteDir, file => file.endsWith(".scss"));
  const layoutFiles = await walkFiles(layoutDir, file => file.endsWith(".scss"));
  const templateFiles = await walkFiles(templateDir, file => file.endsWith(".md"));
  const distFiles = await walkFiles(distDir, file => file.endsWith(".css"));
  const expectedThemes = presetFiles.map(file => path.basename(file, ".scss")).sort();
  const builtThemes = distFiles.map(file => path.basename(file, ".css")).sort();

  assertEqualLists(builtThemes, expectedThemes, "Built CSS files must match theme presets");

  const vscodeSettingsFile = path.join(repoRoot, ".vscode", "settings.json");
  const vscodeSettings = JSON.parse(await fs.readFile(vscodeSettingsFile, "utf8"));
  assert(vscodeSettings["markdown.marp.html"] === "all", `${relative(vscodeSettingsFile)} must enable all HTML used by the templates`);
  const configuredThemeUrls = vscodeSettings["markdown.marp.themes"];
  assert(Array.isArray(configuredThemeUrls), `${relative(vscodeSettingsFile)} must define markdown.marp.themes as an array`);
  assert(new Set(configuredThemeUrls).size === configuredThemeUrls.length, `${relative(vscodeSettingsFile)} contains duplicate theme URLs`);
  const expectedThemeUrls = expectedThemes.map(theme => `${THEME_BASE_URL}/${theme}.css`).sort();
  assertEqualLists([...configuredThemeUrls].sort(), expectedThemeUrls, "VS Code theme URLs must match theme presets");

  const contractSource = await fs.readFile(path.join(repoRoot, "themes", "_base", "palette-contract.scss"), "utf8");
  const requiredPaletteVariables = new Set(
    [...contractSource.matchAll(/^\/\/ (--[a-zA-Z0-9-]+):/gm)].map(match => match[1]),
  );

  for (const paletteFile of paletteFiles) {
    const source = await fs.readFile(paletteFile, "utf8");
    const definitions = collectMatches(source, VARIABLE_DEFINITION_RE);
    const missing = [...requiredPaletteVariables].filter(variable => !definitions.has(variable));
    assert(missing.length === 0, `${relative(paletteFile)} misses palette variables: ${missing.join(", ")}`);
  }

  for (const layoutFile of layoutFiles) {
    const source = await fs.readFile(layoutFile, "utf8");
    assert(!/@use "\.\.\/palettes\//.test(source), `${relative(layoutFile)} must not import a concrete palette`);
    assert(!/@use "\.\.\/_base\/layouts"/.test(source), `${relative(layoutFile)} must not reload base layouts; presets own base composition`);
  }

  const baseLayoutSource = await fs.readFile(path.join(repoRoot, "themes", "_base", "layouts.scss"), "utf8");
  assert(!/(?:#[0-9a-fA-F]{3,8}\b|rgba?\()/.test(baseLayoutSource), "themes/_base/layouts.scss must not hardcode palette colors");
  const utilitySource = await fs.readFile(path.join(repoRoot, "themes", "_base", "utilities.scss"), "utf8");
  assert(!utilitySource.includes("section:is(.bq"), "Callout shell rules must stay encapsulated in themes/_base/layouts.scss");

  for (const templateFile of templateFiles) {
    const source = await fs.readFile(templateFile, "utf8");
    assert(!/<!--\s*_class:[^>]*\bbq-(?:blue|red|green|purple|black|yellow)\b/.test(source), `${relative(templateFile)} hardcodes a callout color; use semantic class bq`);
    assert(!/<style\b|\bstyle\s*=/.test(source), `${relative(templateFile)} contains inline CSS instead of a theme class`);
    assert(!/(?:#[0-9a-fA-F]{3,8}\b|rgba?\()/.test(source), `${relative(templateFile)} hardcodes a color instead of using the theme palette`);
    assert(source.includes("<!-- _class: bq -->"), `${relative(templateFile)} must demonstrate the semantic default callout`);
  }

  for (const presetFile of presetFiles) {
    const source = await fs.readFile(presetFile, "utf8");
    const themeName = path.basename(presetFile, ".scss");
    assert(source.startsWith(`/* @theme ${themeName} */\n`), `${relative(presetFile)} has a missing or mismatched @theme header`);
    assert(countMatches(source, /@use "\.\.\/_base\/index";/g) === 1, `${relative(presetFile)} must load the base module exactly once`);
    assert(countMatches(source, /@use "\.\.\/palettes\/[a-z0-9-]+";/g) === 1, `${relative(presetFile)} must load exactly one palette`);
    assert(countMatches(source, /@use "\.\.\/layouts\/[a-z0-9-]+";/g) === 1, `${relative(presetFile)} must load exactly one layout`);
  }

  for (const distFile of distFiles) {
    const source = await fs.readFile(distFile, "utf8");
    const themeName = path.basename(distFile, ".css");
    const header = source.match(THEME_HEADER_RE);
    assert(header?.[1] === themeName, `${relative(distFile)} has a missing, duplicate, or mismatched @theme header`);
    assert(countMatches(source, /\/\* @theme [a-z0-9-]+ \*\//g) === 1, `${relative(distFile)} must contain exactly one @theme header`);
    assert(!source.includes("@charset"), `${relative(distFile)} must not contain @charset`);
    assert(!MACHINE_PATH_RE.test(source), `${relative(distFile)} contains a machine-local path`);
    assert(!UNRESOLVED_SASS_RE.test(source), `${relative(distFile)} contains unresolved Sass syntax`);

    const definitions = collectMatches(source, VARIABLE_DEFINITION_RE);
    const usages = collectMatches(source, VARIABLE_USAGE_RE);
    const missing = [...usages].filter(variable => !definitions.has(variable));
    assert(missing.length === 0, `${relative(distFile)} uses undefined CSS variables: ${missing.join(", ")}`);
    assert(source.includes("section {"), `${relative(distFile)} does not define the Marp section canvas`);
    assert(source.includes("width: 1280px;"), `${relative(distFile)} does not preserve the 16:9 canvas width`);
    assert(source.includes("height: 720px;"), `${relative(distFile)} does not preserve the canvas height`);
  }

  const reportRedCss = await fs.readFile(path.join(distDir, "report-red.css"), "utf8");
  assert(lastVariableValue(reportRedCss, "--color-primary") === "#ae3a44", "report-red must use the red #ae3a44 primary color");

  if (await exists(skillDir)) {
    await assertDirectorySnapshots(path.join(repoRoot, "templates"), path.join(skillDir, "templates"), ".md");
    await assertDirectorySnapshots(distDir, path.join(skillDir, "themes"), ".css");
  }

  console.log(`[audit-themes] ${expectedThemes.length} themes, ${paletteFiles.length} palettes, ${layoutFiles.length} layout modules, and Skill snapshots passed`);
}

async function assertDirectorySnapshots(sourceDir: string, snapshotDir: string, extension: string) {
  const sourceFiles = await walkFiles(sourceDir, file => file.endsWith(extension));
  for (const sourceFile of sourceFiles) {
    const snapshotFile = path.join(snapshotDir, path.basename(sourceFile));
    assert(await exists(snapshotFile), `${relative(snapshotFile)} is missing`);
    const [source, snapshot] = await Promise.all([fs.readFile(sourceFile), fs.readFile(snapshotFile)]);
    assert(source.equals(snapshot), `${relative(snapshotFile)} is stale compared with ${relative(sourceFile)}`);
  }
}

function collectMatches(source: string, pattern: RegExp): Set<string> {
  return new Set([...source.matchAll(pattern)].map(match => match[1]));
}

function countMatches(source: string, pattern: RegExp): number {
  return [...source.matchAll(pattern)].length;
}

function lastVariableValue(source: string, variable: string): string | undefined {
  const pattern = new RegExp(`${variable.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*:\\s*([^;]+);`, "g");
  return [...source.matchAll(pattern)].at(-1)?.[1].trim();
}

function assertEqualLists(actual: string[], expected: string[], message: string) {
  assert(JSON.stringify(actual) === JSON.stringify(expected), `${message}: expected ${expected.join(", ")}; received ${actual.join(", ")}`);
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

async function exists(file: string): Promise<boolean> {
  try {
    await fs.access(file);
    return true;
  }
  catch {
    return false;
  }
}

function relative(file: string): string {
  return path.relative(repoRoot, file);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  await auditThemes();
}
