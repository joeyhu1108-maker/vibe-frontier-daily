# VIBE FRONTIER

前端审美拆解库的公开试读站。

- 线上地址：https://joeyhu1108-maker.github.io/vibe-frontier-daily/
- 公开内容清单：`vibe/issues.json`
- 当前公开 3 个完整案例；第一季完整内容不存放在这个公开仓库。
- 站点运行时优先读取公开试读清单；读取失败时使用构建内置的历史稳定版本。

## 公开试读更新

公开站只保留经过选择的试读案例，不再接收每日全量内容自动发布。

```bash
node .github/scripts/append-vibe-issue.mjs vibe/issues.json /tmp/vibe-issue.json
node .github/scripts/validate-vibe-issues.mjs vibe/issues.json
```

试读案例必须满足：

- 共 3 个可访问、可核验的真实案例
- 日期、期号、案例 URL 均唯一
- 每个案例包含输入、表现层、动效、工程、性能、迁移方法与证据边界
- 验证脚本通过后才允许提交到 `main`

GitHub Pages 会在 `main` 更新后自动发布。完整第一季使用独立私有内容源与访问控制。
