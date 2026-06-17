<script setup lang="ts">
import donkeyUrl from '../assets/donkey-mascot.svg'
import { site } from '../data/site'
</script>

<template>
  <section class="section final-section">
    <div class="container">
      <div class="final-cta">
        <img :src="donkeyUrl" alt="Donvis 驴子吉祥物" />
        <div>
          <h2 class="pixel-text">让额度监控变得简单有趣！</h2>
          <p>立即下载 Donvis，专注你的创造力，别再为额度操心。</p>
        </div>
        <div class="final-actions">
          <a class="btn btn-primary" href="#download"> 下载 macOS 版</a>
          <a class="btn btn-secondary" :href="site.githubUrl" target="_blank" rel="noopener noreferrer">GitHub</a>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.final-section {
  padding-bottom: 34px;
}

.final-cta {
  display: grid;
  grid-template-columns: 112px 1fr auto;
  align-items: center;
  gap: 28px;
  padding: 34px 42px;
  border: 1px solid #b9d5ee;
  border-radius: var(--radius-lg);
  background: rgba(215, 237, 255, 0.78);
  box-shadow: var(--shadow-card);
}

img {
  width: 104px;
  image-rendering: pixelated;
}

h2 {
  margin: 0;
  font-size: clamp(26px, 4vw, 38px);
}

p {
  margin: 10px 0 0;
  color: var(--color-text-muted);
}

.final-actions {
  display: flex;
  gap: 14px;
}

@media (max-width: 860px) {
  .final-cta {
    grid-template-columns: 1fr;
    justify-items: center;
    text-align: center;
  }

  .final-actions {
    width: 100%;
    flex-direction: column;
  }
}
</style>
