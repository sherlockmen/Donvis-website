# Donvis 官网部署说明

本项目是纯静态页面，无后端、数据库、登录或业务接口依赖。

## 构建命令

```bash
npm install
npm run build
```

发布目录：

```text
dist
```

## GitHub Pages

如果部署到独立域名或仓库根路径，当前 `vite.config.ts` 的 `base: './'` 可直接使用。

如果部署到固定子路径并需要绝对资源路径，可按需改为：

```ts
export default defineConfig({
  base: '/Donvis/',
})
```

## Cloudflare Pages

```text
Build command: npm run build
Output directory: dist
```

## Vercel

```text
Framework: Vite
Build command: npm run build
Output directory: dist
```

## Nginx

将 `dist/` 内文件复制到静态目录。

```nginx
server {
  listen 80;
  server_name donvis.example.com;

  root /var/www/donvis;
  index index.html;

  location / {
    try_files $uri $uri/ /index.html;
  }
}
```
