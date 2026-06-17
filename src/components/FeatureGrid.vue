<script setup lang="ts">
import { features } from '../data/features'

const icons: Record<string, string> = {
  search: '🔎',
  hourglass: '⏳',
  users: '👥',
  layers: '▣',
  carousel: '🐴',
  refresh: '↻',
  lock: '🔐',
  dock: '🖼',
  monitor: '🖥',
}
</script>

<template>
  <section id="features" class="section">
    <div class="container">
      <h2 class="section-title pixel-text">核心功能</h2>
      <div class="feature-grid">
        <article v-for="feature in features" :key="feature.title" class="card feature-card">
          <span class="icon-badge">{{ icons[feature.icon] }}</span>
          <div>
            <h3>{{ feature.title }}</h3>
            <p>{{ feature.description }}</p>
            <ul v-if="feature.meta" class="meta-list">
              <li v-for="meta in feature.meta" :key="meta">✓ {{ meta }}</li>
            </ul>
          </div>
        </article>
      </div>
    </div>
  </section>
</template>

<style scoped>
.feature-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-top: 30px;
}

.feature-card {
  display: grid;
  grid-template-columns: 58px 1fr;
  gap: 16px;
  min-height: 174px;
  padding: 24px;
}

h3 {
  margin: 0 0 9px;
  font-size: 19px;
}

p {
  margin: 0;
  color: var(--color-text-muted);
  line-height: 1.7;
}

.meta-list {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px 10px;
  padding: 0;
  margin: 16px 0 0;
  color: #4e6985;
  font-size: 12px;
  font-weight: 800;
  list-style: none;
}

@media (max-width: 1020px) {
  .feature-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 680px) {
  .feature-grid {
    grid-template-columns: 1fr;
  }

  .feature-card {
    grid-template-columns: 50px 1fr;
    padding: 20px;
  }
}
</style>
