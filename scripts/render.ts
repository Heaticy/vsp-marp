import path from "node:path";
import { promises as fs } from "node:fs";
import { pathToFileURL } from "node:url";

import { extractFrontmatterTheme } from "./lib/theme-utils.ts";
import { marpCommand, repoRoot, runCommand } from "./lib/runtime.ts";
import { DEFAULT_THEME, resolveThemeUrl } from "./lib/remote-config.ts";

interface ParsedRenderArgs {
  inputFile: string;
  outputFile?: string;
  pdf: boolean;
  allowLocalFiles: boolean;
  theme: string | null;
  themeFile: string | null;
}

async function main() {
  const parsed = parseRenderArgs(process.argv.slice(2));
  const inputFile = path.resolve(process.cwd(), parsed.inputFile);
  const outputFile = parsed.outputFile ? path.resolve(process.cwd(), parsed.outputFile) : undefined;
  const source = await fs.readFile(inputFile, "utf8");
  const theme = parsed.theme ?? extractFrontmatterTheme(source) ?? DEFAULT_THEME;
  const themeFile = parsed.themeFile
    ? await resolveLocalThemeFile(parsed.themeFile)
    : await cacheRemoteTheme(theme);
  const marp = marpCommand();

  runCommand(
    marp.command,
    marp.args.concat(
      buildRenderArgs({
        inputFile,
        outputFile,
        pdf: parsed.pdf,
        allowLocalFiles: parsed.allowLocalFiles,
        themeFile,
      }),
    ),
  );

  if (parsed.allowLocalFiles && !parsed.pdf) {
    const htmlFile = outputFile ?? replaceExtension(inputFile, ".html");
    await injectLocalAssetBase(htmlFile, path.dirname(inputFile));
  }
}

function parseRenderArgs(argv: string[]): ParsedRenderArgs {
  let inputFile: string | undefined;
  let outputFile: string | undefined;
  let pdf = false;
  let allowLocalFiles = false;
  let theme: string | null = null;
  let themeFile: string | null = null;

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    switch (arg) {
      case "--pdf":
        pdf = true;
        break;
      case "--allow-local-files":
        allowLocalFiles = true;
        break;
      case "--theme":
        theme = argv[++index] ?? missingValue(arg);
        break;
      case "--theme-file":
        themeFile = argv[++index] ?? missingValue(arg);
        break;
      case "-o":
      case "--output":
        outputFile = argv[++index] ?? missingValue(arg);
        break;
      default:
        if (arg.startsWith("-")) {
          throw new Error(`Unknown option: ${arg}`);
        }

        if (inputFile) {
          throw new Error(`Only one input markdown file is supported, received: ${arg}`);
        }

        inputFile = arg;
        break;
    }
  }

  if (!inputFile) {
    throw new Error("Usage: pnpm render <input.md> [--theme <name> | --theme-file <css>] [--allow-local-files] [--pdf] [-o output.html]");
  }

  if (theme && themeFile) {
    throw new Error("--theme and --theme-file cannot be used together");
  }

  return { inputFile, outputFile, pdf, allowLocalFiles, theme, themeFile };
}

function buildRenderArgs(options: {
  inputFile: string;
  outputFile?: string;
  pdf: boolean;
  allowLocalFiles: boolean;
  themeFile: string;
}): string[] {
  const args = ["--theme", options.themeFile];

  if (options.pdf) {
    args.push("--pdf");
  }

  if (options.allowLocalFiles) {
    args.push("--allow-local-files");
  }

  args.push(options.inputFile);

  if (options.outputFile) {
    args.push("-o", options.outputFile);
  }

  return args;
}

async function injectLocalAssetBase(htmlFile: string, inputDir: string): Promise<void> {
  const source = await fs.readFile(htmlFile, "utf8");
  if (source.includes("<base ")) {
    return;
  }

  const baseUrl = pathToFileURL(`${inputDir}${path.sep}`).href;
  const withBase = source.replace("<head>", `<head>\n<base href="${baseUrl}">`);
  if (withBase === source) {
    throw new Error(`Cannot inject local asset base into HTML without <head>: ${htmlFile}`);
  }
  await fs.writeFile(htmlFile, withBase, "utf8");
}

function replaceExtension(file: string, extension: string): string {
  return file.replace(/\.[^.]+$/, extension);
}

async function resolveLocalThemeFile(themeFile: string): Promise<string> {
  const resolved = path.resolve(process.cwd(), themeFile);
  await fs.access(resolved);
  return resolved;
}

async function cacheRemoteTheme(themeName: string): Promise<string> {
  const themeUrl = resolveThemeUrl(themeName);
  const response = await fetch(themeUrl);

  if (!response.ok) {
    throw new Error(`Failed to download remote theme ${themeName} from ${themeUrl}: ${response.status}`);
  }

  const cacheDir = path.join(repoRoot, ".marp-cache", "themes");
  const cacheFile = path.join(cacheDir, `${themeName}.css`);
  await fs.mkdir(cacheDir, { recursive: true });
  await fs.writeFile(cacheFile, await response.text(), "utf8");
  return cacheFile;
}

function missingValue(flag: string): never {
  throw new Error(`Missing value for ${flag}`);
}

await main();
