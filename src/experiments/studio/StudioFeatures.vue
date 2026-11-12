<script setup lang="ts">
import { computed, type CSSProperties, type ObjectDirective } from 'vue'
import NativeShowcaseFrame from '../motion-video/scroll-story/NativeShowcaseFrame.vue'
import StudioFeatureDetails from './StudioFeatureDetails.vue'
import { STUDIO_CHAPTERS, STUDIO_HANDOFF, STUDIO_SCREEN_COUNT, studioHandoffPhase } from './chapters'

const props = defineProps<{ progress: number; staticView?: boolean }>()
const allCategories = [...new Set(STUDIO_CHAPTERS.flatMap(chapter => chapter.categoryIds))]
const clamp = (n: number) => Math.max(0, Math.min(1, n))
const ease = (n: number) => { const t = clamp(n); return t * t * (3 - 2 * t) }
const screen = computed(() => Math.min(Math.floor(Math.max(0, props.progress)), STUDIO_SCREEN_COUNT - 1))
const local = computed(() => props.progress - screen.value)
const phaseProgress = computed(() => screen.value > 0 ? studioHandoffPhase(local.value) : local.value)
const phase = (start: number, end: number) => ease((phaseProgress.value - start) / (end - start))

// The preview follows the cloth pass from its leading side. Angles are CSS gradient directions.
const handoffOrigins = [
  { x: 6, y: 27, angle: 199, show: .407 }, // Opening wool cover
  { x: -23, y: -12, angle: 113, show: .34 }, // Quota window
  { x: 18, y: -28, angle: 207, show: .34 }, // Reset cards
  { x: -18, y: -18, angle: 130, show: .34 }, // Token usage
  { x: 14, y: 26, angle: 319, show: .37 }, // Sessions and Agents
  { x: -19, y: 23, angle: 43, show: .37 }, // Task duration
  { x: -28, y: 3, angle: 85, show: .34 }, // Service directory
  { x: 3, y: 24, angle: 0, show: .36 }, // Local tools
  { x: -20, y: 18, angle: 54, show: .36 }, // Accounts
  { x: 22, y: -17, angle: 232, show: .34 }, // Menu bar
  { x: 16, y: 24, angle: 314, show: .34 }, // Settings
  { x: -3, y: -34, angle: 176, show: .35 }, // Share card
] as const
const origin = computed(() => handoffOrigins[screen.value] ?? handoffOrigins[0])
const cue = computed(() => screen.value === 0
  ? { take: .35, show: origin.value.show, visible: .49, copy: .42, rest: .55 }
  : { take: .28, show: origin.value.show, visible: .55, copy: origin.value.show + .038, rest: STUDIO_HANDOFF.rest })
const reveal = computed(() => phase(cue.value.show, cue.value.visible))
const incoming = computed(() => phase(cue.value.show, cue.value.show + (screen.value === 0 ? .052 : .075)))
const carry = computed(() => phase(cue.value.take, cue.value.rest))
const departure = computed(() => phase(.13, .40))
const outgoing = computed(() => screen.value > 0 ? 1 - phase(.17, .37) : 0)
const incomingCopy = computed(() => phase(cue.value.copy, cue.value.rest - .02))
const outgoingCopy = computed(() => screen.value > 0 ? 1 - phase(.15, .36) : 0)
const transitionCopy = computed(() => {
  const p = props.progress
  return ease((p - .242) / .039) * (1 - ease((p - .343) / .057))
})
const activeChapter = computed(() => {
  if (incoming.value >= outgoing.value && incoming.value > 0) return screen.value
  return outgoing.value > 0 ? screen.value - 1 : -1
})
const activeCopy = computed(() => incomingCopy.value >= outgoingCopy.value && incomingCopy.value > 0
  ? screen.value : outgoingCopy.value > 0 ? screen.value - 1 : -1)
const panels = computed(() => [
  { index: screen.value - 1, opacity: outgoing.value, travel: departure.value, entering: false },
  { index: screen.value, opacity: incoming.value, travel: 1 - carry.value, entering: true },
].filter(panel => panel.opacity > 0).map(panel => ({ ...panel, chapter: STUDIO_CHAPTERS[panel.index] })))

const motionPaths = {
  sweep: [-125, -16, 10, -4],
  fold: [-160, 43, 6, 6],
  slide: [-110, -7, 18, 3],
  lift: [-135, -24, 8, -5],
}

function revealMask(chapter: (typeof STUDIO_CHAPTERS)[number], progress: number) {
  if (chapter.id === 'studio-performance') {
    const radius = progress * 63
    const core = Math.max(0, radius - 12)
    return `linear-gradient(98deg, transparent ${50 - radius}%, #000 ${50 - core}%, #000 ${50 + core}%, transparent ${50 + radius}%)`
  }
  const feather = chapter.id === 'studio-reset' ? 7 : chapter.id === 'studio-quota' ? 12 : 18
  const edge = progress * (100 + feather)
  const stops = `#000 ${edge - feather}%, transparent ${edge}%`
  if (chapter.id === 'studio-clients') return `radial-gradient(ellipse farthest-corner at 52% 100%, ${stops})`
  return chapter.id === 'studio-workflow'
    ? `radial-gradient(ellipse farthest-corner at 100% 28%, ${stops})`
    : `linear-gradient(${origin.value.angle}deg, ${stops})`
}

function shotStyle(panel: typeof panels.value[number]): CSSProperties {
  const { opacity, travel, entering } = panel
  const { x, y } = origin.value
  const motion = STUDIO_CHAPTERS[screen.value].motion
  const [z, rx, ry, rz] = motionPaths[motion]
  const direction = entering ? 1 : -.6
  const side = Math.sign(x)
  return {
    '--x': `${x * direction * travel}%`, '--y': `${y * direction * travel}%`, '--z': `${z * travel}px`,
    '--rx': `${rx * direction * travel}deg`, '--ry': `${(screen.value === 0 ? 0 : ry) * side * direction * travel}deg`,
    '--rz': `${(screen.value === 0 ? -3 : rz * side) * direction * travel}deg`,
    '--shot-mask': entering && reveal.value < 1 ? revealMask(panel.chapter, reveal.value) : undefined,
    '--caption-opacity': 1 - ease(travel / .25),
    opacity,
  }
}

function copyStyle(i: number): CSSProperties {
  const entering = i === screen.value
  const leaving = i === screen.value - 1
  if (!entering && !leaving) return { visibility: 'hidden' }
  const { x, y } = origin.value
  const direction = entering ? 1 : -1
  const heading = entering ? incomingCopy.value : outgoingCopy.value
  const kicker = entering ? phase(cue.value.copy - .03, cue.value.rest - .045) : 1 - phase(.16, .36)
  const summary = entering ? phase(cue.value.copy + .035, cue.value.rest) : 1 - phase(.13, .33)
  return {
    '--kicker': kicker,
    '--heading': heading,
    '--summary': summary,
    '--copy-x': `${(screen.value === 0 ? -8 : x) * direction}px`,
    '--copy-y': `${(screen.value === 0 ? 26 : y * .8) * direction}px`,
    visibility: Math.max(kicker, heading, summary) > 0 ? 'visible' : 'hidden',
  }
}

const firstChapter = STUDIO_CHAPTERS[0]
const chapterNumber = (i: number) => String(i + 3).padStart(2, '0')
const shotObservers = new WeakMap<HTMLElement, ResizeObserver>()
const vFitShot: ObjectDirective<HTMLElement> = {
  mounted(shot) {
    const slot = shot.querySelector<HTMLElement>('.shot-body')!
    const frame = slot.querySelector<HTMLElement>('.shot-fit')!
    const figure = frame.querySelector<HTMLElement>('.native-showcase-frame')!
    const fit = () => {
      // Measure the untransformed view, including every section in the native window.
      const height = Math.max(0, slot.clientHeight - 2)
      shot.style.setProperty('--shot-base-width', `${slot.clientWidth}px`)
      const frameHeight = Math.max(1, frame.offsetHeight)
      const scale = Math.min(1, slot.clientWidth / Math.max(1, figure.offsetWidth), height / frameHeight)
      if (!scale) return
      shot.style.setProperty('--shot-fit', String(scale))
      shot.style.setProperty('--shot-width', `${figure.offsetWidth * scale}px`)
      shot.style.setProperty('--shot-offset', `${Math.min(42, (height - frameHeight * scale) * .4)}px`)
      shot.style.setProperty('--shot-visibility', 'visible')
    }
    const observer = new ResizeObserver(fit)
    observer.observe(slot)
    observer.observe(figure)
    shotObservers.set(shot, observer)
    fit()
  },
  unmounted(shot) {
    shotObservers.get(shot)?.disconnect()
    shotObservers.delete(shot)
  },
}
</script>

<template>
  <section id="studio-features" class="studio-features" :class="{ 'is-static': staticView }"
    :data-active-chapter="staticView || activeChapter < 0 ? undefined : STUDIO_CHAPTERS[activeChapter].id"
    tabindex="-1" aria-label="Donvis 功能">
    <article v-for="(chapter, i) in STUDIO_CHAPTERS" :id="chapter.id" :key="chapter.id"
      class="chapter-copy" :class="{ 'is-draped': !staticView && chapter.id === 'studio-accounts' }" :style="staticView ? undefined : copyStyle(i)"
      :aria-hidden="!staticView && activeCopy !== i ? true : undefined"
      :aria-labelledby="`${chapter.id}-title`">
      <div class="chapter-kicker"><span>{{ chapterNumber(i) }}</span><span>{{ chapter.label }}</span></div>
      <h2 :id="`${chapter.id}-title`">
        <template v-if="!staticView && chapter.id === 'studio-accounts'"><span v-for="(phrase, index) in chapter.title.match(/[^，]*，|[^，]+/g)" :key="index">{{ phrase }}</span></template>
        <template v-else>{{ chapter.title }}</template>
      </h2>
      <p>{{ chapter.summary }}</p>
      <NativeShowcaseFrame v-if="staticView" :view="chapter.view" :performance-view="chapter.performanceView" :caption="chapter.label + ' · 示例数据'" full-window />
      <div v-if="i === STUDIO_SCREEN_COUNT - 1" v-show="staticView || activeCopy === i" class="chapter-details">
        <StudioFeatureDetails :category-ids="allCategories" title="全部功能" trigger-label="查看全部功能" />
      </div>
    </article>

    <template v-if="!staticView">
      <div v-for="panel in panels" :key="panel.index" class="shot-stage" :data-shot-chapter="panel.index"
        :data-scarf-wrap="panel.chapter.id === 'studio-quota-window' ? '' : undefined"
        :data-shot-motion="panel.chapter.motion" :data-folding="panel.entering && panel.chapter.motion === 'fold' ? '' : undefined"
        :data-last="panel.index === STUDIO_SCREEN_COUNT - 1 ? '' : undefined">
        <div v-fit-shot class="studio-shot"
          :class="{ 'is-active-shot': panel.index === activeChapter, 'is-travelling': panel.travel > 0 }"
          :style="shotStyle(panel)"
          :aria-hidden="panel.index !== activeChapter ? true : undefined">
          <div class="shot-caption" aria-hidden="true">示例数据</div>
          <div class="shot-body">
            <div class="shot-fit">
              <NativeShowcaseFrame :view="panel.chapter.view" :performance-view="panel.chapter.performanceView" full-window />
            </div>
          </div>
        </div>
      </div>
    </template>

    <div v-if="!staticView && transitionCopy > 0" class="transition-copy" aria-hidden="true"
      :style="{ opacity: transitionCopy, transform: `translateY(${(1 - transitionCopy) * 12}px)` }">
      <span>{{ chapterNumber(0) }} / {{ firstChapter.label }}</span>
      <p>{{ firstChapter.title }}</p>
    </div>

    <div v-if="!staticView" class="chapter-track" :style="{ opacity: ease((progress - .40) / .12) }" aria-hidden="true">
      <span v-for="(chapter, i) in STUDIO_CHAPTERS" :key="chapter.id" :class="{ 'is-current': i === activeChapter }">
        <i :style="{ transform: `scaleX(${clamp(progress - i)})` }" />
      </span>
    </div>
  </section>
</template>

<style scoped>
.studio-features { position: absolute; inset: 0; pointer-events: none; outline: none; }
.chapter-copy { position: absolute; left: 7.5%; top: 29%; width: 26.5%; z-index: 5; }
.chapter-kicker { display: flex; align-items: center; gap: 11px; margin-bottom: 14px; color: #852f25; font-size: 13px; font-weight: 650; }
.chapter-kicker span:first-child { border-top: 1px solid currentColor; padding-top: 5px; font-variant-numeric: tabular-nums; }
.chapter-kicker span:last-child { padding-top: 6px; }
.chapter-copy h2 { margin: 0 0 .29em; font-size: clamp(34px, 3.75vw, 74px); line-height: 1.1; letter-spacing: -.058em; font-weight: 720; text-wrap: balance; }
.chapter-copy p { max-width: 23em; margin: 0; color: #564641; font-size: clamp(14px, 1.35vw, 20px); line-height: 1.65; }
.chapter-copy .chapter-kicker { --copy-alpha: var(--kicker, 1); }
.chapter-copy h2 { --copy-alpha: var(--heading, 1); }
.chapter-copy p { --copy-alpha: var(--summary, 1); }
.chapter-copy > :is(.chapter-kicker, h2, p), .chapter-copy.is-draped h2 span {
  opacity: var(--copy-alpha);
  translate: calc((1 - var(--copy-alpha)) * var(--copy-x, 0px)) calc((1 - var(--copy-alpha)) * var(--copy-y, 0px));
}
/* Keep both phrases in the same heading while the wool passes between their layers. */
.chapter-copy.is-draped { z-index: auto; }
.chapter-copy.is-draped h2 { opacity: 1; translate: none; }
.chapter-copy.is-draped h2 span { display: inline-block; position: relative; z-index: 3; }
.chapter-copy.is-draped :is(.chapter-kicker, p), .chapter-copy.is-draped h2 span:first-child { position: relative; z-index: 5; }
.chapter-details { margin-top: 20px; opacity: var(--summary, 1); }
.chapter-details :deep(.detail-trigger), .chapter-details :deep(dialog) { pointer-events: auto; }
.shot-stage { position: absolute; inset: 15% 6% 21% 36%; z-index: 3; }
.shot-stage:has(.is-travelling) { perspective: 960px; perspective-origin: 48% 43%; }
.shot-stage[data-folding]:has(.is-travelling) { perspective-origin: 55% 8%; }
.studio-shot { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; }
.studio-shot.is-travelling {
  transform: translate3d(calc(var(--x) * var(--travel-x-scale, 1)), calc(var(--y) * var(--travel-y-scale, 1)), var(--z))
    rotateX(var(--rx)) rotateY(var(--ry)) rotateZ(var(--rz));
}
.shot-stage[data-folding] .studio-shot.is-travelling { transform-origin: center 12%; }
.shot-caption { position: relative; top: var(--shot-offset, 0px); width: var(--shot-width, 100%); margin-bottom: 7px; color: #65504a; font-size: 11px; white-space: nowrap; opacity: var(--caption-opacity); }
.shot-body { position: relative; flex: 1 1 0; width: 100%; min-height: 0; }
.shot-fit {
  position: absolute; inset-inline: 0; top: calc(var(--shot-offset, 0px) / var(--shot-fit, 1)); margin-inline: auto;
  width: var(--shot-base-width, 100%); display: grid; justify-items: center;
  visibility: var(--shot-visibility, hidden); zoom: var(--shot-fit, 1);
}
@supports not (zoom: 1) {
  .shot-fit { inset-inline: auto; left: 50%; top: var(--shot-offset, 0px); transform: translateX(-50%) scale(var(--shot-fit, 1)); transform-origin: center top; }
}
.shot-body :deep(.native-showcase-frame) { border-radius: 14px; box-shadow: 0 8px 24px #37201d20; mask-image: var(--shot-mask, none); }
.shot-body :deep(.nsf-view-share) { max-width: min(100%, 500px); }
@media (hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference) {
  .shot-stage { --look-rx: -5deg; --look-ry: 5deg; --look-x: 7px; --look-y: 10px; }
  .shot-stage[data-shot-motion="lift"] { --look-rx: -3deg; --look-ry: 9deg; --look-x: 14px; --look-y: 5px; }
  .shot-stage[data-shot-motion="slide"] { --look-rx: -2deg; --look-ry: 3deg; --look-x: 17px; --look-y: 4px; }
  .shot-stage[data-shot-motion="fold"] { --look-rx: -8deg; --look-ry: 3deg; --look-x: 6px; --look-y: 11px; }
  .shot-body { transform-origin: center 36%; transition: transform .22s ease-out; }
  :global(.studio-stage.is-looking .studio-shot.is-active-shot:not(.is-travelling) .shot-body) {
    transform: translate(calc(var(--look-x) * var(--shot-pointer-x, 0)), calc(var(--look-y) * var(--shot-pointer-y, 0)))
      perspective(950px) rotateX(calc(var(--look-rx) * var(--shot-pointer-y, 0))) rotateY(calc(var(--look-ry) * var(--shot-pointer-x, 0)));
  }
}
.transition-copy { position: absolute; inset: 0; display: grid; place-content: center; z-index: 7; padding: 0 7%; text-align: center; color: #fff8ee; text-shadow: 0 2px 28px #340806b3, 0 1px 4px #310604bd; }
.transition-copy span { font-weight: 650; font-size: 13px; letter-spacing: .08em; }
.transition-copy p { margin: 13px 0 0; font-size: clamp(32px, 5.9vw, 94px); font-weight: 700; letter-spacing: -.065em; line-height: 1.16; }
.chapter-track { position: absolute; left: 7.5%; bottom: 23%; z-index: 5; display: flex; align-items: center; gap: 6px; }
.chapter-track span { width: clamp(8px, 1.5vw, 26px); height: 2px; background: #6e3f363d; }
.chapter-track i { display: block; height: 100%; background: #922e23; transform-origin: left; }
.chapter-track .is-current { background: #6e3f3669; }
.is-static { position: relative; padding: 24px 6% 100px; pointer-events: auto; background: #f8f2ea; }
.is-static .chapter-copy { position: relative; inset: auto; width: min(100%, 920px); margin: 0 auto; padding: 66px 0 35px; border-bottom: 1px solid #6e3f363d; }
.is-static .native-showcase-frame { margin-top: 25px; }
@media (max-width: 760px), (max-aspect-ratio: 3/2) {
  .chapter-copy { left: 6%; top: max(76px, 11%); width: 88%; }
  .chapter-kicker { margin-bottom: 7px; font-size: 11px; }
  .chapter-copy h2 { font-size: clamp(29px, 7.4vw, 52px); margin-bottom: .2em; }
  .chapter-copy p { font-size: clamp(13px, 2.8vw, 17px); max-width: 33em; line-height: 1.5; }
  .chapter-details { margin-top: 8px; }
  .chapter-details :deep(.detail-trigger) { min-height: 32px; font-size: 11px; padding: 5px 9px; }
  .shot-stage { inset: max(190px, 28%) 6% 24%; --travel-x-scale: .73; --travel-y-scale: .7; }
  .shot-stage:has(.is-travelling) { perspective: 740px; }
  .shot-stage[data-last] { top: max(226px, 28%); }
  .chapter-track { left: 6%; bottom: 19%; gap: 4px; }
}
@media (max-width: 760px) and (max-height: 680px) {
  .chapter-copy h2 { font-size: clamp(26px, 7.1vw, 38px); }
  .shot-stage { bottom: 22%; }
  .shot-stage[data-last] { top: 217px; }
}
@media (max-height: 590px) and (min-width: 761px) and (aspect-ratio > 3/2) {
  .chapter-copy { top: 27%; }
  .chapter-copy h2 { font-size: clamp(25px, 4.6vw, 45px); }
  .chapter-kicker { margin-bottom: 6px; }
  .shot-stage { top: 21%; }
}
@media (max-height: 500px) and (max-width: 760px) and (aspect-ratio > 3/2) {
  .chapter-copy { top: max(72px, 25%); width: 31%; }
  .chapter-copy h2 { font-size: clamp(23px, 4.7vw, 36px); }
  .shot-stage, .shot-stage[data-last] { inset: max(68px, 28%) 6% 24% 41%; }
}
</style>
