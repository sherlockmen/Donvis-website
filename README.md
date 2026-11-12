# Donvis / 驴维斯 官网

围巾引导的三维滚动官网，使用 Vue 3、TypeScript、Three.js 与 Lenis。默认首页是已确认的 Studio 效果，旧的 `?study=studio` 链接也可继续使用。功能界面标注为示例数据。

在线访问：[GitHub Pages](https://sherlockmen.github.io/Donvis-website/)。

## 本地运行

使用 Node.js 22：

```bash
npm ci
npm run dev
```

## 检查与构建

```bash
node --experimental-strip-types src/experiments/studio/pose.check.mjs
npm run build
npm run check:static
npm run preview
```

`npm run build` 包含类型检查，输出到 `dist/`。几何检查覆盖围巾停姿、拖动回位、正反向滚动与不同宽高比；静态检查确认 Pages 子路径的资源可解析。

## 内容维护

- 页面、导航与无动态效果回退：`src/experiments/studio/StudioPreview.vue`
- 围巾几何与滚动镜头：`src/experiments/studio/pose.ts`、`scene.ts`、`chapters.ts`
- 功能展示：`StudioFeatures.vue`、`StudioFeatureDetails.vue`
- 品牌与下载地址：`src/data/site.ts`
- 第三方素材许可：`public/licenses/`

`master` 更新后由 GitHub Actions 构建并发布，详见 [部署说明](./DEPLOY.md)。仓库原有 `dist/` 文件不作为 Pages 发布来源。
