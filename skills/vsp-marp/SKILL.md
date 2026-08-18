---
name: vsp-marp
description: VSP-Marp 技能组总入口。将 Markdown、PDF、讲稿、论文、课程材料或项目材料转换为符合 VSP-Marp 规范的 PPT，并按意图路由到 plan、start、resume、generate、render、audit、theme、assets、export、polish。触发条件：用户要求做 PPT、生成 slides、Marp 排版、论文汇报、课程展示、项目展示、组会汇报，或提到 vsp-marp:* / vm:* 命名空间命令。
compatibility: Requires Node.js 20+ and pnpm/npm for local rendering; screenshot audit additionally requires Playwright Chromium.
---

# VSP-Marp

VSP-Marp 是 PPT 生成与审计技能组。此 skill 是总入口，只负责判断意图并加载对应子 skill。

路由到某项能力时，读取相对于本文件的 `skills/<capability>/SKILL.md` 并执行其中流程，例如 `plan` 对应 `skills/plan/SKILL.md`。不要依赖宿主 Agent 自动发现嵌套 Skill；即使宿主只加载了主 `vsp-marp`，全部能力也必须可用。

本 skill 随 `vsp-marp` 仓库发布，根目录为 `skills/vsp-marp/`。在完整 checkout 中先从 `SKILL_DIR` 定位仓库根目录，再使用根目录的渲染、主题、模板和 practice；只有 Skill 目录时使用 `references/` 快照和各子 Skill 说明的独立运行 fallback。

`vsp-marp:*` 和短别名 `vm:*` 是跨宿主的文本命名空间，可由用户在自然语言提示中使用。宿主提供 Skill 命令时，也可以直接调用其对应的 `vsp-marp-*` 子 Skill；仓库只维护一个 `vsp-marp` skill 根目录。

## 指令列表

| 主命令 | 简写 | 说明 |
|---|---|---|
| `vsp-marp:plan` | `vm:plan` | 规划标题、主题、结构、页数、资源和验证计划 |
| `vsp-marp:start` | `vm:start` | 从输入材料开始执行完整 PPT 生成流程 |
| `vsp-marp:resume` | `vm:resume` | 从已有计划、Markdown、HTML/PDF 或审计报告继续 |
| `vsp-marp:generate` | `vm:generate` | 只生成 Marp Markdown |
| `vsp-marp:render` | `vm:render` | 渲染 HTML/PDF 并处理主题 CSS 和 Marp CLI |
| `vsp-marp:audit` | `vm:audit` | 审计排版、越界、漏图、拉伸和内容密度 |
| `vsp-marp:theme` | `vm:theme` | 选择、解释或应用主题模板 |
| `vsp-marp:assets` | `vm:assets` | 检查图片、资源路径和缺失文件 |
| `vsp-marp:export` | `vm:export` | 整理最终 Markdown、HTML/PDF、截图和报告 |
| `vsp-marp:polish` | `vm:polish` | 根据审计报告或用户反馈回修 |

当用户输入任意 `vsp-marp:*` 或 `vm:*` 命令时，执行对应子 skill。无法识别的 `vsp-marp:*` / `vm:*` 命令应报告为未知命令。

## 子 Skill 路由

| 子 skill | 独立 Skill 名 | 触发意图 | 职责 |
|---|---|---|---|
| `plan` | `vsp-marp-plan` | 先规划、设计结构、确定参数、做方案 | 分析输入材料，给出主题、页数、章节、图片策略和执行计划 |
| `start` | `vsp-marp-start` | 开始、执行、做完整 PPT | 串联 plan/assets/generate/render/audit/polish/export 完整流程 |
| `resume` | `vsp-marp-resume` | 继续、恢复、接着上次、从失败处继续 | 识别已有产物和断点，选择下一个子 skill 继续 |
| `generate` | `vsp-marp-generate` | 只生成 Marp Markdown、不渲染 | 将输入材料重排为 `slides.md` |
| `render` | `vsp-marp-render` | 渲染 HTML/PDF、主题 CSS、Marp CLI | 将 Marp Markdown 渲染为 HTML/PDF |
| `audit` | `vsp-marp-audit` | 审计、检查排版、越界、漏图、拉伸 | 对 Markdown/HTML/PPT 产物评分并输出改进路线图 |
| `theme` | `vsp-marp-theme` | 选主题、对齐模板、主题配置 | 选择和应用 report/tutorial 主题与模板 |
| `assets` | `vsp-marp-assets` | 图片路径、资源收集、缺图、漏图 | 收集图片资源，修复路径，检查可访问性 |
| `export` | `vsp-marp-export` | 最终导出、归档、命名、交付 | 整理最终 HTML/PDF/Markdown 和报告 |
| `polish` | `vsp-marp-polish` | 根据反馈或审计报告回修 | 修改 Marp Markdown 并重新验证关键问题 |

当用户没有显式命名子 skill 时：

- 参数不完整或只想先讨论方案：加载 `plan`
- 用户说“开始/执行/生成完整 PPT”：加载 `start`
- 用户说“继续/恢复/resume”：加载 `resume`
- 用户要求只产出 Markdown：加载 `generate`
- 用户已有 `.md` 并要求渲染：加载 `render`
- 用户要求检查质量：加载 `audit`
- 用户提到主题、模板或样式：加载 `theme`
- 用户提到图片、资源、路径、漏图：加载 `assets`
- 用户要求最终交付或打包：加载 `export`
- 用户要求按反馈修改：加载 `polish`

## 简写路由

- `vm:plan` -> `vsp-marp:plan`
- `vm:start` -> `vsp-marp:start`
- `vm:resume` -> `vsp-marp:resume`
- `vm:generate` -> `vsp-marp:generate`
- `vm:render` -> `vsp-marp:render`
- `vm:audit` -> `vsp-marp:audit`
- `vm:theme` -> `vsp-marp:theme`
- `vm:assets` -> `vsp-marp:assets`
- `vm:export` -> `vsp-marp:export`
- `vm:polish` -> `vsp-marp:polish`

## 共享参考

所有子 skill 可以按需读取本目录下的共享参考：

- `references/templates/*.md`：可随 skill 分发的标准主题模板快照；仓库内工作优先使用根目录 `templates/`
- `references/themes/*.css`：可随 skill 分发的主题 CSS 快照；仓库内工作优先使用 `themes/` 源码和 `dist/themes/` 构建产物
- `references/practice/<example>/README.md`：精简的高质量实践样例；完整示例位于根目录 `practice/`

优先读取与当前任务直接相关的单个参考文件，避免一次性加载全部资料。
