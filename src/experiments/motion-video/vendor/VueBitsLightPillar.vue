<script setup lang="ts">
/**
 * Vue Bits LightPillar — Copyright (c) 2025 David Haz.
 * https://github.com/DavidHDev/vue-bits/blob/3766ebeeed37ec35bce29f001b6d101c7b17da35/src/content/Backgrounds/LightPillar/LightPillar.vue
 * MIT + Commons Clause: /licenses/vue-bits-LightPillar.txt.
 * Original raymarch shaders, wave uniforms, quality tiers and rotation clock
 * are retained. Donvis adds only host/lifecycle/fallback integration below.
 */
import * as THREE from 'three'
import { computed, onBeforeUnmount, onMounted, ref, watch, type CSSProperties } from 'vue'
import { lightPillarQuality, lightPillarShaders, type LightPillarQuality } from './lightPillarSource'

interface Props {
  enabled?: boolean
  topColor?: string
  bottomColor?: string
  intensity?: number
  rotationSpeed?: number
  interactive?: boolean
  className?: string
  glowAmount?: number
  pillarWidth?: number
  pillarHeight?: number
  noiseIntensity?: number
  mixBlendMode?: CSSProperties['mixBlendMode']
  pillarRotation?: number
  quality?: LightPillarQuality
}
const props = withDefaults(defineProps<Props>(), {
  enabled: true, topColor: '#ed3326', bottomColor: '#7f1b26', intensity: .8,
  rotationSpeed: .3, interactive: false, className: '', glowAmount: .005,
  pillarWidth: 3, pillarHeight: .4, noiseIntensity: .5,
  mixBlendMode: 'screen', pillarRotation: 0, quality: 'medium',
})
const host = ref<HTMLDivElement>()
const ready = ref(false), failed = ref(false), reduced = ref(false)
const surfaceStyle = computed(() => ({ '--pillar-top': props.topColor, '--pillar-bottom': props.bottomColor, mixBlendMode: props.mixBlendMode }) as CSSProperties)
let renderer: THREE.WebGLRenderer | null = null, material: THREE.ShaderMaterial | null = null
let scene: THREE.Scene | null = null, camera: THREE.OrthographicCamera | null = null, geometry: THREE.PlaneGeometry | null = null
let settings: ReturnType<typeof lightPillarQuality> | undefined
let intersection: IntersectionObserver | undefined, resize: ResizeObserver | undefined
let mounted = false, visible = false, frame = 0, lastTime = 0, timeVal = 0, width = 0, height = 0
let renderedWidth = 0, renderedHeight = 0
let cleanup = () => {}
const mouse = new THREE.Vector2(0, 0)
const parseColor = (value: string) => { const color = new THREE.Color(value); return new THREE.Vector3(color.r, color.g, color.b) }
function canRun() { return mounted && props.enabled && !failed.value && !reduced.value && visible && !document.hidden && width > 0 && height > 0 }
function stop() { if (frame) cancelAnimationFrame(frame); frame = 0; lastTime = 0 }
function teardown() {
  stop()
  const current = renderer
  renderer = null
  if (current) current.domElement.removeEventListener('webglcontextlost', contextLost)
  material?.dispose(); geometry?.dispose(); scene?.clear()
  if (current) { current.dispose(); current.forceContextLoss(); current.domElement.remove() }
  material = null; geometry = null; scene = null; camera = null; ready.value = false
  renderedWidth = 0; renderedHeight = 0
}
function fallback() {
  failed.value = true
  ready.value = false
  stop()
  // Shader errors can arrive from inside render(); dispose after its stack exits.
  queueMicrotask(teardown)
}
function contextLost(event: Event) { event.preventDefault(); fallback() }
function resizeRenderer() {
  if (!renderer || !material) return
  if (renderedWidth === width && renderedHeight === height) return
  renderer.setSize(width, height, false)
  ;(material.uniforms.uResolution!.value as THREE.Vector2).set(width, height)
  renderedWidth = width; renderedHeight = height
}
function updateUniforms() {
  if (!material) return
  const u = material.uniforms
  u.uTopColor!.value = parseColor(props.topColor); u.uBottomColor!.value = parseColor(props.bottomColor)
  u.uIntensity!.value = props.intensity; u.uInteractive!.value = props.interactive
  u.uGlowAmount!.value = props.glowAmount; u.uPillarWidth!.value = Math.max(.01, props.pillarWidth)
  u.uPillarHeight!.value = props.pillarHeight; u.uNoiseIntensity!.value = props.noiseIntensity
  const radians = props.pillarRotation * Math.PI / 180
  u.uPillarRotCos!.value = Math.cos(radians); u.uPillarRotSin!.value = Math.sin(radians)
  if (!props.interactive) mouse.set(0, 0)
}
function initScene() {
  if (!host.value || !canRun()) return
  const mobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
  settings = lightPillarQuality(props.quality, mobile, navigator.hardwareConcurrency, devicePixelRatio)
  try {
    scene = new THREE.Scene()
    camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)
    renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true, powerPreference: settings.effective === 'low' ? 'low-power' : 'high-performance', precision: settings.precision, stencil: false, depth: false })
    renderer.debug.onShaderError = fallback
    renderer.setPixelRatio(settings.pixelRatio)
    renderer.domElement.addEventListener('webglcontextlost', contextLost)
    const waveSin = new Float32Array(4).fill(Math.sin(.4)), waveCos = new Float32Array(4).fill(Math.cos(.4))
    material = new THREE.ShaderMaterial({
      ...lightPillarShaders(settings),
      uniforms: {
        uTime: { value: timeVal }, uResolution: { value: new THREE.Vector2(width, height) }, uMouse: { value: mouse },
        uTopColor: { value: parseColor(props.topColor) }, uBottomColor: { value: parseColor(props.bottomColor) },
        uIntensity: { value: props.intensity }, uInteractive: { value: props.interactive },
        uGlowAmount: { value: props.glowAmount }, uPillarWidth: { value: Math.max(.01, props.pillarWidth) },
        uPillarHeight: { value: props.pillarHeight }, uNoiseIntensity: { value: props.noiseIntensity },
        uPillarRotation: { value: props.pillarRotation }, uRotCos: { value: 1 }, uRotSin: { value: 0 },
        uPillarRotCos: { value: 1 }, uPillarRotSin: { value: 0 }, uWaveSin: { value: waveSin }, uWaveCos: { value: waveCos },
      }, transparent: true, depthWrite: false, depthTest: false,
    })
    geometry = new THREE.PlaneGeometry(2, 2)
    scene.add(new THREE.Mesh(geometry, material))
    host.value.appendChild(renderer.domElement)
    updateUniforms(); resizeRenderer()
  } catch { fallback() }
}
function animate(now: number) {
  frame = 0
  if (!canRun() || !renderer || !material || !scene || !camera || !settings) return
  const frameTime = 1000 / settings.fps
  if (!lastTime) lastTime = now - frameTime
  const delta = now - lastTime
  if (delta >= frameTime) {
    // Original LightPillar clock: no catch-up after a hidden/off-screen pause.
    timeVal += .016 * props.rotationSpeed
    material.uniforms.uTime!.value = timeVal
    material.uniforms.uRotCos!.value = Math.cos(timeVal * .3)
    material.uniforms.uRotSin!.value = Math.sin(timeVal * .3)
    try { renderer.render(scene, camera); if (!failed.value) ready.value = true } catch { fallback() }
    lastTime = now - delta % frameTime
  }
  if (canRun()) frame = requestAnimationFrame(animate)
}
function sync() {
  if (!canRun()) { stop(); return }
  if (!renderer) initScene()
  if (!renderer || failed.value) return
  resizeRenderer()
  if (!frame) frame = requestAnimationFrame(animate)
}
function pointer(event: PointerEvent) {
  if (!props.interactive || event.pointerType !== 'mouse' || !canRun() || !host.value) return
  const rect = host.value.getBoundingClientRect()
  if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) { mouse.set(0, 0); return }
  mouse.set((event.clientX - rect.left) / rect.width * 2 - 1, -(event.clientY - rect.top) / rect.height * 2 + 1)
}
onMounted(() => {
  mounted = true
  const media = matchMedia('(prefers-reduced-motion: reduce)')
  const preference = () => { reduced.value = media.matches; if (reduced.value) teardown(); else sync() }
  const size = () => { width = host.value?.clientWidth ?? 0; height = host.value?.clientHeight ?? 0; sync() }
  const leave = () => mouse.set(0, 0)
  media.addEventListener('change', preference)
  document.addEventListener('visibilitychange', sync)
  addEventListener('pointermove', pointer, { passive: true }); addEventListener('blur', leave)
  document.documentElement.addEventListener('pointerleave', leave)
  intersection = new IntersectionObserver(entries => { visible = entries[0]?.isIntersecting ?? false; sync() })
  intersection.observe(host.value!)
  resize = new ResizeObserver(size); resize.observe(host.value!)
  preference(); size()
  cleanup = () => { media.removeEventListener('change', preference); document.removeEventListener('visibilitychange', sync); removeEventListener('pointermove', pointer); removeEventListener('blur', leave); document.documentElement.removeEventListener('pointerleave', leave) }
})
watch(() => props.enabled, enabled => { if (!mounted) return; if (!enabled) teardown(); else { failed.value = false; sync() } })
watch(() => props.quality, () => { if (mounted) { teardown(); failed.value = false; sync() } })
watch(() => [props.topColor, props.bottomColor, props.intensity, props.interactive, props.glowAmount, props.pillarWidth, props.pillarHeight, props.noiseIntensity, props.pillarRotation], updateUniforms)
onBeforeUnmount(() => { mounted = false; cleanup(); intersection?.disconnect(); resize?.disconnect(); teardown() })
</script>

<template>
  <div ref="host" class="vue-bits-light-pillar" :class="props.className" :style="surfaceStyle" :data-render-state="reduced ? 'static' : failed ? 'fallback' : ready ? 'ready' : 'idle'" aria-hidden="true" role="presentation"><div class="light-pillar-fallback" :class="{ 'is-rendered': ready }"></div></div>
</template>

<style scoped>
.vue-bits-light-pillar { position: absolute; inset: 0; width: 100%; height: 100%; overflow: hidden; pointer-events: none; contain: paint; }
.light-pillar-fallback { position: absolute; inset: 0; background: radial-gradient(ellipse at 46% 12%, var(--pillar-top), transparent 63%), radial-gradient(ellipse at 58% 90%, var(--pillar-bottom), transparent 67%); opacity: .38; }
.light-pillar-fallback.is-rendered { opacity: 0; }
.vue-bits-light-pillar :deep(canvas) { position: absolute; inset: 0; display: block; width: 100%; height: 100%; pointer-events: none; }
</style>
