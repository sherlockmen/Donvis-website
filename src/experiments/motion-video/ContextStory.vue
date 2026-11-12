<script setup lang="ts">
import { computed, getCurrentInstance, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { animate } from 'motion'
import { Grid3X3, Scan } from 'lucide-vue-next'
import { compactToken } from '../../components/donvisDemoData'
import { CONTEXT_SAMPLES, CONTEXT_SPRING, contextBlock, contextFanPhase, contextFanPose, contextFocusIndex, contextGridIndex, contextLens, contextMoveIndex, contextReveal, contextStripIndices, contextSummary } from './context-story'

const id = `context-story-${getCurrentInstance()?.uid ?? 0}`
const grid = ref<HTMLElement>()
const current = ref(0), progress = ref(0), width = ref(660), reduced = ref(false), interacted = ref(false), instant = ref(false)
const lensOpen = ref(false)
const sample = computed(() => CONTEXT_SAMPLES[current.value]!)
const summary = computed(() => contextSummary(sample.value))
const selected = ref(contextFocusIndex(sample.value))
const detail = computed(() => contextBlock(sample.value, selected.value))
const phase = computed(() => interacted.value || reduced.value ? 'flat' : contextFanPhase(progress.value))
const slices = Array.from({ length: 5 }, (_, index) => contextStripIndices(index))
const span = computed(() => width.value < 400 ? 5 : 3)
const lensSize = computed(() => width.value < 400 ? 104 : 154)
const lensCells = computed(() => contextLens(selected.value, span.value).map(cell => ({ ...cell, ...contextBlock(sample.value, cell.index) })))
const lensPosition = computed(() => {
  const half = lensSize.value / 2 + 5, height = width.value / 2
  return { left: `${Math.max(half, Math.min(width.value - half, (selected.value % 20 + .5) / 20 * width.value))}px`, top: `${Math.max(half, Math.min(height - half, (Math.floor(selected.value / 20) + .5) / 10 * height))}px`, width: `${lensSize.value}px`, height: `${lensSize.value}px` }
})
const strips: HTMLElement[] = []
let controls: { stop(): void; pause(): void; play(): void }[] = []
let visible = false, frame = 0, cleanup = () => {}
function setStrip(element: unknown, index: number) { if (element instanceof HTMLElement) strips[index] = element }
function stripLayout(index: number) { const pose = contextFanPose(index, width.value, 'flat'); return { width: `${pose.width}px`, left: `${pose.left}px`, zIndex: pose.zIndex } }
function stop() { controls.forEach(control => control.stop()); controls = [] }
function moveStrips() {
  stop()
  strips.forEach((element, index) => {
    const pose = contextFanPose(index, width.value, phase.value)
    if (instant.value || reduced.value || !visible || document.hidden) element.style.transform = `translateX(${pose.x}px) translateY(${pose.y}px) rotate(${pose.rotate}deg)`
    // Actual SignInFan port: same offset arc, source stagger and Motion spring.
    // https://github.com/motionvideohq/motionvideo.xyz/blob/c156ca8470b1d18fbce3a32b588a4c80deb3f24d/apps/web/src/components/sign-in-fan.tsx
    else {
      const animation = animate(element, { x: pose.x, y: pose.y, rotate: pose.rotate }, { ...CONTEXT_SPRING, delay: pose.delay })
      controls.push(animation)
      void animation.then(() => { controls = controls.filter(control => control !== animation) })
    }
  })
}
watch([phase, width], moveStrips, { flush: 'post' })
function settle(keyboard = false) { instant.value = keyboard; interacted.value = true; progress.value = 1; if (keyboard) moveStrips() }
function choose(index: number, event: MouseEvent) { lensOpen.value = false; instant.value = event.detail === 0; settle(instant.value); current.value = index; selected.value = contextFocusIndex(sample.value) }
function inspect(event: PointerEvent) {
  if (!grid.value) return
  lensOpen.value = true
  settle(true)
  const box = grid.value.getBoundingClientRect()
  selected.value = contextGridIndex((event.clientX - box.left) / box.width, (event.clientY - box.top) / box.height)
}
function focusGrid() { settle(true); lensOpen.value = true }
function finishTouch(event: PointerEvent) { if (event.pointerType === 'touch') lensOpen.value = false }
function keydown(event: KeyboardEvent) {
  if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)) return
  event.preventDefault(); settle(true); lensOpen.value = true
  selected.value = contextMoveIndex(selected.value, event.key, event.ctrlKey || event.metaKey)
}
function measure() {
  frame = 0
  if (!grid.value) return
  const box = grid.value.getBoundingClientRect()
  width.value = box.width
  progress.value = reduced.value || interacted.value ? 1 : contextReveal(box.top, innerHeight)
}
function schedule() { if (!frame && visible && !document.hidden && !reduced.value) frame = requestAnimationFrame(measure) }
onMounted(() => {
  const media = matchMedia('(prefers-reduced-motion: reduce)')
  const change = () => { reduced.value = media.matches; if (reduced.value) { cancelAnimationFrame(frame); frame = 0 }; measure(); moveStrips() }
  const visibility = () => {
    if (document.hidden) { controls.forEach(control => control.pause()); cancelAnimationFrame(frame); frame = 0 }
    else if (visible) { controls.forEach(control => control.play()); schedule() }
  }
  change()
  const observer = new IntersectionObserver(entries => {
    visible = !!entries[0]?.isIntersecting
    if (visible && !document.hidden) { controls.forEach(control => control.play()); schedule() }
    else { controls.forEach(control => control.pause()); cancelAnimationFrame(frame); frame = 0 }
  })
  if (grid.value) observer.observe(grid.value)
  media.addEventListener('change', change)
  document.addEventListener('visibilitychange', visibility)
  addEventListener('scroll', schedule, { passive: true })
  addEventListener('resize', measure, { passive: true })
  cleanup = () => { observer.disconnect(); media.removeEventListener('change', change); document.removeEventListener('visibilitychange', visibility); removeEventListener('scroll', schedule); removeEventListener('resize', measure) }
})
onBeforeUnmount(() => { stop(); cancelAnimationFrame(frame); cleanup() })
</script>

<template>
  <section id="context" class="context-story" :class="{ 'context-instant': instant || reduced }" :aria-labelledby="`${id}-title`" @keydown.capture="settle(true)">
    <div class="context-inner">
      <header class="context-heading"><h2 :id="`${id}-title`">这一轮，还装得下多少。</h2><p>长对话走到哪，别只凭感觉。<br>看清本轮上下文占用，再决定下一步。</p></header>
      <div class="context-samples" role="group" aria-label="查看固定上下文采样示例"><span>Codex · 示例采样</span><button v-for="(item, index) in CONTEXT_SAMPLES" :key="item.id" type="button" :aria-pressed="current === index" @click="choose(index, $event)">{{ item.label }}</button></div>
      <div class="context-layout">
        <aside class="context-reading">
          <span class="context-reading-label">这一轮，还剩</span><div class="context-remaining" aria-live="polite"><strong>{{ summary.remainingPercent.toFixed(1) }}<small>%</small></strong><span>{{ compactToken(summary.remainingTokens).value }}{{ compactToken(summary.remainingTokens).unit }} Token 空间</span></div>
          <p class="context-sample-description">{{ sample.description }}</p>
          <div :id="`${id}-detail`" class="context-block-detail" aria-live="polite" aria-atomic="true"><div><Scan :size="14"/><span>第 {{ selected + 1 }} 格</span><small>0.5% 容量</small></div><strong>{{ detail.start.toLocaleString() }}<span>—</span>{{ detail.end.toLocaleString() }}</strong><span class="context-range-unit">Token 容量区间</span><dl><div><dt>已占用</dt><dd>{{ detail.occupied.toLocaleString() }}</dd></div><div><dt>空闲</dt><dd>{{ detail.free.toLocaleString() }}</dd></div></dl></div>
        </aside>
        <div class="context-native">
          <div class="context-native-heading"><strong><Grid3X3 :size="14"/>上下文占用</strong><span>最近主会话</span></div>
          <div class="context-native-value"><strong :style="{ color: summary.color }">{{ summary.usedPercent.toFixed(1) }}%</strong><span>{{ compactToken(sample.usedTokens).value }}{{ compactToken(sample.usedTokens).unit }} / {{ compactToken(sample.contextWindow).value }}{{ compactToken(sample.contextWindow).unit }}</span></div>
          <div class="context-grid-shell">
            <div ref="grid" class="context-capacity-grid" role="group" tabindex="0" aria-roledescription="容量方块图" :aria-describedby="`${id}-detail`" :aria-label="`上下文容量方块图。200格，每格0.5%。已占用 ${sample.usedTokens.toLocaleString()} Token，空闲 ${summary.remainingTokens.toLocaleString()} Token，总容量 ${sample.contextWindow.toLocaleString()} Token。方向键查看容量格。`" @pointermove="inspect" @pointerdown="inspect" @pointerleave="lensOpen = false" @pointerup="finishTouch" @pointercancel="lensOpen = false" @keydown="keydown" @focus="focusGrid" @blur="lensOpen = false">
              <div v-for="(slice, sliceIndex) in slices" :key="sliceIndex" :ref="element => setStrip(element, sliceIndex)" class="context-strip" :style="stripLayout(sliceIndex)" aria-hidden="true"><span v-for="index in slice" :key="index" class="context-pixel" :class="{ 'is-selected': selected === index && phase === 'flat' }"><i :style="{ backgroundColor: summary.color, transform: `scaleX(${contextBlock(sample, index).fill})` }"></i></span></div>
              <div v-show="lensOpen && phase === 'flat'" class="context-lens" :style="lensPosition" aria-hidden="true"><svg :viewBox="`0 0 ${span * 30} ${span * 30}`"><g v-for="cell in lensCells" :key="cell.index"><rect :x="cell.x * 30 + 1" :y="cell.y * 30 + 1" width="27" height="27" rx="2" fill="#8e8e931f" stroke="#8e8e9347" stroke-width=".5"/><rect v-if="cell.fill > 0" :x="cell.x * 30 + 1" :y="cell.y * 30 + 1" :width="27 * cell.fill" height="27" rx="2" :fill="summary.color"/><rect v-if="cell.index === selected" :x="cell.x * 30 + 1" :y="cell.y * 30 + 1" width="27" height="27" rx="2" fill="none" stroke="#171719" stroke-width="1.5"/></g></svg><span></span></div>
            </div>
          </div>
          <div class="context-native-legend"><div><i :style="{ backgroundColor: summary.color, borderColor: summary.color }"></i><span>已占用<strong>{{ compactToken(sample.usedTokens).value }}{{ compactToken(sample.usedTokens).unit }} Token</strong></span></div><div><i></i><span>空闲<strong>{{ compactToken(summary.remainingTokens).value }}{{ compactToken(summary.remainingTokens).unit }} Token</strong></span></div></div>
          <div class="context-native-times"><span>上次压缩 · {{ sample.lastCompactedAt }}</span><span>最后采样 {{ sample.observedAt }}</span></div>
        </div>
      </div>
      <div class="context-footnote"><span>200 格，呈现本轮上下文的占用与空闲。</span><span>每格 0.5% · 按从左至右、从上至下排列</span></div>
    </div>
  </section>
</template>

<style scoped>
.context-story { padding:70px max(5vw,24px) 75px; overflow:hidden; scroll-margin-top:76px; background:#101111; color:#f0ece5; font-family:'Space Grotesk Variable','PingFang SC',sans-serif; }
.context-inner { max-width:1280px; margin:auto; }.context-heading { display:flex; justify-content:space-between; align-items:center; gap:35px; margin-bottom:30px; }.context-heading h2 { margin:0; font-size:clamp(42px,4.3vw,56px); font-weight:550; letter-spacing:-.065em; line-height:1.14; }.context-heading p { margin:0; color:#aaa8a1; font-size:13px; line-height:1.85; }
.context-samples { display:flex; align-items:center; gap:24px; min-height:34px; margin-bottom:30px; }.context-samples>span { margin-right:auto; color:#8e908b; font-size:10px; letter-spacing:.02em; }.context-samples button { position:relative; padding:8px 0; border:0; background:none; color:#92958d; font-size:12px; cursor:pointer; }.context-samples button[aria-pressed='true'] { color:#f0ece5; }.context-samples button::after { position:absolute; content:''; bottom:0; left:0; right:0; height:2px; background:#ed3326; transform:scaleX(0); transform-origin:left; transition:transform 180ms; }.context-samples button[aria-pressed='true']::after { transform:scaleX(1); }
.context-layout { display:grid; grid-template-columns:minmax(0,.74fr) minmax(0,1.5fr); gap:clamp(35px,5vw,75px); align-items:center; }.context-reading { min-width:0; padding-top:10px; }.context-reading-label { color:#b3b6ae; font-size:13px; }.context-remaining { display:flex; flex-direction:column; gap:13px; margin:10px 0 25px; }.context-remaining>strong { white-space:nowrap; font-size:clamp(90px,9.4vw,132px); font-weight:500; letter-spacing:-.085em; line-height:1; font-variant-numeric:tabular-nums; }.context-remaining strong small { font-size:.42em; margin-left:4px; letter-spacing:-.03em; }.context-remaining>span { color:#b3b6ae; font-size:13px; font-variant-numeric:tabular-nums; }.context-sample-description { max-width:20em; margin:0; color:#a0a49b; font-size:12px; line-height:1.8; }
.context-block-detail { margin-top:40px; padding-left:18px; border-left:2px solid #ed3326; }.context-block-detail>div { display:flex; gap:8px; align-items:center; color:#f0ece5; font-size:11px; }.context-block-detail>div svg { color:#ed3326; }.context-block-detail>div small { color:#92968d; font-size:9px; margin-left:auto; }.context-block-detail>strong { display:flex; align-items:baseline; gap:9px; margin-top:15px; font-size:clamp(18px,1.9vw,25px); letter-spacing:-.04em; font-weight:500; white-space:nowrap; font-variant-numeric:tabular-nums; }.context-block-detail>strong>span { color:#777b72; font-size:16px; }.context-range-unit { display:block; margin-top:7px; color:#92968d; font-size:10px; }.context-block-detail dl { display:flex; gap:34px; margin:20px 0 0; }.context-block-detail dl>div { display:flex; flex-direction:column; gap:5px; }.context-block-detail dt { color:#92968d; font-size:10px; }.context-block-detail dd { margin:0; color:#dddcd5; font-size:16px; font-variant-numeric:tabular-nums; }
.context-native { min-width:0; padding:18px; border:1px solid #e4e4e4; border-radius:18px; background:#fff; color:#1c1c1e; font-family:-apple-system,BlinkMacSystemFont,'PingFang SC',sans-serif; box-shadow:0 25px 60px #0003; }.context-native-heading { display:flex; align-items:center; justify-content:space-between; gap:12px; }.context-native-heading>strong { display:flex; align-items:center; gap:7px; font-size:13px; font-weight:600; }.context-native-heading>span { color:#8e8e93; font-size:10px; }.context-native-value { display:flex; align-items:baseline; justify-content:space-between; gap:15px; margin-top:14px; }.context-native-value>strong { font-size:30px; font-weight:600; letter-spacing:-.5px; line-height:1.2; font-variant-numeric:tabular-nums; }.context-native-value>span { color:#8e8e93; font-size:11px; font-variant-numeric:tabular-nums; }
.context-grid-shell { position:relative; margin:28px 0 48px; }.context-capacity-grid { position:relative; width:100%; aspect-ratio:2/1; perspective:1000px; isolation:isolate; touch-action:pan-y; cursor:crosshair; }.context-strip { position:absolute; top:0; height:100%; display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); grid-template-rows:repeat(10,minmax(0,1fr)); gap:3px; transform-origin:center bottom; transform:translateY(48px); }.context-pixel { position:relative; display:block; min-width:0; border:.5px solid #8e8e9347; border-radius:1.5px; background:#8e8e931f; box-shadow:0 1px 0 #0001; }.context-pixel>i { display:block; position:absolute; inset:-.25px; border-radius:1.5px; transform-origin:left center; transition:transform 300ms cubic-bezier(.22,1,.36,1),background-color 300ms; }.context-pixel.is-selected { outline:1.5px solid #171719cc; outline-offset:.5px; }.context-capacity-grid:focus-visible { outline:2px solid #ed3326; outline-offset:7px; }
.context-lens { position:absolute; z-index:8; pointer-events:none; transform:translate(-50%,-50%); border:1.5px solid #171719; border-radius:50%; background:#fff; box-shadow:0 8px 20px #0003; overflow:hidden; clip-path:circle(50%); }.context-lens svg { display:block; width:100%; height:100%; }.context-lens>span { position:absolute; inset:0; border-radius:50%; box-shadow:inset 0 0 0 5px #fff9; }
.context-native-legend { display:flex; justify-content:space-between; gap:14px; }.context-native-legend>div { display:flex; align-items:flex-start; gap:6px; }.context-native-legend i { width:8px; height:8px; margin-top:3px; background:#8e8e931f; border:1px solid #8e8e9366; border-radius:2px; }.context-native-legend span { display:flex; flex-direction:column; gap:3px; color:#8e8e93; font-size:11px; }.context-native-legend strong { color:#29292b; font-size:11px; font-weight:400; font-variant-numeric:tabular-nums; }.context-native-times { display:flex; flex-wrap:wrap; justify-content:space-between; gap:6px 12px; margin-top:15px; color:#8e8e93; font-size:10px; font-variant-numeric:tabular-nums; }
.context-footnote { display:flex; justify-content:space-between; gap:20px; margin-top:35px; padding-top:20px; border-top:1px solid #f0ece51c; color:#858b7e; font-size:10px; }.context-story button:focus-visible { outline:2px solid #ed3326; outline-offset:5px; }.context-instant .context-pixel>i,.context-instant .context-samples button::after { transition:none; }
@media(max-width:1100px) { .context-heading { align-items:flex-start; }.context-heading h2 { max-width:13em; font-size:46px; }.context-heading p { min-width:21em; padding-top:5px; font-size:12px; }.context-layout { gap:35px; grid-template-columns:minmax(0,.7fr) minmax(0,1.4fr); }.context-remaining>strong { font-size:96px; }.context-block-detail>strong { font-size:18px; gap:6px; }.context-block-detail>div small { font-size:8px; } }
@media(max-width:760px) { .context-story { padding:65px 24px 70px; scroll-margin-top:64px; }.context-heading { display:block; margin-bottom:25px; }.context-heading h2 { max-width:10em; font-size:clamp(36px,7.6vw,54px); }.context-heading p { margin-top:20px; padding:0; min-width:0; font-size:12px; }.context-samples { gap:20px; margin-bottom:27px; flex-wrap:wrap; }.context-samples>span { flex-basis:100%; margin:0; font-size:9px; }.context-layout { display:grid; grid-template-columns:minmax(0,1fr); gap:35px; }.context-native { grid-row:1; }.context-reading { display:grid; grid-template-columns:1fr 1fr; gap:0 25px; padding:0; align-items:start; }.context-reading-label { grid-column:1; font-size:11px; }.context-remaining { grid-column:1; margin-top:10px; margin-bottom:15px; gap:10px; }.context-remaining>strong { font-size:clamp(68px,15vw,110px); }.context-remaining>span { font-size:10px; }.context-sample-description { grid-column:1; font-size:10px; }.context-block-detail { grid-column:2; grid-row:1/4; margin-top:0; padding-left:13px; }.context-block-detail>strong { flex-wrap:wrap; gap:5px; font-size:17px; }.context-block-detail>div { flex-wrap:wrap; font-size:10px; }.context-block-detail>div small { margin-left:0; }.context-block-detail dl { gap:22px; margin-top:16px; }.context-block-detail dd { font-size:14px; }.context-footnote { margin-top:30px; flex-direction:column; gap:7px; font-size:9px; } }
@media(max-width:420px) { .context-story { padding-inline:20px; }.context-native { padding:16px; }.context-native-heading>strong { font-size:12px; }.context-native-heading>span { font-size:9px; }.context-native-value>span { font-size:10px; }.context-native-value>strong { font-size:28px; }.context-grid-shell { margin:25px 0; }.context-native-times { flex-direction:column; font-size:9px; }.context-reading { gap:0 20px; }.context-remaining>strong { font-size:clamp(64px,17vw,76px); }.context-reading-label { font-size:10px; }.context-block-detail>strong { font-size:15px; }.context-block-detail>div small { flex-basis:100%; margin-left:22px; }.context-range-unit { font-size:9px; }.context-block-detail dl { gap:18px; } }
@media(prefers-reduced-motion:reduce) { .context-story *, .context-story *::before, .context-story *::after { transition:none!important; animation:none!important; } }
</style>
