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
3. Override all 14 required contract variables
4. Optionally override font-family variables or derived callout aliases
5. Build and visually check the output

## Add a Preset

1. Create `themes/presets/<name>.scss`
2. Add `/* @theme <name> */` at the top
3. If the theme should support Marp `size:` directives, add `/* @size <name> <width> <height> */` metadata lines
4. Compose `_base/*`, one palette, and one layout with `@use`
5. Run `node --import tsx scripts/build-themes.ts`
6. Add or repoint a template deck if needed

## Workflow

- `node --import tsx scripts/build-themes.ts`: compile themes into `dist/themes/`
- `node --import tsx scripts/render.ts templates/tutorial-red.md -o /tmp/tutorial-red.html`: render with remote COS theme
