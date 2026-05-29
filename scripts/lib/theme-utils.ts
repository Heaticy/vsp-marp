import path from "node:path";
import { promises as fs } from "node:fs";

export function extractFrontmatterTheme(source: string): string | null {
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!match) return null;

  const themeLine = match[1]
    .split(/\r?\n/)
    .find((line) => line.trim().startsWith("theme:"));

  if (!themeLine) return null;
  return themeLine.replace(/^theme:\s*/, "").trim().replace(/^['"]|['"]$/g, "");
}

export function extractThemeComment(source: string): string | null {
  const match = source.match(/\/\*\s*@theme\s+([^\s*]+)\s*\*\//);
  return match?.[1] ?? null;
}

export function extractContractVariables(source: string): string[] {
  return [...source.matchAll(/^\s*\/\/\s*(--[a-z0-9-]+)\s*:/gim)].map(
    (match) => match[1],
  );
}

export function collectLocalReferences(source: string): string[] {
  const references = new Set<string>();
  const pattern = /(?:url\(([^)]+)\)|!\[[^\]]*]\(([^)]+)\)|\[[^\]]+]\(([^)]+)\))/g;

  let match: RegExpExecArray | null = null;
  while ((match = pattern.exec(source))) {
    const raw = (match[1] ?? match[2] ?? match[3] ?? "")
      .trim()
      .replace(/^['"]|['"]$/g, "");

    if (!raw) continue;
    if (/^(https?:|mailto:|data:|#)/i.test(raw)) continue;
    references.add(raw);
  }

  return [...references];
}

export function toDistThemePath(presetPath: string): string {
  return path
    .join("dist", "themes", `${path.basename(presetPath, ".scss")}.css`)
    .replaceAll(path.sep, "/");
}

export async function walkFiles(root: string, predicate?: (file: string) => boolean): Promise<string[]> {
  const output: string[] = [];

  async function visit(current: string) {
    const entries = await fs.readdir(current, { withFileTypes: true });

    for (const entry of entries) {
      const resolved = path.join(current, entry.name);
      if (entry.isDirectory()) {
        await visit(resolved);
      } else if (!predicate || predicate(resolved)) {
        output.push(resolved);
      }
    }
  }

  await visit(root);
  return output.sort((a, b) => a.localeCompare(b));
}

export function resolveReference(fromFile: string, reference: string): string {
  return path.normalize(path.join(path.dirname(fromFile), reference));
}

export function toPosix(filePath: string): string {
  return filePath.split(path.sep).join("/");
}
