// Presentation fixtures only. No installed-app files, accounts or live logs are read.
// Owning UI: macOS/Sources/Donvis/UI/UsageOverviewCharts.swift:42–208.
// CodexContextSnapshot is one model request's context, never cumulative usage.
export type ContextSample = {
  id: string
  label: string
  usedTokens: number
  contextWindow: number
  observedAt: string
  lastCompactedAt: string
  description: string
}

export const CONTEXT_COLUMNS = 20
export const CONTEXT_BLOCKS = 200
export const CONTEXT_SAMPLES: readonly ContextSample[] = [
  { id: 'current', label: '当前占用', usedTokens: 190840, contextWindow: 260000, observedAt: '11月6日 10:52:18', lastCompactedAt: '11月6日 10:42:03', description: '长对话继续之前，先看这一轮还剩多少空间。' },
  { id: 'compacted', label: '压缩后采样', usedTokens: 74880, contextWindow: 260000, observedAt: '11月6日 10:42:08', lastCompactedAt: '11月6日 10:42:03', description: '对照压缩记录之后的采样，看清当时的上下文占用。' },
]
const clamp = (value: number) => Math.min(1, Math.max(0, value))
export function contextSummary(sample: ContextSample) {
  if (!Number.isSafeInteger(sample.contextWindow) || sample.contextWindow <= 0 || !Number.isSafeInteger(sample.usedTokens) || sample.usedTokens < 0) throw new RangeError('Invalid context sample')
  const usedPercent = sample.usedTokens / sample.contextWindow * 100
  return { usedPercent, remainingTokens: Math.max(0, sample.contextWindow - sample.usedTokens), remainingPercent: Math.max(0, 100 - usedPercent), color: usedPercent >= 80 ? '#ff3b30' : usedPercent > 50 ? '#ffcc00' : '#34c759' }
}

export function contextBlock(sample: ContextSample, index: number) {
  if (!Number.isInteger(index) || index < 0 || index >= CONTEXT_BLOCKS) throw new RangeError('Invalid context block')
  const boundary = (ordinal: number) => Math.floor(sample.contextWindow / CONTEXT_BLOCKS) * ordinal + Math.floor(sample.contextWindow % CONTEXT_BLOCKS * ordinal / CONTEXT_BLOCKS)
  const start = boundary(index), end = boundary(index + 1)
  const occupied = Math.min(end - start, Math.max(0, sample.usedTokens - start))
  return { index, start, end, occupied, free: end - start - occupied, fill: clamp(sample.usedTokens / sample.contextWindow * CONTEXT_BLOCKS - index) }
}

export function contextFocusIndex(sample: ContextSample) { return Math.min(CONTEXT_BLOCKS - 1, Math.max(0, Math.floor(sample.usedTokens / sample.contextWindow * CONTEXT_BLOCKS))) }

export function contextGridIndex(x: number, y: number) {
  return Math.min(9, Math.floor(clamp(y) * 10)) * CONTEXT_COLUMNS + Math.min(19, Math.floor(clamp(x) * CONTEXT_COLUMNS))
}

export function contextMoveIndex(index: number, key: string, whole = false) {
  if (key === 'ArrowLeft') return Math.max(0, index - 1)
  if (key === 'ArrowRight') return Math.min(199, index + 1)
  if (key === 'ArrowUp') return Math.max(0, index - 20)
  if (key === 'ArrowDown') return Math.min(199, index + 20)
  if (key === 'Home') return whole ? 0 : Math.floor(index / 20) * 20
  if (key === 'End') return whole ? 199 : Math.floor(index / 20) * 20 + 19
  return index
}

export function contextLens(index: number, span = 3) {
  const count = span === 5 ? 5 : 3
  const firstColumn = Math.max(0, Math.min(20 - count, index % 20 - Math.floor(count / 2)))
  const firstRow = Math.max(0, Math.min(10 - count, Math.floor(index / 20) - Math.floor(count / 2)))
  return Array.from({ length: count * count }, (_, offset) => ({ index: (firstRow + Math.floor(offset / count)) * 20 + firstColumn + offset % count, x: offset % count, y: Math.floor(offset / count) }))
}

// Port of the actual public MIT SignInFan component. Five posters become five
// four-column slices of one 200-block chart. All source coordinates, angles,
// stagger and Motion spring parameters are retained; only dimensions scale.
// https://github.com/motionvideohq/motionvideo.xyz/blob/c156ca8470b1d18fbce3a32b588a4c80deb3f24d/apps/web/src/components/sign-in-fan.tsx
export const CONTEXT_SPRING = { type: 'spring', stiffness: 260, damping: 22 } as const
export type ContextFanPhase = 'stack' | 'fan' | 'flat'
export function contextFanPhase(progress: number): ContextFanPhase { return progress < .14 ? 'stack' : progress < .88 ? 'fan' : 'flat' }
export function contextFanPose(index: number, width: number, phase: ContextFanPhase) {
  const offset = index - 2, distance = Math.abs(offset)
  const stripWidth = (Math.max(13, width) - 12) / 5
  const scale = stripWidth / 144 // SignInFan's source card width is w-36 (144px).
  return { x: phase === 'stack' ? 0 : phase === 'fan' ? offset * 84 * scale : offset * (stripWidth + 3), y: phase === 'stack' ? 48 * scale : phase === 'fan' ? distance * 12 * scale : 0,
    rotate: phase === 'stack' ? offset * 2 : phase === 'fan' ? offset * 7 : 0,
    delay: .12 + distance * .04, zIndex: 5 - distance, width: stripWidth, left: (width - stripWidth) / 2 }
}

export function contextStripIndices(strip: number) { return Array.from({ length: 40 }, (_, index) => Math.floor(index / 4) * 20 + strip * 4 + index % 4) }

// The magnifying window is anchored to the inspected region, as prescribed by
// https://motionvideo.xyz/en/moves/vector/vector-mask-reveal . It never moves
// the complete card or hides the sampled numerical evidence.
export function contextReveal(top: number, viewport: number) { return clamp((viewport * .94 - top) / Math.max(1, viewport * .6)) }
