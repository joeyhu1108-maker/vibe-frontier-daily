# VIBE FRONTIER

ART WITH AI 与 AI造物社发起的 Vibe Coding 前端视觉教学站。

- 线上地址：https://joeyhu1108-maker.github.io/vibe-frontier-daily/
- 学习内容：组件、设计系统、界面动效、Vibe Coding 工作流
- 官方资源地图：组件系统、视觉构建、动效与 3D、灵感机制
- Prompt 库：6 份原创教学模板 + 2 份用户提供的 MotionSites 免费样例
- 案例实验室：读取 `vibe/issues.json` 中的 3 个证据完整案例
- 当前发布内容均可完整阅读，不设置付费解锁。

## 案例实验室更新

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
