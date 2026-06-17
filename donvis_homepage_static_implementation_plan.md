# Donvis / 驴维斯 官网首页静态页面实现文档

> 适用目标：基于「方案一：Pixel Sky Landing Page」实现 Donvis 官网首页。  
> 页面类型：纯静态官网首页。  
> 交互方式：前端本地交互，不依赖后端服务。  
> 交付对象：可直接交给 Codex / Claude Code / 前端开发执行。  

---

## 1. 项目目标

为 Donvis / 驴维斯 制作一个完整的软件官网首页，用于介绍产品能力、展示软件界面、提供下载入口、跳转 GitHub 仓库、说明隐私安全策略，并沉淀常见问题。

页面需要保留参考图中的整体风格：

- 浅蓝天空背景
- 像素风云朵
- 复古游戏感视觉元素
- 橙色强调色
- 圆角卡片布局
- 像素草地 / 土地页脚
- Donvis 驴子 Icon 元素贯穿全站

同时页面必须完整说明 Donvis 的软件特性：

- 本地菜单栏额度监控
- 支持 Codex 与 Claude Code
- 自动识别当前活跃客户端
- 展示 5 小时窗口与 7 天窗口额度
- 展示剩余百分比、剩余时间、重置时间
- 支持共享账号额度合并
- Codex 与 Claude 分组展示
- 多客户端菜单栏标题轮播
- Claude 手动真实刷新
- 隐私优先，本地读取，不上传数据
- Dock 备用入口
- 多屏一致体验
- macOS Apple Silicon / Intel 下载入口
- Windows 版本预告
- FAQ 常见问题

---

## 2. 页面定位

Donvis 官网首页不是复杂后台系统，而是一个面向用户的软件产品 Landing Page。

页面核心目标按优先级排序如下：

1. 让用户 5 秒内知道 Donvis 是干什么的。
2. 让 Codex / Claude Code 用户感知痛点：不用再打开网页、不用手动敲命令、不用猜额度。
3. 让用户相信 Donvis 是安全的：本地读取、不上传、不读取代码内容。
4. 让用户能快速下载对应版本。
5. 让开发者能进入 GitHub 查看源码、Issue、Release。
6. 让页面风格有记忆点，形成“驴维斯”品牌感。

---

## 3. 技术边界

### 3.1 静态资源要求

本页面全部为静态资源，不需要服务端接口，不需要数据库，不需要用户登录，不需要动态请求业务数据。

允许使用：

- HTML
- CSS
- JavaScript / TypeScript
- 静态图片
- SVG
- GIF
- 本地 JSON 配置
- 静态下载链接
- GitHub 外链
- GitHub Release 外链
- 邮箱 / Issue 外链

不允许引入：

- 后端 API
- 用户登录系统
- 数据库
- 服务端渲染依赖
- 需要私钥或 Token 的接口
- 运行时必须依赖远程服务的数据逻辑

### 3.2 推荐技术栈

优先推荐：

```bash
Vite + Vue 3 + TypeScript
```

原因：

- 项目轻量
- 构建快
- 静态部署简单
- 适合后续继续扩展页面
- 可直接部署到 GitHub Pages、Cloudflare Pages、Vercel、Netlify、OSS 静态站点

也可以使用：

```bash
Vite + React + TypeScript
```

但如果没有特殊要求，优先使用 Vue 3。

---

## 4. 推荐目录结构

```text
donvis-homepage/
├── public/
│   ├── favicon.ico
│   ├── donvis-icon.png
│   ├── screenshots/
│   │   ├── toolbar.png
│   │   ├── popover.png
│   │   ├── settings.png
│   │   └── dock.png
│   └── downloads/
│       └── placeholder.txt
├── src/
│   ├── assets/
│   │   ├── pixel-cloud.svg
│   │   ├── pixel-ground.svg
│   │   ├── donkey-mascot.svg
│   │   └── icons/
│   │       ├── codex.svg
│   │       ├── claude.svg
│   │       ├── terminal.svg
│   │       ├── vscode.svg
│   │       ├── lock.svg
│   │       ├── refresh.svg
│   │       ├── clock.svg
│   │       └── download.svg
│   ├── components/
│   │   ├── AppHeader.vue
│   │   ├── HeroSection.vue
│   │   ├── PainPointSection.vue
│   │   ├── FeatureGrid.vue
│   │   ├── PreviewSection.vue
│   │   ├── PrivacySection.vue
│   │   ├── DownloadSection.vue
│   │   ├── FaqSection.vue
│   │   ├── FinalCta.vue
│   │   └── AppFooter.vue
│   ├── data/
│   │   ├── features.ts
│   │   ├── faqs.ts
│   │   └── downloads.ts
│   ├── styles/
│   │   ├── variables.css
│   │   ├── reset.css
│   │   └── global.css
│   ├── App.vue
│   └── main.ts
├── index.html
├── package.json
├── vite.config.ts
├── tsconfig.json
└── README.md
```

---

## 5. 首页信息架构

首页采用单页长滚动结构。

页面顺序如下：

```text
1. 顶部导航 Header
2. Hero 首屏
3. 痛点对比：为什么选择 Donvis
4. 核心功能 Feature Grid
5. 界面预览 Preview
6. 隐私优先 Privacy
7. 下载 Donvis Download
8. 常见问题 FAQ
9. 最终转化 CTA
10. Footer
```

---

## 6. 视觉规范

### 6.1 整体风格

关键词：

- 像素风
- 天空感
- 清爽
- 可爱但不幼稚
- 软件产品官网
- 复古游戏化
- 有技术可信度

### 6.2 色彩规范

```css
:root {
  --color-bg: #eaf6ff;
  --color-bg-deep: #d8ecfb;
  --color-card: #ffffff;
  --color-card-soft: rgba(255, 255, 255, 0.82);
  --color-text: #1d2636;
  --color-text-muted: #5e6b7e;
  --color-primary: #ff6b35;
  --color-primary-hover: #f45621;
  --color-border: #c8d9e8;
  --color-blue: #2f80ed;
  --color-orange: #ff6b35;
  --color-green: #28b463;
  --color-ground: #7a3f00;
  --color-grass: #43b047;
}
```

### 6.3 字体建议

中文：

```css
font-family:
  "Inter",
  "PingFang SC",
  "Microsoft YaHei",
  "Helvetica Neue",
  Arial,
  sans-serif;
```

像素标题可使用：

- CSS 字重 + letter-spacing 模拟
- 或引入免费像素字体作为标题字体

注意：

- 正文不要全部使用像素字体，避免可读性差。
- 像素字体只用于大标题、装饰数字、局部强调。

### 6.4 圆角与阴影

```css
--radius-sm: 8px;
--radius-md: 14px;
--radius-lg: 22px;
--shadow-card: 0 12px 30px rgba(40, 70, 100, 0.12);
--shadow-soft: 0 8px 18px rgba(40, 70, 100, 0.08);
```

### 6.5 页面宽度

```css
--container-width: 1120px;
```

桌面端居中，移动端左右留白 20px。

---

## 7. 页面内容设计

## 7.1 Header 顶部导航

### 目标

让用户快速识别品牌，并能跳转核心区块。

### 内容

左侧：

```text
Donvis / 驴维斯
本地菜单栏额度监控器
```

导航：

```text
功能
截图
下载
FAQ
GitHub
```

右侧主按钮：

```text
在 GitHub 上 Star
```

### 行为

- 点击“功能”滚动到核心功能区域
- 点击“截图”滚动到界面预览区域
- 点击“下载”滚动到下载区域
- 点击“FAQ”滚动到常见问题区域
- 点击“GitHub”打开 GitHub 仓库
- 点击“Star”打开 GitHub 仓库

### 静态实现

使用锚点即可：

```html
<a href="#features">功能</a>
<a href="#previews">截图</a>
<a href="#download">下载</a>
<a href="#faq">FAQ</a>
<a href="https://github.com/sherlockmen/Donvis" target="_blank">GitHub</a>
```

---

## 7.2 Hero 首屏

### 目标

首屏要让用户立刻明白 Donvis 的价值。

### 推荐标题

```text
一眼看清
Codex 与 Claude Code
的账号额度
```

### 推荐副标题

```text
Donvis 是一款本地菜单栏额度监控工具，实时展示 Codex 与 Claude Code 的剩余额度、重置时间与使用进度，让你不用打开网页，也不用手动敲命令。
```

### CTA

主按钮：

```text
下载 macOS 版
```

副按钮：

```text
查看 GitHub
```

### 首屏标签

```text
本地运行
自动检测客户端
5 小时 & 7 天窗口
隐私优先
```

### 右侧 Mockup

右侧展示一个模拟 Donvis 弹窗：

```text
Donvis

Codex
在线
5 小时窗口 72% 还剩 2h 18m
7 天窗口 48% 还剩 3d 6h

Claude Code
在线
5 小时窗口 61% 还剩 1h 42m
7 天窗口 33% 还剩 4d 12h

最后更新时间：16:20:30
```

### 设计要求

- 背景放置像素云
- 右侧加入 Donvis 驴子 Icon
- Hero 底部可以出现一块像素草地
- 主标题中 “Codex 与 Claude Code” 使用橙色强调
- Mockup 不需要真实数据，全部写死即可

---

## 7.3 痛点对比：为什么选择 Donvis

### 目标

突出用户痛点，让用户知道为什么需要这个工具。

### 标题

```text
为什么选择 Donvis？
```

### 卡片 1

```text
告别网页查询
无需反复打开网页后台，菜单栏一点即看。
```

### 卡片 2

```text
告别手动命令
不用再敲命令查看状态，额度变化自动呈现。
```

### 卡片 3

```text
告别错过重置
清晰展示重置时间，合理安排使用节奏。
```

### 卡片 4

```text
更专注编码
少切换、少打断，把注意力留给创造。
```

---

## 7.4 核心功能 Feature Grid

### 标题

```text
核心功能
```

### 功能 1：智能客户端检测

```text
自动发现并识别当前活跃客户端，无需复杂配置。
```

支持展示：

```text
Codex Desktop
Codex CLI
Codex VSCode
Claude Desktop
Claude Code CLI
```

### 功能 2：5 小时 & 7 天窗口

```text
同时展示短周期与周周期额度，包含百分比、剩余时间和重置时间。
```

### 功能 3：共享账号合并

```text
同一账号在多个客户端登录时，自动标记共享额度，避免重复计算。
```

### 功能 4：分组展示

```text
Codex 系与 Claude 系分组排列，信息清晰，不互相干扰。
```

### 功能 5：多客户端标题轮播

```text
多个客户端同时在线时，菜单栏标题自动轮播显示每个客户端状态。
```

### 功能 6：Claude 真实刷新

```text
点击立即刷新后，真实请求 Claude Code 账号用量，并保留上次有效数据。
```

### 功能 7：隐私优先

```text
只读取展示额度所需的最小信息，不读取代码、Prompt、模型响应或文件内容。
```

### 功能 8：Dock 备用入口

```text
菜单栏空间不足时，可通过 Dock 打开同款状态窗口。
```

### 功能 9：多屏一致体验

```text
在主屏、副屏、多显示器环境下，弹窗展示保持一致。
```

---

## 7.5 界面预览 Preview

### 标题

```text
界面预览
```

### 预览卡片 1：菜单栏轮播

```text
多客户端标题自动轮播，额度状态随时可见。
```

### 预览卡片 2：弹出面板总览

```text
额度进度、剩余时间、重置时间，一屏看全。
```

### 预览卡片 3：设置

```text
自定义刷新间隔、显示模式、开机自启与额度预警。
```

### 预览卡片 4：Dock 窗口

```text
菜单栏被系统挤掉时，也能从 Dock 快速打开。
```

### 图片资源

如果已有软件截图，优先使用真实截图。

建议图片尺寸：

```text
toolbar.png   800 x 260
popover.png   800 x 620
settings.png  800 x 620
dock.png      800 x 620
```

如果暂时没有截图，可以先使用静态 Mockup 占位。

---

## 7.6 隐私优先 Privacy

### 标题

```text
隐私优先，安全放心
```

### 副标题

```text
Donvis 以本地优先为设计原则，只展示额度相关信息，不碰你的代码和对话。
```

### 卡片 1：本地读取

```text
仅从本地配置与官方客户端读取必要信息。
```

### 卡片 2：绝不上传

```text
不会将额度、账号或本地配置上传到任何服务器。
```

### 卡片 3：不读取代码内容

```text
不处理、不访问、更不会收集你的代码、Prompt、模型响应或文件内容。
```

### 卡片 4：开源透明

```text
代码公开，接受社区监督。
```

---

## 7.7 下载 Donvis Download

### 标题

```text
下载 Donvis
```

### 副标题

```text
请选择与你的 Mac 芯片一致的安装包，两个版本功能完全相同。
```

### 下载卡片 1：Apple Silicon

```text
macOS Apple Silicon
适用于 M1 / M2 / M3 / M4
推荐
下载 .dmg
```

链接：

```text
https://github.com/sherlockmen/Donvis/releases
```

### 下载卡片 2：Intel Mac

```text
macOS Intel
适用于 Intel 处理器
下载 .dmg
```

链接：

```text
https://github.com/sherlockmen/Donvis/releases
```

### 下载卡片 3：Windows

```text
Windows
即将推出
敬请期待
```

暂不放下载链接。

### 系统要求

```text
macOS 13 Ventura 或更高版本
Apple Silicon 或 Intel Mac
使用 Codex：需安装 Codex Desktop、Codex CLI 或官方 VSCode 扩展
使用 Claude Code：需安装 Claude Desktop 或 Claude Code CLI 并完成登录
```

---

## 7.8 FAQ 常见问题

### 标题

```text
常见问题（FAQ）
```

### FAQ 1

```text
Q：Donvis 支持哪些客户端？
A：支持 Codex Desktop、Codex CLI、Codex VSCode 扩展、Claude Desktop 和 Claude Code CLI。
```

### FAQ 2

```text
Q：需要登录或授权吗？
A：Donvis 本身不提供账号登录系统，只读取本地官方客户端或命令行工具已有的状态信息。
```

### FAQ 3

```text
Q：额度数据从哪里来？
A：Donvis 从本地客户端和官方工具链可用的数据源中读取额度相关信息，并只在本机展示。
```

### FAQ 4

```text
Q：Claude 的数据多久更新一次？
A：Claude Code 支持手动真实刷新。服务端暂未返回新额度时，会保留上次有效数据并明确提示。
```

### FAQ 5

```text
Q：会影响系统性能吗？
A：Donvis 是轻量级菜单栏工具，仅做必要状态读取和展示，对系统资源占用较低。
```

### FAQ 6

```text
Q：数据会上传吗？
A：不会。Donvis 不上传额度、账号、本地配置、代码、Prompt、模型响应或文件内容。
```

### FAQ 7

```text
Q：是否开源？
A：是，Donvis 使用 MIT License 开源，可在 GitHub 查看源码并参与贡献。
```

---

## 7.9 最终 CTA

### 标题

```text
让额度监控变得简单有趣！
```

### 副标题

```text
立即下载 Donvis，专注你的创造力，别再为额度操心。
```

### 按钮

```text
下载 macOS 版
查看 GitHub
```

---

## 7.10 Footer

### 左侧品牌

```text
Donvis / 驴维斯
本地菜单栏额度监控器
```

### 链接

```text
功能
截图
下载
FAQ
GitHub
```

### 资源

```text
使用文档
更新日志
开源许可 MIT
```

### 系统要求

```text
macOS 13.0 或更高版本
Intel 或 Apple Silicon
64 位处理器
```

### 版本信息

```text
Donvis v1.7.0
License: MIT
```

版本号需要从 GitHub Release 或 README 中确认，不能写死在代码深处，建议放到配置文件中统一维护。

---

## 8. 静态数据配置

建议将页面可变内容集中到 `src/data` 目录，方便后续维护。

### 8.1 downloads.ts

```ts
export const downloads = [
  {
    id: 'apple-silicon',
    title: 'macOS Apple Silicon',
    subtitle: '适用于 M1 / M2 / M3 / M4',
    tag: '推荐',
    buttonText: '下载 .dmg',
    url: 'https://github.com/sherlockmen/Donvis/releases',
  },
  {
    id: 'intel',
    title: 'macOS Intel',
    subtitle: '适用于 Intel 处理器',
    tag: '',
    buttonText: '下载 .dmg',
    url: 'https://github.com/sherlockmen/Donvis/releases',
  },
  {
    id: 'windows',
    title: 'Windows',
    subtitle: '即将推出',
    tag: '',
    buttonText: '敬请期待',
    url: '',
    disabled: true,
  },
]
```

### 8.2 features.ts

```ts
export const features = [
  {
    title: '智能客户端检测',
    description: '自动发现并识别当前活跃客户端，无需复杂配置。',
    icon: 'search',
  },
  {
    title: '5 小时 & 7 天窗口',
    description: '同时展示短周期与周周期额度，包含百分比、剩余时间和重置时间。',
    icon: 'hourglass',
  },
  {
    title: '共享账号合并',
    description: '同一账号在多个客户端登录时，自动标记共享额度，避免重复计算。',
    icon: 'users',
  },
  {
    title: '分组展示',
    description: 'Codex 系与 Claude 系分组排列，信息清晰，不互相干扰。',
    icon: 'group',
  },
  {
    title: '多客户端标题轮播',
    description: '多个客户端同时在线时，菜单栏标题自动轮播显示每个客户端状态。',
    icon: 'carousel',
  },
  {
    title: 'Claude 真实刷新',
    description: '点击立即刷新后，真实请求 Claude Code 账号用量，并保留上次有效数据。',
    icon: 'refresh',
  },
  {
    title: '隐私优先',
    description: '只读取展示额度所需的最小信息，不读取代码、Prompt、模型响应或文件内容。',
    icon: 'lock',
  },
  {
    title: 'Dock 备用入口',
    description: '菜单栏空间不足时，可通过 Dock 打开同款状态窗口。',
    icon: 'dock',
  },
  {
    title: '多屏一致体验',
    description: '在主屏、副屏、多显示器环境下，弹窗展示保持一致。',
    icon: 'monitor',
  },
]
```

### 8.3 faqs.ts

```ts
export const faqs = [
  {
    question: 'Donvis 支持哪些客户端？',
    answer: '支持 Codex Desktop、Codex CLI、Codex VSCode 扩展、Claude Desktop 和 Claude Code CLI。',
  },
  {
    question: '需要登录或授权吗？',
    answer: 'Donvis 本身不提供账号登录系统，只读取本地官方客户端或命令行工具已有的状态信息。',
  },
  {
    question: '额度数据从哪里来？',
    answer: 'Donvis 从本地客户端和官方工具链可用的数据源中读取额度相关信息，并只在本机展示。',
  },
  {
    question: 'Claude 的数据多久更新一次？',
    answer: 'Claude Code 支持手动真实刷新。服务端暂未返回新额度时，会保留上次有效数据并明确提示。',
  },
  {
    question: '会影响系统性能吗？',
    answer: 'Donvis 是轻量级菜单栏工具，仅做必要状态读取和展示，对系统资源占用较低。',
  },
  {
    question: '数据会上传吗？',
    answer: '不会。Donvis 不上传额度、账号、本地配置、代码、Prompt、模型响应或文件内容。',
  },
  {
    question: '是否开源？',
    answer: '是，Donvis 使用 MIT License 开源，可在 GitHub 查看源码并参与贡献。',
  },
]
```

---

## 9. 交互要求

虽然页面是静态页面，但仍需要有基础前端交互。

### 9.1 导航滚动

点击导航项平滑滚动到对应区块。

```css
html {
  scroll-behavior: smooth;
}
```

### 9.2 FAQ 展开收起

FAQ 使用前端状态控制展开收起，不请求接口。

要求：

- 默认全部收起
- 点击问题展开
- 再次点击收起
- 支持键盘 Tab 聚焦
- 展开状态需要有过渡动画

### 9.3 下载按钮

下载按钮跳转 GitHub Release。

要求：

- Apple Silicon / Intel 按钮可以先统一跳转到 Release 页面
- 后续如果有稳定 DMG 直链，再替换为具体链接
- Windows 按钮禁用，显示“即将推出”

### 9.4 GitHub 按钮

打开新窗口：

```text
https://github.com/sherlockmen/Donvis
```

### 9.5 卡片 Hover

所有功能卡片增加轻微 hover：

- 向上移动 2px
- 阴影增强
- 边框变浅橙色

### 9.6 首屏 Mockup 动效

首屏右侧 Mockup 可以做轻微浮动动画：

- 上下浮动 6px
- 动画周期 4s
- 不要过度夸张

### 9.7 云朵动效

背景云朵可以缓慢平移：

- 速度极慢
- 不影响阅读
- 移动端可关闭动画

---

## 10. 响应式要求

### 10.1 桌面端

宽度：

```text
>= 1200px
```

要求：

- Header 横向布局
- Hero 左文案右 Mockup
- Feature Grid 三列
- Preview 四列
- Download 三列

### 10.2 平板端

宽度：

```text
768px - 1199px
```

要求：

- Hero 改为上下布局
- Feature Grid 两列
- Preview 两列
- Download 两列

### 10.3 移动端

宽度：

```text
< 768px
```

要求：

- Header 导航折叠，保留 Logo 和下载按钮
- Hero 单列
- 主标题字号缩小
- Feature Grid 单列
- Preview 单列
- Download 单列
- Footer 单列
- 像素装饰减少，避免遮挡内容

---

## 11. 性能要求

因为是静态页面，性能必须轻量。

### 11.1 构建产物

目标：

```text
dist 总体积尽量控制在 2MB 以内，不含真实截图时应更小。
```

### 11.2 图片优化

要求：

- PNG 图片压缩
- 大图优先 WebP
- SVG 用于简单图标
- 非首屏图片 lazy load
- 不使用过大的 GIF
- 如果需要动画，优先 CSS 动画

### 11.3 字体

如果引入字体：

- 只引入必要字重
- 避免整包字体过大
- 优先系统字体

---

## 12. SEO 与静态页面基础配置

### 12.1 Title

```text
Donvis / 驴维斯 - Codex 与 Claude Code 本地菜单栏额度监控工具
```

### 12.2 Description

```text
Donvis 是一款面向 Codex 与 Claude Code 用户的本地菜单栏额度监控工具，支持 5 小时与 7 天额度窗口、自动客户端识别、共享账号合并、隐私优先和 GitHub 开源。
```

### 12.3 Keywords

```text
Donvis, 驴维斯, Codex, Claude Code, 额度监控, 菜单栏工具, macOS, AI Coding
```

### 12.4 Open Graph

```html
<meta property="og:title" content="Donvis / 驴维斯" />
<meta property="og:description" content="一眼看清 Codex 与 Claude Code 的账号额度。" />
<meta property="og:type" content="website" />
<meta property="og:image" content="/og-image.png" />
```

---

## 13. 可访问性要求

基础要求：

- 按钮必须有明确文本
- 图片必须设置 alt
- FAQ 按钮可键盘操作
- 颜色对比度足够
- 不使用纯颜色表达状态，需要配合文字
- 链接 hover / focus 状态明显

---

## 14. 开发计划

## 阶段一：项目初始化

### 目标

创建静态官网项目，完成基础工程配置。

### 任务

1. 创建 Vite + Vue 3 + TypeScript 项目
2. 配置 ESLint / Prettier
3. 创建基础目录结构
4. 添加全局样式与变量
5. 添加基础 SEO meta
6. 接入 Donvis icon
7. 完成页面路由或单页 App 结构

### 验收标准

- 本地 `npm install` 成功
- 本地 `npm run dev` 成功
- 页面可以在浏览器打开
- 项目无 TypeScript 报错
- 项目无明显 ESLint 报错

---

## 阶段二：视觉框架搭建

### 目标

搭建符合方案一的像素天空风格页面骨架。

### 任务

1. 实现浅蓝天空背景
2. 添加像素云装饰
3. 添加像素草地页脚
4. 实现统一容器宽度
5. 实现统一卡片样式
6. 实现橙色主按钮与白色次按钮
7. 实现响应式布局基础断点

### 验收标准

- 页面视觉接近方案一
- 背景、卡片、按钮风格统一
- 桌面端无明显布局错位
- 移动端内容不溢出

---

## 阶段三：首页核心区块开发

### 目标

完成首页所有主要区块。

### 任务

1. Header
2. Hero
3. 为什么选择 Donvis
4. 核心功能
5. 界面预览
6. 隐私优先
7. 下载区
8. FAQ
9. Final CTA
10. Footer

### 验收标准

- 所有区块完整出现
- 文案完整
- 下载入口可点击
- GitHub 外链可点击
- FAQ 可展开收起
- 页面滚动顺畅

---

## 阶段四：动效与交互优化

### 目标

增强页面质感，但不影响性能。

### 任务

1. Header 锚点平滑滚动
2. Hero Mockup 轻微浮动
3. 云朵缓慢移动
4. 卡片 Hover 效果
5. FAQ 展开动画
6. 下载按钮禁用状态
7. 移动端减少装饰元素

### 验收标准

- 动效自然，不抢内容注意力
- 移动端不卡顿
- FAQ 交互正常
- Hover 不导致布局抖动

---

## 阶段五：静态构建与部署准备

### 目标

生成可部署的静态文件。

### 任务

1. 执行生产构建
2. 检查 dist 文件
3. 配置相对路径或 base
4. 增加 README 部署说明
5. 准备 GitHub Pages / Cloudflare Pages / Vercel 部署配置

### 验收标准

- `npm run build` 成功
- `npm run preview` 成功
- dist 可直接作为静态资源部署
- 无后端依赖
- 断网后除外链外，页面主体仍可正常展示

---

## 15. 更新计划

后续迭代按版本推进。

## v0.1 首页首版

目标：

- 完成完整静态首页
- 提供下载入口
- 具备基础响应式
- 风格贴近方案一

范围：

- Header
- Hero
- Feature
- Preview
- Privacy
- Download
- FAQ
- Footer

不包含：

- 多语言
- 深色模式
- 真实下载统计
- 在线更新接口
- 用户行为埋点

## v0.2 真实资源替换

目标：

- 替换真实软件截图
- 替换真实 DMG 下载链接
- 增加真实版本号
- 增加 Release Notes 链接

范围：

- 替换 toolbar / popover / settings / dock 图片
- 下载卡片链接指向具体 Release 文件
- Footer 版本信息从配置统一读取

## v0.3 体验增强

目标：

- 完善动效
- 提升移动端体验
- 优化 SEO 与分享卡片

范围：

- OG Image
- 移动端导航
- 更细致的 FAQ 动画
- 图片 lazy loading
- Lighthouse 优化

## v0.4 文档与生态入口

目标：

- 增加文档入口与安装说明
- 增加贡献说明
- 增加路线图

范围：

- 安装说明页面
- 隐私说明页面
- 更新日志页面
- GitHub Issue 模板链接

---

## 16. 执行步骤

下面步骤可直接交给开发工具执行。

### 16.1 初始化项目

```bash
npm create vite@latest donvis-homepage -- --template vue-ts
cd donvis-homepage
npm install
```

### 16.2 安装基础依赖

```bash
npm install
npm install -D prettier eslint
```

如使用 Vue 官方 ESLint：

```bash
npm install -D eslint-plugin-vue vue-tsc
```

### 16.3 创建目录

```bash
mkdir -p src/components
mkdir -p src/data
mkdir -p src/styles
mkdir -p src/assets/icons
mkdir -p public/screenshots
```

### 16.4 启动开发

```bash
npm run dev
```

### 16.5 构建

```bash
npm run build
```

### 16.6 本地预览构建产物

```bash
npm run preview
```

---

## 17. Subagent 执行方案

为了提高执行效率，建议拆分为多个 subagent 并行完成。

## 17.1 Subagent A：产品文案与信息架构

### 角色

产品官网信息架构设计师。

### 输入

- 本文档
- Donvis README
- 方案一设计图
- Donvis icon

### 任务

1. 校对首页所有文案
2. 确保产品能力表达准确
3. 避免夸大宣传
4. 统一中文表达风格
5. 输出最终页面文案到 `src/data`

### 产出

```text
src/data/features.ts
src/data/faqs.ts
src/data/downloads.ts
src/data/site.ts
```

### 验收

- 文案没有明显错别字
- 功能点完整覆盖
- 没有与软件实际能力冲突的描述
- CTA 清晰明确

---

## 17.2 Subagent B：视觉与样式实现

### 角色

前端视觉开发工程师。

### 输入

- 方案一设计图
- 色彩规范
- 页面结构
- Donvis icon

### 任务

1. 实现全局 CSS 变量
2. 实现浅蓝天空背景
3. 实现像素云装饰
4. 实现像素草地页脚
5. 实现按钮、卡片、标签、进度条样式
6. 实现响应式布局

### 产出

```text
src/styles/variables.css
src/styles/reset.css
src/styles/global.css
src/assets/pixel-cloud.svg
src/assets/pixel-ground.svg
```

### 验收

- 风格接近方案一
- 样式统一
- 移动端不溢出
- 没有大面积空白或拥挤

---

## 17.3 Subagent C：页面组件开发

### 角色

Vue 组件开发工程师。

### 输入

- 信息架构
- 样式规范
- 静态数据文件

### 任务

1. 实现所有页面组件
2. 拆分组件
3. 使用数据驱动 Feature / FAQ / Download
4. 实现 FAQ 展开收起
5. 实现锚点跳转

### 产出

```text
src/components/AppHeader.vue
src/components/HeroSection.vue
src/components/PainPointSection.vue
src/components/FeatureGrid.vue
src/components/PreviewSection.vue
src/components/PrivacySection.vue
src/components/DownloadSection.vue
src/components/FaqSection.vue
src/components/FinalCta.vue
src/components/AppFooter.vue
src/App.vue
```

### 验收

- 所有组件正常渲染
- 无 TypeScript 报错
- FAQ 能展开收起
- 下载与 GitHub 链接能点击
- 页面滚动流畅

---

## 17.4 Subagent D：静态资源与图标处理

### 角色

静态资源工程师。

### 输入

- Donvis icon
- 软件截图
- 方案一设计图

### 任务

1. 整理 Donvis icon
2. 准备 favicon
3. 准备 OG Image 占位
4. 准备 screenshot 占位图
5. 压缩图片资源
6. 保证图片命名清晰

### 产出

```text
public/favicon.ico
public/donvis-icon.png
public/og-image.png
public/screenshots/toolbar.png
public/screenshots/popover.png
public/screenshots/settings.png
public/screenshots/dock.png
```

### 验收

- 图片路径正确
- 页面无 404 图片
- 图片体积合理
- alt 文案完整

---

## 17.5 Subagent E：构建、验证与部署准备

### 角色

前端质量与部署工程师。

### 输入

- 完整项目代码
- 本文档验收标准

### 任务

1. 执行类型检查
2. 执行构建
3. 本地预览 dist
4. 检查静态资源路径
5. 检查移动端展示
6. 输出部署说明

### 产出

```text
dist/
README.md
DEPLOY.md
```

### 验收

- `npm run build` 成功
- `npm run preview` 成功
- 无明显控制台错误
- 页面可静态部署
- 下载链接与 GitHub 链接可访问

---

## 18. Codex / Claude Code 总执行提示词

下面提示词可以直接复制给 Codex 或 Claude Code 使用。

```text
你现在是一个资深前端工程师，请根据当前项目要求实现 Donvis / 驴维斯 官网首页。

目标：
实现一个纯静态软件官网首页，不需要后端服务、不需要数据库、不需要接口请求。页面用于介绍 Donvis 软件能力、展示界面、提供下载链接和 GitHub 链接。

技术栈：
使用 Vite + Vue 3 + TypeScript。如果当前项目已经存在，请在现有结构上改造；如果不存在，请创建标准 Vite Vue TS 项目。

视觉风格：
参考方案一 Pixel Sky Landing Page：
- 浅蓝天空背景
- 像素风云朵
- 复古游戏感
- 橙色主色
- 圆角白色卡片
- 像素草地 / 土地页脚
- Donvis 驴子 icon 作为品牌元素
- 整体要像一个真实可上线的软件产品官网，不要做成玩具页面

页面区块：
1. Header 顶部导航
2. Hero 首屏
3. 为什么选择 Donvis
4. 核心功能
5. 界面预览
6. 隐私优先
7. 下载 Donvis
8. FAQ
9. 最终 CTA
10. Footer

必须表达的产品能力：
- Donvis 是面向 Codex 与 Claude Code 用户的本地菜单栏额度监控工具
- 实时展示账号级 5 小时 / 7 天剩余额度
- 展示剩余百分比、剩余时间、重置时间
- 自动识别 Codex Desktop、Codex CLI、Codex VSCode 扩展、Claude Desktop、Claude Code CLI
- 支持共享账号额度合并
- Codex 与 Claude 分组展示
- 多客户端菜单栏标题轮播
- Claude 支持真实手动刷新
- Dock 备用入口
- 多屏一致体验
- 隐私优先：不上传数据，不读取代码、Prompt、模型响应或文件内容
- GitHub 开源
- 提供 Apple Silicon / Intel Mac 下载入口，Windows 显示即将推出

交互要求：
- Header 锚点平滑滚动
- FAQ 支持展开收起
- 下载按钮跳转 GitHub Release
- GitHub 按钮跳转仓库
- 卡片有 hover 效果
- Hero Mockup 可有轻微浮动动画
- 云朵可有非常轻微的慢速移动动画
- 移动端减少装饰，确保内容不遮挡

静态要求：
- 不要请求任何业务接口
- 不要实现登录
- 不要实现服务端逻辑
- 不要引入数据库
- 所有数据使用本地 ts 配置或组件内静态数据
- 构建后 dist 可以直接部署到 GitHub Pages / Cloudflare Pages / Vercel / Nginx 静态目录

质量要求：
- TypeScript 无报错
- npm run build 成功
- npm run preview 成功
- 页面在桌面端、平板端、移动端都可正常浏览
- 无明显图片 404
- 外链使用 target="_blank" 并设置 rel="noopener noreferrer"
- 图片设置 alt
- FAQ 按钮可键盘访问
- 页面性能轻量，不引入过重依赖

请按以下步骤执行：
1. 检查项目结构
2. 建立或整理 src/components、src/data、src/styles、src/assets
3. 创建全局样式变量
4. 实现 Header、Hero、Feature、Preview、Privacy、Download、FAQ、Footer 等组件
5. 将核心功能、FAQ、下载项抽成静态数据
6. 实现响应式布局
7. 实现基础交互与动效
8. 执行 npm run build
9. 修复构建错误
10. 输出完成说明，列出修改文件、运行方式、验证结果
```

---

## 19. 执行完成验证清单

开发完成后必须逐项验证。

## 19.1 功能验证

- [ ] Header Logo 正常显示
- [ ] Header 导航点击后能滚动到对应区块
- [ ] Hero 主标题完整显示
- [ ] Hero 下载按钮可点击
- [ ] Hero GitHub 按钮可点击
- [ ] 功能卡片完整展示
- [ ] 界面预览区图片或 Mockup 正常展示
- [ ] 隐私说明完整展示
- [ ] Apple Silicon 下载入口可点击
- [ ] Intel 下载入口可点击
- [ ] Windows 显示即将推出且不可误点击下载
- [ ] FAQ 可展开收起
- [ ] Final CTA 可点击
- [ ] Footer 链接可点击

## 19.2 静态页面验证

- [ ] 页面不依赖后端服务
- [ ] 页面不请求业务接口
- [ ] 页面不需要数据库
- [ ] 页面不需要登录
- [ ] 关闭本地开发服务后，dist 可由静态服务器打开
- [ ] 外链失败不影响页面主体展示

## 19.3 构建验证

执行：

```bash
npm install
npm run build
npm run preview
```

要求：

- [ ] install 成功
- [ ] build 成功
- [ ] preview 成功
- [ ] 控制台无明显报错
- [ ] dist 目录生成成功

## 19.4 响应式验证

检查尺寸：

```text
1440px
1200px
1024px
768px
430px
375px
```

要求：

- [ ] 桌面端 Hero 左右布局正常
- [ ] 平板端卡片换行正常
- [ ] 移动端单列展示
- [ ] 移动端按钮不溢出
- [ ] 移动端 Header 不遮挡正文
- [ ] 移动端像素装饰不遮挡文字

## 19.5 视觉验证

- [ ] 页面背景为浅蓝天空风格
- [ ] 有像素云朵装饰
- [ ] 有 Donvis 驴子 icon 元素
- [ ] 有橙色主按钮
- [ ] 卡片圆角统一
- [ ] Footer 有像素草地 / 土地风格
- [ ] 页面整体接近方案一
- [ ] 不出现明显与 Donvis 无关的品牌元素

## 19.6 内容验证

- [ ] 页面说明 Donvis 是本地菜单栏额度监控工具
- [ ] 页面说明支持 Codex 与 Claude Code
- [ ] 页面说明 5 小时 / 7 天额度窗口
- [ ] 页面说明自动识别客户端
- [ ] 页面说明共享账号合并
- [ ] 页面说明 Claude 手动刷新
- [ ] 页面说明 Dock 备用入口
- [ ] 页面说明隐私优先
- [ ] 页面说明不会上传代码 / Prompt / 响应 / 文件内容
- [ ] 页面提供 GitHub 入口
- [ ] 页面提供下载入口

## 19.7 链接验证

- [ ] GitHub 仓库链接正确
- [ ] GitHub Release 链接正确
- [ ] 下载按钮不会跳到空页面
- [ ] Windows 即将推出按钮不会误导用户
- [ ] 外链新窗口打开
- [ ] 外链包含 rel="noopener noreferrer"

## 19.8 性能验证

建议执行 Lighthouse 或浏览器 Performance 检查。

目标：

- [ ] Performance 大于 85
- [ ] Accessibility 大于 90
- [ ] Best Practices 大于 90
- [ ] SEO 大于 90
- [ ] 首屏加载无明显卡顿
- [ ] 图片资源无明显过大

---

## 20. 部署建议

因为页面是纯静态资源，可选择以下方式部署。

### 20.1 GitHub Pages

适合开源项目官网。

构建命令：

```bash
npm run build
```

发布目录：

```text
dist
```

如果部署到 GitHub Pages 子路径，需要配置：

```ts
// vite.config.ts
export default defineConfig({
  base: '/Donvis/',
})
```

如果部署到独立域名，则使用：

```ts
export default defineConfig({
  base: '/',
})
```

### 20.2 Cloudflare Pages

推荐用于正式官网。

配置：

```text
Build command: npm run build
Output directory: dist
```

### 20.3 Vercel

配置：

```text
Framework: Vite
Build command: npm run build
Output directory: dist
```

### 20.4 Nginx 静态目录

将 `dist` 内容放入 Nginx 静态目录即可。

示例：

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

---

## 21. 风险点与处理方式

### 21.1 设计风格过于可爱，影响专业度

处理方式：

- 正文使用清晰现代字体
- 卡片布局保持克制
- 像素元素作为点缀，不要铺满页面
- 下载区、隐私区要更正式

### 21.2 页面文字过多

处理方式：

- 首屏只放核心价值
- 功能区使用短句
- FAQ 承载解释性内容
- 长说明放 GitHub README 或文档链接

### 21.3 下载链接变化

处理方式：

- 下载链接集中维护在 `downloads.ts`
- 不在组件中硬编码多个链接
- 版本号集中维护在 `site.ts`

### 21.4 图片资源不足

处理方式：

- 先使用 Mockup 占位
- 后续替换真实截图
- 图片尺寸统一
- 所有图片路径集中管理

### 21.5 GitHub Pages 子路径资源错误

处理方式：

- 根据部署方式配置 Vite base
- 本地 preview 验证资源路径
- 避免写死绝对路径

---

## 22. 最终交付物

完成后应包含：

```text
1. 可运行源码
2. 完整静态首页
3. dist 构建产物
4. README 运行说明
5. DEPLOY 部署说明
6. 下载链接配置
7. 页面截图资源
8. 验证结果说明
```

---

## 23. 交付说明模板

开发完成后，输出以下内容：

```text
已完成 Donvis 官网首页静态页面开发。

本次完成内容：
1. 完成 Pixel Sky 风格首页整体页面
2. 完成 Header / Hero / Feature / Preview / Privacy / Download / FAQ / Footer
3. 完成 Donvis icon 品牌元素接入
4. 完成下载入口与 GitHub 外链
5. 完成 FAQ 展开收起
6. 完成桌面端、平板端、移动端响应式适配
7. 完成静态构建验证

运行方式：
npm install
npm run dev

构建方式：
npm run build
npm run preview

验证结果：
- npm run build：通过
- npm run preview：通过
- 页面无后端依赖：通过
- 下载链接可点击：通过
- FAQ 交互：通过
- 移动端适配：通过

主要修改文件：
- src/App.vue
- src/components/*
- src/data/*
- src/styles/*
- public/*
```
