<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch, type CSSProperties } from 'vue'
import { ArrowDown, ArrowUpRight, Github, Hand, Pause, Play, RotateCcw } from 'lucide-vue-next'
import Lenis from 'lenis'
import { Color } from 'three'
import DonvisMark from '../../components/DonvisMark.vue'
import { site } from '../../data/site'
import appUrl from './app-overview.png'
import woolUrl from '../../assets/scarf-wool-v2.png'
import brandIconUrl from '../../../design/preproduction/references/brand-icon-original.png'
import { createStudioScene } from './scene'
import { markDockStart, studioBackground, studioFinaleDockOpacity, studioFinaleEnd, studioFinaleMark, studioFinaleStart, studioMarkDock } from './pose'
import StudioFeatures from './StudioFeatures.vue'
import { STUDIO_SCREEN_COUNT, studioChapterProgress, studioChapterRun, studioHandoffPhase } from './chapters'

const story = ref<HTMLElement>()
const openingTrack = ref<HTMLElement>()
const chapterTrack = ref<HTMLElement>()
const stage = ref<HTMLElement>()
const host = ref<HTMLElement>()
const character = ref<HTMLElement>()
const brandIcon = ref<HTMLImageElement>()
const heroSlogan = ref<HTMLHeadingElement>()
const characterRun = ref(0)
const progress = ref(0)
const chapterProgress = ref(0)
const exploring = computed(() => chapterProgress.value > .12 || still.value && progress.value === 1)
const ready = ref(false)
const failed = ref(false)
const motion = matchMedia('(prefers-reduced-motion: reduce)')
const reduced = ref(motion.matches)
const paused = ref(false)
const touchDrag = ref(false)
let scene: ReturnType<typeof createStudioScene> | undefined
let lenis: Lenis | undefined
let observer: ResizeObserver | undefined
let frame = 0
let characterReplay: ReturnType<typeof setTimeout> | undefined
let shotPointerRest: ReturnType<typeof setTimeout> | undefined
let disposed = false
let sceneVersion = 0
const still = computed(() => reduced.value || failed.value)
const characterActive = computed(() => ready.value && !still.value && !paused.value
  && (progress.value <= markDockStart || chapterProgress.value >= studioFinaleEnd - .09))
const ease = (x: number) => { const t = Math.min(1, Math.max(0, x)); return t * t * (3 - 2 * t) }
const heroHold = .09
const finaleRunScale = .70
const finaleHold = .20
const chapterRunCount = studioChapterRun(studioFinaleStart + (studioFinaleEnd - studioFinaleStart) * finaleRunScale) + finaleHold
const dockProgress = computed(() => studioMarkDock(progress.value))
const finaleDockOpacity = computed(() => studioFinaleDockOpacity(chapterProgress.value))
const returning = computed(() => studioFinaleMark(chapterProgress.value))
const portrait = computed(() => finaleDockOpacity.value > 0 ? ease((returning.value - .50) / .44) : 1)
const badgeOpacity = computed(() => finaleDockOpacity.value > 0
  ? finaleDockOpacity.value * (1 - portrait.value)
  : ease((dockProgress.value - .08) / .32))
const heroPhrases = computed(() => still.value ? [0, 0, 0, 0] : [
  ease((progress.value - .022) / .155),
  ease((progress.value - .052) / .166),
  ease((progress.value - .063) / .165),
  ease((progress.value - .088) / .172),
])
const heroExit = computed(() => heroPhrases.value[3])
const productEnter = computed(() => ease((progress.value - .79) / .15))
const productExit = computed(() => ease((chapterProgress.value - .12) / .11))
const productCopy = computed(() => productEnter.value * (1 - productExit.value))
const woolCover = computed(() => ease((chapterProgress.value - .20) / .07) * (1 - ease((chapterProgress.value - .395) / .032)))
const featureExit = computed(() => ease((chapterProgress.value - studioFinaleStart - .04) / .30))
const closingLines = computed(() => {
  const local = chapterProgress.value - studioFinaleStart
  return [ease((local - .60) / .32), ease((local - .72) / .34), ease((local - .87) / .37)]
})
const chapterPapers = [
  '#f7eee2', '#f8ebdf', '#f4e8df',
  '#f1ebf5', '#f3ebf3', '#efe7f1',
  '#e8eeeb', '#e9efe7', '#e5edeb',
  '#f6e7e1', '#f7eae4', '#f5e5df',
  '#f5c977',
].map(color => new Color(color))
const palette = computed<CSSProperties>(() => {
  const chapter = Math.min(chapterPapers.length - 1, Math.floor(chapterProgress.value))
  const previous = chapter === 0 ? studioBackground(progress.value) : chapterPapers[chapter - 1].clone()
  const local = chapterProgress.value - chapter
  const phase = chapter > 0 && chapter < studioFinaleStart ? studioHandoffPhase(local) : local
  const blend = chapter === studioFinaleStart ? ease((phase - .05) / .47) : ease((phase - .19) / .23)
  return {
    '--paper': previous.lerp(chapterPapers[chapter], blend).getStyle(),
    '--halo': `${46 * Math.max(1 - progress.value, closingLines.value[0])}%`,
    '--wool-cover': `${100 * woolCover.value}%`,
    '--opening-length': 1 + heroHold,
    '--chapter-count': chapterRunCount,
  }
})

watch(characterActive, active => { if (!active) clearTimeout(characterReplay) })

function scheduleCharacterReplay() {
  clearTimeout(characterReplay)
  if (!characterActive.value) return
  characterReplay = setTimeout(() => {
    if (characterActive.value) characterRun.value++
  }, 5000)
}

function chapterRun() { return Math.max(1, (chapterTrack.value?.offsetHeight ?? 0) / chapterRunCount) }

function syncScroll() {
  frame = 0
  if (!story.value) return
  const distance = -story.value.getBoundingClientRect().top
  if (still.value) {
    progress.value = distance >= story.value.offsetHeight - innerHeight ? 1 : 0
    chapterProgress.value = 0
    return
  }
  const opening = Math.max(1, openingTrack.value?.offsetHeight ?? 0)
  const run = Math.max(0, (distance - opening) / chapterRun())
  const chapter = studioChapterProgress(run)
  // Give the wrap its full choreography over a shorter scroll distance.
  const finale = (chapter - studioFinaleStart) / finaleRunScale
  progress.value = Math.min(1, Math.max(0, distance / opening * (1 + heroHold) - heroHold))
  chapterProgress.value = chapter <= studioFinaleStart ? chapter : Math.min(studioFinaleEnd, studioFinaleStart + finale)
  scene?.setProgress(progress.value)
  scene?.setChapterProgress(chapterProgress.value)
}
function onScroll() { if (!frame) frame = requestAnimationFrame(syncScroll) }
function focusTarget(target: HTMLElement) {
  syncScroll()
  void nextTick(() => { if (!disposed) target.focus({ preventScroll: true }) })
}
function goToProduct(event: Event) {
  event.preventDefault()
  const target = document.getElementById('studio-product')
  if (!story.value || !target) return
  const top = still.value ? target.getBoundingClientRect().top + scrollY - 110 : story.value.getBoundingClientRect().top + scrollY + (openingTrack.value?.offsetHeight ?? 0)
  if (lenis) lenis.scrollTo(top, { duration: 1.8, onComplete: () => focusTarget(target) })
  else { window.scrollTo({ top, behavior: 'instant' }); focusTarget(target) }
}
function goToStart(event: Event) {
  event.preventDefault()
  if (!story.value) return
  const target = story.value
  if (lenis) lenis.scrollTo(0, { duration: 1.5, onComplete: () => focusTarget(target) })
  else { window.scrollTo({ top: 0, behavior: 'instant' }); focusTarget(target) }
}
function goToFeatures(event: Event) {
  const target = document.getElementById('studio-features')
  if (!target || !story.value) return
  event.preventDefault()
  const top = still.value
    ? target.getBoundingClientRect().top + scrollY - 80
    : story.value.getBoundingClientRect().top + scrollY + (openingTrack.value?.offsetHeight ?? 0)
      + chapterRun() * studioChapterRun(.60)
  if (lenis && !paused.value) lenis.scrollTo(top, { duration: 1.15, onComplete: () => focusTarget(target) })
  else {
    window.scrollTo({ top, behavior: 'instant' })
    focusTarget(target)
  }
}
function resetShotPointer() {
  clearTimeout(shotPointerRest)
  stage.value?.classList.remove('is-looking')
  stage.value?.style.removeProperty('--shot-pointer-x')
  stage.value?.style.removeProperty('--shot-pointer-y')
  stage.value?.style.removeProperty('--slogan-pointer-x')
  stage.value?.style.removeProperty('--slogan-pointer-y')
}
function moveShotPointer(event: PointerEvent) {
  if (still.value || paused.value || event.pointerType !== 'mouse' || event.buttons) return
  const target = event.target
  if (target instanceof Element && (target.closest('dialog, button, a') ||
    target instanceof HTMLCanvasElement && target.style.cursor === 'grab')) {
    resetShotPointer()
    return
  }
  if (progress.value < .10) {
    const bounds = heroSlogan.value?.getBoundingClientRect()
    if (!bounds?.width || !bounds.height) return
    const x = 2 * (event.clientX - bounds.left) / bounds.width - 1
    const y = 2 * (event.clientY - bounds.top) / bounds.height - 1
    if (Math.abs(x) > 1 || Math.abs(y) > 1) {
      resetShotPointer()
      return
    }
    stage.value?.style.setProperty('--slogan-pointer-x', x.toFixed(3))
    stage.value?.style.setProperty('--slogan-pointer-y', y.toFixed(3))
    return
  }
  if (chapterProgress.value < .3) return
  const shot = stage.value?.querySelector('.is-active-shot')?.getBoundingClientRect()
  if (!shot?.width || !shot.height) return
  const x = 2 * (event.clientX - shot.left) / shot.width - 1
  const y = 2 * (event.clientY - shot.top) / shot.height - 1
  if (Math.abs(x) > 1 || Math.abs(y) > 1) {
    resetShotPointer()
    return
  }
  stage.value?.style.setProperty('--shot-pointer-x', x.toFixed(3))
  stage.value?.style.setProperty('--shot-pointer-y', y.toFixed(3))
  stage.value?.classList.add('is-looking')
  clearTimeout(shotPointerRest)
  shotPointerRest = setTimeout(resetShotPointer, 360)
}
function toggleMotion() {
  paused.value = !paused.value
  if (paused.value) resetShotPointer()
  scene?.setPaused(paused.value)
}
function toggleTouchDrag() { touchDrag.value = !touchDrag.value; scene?.setTouchDrag(touchDrag.value) }
function stopScene() {
  sceneVersion++
  clearTimeout(characterReplay)
  resetShotPointer()
  scene?.dispose()
  scene = undefined
  lenis?.destroy()
  lenis = undefined
  ready.value = false
  touchDrag.value = false
}
function useStatic(error: unknown) {
  console.warn('Donvis studio uses its static preview:', error)
  failed.value = true
  stopScene()
}

function paceWheel(input: { deltaY: number; event: WheelEvent | TouchEvent }) {
  const { event, deltaY } = input
  if (!lenis || !(event instanceof WheelEvent) || event.ctrlKey || !deltaY) return true
  if (event.defaultPrevented) return false
  if (event.target instanceof Element && event.target.closest('[data-lenis-prevent], [data-lenis-prevent-wheel]')) return true

  const direction = Math.sign(deltaY)
  const lead = Math.min(230, Math.max(145, innerHeight * .245))
  const magnitude = Math.abs(deltaY)
  const travel = magnitude * (1 + .12 * ease((magnitude - 30) / 70))
  // Drop queued travel in the other direction as soon as the reader reverses.
  const pending = Math.max(0, direction * (lenis.targetScroll - lenis.animatedScroll))
  const target = lenis.animatedScroll + direction * Math.min(lead, pending + travel)
  input.deltaY = target - lenis.targetScroll
  if (input.deltaY) return true
  if (event.cancelable) event.preventDefault()
  return false
}

async function startScene() {
  if (disposed || still.value || !host.value) return
  const version = ++sceneVersion
  await nextTick()
  if (disposed || still.value || version !== sceneVersion || !host.value || !character.value || !brandIcon.value) return
  try {
    const current = createStudioScene(host.value, {
      app: appUrl, wool: woolUrl, character: character.value, dock: brandIcon.value,
      featureCard: () => stage.value?.querySelector<HTMLElement>('[data-scarf-wrap] .native-showcase-frame') ?? null,
    })
    scene = current
    current.setPaused(paused.value)
    syncScroll()
    await current.ready
    if (disposed || version !== sceneVersion) return
    ready.value = true
    lenis = new Lenis({ autoRaf: true, lerp: .115, smoothWheel: true, virtualScroll: paceWheel })
  } catch (error) {
    if (!disposed && version === sceneVersion) useStatic(error)
  }
}
function syncMotion() {
  const focusedCanvas = host.value?.contains(document.activeElement)
  reduced.value = motion.matches
  if (motion.matches) {
    stopScene()
    if (focusedCanvas && story.value) focusTarget(story.value)
  } else { void startScene() }
}
onMounted(async () => {
  window.addEventListener('scroll', onScroll, { passive: true })
  window.addEventListener('resize', onScroll)
  motion.addEventListener('change', syncMotion)
  observer = new ResizeObserver(onScroll)
  if (story.value) observer.observe(story.value)
  await document.fonts.ready
  if (disposed) return
  await startScene()
  syncScroll()
})
onBeforeUnmount(() => {
  disposed = true
  cancelAnimationFrame(frame)
  observer?.disconnect()
  window.removeEventListener('scroll', onScroll)
  window.removeEventListener('resize', onScroll)
  motion.removeEventListener('change', syncMotion)
  stopScene()
})
</script>

<template>
  <main class="studio" :class="{ 'is-still': still, 'is-ready': ready }" :style="palette" lang="zh-CN">
    <a class="studio-skip" href="#studio-product" @click="goToProduct">跳到 App 展示</a>
    <header class="studio-header" :class="{ 'is-exploring': exploring }">
      <a class="studio-brand" href="#" aria-label="Donvis，回到开场" @click="goToStart">
        Donvis
        <img ref="brandIcon" class="studio-brand-icon" :class="{ 'is-docked': still || dockProgress === 1 }"
          :style="{ opacity: !still && finaleDockOpacity > 0 ? 1 - finaleDockOpacity : undefined }" :src="brandIconUrl" alt="" />
      </a>
      <nav aria-label="主导航">
        <a class="studio-features-link" href="#studio-features" @click="goToFeatures">功能</a>
        <a class="studio-github" :href="site.githubUrl" target="_blank" rel="noopener noreferrer" aria-label="GitHub"><Github :size="21" /></a>
        <a class="studio-download" :href="site.releaseUrl" target="_blank" rel="noopener noreferrer">下载 macOS <span><ArrowUpRight :size="18" /></span></a>
      </nav>
    </header>

    <section ref="story" class="studio-story" tabindex="-1" aria-label="Donvis">
      <div v-if="!still" class="studio-timeline" aria-hidden="true">
        <div ref="openingTrack" class="studio-opening-track"></div>
        <div ref="chapterTrack" class="studio-chapter-track"></div>
      </div>
      <div ref="stage" class="studio-stage" @pointermove="moveShotPointer" @pointerdown="resetShotPointer" @pointerleave="resetShotPointer">
        <div v-show="!still" ref="host" class="studio-canvas" :class="{ 'is-loaded': ready }" @studio-error="useStatic"></div>
        <div v-if="!still" v-show="dockProgress < 1 || finaleDockOpacity > 0" ref="character" class="studio-character"
          :class="{ 'is-docking': dockProgress > .12 && returning < 1 }" aria-hidden="true">
          <DonvisMark :key="characterRun" :animate="characterActive" :style="{ opacity: portrait }" studio expressive @complete="scheduleCharacterReplay" />
          <img class="studio-flight-icon" :src="brandIconUrl" :style="{ opacity: badgeOpacity }" alt="" />
        </div>
        <h1 ref="heroSlogan" class="studio-slogan" :style="{ visibility: heroExit === 1 ? 'hidden' : 'visible' }">
          <span class="slogan-line"><span class="slogan-phrase" :style="{ '--phrase-travel': heroPhrases[0] }">让你的</span><span class="slogan-phrase" :style="{ '--phrase-travel': heroPhrases[1] }"><span class="slogan-agent" lang="en">Agent</span>，</span></span>
          <span class="slogan-line"><span class="slogan-phrase" :style="{ '--phrase-travel': heroPhrases[2] }">像驴一样</span><span class="slogan-phrase" :style="{ '--phrase-travel': heroPhrases[3] }"><span class="slogan-work">拉磨</span>。</span></span>
        </h1>
        <div v-if="still" class="studio-static-mark"><DonvisMark cutout /></div>

        <section id="studio-product" class="studio-product-target" tabindex="-1" :inert="!still && (progress < .8 || chapterProgress > .16) || undefined" aria-label="App 展示">
          <img v-if="still" class="studio-static-app" :src="appUrl" alt="Donvis 的 Codex 分析界面，展示额度、重置时间和账号资源。画面使用示例数据。" />
          <div v-else v-show="productCopy > 0" class="studio-product-copy"
            :style="{ opacity: productCopy, transform: `translateY(${(1 - productEnter) * 20 - productExit * 24}px)` }">
            <span>02 <span>App 总览</span></span>
            <h2>Agent 用量，一眼看清。</h2>
          </div>
        </section>
        <StudioFeatures v-if="!still" v-show="featureExit < 1" :progress="Math.min(chapterProgress, STUDIO_SCREEN_COUNT)"
          :style="{ opacity: 1 - featureExit }" :inert="featureExit === 1 || undefined" />

        <section v-if="!still" v-show="closingLines[0] > 0" class="studio-finale" aria-labelledby="studio-finale-title">
          <h2 id="studio-finale-title">
            <span class="slogan-line"><span class="slogan-phrase" :style="{ '--phrase-reveal': closingLines[0] }">让它们拉磨。</span></span>
            <span class="slogan-line"><span class="slogan-phrase" :style="{ '--phrase-reveal': closingLines[1] }">把精力，</span><span class="slogan-phrase" :style="{ '--phrase-reveal': closingLines[2] }"><em>留给创造</em>。</span></span>
          </h2>
        </section>

        <a v-if="!still" class="studio-down" href="#studio-product" aria-label="查看 App" :style="{ opacity: 1 - heroExit, visibility: heroExit >= .99 ? 'hidden' : 'visible' }" @click="goToProduct"><ArrowDown :size="22" /></a>
        <div v-if="!still && ready" class="studio-tools">
          <button class="studio-touch" type="button" :aria-label="touchDrag ? '切回页面滑动' : '拖动围巾'" :title="touchDrag ? '切回页面滑动' : '拖动围巾'" :aria-pressed="touchDrag" @click="toggleTouchDrag"><Hand :size="18" /></button>
          <button type="button" aria-label="重置围巾" title="重置围巾" @click="scene?.reset()"><RotateCcw :size="16" /></button>
          <button type="button" :aria-label="paused ? '恢复自动动效' : '暂停自动动效'" :title="paused ? '恢复自动动效' : '暂停自动动效'" :aria-pressed="paused" @click="toggleMotion"><Play v-if="paused" :size="16" /><Pause v-else :size="16" /></button>
        </div>
        <p class="studio-sr" role="status">{{ failed ? '三维展示无法加载，已显示静态内容。' : !ready && !still ? '正在加载三维展示。' : '' }}</p>
        <p v-if="!still" id="studio-instructions" class="studio-sr">按住围巾可拖动。聚焦场景后，可用方向键拉动，Escape 松开。</p>
      </div>
    </section>
    <StudioFeatures v-if="still" :progress="0" static-view />
    <section v-if="still" class="studio-finale studio-finale-static" aria-labelledby="studio-finale-static-title">
      <h2 id="studio-finale-static-title">让它们拉磨。<br>把精力，<em>留给创造</em>。</h2>
      <DonvisMark cutout />
    </section>
  </main>
</template>

<style scoped>
.studio { --ink: #201c17; background: var(--paper); color: var(--ink); font-family: 'Space Grotesk Variable', 'PingFang SC', 'Microsoft YaHei', sans-serif; -webkit-font-smoothing: antialiased; }
.studio :deep(*) { box-sizing: border-box; }
.studio :deep(button), .studio :deep(a) { -webkit-tap-highlight-color: transparent; }
.studio :deep(a:focus-visible), .studio :deep(button:focus-visible), .studio :deep(canvas:focus-visible) { outline: 2px solid currentColor; outline-offset: 7px; }
.studio-header { position: fixed; inset: 0 0 auto; height: 104px; display: flex; align-items: center; justify-content: space-between; padding: 0 5.6%; z-index: 20; pointer-events: none; }
.studio-header.is-exploring { background: linear-gradient(to bottom, color-mix(in srgb, var(--paper) calc(60% - .6 * var(--wool-cover)), transparent), transparent); color: color-mix(in srgb, #fff6eb var(--wool-cover), var(--ink)); }
.studio-header > * { pointer-events: auto; }
.studio-brand { display: inline-flex; align-items: center; gap: 8px; font-size: 31px; font-weight: 650; letter-spacing: -1.8px; line-height: 1; }
.studio-brand-icon { width: 31px; height: 31px; }
.studio-brand-icon { display: block; border-radius: 24%; opacity: 0; }
.studio-brand-icon.is-docked { opacity: 1; }
.studio-header nav { display: flex; align-items: center; gap: 25px; }
.studio-features-link { font-size: 14px; font-weight: 640; padding: 10px 4px; }
.studio-features-link:hover { color: #90291f; }
.studio-github { width: 44px; height: 44px; display: grid; place-items: center; }
.studio-download { display: flex; align-items: center; gap: 20px; height: 49px; padding: 5px 5px 5px 22px; border-radius: 30px; background: #20282a; color: #fff9f0; font-size: 13px; }
.studio-download > span { display: grid; place-items: center; border-radius: 50%; width: 38px; height: 38px; background: #fff9f0; color: #20282a; transition: transform .2s; }
.studio-download:hover > span { transform: rotate(45deg); }
.studio-story { --opening-run: 232svh; --opening-span: calc(var(--opening-run) * var(--opening-length)); --chapter-run: max(102svh, 732px); height: calc(100svh + var(--opening-span) + var(--chapter-run) * var(--chapter-count)); position: relative; outline: none; }
.studio-timeline { position: absolute; inset: 0 0 auto; pointer-events: none; }
.studio-opening-track { height: var(--opening-span); }
.studio-chapter-track { height: calc(var(--chapter-run) * var(--chapter-count)); }
.studio-stage { height: 100svh; position: sticky; top: 0; overflow: hidden; background: radial-gradient(ellipse at 65% 36%, color-mix(in srgb, white var(--halo), var(--paper)), var(--paper) 72%); }
.studio-canvas { position: absolute; inset: 0; z-index: 4; opacity: 0; transition: opacity .65s; }
.studio-canvas.is-loaded { opacity: 1; }
.studio-canvas :deep(canvas) { display: block; }
.studio-character { position: absolute; top: 0; left: 0; width: 1254px; height: 1254px; transform-origin: 0 0; pointer-events: none; z-index: 3; opacity: 0; transition: opacity .65s; }
.studio-character.is-docking { z-index: 6; }
.studio-flight-icon { position: absolute; inset: 0; width: 100%; height: 100%; border-radius: 24%; }
.is-ready .studio-character { opacity: 1; }
.studio-slogan { position: absolute; top: 46%; left: 5.6%; transform: translateY(-50%); margin: 0; z-index: 5; color: var(--ink); font-size: clamp(42px, 5.15vw, 106px); line-height: 1.18; font-weight: 700; letter-spacing: -.065em; pointer-events: none; }
.slogan-line { display: block; white-space: nowrap; margin: -.08em -.12em; padding: .08em .12em; overflow: clip; }
.slogan-phrase { display: inline-block; }
.slogan-agent { margin-inline-start: .07em; color: #343b91; letter-spacing: -.055em; }
.slogan-work { color: #962c20; }
.studio-slogan .slogan-phrase {
  --drift-x: -.28em; --drift-y: -.72em; --turn: -4deg;
  opacity: calc(1 - var(--phrase-travel));
  clip-path: inset(-.10em -.12em calc(-.10em + 72% * var(--phrase-travel)) -.12em);
  transform: translate(calc(var(--drift-x) * var(--phrase-travel)), calc(var(--drift-y) * var(--phrase-travel))) rotate(calc(var(--turn) * var(--phrase-travel)));
}
.studio-slogan .slogan-phrase:last-child { --drift-x: .34em; --drift-y: -.98em; --turn: 5deg; }
.studio-slogan .slogan-line:last-child .slogan-phrase:first-child { --drift-x: -.43em; --drift-y: -.57em; --turn: -7deg; }
.studio-slogan .slogan-line:last-child .slogan-phrase:last-child { --drift-x: .17em; --drift-y: -.85em; --turn: -4deg; }
@media (prefers-reduced-motion: no-preference) {
  .studio:not(.is-still) .studio-slogan .slogan-line { animation: studio-slogan-arrive .43s cubic-bezier(.21, .78, .31, 1) backwards; }
  .studio:not(.is-still) .studio-slogan .slogan-line:last-child { --entry-x: -.14em; animation-delay: .07s; }
  @keyframes studio-slogan-arrive {
    from { opacity: 0; translate: var(--entry-x, .08em) .42em; clip-path: inset(0 0 84% 0); }
    to { opacity: 1; translate: 0 0; clip-path: inset(0); }
  }
}
@media (hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference) {
  .studio-slogan :is(.slogan-agent, .slogan-work) {
    display: inline-block;
    translate: calc(var(--slogan-pointer-x, 0) * var(--pointer-drift, 4px)) calc(var(--slogan-pointer-y, 0) * 3px);
    transition: translate .20s ease-out;
  }
  .studio-slogan .slogan-work { --pointer-drift: -4px; }
}
.studio-down { position: absolute; bottom: 9%; left: 5.6%; width: 53px; height: 53px; display: grid; place-items: center; border-radius: 50%; background: #fff9e7; color: var(--ink); z-index: 7; transition: background .2s; }
.studio-down:hover { background: white; }
.studio-product-target { position: absolute; inset: 0; pointer-events: none; outline: none; }
.studio-product-copy { position: absolute; z-index: 5; left: 5.6%; top: 34%; width: 19%; }
.studio-product-copy > span { display: inline-flex; gap: 11px; padding-top: 5px; border-top: 1px solid currentColor; color: #852f25; font-size: 13px; font-weight: 650; }
.studio-product-copy h2 { margin: .35em 0 0; font-size: clamp(28px, 3.05vw, 60px); line-height: 1.12; letter-spacing: -.065em; text-wrap: balance; }
.studio-finale { position: absolute; inset: 0; z-index: 5; display: flex; align-items: center; padding: 0 5.6% 8svh; pointer-events: none; }
.studio-finale h2 { margin: 0; font-size: clamp(38px, 4.75vw, 94px); font-weight: 700; line-height: 1.17; letter-spacing: -.065em; }
.studio-finale .slogan-phrase {
  --arrival: calc(1 - var(--phrase-reveal));
  --mask-left: 0%; --mask-right: 86%; --drift-x: -.28em; --drift-y: .66em; --turn: -4deg;
  opacity: min(1, calc(var(--phrase-reveal) * 2.3));
  clip-path: inset(calc(-.1em + 26% * var(--arrival)) calc(-.12em + var(--mask-right) * var(--arrival)) -.1em calc(-.12em + var(--mask-left) * var(--arrival)));
  transform: translate(calc(var(--drift-x) * var(--arrival)), calc(var(--drift-y) * var(--arrival))) rotate(calc(var(--turn) * var(--arrival)));
}
.studio-finale .slogan-line:last-child .slogan-phrase:first-child { --mask-left: 76%; --mask-right: 0%; --drift-x: -.20em; --drift-y: .54em; --turn: 3deg; }
.studio-finale .slogan-line:last-child .slogan-phrase:last-child { --drift-x: .30em; --drift-y: .92em; --turn: -6deg; }
.studio-finale em { color: #962c20; font-style: normal; }
.studio-finale-static { position: relative; z-index: auto; min-height: 80svh; justify-content: center; gap: 8%; padding: 12svh 6%; }
.studio-finale-static :deep(svg) { width: min(38%, 440px); }
.studio-tools { position: absolute; right: 4%; bottom: 30px; z-index: 8; display: flex; gap: 8px; }
.studio-tools button { display: grid; place-items: center; width: 40px; height: 40px; border: 1px solid #20282a20; border-radius: 50%; background: #fff9f0bd; color: #20282a; transition: background .2s; }
.studio-tools button:hover, .studio-tools button[aria-pressed=true] { background: #fff9f0; }
.studio-tools .studio-touch { display: none; }
.studio-skip { position: fixed; left: 20px; top: 12px; z-index: 30; padding: 12px; color: #fff9f0; background: #20282a; transform: translateY(-150%); }
.studio-skip:focus { transform: translateY(0); }
.studio-sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
.studio-static-mark, .studio-static-app { display: none; }
.is-still { --paper: #f6d080 !important; }
.is-still .studio-story { height: auto; }
.is-still .studio-stage { position: relative; height: auto; padding: 160px 6% 100px; display: grid; grid-template-columns: 1fr 1fr; gap: 100px 50px; align-items: center; }
.is-still .studio-slogan { position: static; color: var(--ink); font-size: clamp(32px, 3.7vw, 60px); width: 100%; transform: none; }
.is-still .studio-static-mark { display: block; width: 75%; justify-self: center; }
.is-still .studio-product-target { position: static; grid-column: 1 / -1; justify-self: center; width: min(900px, 100%); }
.is-still .studio-static-app { display: block; width: 100%; border-radius: 9px; }
@media (max-width: 760px), (max-aspect-ratio: 3/2) {
  .studio-header { height: 82px; padding: 0 6%; }
  .studio-brand { font-size: 27px; }
  .studio-brand-icon { width: 27px; height: 27px; }
  .studio-header nav { gap: 8px; }
  .studio-github { display: none; }
  .studio-download { height: 43px; padding-left: 16px; gap: 12px; font-size: 12px; }
  .studio-download > span { width: 33px; height: 33px; }
  .studio-story { --opening-run: 215svh; }
  .studio-stage { background: radial-gradient(ellipse at 50% 36%, color-mix(in srgb, white var(--halo), var(--paper)), var(--paper) 74%); }
  .studio-slogan { top: 76.5%; left: 0; width: 100%; font-size: clamp(31px, min(11.1vw, 6.1vh), 60px); line-height: 1.16; text-align: center; }
  .studio-down { bottom: 24px; left: 6%; width: 48px; height: 48px; }
  .studio-product-copy { left: 8%; top: max(88px, 13%); width: 84%; }
  .studio-product-copy > span { font-size: 11px; }
  .studio-product-copy h2 { font-size: clamp(29px, 6.8vw, 52px); }
  .studio-finale { align-items: flex-start; justify-content: center; padding: 75svh 4% 0; text-align: center; }
  .studio-finale h2 { font-size: clamp(29px, min(8.7vw, 6.4vh), 58px); }
  .studio-finale-static { flex-direction: column-reverse; align-items: center; padding: 14svh 6% 12svh; gap: 18px; }
  .studio-finale-static :deep(svg) { width: min(70%, 350px); }
  .studio-tools { right: 6%; bottom: 24px; }
  .studio-tools button { width: 44px; height: 44px; }
  .studio-tools .studio-touch { display: grid; }
  .is-still .studio-stage { grid-template-columns: 1fr; padding: 150px 7% 80px; gap: 50px; }
  .is-still .studio-slogan { font-size: clamp(32px, 10vw, 60px); }
  .is-still .studio-static-mark { width: 65%; grid-row: 1; }
}
@media (max-width: 359px) {
  .studio-header nav { gap: 5px; }
  .studio-download { gap: 0; padding-inline: 13px; height: 38px; }
  .studio-download > span { display: none; }
}
@media (prefers-reduced-motion: reduce) {
  .studio :deep(*) { animation: none !important; transition: none !important; scroll-behavior: auto; }
}
</style>
