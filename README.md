# VIBE FRONTIER

AI 造物社维护的免费前端实验档案。先看真实作品，再读机制、应用判断与证据。

线上地址：[VIBE FRONTIER](https://joeyhu1108-maker.github.io/vibe-frontier-daily/)

## 浏览结构

- `#discover`：作品库，支持关键词、用途、机制、收录日期与排序；卡片直接进入原作或拆解。
- `#journals/YYYY-MM-DD`：当期观察、作品集合、30 分钟实验与 Creative Twin 建议。
- `#events`：活动与黑客松的核验快照，报名状态以官方为准。
- `#work/作品ID`：动态预览、原作入口、实现原理、应用判断、证据与许可。

页面入口为 `index.html`、`vibe/frontier.css` 与 `vibe/frontier.js`。旧页面资源保留供追溯，不再由首页加载。直接运行静态 HTTP 服务即可预览，无构建步骤。

## 档案与短片

期刊使用 `vibe/issues.json`；历史候选、用途判断与封面来源分别读取 `site-candidates.json`、`case-context.json` 和 `cover-map.json`。历史期刊不因页面重做而改写。

`vibe/video-previews.json` 以作品 ID 关联真实短片、署名、来源与时长，文件位于 `vibe/previews/`。优先使用作者公开演示，或录制对应作品的真实交互；禁止把静态图平移、缩放或生成动画充作作品实录。每段应解码、抽帧确认，并记录采集边界。短片来源说明见 [预览目录](vibe/previews/README.md)。

视频按视口加载、静音循环，桌面最多同时三段，窄屏与详情最多一段；离开视口或后台标签页时暂停。减少动态或节省流量时默认显示封面，仍可主动播放。视频失败保留封面与原作入口。

## 追加期刊

```bash
node .github/scripts/append-vibe-issue.mjs vibe/issues.json /tmp/vibe-issue.json
node .github/scripts/validate-vibe-issues.mjs vibe/issues.json
node scripts/test-vibe-publishing.mjs
```

每期选 3–5 件证据完整的真实作品，保留作者、直接来源、真实来源时间、画面署名与证据边界。收录日期不冒充作品发布时间；技术推断与作者披露分别说明，应用价值不冒充已验证的商业结果。

新收录作品应同时补齐对应真实短片。源站不可访问或无法取得动态证据时明确记录缺口，不伪造视频。

只有许可与完整 revision 已核验的原作者仓库才提供学习 ZIP 入口，读者需主动勾选学习承诺。该承诺不改写原许可或第三方素材条款。网站免费阅读，不设置付费解锁。

GitHub Pages 在 `main` 更新后自动发布。部署成功与实际页面验证分别检查。
