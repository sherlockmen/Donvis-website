import { demoUsage } from '../../components/donvisDemoData.ts'

// Public illustration data; UI follows WorkTimeCalendarCard / CodexInsightsView / CodexStorageView.
// No installed application records, account files or paths are read.
export const ACTIVITY_DAY = Date.UTC(2026, 10, 6)
const DAY = 86400000
export const workDays = [2.2, 3.8, 1.4, 4.6, 3.2, 5.1, 4.5, 2.6, 3.5, 6, 4.3, 3.6, 4.7, 3.2, 2.5, 4.1, 5.2, 2.8, 3.7, 5.4, 3.1, 4.2, 4.8, 2.6, 3.3, 5.5, 3.8, 4.2, 3.6, 3.5]
export const workIntervals = [{ start: 8, end: 9.25 }, { start: 9.75, end: 11 }, { start: 13, end: 14 }]
export function workSummary(days: number) {
  const hours = workDays.slice(-days).reduce((sum, value) => sum + value, 0)
  const elapsed = (days - 1) * 24 + 14
  return { hours, idle: elapsed - hours, percent: (hours / elapsed * 100).toFixed(1) }
}
export function workCalendar(days: number) {
  return workDays.slice(-days).map((hours, index) => {
    const at = ACTIVITY_DAY - (Math.min(days, workDays.length) - 1 - index) * DAY
    const date = new Date(at)
    return { at, hours, label: `${date.getUTCMonth() + 1}/${date.getUTCDate()}`, fullDate: `${date.getUTCFullYear()}年${date.getUTCMonth() + 1}月${date.getUTCDate()}日` }
  })
}

// A complete, independent 2026 example calendar. Empty days are genuine zeros;
// future cells stay empty. Totals/peak/streaks below use these exact same cells.
export const activityAnnualCells = Array.from({ length: 365 }, (_, index) => {
  const at = Date.UTC(2026, 0, index + 1), date = new Date(at)
  const today = Math.round((ACTIVITY_DAY - Date.UTC(2026, 0, 1)) / DAY)
  const active = at <= ACTIVITY_DAY && (index % 9 < 6 || index >= 150 && index <= 167 || index >= today - 6 || index === 250) && ![149, 168, today - 7].includes(index)
  let value = active ? Math.round(demoUsage('codex', 'today').total * [.32, .55, .76, .62, .91, 1.12, .4][index % 7]!) : 0
  if (index === 250) value = 312600
  if (index === today) value = demoUsage('codex', 'today').total
  if (index === today - 1) value = demoUsage('codex', 'yesterday').total
  return { at, index, value, future: at > ACTIVITY_DAY, week: Math.floor((index + 3) / 7), weekday: (index + 3) % 7, label: `${date.getUTCMonth() + 1}月${date.getUTCDate()}日`, fullDate: `${date.getUTCFullYear()}年${date.getUTCMonth() + 1}月${date.getUTCDate()}日` }
})
export type ActivityCell = typeof activityAnnualCells[number]
export function activityLifetime(cells: readonly Pick<ActivityCell, 'at' | 'value'>[], today = ACTIVITY_DAY) {
  const observed = cells.filter(cell => cell.at <= today).sort((a, b) => a.at - b.at)
  let total = 0, peak = 0, longest = 0, streak = 0, previous = 0
  for (const cell of observed) {
    total += cell.value
    peak = Math.max(peak, cell.value)
    streak = cell.value > 0 ? (cell.at - previous === DAY ? streak + 1 : 1) : 0
    longest = Math.max(longest, streak)
    previous = cell.at
  }
  const byDate = new Map(observed.map(cell => [cell.at, cell.value]))
  let current = 0, day = byDate.get(today) ? today : today - DAY
  while ((byDate.get(day) ?? 0) > 0) { current++; day -= DAY }
  return { total, peak, longest, current }
}
export function activityCellIndex(index: number, key: string) {
  const last = activityAnnualCells.findIndex(cell => cell.future) - 1
  const next = key === 'Home' ? 0 : key === 'End' ? last : index + ({ ArrowLeft: -7, ArrowRight: 7, ArrowUp: -1, ArrowDown: 1 }[key] ?? 0)
  return Math.max(0, Math.min(last, next))
}
export const storage = [
  { name: '聊天', size: 420, color: '#2563eb' }, { name: '子智能体', size: 210, color: '#0086a8' },
  { name: '已归档', size: 150, color: '#8050d3' }, { name: '待分类', size: 60, color: '#c07305' },
  { name: '工作树', size: 1200, color: '#009588' }, { name: '其他', size: 360, color: '#8b8b96' },
]
export const storageTotal = storage.reduce((sum, item) => sum + item.size, 0)
export const activityTopics = [
  { id: 'work', title: '工作与空闲', lead: '它忙没忙，\n别靠猜。', text: '把一天展开，哪些时段在工作、空闲了多久，一眼有数。', caption: '今天看时段，7 天、30 天看工作日历。' },
  { id: 'effort', title: '推理与速度', lead: '重活轻活，\n看清用法。', text: '主会话与子 Agent 分开看，知道时间花在哪种推理强度上。', caption: '推理强度与更快用量分别统计，可同时开启。' },
  { id: 'storage', title: '本机空间', lead: '磨盘越转，\n空间谁占？', text: '聊天、子智能体、归档和工作树，拆开看 Codex 的磁盘占用。', caption: '统计已读取的文件大小；不删除文件。' },
  { id: 'lifetime', title: '累计活动', lead: '每天的投入，\n都有迹可循。', text: '累计 Token、单日峰值、最长任务与连续活跃，留下协作记录。', caption: '仅统计已读取的本机记录。' },
] as const
