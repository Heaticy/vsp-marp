# AGENTS.md

## 项目说明

VSP-Marp 是一个 Marp 主题和模板仓库。仓库会把 `themes/` 下的 SCSS 主题源码构建到 `dist/themes`，并把主题 CSS 和 `shared-assets/` 下的公共素材发布到腾讯云 COS。

## 常用命令

- 安装依赖：`npm install --ignore-scripts`
- 构建主题：`node --import tsx scripts/build-themes.ts`
- 渲染文稿：`node --import tsx scripts/render.ts <input.md> [-o output.html] [--pdf]`
- 同步 COS：`node --import tsx scripts/sync-cos.ts`
- 标准检查：`npm run check`

## 目录结构

- `templates/`：可直接使用的 Marp PPT 模板。
- `themes/`：Marp 主题的 SCSS 源码。
- `shared-assets/`：上传到 COS `vsp-marp/assets` 路径下的图片和 logo 素材。
- `scripts/`：主题构建、文稿渲染、COS 同步脚本。
- `docs/DEVELOPMENT.md`：开发和发布说明。

## Agent 渲染管线

Agent 处理模板、主题、视觉素材或用户要求检查渲染结果时，必须使用仓库 CLI 渲染管线，不要绕过 `scripts/render.ts` 直接调用本地文件、VS Code 预览或手写 Marp 命令。

CLI 渲染入口：

```bash
node --import tsx scripts/render.ts <input.md> [--theme <name>] [--pdf] [-o <output>]
```

管线行为：

- 读取输入 Markdown。
- 主题优先级为命令行 `--theme`、Markdown frontmatter `theme`、默认主题。
- 按主题名从远端 COS 下载主题 CSS，并缓存到 `.marp-cache/themes/`。
- 使用缓存后的主题 CSS 调用仓库内的 `@marp-team/marp-cli`。
- 默认输出 HTML；加 `--pdf` 输出 PDF；`-o` 或 `--output` 指定产物路径。

Agent 标准流程：

1. 修改前确认受影响的 Markdown 模板、主题 SCSS 或素材。
2. 修改主题或公开视觉素材后，先运行 `node --import tsx scripts/build-themes.ts`。
3. 渲染 HTML 到 `/tmp`，用于浏览器检查，例如：
   `node --import tsx scripts/render.ts templates/tutorial-red.md -o /tmp/tutorial-red.html`
4. 涉及版式、分页、PDF 或最终确认时，再渲染完整 PDF 到 `/tmp`，例如：
   `node --import tsx scripts/render.ts templates/tutorial-red.md --pdf -o /tmp/tutorial-red.pdf`
5. 需要给用户确认的 PDF，再复制到仓库 `previews/` 目录。

当用户明确要求“检查渲染内容”“看一下页面”“检查版式”“确认输出”或类似视觉验收时，Agent 必须用 Playwright 打开 CLI 生成的 HTML 产物进行观察；检查重点包括页面是否空白、主题是否加载、文字是否溢出或重叠、图片是否缺失或拉伸、分页和页眉页脚是否符合预期。必要时导出单页截图或全页截图辅助定位问题。

## 工作规则

- 修改模板时保持范围收敛，保留 Marp frontmatter 和注释指令语法。
- 可复用图片放在 `shared-assets/`，不要在模板里写本地文件系统路径。
- 远端素材 URL 使用 `https://heaticy-1310163554.cos.ap-shanghai.myqcloud.com/vsp-marp/...`。
- 不要提交或打印 `secret.yaml`；它包含 COS 凭据，只应保留在本地。
- 发布到 COS 前运行主题构建；`scripts/sync-cos.ts` 会自动构建主题。
- 修改模板、主题或视觉素材后，必须渲染受影响的模板并检查输出，再报告完成。
- 处理视觉问题时，先把完整 PDF 渲染到 `/tmp`，再复制到仓库 `previews/` 目录给用户确认；必要时再额外导出单页 PNG 辅助排查。用户确认后再提交并同步腾讯云 COS。
- 提交涉及主题 CSS 的改动后，再运行 `node --import tsx scripts/sync-cos.ts` 替换腾讯云 COS 上的远端 CSS。
- Git 提交信息使用中文，简短描述用户可理解的改动。
- 修改命令、公开路径或用户工作流时，同步更新相关文档。
