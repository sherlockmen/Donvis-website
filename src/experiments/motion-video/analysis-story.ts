/** Fixed, invented examples. Never reads Donvis, account files, paths or actual threads. */
export type AnalysisRange = 1 | 7 | 30 | 365
export type AnalysisRole = 'all' | 'main' | 'subagent'
export interface AnalysisTokens { input: number; cacheRead: number; cacheWrite: number; output: number; reasoning: number }
export type AnalysisPrice = Omit<AnalysisTokens, 'reasoning'>
export type AnalysisPrices = Partial<Record<string, AnalysisPrice>>
export interface AnalysisSession {
  id: string; title: string; project: string; model: string; effort: string
  role: 'main' | 'subagent'; parentId?: string; date: string; tokens: AnalysisTokens
}
export const ANALYSIS_NOW = Date.UTC(2026, 10, 6, 10, 52)
export const ANALYSIS_PRICE_KEYS = [
  { key: 'input', title: '输入' }, { key: 'cacheRead', title: '缓存读' },
  { key: 'cacheWrite', title: '缓存写' }, { key: 'output', title: '输出' },
] as const
export const ANALYSIS_MODELS = ['gpt-6.1-sol', 'gpt-6.1', 'gpt-6-sol'] as const
/** Example prices chosen only to demonstrate the editor; never claimed as vendor prices. */
export const ANALYSIS_PRICES: AnalysisPrices = {
  'gpt-6.1-sol': { input: 2, cacheRead: .2, cacheWrite: 0, output: 8 },
  'gpt-6.1': { input: 3, cacheRead: .3, cacheWrite: 0, output: 12 },
  'gpt-6-sol': { input: 1.5, cacheRead: .15, cacheWrite: 0, output: 6 },
}
const tokens = (input: number, cacheRead: number, output: number, reasoning: number): AnalysisTokens => ({ input, cacheRead, cacheWrite: 0, output, reasoning })
export const ANALYSIS_SESSIONS: readonly AnalysisSession[] = [
  { id: 'demo-main-interface', title: '整理产品界面的信息层级', project: 'Atlas', model: 'gpt-6.1-sol', effort: 'high', role: 'main', date: '2026-11-06T10:32:00Z', tokens: tokens(28600, 79400, 16800, 6200) },
  { id: 'demo-child-accessibility', parentId: 'demo-main-interface', title: '检查键盘与可读性', project: 'Atlas', model: 'gpt-6.1', effort: 'medium', role: 'subagent', date: '2026-11-06T10:26:00Z', tokens: tokens(7400, 18200, 5200, 1600) },
  { id: 'demo-child-regression', parentId: 'demo-main-interface', title: '复核布局边界', project: 'Atlas', model: 'gpt-6-sol', effort: 'medium', role: 'subagent', date: '2026-11-06T10:18:00Z', tokens: tokens(4200, 10800, 3400, 900) },
  { id: 'demo-main-api', title: '补齐接口错误处理', project: 'Northstar', model: 'gpt-6.1-sol', effort: 'high', role: 'main', date: '2026-11-06T09:45:00Z', tokens: tokens(18400, 52700, 12600, 4100) },
  { id: 'demo-child-tests', parentId: 'demo-main-api', title: '验证重试与超时', project: 'Northstar', model: 'gpt-6.1', effort: 'high', role: 'subagent', date: '2026-11-06T09:40:00Z', tokens: tokens(5800, 16400, 4200, 1700) },
  { id: 'demo-main-notes', title: '整理发布说明', project: 'Fieldnotes', model: 'gpt-6-sol', effort: 'low', role: 'main', date: '2026-11-05T16:20:00Z', tokens: tokens(10400, 32600, 6400, 1300) },
  { id: 'demo-main-search', title: '改进搜索结果排序', project: 'Atlas', model: 'gpt-6.1-sol', effort: 'high', role: 'main', date: '2026-11-04T15:10:00Z', tokens: tokens(22400, 61800, 14800, 4200) },
  { id: 'demo-main-cache', title: '检查数据缓存边界', project: 'Northstar', model: 'gpt-6.1', effort: 'medium', role: 'main', date: '2026-11-03T14:30:00Z', tokens: tokens(16800, 44800, 9800, 2300) },
  { id: 'demo-main-type', title: '统一字体与排版', project: 'Atlas', model: 'gpt-6-sol', effort: 'medium', role: 'main', date: '2026-11-02T11:20:00Z', tokens: tokens(12600, 38400, 7600, 1800) },
  { id: 'demo-main-docs', title: '梳理帮助文档', project: 'Fieldnotes', model: 'gpt-6.1-sol', effort: 'medium', role: 'main', date: '2026-10-26T10:00:00Z', tokens: tokens(14800, 42800, 8400, 1800) },
  { id: 'demo-main-onboarding', title: '梳理首次使用流程', project: 'Atlas', model: 'gpt-6.1', effort: 'high', role: 'main', date: '2026-08-19T13:00:00Z', tokens: tokens(26400, 72800, 17600, 5100) },
]
const activitySamples: readonly [number, number, number, number][] = [
  [12, 18, 52, 7], [0, 9, 21, 3], [0, 6, 14, 1], [8, 13, 35, 5], [0, 7, 18, 2],
  [4, 6, 11, 0], [9, 15, 43, 6], [7, 11, 29, 2], [5, 8, 16, 1], [6, 9, 19, 2], [10, 16, 47, 5],
]
/** Native scopes count direct user messages for main sessions, responses for subagents.
 * These invented observations are not inferred from token totals or successful skill execution. */
export function analysisActivity(rows: readonly AnalysisSession[], scope: 'main' | 'subagent') {
  return rows.filter(row => row.role === scope).reduce((total, row) => {
    const sample = activitySamples[ANALYSIS_SESSIONS.findIndex(item => item.id === row.id)]
    return sample ? { messages: total.messages + sample[0], responses: total.responses + sample[1], tools: total.tools + sample[2], skillReads: total.skillReads + sample[3] } : total
  }, { messages: 0, responses: 0, tools: 0, skillReads: 0 })
}
export function analysisTotal(tokens: AnalysisTokens) { return tokens.input + tokens.cacheRead + tokens.cacheWrite + tokens.output }
export function analysisRange(range: AnalysisRange, sessions: readonly AnalysisSession[] = ANALYSIS_SESSIONS) {
  const start = range === 365 ? Date.UTC(2026, 0, 1) : Date.UTC(2026, 10, 7 - range)
  return sessions.filter(row => Date.parse(row.date) >= start && Date.parse(row.date) <= ANALYSIS_NOW)
}
export function analysisPriceValid(price: AnalysisPrice) {
  return ANALYSIS_PRICE_KEYS.every(({ key }) => Number.isFinite(price[key]) && price[key] >= 0 && price[key] <= 1_000_000)
}
export function analysisEstimate(row: AnalysisSession, prices: AnalysisPrices): number | null {
  const price = prices[row.model]
  return price && analysisPriceValid(price) ? ANALYSIS_PRICE_KEYS.reduce((sum, { key }) => sum + row.tokens[key] * price[key], 0) / 1_000_000 : null
}
export function analysisSummary(rows: readonly AnalysisSession[], prices: AnalysisPrices) {
  const priced = rows.map(row => analysisEstimate(row, prices))
  return {
    total: rows.reduce((sum, row) => sum + analysisTotal(row.tokens), 0),
    main: rows.filter(row => row.role === 'main').length,
    subagents: rows.filter(row => row.role === 'subagent').length,
    models: new Set(rows.map(row => row.model)).size,
    projects: new Set(rows.filter(row => row.role === 'main').map(row => row.project)).size,
    estimate: priced.some(value => value !== null) ? priced.reduce<number>((sum, value) => sum + (value ?? 0), 0) : null,
    unpriced: priced.filter(value => value === null).length,
  }
}
export function analysisFamilies(rows: readonly AnalysisSession[], query = '', role: AnalysisRole = 'all') {
  const ids = [...new Set(rows.map(row => row.parentId ?? row.id))]
  return ids.map(id => {
    const main = rows.find(row => row.id === id)
    const children = rows.filter(row => row.parentId === id)
    const direct = main ? analysisTotal(main.tokens) : 0
    const childTotal = children.reduce((sum, row) => sum + analysisTotal(row.tokens), 0)
    const visibleRows = [...(main && role !== 'subagent' ? [main] : []), ...(role !== 'main' ? children : [])]
    return { id, main, title: main?.title ?? '本期未记录的主会话', children, direct, childTotal, total: direct + childTotal, rows: visibleRows }
  }).filter(family => family.rows.length && (!query.trim() || family.rows.some(row => row.title.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()))))
}
export function analysisProjects(rows: readonly AnalysisSession[]) {
  const projects = [...new Set(rows.filter(row => row.role === 'main').map(row => row.project))]
  const colors = ['#2563eb', '#0086a8', '#8556d8', '#c07305']
  const mainCount = rows.filter(row => row.role === 'main').length
  let start = 0
  return projects.map((name, i) => {
    const sessions = rows.filter(row => row.role === 'main' && row.project === name)
    const fraction = mainCount ? sessions.length / mainCount : 0
    const item = { name, count: sessions.length, titles: sessions.map(row => row.title), color: colors[i % colors.length]!, fraction, start }
    start += fraction
    return item
  })
}
export function analysisBudgetValid(value: string) { return !value.trim() || (Number.isFinite(Number(value)) && Number(value) > 0 && Number(value) < 1_000_000_000) }
function csvCell(value: unknown) {
  const text = String(value ?? '')
  const first = text.trimStart()[0]
  const safe = (first && '=+-@'.includes(first)) || /^[\t\r\n]/.test(text) ? `'${text}` : text
  return `"${safe.replace(/"/g, '""')}"`
}
export function analysisExport(rows: readonly AnalysisSession[], prices: AnalysisPrices, format: 'csv' | 'json') {
  const records = rows.map(row => ({ date: row.date, provider: 'Codex', model: row.model, project: row.project,
    anonymousSessionID: row.id, tokens: row.tokens, totalTokens: analysisTotal(row.tokens),
    estimatedUSD: analysisEstimate(row, prices), isPriced: analysisEstimate(row, prices) !== null, source: 'codexResponse' }))
  const costBasis = 'User-entered USD prices per million tokens; API-equivalent estimate, not actual billing.'
  if (format === 'json') return JSON.stringify({ schemaVersion: 1, demonstration: true, generatedAt: new Date(ANALYSIS_NOW).toISOString(), costBasis,
    coverage: 'Fixed invented examples only. Project names included; no conversation text, account, keys or full paths.', records }, null, 2)
  const columns = ['date', 'provider', 'model', 'project', 'anonymous_session_id', 'input_tokens', 'cache_read_tokens', 'cache_write_tokens', 'output_tokens', 'reasoning_tokens', 'total_tokens', 'estimated_usd', 'source', 'cost_basis', 'demonstration']
  return [columns.join(','), ...records.map(row => [row.date, row.provider, row.model, row.project, row.anonymousSessionID,
    row.tokens.input, row.tokens.cacheRead, row.tokens.cacheWrite, row.tokens.output, row.tokens.reasoning, row.totalTokens, row.estimatedUSD,
    row.source, costBasis, true].map(csvCell).join(','))].join('\r\n') + '\r\n'
}
