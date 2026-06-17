# Donvis / 驴维斯 官网首页

基于 `Vite + Vue 3 + TypeScript` 实现的 Donvis 静态官网首页，采用 Pixel Sky Landing Page 风格。

## 本地运行

```bash
npm install
npm run dev
```

## 构建与预览

```bash
npm run build
npm run preview
```

构建产物会输出到 `dist/`，可直接部署到 GitHub Pages、Cloudflare Pages、Vercel、Netlify 或 Nginx 静态目录。

## 内容维护

- 站点信息和版本号：`src/data/site.ts`
- 下载链接：`src/data/downloads.ts`
- 功能、预览、隐私文案：`src/data/features.ts`
- FAQ：`src/data/faqs.ts`

## 静态资源

- 品牌图标：`src/assets/donkey-mascot.svg`
- 像素云：`src/assets/pixel-cloud.svg`
- 像素草地：`src/assets/pixel-ground.svg`
- 界面预览占位图：`public/screenshots/`

真实软件截图准备好后，可直接替换 `public/screenshots/` 下的 SVG 文件，并保持同名路径。
