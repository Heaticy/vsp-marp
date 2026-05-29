import path from "node:path";
import { promises as fs } from "node:fs";

import { extractFrontmatterTheme } from "./lib/theme-utils.ts";
import { marpCommand, repoRoot, runCommand } from "./lib/runtime.ts";
import { DEFAULT_THEME, resolveThemeUrl } from "./lib/remote-config.ts";

interface ParsedRenderArgs {
  inputFile: string;
  outputFile?: string;
  pdf: boolean;
  theme: string | null;
}

async function main() {
  const parsed = parseRenderArgs(process.argv.slice(2));
  const inputFile = path.resolve(process.cwd(), parsed.inputFile);
  const outputFile = parsed.outputFile ? path.resolve(process.cwd(), parsed.outputFile) : undefined;
  const source = await fs.readFile(inputFile, "utf8");
  const theme = parsed.theme ?? extractFrontmatterTheme(source) ?? DEFAULT_THEME;
  const themeFile = await cacheRemoteTheme(theme);
  const marp = marpCommand();

  runCommand(
    marp.command,
    marp.args.concat(
      buildRenderArgs({
        inputFile,
        outputFile,
        pdf: parsed.pdf,
        themeFile,
      }),
    ),
  );
}

function parseRenderArgs(argv: string[]): ParsedRenderArgs {
  let inputFile: string | undefined;
  let outputFile: string | undefined;
  let pdf = false;
  let theme: string | null = null;

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    switch (arg) {
      case "--pdf":
        pdf = true;
        break;
      case "--theme":
        theme = argv[++index] ?? missingValue(arg);
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
    throw new Error("Usage: pnpm render <input.md> [--theme <name>] [--pdf] [-o output.html]");
  }

  return { inputFile, outputFile, pdf, theme };
}

function buildRenderArgs(options: {
  inputFile: string;
  outputFile?: string;
  pdf: boolean;
  themeFile: string;
}): string[] {
  const args = ["--theme", options.themeFile];

  if (options.pdf) {
    args.push("--pdf");
  }

  args.push(options.inputFile);

  if (options.outputFile) {
    args.push("-o", options.outputFile);
  }

  return args;
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
