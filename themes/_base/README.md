# Base Contract

`palette-contract.scss` defines the required palette surface. Every palette must override these variables.

| Variable | Purpose | Default |
| --- | --- | --- |
| `--color-primary` | dominant brand or cover color | `AccentColor` |
| `--color-on-primary` | text on primary surfaces | `AccentColorText` |
| `--color-bg` | default page background | `Canvas` |
| `--color-surface` | cards and raised white surfaces | `Canvas` |
| `--color-text` | primary body text | `CanvasText` |
| `--color-muted` | footer and secondary text | `CanvasText` mixed toward `Canvas` |
| `--color-accent` | heading accents and markers | `LinkText` |
| `--color-section-bg` | alternate panels and nav bars | `Canvas` mixed toward `AccentColor` |
| `--color-code-bg` | inline/code block background | `Canvas` mixed toward `AccentColor` |
| `--color-code-text` | code foreground | `CanvasText` |
| `--color-link` | link color | `LinkText` |
| `--color-divider` | borders and separators | `CanvasText` mixed toward transparent |
| `--color-quote` | standard blockquote background | `section-bg` mixed with `surface` |
| `--color-navbar-font` | navbar text color | `CanvasText` mixed toward `Canvas` |
| `--filter-logo` | legacy logo filter hook | `none` |
| `--filter-bg` | legacy decorative image filter hook | `none` |
| `--font-family-display` | display and heading font stack | `"Comic Sans MS", "Papyrus", serif` |
| `--font-family-body` | primary body font stack | `"Times New Roman", serif` |
| `--font-family-mono` | code font stack | `"Courier New", monospace` |
| `--font-family-accent` | footer/decorative font stack | `"Brush Script MT", cursive` |
| `--color-callout-blue` | blue callout header background | derived from `surface` + `accent` |
| `--color-callout-red` | red callout header background | derived from `primary` + `accent` |
| `--color-callout-green` | green callout header background | derived from `section-bg` + `accent` |
| `--color-callout-purple` | purple callout header background | derived from `primary` + `link` |
| `--color-callout-black` | black callout header background | derived from `text` + `muted` |
| `--color-callout-yellow` | yellow callout header background | derived from `primary` + `accent` |
| `--color-callout-body` | callout body background | derived from `surface` + `section-bg` |
| `--color-glass-bg` | frosted glass surface background | `surface` mixed with transparent |
| `--color-glass-border` | frosted glass border color | `text` mixed with transparent |
| `--color-syntax-comment` | code comment color | derived from `text` + `accent` |
| `--color-syntax-string` | code string color | derived from `accent` + `primary` |
| `--color-syntax-number` | code number color | derived from `accent` + `text` |
| `--color-syntax-keyword` | code keyword color | `link` |
| `--color-syntax-symbol` | code symbol color | derived from `primary` + `text` |
| `--color-syntax-variable` | code variable color | derived from `link` + `primary` |
| `--color-syntax-builtin` | code builtin color | derived from `link` + `text` |
| `--color-prompt-input` | terminal/input prompt color | derived from `accent` + `surface` |
| `--color-prompt-output` | terminal/output prompt color | derived from `primary` + `surface` |
| `--color-inverted-bg` | inverted block background | `surface` |
| `--color-inverted-text` | inverted block foreground | `text` |

Derived aliases such as `--color-coverbg`, `--color-main`, and `--color-shadow` exist for backward-compatible layout rules, but the table above is the required override surface for palettes.
