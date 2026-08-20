# Themes

## Structure

This repository splits theme concerns into three layers:

1. `layouts/`: structure, spacing, positioning, component shells
2. `palettes/`: color and font variable overrides only
3. `presets/`: thin composition entrypoints with `/* @theme ... */`

Shared primitives live in `_base/`.

## Add a Layout

1. Create `themes/layouts/<name>.scss`
2. `@use "../_base/layouts" as *;`
3. Add only structural overrides and class behavior
4. Do not hardcode palette colors; use `var(--color-*)`
5. Pair it with a template under `templates/`

## Add a Palette

1. Create `themes/palettes/<name>.scss`
2. `@use "../_base/palette-contract" as contract;`
3. Override all required variables documented in `themes/_base/palette-contract.scss` (currently 40)
4. Optionally override font-family variables or derived callout aliases
5. Build and visually check the output

## Add a Preset

1. Create `themes/presets/<name>.scss`
2. Add `/* @theme <name> */` at the top
3. If the theme should support Marp `size:` directives, add `/* @size <name> <width> <height> */` metadata lines
4. Compose `_base/*`, one palette, and one layout with `@use`
5. Run `node --import tsx scripts/build-themes.ts`
6. Add or repoint a template deck if needed

## Encapsulation Rules

- Each preset compiles to one independent CSS file with exactly one matching `/* @theme <name> */` header.
- A preset composes `_base/index`, exactly one palette, and exactly one layout. Theme-specific values must not leak into shared layout modules.
- Layouts consume `var(--color-*)` and font/token variables instead of importing a concrete palette.
- Built CSS must not contain machine-local paths, unresolved Sass syntax, or undefined custom-property references.
- `:root`, reset selectors, and bare content selectors are intentional inside a Marp theme stylesheet; distribution isolation is provided by separate preset CSS files and Marp's selected theme.
- `skills/vsp-marp/references/templates` and `skills/vsp-marp/references/themes` are checked byte-for-byte against the canonical root templates and built CSS.

## Workflow

- `npm run check`: rebuild all themes and enforce preset, palette, CSS-variable, local-path, canvas, `report-red`, and Skill snapshot invariants
- `npm run audit:themes`: run the same theme invariants against existing build output without rebuilding
- `node --import tsx scripts/build-themes.ts`: compile themes into `dist/themes/`
- `node --import tsx scripts/render.ts templates/tutorial-red.md -o /tmp/tutorial-red.html`: render with remote COS theme
- `node --import tsx scripts/render.ts templates/tutorial-red.md --theme-file dist/themes/tutorial-red.css -o /tmp/tutorial-red-local.html`: render with a local built theme for pre-release review
