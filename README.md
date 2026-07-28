# VIBE FRONTIER

每日前端作品策展与技术拆解的公开归档。

- 线上地址：https://joeyhu1108-maker.github.io/vibe-frontier-daily/
- 内容清单：`vibe/issues.json`
- 站点运行时优先读取内容清单；读取失败时使用构建内置的最近稳定版本。

## 每日内容更新

自动化只修改 `vibe/issues.json`，不改动页面代码或已有历史记录。

```bash
node .github/scripts/append-vibe-issue.mjs vibe/issues.json /tmp/vibe-issue.json
node .github/scripts/validate-vibe-issues.mjs vibe/issues.json
```

发布前必须满足：

- 每期 3–5 个可访问、可核验的真实案例
- 日期、期号、案例 URL 均唯一
- 每个案例包含输入、表现层、动效、工程、性能、迁移方法与证据边界
- 验证脚本通过后才允许提交到 `main`

GitHub Pages 会在 `main` 更新后自动发布。若研究或校验失败，保留上一版线上数据。
