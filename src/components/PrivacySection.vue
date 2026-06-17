<script setup lang="ts">
import { privacyItems } from '../data/features'

const icons: Record<string, string> = {
  shield: '🛡',
  offline: '✕',
  code: '</>',
  open: '❤',
}
</script>

<template>
  <section class="section privacy-section">
    <div class="container">
      <h2 class="section-title pixel-text">隐私优先，安全放心</h2>
      <p class="section-lead">Donvis 以本地优先为设计原则，只展示额度相关信息，不碰你的代码和对话。</p>
      <div class="privacy-grid">
        <article v-for="item in privacyItems" :key="item.title" class="card privacy-card">
          <span class="icon-badge">{{ icons[item.icon] }}</span>
          <h3>{{ item.title }}</h3>
          <p>{{ item.description }}</p>
        </article>
      </div>
    </div>
  </section>
</template>

<style scoped>
.privacy-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
}

.privacy-card {
  padding: 26px 20px;
  text-align: center;
}

h3 {
  margin: 18px 0 10px;
}

p {
  margin: 0;
  color: var(--color-text-muted);
  line-height: 1.65;
}

@media (max-width: 1020px) {
  .privacy-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 620px) {
  .privacy-grid {
    grid-template-columns: 1fr;
  }
}
</style>
