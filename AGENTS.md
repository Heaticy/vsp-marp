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
