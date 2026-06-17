<script setup lang="ts">
import { painPoints } from '../data/features'

const icons: Record<string, string> = {
  browser: '🖥',
  terminal: '⌘',
  clock: '⏰',
  heart: '❤',
}
</script>

<template>
  <section class="section">
    <div class="container">
      <h2 class="section-title pixel-text">为什么选择 <span class="accent">Donvis</span>？</h2>
      <div class="pain-grid">
        <article v-for="item in painPoints" :key="item.title" class="card pain-card">
          <span class="icon-badge">{{ icons[item.icon] }}</span>
          <h3>{{ item.title }}</h3>
          <p>{{ item.description }}</p>
        </article>
      </div>
    </div>
  </section>
</template>

<style scoped>
.pain-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 22px;
  margin-top: 30px;
}

.pain-card {
  min-height: 190px;
  padding: 26px 22px;
  text-align: center;
}

h3 {
  margin: 18px 0 10px;
  font-size: 20px;
}

p {
  margin: 0;
  color: var(--color-text-muted);
  line-height: 1.7;
}

@media (max-width: 1020px) {
  .pain-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 620px) {
  .pain-grid {
    grid-template-columns: 1fr;
  }
}
</style>
