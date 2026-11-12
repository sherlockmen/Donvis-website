<script setup lang="ts">
import { getCurrentInstance, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import originalIcon from '../../design/preproduction/references/brand-icon-original.png'
import { studioFarEar, studioNearEar as nearEar, studioHeadSilhouette } from './donvisOutline'

const props = withDefaults(defineProps<{ animate?: boolean; compact?: boolean; cutout?: boolean; expressive?: boolean; hideScarf?: boolean; studio?: boolean }>(), {
  animate: false,
  compact: false,
  cutout: false,
  expressive: false,
  hideScarf: false,
  studio: false,
})
const emit = defineEmits<{ complete: [] }>()

const id = `donvis-mark-${getCurrentInstance()?.uid ?? 0}`
const duration = 4600
const playing = ref(false)
const playback = ref(0)
const reducedMotion = ref(false)
let completion: ReturnType<typeof setTimeout> | undefined
let media: MediaQueryList | undefined
let mounted = false
let imageLoader: HTMLImageElement | undefined
let imageReady = false
let imageFailed = false

function play() {
  clearTimeout(completion)
  playing.value = false
  if (!mounted || !props.animate || (!imageReady && !imageFailed)) return

  playback.value += 1
  playing.value = imageReady && !reducedMotion.value
  completion = setTimeout(() => {
    playing.value = false
    emit('complete')
  }, playing.value ? duration : 0)
}

function updateMotionPreference() {
  reducedMotion.value = media?.matches ?? false
  play()
}

watch(() => props.animate, play, { flush: 'sync' })

onMounted(() => {
  mounted = true
  media = window.matchMedia('(prefers-reduced-motion: reduce)')
  media.addEventListener('change', updateMotionPreference)
  updateMotionPreference()
  imageLoader = new Image()
  imageLoader.onload = () => {
    imageReady = true
    play()
  }
  imageLoader.onerror = () => {
    imageFailed = true
    play()
  }
  imageLoader.src = originalIcon
})

onBeforeUnmount(() => {
  mounted = false
  clearTimeout(completion)
  media?.removeEventListener('change', updateMotionPreference)
  if (imageLoader) imageLoader.onload = imageLoader.onerror = null
})

// These small cuts reuse the original artwork, including its inner ear and scarf shading.
const farEar = 'M327 186 C312 273 328 356 377 400 L453 456 L518 414 C466 313 389 233 327 186Z'
const scarfTail = 'M988 792 L1083 797 L1001 902 L934 869Z'
const eye = 'M510 587 L609 555 C629 577 631 614 614 638 C595 666 560 663 536 644 C515 626 509 609 510 587Z'
const smile = 'M294 887 C340 875 392 851 417 817'
const smirk = 'M294 887 C350 899 421 840 438 766'
const scarfCutout = 'M1082 796 989 790 1013 753 1023 731 1019 730 883 776 772 820 620 887 500 946 448 979 466 1083 446 1144 541 1166 637 1167 750 1048 853 961 1007 913 993 903 1049 841Z'
const neckFill = 'M520 830 892 813 971 1018 894 1082 637 1169 502 1157Z'
const headOnlySilhouette = 'M367 527 555 399 676 433 686 348 737 344 707 389 880 436 821 474 970 548 894 590 1011 674 975 696 1023 730 892 813 971 1018 894 1082 637 1169 502 1157 501 947 519 834 432 909 319 937 275 900 232 835 231 764 239 721 367 590Z'
</script>

<template>
  <svg
    class="donvis-mark"
    :class="{ 'is-playing': playing, 'is-compact': compact, 'is-expressive': expressive }"
    :style="{ '--mark-duration': `${duration}ms` }"
    viewBox="0 0 1254 1254"
    fill="none"
    role="img"
    aria-label="Donvis 红围巾小驴"
  >
    <defs>
      <clipPath :id="`${id}-silhouette`">
        <path v-if="studio" :d="studioHeadSilhouette" />
        <template v-else>
          <path :d="farEar" /><path :d="nearEar" />
          <path v-if="hideScarf" :d="headOnlySilhouette" />
          <path v-else d="M367 527 555 399 676 433 686 348 737 344 707 389 880 436 821 474 970 548 894 590 1011 674 975 696 1023 730 988 793 1083 797 1001 902 1007 912 949 933 971 1018 894 1082 637 1169 448 1146 466 1085 449 978 501 947 519 834 432 909 319 937 275 900 232 835 231 764 239 721 367 590Z" />
        </template>
      </clipPath>
      <clipPath :id="`${id}-far-ear`"><path :d="studio ? studioFarEar : farEar" /></clipPath>
      <clipPath :id="`${id}-near-ear`"><path :d="nearEar" /></clipPath>
      <mask v-if="hideScarf && !studio" :id="`${id}-no-scarf`" maskUnits="userSpaceOnUse" x="0" y="0" width="1254" height="1254">
        <rect width="1254" height="1254" fill="white" />
        <path :d="scarfCutout" fill="black" stroke="black" stroke-width="8" stroke-linejoin="round" />
      </mask>
    </defs>
    <g v-if="studio" :key="`studio-ears-${playback}`">
      <image :class="playing ? 'mark-ear mark-ear-far' : undefined" :href="originalIcon" width="1254" height="1254" :clip-path="`url(#${id}-far-ear)`" />
      <image :class="playing ? 'mark-ear mark-ear-near' : undefined" :href="originalIcon" width="1254" height="1254" :clip-path="`url(#${id}-near-ear)`" />
    </g>
    <path v-if="hideScarf && !studio" :d="neckFill" fill="#090909" />
    <template v-if="playing" :key="playback">
      <defs>
        <clipPath :id="`${id}-tail`"><path :d="scarfTail" /></clipPath>
        <clipPath :id="`${id}-eye`"><path :d="eye" /></clipPath>
        <clipPath :id="`${id}-anchors`">
          <path d="M441 449 511 405 526 425 452 469Z M532 424 679 426 682 452 608 479Z" />
        </clipPath>
        <mask :id="`${id}-base`" maskUnits="userSpaceOnUse" x="0" y="0" width="1254" height="1254">
          <rect width="1254" height="1254" fill="white" />
          <template v-if="playing">
            <path v-if="!studio" :d="farEar" fill="black" />
            <path v-if="!studio" :d="nearEar" fill="black" />
            <path v-if="!cutout && !studio" :d="scarfTail" fill="black" />
            <path :d="eye" fill="black" stroke="black" :stroke-width="expressive ? 8 : 0" />
            <path :d="smile" stroke="black" stroke-width="23" stroke-linecap="round" />
          </template>
        </mask>
      </defs>

      <g :clip-path="cutout || studio ? `url(#${id}-silhouette)` : undefined" :mask="hideScarf && !studio ? `url(#${id}-no-scarf)` : undefined">
        <image :href="originalIcon" width="1254" height="1254" />
        <template v-if="playing">
          <path v-if="!studio" :d="farEar" fill="white" />
          <path v-if="!studio" :d="nearEar" fill="white" />
          <path v-if="!cutout && !studio" :d="scarfTail" fill="white" />
          <path :d="eye" fill="#090909" stroke="#090909" :stroke-width="expressive ? 10 : 2" />
          <path :d="smile" stroke="white" stroke-width="23" stroke-linecap="round" />
        </template>
        <image :href="originalIcon" width="1254" height="1254" :mask="`url(#${id}-base)`" />
        <template v-if="playing">
          <g v-if="!cutout && !studio" class="mark-scarf-tail">
            <image :href="originalIcon" width="1254" height="1254" :clip-path="`url(#${id}-tail)`" />
          </g>
          <g v-if="!studio" class="mark-ear mark-ear-far">
            <image :href="originalIcon" width="1254" height="1254" :clip-path="`url(#${id}-far-ear)`" />
          </g>
          <g v-if="!studio" class="mark-ear mark-ear-near">
            <image :href="originalIcon" width="1254" height="1254" :clip-path="`url(#${id}-near-ear)`" />
          </g>
          <image :href="originalIcon" width="1254" height="1254" :clip-path="`url(#${id}-anchors)`" />
          <g class="mark-eye">
            <image :href="originalIcon" width="1254" height="1254" :clip-path="`url(#${id}-eye)`" />
          </g>
          <path class="mark-wink" d="M521 598 Q565 615 610 578" stroke="white" stroke-width="12" stroke-linecap="round" />
          <path class="mark-smile" :d="smile" stroke="#090909" stroke-width="14" stroke-linecap="round" />
          <path v-if="expressive" class="mark-smirk" :d="smirk" stroke="#090909" stroke-width="17" stroke-linecap="round" />
          <path v-if="expressive" class="mark-smirk-crease" d="M429 764 Q445 756 454 769" stroke="#090909" stroke-width="8" stroke-linecap="round" />
        </template>
      </g>


      <!-- Every spark starts at the same visible eye corner. -->
      <g v-if="playing" transform="translate(615 578)" stroke="#b97c24" stroke-width="1.5" stroke-linejoin="round">
        <g class="mark-star mark-star-one" fill="#fff3c4"><path d="M0-36 9-9 36 0 9 9 0 36-9 9-36 0-9-9Z" /></g>
        <g class="mark-star mark-star-two" fill="#f4cc78"><path d="M0-29 7-7 29 0 7 7 0 29-7 7-29 0-7-7Z" /></g>
        <g class="mark-star mark-star-three" fill="#fff5d6"><path d="M0-23 6-6 23 0 6 6 0 23-6 6-23 0-6-6Z" /></g>
      </g>
    </template>
    <image v-else :href="originalIcon" width="1254" height="1254" :clip-path="cutout || studio ? `url(#${id}-silhouette)` : undefined" :mask="hideScarf && !studio ? `url(#${id}-no-scarf)` : undefined" />
  </svg>
</template>

<style scoped>
.donvis-mark {
  display: block;
  width: 100%;
  height: auto;
  aspect-ratio: 1;
  overflow: visible;
  flex-shrink: 0;
}

.is-compact { overflow: hidden; }

.mark-ear,
.mark-scarf-tail,
.mark-eye,
.mark-smile { transform-box: view-box; }

.mark-ear-far {
  transform-origin: 476px 431px;
  animation: far-ear var(--mark-duration) ease-in-out both;
}

.mark-ear-near {
  transform-origin: 605px 431px;
  animation: near-ear var(--mark-duration) ease-in-out both;
}

.mark-scarf-tail {
  transform-origin: 959px 842px;
  animation: scarf-tail var(--mark-duration) ease-in-out both;
}


.mark-eye {
  transform-origin: 566px 598px;
  animation: wink-eye var(--mark-duration) ease-in-out both;
}

.mark-wink { animation: wink-line var(--mark-duration) ease-in-out both; }

.mark-smile {
  transform-origin: 294px 887px;
  animation: cheeky-smile var(--mark-duration) ease-in-out both;
}

.is-expressive .mark-smile { animation: resting-smile var(--mark-duration) ease-in-out both; }
.mark-smirk { transform-box: view-box; transform-origin: 294px 887px; animation: lifted-smirk var(--mark-duration) ease-in-out both; }
.is-expressive .mark-eye { animation-name: cheeky-eye; }
.is-expressive .mark-wink { animation-name: cheeky-wink; }
.mark-smirk-crease { animation: smirk-crease var(--mark-duration) ease-in-out both; }

.mark-star { opacity: 0; }
.mark-star-one { animation: spark-one var(--mark-duration) ease-out both; }
.mark-star-two { animation: spark-two var(--mark-duration) ease-out both; }
.mark-star-three { animation: spark-three var(--mark-duration) ease-out both; }

@keyframes far-ear {
  0%, 8%, 31%, 100% { transform: rotate(0); }
  16% { transform: rotate(-3.8deg); }
  23% { transform: rotate(2deg); }
}

@keyframes near-ear {
  0%, 12%, 35%, 100% { transform: rotate(0); }
  21% { transform: rotate(3.2deg); }
  28% { transform: rotate(-1.8deg); }
}

@keyframes scarf-tail {
  0%, 7%, 90%, 100% { transform: rotate(0); }
  20% { transform: rotate(-5deg); }
  40% { transform: rotate(10deg); }
  57% { transform: rotate(-6deg); }
  73% { transform: rotate(3deg); }
  84% { transform: rotate(-1deg); }
}

@keyframes wink-eye {
  0%, 30%, 59%, 100% { transform: scaleY(1); opacity: 1; }
  36%, 51% { transform: scaleY(.06); opacity: 0; }
}

@keyframes wink-line {
  0%, 32%, 58%, 100% { opacity: 0; }
  36%, 51% { opacity: 1; }
}

@keyframes cheeky-smile {
  0%, 28%, 71%, 100% { transform: rotate(0); }
  38%, 54% { transform: rotate(-6.5deg) scaleX(1.035); }
}

@keyframes cheeky-eye {
  0%, 22%, 84%, 100% { transform: scaleY(1); opacity: 1; }
  29%, 54%, 68% { transform: scaleY(.55); opacity: 1; }
  36%, 49% { transform: scaleY(.06); opacity: 0; }
}

@keyframes cheeky-wink {
  0%, 32%, 54%, 100% { opacity: 0; }
  36%, 49% { opacity: 1; }
}

@keyframes smirk-crease {
  0%, 31%, 79%, 100% { opacity: 0; }
  37%, 68% { opacity: 1; }
}

@keyframes resting-smile {
  0%, 24%, 86%, 100% { opacity: 1; }
  31%, 76% { opacity: 0; }
}

@keyframes lifted-smirk {
  0%, 24%, 86%, 100% { opacity: 0; transform: scaleY(.6); }
  32% { opacity: 1; transform: scaleY(.85); }
  39%, 68% { opacity: 1; transform: scaleY(1); }
  76% { opacity: 1; transform: scaleY(.85); }
}

@keyframes spark-one {
  0%, 37% { opacity: 0; transform: translate(0, 0) scale(.1) rotate(0); }
  41% { opacity: 1; transform: translate(32px, -29px) scale(.8) rotate(8deg); }
  52% { opacity: 1; }
  69%, 100% { opacity: 0; transform: translate(154px, -141px) scale(1) rotate(35deg); }
}

@keyframes spark-two {
  0%, 42% { opacity: 0; transform: translate(0, 0) scale(.1) rotate(0); }
  46% { opacity: 1; transform: translate(42px, -7px) scale(.8) rotate(-5deg); }
  58% { opacity: 1; }
  75%, 100% { opacity: 0; transform: translate(209px, -42px) scale(.9) rotate(-25deg); }
}

@keyframes spark-three {
  0%, 47% { opacity: 0; transform: translate(0, 0) scale(.1) rotate(0); }
  51% { opacity: 1; transform: translate(12px, -42px) scale(.85) rotate(10deg); }
  63% { opacity: 1; }
  80%, 100% { opacity: 0; transform: translate(88px, -213px) scale(.8) rotate(50deg); }
}

@media (prefers-reduced-motion: reduce) {
  .donvis-mark * { animation: none !important; }
}
</style>
