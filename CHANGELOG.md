# CHANGELOG

## v0.2.0 - Agent Skill and Theme Platform

- integrated the cross-agent `vsp-marp` Skill for Agent Skills, Codex, and Pi
- upgraded to Marp CLI 4.5 and Marp Core 4.4
- removed the duplicate `report` preset and standardized report workflows on `report-red`
- added local-theme rendering, trusted local asset support, theme encapsulation audits, and snapshot checks
- validated all standard templates and practice decks across rendered PDF pages
- completed VS Code configuration for all six published COS themes

## v0.1.1 - Report Variants

- added `report-red` and `report-nailong` report theme variants
- added a theme-colored `bq` callout style for templates
- documented the agent CLI rendering workflow

## v0.1.0 - From Scratch

- forked from `Hypo-Marp` into `VSP-Marp`
- reduced the repository to themes, templates, assets, and COS publishing
- kept the two preset themes: `tutorial-red` and `report`
- converted template asset references to COS absolute URLs
- added remote-theme CLI rendering and COS sync support
- switched local secret storage to `secret.yaml` with `.gitignore` protection
