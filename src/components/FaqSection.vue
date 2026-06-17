<script setup lang="ts">
import { ref } from 'vue'
import { faqs } from '../data/faqs'

const openIndex = ref<number | null>(null)

function toggle(index: number) {
  openIndex.value = openIndex.value === index ? null : index
}
</script>

<template>
  <section id="faq" class="section">
    <div class="container faq-container">
      <h2 class="section-title pixel-text">常见问题（FAQ）</h2>
      <div class="faq-list">
        <article v-for="(item, index) in faqs" :key="item.question" class="faq-item">
          <button
            class="faq-question"
            type="button"
            :aria-expanded="openIndex === index"
            :aria-controls="`faq-panel-${index}`"
            @click="toggle(index)"
          >
            <span>{{ item.question }}</span>
            <strong>{{ openIndex === index ? '−' : '+' }}</strong>
          </button>
          <div :id="`faq-panel-${index}`" class="faq-answer" :class="{ open: openIndex === index }">
            <p>{{ item.answer }}</p>
          </div>
        </article>
      </div>
    </div>
  </section>
</template>

<style scoped>
.faq-container {
  max-width: 760px;
}

.faq-list {
  display: grid;
  gap: 10px;
  margin-top: 30px;
}

.faq-item {
  overflow: hidden;
  border: 1px solid var(--color-border);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.76);
}

.faq-question {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  min-height: 48px;
  padding: 0 18px;
  border: 0;
  color: var(--color-text);
  background: transparent;
  font-weight: 900;
  text-align: left;
}

.faq-question:focus-visible {
  outline: 3px solid rgba(255, 107, 53, 0.35);
  outline-offset: -3px;
}

.faq-question strong {
  color: var(--color-primary);
  font-size: 22px;
}

.faq-answer {
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows 180ms ease;
}

.faq-answer.open {
  grid-template-rows: 1fr;
}

.faq-answer p {
  min-height: 0;
  margin: 0;
  overflow: hidden;
  color: var(--color-text-muted);
  line-height: 1.75;
}

.faq-answer.open p {
  padding: 0 18px 18px;
}
</style>
