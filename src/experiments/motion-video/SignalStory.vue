<script setup lang="ts">
import { computed, getCurrentInstance, onBeforeUnmount, onMounted, ref } from 'vue'
import { BatteryFull, Bell, BellOff, ChevronDown, SlidersHorizontal, Wifi } from 'lucide-vue-next'
import DonvisMark from '../../components/DonvisMark.vue'
import { DEMO_PROVIDERS, PROVIDER_LOGOS, quotaColor, type DemoProvider } from '../../components/donvisDemoData'
import { SIGNAL_DURATION, signalFanPose, signalFrame, signalMaskRadius, signalNotice, signalSample, signalThresholds, type SignalNotice, type SignalScenario } from './signal-story'

// Native facts: SettingsView.swift:54–82/139–145/207–212;
// NotificationService.swift:52–114 and UsageNotificationDescriptor.swift:8–63.
// All inputs start isolated fixture trials. No Notification API, permission request,
// account lookup, or system notification is performed by this marketing scene.
// Primary motion is ported from MotionVideo's public MIT components, not a prompt:
// apps/web/src/components/feature-art.tsx (Motion) + styles/globals.css (mv-follow-path),
// components/sign-in-fan.tsx (260/22 spring, exact delay/geometry), ui/dialog.tsx (200ms/95%).
const id = `signals-${getCurrentInstance()?.uid ?? 0}`
const stage = ref<HTMLElement>(), quotaInput = ref<HTMLInputElement>(), menuSource = ref<HTMLElement>(), notificationArea = ref<HTMLElement>()
const remaining = ref(20), low = ref(30), critical = ref(15), enabled = ref(true)
const scenario = ref<SignalScenario>('quota')
const reduced = ref(false), active = ref(false), keyboard = ref(false)
const beat = ref(SIGNAL_DURATION), intro = ref(1)
const displayMode = ref('rotate'), rotationInterval = ref(10), showUsed = ref(false), compact = ref(false), rotationProvider = ref<DemoProvider>('claude')
const current = ref<SignalNotice | null>(signalNotice(signalSample('quota', 20), { enabled: true, low: 30, critical: 15 }))
const history = ref<SignalNotice[]>([
  signalNotice(signalSample('reset', 90), { enabled: true, low: 30, critical: 15 })!,
  signalNotice(signalSample('recovered', 72), { enabled: true, low: 30, critical: 15 })!,
])
const geometry = ref({ width: 1140, height: 330, inputX: 0, inputY: 230, inputWidth: 550, menuX: 890, menuY: 28, noticeWidth: 360, noticeHeight: 158, originX: 180, originY: -64, responsiveScale: 1 })
const samples = [
  { value: 20, scenario: 'quota', label: '偏低 20%' },
  { value: 10, scenario: 'quota', label: '严重 10%' },
  { value: 0, scenario: 'quota', label: '耗尽 0%' },
  { value: 72, scenario: 'recovered', label: '额度恢复' },
  { value: 90, scenario: 'reset', label: '官方重置' },
] as const
const ticks = Array.from({ length: 51 }, (_, index) => index * 2)
const state = computed(() => signalFrame(beat.value))
const menuProvider = computed<DemoProvider>(() => displayMode.value === 'codex' ? 'codex' : displayMode.value === 'claude' || displayMode.value === 'auto' ? 'claude' : rotationProvider.value)
const menuInfo = computed(() => DEMO_PROVIDERS[menuProvider.value])
const menuRemaining = computed(() => menuProvider.value === 'claude' ? remaining.value : DEMO_PROVIDERS.codex.windows[0]!.remaining)
const menuValue = computed(() => showUsed.value ? 100 - menuRemaining.value : menuRemaining.value)
const menuWindow = computed(() => menuProvider.value === 'claude' ? '5h' : '7d')
const signalColor = computed(() => !current.value ? '#9ba99e' : current.value.kind === 'recovered' || current.value.kind === 'reset' ? '#92dec5' : current.value.kind === 'low' ? '#ffc96d' : '#f74b3f')
const sourcePoint = computed(() => ({ x: geometry.value.inputX + 11 + Math.max(0, geometry.value.inputWidth - 22) * remaining.value / 100, y: geometry.value.inputY }))
const path = computed(() => {
  const a = sourcePoint.value, g = geometry.value
  return `M${a.x.toFixed(1)} ${a.y.toFixed(1)} C${a.x.toFixed(1)} ${(a.y + 78).toFixed(1)}, ${(g.menuX - 140).toFixed(1)} ${(g.menuY + 130).toFixed(1)}, ${g.menuX.toFixed(1)} ${g.menuY.toFixed(1)}`
})
const noticeStyle = computed(() => {
  const g = geometry.value
  // The reveal has 100px side/12px top padding to hold the source fan's spread.
  const origin = { x: g.originX + 100, y: g.originY + 12 }
  const radius = signalMaskRadius(g.noticeWidth + 200, g.noticeHeight + 54, origin)
  return { clipPath: state.value.mask < 1 ? `circle(${radius * state.value.mask}px at ${origin.x}px ${origin.y}px)` : 'none', opacity: state.value.mask, transform: `scale(${state.value.scale})`, transformOrigin: `${origin.x}px ${origin.y}px` }
})
const cards = computed(() => [
  { notice: history.value[0]!, offset: -1 },
  { notice: current.value, offset: 0 },
  { notice: history.value[1]!, offset: 1 },
].map(card => {
  const p = signalFanPose(card.offset, reduced.value ? SIGNAL_DURATION : beat.value, geometry.value.responsiveScale)
  return { ...card, style: { transform: `translate3d(${p.x}px,${p.y}px,0) rotate(${p.rotate}deg)`, zIndex: p.z, opacity: card.offset ? .28 : 1 } }
}))
let frame = 0, previousTime = 0, rotateElapsed = 0, entered = false, visible = false
let observer: IntersectionObserver | undefined, resize: ResizeObserver | undefined, media: MediaQueryList | undefined
function stop() { cancelAnimationFrame(frame); frame = 0; previousTime = 0 }
function start() { if (!frame && active.value) frame = requestAnimationFrame(tick) }
function tick(time: number) {
  frame = 0
  if (!active.value) { stop(); return }
  const dt = previousTime ? Math.min(64, time - previousTime) : 0
  previousTime = time
  beat.value = Math.min(SIGNAL_DURATION, beat.value + dt)
  intro.value = Math.min(1, intro.value + dt / 700)
  if (displayMode.value === 'rotate') {
    rotateElapsed += dt
    if (rotateElapsed >= rotationInterval.value * 1000) {
      rotateElapsed = 0
      rotationProvider.value = rotationProvider.value === 'claude' ? 'codex' : 'claude'
    }
  }
  if (beat.value < SIGNAL_DURATION || intro.value < 1 || displayMode.value === 'rotate') frame = requestAnimationFrame(tick)
}
function finish() { beat.value = SIGNAL_DURATION; intro.value = 1 }
function play(instant = false) {
  beat.value = instant || reduced.value || !active.value ? SIGNAL_DURATION : 0
  start()
}
function refreshPreview(instant = false, force = false) {
  const thresholds = signalThresholds(low.value, critical.value)
  low.value = thresholds.low; critical.value = thresholds.critical
  const next = signalNotice(signalSample(scenario.value, remaining.value), { enabled: enabled.value, ...thresholds })
  const changed = next?.kind !== current.value?.kind
  if (next && current.value && changed) history.value = [current.value, history.value[0]!]
  current.value = next
  if (next && (changed || force)) play(instant)
  else if (instant) finish()
}
function chooseSample(sample: typeof samples[number], event: MouseEvent) {
  scenario.value = sample.scenario; remaining.value = sample.value
  refreshPreview(event.detail === 0, true)
}
function quotaChanged(event: Event) { scenario.value = 'quota'; remaining.value = Number((event.target as HTMLInputElement).value); refreshPreview(keyboard.value) }
function thresholdChanged(which: 'low' | 'critical', event: Event) {
  const value = Number((event.target as HTMLInputElement).value)
  if (which === 'low') low.value = value; else critical.value = value
  refreshPreview(keyboard.value)
}
function toggleEnabled(event: MouseEvent) { enabled.value = !enabled.value; refreshPreview(event.detail === 0, true) }
function keyboardEntered() { keyboard.value = true; finish() }
function displayChanged() { rotateElapsed = 0; start() }
function measure() {
  if (!stage.value || !quotaInput.value || !menuSource.value || !notificationArea.value) return
  const root = stage.value.getBoundingClientRect(), input = quotaInput.value.getBoundingClientRect(), menu = menuSource.value.getBoundingClientRect(), notice = notificationArea.value.getBoundingClientRect()
  geometry.value = { width: root.width, height: root.height, inputX: input.left - root.left, inputY: input.top + input.height / 2 - root.top, inputWidth: input.width, menuX: menu.left + menu.width / 2 - root.left, menuY: menu.top + menu.height / 2 - root.top, noticeWidth: notice.width, noticeHeight: notice.height, originX: menu.left + menu.width / 2 - notice.left, originY: menu.top + menu.height / 2 - notice.top, responsiveScale: Math.min(1, root.width / 680) }
}
function sync() {
  active.value = visible && !document.hidden && !reduced.value
  if (active.value) start()
  else { stop(); finish() }
}
onMounted(() => {
  media = matchMedia('(prefers-reduced-motion: reduce)')
  const changed = () => { reduced.value = media?.matches ?? false; sync() }
  changed()
  media.addEventListener('change', changed)
  document.addEventListener('visibilitychange', sync)
  observer = new IntersectionObserver(([entry]) => {
    visible = !!entry?.isIntersecting
    sync()
    if (visible && !entered) { entered = true; if (!reduced.value && !document.hidden) { intro.value = 0; play() } }
  })
  observer.observe(stage.value!)
  resize = new ResizeObserver(measure)
  resize.observe(stage.value!); resize.observe(quotaInput.value!); resize.observe(menuSource.value!); resize.observe(notificationArea.value!)
  measure()
  cleanup = () => { media?.removeEventListener('change', changed); document.removeEventListener('visibilitychange', sync) }
})
let cleanup = () => {}
onBeforeUnmount(() => { stop(); observer?.disconnect(); resize?.disconnect(); cleanup() })
</script>

<template>
  <section id="signals" class="signal-story" :class="{ 'is-paused': !active, 'is-reduced': reduced }" :aria-labelledby="`${id}-title`" @keydown.capture="keyboardEntered" @keyup="keyboard = false" @pointerdown="keyboard = false">
    <div class="signal-inner">
      <header class="signal-heading"><h2 :id="`${id}-title`">该提醒时，<span>它会开口。</span></h2><p>偏低、耗尽、恢复，或官方确认重置。</p></header>
      <div ref="stage" class="signal-stage" :style="{ '--signal-color': signalColor }">
        <svg class="signal-route" :viewBox="`0 0 ${geometry.width} ${geometry.height}`" fill="none" aria-hidden="true">
          <path :d="path" stroke="currentColor" stroke-width="1.5" stroke-dasharray="4 4" opacity=".22" />
          <!-- Direct port: feature-art.tsx Motion + globals.css mv-follow-path (2.4s linear). -->
          <circle v-if="current && !reduced" class="signal-follow-path" cx="0" cy="0" r="7" :style="{ offsetPath: `path(&quot;${path}&quot;)`, offsetAnchor: 'center' }" />
        </svg>
        <div class="signal-instrument">
          <div class="signal-value"><div><span>Claude Code · 5 小时窗口</span><strong>{{ remaining }}<small>%</small></strong></div><p>剩余额度</p></div>
          <div class="signal-ruler" :style="{ clipPath: `inset(0 ${(1 - intro) * 100}% 0 0)` }" aria-hidden="true"><i v-for="tick in ticks" :key="tick" :class="{ 'is-major': tick % 10 === 0, 'is-filled': tick <= remaining }" :style="{ left: `${tick}%` }"></i><span v-for="tick in [0, 25, 50, 75, 100]" :key="`${tick}-label`" :style="{ left: `${tick}%` }">{{ tick }}</span><b class="signal-low-marker" :style="{ left: `${low}%` }">{{ low }}<small>{{ low === critical ? '提醒阈值' : '偏低' }}</small></b><b v-if="low !== critical" class="signal-critical-marker" :style="{ left: `${critical}%` }">{{ critical }}<small>严重</small></b></div>
          <input ref="quotaInput" class="signal-quota-range" type="range" min="0" max="100" step="1" :value="remaining" :style="{ '--value': `${remaining}%` }" aria-label="通知示例的剩余额度" :aria-valuetext="`剩余 ${remaining}%，${current?.title ?? '未触发提醒'}`" @input="quotaChanged" />
          <div class="signal-samples" role="group" aria-label="通知场景示例"><button v-for="sample in samples" :key="sample.label" type="button" :aria-pressed="remaining === sample.value && scenario === sample.scenario" @click="chooseSample(sample, $event)">{{ sample.label }}</button></div>
        </div>
        <div class="signal-receiver">
          <div class="signal-menubar" aria-label="菜单栏显示模式预览"><div class="signal-mac-menus" aria-hidden="true"><b></b><strong>Finder</strong></div><div ref="menuSource" class="signal-menu-source" :aria-label="`${menuInfo.name} ${menuWindow} ${showUsed ? '已用' : '剩余'} ${menuValue}%`"><svg viewBox="0 0 24 24" aria-hidden="true"><path :d="PROVIDER_LOGOS[menuProvider]" fill="currentColor" /></svg><span v-if="menuProvider !== 'codex'" :class="['signal-menu-title', { 'is-compact': compact }]">{{ compact ? menuInfo.shortName : menuInfo.name }}</span><span class="signal-menu-quota"><span>{{ menuWindow }}<b :style="{ color: quotaColor(menuRemaining) }">{{ menuValue }}%</b></span><i><em :style="{ width: `${menuValue}%`, background: quotaColor(menuRemaining) }"></em></i></span></div><div class="signal-mac-status" aria-hidden="true"><Wifi :size="13" /><BatteryFull :size="16" /><span>10:52</span></div></div>
          <div class="signal-notice-caption"><span>macOS 提醒</span><small>示例</small></div>
          <div ref="notificationArea" class="signal-notice-area" aria-live="polite" aria-atomic="true">
            <div v-if="current" class="signal-notice-reveal" :style="noticeStyle">
              <article v-for="card in cards" :key="card.offset" class="signal-notification" :style="card.style" :aria-hidden="card.offset !== 0 || undefined"><DonvisMark compact /><div><header><strong>Donvis</strong><span>{{ card.offset ? '示例' : '现在' }}</span></header><template v-if="card.notice"><h3>{{ card.notice.title }}</h3><p class="signal-notice-subtitle">{{ card.notice.subtitle }}</p><p>{{ card.notice.body }}</p></template></div></article>
            </div>
            <div v-else class="signal-quiet"><BellOff :size="26" /><p>{{ enabled ? '额度充足，保持安静。' : '提醒已关闭。' }}</p></div>
          </div>
        </div>
      </div>
      <div class="signal-settings">
        <article class="signal-native-card"><h3><Bell :size="14" />额度提醒</h3><div class="signal-native-body"><div class="signal-native-toggle"><span>低额度、耗尽和窗口重置通知</span><button type="button" class="signal-switch" role="switch" :aria-checked="enabled" aria-label="低额度、耗尽和窗口重置通知" @click="toggleEnabled"><i></i></button></div><template v-if="enabled"><div class="signal-native-threshold"><label :for="`${id}-low`">低额度</label><input :id="`${id}-low`" type="range" min="5" max="90" step="1" :value="low" aria-label="低额度剩余百分比" @input="thresholdChanged('low', $event)" /><output :for="`${id}-low`">{{ low }}%</output></div><div class="signal-native-threshold"><label :for="`${id}-critical`">严重不足</label><input :id="`${id}-critical`" type="range" min="1" :max="Math.min(50, low)" step="1" :value="critical" aria-label="严重不足剩余百分比" @input="thresholdChanged('critical', $event)" /><output :for="`${id}-critical`">{{ critical }}%</output></div></template></div></article>
        <article class="signal-native-card"><h3><SlidersHorizontal :size="14" />菜单栏与额度</h3><div class="signal-native-body"><div class="signal-native-toggle"><span>精简菜单栏</span><button type="button" class="signal-switch" role="switch" :aria-checked="compact" aria-label="精简菜单栏" @click="compact = !compact"><i></i></button></div><label class="signal-picker-row"><span>展示对象</span><span class="signal-select"><select v-model="displayMode" aria-label="菜单栏展示对象" @change="displayChanged"><option value="auto">自动选择</option><option value="rotate">轮播已接入服务</option><option value="codex">固定 Codex</option><option value="claude">固定 Claude</option></select><ChevronDown :size="10" /></span></label><label v-if="displayMode === 'rotate'" class="signal-picker-row"><span>轮播间隔</span><span class="signal-select"><select v-model.number="rotationInterval" aria-label="菜单栏轮播间隔" @change="displayChanged"><option v-for="seconds in [5, 10, 30, 60]" :key="seconds" :value="seconds">{{ seconds }} 秒</option></select><ChevronDown :size="10" /></span></label><div class="signal-picker-row"><span>额度数值</span><div class="signal-native-segments" role="group" aria-label="额度数值"><button type="button" :aria-pressed="!showUsed" @click="showUsed = false">剩余</button><button type="button" :aria-pressed="showUsed" @click="showUsed = true">已用</button></div></div></div></article>
      </div>
    </div>
  </section>
</template>

<style scoped>
.signal-story { position:relative;overflow:clip;padding:64px 5vw 68px;background:#171818;color:#f4f2ec;scroll-margin-top:75px; }.signal-inner { max-width:1152px;margin-inline:auto; }.signal-heading { display:flex;align-items:center;justify-content:space-between;gap:30px; }.signal-heading h2 { margin:0;font-size:clamp(40px,4.1vw,58px);font-weight:550;letter-spacing:-.06em;line-height:1.15; }.signal-heading h2 span { color:#f24b3c; }.signal-heading>p { margin:0;max-width:18em;font-size:14px;line-height:1.8;color:#a4a7a1; }
.signal-stage { position:relative;display:grid;grid-template-columns:minmax(0,1fr) 500px;align-items:center;gap:58px;min-height:342px;margin-top:38px;isolation:isolate; }.signal-route { position:absolute;z-index:0;inset:0;width:100%;height:100%;overflow:visible;color:var(--signal-color);pointer-events:none; }.signal-follow-path { fill:var(--signal-color);transform-box:fill-box;animation:signal-follow-path 2.4s linear infinite; }.is-paused .signal-follow-path { animation-play-state:paused; }@keyframes signal-follow-path { from { offset-distance:0%; } to { offset-distance:100%; } }
.signal-instrument { position:relative;z-index:1;min-width:0;padding-bottom:14px; }.signal-value { display:flex;align-items:flex-end;justify-content:space-between;gap:12px; }.signal-value>div>span { display:block;margin-bottom:5px;color:#a4a7a1;font-size:12px; }.signal-value strong { display:block;font-size:98px;font-weight:500;letter-spacing:-.065em;line-height:1;font-variant-numeric:tabular-nums; }.signal-value strong>small { margin-left:5px;font-size:37px;color:var(--signal-color); }.signal-value>p { margin:0 0 12px;color:#a4a7a1;font-size:13px; }.signal-ruler { position:relative;height:84px;margin-top:12px;margin-inline:11px; }.signal-ruler>i { position:absolute;top:27px;width:1px;height:13px;background:#f8f5ea27; }.signal-ruler>i.is-major { height:24px;top:16px; }.signal-ruler>i.is-filled { background:var(--signal-color); }.signal-ruler>span { position:absolute;top:53px;transform:translateX(-50%);color:#8e948c;font-size:10px;font-variant-numeric:tabular-nums; }.signal-ruler>span:first-of-type { transform:translateX(0); }.signal-ruler>span:last-of-type { transform:translateX(-100%); }.signal-ruler>i:last-of-type { transform:translateX(-1px); }.signal-ruler>b { position:absolute;z-index:1;top:6px;height:44px;border-left:1px solid currentColor;padding-left:6px;font-size:11px;font-weight:500; }.signal-ruler>b>small { display:block;margin-top:6px;font-size:10px; }.signal-low-marker { color:#ffd38c; }.signal-critical-marker { color:#fb695b; }.signal-quota-range { position:relative;z-index:2;display:block;appearance:none;width:100%;height:22px;margin:0;padding:0;border:0;border-radius:0;background:transparent;cursor:ew-resize; }.signal-quota-range::-webkit-slider-runnable-track { height:4px;border-radius:3px;background:linear-gradient(to right,var(--signal-color) 0 var(--value),#f4f2ec24 var(--value) 100%); }.signal-quota-range::-moz-range-track { height:4px;border-radius:3px;background:#f4f2ec24; }.signal-quota-range::-moz-range-progress { height:4px;background:var(--signal-color); }.signal-quota-range::-webkit-slider-thumb { appearance:none;width:22px;height:22px;margin-top:-9px;border:5px solid #f4f2ec;border-radius:50%;background:#1c201e;box-shadow:0 0 0 1px #0000001f; }.signal-quota-range::-moz-range-thumb { width:12px;height:12px;border:5px solid #f4f2ec;border-radius:50%;background:#1c201e; }.signal-quota-range:focus-visible { outline:2px solid #f9f5eb;outline-offset:6px; }.signal-samples { display:flex;gap:7px;flex-wrap:wrap;margin-top:22px; }.signal-samples>button { padding:8px 11px;min-height:34px;border:1px solid #f5f4ec25;border-radius:20px;background:#242827;color:#b6bdb5;font:inherit;font-size:11px;cursor:pointer; }.signal-samples>button[aria-pressed=true] { border-color:var(--signal-color);color:#f4f2ec;background:#343733; }.signal-samples>button:hover { color:#fff;border-color:#f5f4ec70; }.signal-samples>button:focus-visible { outline:2px solid #f4f2ec;outline-offset:4px; }
.signal-receiver { position:relative;z-index:1;min-width:0;align-self:stretch;padding-top:5px; }.signal-menubar { position:relative;display:flex;align-items:center;justify-content:space-between;min-height:35px;padding:0 12px;border:1px solid #ffffff09;border-radius:7px;background:#e8e8e4;color:#1a1d1b;font:10px -apple-system,BlinkMacSystemFont,'PingFang SC',sans-serif; }.signal-mac-menus,.signal-mac-status { display:flex;align-items:center;gap:10px; }.signal-mac-menus>b { font-size:18px; }.signal-mac-menus>strong { font-weight:600; }.signal-mac-status { gap:8px; }.signal-menu-source { position:absolute;left:50%;top:1px;transform:translateX(-50%);display:flex;align-items:center;gap:6px;min-height:32px;padding:2px 6px;border-radius:5px;background:#00000009; }.signal-menu-source>svg { flex:none;width:20px;height:20px; }.signal-menu-title { font-size:11px;font-weight:500;width:68px;overflow:hidden;white-space:nowrap; }.signal-menu-title.is-compact { width:40px; }.signal-menu-quota { display:grid;gap:2px;width:84px;font-size:9px; }.signal-menu-quota>span { display:flex;justify-content:space-between;gap:8px; }.signal-menu-quota b { font-size:11px; }.signal-menu-quota>i { height:2px;background:#00000016;border-radius:2px;overflow:hidden; }.signal-menu-quota em { display:block;height:100%; }.signal-notice-caption { display:flex;align-items:center;justify-content:space-between;margin:23px auto 14px;width:min(360px,100%);color:#9a9f97;font-size:11px; }.signal-notice-caption>small { font-size:10px;color:#788077; }.signal-notice-area { position:relative;width:min(360px,calc(100% - 16px));height:175px;margin-inline:auto; }.signal-notice-reveal { position:absolute;inset:-12px -100px -42px;pointer-events:none; }.signal-notification { position:absolute;top:12px;left:100px;display:flex;align-items:flex-start;gap:12px;box-sizing:border-box;width:calc(100% - 200px);min-height:148px;padding:14px;border:1px solid #ffffffa6;border-radius:17px;background:#f8f8f4;color:#191c19;box-shadow:0 22px 36px #00000024,0 2px 5px #00000015;transform-origin:50% 100%;font-family:-apple-system,BlinkMacSystemFont,'PingFang SC',sans-serif; }.signal-notification>:deep(svg) { flex:none;width:35px;height:35px; }.signal-notification>div { flex:1;min-width:0; }.signal-notification header { display:flex;justify-content:space-between;gap:12px;margin-bottom:6px;font-size:10px;color:#6e766c; }.signal-notification header>strong { font-weight:500; }.signal-notification header>span { font-size:9px; }.signal-notification h3 { margin:0 0 6px;font-size:12px;font-weight:600;line-height:1.5; }.signal-notification p { margin:5px 0 0;color:#697165;font-size:11px;line-height:1.65; }.signal-notification .signal-notice-subtitle { color:#252c23;font-size:12px; }.signal-quiet { display:grid;justify-items:center;align-content:center;gap:10px;height:148px;border:1px dashed #dfe9d425;border-radius:17px;color:#b2bcae; }.signal-quiet>p { margin:0;font-size:13px; }
.signal-settings { display:grid;grid-template-columns:1fr 1fr;align-items:start;gap:22px;margin-top:25px; }.signal-native-card { min-width:0;padding:17px 18px 18px;border:1px solid #ffffff15;border-radius:17px;background:#f3f3f3;color:#20231f;font-family:-apple-system,BlinkMacSystemFont,'PingFang SC',sans-serif; }.signal-native-card>h3 { display:flex;align-items:center;gap:7px;margin:0 0 11px;font-size:13px;font-weight:600; }.signal-native-body { min-height:130px;padding:0 13px;border-radius:11px;background:#fff; }.signal-native-toggle { display:flex;align-items:center;justify-content:space-between;gap:16px;min-height:43px;font-size:12px; }.signal-switch { flex:none;position:relative;width:30px;height:18px;padding:0;border:0;border-radius:20px;background:#c4c9c1;cursor:pointer; }.signal-switch[aria-checked=true] { background:#087e70; }.signal-switch>i { position:absolute;top:2px;left:2px;width:14px;height:14px;border-radius:50%;background:#fff;box-shadow:0 1px 3px #00000023; }.signal-switch[aria-checked=true]>i { left:14px; }.signal-native-threshold { display:flex;align-items:center;gap:12px;min-height:42px;border-top:1px solid #0000000c;font-size:12px; }.signal-native-threshold>label { flex:none;width:60px; }.signal-native-threshold>input { flex:1;min-width:0;width:100%;margin:0;accent-color:#087e70;cursor:pointer; }.signal-native-threshold>output { flex:none;width:36px;text-align:right;font-size:11px;font-variant-numeric:tabular-nums; }.signal-picker-row { display:flex;align-items:center;justify-content:space-between;gap:15px;min-height:43px;font-size:12px; }.signal-picker-row+.signal-picker-row,.signal-native-toggle+.signal-picker-row { border-top:1px solid #0000000c; }.signal-select { position:relative;display:inline-flex;align-items:center;min-width:85px; }.signal-select>select { appearance:none;min-width:85px;max-width:175px;min-height:25px;padding:3px 23px 3px 9px;border:1px solid #00000019;border-radius:5px;background:#fff;box-shadow:0 1px 2px #00000009;color:#272d24;font:inherit;font-size:11px;cursor:pointer; }.signal-select>svg { pointer-events:none;position:absolute;right:7px; }.signal-native-segments { display:flex;gap:2px;padding:2px;border-radius:6px;background:#00000009; }.signal-native-segments>button { min-height:24px;padding:3px 13px;border:0;border-radius:5px;background:transparent;color:#697165;font:inherit;font-size:11px;cursor:pointer; }.signal-native-segments>button[aria-pressed=true] { color:#20251c;background:#fff;box-shadow:0 1px 3px #00000017; }.signal-native-card :is(button,select,input):focus-visible { outline:2px solid #345fd1;outline-offset:3px; }
@media(max-width:1100px) and (min-width:761px) { .signal-stage { grid-template-columns:minmax(0,1fr) 430px;gap:30px; }.signal-menu-title { display:none; }.signal-samples { gap:6px; }.signal-samples>button { padding-inline:9px; } }
@media(max-width:760px) { .signal-story { padding:60px 24px 64px; }.signal-heading { flex-direction:column;align-items:flex-start;gap:15px; }.signal-heading h2 { font-size:clamp(37px,6.6vw,50px); }.signal-heading>p { max-width:none; }.signal-stage { grid-template-columns:1fr;gap:40px;margin-top:30px; }.signal-instrument { padding-bottom:0; }.signal-value strong { font-size:88px; }.signal-receiver { min-height:286px;padding-top:0; }.signal-menu-title { display:block; }.signal-settings { grid-template-columns:1fr;gap:16px;margin-top:2px; }.signal-notice-area { width:min(360px,calc(100% - 12px)); }.signal-native-body { min-height:130px; } }
@media(max-width:420px) { .signal-story { padding:52px 20px 58px;scroll-margin-top:64px; }.signal-heading h2 { font-size:36px; }.signal-heading h2>span { display:block; }.signal-heading>p { font-size:13px; }.signal-stage { gap:32px; }.signal-value strong { font-size:78px; }.signal-value>div>span { font-size:11px; }.signal-value>p { font-size:12px; }.signal-samples { gap:7px 6px;margin-top:20px; }.signal-samples>button { min-height:36px;padding:8px 10px;font-size:11px; }.signal-menu-title { display:none; }.signal-mac-status>svg { display:none; }.signal-menubar { padding-inline:9px; }.signal-mac-menus { gap:8px; }.signal-notification { gap:9px;padding:12px; }.signal-notification>:deep(svg) { width:29px;height:29px; }.signal-native-card { padding:15px 12px; }.signal-native-body { padding-inline:10px; }.signal-native-toggle { gap:10px;font-size:11px; }.signal-native-threshold { gap:8px; }.signal-native-threshold>label { width:54px; }.signal-select>select { max-width:165px; } }
.is-reduced .signal-follow-path { display:none; }.is-reduced .signal-notice-reveal { clip-path:none!important;opacity:1!important;transform:none!important; }
@media(prefers-reduced-motion:reduce) { .signal-follow-path { display:none; } }
</style>
