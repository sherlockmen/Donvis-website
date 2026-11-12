# Donvis 官网部署

页面是纯静态站点，无后端、数据库或登录依赖。

## GitHub Pages

- 地址：https://sherlockmen.github.io/Donvis-website/
- 来源：`master` 分支的 `.github/workflows/pages.yml`
- Pages 设置：Build and deployment → Source → GitHub Actions
- 流程：Node.js 22 → `npm ci` → 围巾几何检查 → 类型检查和生产构建 → 静态资源检查 → 部署 `dist/`

推送 `master` 后自动发布，也可在 Actions 中手动运行 `Deploy GitHub Pages`。部署状态和最终 URL 在该次 workflow 的 `deploy` 任务中查看。

`vite.config.ts` 的 `base: './'` 让构建资源适配 `/Donvis-website/` 子路径。默认首页直接显示 Studio，无需查询参数。Actions 每次重新构建，仓库原有 `dist/` 不是发布来源。

## 本地验证

```bash
npm ci
node --experimental-strip-types src/experiments/studio/pose.check.mjs
npm run build
npm run check:static
npm run preview
```

其他静态托管服务也可直接使用构建后的 `dist/` 目录。
