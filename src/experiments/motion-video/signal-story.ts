import { spring } from 'motion'

/**
 * Isolated public-safe notification samples, not a delivery service.
 * Owning native code: NotificationService.swift:52–114; UsageNotificationDescriptor.swift.
 * Each manual trial starts a fresh fixture. The native app also deduplicates deliveries
 * by account/window/threshold and requires the user's macOS notification permission.
 */
export type SignalKind = 'low' | 'critical' | 'exhausted' | 'recovered' | 'reset'
export type SignalScenario = 'quota' | 'recovered' | 'reset'
export type SignalNotice = { kind: SignalKind; title: string; subtitle: string; body: string; remaining: number }
export type SignalSettings = { enabled: boolean; low: number; critical: number }
export type SignalSample = {
  remaining: number
  fetchedAt: number
  now: number
  resetAt: number
  source: 'officialCLI' | 'officialDashboard' | 'localStatusLine' | 'other'
  warning: boolean
  knownAccount: boolean
  previous?: { fetchedAt: number; remaining: number; resetAt: number }
}
export const SIGNAL_NOW = Date.UTC(2026, 10, 6, 2, 52)
export const SIGNAL_DURATION = 1600
const cap = (value: number) => Math.max(0, Math.min(1, value))
const out = (value: number) => 1 - Math.pow(1 - cap(value), 3)

export function signalThresholds(low: number, critical: number) {
  const validLow = Number.isFinite(low) ? Math.min(90, Math.max(5, low)) : 30
  const validCritical = Number.isFinite(critical) ? Math.min(50, validLow, Math.max(1, critical)) : Math.min(15, validLow)
  return { low: validLow, critical: validCritical }
}

export function signalSample(scenario: SignalScenario, remaining: number): SignalSample {
  const sample: SignalSample = {
    remaining, now: SIGNAL_NOW, fetchedAt: SIGNAL_NOW - 1000,
    resetAt: Date.UTC(2026, 10, 6, 5, 10), source: 'officialCLI', warning: false, knownAccount: true,
  }
  if (scenario === 'recovered') sample.previous = { fetchedAt: SIGNAL_NOW - 60_000, remaining: 10, resetAt: sample.resetAt }
  if (scenario === 'reset') {
    sample.resetAt = Date.UTC(2026, 10, 6, 7, 52)
    sample.previous = { fetchedAt: SIGNAL_NOW - 3_600_000, remaining: 0, resetAt: Date.UTC(2026, 10, 6, 2, 0) }
  }
  return sample
}

/** Native event predicates and descriptor semantics for the selected fresh sample. */
export function signalNotice(sample: SignalSample, settings: SignalSettings): SignalNotice | null {
  const { remaining, now, fetchedAt, previous } = sample
  if (!settings.enabled || sample.warning || sample.source === 'other'
    || !Number.isFinite(remaining) || remaining < 0 || remaining > 100
    || !Number.isFinite(fetchedAt) || fetchedAt > now || now - fetchedAt > 600_000
    || previous && fetchedAt <= previous.fetchedAt) return null
  const { low, critical } = signalThresholds(settings.low, settings.critical)
  const percent = `${Math.round(remaining)}%`
  let kind: SignalKind | null = null
  if (sample.knownAccount && previous && Number.isFinite(previous.resetAt) && Number.isFinite(sample.resetAt)
    && previous.resetAt <= fetchedAt && sample.resetAt > previous.resetAt && sample.resetAt > fetchedAt) kind = 'reset'
  else if (remaining <= 0) kind = 'exhausted'
  else if (remaining < critical) kind = 'critical'
  else if (remaining < low) kind = 'low'
  else if (sample.knownAccount && previous && previous.resetAt === sample.resetAt
    && remaining > previous.remaining && remaining >= Math.max(50, low + 5)) kind = 'recovered'
  if (!kind) return null
  // Claude has the actual 5-hour window used by this fixture. A missing Codex
  // short window must never be invented to make a marketing animation work.
  const prefix = 'Claude Code · 5 小时窗口'
  if (kind === 'reset') return { kind, remaining, title: `${prefix}已重置`, subtitle: `✅ 剩余额度 ${percent}`, body: `官方数据已更新至新窗口，当前剩余约 ${percent}。` }
  if (kind === 'recovered') return { kind, remaining, title: `✅ ${prefix}额度已恢复`, subtitle: `✅ 剩余额度 ${percent}`, body: `5 小时窗口额度已回升至约 ${percent}。` }
  const severity = kind === 'exhausted' ? '额度已耗尽' : kind === 'critical' ? '额度严重不足' : '额度偏低'
  const indicator = kind === 'low' ? '🟡' : '🔴'
  const body = !Number.isFinite(sample.resetAt) ? '官方重置时间待更新。'
    : sample.resetAt <= now ? '预计重置时间已到，实际额度等待官方更新。'
    : '官方重置时间：2026年11月6日 13:10。'
  return { kind, remaining, title: `${prefix}${severity}`, subtitle: `${indicator} 剩余额度 ${percent}`, body }
}

/**
 * Public MIT MotionVideo code ports (Copyright 2026 Aniket Pawar):
 * https://github.com/motionvideohq/motionvideo.xyz/blob/main/apps/web/src/components/sign-in-fan.tsx
 * Same Motion spring, initial/final geometry and distance-dependent delay.
 * https://github.com/motionvideohq/motionvideo.xyz/blob/main/apps/web/src/components/ui/dialog.tsx
 * Same 200ms ease-out opacity/95%-to-100% entry for the notification surface.
 * Additional public move recipes:
 * /en/moves/ui/toast-notification — settle with a tiny overshoot, then hold.
 * /en/moves/ui/card-stack — equal offsets, decreasing scale/brightness, ≤4 layers.
 * /en/moves/vector/vector-mask-reveal — anchor at the cause, 108% → 100%.
 * /en/moves/vector/path-draw-on — eased normalized stroke, hidden at zero.
 * Source: apps/web/src/data/moves.json in motionvideohq/motionvideo.xyz.
 */
export function signalFrame(milliseconds: number) {
  const p = out(milliseconds / 200)
  return {
    wire: out(milliseconds / 520),
    mask: p,
    scale: .95 + .05 * p,
    complete: milliseconds >= SIGNAL_DURATION,
  }
}

export const SIGNAL_FAN_SPRING = { stiffness: 260, damping: 22 } as const
const fanSpring = spring({ keyframes: [0, 1], ...SIGNAL_FAN_SPRING })
export function signalFanPose(offset: number, milliseconds: number, responsiveScale = 1) {
  const distance = Math.abs(offset)
  const delay = 120 + distance * 40
  const p = fanSpring.next(Math.max(0, milliseconds - delay)).value
  return {
    x: offset * 84 * p * responsiveScale,
    y: 48 + (distance * 12 - 48) * p,
    rotate: offset * 2 + offset * 5 * p,
    z: 3 - distance,
  }
}

export function signalMaskRadius(width: number, height: number, origin: { x: number; y: number }) {
  return Math.hypot(Math.max(Math.abs(origin.x), Math.abs(width - origin.x)), Math.max(Math.abs(origin.y), Math.abs(height - origin.y))) + 2
}
