---
name: vsp-marp-theme
description: VSP-Marp 主题子技能。用于选择、解释、套用或调整 report/report-red/report-nailong/tutorial-red/tutorial-red-shtu/tutorial-purple/tutorial-nailong 主题和模板。触发条件：用户问主题、模板、样式、配色、版式、theme。
---

# VSP-Marp Theme

负责主题和模板选择，不直接生成完整 PPT。

## 主题选择

- `report-red`：论文汇报、项目展示、阶段报告的默认推荐报告主题
- `report`：中性报告主题，适合保守汇报和旧稿迁移
- `report-nailong`：轻量、活泼的报告主题
- `tutorial-red`：教学、习题课
- `tutorial-red-shtu`：上科大教学
- `tutorial-purple`：教学或习题课，紫色风格
- `tutorial-nailong`：轻量、活泼、组会或趣味展示

## 流程

1. 根据受众、场景、内容密度推荐主题。
2. 读取主 Skill 目录下的 `references/templates/<theme>.md`；完整仓库中优先使用根目录 `templates/<theme>.md`。
3. 需要渲染时，完整仓库使用统一 `scripts/render.ts`，独立 Skill 使用 `references/themes/<theme>.css`；VS Code 预览可使用 `https://heaticy-1310163554.cos.ap-shanghai.myqcloud.com/vsp-marp/themes/<theme>.css`。
4. 输出该主题的封面、目录、正文、过渡、尾页 class 使用建议。
5. 若用户要应用主题，交给 `generate` 或 `render`。
