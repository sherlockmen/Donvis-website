<script setup lang="ts">
import { previews } from '../data/features'
</script>

<template>
  <section id="previews" class="section preview-section">
    <div class="container">
      <h2 class="section-title pixel-text">界面预览</h2>
      <div class="preview-grid">
        <article v-for="item in previews" :key="item.title" class="card preview-card">
          <h3>{{ item.title }}</h3>
          <img :src="item.image" :alt="`${item.title}界面预览`" loading="lazy" />
          <p>{{ item.description }}</p>
        </article>
      </div>
    </div>
  </section>
</template>

<style scoped>
.preview-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-top: 30px;
}

.preview-card {
  padding: 18px;
  text-align: center;
  background: rgba(229, 245, 255, 0.78);
}

h3 {
  margin: 4px 0 14px;
  font-size: 18px;
}

img {
  width: 100%;
  aspect-ratio: 1.35;
  object-fit: cover;
  border: 1px solid #cfe0ef;
  border-radius: 10px;
}

p {
  margin: 14px 0 0;
  color: var(--color-text-muted);
  line-height: 1.65;
}

@media (max-width: 1020px) {
  .preview-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 620px) {
  .preview-grid {
    grid-template-columns: 1fr;
  }
}
</style>
