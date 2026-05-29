import path from "node:path";
import { fileURLToPath } from "node:url";

import { defineConfig } from "@marp-team/marp-cli";

const configDir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  themeSet: path.join(configDir, "dist", "themes"),
});
