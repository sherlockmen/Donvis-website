<script setup lang="ts">
import groundUrl from '../assets/pixel-ground.svg'
import { site } from '../data/site'
</script>

<template>
  <footer class="footer">
    <div class="ground" :style="{ backgroundImage: `url(${groundUrl})` }"></div>
    <div class="container footer-grid">
      <div>
        <h2>{{ site.name }}</h2>
        <p>{{ site.tagline }}</p>
        <small>© 2026 Donvis. All rights reserved.</small>
      </div>
      <div>
        <h3>链接</h3>
        <a href="#features">功能</a>
        <a href="#previews">截图</a>
        <a href="#download">下载</a>
        <a href="#faq">FAQ</a>
        <a :href="site.githubUrl" target="_blank" rel="noopener noreferrer">GitHub</a>
      </div>
      <div>
        <h3>资源</h3>
        <a :href="site.docsUrl" target="_blank" rel="noopener noreferrer">使用文档</a>
        <a :href="site.changelogUrl" target="_blank" rel="noopener noreferrer">更新日志</a>
        <a :href="site.licenseUrl" target="_blank" rel="noopener noreferrer">开源许可 MIT</a>
      </div>
      <div>
        <h3>系统要求</h3>
        <p>macOS 13.0 或更高版本</p>
        <p>Intel 或 Apple Silicon</p>
        <p>64 位处理器</p>
      </div>
      <div>
        <h3>版本信息</h3>
        <p>Donvis {{ site.version }}</p>
        <p>License: MIT</p>
      </div>
    </div>
  </footer>
</template>

<style scoped>
.footer {
  position: relative;
  color: #fff;
  background: #7a3f00;
}

.ground {
  height: 80px;
  background-repeat: repeat-x;
  background-size: 320px 80px;
}

.footer-grid {
  display: grid;
  grid-template-columns: 1.5fr repeat(4, 1fr);
  gap: 28px;
  padding: 34px 0 46px;
}

h2,
h3,
p {
  margin: 0;
}

h2 {
  font-size: 22px;
}

h3 {
  margin-bottom: 12px;
  font-size: 15px;
}

p,
a,
small {
  display: block;
  margin-top: 8px;
  color: rgba(255, 255, 255, 0.78);
  font-size: 13px;
  line-height: 1.6;
}

a:hover,
a:focus-visible {
  color: #fff;
  outline: none;
}

@media (max-width: 860px) {
  .footer-grid {
    grid-template-columns: 1fr 1fr;
  }
}

@media (max-width: 560px) {
  .footer-grid {
    grid-template-columns: 1fr;
  }
}
</style>
