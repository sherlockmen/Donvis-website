<script setup lang="ts">
import { computed, getCurrentInstance, ref } from 'vue'
import { ArrowUpRight, Search, X } from 'lucide-vue-next'
import { FEATURE_CATEGORIES, searchFeatures } from '../motion-video/featureDirectoryData'

const props = withDefaults(defineProps<{
  categoryIds: readonly string[]
  title: string
  triggerLabel?: string
}>(), { triggerLabel: '查看功能详情' })

const trigger = ref<HTMLButtonElement>()
const dialog = ref<HTMLDialogElement>()
const results = ref<HTMLElement>()
const opened = ref(false)
const query = ref('')
const dialogId = `studio-feature-details-${getCurrentInstance()?.uid}`
const categories = computed(() => FEATURE_CATEGORIES.filter(category => props.categoryIds.includes(category.id)))
const total = computed(() => categories.value.reduce((count, category) => count + category.items.length, 0))
const visibleCategories = computed(() => query.value.trim()
  ? searchFeatures(query.value).filter(category => props.categoryIds.includes(category.id))
  : categories.value)
const visibleCount = computed(() => visibleCategories.value.reduce((count, category) => count + category.items.length, 0))

function openDetails() {
  if (!dialog.value || dialog.value.open) return
  query.value = ''
  opened.value = true
  dialog.value.showModal()
}

function onClose() {
  opened.value = false
  trigger.value?.focus({ preventScroll: true })
}
</script>

<template>
  <button ref="trigger" class="detail-trigger" type="button" aria-haspopup="dialog" :aria-controls="dialogId" @click="openDetails">
    {{ triggerLabel }}
    <ArrowUpRight :size="17" aria-hidden="true" />
  </button>

  <dialog :id="dialogId" ref="dialog" class="studio-feature-dialog" :aria-labelledby="`${dialogId}-title`" data-lenis-prevent @click.self="dialog?.close()" @close="onClose">
    <div class="detail-layout">
      <header class="detail-header">
        <h2 :id="`${dialogId}-title`">{{ title }}</h2>
        <button type="button" class="detail-close" autofocus aria-label="关闭功能详情" @click="dialog?.close()">
          <X :size="20" aria-hidden="true" />
        </button>
      </header>
      <div v-if="total >= 12" class="detail-filter">
        <label class="detail-search">
          <Search :size="18" aria-hidden="true" />
          <input v-model="query" type="search" aria-label="搜索本组功能" placeholder="搜索功能" @input="results?.scrollTo(0, 0)" />
        </label>
        <p role="status">{{ query.trim() ? `找到 ${visibleCount} 项` : `共 ${total} 项` }}</p>
      </div>
      <div v-if="opened" ref="results" class="detail-scroll" tabindex="0" role="region" aria-label="功能列表">
        <p v-if="!visibleCategories.length" class="detail-empty">没有匹配的功能。</p>
        <section v-for="category in visibleCategories" :key="category.id" class="detail-group">
          <h3>{{ category.title }}</h3>
          <dl>
            <div v-for="feature in category.items" :key="feature.id">
              <dt>{{ feature.label }}</dt>
              <dd>{{ feature.detail }}</dd>
            </div>
          </dl>
        </section>
      </div>
    </div>
  </dialog>
</template>

<style scoped>
:global(html:has(.studio-feature-dialog)) { scrollbar-gutter: stable; }
:global(html:has(.studio-feature-dialog[open])) { overflow: hidden; }
.detail-trigger {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 13px;
  min-height: 44px;
  padding: 8px 16px;
  color: inherit;
  background: transparent;
  border: 1px solid currentColor;
  border-radius: 999px;
  font: inherit;
  font-size: .875rem;
  line-height: 1.25;
  cursor: pointer;
}
.detail-trigger:hover { background: #9e292013; }
.detail-trigger > svg { flex: none; transition: transform 150ms ease; }
.detail-trigger:is(:hover, :focus-visible) > svg { transform: translate(2px, -2px); }
.studio-feature-dialog {
  box-sizing: border-box;
  width: min(720px, calc(100% - 32px));
  max-width: none;
  max-height: min(770px, calc(100dvh - 32px));
  padding: 0;
  margin: auto;
  color: #271e1a;
  background: #f7f2e8;
  border: 1px solid #dfd1c3;
  border-radius: 18px;
  overflow: hidden;
  box-shadow: 0 24px 80px #1e080845;
  font-family: inherit;
}
.studio-feature-dialog::backdrop { background: #271c1bbb; }
.studio-feature-dialog[open] { animation: detail-enter 220ms cubic-bezier(.22, 1, .36, 1) both; }
@keyframes detail-enter {
  from { opacity: 0; transform: translateY(10px); }
}
.detail-layout {
  display: flex;
  flex-direction: column;
  max-height: min(768px, calc(100dvh - 34px));
}
.detail-header, .detail-filter {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
  gap: 14px;
  padding-inline: clamp(16px, 5vw, 34px);
}
.detail-header { padding-block: 18px 14px; border-bottom: 1px solid #e1d5c8; }
.detail-header h2 { margin: 0; font-size: clamp(1.375rem, 4vw, 2rem); line-height: 1.2; }
.detail-close {
  display: grid;
  place-items: center;
  flex: 0 0 44px;
  height: 44px;
  padding: 0;
  color: #9e2920;
  background: transparent;
  border: 1px solid #d8c1b3;
  border-radius: 50%;
  cursor: pointer;
}
.detail-close:hover { background: #9e292013; }
.detail-filter { padding-block: 12px; border-bottom: 1px solid #e1d5c8; }
.detail-filter p { margin: 0; color: #79564b; font-size: .8125rem; white-space: nowrap; }
.detail-search {
  display: flex;
  flex: 1;
  align-items: center;
  gap: 9px;
  min-width: 0;
  padding-inline: 12px;
  background: #fffcf6;
  color: #9e2920;
  border: 1px solid #d8c1b3;
  border-radius: 8px;
}
.detail-search input {
  width: 100%;
  min-width: 0;
  min-height: 44px;
  padding: 6px 0;
  background: transparent;
  border: 0;
  color: #271e1a;
  font: inherit;
}
.detail-search input:focus { outline: none; }
.detail-scroll {
  min-height: 0;
  padding: 0 clamp(16px, 5vw, 34px) 28px;
  overflow: auto;
  overscroll-behavior: contain;
}
.detail-group + .detail-group { margin-top: 22px; }
.detail-group h3 { margin: 24px 0 7px; color: #9e2920; font-size: 1.125rem; }
.detail-group dl { margin: 0; }
.detail-group dl > div { padding-block: 12px; border-bottom: 1px solid #e1d5c8; }
.detail-group dt { font-weight: 650; }
.detail-group dd { margin: 4px 0 0; color: #644b41; font-size: .875rem; line-height: 1.6; overflow-wrap: anywhere; }
.detail-empty { margin: 28px 0 0; color: #644b41; }
.detail-trigger:focus-visible { outline: 2px solid currentColor; outline-offset: 3px; }
.detail-close:focus-visible, .detail-search:focus-within, .detail-scroll:focus-visible {
  outline: 2px solid #9e2920;
  outline-offset: 3px;
}
.detail-scroll:focus-visible { outline-offset: -3px; }
@media (max-width: 480px) {
  .studio-feature-dialog { width: calc(100% - 16px); max-height: calc(100dvh - 16px); border-radius: 14px; }
  .detail-layout { max-height: calc(100dvh - 18px); }
}
@media (prefers-reduced-motion: reduce) {
  .studio-feature-dialog[open] { animation: none; }
  .detail-trigger > svg { transition: none; }
}
</style>
