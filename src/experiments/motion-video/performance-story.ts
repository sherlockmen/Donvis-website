export type PerformanceScope = 'main' | 'subagent'
export type PerformanceDays = 1 | 7 | 30
export type PerformanceStatistic = 'total' | 'mean'
export type PerformanceTask = {
  id: string
  scope: PerformanceScope
  day: number
  date: string
  time: string
  session: string
  duration: number | null
}

// Safe, isolated task records. No real thread IDs, prompts, account or file paths.
// Today/main has 24 timed completions (median 42.6s, p95 96.4s) plus three
// untimed ended tasks, consistent with this scene's fixed main-session metrics.
const MAIN_TODAY = [12.4,18.2,21.4,24.6,26.8,29.2,31.4,33.6,35.8,38.2,40.4,41.8,43.4,45.6,48.2,51.4,54.6,58.2,64.4,72.6,83.2,91.3,97.3,126.7]
const SUB_TODAY = [5.2,8.4,10.6,12.8,14.2,15.4,17.6,20.8,24.2,30.6,43.8,68.4]
function dateAt(day: number) { return new Date(Date.UTC(2026, 10, 6 + day)).toISOString().slice(0, 10) }
export const PERFORMANCE_TASKS: readonly PerformanceTask[] = Array.from({ length: 30 }, (_, index) => index - 29).flatMap(day =>
  (['main', 'subagent'] as const).flatMap(scope => {
    // One no-record day and one untimed day preserve the native missing state.
    if (day === -18) return []
    const today = scope === 'main' ? MAIN_TODAY : SUB_TODAY
    const values: readonly (number | null)[] = day === 0 ? [...today, ...Array(scope === 'main' ? 3 : 1).fill(null)]
      : day === -11 ? [null, null]
      : [...today.slice((Math.abs(day) * 3) % 7, (Math.abs(day) * 3) % 7 + 4).map(value => Math.round(value * (1 + Math.abs(day) % 5 * .06) * 10) / 10), ...(day % 4 === 0 ? [null] : [])]
    return values.map((duration, index) => {
      const minute = 9 * 60 + index * (day === 0 ? scope === 'main' ? 18 : 29 : 71) + (scope === 'subagent' ? 17 : 0)
      return {
        id: `${scope}-${day}-${index}`, scope, day, date: dateAt(day),
        time: `${String(Math.floor(minute / 60)).padStart(2, '0')}:${String(minute % 60).padStart(2, '0')}`,
        session: `${scope === 'main' ? '主会话' : '子 Agent'} · ${['界面整理', '接口校验', '文档更新', '测试复核'][index % 4]}`,
        duration,
      }
    })
  }),
)

// Direct port of CodexPerformanceSummary.Distribution's linear percentile.
// Native source: Core/CodexPerformanceSummary.swift:6–25.
export function performanceDistribution(values: readonly number[]) {
  const sorted = values.filter(value => Number.isFinite(value) && value >= 0).sort((a, b) => a - b)
  const percentile = (fraction: number) => {
    if (!sorted.length) return null
    const position = (sorted.length - 1) * fraction, lower = Math.floor(position), upper = Math.ceil(position)
    return sorted[lower]! + (sorted[upper]! - sorted[lower]!) * (position - lower)
  }
  const total = sorted.reduce((sum, value) => sum + value, 0)
  return { count: sorted.length, total, median: percentile(.5), p95: percentile(.95), mean: sorted.length ? total / sorted.length : null }
}

// Native owning callsites: CodexPerformanceSection.swift:556–654 and
// Resources/Charts/chart.js:520–573. Today is one bar per timed task; 7/30 days
// use daily total or per-task mean, never a fabricated median trend selector.
export function performanceTaskView(days: PerformanceDays, scope: PerformanceScope, statistic: PerformanceStatistic) {
  const records = PERFORMANCE_TASKS.filter(record => record.scope === scope && record.day >= 1 - days)
  const valid = records.filter((record): record is PerformanceTask & { duration: number } => record.duration !== null)
  const summary = performanceDistribution(valid.map(record => record.duration))
  const points = days === 1 ? valid.map(record => ({
    id: record.id, label: record.time, detail: record.session, value: record.duration, timed: 1, recorded: 1,
  })) : Array.from({ length: days }, (_, index) => index + 1 - days).map(day => {
    const bucket = records.filter(record => record.day === day)
    const values = bucket.flatMap(record => record.duration === null ? [] : [record.duration])
    const aggregate = performanceDistribution(values)
    return {
      id: `${scope}-${day}`, label: dateAt(day).slice(5).replace('-', '/'),
      detail: bucket.length ? `完整计时 ${values.length}/${bucket.length} 个任务` : '当日暂无已结束任务',
      value: values.length ? statistic === 'total' ? aggregate.total : aggregate.mean : null,
      timed: values.length, recorded: bucket.length,
    }
  })
  const max = Math.max(1, ...points.map(point => point.value ?? 0))
  const axisStep = 10 ** Math.floor(Math.log10(max))
  const axisMax = Math.ceil(max / axisStep) * axisStep
  return { records, summary, recordCount: records.length, points, axisMax }
}
export function performanceSeconds(value: number | null) {
  if (value === null) return '—'
  return Number(value.toFixed(1)).toLocaleString('zh-CN')
}
