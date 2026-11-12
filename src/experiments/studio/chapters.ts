type StudioMotion = 'sweep' | 'lift' | 'slide' | 'fold'

type StudioChapter = Readonly<{
  id: `studio-${string}`
  title: string
  label: string
  summary: string
  view: string
  performanceView?: 'tasks'
  motion: StudioMotion
  categoryIds: readonly string[]
}>

export const STUDIO_CHAPTERS: readonly StudioChapter[] = [
  {
    id: 'studio-quota',
    label: '消耗趋势',
    title: '看清消耗节奏。',
    summary: '对比不同时段的剩余额度，查看积分消耗趋势。',
    view: 'trends',
    motion: 'sweep',
    categoryIds: ['trends-review'],
  },
  {
    id: 'studio-quota-window',
    label: '额度窗口',
    title: '额度还剩多少？',
    summary: '查看 Codex 各窗口的剩余额度和重置时间。',
    view: 'quota',
    motion: 'fold',
    categoryIds: ['quota-accounts'],
  },
  {
    id: 'studio-reset',
    label: '余额与重置卡',
    title: '重置卡还剩几张？',
    summary: '查看重置卡的可用张数、到期时间和账户积分余额。',
    view: 'reset',
    motion: 'slide',
    categoryIds: ['quota-accounts'],
  },
  {
    id: 'studio-insights',
    label: 'Token 用量',
    title: 'Token 花在哪儿？',
    summary: '按时段和模型查看 Token 用量，分清输入、输出与缓存读取。',
    view: 'sessions',
    motion: 'lift',
    categoryIds: ['tokens-cost'],
  },
  {
    id: 'studio-analysis',
    label: '会话与 Agent',
    title: '每个 Agent 用了多少？',
    summary: '展开主会话，查看各个子 Agent 的调用次数与用量。',
    view: 'analysis',
    motion: 'sweep',
    categoryIds: ['sessions-agents'],
  },
  {
    id: 'studio-performance',
    label: '任务耗时',
    title: '一次任务，等了多久？',
    summary: '查看每次任务的耗时，对比主会话与子 Agent 的表现。',
    view: 'performance',
    performanceView: 'tasks',
    motion: 'fold',
    categoryIds: ['model-performance'],
  },
  {
    id: 'studio-access',
    label: '服务目录',
    title: '都接入了哪些服务？',
    summary: '在服务中心浏览原生与扩展服务，查看已关联的账号。',
    view: 'services',
    motion: 'slide',
    categoryIds: ['service-access'],
  },
  {
    id: 'studio-clients',
    label: '本机工具',
    title: '谁在占用内存？',
    summary: '查看本机工具的运行状态、进程数和内存占用。',
    view: 'clients',
    motion: 'lift',
    categoryIds: ['tools-resources'],
  },
  {
    id: 'studio-accounts',
    label: '账号切换',
    title: '常用账号，随手切换。',
    summary: '在菜单栏查看并切换已关联的 Codex 账号。',
    view: 'accounts',
    motion: 'sweep',
    categoryIds: ['quota-accounts'],
  },
  {
    id: 'studio-workflow',
    label: '菜单栏速览',
    title: '抬眼就能看。',
    summary: '在菜单栏速览今日用量、缓存读取和服务额度。',
    view: 'menubar',
    motion: 'fold',
    categoryIds: ['menubar-notices'],
  },
  {
    id: 'studio-settings',
    label: '显示与提醒',
    title: '额度告急前提醒你。',
    summary: '设置额度提醒阈值，按习惯调整菜单栏显示。',
    view: 'settings',
    motion: 'slide',
    categoryIds: ['menubar-notices', 'exports-preferences'],
  },
  {
    id: 'studio-share',
    label: '分享卡片',
    title: '用量整理成一张卡。',
    summary: '生成用量分享卡片，汇总输入、输出和缓存读取。',
    view: 'share',
    motion: 'lift',
    categoryIds: ['exports-preferences'],
  },
]

export const STUDIO_SCREEN_COUNT = STUDIO_CHAPTERS.length

const curtainPacing = [
  { start: .10, end: .27, extra: .30 },   // Approach and fill the frame.
  { start: .281, end: .343, extra: .115 }, // Hold for the title.
  { start: .35, end: .55, extra: .38 },    // Fold back and reveal the first feature.
] as const

function phaseFraction(distance: number, span: number) {
  return Math.max(0, Math.min(1, distance / span))
}

export function studioCurtainRun(progress: number) {
  return curtainPacing.reduce((run, { start, end, extra }) =>
    run + extra * phaseFraction(progress - start, end - start), progress)
}

export function studioCurtainProgress(run: number) {
  return curtainPacing.reduce((progress, { start, end, extra }) =>
    progress - extra * phaseFraction(progress - start, end - start + extra), run)
}

export const STUDIO_HANDOFF = { lead: .035, crest: .33, rest: .63 }
export const STUDIO_SCROLL_HANDOFF = { lead: .025, rest: .72 }

const readingDistance = .32
// Keep the composed overview and each settled feature on screen while scrolling.
const readingBeats = [0, ...STUDIO_CHAPTERS.map((_, index) => index === 0 ? .60 : index + .78)]
  .map(phase => ({ phase, start: studioCurtainRun(phase) }))

export function studioChapterRun(progress: number) {
  const travel = studioCurtainRun(progress)
  return readingBeats.reduce((run, { start }) => travel > start ? run + readingDistance : run, travel)
}

export function studioChapterProgress(run: number) {
  for (const { phase, start } of readingBeats) {
    if (run < start) break
    if (run <= start + readingDistance) return phase
    run -= readingDistance
  }
  return studioCurtainProgress(run)
}

export function studioHandoffPhase(local: number) {
  const { lead, rest } = STUDIO_SCROLL_HANDOFF
  if (local <= lead) return local / lead * STUDIO_HANDOFF.lead
  if (local >= rest) return STUDIO_HANDOFF.rest + (local - rest) / (1 - rest) * (1 - STUDIO_HANDOFF.rest)
  return STUDIO_HANDOFF.lead + (local - lead) / (rest - lead) * (STUDIO_HANDOFF.rest - STUDIO_HANDOFF.lead)
}
