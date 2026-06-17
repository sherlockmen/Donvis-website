<script setup lang="ts">
import { downloads } from '../data/downloads'
</script>

<template>
  <section id="download" class="section">
    <div class="container">
      <h2 class="section-title pixel-text">下载 Donvis</h2>
      <p class="section-lead">请选择与你的 Mac 芯片一致的安装包，两个版本功能完全相同。</p>
      <div class="download-grid">
        <article v-for="item in downloads" :key="item.id" class="card download-card" :class="{ disabled: item.disabled }">
          <span v-if="item.tag" class="tag">{{ item.tag }}</span>
          <h3>{{ item.title }}</h3>
          <p>{{ item.subtitle }}</p>
          <div class="chip">{{ item.chip }}</div>
          <a v-if="!item.disabled" class="btn btn-primary" :href="item.url" target="_blank" rel="noopener noreferrer"> {{ item.buttonText }}</a>
          <button v-else class="btn btn-disabled" type="button" disabled>{{ item.buttonText }}</button>
        </article>
      </div>
      <div class="requirements">
        <span>macOS 13 Ventura 或更高版本</span>
        <span>Apple Silicon 或 Intel Mac</span>
        <span>Codex / Claude Code 官方客户端已登录</span>
      </div>
    </div>
  </section>
</template>

<style scoped>
.download-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}

.download-card {
  position: relative;
  min-height: 298px;
  padding: 30px;
  text-align: center;
  background: rgba(255, 255, 255, 0.88);
}

.tag {
  position: absolute;
  top: 16px;
  right: 16px;
  padding: 4px 10px;
  border-radius: 999px;
  color: #fff;
  background: var(--color-primary);
  font-size: 12px;
  font-weight: 900;
}

h3 {
  margin: 4px 0 8px;
  font-size: 21px;
}

p {
  margin: 0;
  color: var(--color-text-muted);
  font-weight: 700;
}

.chip {
  display: grid;
  place-items: center;
  width: 78px;
  height: 78px;
  margin: 30px auto 24px;
  border: 6px solid #c77a20;
  border-radius: 14px;
  color: #5c3308;
  background: #ffe4a8;
  font-weight: 1000;
  box-shadow: inset 0 0 0 5px #3b2b1d;
}

.disabled .chip {
  border-color: #b8c4d0;
  color: #7b8895;
  background: #e9eef3;
  box-shadow: none;
}

.requirements {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 18px;
  margin-top: 24px;
  color: var(--color-text-muted);
  font-size: 14px;
  font-weight: 800;
}

.requirements span::before {
  content: "●";
  margin-right: 8px;
  color: #f0b63c;
}

@media (max-width: 1020px) {
  .download-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 680px) {
  .download-grid {
    grid-template-columns: 1fr;
  }
}
</style>
