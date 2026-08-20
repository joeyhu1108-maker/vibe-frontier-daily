# VIBE FRONTIER

ART WITH AI 与 AI造物社的前端审美拆解公开分享站。

- 线上地址：https://joeyhu1108-maker.github.io/vibe-frontier-daily/
- 公开内容清单：`vibe/issues.json`
- 当前发布内容均可完整阅读，不设置付费解锁。
- 站点运行时优先读取公开内容清单；读取失败时使用构建内置的历史稳定版本。

## 公开内容更新

公开站只发布经过选择、能够核验的真实案例，宁缺毋滥。

```bash
node .github/scripts/append-vibe-issue.mjs vibe/issues.json /tmp/vibe-issue.json
node .github/scripts/validate-vibe-issues.mjs vibe/issues.json
```

公开案例必须满足：

- 共 3 个可访问、可核验的真实案例
- 日期、期号、案例 URL 均唯一
- 每个案例包含输入、表现层、动效、工程、性能、迁移方法与证据边界
- 验证脚本通过后才允许提交到 `main`

GitHub Pages 会在 `main` 更新后自动发布。公开内容用于研究、评论与方法分享，不重新分发第三方源码、素材或商业授权。
