---
name: vsp-marp-audit
description: VSP-Marp 命名空间子技能。对单个 Marp Markdown/HTML/PPT 产物进行多角色多维度排版审计，输出评分报告和改进路线图。当用户提到 audit、审计 PPT、检查排版质量、audit slides、检查越界/拉伸/漏图时务必使用此 skill。
---

# VSP-Marp Audit（audit）

输入一个 Marp 格式的 `.md` 文件，多角色独立评审，输出结构化的评分报告和改进建议。

## 前置依赖

在仓库根目录安装依赖。需要执行截图和真实溢出检测时，还需安装 Playwright Chromium：

```bash
pnpm install
pnpm exec playwright install chromium
```

## 输入

一个 Marp Markdown 文件（含 frontmatter、`<!-- _class: ... -->` 指令、`---` 分页）。

## 审计角色（独立评审，互不干扰）

| 角色 | 职责 | 权重 | 方式 |
|------|------|------|------|
| 🔧 Layout Auditor | 排版合规：越界、拉伸、布局方向、图片尺寸驱动的 cols/rows 比例 | 40% | 硬规则 + Playwright C17 溢出检测 |
| 📋 Content Auditor | 内容完整：封面、目录、过渡、尾页、演讲人信息 | 25% | 硬规则 grep/metric |
| Visual Reviewer | 视觉质量：留白、字体、信息密度、图片可读性、图片尺寸是否匹配内容密度 | 20% | 当前 Agent 的多模态能力审阅 Playwright 截图 |
| Practice Reviewer | 标答相似度：class 分布、结构、页数对标 | 15% | 特征统计 + 独立 Agent 主观审阅 |

每个角色独立给出评分和意见，最后综合为最终报告。

## 严重度分级

| 级别 | 含义 | 示例 |
|------|------|------|
| **[Major]** | 阻断性问题，必须修 | 图片渲染失败(-50)、封面缺失(-25)、溢出(-15) |
| **[Minor]** | 影响质量，建议修 | 单目录(-10)、过渡页缺失(-5)、字体偏大 |
| **[Suggestion]** | 可选优化 | 换一种 cols 比例、同一种强调组件使用过多 |

## 输出：结构化审计报告

1. **Summary**（2-3 句整体评价）
2. **Strengths**（做得好的方面）
3. **Weaknesses**（标注 `[Major]` / `[Minor]`，每条必须引用具体页面）
4. **Score Breakdown**（4 维度分项得分 + 加权总分）
5. **Improvement Roadmap**（按优先级排序的修改建议 + 预估工作量）
6. **Decision**: Excellent / Good / Acceptable / Needs Revision / Reject
7. **Confidence**: X/5

```markdown
# Audit Report — <filename>

## Summary
整体排版质量良好，cols-first 策略执行到位，图片无拉伸。存在 2 个 Major 问题需修复。

## Score Breakdown
| 维度 | 得分 | 权重 | 加权 |
|------|------|------|------|
| Layout | 92 | 40% | 36.8 |
| Content | 95 | 25% | 23.8 |
| Visual | 85 | 20% | 17.0 |
| Practice | 80 | 15% | 12.0 |
| **Total** | | | **89.6** |

## Weaknesses
### Major
- [ ] **图片渲染失败** [第 5 页]：`img/fig_03.png` 路径不可访问 → 修正路径
### Minor
- [ ] **cols 比例建议** [第 12 页]：改用 cols-2-46 替代 cols-2-64，图占比更高
### Strengths
- ✓ 25/25 图片全覆盖，0 拉伸
- ✓ 双目录 + trans 过渡结构完整

## Improvement Roadmap
1. [Major] 修正 fig_03.png 路径 — 1min
2. [Minor] 第 12 页换 cols-2-46 — 2min

## Decision: Good
## Confidence: 4/5
```

## 一致性检查（始终执行）

- 视觉判断必须以渲染截图为准；Markdown/class 名只能作为辅助定位，不能替代截图证据
- 所有含图页面必须经过多模态截图审阅，判断图中信息密度、可读性、裁切、拉伸、遮挡和实际显示面积
- 图片尺寸必须参与排版判断：高信息密度图应给更大面积或拆页，低信息密度图可压缩；宽高比应决定 rows/cols/全宽图选择
- 硬规则检测 FAIL 的项目，Visual Reviewer 是否也观察到异常
- 各角色评分是否存在矛盾
- 未引用具体页面的意见标记为 `[Insufficient Evidence]`

## 执行流程

将主 `SKILL.md` 所在目录记为 `SKILL_DIR`，并按三步执行。完整仓库优先使用根目录 CLI；只有 Skill 目录时，先按 `render` 子 Skill 的独立模式生成 HTML。

```bash
# 1. 按 render 子 Skill 生成 HTML
node --import tsx scripts/render.ts <slides.md> -o /tmp/slides.html

# 2. 执行静态规则与结构审计
node --import tsx "$SKILL_DIR/skills/audit/scripts/audit.ts" \
  <slides.md> --html /tmp/slides.html \
  --practice-ref "$SKILL_DIR/references/practice" \
  -o <report.md>

# 3. 逐页截图并生成视觉/内容审阅提示
node --import tsx "$SKILL_DIR/skills/audit/scripts/screenshot-and-review.ts" \
  /tmp/slides.html -o /tmp/vsp-marp-review
```

`audit.ts` 可选 `--severity`：`standard`（默认）/ `harsh`（扣分加倍）/ `gentle`（仅 Major）。不提供 `--html` 时只执行 Markdown 静态检查，页数和真实渲染结果不应作为有效证据。

流程细节：

1. **渲染 HTML**：遵循 `render` 子 Skill。图片路径错误时按 `.md` 所在目录、`./img/`、`../img/` 和源文档目录定位，修复后重试；仍失败则标记 Major。
2. **硬规则扫描**：对 `.md` 源码和 `--html` 产物执行结构与 metric 检测。
3. **Playwright 截图**：对 HTML 逐页截图 1280x720，检查溢出、图片 404、重叠和拉伸。后续视觉审计必须看截图，而不是只看 Markdown。
4. **Agent 多模态审阅**：将截图交给当前宿主的多模态能力或子 Agent，逐页评估视觉和标答相似度。此步骤不依赖某个宿主专有的 `subagent` API。
5. **汇总审计报告**：合并静态报告与视觉审阅结论，所有问题引用具体页面和证据。

## 关键模块（随 skill 打包）

- `scripts/lib/audit-rules.ts` — 硬规则 + C17 Playwright 溢出
- `scripts/lib/audit-engine.ts` — 加权评分引擎
- `scripts/lib/practice-compare.ts` — 标答特征比对
- `scripts/lib/screenshot.ts` — Playwright 逐页截图
- `scripts/lib/visual-review.ts` / `scripts/lib/content-review.ts` — Agent 审阅 prompt
- `scripts/audit.ts` — CLI 入口
