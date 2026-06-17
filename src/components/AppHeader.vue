<script setup lang="ts">
import donkeyUrl from '../assets/donkey-mascot.svg'
import { site } from '../data/site'
</script>

<template>
  <header class="app-header">
    <div class="container header-inner">
      <a class="brand" href="#top" aria-label="Donvis 首页">
        <img :src="donkeyUrl" alt="Donvis 驴子图标" />
        <span>
          <strong>{{ site.name }}</strong>
          <small>{{ site.tagline }}</small>
        </span>
      </a>

      <nav class="nav-links" aria-label="主导航">
        <a href="#features">功能</a>
        <a href="#previews">截图</a>
        <a href="#download">下载</a>
        <a href="#faq">FAQ</a>
        <a :href="site.githubUrl" target="_blank" rel="noopener noreferrer">GitHub ↗</a>
      </nav>

      <a class="btn btn-primary header-cta" :href="site.githubUrl" target="_blank" rel="noopener noreferrer">☆ 在 GitHub 上 Star</a>
    </div>
  </header>
</template>

<style scoped>
.app-header {
  position: sticky;
  top: 0;
  z-index: 20;
  border-bottom: 1px solid rgba(200, 217, 232, 0.5);
  background: rgba(234, 246, 255, 0.86);
  backdrop-filter: blur(16px);
}

.header-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 22px;
  min-height: 78px;
}

.brand {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  min-width: 220px;
}

.brand img {
  width: 54px;
  height: 54px;
  image-rendering: pixelated;
}

.brand strong,
.brand small {
  display: block;
}

.brand strong {
  font-size: 18px;
  font-weight: 900;
}

.brand small {
  margin-top: 4px;
  color: var(--color-text-muted);
  font-size: 13px;
  font-weight: 700;
}

.nav-links {
  display: flex;
  align-items: center;
  gap: 30px;
  font-size: 15px;
  font-weight: 800;
}

.nav-links a {
  padding: 10px 0;
}

.nav-links a:hover,
.nav-links a:focus-visible {
  color: var(--color-primary);
  outline: none;
}

.header-cta {
  min-width: 164px;
}

@media (max-width: 900px) {
  .nav-links {
    display: none;
  }
}

@media (max-width: 560px) {
  .header-inner {
    min-height: 68px;
  }

  .brand {
    min-width: 0;
  }

  .brand img {
    width: 46px;
    height: 46px;
  }

  .brand small {
    display: none;
  }

  .header-cta {
    width: auto;
    min-width: 112px;
    padding: 0 12px;
    font-size: 13px;
  }
}
</style>
