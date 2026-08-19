# Development

## Skill 开发与使用

`skills/vsp-marp/SKILL.md` 遵循通用 Agent Skills 格式，主 Skill 通过相对路径按需加载 `skills/<capability>/SKILL.md`。因此，Codex、Pi 或其他支持 Agent Skills 的工具只要加载主目录即可使用，不要求宿主支持嵌套 Skill 自动发现。

仓库提供两种宿主适配元数据：

- `.codex-plugin/plugin.json`：Codex 插件仓库清单，指向根目录 `skills/`。
- `package.json` 中的 `pi.skills`：Pi package 清单，同样指向根目录 `skills/`。

Codex 可以加载整个插件仓库，也可以从 `${CODEX_HOME:-$HOME/.codex}/skills/vsp-marp` 链接到已克隆仓库中的 `skills/vsp-marp/`；使用链接可以保留 Skill 对仓库 CLI、主题和模板的访问。Pi 可在仓库根目录执行：

```bash
pi install .
```

本地 CLI 与所有 Agent 共用；截图审计需要额外安装 Playwright Chromium：

```bash
pnpm install
pnpm exec playwright install chromium
node --import tsx scripts/render.ts <input.md> -o /tmp/slides.html
node --import tsx scripts/render.ts <input.md> --pdf -o /tmp/slides.pdf
npm run audit:slides -- <input.md> -o /tmp/slides-audit.md
npm run screenshot:slides -- /tmp/slides.html -o /tmp/slides-review
```

Skill 目录中的 `references/` 是独立分发所需的模板、主题和实践参考快照。仓库内开发时，以根目录的 `templates/`、`themes/`、`dist/themes/` 和 `practice/` 为准；更新相关内容后，应同步检查 Skill 快照是否需要更新。

## CLI 用法

CLI 更适合自动化流程，例如 agent 连续生成 `html` / `pdf`，再根据结果继续调整内容和版式。普通用户如果只需要预览，优先用 VS Code 即可。

先安装依赖：

```bash
npm install --ignore-scripts
```

渲染入口：

```bash
node --import tsx scripts/render.ts <input.md> [--theme <name> | --theme-file <css>] [--allow-local-files] [--pdf] [-o output.html]
```

输出规则：

- 默认输出 `html`
- 加 `--pdf` 时输出 `pdf`
- `-o` 用来指定输出文件名

示例：

```bash
node --import tsx scripts/render.ts templates/tutorial-red.md -o /tmp/tutorial-red.html
node --import tsx scripts/render.ts templates/report.md --theme report -o /tmp/report.html
node --import tsx scripts/render.ts templates/tutorial-red.md --pdf -o /tmp/tutorial-red.pdf
```

行为：

- `--theme-file` 直接使用本地构建后的 CSS，并与 `--theme` 互斥；用于主题开发和发布前审计
- `--allow-local-files` 允许可信文稿读取本地图片等资源；默认关闭，不要对外部或不可信 Markdown 开启
- 未指定 `--theme-file` 时，优先读取命令行 `--theme`
- 否则读取 Markdown frontmatter 里的 `theme`
- 否则回退到 `tutorial-red`
- 按主题名从 COS 下载远程 CSS 到 `.marp-cache/themes/`
- 用本地缓存文件调用 `marp-cli`

## VS Code 用户级 Marp 配置

不想在每个项目里放 `.vscode/settings.json` 时，可以直接使用 VS Code 用户级设置。它对所有工作区生效，也可以作为 VS Code 工作区配置异常时的 fallback。

步骤：

1. 打开 `文件 > 首选项 > 设置`。
2. 搜索 `marp`，切到 `用户` 设置。
3. 把 `Markdown > Marp: HTML` 改成 `all`。
4. 在 `Markdown > Marp: Themes` 添加远程主题 CSS：

```text
https://heaticy-1310163554.cos.ap-shanghai.myqcloud.com/vsp-marp/themes/tutorial-red.css
https://heaticy-1310163554.cos.ap-shanghai.myqcloud.com/vsp-marp/themes/tutorial-red-shtu.css
https://heaticy-1310163554.cos.ap-shanghai.myqcloud.com/vsp-marp/themes/tutorial-purple.css
https://heaticy-1310163554.cos.ap-shanghai.myqcloud.com/vsp-marp/themes/report.css
https://heaticy-1310163554.cos.ap-shanghai.myqcloud.com/vsp-marp/themes/report-red.css
https://heaticy-1310163554.cos.ap-shanghai.myqcloud.com/vsp-marp/themes/report-nailong.css
https://heaticy-1310163554.cos.ap-shanghai.myqcloud.com/vsp-marp/themes/tutorial-nailong.css
```

示意图：

![打开 VS Code 用户设置](https://heaticy-1310163554.cos.ap-shanghai.myqcloud.com/vsp-marp/assets/docs/vscode-marp-user-settings-step1.png)

![配置 Marp HTML 和远程主题](https://heaticy-1310163554.cos.ap-shanghai.myqcloud.com/vsp-marp/assets/docs/vscode-marp-user-settings-step2.png)

## Marp 指令与模板 class

本仓库模板主要由三层控制外观：

- frontmatter：写在 Markdown 文件最开头，控制整份文稿。
- Marp HTML 注释指令：写在某一页附近，控制当前页或后续页面。
- 主题 class：通过 `_class` 加到当前页，触发 `themes/` 里的 CSS 布局。

### frontmatter

frontmatter 位于文件最顶部的 `---` 块内。常用字段：

```yaml
---
marp: true
theme: tutorial-red
size: 16:9
paginate: true
math: mathjax
header: \ *CS100* *Tutorial 15* *Fall 2025*
---
```

字段说明：

| 字段 | 作用 | 备注 |
| --- | --- | --- |
| `marp: true` | 启用 Marp | 模板必须保留。 |
| `theme` | 指定主题 | 可用值是 `tutorial-red`、`tutorial-red-shtu`、`tutorial-purple`、`tutorial-nailong`、`report`、`report-red` 和 `report-nailong`。 |
| `size` | 指定画幅 | 主题支持 `16:9` 和 `4:3`，模板默认用 `16:9`。 |
| `paginate` | 是否显示页码 | 可在单页用 `_paginate: ""` 关闭。 |
| `math` | 数学公式渲染 | `practice/Tutorial-CS100-r13/CS100-r13.md` 使用 `math: mathjax`。 |
| `header` / `footer` | 默认页眉 / 页脚 | 可在单页用 `_header` / `_footer` 覆盖。 |

### 全局指令和局部指令

Marp 的 HTML 注释指令有作用域区别：

```markdown
<!-- backgroundImage: url(...) -->
```

不带下划线的是全局指令，会从当前页开始影响后续页面，直到被新的同类指令覆盖。

```markdown
<!-- _backgroundImage: url(...) -->
```

带下划线的是当前页局部指令，只影响当前这一页。模板里给单页换背景时优先用局部指令，避免尾页、目录页和后续正文被意外继承。

常用指令：

| 指令 | 作用域 | 用途 |
| --- | --- | --- |
| `<!-- _class: ... -->` | 当前页 | 给当前页添加主题 class。可写多个 class，例如 `cover_e`。 |
| `<!-- _header: "..." -->` | 当前页 | 覆盖当前页页眉。写 `""` 表示清空。 |
| `<!-- _footer: "..." -->` | 当前页 | 覆盖当前页页脚。写 `""` 表示清空。 |
| `<!-- _paginate: "" -->` | 当前页 | 当前页不显示页码。封面、目录、过渡页、尾页常用。 |
| `<!-- _backgroundImage: url(...) -->` | 当前页 | 只给当前页加背景图。 |
| `<!-- backgroundImage: url(...) -->` | 后续页面 | 给当前页和后续页面设置背景图。谨慎使用。 |

### 常用页面 class

这些 class 写在页面内的 `_class` 指令里：

```markdown
---
<!-- _class: cover_e -->
<!-- _paginate: "" -->

# Title
###### Subtitle
```

| class | 用途 | 常见模板 |
| --- | --- | --- |
| `cover_a` / `cover_b` / `cover_c` / `cover_d` / `cover_e` | 封面版式 | `tutorial-red.md` 使用 `cover_e`，`report.md` 使用 `cover_b`。 |
| `toc_a` | 卡片式目录页 | `tutorial-red.md`、`tutorial-nailong.md`、`report.md`；practice 示例也可使用。 |
| `toc_b` | 左侧色带目录页 | `tutorial-red.md`、`report.md`。 |
| `trans` | 章节过渡页 | 标题居中，使用主题主色背景；展示模板和 practice 示例都可使用。 |
| `fixedtitleA` | 固定标题正文页 | 标题保持普通样式，正文从标题下方开始。 |
| `fixedtitleB` | 标签式固定标题正文页 | 标题变成强调色标签，正文放在 `<div class="div">` 里。 |
| `lastpage` | 尾页 | 使用 `###### Thank You` 作为主标题，`.icons` 区域放三列信息。 |
| `navbar` | 顶部导航式页眉 | 适合需要把 header 做成通栏导航的页面。 |
| `caption` | 图片/图表说明 | 使用 `<div class="caption">...</div>`。 |
| `footnote` | 带脚注区域的页面 | 上方正文用 `.tdiv`，底部脚注用 `.bdiv`。 |

封面页的主讲人和制作者信息使用 `.speaker-meta`，主题会自动渲染成标签式署名区：

```markdown
<div class="speaker-meta">

<span>Speaker</span> Chaofan Li
<small>lichf2025@shanghaitech.edu.cn</small>

<span>Slides</span> Yunxiang He
<small>heyx2025@shanghaitech.edu.cn</small>

</div>
```

### 分栏和布局 class

分栏 class 需要配合内部 `<div>` 使用。例子：

```markdown
---
## 2. Layout Patterns: 分栏与图片
<!-- _class: cols-2 -->

<div class="ldiv">

Left content

</div>

<div class="rimg">

![#c](https://...)

</div>
```

布局 class：

| class | 布局 | 可用内部 class |
| --- | --- | --- |
| `cols-2` | 左右 1:1 两栏 | `.ldiv` / `.rdiv`，或 `.limg` / `.rimg`。 |
| `cols-2-73` | 左 70%，右 30% | `.ldiv` / `.rdiv`，或 `.limg` / `.rimg`。 |
| `cols-2-64` | 左 60%，右 40% | `.ldiv` / `.rdiv`，或 `.limg` / `.rimg`。 |
| `cols-2-37` | 左 30%，右 70% | `.ldiv` / `.rdiv`，或 `.limg` / `.rimg`。 |
| `cols-2-46` | 左 40%，右 60% | `.ldiv` / `.rdiv`，或 `.limg` / `.rimg`。 |
| `cols-3` | 三栏 | `.ldiv` / `.mdiv` / `.rdiv`，或 `.limg` / `.mimg` / `.rimg`。 |
| `rows-2` / `rows-2-55` | 上下 1:1 两行 | `.tdiv` / `.bdiv`，或 `.timg` / `.bimg`。 |
| `rows-2-73` | 上 70%，下 30% | `.tdiv` / `.bdiv`，或 `.timg` / `.bimg`。 |
| `rows-2-64` | 上 60%，下 40% | `.tdiv` / `.bdiv`，或 `.timg` / `.bimg`。 |
| `rows-2-37` | 上 30%，下 70% | `.tdiv` / `.bdiv`，或 `.timg` / `.bimg`。 |
| `rows-2-28` | 上 20%，下 80% | `.tdiv` / `.bdiv`，或 `.timg` / `.bimg`。 |
| `pin-3` | 上方通栏 + 下方两栏 | `.tdiv` / `.ldiv` / `.rdiv`，或对应图片 class。 |
| `right-fill` | 左右分栏修饰类，让右侧区域跨过标题行 | 配合 `cols-2*` 使用，例如 `<!-- _class: cols-2 right-fill -->`。 |

命名约定：

- `ldiv`、`mdiv`、`rdiv`、`tdiv`、`bdiv` 用于文字或普通内容。
- `limg`、`mimg`、`rimg`、`timg`、`bimg` 用于图片，会自动居中并按容器等比缩放，避免图片出界。
- 图片 alt 里可加 `#c`、`#l`、`#r` 辅助居中、左浮动或右浮动，例如 `![#c](...)`。
- 左右分栏默认标题占整行；如果右侧图片需要利用标题右边的空白，用 `right-fill`。
- 很扁的宽图优先用 `rows-2-*`，让说明文字在上、图片在下；细节多的统计图可用 `rows-2-28`，普通横图可用 `cols-2-64`，图片是主角时可用 `cols-2-37` 或 `cols-2-73`。

### 列表和引用 class

列表 class 用来把普通 Markdown 列表变成主题化列表：

| class | 效果 |
| --- | --- |
| `fglass` | 半透明列表卡片。 |
| `col1_ol_sq` | 单列列表，方形数字标记。 |
| `col1_ol_ci` | 单列列表，圆形数字标记。 |
| `cols2_ol_sq` | 双列列表，方形数字标记。 |
| `cols2_ol_ci` | 双列列表，圆形数字标记。 |
| `cols2_ul_sq` | 双列列表，方形项目符号。 |
| `cols2_ul_ci` | 双列列表，圆形项目符号。 |

引用提示框 class 用在包含 blockquote 的页面：

| class | 用途 |
| --- | --- |
| `bq` | 跟随当前主题主色的默认强调引用，标准模板优先使用。 |
| `bq-blue` | 蓝色提示框。 |
| `bq-red` | 显式红色提示框。 |
| `bq-green` | 绿色提示框。 |
| `bq-purple` | 紫色提示框。 |
| `bq-black` | 黑色提示框。 |
| `bq-yellow` | 黄色警告或注意提示框。 |

写法：

```markdown
---
## Note
<!-- _class: bq -->

> Title
>
> Body text
```

### 尾页写法

尾页使用 `lastpage`，并清空页眉、页脚和页码：

```markdown
---
<!-- _class: lastpage -->
<!-- _header: "" -->
<!-- _footer: "" -->
<!-- _paginate: "" -->

###### Thank You

<div class="icons">

- VSP-Marp
- ShanghaiTech
- COS theme assets

</div>
```

`lastpage` 会把 `h6` 放到主视觉区域，把 `.icons` 放到底部三列区域。不要在尾页前使用全局 `backgroundImage`，否则尾页可能继承背景图；单页背景请使用 `_backgroundImage`。

## 本地主题开发

如果你要修改 `themes/**/*.scss`，先安装依赖，再构建本地 CSS：

```bash
npm install --ignore-scripts
node --import tsx scripts/build-themes.ts
```

主题 preset 需要包含：

- `/* @theme <name> */`
- `/* @size 16:9 1280px 720px */`
- `/* @size 4:3 960px 720px */`

## 字体候选规则

主题字体由 palette 里的 CSS 变量控制，目前 `shtu-red` 和 `amber` 使用同一组候选顺序：

- `--font-family-display`: 标题、封面和强调标题。
- `--font-family-body`: 正文。
- `--font-family-mono`: 行内代码和代码块。
- `--font-family-accent`: 页脚和装饰性文字。

候选字体不是按平台分支判断，而是浏览器 / Marp 按从左到右匹配。Latin Modern 不视为系统默认字体，标题、正文和代码优先使用 `VSP Latin Modern ...` 字体；对应 `@font-face` 会先尝试本机 Latin Modern，再回退到 COS 上的小体积 OTF。中文字体不通过主题 CSS 从 COS 远程加载；PDF 渲染时如果本机能识别 Noto CJK 就优先使用，否则自然落到系统 fallback，避免下载大体积中文字体导致超时。当前完整 fallback 链如下：

| 用途 | fallback 链 |
| --- | --- |
| 标题 | `VSP Latin Modern Sans` -> `Noto Sans CJK SC` -> `sans-serif` |
| 正文 | `VSP Latin Modern Roman` -> `Noto Serif CJK SC` -> `serif` |
| 代码 | `VSP Latin Modern Mono` -> `Noto Sans Mono CJK SC` -> `monospace` |
| 装饰 | `VSP Latin Modern Sans` -> `Noto Sans CJK SC` -> `sans-serif` |

表格末尾的 `sans-serif`、`serif` 和 `monospace` 是 CSS 通用字体族，不是仓库提供或 COS 托管的具体字体。它们只作为最后兜底：前面的 Latin Modern / Noto CJK 都不可用时，由浏览器、Marp 或操作系统选择对应类别的默认字体。

如果需要改变跨平台字体策略，优先修改 `themes/palettes/*.scss` 里的四个 `--font-family-*` 变量，并同步检查两个 palette，避免同一主题族在不同颜色预设下字体不一致。

### Windows 安装本仓库字体

Windows 机器如果没有安装本仓库字体，主题仍可正常渲染 PDF，并会落到系统中文 fallback；但不同机器的中英文字形可能不完全一致。需要稳定复现模板效果，或需要让 `VSP Latin Modern ...` 和 `Noto ... CJK SC` 字体命中本机字体时，运行仓库里的用户级安装脚本：

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\install-windows-fonts.ps1
```

脚本会从 COS 下载 Latin Modern 和 Noto Serif/Sans/Sans Mono CJK SC 的 Regular/Bold OTF 到 `.marp-cache/fonts/` 下的分组缓存目录，再安装到当前用户字体目录 `%LOCALAPPDATA%\Microsoft\Windows\Fonts`。安装脚本使用字体文件原始注册名，不额外写入 `Heaticy ...` 系统字体名；`VSP Latin Modern ...` 只是主题 CSS 里的逻辑 family 名，用于本地 Latin Modern 与 COS fallback 的统一入口。默认会跳过已下载或已安装的字体；需要重新下载并覆盖安装时加 `-Force`：

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\install-windows-fonts.ps1 -Force
```

当前脚本优先使用当前用户字体安装方案，通常不需要管理员权限。安装后请重启已经打开的 VS Code、浏览器或终端，再重新渲染 PDF。

### macOS 安装本仓库字体

macOS 默认有可用的系统中文字体，通常不预装 Noto CJK；不安装也能显示中文，但不同平台中文字形会不同。需要命中主题字体链里的 `Noto ... CJK SC` 并稳定复现 PDF 效果时，使用 Bash 脚本安装同一批字体到当前用户目录：

```bash
bash scripts/install-unix-fonts.sh
```

macOS 默认安装目录为 `$HOME/Library/Fonts`。脚本会保留 OTF 文件的原始 family / fullname / PostScript 名，不创建 `Heaticy ...` 注册名。需要重新下载并覆盖安装时运行：

```bash
bash scripts/install-unix-fonts.sh --force
```

同一个脚本也支持 Linux，默认安装到 `${XDG_DATA_HOME:-$HOME/.local/share}/fonts/vsp-marp`。Linux 通常已经有可用的 Noto CJK 或系统中文字体；如果当前发行版没有，尤其是最小化 Ubuntu / 服务器环境缺少中文字体，或者也需要统一 PDF 字形，可以运行同一个脚本。

## GitLab CI

GitLab CI 使用 `latex-runner` 标签匹配当前可用的 shared runner。runner 不接收 untagged jobs，因此新增 job 时需要保留这个标签配置。

CI 会在 push、merge request、tag 和网页手动触发时创建流水线。普通开发提交只做轻量检查和构建；COS 发布仍使用本地 `sync:cos` 命令，不会在普通 push 中自动执行。

流水线包含：

- `check`: 运行 `npm run check`，构建主题 CSS，并审计 preset/palette 结构、CSS 变量闭合、本机路径、画布尺寸、默认 report 红色和 Skill 快照一致性。
- `build`: 运行 `npm run build`，并保存 `dist/` 作为一周有效的 artifact。

## 发布到 COS

本地可用 `secret.yaml` 或环境变量提供凭据，优先读取 `secret.yaml`。

`secret.yaml` 示例：

```yaml
bucket: heaticy-1310163554
region: ap-shanghai
path: vsp-marp
secretId: <your-secret-id>
secretKey: <your-secret-key>
```

上传命令：

```bash
node --import tsx scripts/sync-cos.ts
```

## 仓库结构

- `themes/`: 主题源码
- `templates/`: 主题展示模板，覆盖标准页面和常用布局
- `practice/`: 内容型 practice / recitation 示例，适合参考真实课程材料组织方式
- `shared-assets/`: 背景和 logo 素材
- `scripts/build-themes.ts`: 构建主题 CSS
- `scripts/render.ts`: 远程主题 CLI 渲染入口
- `scripts/sync-cos.ts`: 上传主题与素材到 COS

## Fork 声明

本仓库基于 `Hypo-Marp` fork 并重组，主要变化：

- 仓库名称改为 `VSP-Marp`
- 删除旧的 review、examples、tests 和历史说明材料
- 新人入口统一改为 `templates/`
- 主题 CSS 和图片素材统一发布到腾讯云 COS
- 日常使用收敛为 VS Code 预览和 CLI 渲染两条链路
