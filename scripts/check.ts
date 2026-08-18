import { auditThemes } from "./audit-themes.ts";
import { buildThemes } from "./build-themes.ts";

await buildThemes();
await auditThemes();
