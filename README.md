# VSP-Marp

一个包含 `vsp-marp` Agent Skill 的 Marp 主题、模板和自动化仓库，默认通过腾讯云 COS 提供远程主题和素材。

## VSP-Marp Skill

仓库内置的 Skill 位于 `skills/vsp-marp/`，遵循通用 Agent Skills 格式，覆盖 PPT 规划、素材检查、Marp Markdown 生成、HTML/PDF 渲染、视觉审计、回修和导出。Skill 与本仓库共用 `templates/`、`themes/`、`practice/` 和 `scripts/render.ts`，无需再安装单独的 slides 仓库。

### 通用安装

支持 Agent Skills 的工具可直接加载 `skills/vsp-marp/`，或将该目录安装到工具自己的 Skills 目录。使用时指定 `vsp-marp`，也可以直接描述“用 VSP-Marp 生成/渲染/审计 PPT”。主 Skill 会按需读取相对路径下的子 Skill，因此不依赖某个 Agent 是否支持嵌套 Skill 自动发现。

需要运行本地工具链和截图审计时安装依赖：

```bash
pnpm install
pnpm exec playwright install chromium
```

### Codex

本仓库根目录包含 `.codex-plugin/plugin.json`，可作为 Codex 插件仓库加载。只使用 Skill 目录时，建议从已克隆的仓库建立链接，以保留对仓库 CLI、主题和模板的访问：

```bash
mkdir -p "${CODEX_HOME:-$HOME/.codex}/skills"
ln -s "$(pwd)/skills/vsp-marp" "${CODEX_HOME:-$HOME/.codex}/skills/vsp-marp"
```

之后通过 `$vsp-marp` 或自然语言触发；Codex 界面元数据位于 `skills/vsp-marp/agents/openai.yaml`。

### Pi

Pi 可以把整个仓库作为本地 package 安装：

```bash
pi install .
```

重新进入会话后使用 `/skill:vsp-marp`。Pi 还能递归发现 `/skill:vsp-marp-plan`、`/skill:vsp-marp-render` 和 `/skill:vsp-marp-audit` 等带前缀的子 Skill。

完整路由和触发说明见 [`skills/vsp-marp/SKILL.md`](skills/vsp-marp/SKILL.md)。

## 用户说明（必看）

如果你只是想在 VS Code 里预览 Marp，只需要下面几件事：

1. 安装 `Marp for VS Code` 插件。
2. 当前 VS Code 工作区是 `Trusted Workspace`。
3. 在 VS Code 用户级设置里加载远程主题。
4. Markdown 头部包含正确的 Marp 配置；推荐直接参考或复制本仓库 `templates/` 里的现成模板。

Markdown 头部最小示例：

```yaml
---
marp: true
theme: tutorial-red
size: 16:9
---
```

直接使用用户级设置即可，不需要在项目里放 `.vscode/settings.json`。打开 VS Code 设置，搜索 `marp`，在用户设置里把 `Markdown > Marp: HTML` 改成 `all`，并在 `Markdown > Marp: Themes` 添加这些远程主题：

```text
https://heaticy-1310163554.cos.ap-shanghai.myqcloud.com/vsp-marp/themes/tutorial-red.css
https://heaticy-1310163554.cos.ap-shanghai.myqcloud.com/vsp-marp/themes/tutorial-red-shtu.css
https://heaticy-1310163554.cos.ap-shanghai.myqcloud.com/vsp-marp/themes/tutorial-purple.css
https://heaticy-1310163554.cos.ap-shanghai.myqcloud.com/vsp-marp/themes/report-red.css
https://heaticy-1310163554.cos.ap-shanghai.myqcloud.com/vsp-marp/themes/report-nailong.css
https://heaticy-1310163554.cos.ap-shanghai.myqcloud.com/vsp-marp/themes/tutorial-nailong.css
```

这样配置后，换目录打开 Markdown 也能预览；如果 VS Code 的工作区配置偶发失效，用户级配置也可以作为稳定 fallback。

使用用户级设置时，Markdown 文件放在哪里都可以，不需要固定工作区结构。

示意图：

<img
  src="https://heaticy-1310163554.cos.ap-shanghai.myqcloud.com/vsp-marp/assets/docs/vscode-marp-user-settings-step1.png"
  alt="打开 VS Code 用户设置"
  width="500"
/>

<img
  src="https://heaticy-1310163554.cos.ap-shanghai.myqcloud.com/vsp-marp/assets/docs/vscode-marp-user-settings-step2.png"
  alt="配置 Marp HTML 和远程主题"
  width="1000"
/>

### Windows / macOS / Linux 字体（建议看）

不安装字体也可以预览和导出 PDF；如果希望 Windows / macOS / Linux 上的 PDF 字体更稳定，先运行对应脚本。

**Ubuntu 只要有中文字体，一般就自带或能命中 Noto CJK；最小化环境缺中文时再安装**。

Windows:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\install-windows-fonts.ps1
```

macOS / Linux:

```bash
bash scripts/install-unix-fonts.sh
```

安装后请重启已经打开的 VS Code、浏览器或终端，再重新预览或导出 PDF。更多字体策略和 Linux / Ubuntu 说明见 [开发说明](docs/DEVELOPMENT.md)。

### 仅在使用工作区配置时（按需看）

仓库里的 `.vscode/settings.json` 只是现成示例，适合需要把配置随项目带走的情况；普通使用不需要它。

如果你确实要使用工作区配置，需要保证 `.vscode/settings.json` 位于 VS Code 打开的工作区根目录下。例如：

```text
your-workspace/
  .vscode/
    settings.json
  anywhere.md
```

Markdown 文件放在这个工作区里的任意位置都可以。

```json
{
  "markdown.marp.html": "all",
  "markdown.marp.themes": [
    "https://heaticy-1310163554.cos.ap-shanghai.myqcloud.com/vsp-marp/themes/tutorial-red.css",
    "https://heaticy-1310163554.cos.ap-shanghai.myqcloud.com/vsp-marp/themes/tutorial-red-shtu.css",
    "https://heaticy-1310163554.cos.ap-shanghai.myqcloud.com/vsp-marp/themes/tutorial-purple.css",
    "https://heaticy-1310163554.cos.ap-shanghai.myqcloud.com/vsp-marp/themes/report-red.css",
    "https://heaticy-1310163554.cos.ap-shanghai.myqcloud.com/vsp-marp/themes/report-nailong.css",
    "https://heaticy-1310163554.cos.ap-shanghai.myqcloud.com/vsp-marp/themes/tutorial-nailong.css"
  ]
}
```

### 现成模板

`templates/` 用来展示主题支持的标准页面和布局，适合复制后替换成自己的内容：

| 模板 | 主题 | 适合场景 | 说明 |
| --- | --- | --- | --- |
| `templates/tutorial-red.md` | `tutorial-red` | 教学、习题课、tutorial slides | 红色教学展示模板，不默认绑定学校 logo 或背景，适合作为通用 red 模板。 |
| `templates/tutorial-red-shtu.md` | `tutorial-red-shtu` | 上科大教学、课程展示 | 基于 `tutorial-red` 的上科大版本，默认带上科大封面 logo、名称和正文背景图。 |
| `templates/tutorial-purple.md` | `tutorial-purple` | 教学、习题课、tutorial slides | 紫色教学展示模板，版式与 `tutorial-red` 保持一致，只替换主题色。 |
| `templates/tutorial-nailong.md` | `tutorial-nailong` | 奶龙风格教学、组会、轻量汇报 | 奶龙黄教学展示模板，保持 tutorial 标准结构，只在封面、过渡页和主题配色上强化视觉风格。 |
| `templates/report-red.md` | `report-red` | 汇报、项目展示、阶段报告 | 默认报告模板，使用红色报告主题。 |
| `templates/report-nailong.md` | `report-nailong` | 轻量、活泼的报告 | Nailong 报告模板。 |

### Practice 示例

`practice/` 放更接近真实课程或内容型文稿的示例。它们不是主题展示模板，重点是内容组织方式：

| 示例 | 主题 | 适合参考 | 说明 |
| --- | --- | --- | --- |
| `practice/Tutorial-CS100-r13/CS100-r13.md` | `tutorial-red-shtu` | 课程 practice / recitation | CS100 Makefile practice 示例，包含 `math: mathjax`、分页、课程 header、完整目录和多页课程内容。适合参考内容型 practice 怎么组织章节、代码块和说明文字。 |
| `practice/Tutorial-SI100B-pj-intro/Project-00-Intro.md` | `tutorial-red-shtu` | 课程项目介绍 | SI100B Project 00 介绍示例，适合参考课程型 tutorial 的内容组织和图片排版。 |
| `practice/Report-4DGS/Report-4DGS.md` | `report-red` | 论文汇报 / paper report | 4DGS 论文汇报示例，适合参考红色报告主题下的章节组织、图片页和尾页。 |
| `practice/Report-4DSloMo/Report-4DSloMo.md` | `report-red` | 论文汇报 / paper report | 4DSloMo 与 LoRA 学习报告示例，适合参考报告文稿迁移。 |
| `practice/Report-MaskGaussian/Report-MaskGaussian.md` | `report-red` | 论文汇报 / paper report | MaskGaussian 汇报示例，适合参考公式、双栏文本和报告封面结构。 |

现成工作区配置见 [.vscode/settings.json](/mnt/nas-home/vsp-marp/.vscode/settings.json:1)。

## CLI 用法（进阶）

CLI 方式放在 VS Code 方式后面，是因为它更适合自动化：

- agent 可以直接生成 `pdf` 或 `html`
- agent 可以根据渲染结果继续反馈和调节内容、版式和主题
- 但对普通用户来说，这不是必需步骤，单用 VS Code 预览就够了

先安装依赖：

```bash
npm install --ignore-scripts
```

渲染命令：

```bash
node --import tsx scripts/render.ts <input.md> [--theme <name> | --theme-file <css>] [--allow-local-files] [-o output.html]
node --import tsx scripts/render.ts <input.md> [--theme <name> | --theme-file <css>] [--allow-local-files] --pdf -o output.pdf
```

常见示例：

```bash
node --import tsx scripts/render.ts templates/tutorial-red.md -o /tmp/tutorial-red.html
node --import tsx scripts/render.ts templates/tutorial-red.md --pdf -o /tmp/tutorial-red.pdf
node --import tsx scripts/render.ts templates/report-red.md --theme report-red -o /tmp/report-red.html
node --import tsx scripts/render.ts templates/report-red.md --theme-file dist/themes/report-red.css -o /tmp/report-red-local.html
node --import tsx scripts/render.ts practice/Tutorial-CS100-r13/CS100-r13.md --pdf -o /tmp/CS100-r13.pdf
```

说明：

- `--theme-file` 使用本地 CSS，并与 `--theme` 互斥；修改主题后的发布前检查应使用该选项
- `--allow-local-files` 允许可信 Markdown 读取本地图片等资源；默认关闭，不要对外部或不可信文稿开启
- 不加 `--pdf` 时，默认输出 `html`
- 加 `--pdf` 时，输出 `pdf`
- `--theme` 可以覆盖 Markdown 头部里的 `theme`

## 开发说明（开发者看）

开发、CLI、COS 发布、主题构建和仓库结构见 [docs/DEVELOPMENT.md](/mnt/nas-home/vsp-marp/docs/DEVELOPMENT.md:1)。
