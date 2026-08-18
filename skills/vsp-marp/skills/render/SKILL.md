---
name: vsp-marp-render
description: VSP-Marp 渲染子技能。将 Marp Markdown 渲染为 HTML/PDF，处理主题 CSS、Marp CLI、输出路径和渲染失败诊断。触发条件：用户说渲染、导出 HTML/PDF、Marp CLI、theme css、render。
---

# VSP-Marp Render

将 `.md` 渲染为 HTML/PDF。

## 流程

1. 确认输入 `.md` 存在。
2. 将主 `SKILL.md` 所在目录记为 `SKILL_DIR`。若它位于 Git checkout 中，用 `git -C "$SKILL_DIR" rev-parse --show-toplevel` 定位 `REPO_ROOT`；不要假定当前工作目录就是仓库根目录。
3. 检查主题名称；完整仓库优先使用统一 CLI 的主题下载缓存，Skill 独立运行时使用 `$SKILL_DIR/references/themes/<theme>.css`。
4. 找到 `$REPO_ROOT/scripts/render.ts` 时使用仓库统一渲染管线：
   ```bash
   cd "$REPO_ROOT"
   node --import tsx scripts/render.ts <input.md> [-o <output.html>] [--pdf] [--allow-local-files] [--theme <theme> | --theme-file <css>]
   ```
5. 没有完整仓库时，使用 Skill 自带主题快照和标准 Marp CLI：
   ```bash
   npx @marp-team/marp-cli@4 <input.md> \
     --theme-set "$SKILL_DIR/references/themes/<theme>.css" \
     -o <output.html>
   # PDF 输出在上述命令中增加 --pdf
   ```
6. 修改完整仓库中的主题或公开视觉素材后，先运行 `node --import tsx scripts/build-themes.ts`。
7. 输入引用可信本地图片等资源时增加 `--allow-local-files`；该选项默认关闭，不得对来源不明的 Markdown 开启。
8. 渲染失败时优先检查图片路径、主题 CSS、远端主题访问和 `@marp-team/marp-cli` 依赖。

## 输出

- HTML/PDF 路径
- 渲染日志摘要
- 若失败，给出最小修复步骤

渲染完成后通常进入 `audit`。
