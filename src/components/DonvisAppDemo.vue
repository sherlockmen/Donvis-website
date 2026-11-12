<script setup lang="ts">
import { computed, getCurrentInstance, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { Activity, ArrowDown, ArrowRight, ArrowUp, ArrowUpRight, BarChart3, Bell, Blocks, Box, CalendarDays, ChartNoAxesCombined, Check, CircleDot, Clock3, Code2, Copy, Cpu, CreditCard, Download, Folder, Gauge, Grid2X2, HardDrive, Hash, Info, Layers, Lightbulb, MemoryStick, MessageSquare, MoreHorizontal, RefreshCw, Search, Settings2, Share2, ShieldCheck, SlidersHorizontal, Terminal, Timer, Wallet, Workflow, X } from 'lucide-vue-next'
import DonvisMark from './DonvisMark.vue'
import { demoSharePNG } from './demoShareImage'
import { DEMO_ACCOUNT, DEMO_PROVIDERS, DEMO_SERVICES, DEMO_UPDATED, PROVIDER_LOGOS, SERVICE_CATEGORIES, compactToken, demoAnnualCells, demoRangeUsage, demoUsage, demoUsageBars, filterDemoServices, quotaColor, quotaSamples, stepPath, type DemoDay, type DemoPage, type DemoProvider, type ServiceCategory } from './donvisDemoData'

const props = withDefaults(defineProps<{
  mode?: DemoPage
  interactive?: boolean
  initialProvider?: DemoProvider
  initialDay?: DemoDay
  initialServiceLibraryOpen?: boolean
  focus?: 'quota' | 'reset'
  fullWindow?: boolean
}>(), { mode: 'dashboard', interactive: true, initialProvider: 'codex', initialDay: 'today', initialServiceLibraryOpen: true })
const instanceId = getCurrentInstance()?.uid ?? 0
const hourlyGradientId = `dd-hourly-blue-${instanceId}`
const shareTitleId = `dd-share-title-${instanceId}`
const root = ref<HTMLElement>()
const canvas = ref<HTMLElement>()
const displayWidth = ref(1220)
const logicalWidth = ref(1220)
const logicalHeight = ref(840)
const scale = computed(() => displayWidth.value / logicalWidth.value)
const page = ref<DemoPage>(props.mode)
const provider = ref<DemoProvider>(props.initialProvider)
const day = ref<DemoDay>(props.initialDay)
const range = ref(1)
const creditRange = ref(1)
const usageRange = ref(1)
const dailyChartMode = ref('总量')
const serviceQuery = ref('')
const serviceCategory = ref<ServiceCategory>('all')
const serviceScope = ref('全部')
const enabledServices = ref<string[]>([])
const libraryOpen = ref(props.initialServiceLibraryOpen)
const account = ref(DEMO_ACCOUNT)
const noticesOpen = ref(false)
const optionsOpen = ref(false)
const notifications = ref(true)
const alwaysOnTop = ref(false)
const updateMessage = ref('')
const activeSample = ref<number>()
const activeBar = ref<number>()
const shareOpen = ref(false)
const shareRange = ref(7)
const shareStatus = ref('')
const shareCard = ref<SVGSVGElement>()
const shareSheet = ref<HTMLElement>()
const shareTrigger = ref<HTMLButtonElement>()
let feedbackTimer: ReturnType<typeof setTimeout> | undefined
let resize: ResizeObserver | undefined

const navigation = [
  { id: 'dashboard', title: '总览', icon: Grid2X2 }, { id: 'trends', title: '额度趋势', icon: ChartNoAxesCombined }, { id: 'sessions', title: '费用与会话', icon: Copy }, { id: 'services', title: '服务中心', icon: Grid2X2 }, { id: 'clients', title: '已接入工具', icon: Layers },
] as const
const currentNav = computed(() => navigation.find(item => item.id === page.value))
const isDetail = computed(() => page.value === 'quota' || page.value === 'reset')
const service = computed(() => DEMO_PROVIDERS[provider.value])
const usage = computed(() => demoUsage(provider.value, day.value))
const primaryRemaining = computed(() => service.value.windows[0].remaining)
const rangeUsage = computed(() => demoRangeUsage(provider.value, day.value, usageRange.value))
const shareUsage = computed(() => demoRangeUsage(provider.value, day.value, shareRange.value))
const shareCategories = computed(() => [{ name: '输入', value: shareUsage.value.input, color: '#92b7ff' }, { name: '缓存读取', value: shareUsage.value.cache, color: '#67d9bc' }, { name: '输出', value: shareUsage.value.output, color: '#f2c56b' }])
const accountLabel = computed(() => provider.value === 'codex' ? account.value : 'claude-demo@donvis.app')
const hasServiceFilter = computed(() => ['dashboard', 'sessions', 'quota', 'reset'].includes(page.value))
const metrics = computed(() => [
  [{ title: 'Token 总量', value: usage.value.total, token: true, icon: Hash, color: '#2563eb' }, { title: '当前工具', value: usage.value.tools, token: false, icon: Layers, color: '#8050d3' }, { title: '会话', value: usage.value.sessions, token: false, icon: MessageSquare, color: '#0086a8' }],
  [{ title: '输入', value: usage.value.input, token: true, icon: ArrowDown, color: '#2563eb' }, { title: '输出', value: usage.value.output, token: true, icon: ArrowUp, color: '#c07305' }, { title: '缓存读取', value: usage.value.cache, token: true, icon: HardDrive, color: '#009588' }],
  [{ title: '主会话', value: usage.value.main, token: true, icon: MessageSquare, color: '#2563eb' }, { title: '子 Agent', value: usage.value.subagent, token: true, icon: Workflow, color: '#0086a8' }, { title: '模型', value: usage.value.models, token: false, icon: Box, color: '#8050d3' }],
])
const tokenMetrics = computed(() => [
  { title: 'Token 总量', value: rangeUsage.value.total, icon: Hash, color: '#2563eb' }, { title: '未缓存输入', value: rangeUsage.value.input, icon: ArrowDown, color: '#a05f00' }, { title: '缓存读取', value: rangeUsage.value.cache, icon: RefreshCw, color: '#00789a' }, { title: '输出', value: rangeUsage.value.output, icon: ArrowUp, color: '#8050d3' },
])
const composition = computed(() => [
  { name: '未缓存输入', value: rangeUsage.value.input, color: '#2563eb' }, { name: '缓存读取', value: rangeUsage.value.cache, color: '#0086a8' }, { name: '输出', value: rangeUsage.value.output, color: '#8556d8' },
])
const ringGradient = computed(() => {
  let start = 0
  return `conic-gradient(${composition.value.map(item => { const end = start + item.value / rangeUsage.value.total * 100; const part = `${item.color} ${start}% ${end}%`; start = end; return part }).join(',')})`
})
const samples = computed(() => quotaSamples(provider.value, range.value))
const trajectoryPath = computed(() => stepPath(samples.value, 850, 220))
const trajectoryArea = computed(() => `${trajectoryPath.value}V220H0Z`)
const annualCells = computed(() => demoAnnualCells(provider.value, day.value))
const hours = computed(() => demoUsageBars(provider.value, day.value, usageRange.value))
const hourlyMaximum = computed(() => Math.max(...hours.value.map(item => item.value), 1) * 1.15)
const matches = computed(() => filterDemoServices(serviceQuery.value, serviceCategory.value, serviceScope.value, enabledServices.value))
const nativeMatches = computed(() => matches.value.filter(item => item.native))
// Keep the native catalog's first row; search and categories address all 104 extensions.
const extensionMatches = computed(() => matches.value.filter(item => !item.native).slice(0, 3))
const serviceGroups = computed(() => [{ title: '原生服务', items: nativeMatches.value, count: nativeMatches.value.length, subtitle: '自动检测本机账号，无需启用扩展' }, { title: '扩展服务', items: extensionMatches.value, count: matches.value.filter(item => !item.native).length, subtitle: '启用读取后，配置本机账号' }].filter(group => group.items.length))
const quickServices = ['cursor', 'gemini', 'copilot', 'deepseek', 'openrouter', 'kimi', 'minimax', 'windsurf'].map(id => DEMO_SERVICES.find(item => item.id === id)!)
const clients = [
  { name: 'VSCode Codex', icon: Code2, account: true, running: false, memory: '0.0 MiB', processes: 0 }, { name: 'Codex CLI', icon: Terminal, account: true, running: false, memory: '0.0 MiB', processes: 0 }, { name: 'Codex Desktop', icon: Blocks, account: true, running: true, memory: '1.25 GiB', processes: 12 }, { name: 'DeepSeek Harness', icon: Blocks, account: false, running: false, memory: '0.0 MiB', processes: 0 },
]
function navigate(next: DemoPage) { page.value = next; noticesOpen.value = false; optionsOpen.value = false; activeSample.value = undefined }
function selectProvider(next: DemoProvider) { provider.value = next; activeSample.value = undefined }
function openProvider(next: DemoProvider) { selectProvider(next); navigate('quota') }
function feedback(message: string) { updateMessage.value = message; clearTimeout(feedbackTimer); feedbackTimer = setTimeout(() => { updateMessage.value = '' }, 2200) }
function toggleService(id: string) { enabledServices.value = enabledServices.value.includes(id) ? enabledServices.value.filter(value => value !== id) : [...enabledServices.value, id] }
function inspectChart(event: PointerEvent) { const bounds = event.currentTarget instanceof SVGElement ? event.currentTarget.getBoundingClientRect() : null; if (bounds) activeSample.value = Math.max(0, Math.min(samples.value.length - 1, Math.round((event.clientX - bounds.left) / bounds.width * (samples.value.length - 1)))) }
function exportDemo() {
  const blob = new Blob([JSON.stringify({ demonstration: true, account: DEMO_ACCOUNT, provider: provider.value, usage: usage.value }, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a'); link.href = url; link.download = 'Donvis-demo-usage.json'; link.click(); URL.revokeObjectURL(url)
  feedback('已导出固定演示数据')
}
async function openShare() {
  shareOpen.value = true
  shareStatus.value = ''
  await nextTick()
  shareSheet.value?.querySelector<HTMLButtonElement>('button')?.focus()
}
async function closeShare() {
  shareOpen.value = false
  await nextTick()
  shareTrigger.value?.focus()
}
function shareKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') { event.preventDefault(); void closeShare(); return }
  if (event.key !== 'Tab') return
  const buttons = shareSheet.value?.querySelectorAll<HTMLButtonElement>('button:not(:disabled)')
  if (!buttons?.length) return
  const first = buttons[0]!, last = buttons[buttons.length - 1]!
  if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
  else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
}
async function sharePNG() {
  if (!shareCard.value) throw new Error('卡片尚未生成')
  return demoSharePNG(shareCard.value)
}
async function saveShare() {
  try {
    const blob = await sharePNG()
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url; link.download = `Donvis-${shareRange.value}d-2026-11-06.png`; link.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
    shareStatus.value = '图片已保存'
  } catch { shareStatus.value = '无法生成 PNG 图片，请重试。' }
}
async function copyShare() {
  try {
    await navigator.clipboard.write([new ClipboardItem({ 'image/png': sharePNG() })])
    shareStatus.value = '图片已复制'
  } catch { shareStatus.value = '无法复制图片，请使用保存 PNG。' }
}
defineExpose({ openShare })
watch(() => props.mode, value => navigate(value))
watch(() => props.initialProvider, value => selectProvider(value))
watch(() => props.initialDay, value => { day.value = value })
onMounted(() => {
  resize = new ResizeObserver(entries => {
    for (const entry of entries) {
      if (entry.target === root.value) displayWidth.value = entry.contentRect.width
      if (entry.target === canvas.value) {
        if (props.fullWindow && entry.contentRect.width > 0) logicalWidth.value = entry.contentRect.width
        logicalHeight.value = Math.ceil(entry.contentRect.height)
      }
    }
  })
  if (root.value) resize.observe(root.value)
  if (canvas.value) resize.observe(canvas.value)
})
onBeforeUnmount(() => { resize?.disconnect(); clearTimeout(feedbackTimer) })
</script>

<template>
  <div ref="root" class="donvis-app-demo" :class="[`dd-mode-${page}`, focus && `dd-focus-${focus}`, { 'dd-full-window': fullWindow }]" :style="{ aspectRatio: `${logicalWidth} / ${logicalHeight}`, '--dd-canvas-scale': scale }" role="group" aria-label="Donvis v3.2.22 工作台；所有账号与数值为固定演示数据">
    <div ref="canvas" class="dd-canvas" :inert="!interactive || undefined">
      <aside class="dd-sidebar" :inert="shareOpen || undefined">
        <div class="dd-brand"><DonvisMark compact /><span><strong>Donvis</strong><small>AI 用量工作台</small></span></div>
        <p class="dd-side-label">工作空间</p>
        <nav class="dd-navigation" aria-label="Donvis 演示导航"><button v-for="item in navigation" :key="item.id" type="button" :aria-current="page === item.id ? 'page' : undefined" @click="navigate(item.id)"><component :is="item.icon" :size="15" />{{ item.title }}<small v-if="item.id === 'clients'">3</small></button></nav>
        <p class="dd-side-label dd-connected-label">已连接服务 <span>2</span></p>
        <div class="dd-provider-list"><button v-for="id in (['codex', 'claude'] as const)" :key="id" type="button" :aria-pressed="isDetail && provider === id" @click="openProvider(id)"><svg viewBox="0 0 24 24" aria-hidden="true"><path :d="PROVIDER_LOGOS[id]" /></svg><span>{{ DEMO_PROVIDERS[id].shortName }}</span><small>余 {{ DEMO_PROVIDERS[id].remaining }}%</small><i></i></button></div>
        <div class="dd-side-bottom"><span><Settings2 :size="15" />设置</span><p><i></i>本机监控<span>v3.2.22</span></p></div>
      </aside>
      <div class="dd-workspace">
        <header class="dd-toolbar" :inert="shareOpen || undefined"><component :is="currentNav?.icon ?? Activity" :size="14" /><strong>{{ currentNav?.title ?? service.shortName }}</strong><span>2 个服务已接入 <i></i></span><div class="dd-toolbar-menu"><button type="button" aria-label="额度提醒与阈值" :aria-expanded="noticesOpen" @click="noticesOpen = !noticesOpen; optionsOpen = false"><Bell :size="15" /></button><div v-if="noticesOpen" class="dd-menu"><label><input v-model="notifications" type="checkbox">额度与重置提醒</label><small>低额度 20% · 严重不足 10%</small></div></div><div class="dd-toolbar-menu"><button type="button" aria-label="窗口选项" :aria-expanded="optionsOpen" @click="optionsOpen = !optionsOpen; noticesOpen = false"><MoreHorizontal :size="17" /></button><div v-if="optionsOpen" class="dd-menu"><label><input v-model="alwaysOnTop" type="checkbox">窗口置顶</label><small>固定演示数据</small></div></div></header>
        <div v-if="hasServiceFilter" class="dd-service-filter" :inert="shareOpen || undefined"><span>当前服务</span><div class="dd-segments" role="group" aria-label="当前服务"><button v-for="id in (['codex', 'claude'] as const)" :key="id" type="button" :aria-pressed="provider === id" @click="selectProvider(id)">{{ DEMO_PROVIDERS[id].name }}</button></div></div>
        <div class="dd-body" :class="{ 'dd-detail-body': isDetail }" :inert="shareOpen || undefined">
          <template v-if="page === 'dashboard' || isDetail">
            <div class="dd-page-heading"><div><h3>{{ isDetail ? `${service.name} 分析` : '用量总览' }}</h3><p v-if="isDetail">统计截至 {{ DEMO_UPDATED }} · 此 Mac</p></div><div class="dd-heading-actions"><small v-if="!isDetail">11月6日 星期五</small><div><button type="button" @click="feedback('演示数据已同步')"><RefreshCw :size="13" />同步数据</button><button v-if="!isDetail" ref="shareTrigger" type="button" @click="openShare"><Share2 :size="13" />生成用量卡片</button></div></div></div>
            <template v-if="!isDetail"><div class="dd-section-heading"><BarChart3 :size="18" /><h4>{{ day === 'today' ? '今日' : '昨日' }}用量统计</h4><div class="dd-segments" role="group" aria-label="用量统计日期"><button type="button" :aria-pressed="day === 'today'" @click="day = 'today'">今天</button><button type="button" :aria-pressed="day === 'yesterday'" @click="day = 'yesterday'">昨天</button></div></div><div class="dd-daily-metrics"><article v-for="(group, index) in metrics" :key="index"><div v-for="metric in group" :key="metric.title"><span><component :is="metric.icon" :size="11" />{{ metric.title }}</span><strong :style="{ color: metric.color }">{{ metric.token ? compactToken(metric.value).value : metric.value }}<small>{{ metric.token ? compactToken(metric.value).unit : '个' }}</small></strong></div></article></div><p class="dd-stat-date">统计截至 11月6日 {{ DEMO_UPDATED }} · 此 Mac</p></template>
            <div class="dd-section-heading dd-space-before"><Gauge :size="18" /><h4>服务额度</h4></div>
            <div class="dd-account-header"><svg viewBox="0 0 24 24" aria-hidden="true"><path :d="PROVIDER_LOGOS[provider]" /></svg><span><strong>{{ service.name }} <small :class="{ 'dd-plan-gold': provider === 'codex' }">{{ service.plan }}</small></strong><span>{{ accountLabel }}</span></span></div>
            <div class="dd-quota-grid"><template v-for="(window, index) in service.windows" :key="window.title"><article class="dd-card dd-quota-card"><div class="dd-card-title"><BarChart3 :size="17" /><strong>{{ window.title }}</strong><span class="dd-quota-value" :style="{ color: quotaColor(window.remaining) }">{{ window.remaining }}%<small>剩余</small></span></div><div class="dd-track-slot"><span class="dd-quota-track"><i :style="{ width: `${window.remaining}%`, backgroundColor: quotaColor(window.remaining) }"></i></span></div><p>{{ index === service.windows.length - 1 ? '刚刚更新' : '窗口剩余额度' }}</p></article><article class="dd-card dd-reset-card"><div class="dd-card-title"><Clock3 :size="15" /><strong>重置倒计时</strong></div><div class="dd-clock-slot"><div class="dd-clock"><span v-for="(value, unit) in window.reset" :key="unit" class="dd-clock-unit"><span class="dd-digits"><b v-for="(digit, place) in [...value]" :key="place">{{ digit }}</b></span><small>{{ ['天', '时', '分', '秒'][unit] }}</small></span></div></div><p>重置日期 {{ window.date }}</p></article></template></div>
            <section v-if="isDetail" class="dd-native-history dd-panel"><div class="dd-chart-heading"><ChartNoAxesCombined :size="13" /><strong>剩余额度轨迹</strong><div class="dd-segments" role="group" aria-label="额度预览时间范围"><button v-for="days in [1, 7, 30]" :key="days" type="button" :aria-pressed="range === days" @click="range = days">{{ days === 1 ? '今天' : `${days} 天` }}</button></div></div><svg viewBox="0 0 920 200" role="img" aria-label="固定演示额度阶梯轨迹"><g v-for="(label, index) in ['100%', '50%', '0%']" :key="label"><path :d="`M42 ${15 + index * 75}H900`" stroke="#efefef" /><text x="32" :y="18 + index * 75" text-anchor="end">{{ label }}</text></g><g transform="translate(42 15) scale(1 .68)"><path :d="trajectoryArea" fill="#c3971610" /><path :d="trajectoryPath" fill="none" stroke="#c39716" stroke-width="2" /></g><text x="42" y="193">{{ range === 1 ? '00:00' : '10月31日' }}</text><text x="900" y="193" text-anchor="end">{{ DEMO_UPDATED }}</text></svg></section>
            <template v-if="service.hasResources"><div class="dd-section-heading dd-space-before"><CreditCard :size="19" /><h4>账号资源</h4></div><div class="dd-resources"><article class="dd-panel dd-reset-resource"><div class="dd-resource-heading"><Layers :size="16" /><strong>重置卡</strong><span>可用 <b>2</b> 张</span></div><div class="dd-expiry"><CalendarDays :size="16" /><strong>24 天 17 小时后到期</strong><small>12月1日 04:22</small></div><div class="dd-reset-detail"><strong>额度重置卡</strong><span>按当前使用速率，用卡后可用 1 天 9 小时</span><a href="https://chatgpt.com/settings/usage" target="_blank" rel="noopener noreferrer"><RefreshCw :size="12" />去重置</a></div><div class="dd-reset-detail"><strong>额度重置卡</strong><span>按当前使用速率，用卡后可用 1 天 9 小时</span></div></article><article class="dd-panel dd-balance-resource"><div class="dd-resource-heading"><CreditCard :size="15" /><strong>充值余额</strong></div><div class="dd-balance-numbers"><span><small>当前可用</small><strong>{{ service.credits }}<small>积分</small></strong></span><span><small>累计已使用</small><strong>{{ service.usedCredits }}<small>积分</small></strong></span></div></article></div></template>
          </template>

          <template v-else-if="page === 'trends'">
            <div class="dd-page-heading"><h3>额度趋势</h3><button class="dd-text-button" type="button" @click="exportDemo"><MoreHorizontal :size="14" />管理记录⌄</button></div><div class="dd-provider-picker dd-segments" role="group" aria-label="趋势服务"><button v-for="id in (['codex', 'claude'] as const)" :key="id" type="button" :aria-pressed="provider === id" @click="selectProvider(id)">{{ DEMO_PROVIDERS[id].shortName }}</button></div>
            <div class="dd-section-heading"><Gauge :size="18" /><h4>消耗节奏</h4></div><div class="dd-pace-grid"><article class="dd-panel"><strong><Activity :size="13" />每小时消耗</strong><div class="dd-pace-number dd-blue">{{ provider === 'codex' ? '3.0' : '1.8' }}<small>% / 小时</small></div><p>均摊额度的 6.8 倍</p></article><article class="dd-panel"><strong><Timer :size="13" />预计可用时长</strong><div class="dd-pace-number dd-amber">{{ provider === 'codex' ? '10' : '35' }}<small>小时</small>18<small>分</small></div><p>按消耗速度估算，不计重置补充</p></article><article class="dd-panel"><strong><SlidersHorizontal :size="13" />均摊至重置</strong><div class="dd-pace-number dd-cyan">0.4<small>% / 小时</small></div><p>每小时可用额度</p></article><article class="dd-panel"><strong><Lightbulb :size="13" />使用建议</strong><div class="dd-model-advice"><span>{{ provider === 'codex' ? 'gpt-6.1-sol' : 'claude-sonnet' }}</span> · ULTRA</div><p>均值 17.4K Token / 任务<br>目标 ≤ 0.4% / 小时</p></article></div>
            <div class="dd-section-heading dd-space-before"><Folder :size="18" /><h4>额度记录</h4></div><article class="dd-panel dd-history-panel"><div class="dd-chart-heading"><div><strong><ChartNoAxesCombined :size="14" />剩余额度轨迹</strong><small>{{ accountLabel }}</small></div><div class="dd-segments" role="group" aria-label="趋势时间范围"><button v-for="days in [1,7,30]" :key="days" type="button" :aria-pressed="range === days" @click="range = days; activeSample = undefined">{{ days === 1 ? '今天' : `${days} 天` }}</button></div></div><div class="dd-history-value"><strong :style="{ color: quotaColor(primaryRemaining) }">{{ primaryRemaining }}%</strong><span>{{ provider === 'codex' ? '7 天窗口' : '5 小时窗口' }}<small>当前剩余</small></span><small>24 次采样<br>{{ range === 1 ? '11月6日 – 11月6日' : range === 7 ? '10月31日 – 11月6日' : '10月8日 – 11月6日' }}</small></div><div class="dd-chart-relative"><svg class="dd-quota-chart" viewBox="0 0 920 290" role="img" aria-label="剩余额度阶梯图，固定演示数据" @pointermove="inspectChart" @pointerleave="activeSample = undefined"><g v-for="(label, index) in ['100%', '75%', '50%', '25%', '0%']" :key="label"><path :d="`M42 ${20 + index * 55}H892`" stroke="#eeeeee" /><text x="34" :y="24 + index * 55" text-anchor="end">{{ label }}</text></g><g transform="translate(42 20)"><path :d="trajectoryArea" fill="#c3971610" /><path :d="trajectoryPath" fill="none" stroke="#c39716" stroke-width="2" /><path v-if="activeSample !== undefined" :d="`M${activeSample / 23 * 850} 0V220`" stroke="#999" stroke-dasharray="4 4" /></g><text v-for="index in 12" :key="index" :x="42 + (index - 1) / 11 * 850" y="258" text-anchor="middle">{{ range === 1 ? `${String(index - 1).padStart(2, '0')}:00` : `${range === 7 ? '10/' : '10/'}${String(Math.min(31, 8 + (index - 1) * 2))}` }}</text></svg><div v-if="activeSample !== undefined" class="dd-chart-tooltip" :style="{ left: `${Math.min(77, 5 + activeSample / 23 * 80)}%` }">{{ service.shortName }} · {{ samples[activeSample] }}%<small>固定演示采样</small></div></div><div class="dd-range-metrics"><span>▣ 区间最高剩余 <b>{{ Math.max(...samples) }}%</b></span><span>▣ 区间最低剩余 <b>{{ Math.min(...samples) }}%</b></span><span><Clock3 :size="10" />最近采样 <b>{{ DEMO_UPDATED }}</b></span></div></article>
            <article v-if="service.hasResources" class="dd-panel dd-credit-history"><div class="dd-chart-heading"><strong><Wallet :size="14" />积分余额</strong><div class="dd-segments" role="group" aria-label="积分余额时间范围"><button v-for="days in [1,7,30]" :key="days" type="button" :aria-pressed="creditRange === days" @click="creditRange = days">{{ days === 1 ? '今天' : `${days} 天` }}</button></div></div><div class="dd-credit-summary">累计已使用 <strong>{{ (service.usedCredits * (creditRange === 1 ? 1 : creditRange / 3)).toFixed(1) }}</strong><span>积分</span></div><svg viewBox="0 0 920 150" role="img" aria-label="固定演示积分余额阶梯图"><path d="M45 20H895M45 70H895M45 120H895" stroke="#eee" fill="none" /><g v-for="(label,index) in ['140','130','120']" :key="label"><text x="34" :y="24 + index * 50" text-anchor="end">{{ label }}</text></g><path :d="creditRange === 1 ? 'M45 32H650V40H730V59H810V80H895' : 'M45 22H190V31H340V45H460V62H620V76H730V89H895'" fill="none" stroke="#2563eb" stroke-width="2" /><text x="45" y="146">{{ creditRange === 1 ? '00:00' : '10月31日' }}</text><text x="895" y="146" text-anchor="end">{{ DEMO_UPDATED }}</text></svg></article>
          </template>

          <template v-else-if="page === 'sessions'">
            <div class="dd-page-heading"><div><h3>费用与会话</h3><p>统计截至 11月6日 {{ DEMO_UPDATED }}</p></div><button class="dd-primary-button" type="button" @click="feedback('演示用量已更新')"><RefreshCw :size="13" />更新用量</button></div><div class="dd-range-row"><div class="dd-segments" role="group" aria-label="费用与会话时间范围"><button v-for="(days,index) in [1,7,30,365]" :key="days" type="button" :aria-pressed="usageRange === days" @click="usageRange = days; activeBar = undefined">{{ ['今日','7 天','30 天','全年'][index] }}</button></div><button type="button" @click="exportDemo"><Share2 :size="13" />导出⌄</button></div><div class="dd-section-heading"><CircleDot :size="18" /><h4>Token 用量</h4></div><div class="dd-token-metrics"><article v-for="metric in tokenMetrics" :key="metric.title" class="dd-panel"><strong><component :is="metric.icon" :size="15" />{{ metric.title }}</strong><div :style="{ color: metric.color }">{{ compactToken(metric.value).value }}{{ compactToken(metric.value).unit }}<small>Token</small></div></article></div>
            <article v-if="usageRange !== 365" class="dd-panel dd-hourly-panel"><div class="dd-chart-heading"><strong><ChartNoAxesCombined :size="14" />Token 用量趋势</strong><div v-if="usageRange !== 1" class="dd-segments" role="group" aria-label="每日图表内容"><button v-for="title in ['总量','Token 构成']" :key="title" type="button" :aria-pressed="dailyChartMode === title" @click="dailyChartMode = title">{{ title }}</button></div></div><svg viewBox="0 0 920 292" role="img" aria-label="固定演示 Token 用量柱状图" @pointerleave="activeBar = undefined"><defs><linearGradient :id="hourlyGradientId" x1="0" x2="0" y1="0" y2="1"><stop stop-color="#2563eb" /><stop offset="1" stop-color="#82a5ed" /></linearGradient></defs><g v-for="index in 3" :key="index"><path :d="`M42 ${12 + (index - 1) * 122}H902`" stroke="#eee" /><text x="33" :y="16 + (index - 1) * 122" text-anchor="end">{{ index === 3 ? '0' : compactToken(hourlyMaximum * (1 - (index - 1) / 2)).value + compactToken(hourlyMaximum * (1 - (index - 1) / 2)).unit }}</text></g><rect v-for="(hour,index) in usageRange === 1 || dailyChartMode === '总量' ? hours : []" :key="index" :x="42 + index / hours.length * 850 + 6" :y="256 - hour.value / hourlyMaximum * 244" :width="Math.max(4, 850 / hours.length - 12)" :height="hour.value / hourlyMaximum * 244" rx="2" :fill="`url(#${hourlyGradientId})`" @pointerenter="activeBar = index"><title>{{ hour.label }} · {{ compactToken(hour.value).value }}{{ compactToken(hour.value).unit }} Token</title></rect><g v-if="usageRange !== 1 && dailyChartMode === 'Token 构成'"><g v-for="(hour,index) in hours" :key="index"><rect v-for="(item, categoryIndex) in composition" :key="item.name" :x="42 + index / hours.length * 850 + 6" :y="256 - hour.value / hourlyMaximum * 244 * composition.slice(0,categoryIndex + 1).reduce((total, category) => total + category.value / rangeUsage.total, 0)" :width="Math.max(4,850 / hours.length - 12)" :height="hour.value / hourlyMaximum * 244 * item.value / rangeUsage.total" :fill="['#4277f5','#16b8a6','#e7a447'][categoryIndex]"><title>{{ hour.label }} · {{ item.name }} {{ Math.round(hour.value * item.value / rangeUsage.total).toLocaleString() }} Token</title></rect></g></g><text v-for="(hour,index) in hours.filter((_,index) => index % (usageRange === 1 ? 2 : usageRange === 365 ? 1 : 2) === 0)" :key="index" :x="usageRange === 1 ? 60 + index * 2 / 24 * 850 : 60 + index / Math.ceil(hours.length / (usageRange === 365 ? 1 : 2)) * 850" y="279" text-anchor="middle">{{ hour.label }}</text></svg><div v-if="activeBar !== undefined" class="dd-bar-readout">{{ hours[activeBar]?.label }} · {{ hours[activeBar]?.value.toLocaleString() }} Token · 固定演示</div><div v-if="usageRange !== 1 && dailyChartMode === 'Token 构成'" class="dd-daily-legend"><span v-for="(item,index) in composition" :key="item.name"><i :style="{ backgroundColor: ['#4277f5','#16b8a6','#e7a447'][index] }"></i>{{ item.name === '未缓存输入' ? '输入' : item.name }}</span></div></article>
            <article v-else class="dd-panel dd-calendar-panel"><div class="dd-chart-heading"><strong><Grid2X2 :size="14" />Token 活动</strong></div><div class="dd-calendar-year">2026 年</div><svg viewBox="0 0 920 190" role="img" aria-label="2026 年 Token 活动，记录截至11月6日"><text v-for="cell in annualCells.filter(item => item.firstOfMonth)" :key="cell.label" :x="35 + cell.week * 16" y="18" font-size="10" fill="#888">{{ cell.label.split('月')[0] }}月</text><text v-for="(title,index) in ['一','三','五']" :key="title" x="18" :y="45 + index * 32" font-size="9" fill="#888">{{ title }}</text><rect v-for="cell in annualCells" :key="cell.label" :x="35 + cell.week * 16" :y="32 + cell.weekday * 16" width="13" height="13" rx="2" :fill="cell.value ? '#16b8a6' : '#f2f2f2'"><title>{{ cell.label }} · {{ cell.value.toLocaleString() }} Token</title></rect></svg><div class="dd-calendar-metrics"><span>年度 Token <strong>{{ compactToken(rangeUsage.total).value }}{{ compactToken(rangeUsage.total).unit }}</strong></span><span>有记录天数 <strong>310</strong></span></div></article>
            <div class="dd-distribution-grid"><article class="dd-panel"><div class="dd-chart-heading"><strong><CircleDot :size="13" />Token 构成</strong></div><div class="dd-composition"><div class="dd-donut" :style="{ background: ringGradient }"><span>{{ compactToken(rangeUsage.total).value }}{{ compactToken(rangeUsage.total).unit }}<small>Token</small></span></div><div class="dd-legend"><span v-for="item in composition" :key="item.name"><i :style="{ backgroundColor: item.color }"></i>{{ item.name }}<b>{{ (item.value / rangeUsage.total * 100).toFixed(1) }}%</b></span></div></div></article><article class="dd-panel"><div class="dd-chart-heading"><strong><Cpu :size="13" />模型用量</strong></div><div class="dd-model-ranking"><div v-for="(name,index) in provider === 'codex' ? ['gpt-6.1-sol','gpt-6.1','gpt-6-sol'] : ['claude-sonnet','claude-opus','claude-haiku']" :key="name"><span>{{ name }}</span><i :style="{ width: `${[100,46,22][index]}%`, backgroundColor: ['#2563eb','#0086a8','#8556d8'][index] }"></i><small>{{ compactToken(rangeUsage.total * [.6,.27,.13][index]!).value }}{{ compactToken(rangeUsage.total * [.6,.27,.13][index]!).unit }}</small></div></div></article></div>
          </template>

          <template v-else-if="page === 'services'">
            <div class="dd-page-heading"><div><h3>服务中心</h3><p>额度、余额与官方控制台</p></div><button class="dd-primary-button" type="button" @click="feedback('已同步演示服务')"><RefreshCw :size="13" />同步已启用服务</button></div><div class="dd-multi-account dd-panel"><Layers :size="17" /><div><strong>Codex 多账号</strong><small>独立登录目录 · 分账号缓存与额度</small></div><select v-model="account" aria-label="Codex 演示账号"><option :value="DEMO_ACCOUNT">个人演示 · {{ DEMO_ACCOUNT }}</option><option value="team-demo@donvis.app">团队演示 · team-demo@donvis.app</option></select><span>2 个账号</span><button type="button" @click="feedback('2 个演示账号已刷新')">刷新所有账号</button></div>
            <section class="dd-catalog-intro dd-panel"><div class="dd-catalog-heading"><span><Layers :size="29" /></span><div><h4>把常用的 AI 服务，放在一起</h4><p>2 个原生服务 · 104 个扩展选项。接入后在总览与菜单栏查看额度、余额及更新状态。</p></div></div><div class="dd-catalog-counts"><span><small><Check :size="11" />已接入</small><strong>2</strong></span><span><small><Layers :size="11" />已启用扩展</small><strong>{{ enabledServices.length }}</strong></span><span><small><Grid2X2 :size="11" />可选服务</small><strong>106</strong></span></div><div class="dd-catalog-actions"><span><i></i>扩展组件就绪</span><button type="button" @click="feedback('已刷新演示服务')"><RefreshCw :size="13" />刷新已启用服务</button><button type="button" :aria-expanded="libraryOpen" @click="libraryOpen = !libraryOpen">{{ libraryOpen ? '⌃ 收起服务库' : '⌄ 浏览服务库' }}</button></div><small class="dd-quick-title">快速查找</small><div class="dd-quick-services"><button v-for="item in quickServices" :key="item.id" type="button" @click="serviceQuery = item.name; serviceCategory = 'all'; serviceScope = '全部'; libraryOpen = true"><i :style="{ backgroundColor: SERVICE_CATEGORIES.find(category => category.id === item.category)?.color }"></i>{{ item.name }}<ArrowUpRight :size="11" /></button></div></section>
            <template v-if="libraryOpen"><label class="dd-service-search"><Search :size="15" /><input v-model="serviceQuery" placeholder="搜索服务名称，例如 Cursor、Gemini、DeepSeek" aria-label="搜索服务名称"><span>{{ matches.length }} 项</span></label><div class="dd-library-scope"><div class="dd-segments" role="group" aria-label="服务接入状态"><button v-for="scope in ['全部','已接入','已启用','待接入']" :key="scope" type="button" :aria-pressed="serviceScope === scope" @click="serviceScope = scope">{{ scope }}</button></div><span>启用后仍需完成账号配置</span></div><div class="dd-service-categories" role="group" aria-label="服务类别"><button v-for="category in SERVICE_CATEGORIES" :key="category.id" type="button" :aria-pressed="serviceCategory === category.id" @click="serviceCategory = category.id"><Grid2X2 :size="11" :style="{ color: category.color }" />{{ category.title }}</button></div><template v-for="group in serviceGroups" :key="group.title"><div class="dd-catalog-section-heading"><strong>{{ group.title }} <small>{{ group.count }}</small></strong><span>{{ group.subtitle }}</span></div><div class="dd-service-cards"><article v-for="item in group.items" :key="item.id" class="dd-service-card dd-panel"><div class="dd-service-card-heading"><span class="dd-service-monogram"><svg v-if="item.id === 'codex' || item.id === 'claude'" viewBox="0 0 24 24" aria-hidden="true"><path :d="PROVIDER_LOGOS[item.id]" /></svg><b v-else>{{ item.name.slice(0,2).toUpperCase() }}</b></span><span><strong>{{ item.name }}</strong><small>{{ item.native ? '原生读取 · 自动检测' : SERVICE_CATEGORIES.find(category => category.id === item.category)?.title }}</small></span><ShieldCheck v-if="item.native" :size="16" /></div><p :class="{ 'dd-service-connected': item.native }">{{ item.native ? '● 已接入' : enabledServices.includes(item.id) ? '● 已启用 · 待接入' : '● 可接入' }}</p><small>{{ item.native ? (item.id === 'codex' ? 'Pro 200' : 'Pro') : '配置本机账号后启用；悬停叹号查看说明。' }}</small><div class="dd-service-card-bottom"><span v-if="item.native">最低剩余 <b :style="{ color: quotaColor(DEMO_PROVIDERS[item.id as DemoProvider].remaining) }">{{ DEMO_PROVIDERS[item.id as DemoProvider].remaining }}%</b></span><label v-else class="dd-enable-service">启用<input type="checkbox" :checked="enabledServices.includes(item.id)" @change="toggleService(item.id)"></label><Info :size="14" :aria-label="`${item.name} 接入说明`"><title>仅演示本机账号接入状态</title></Info></div></article></div></template><div v-if="!matches.length" class="dd-empty dd-panel"><Search :size="27" /><strong>没有匹配的服务</strong><p>试试其他名称，或清除当前筛选。</p><button type="button" @click="serviceQuery = ''; serviceCategory = 'all'; serviceScope = '全部'">清除筛选</button></div></template>
          </template>

          <template v-else-if="page === 'clients'"><div class="dd-page-heading dd-clients-heading"><h3>已接入工具</h3><button type="button" @click="feedback('演示工具列表已刷新')"><RefreshCw :size="13" />刷新列表</button></div><template v-for="(client,index) in clients" :key="client.name"><h4 v-if="index === 3" class="dd-local-heading">本机工具</h4><article class="dd-client-card dd-panel"><div class="dd-client-heading"><span><component :is="client.icon" :size="20" /></span><div><strong>{{ client.name }}</strong><small>{{ client.account ? account : '本机客户端 · 进程检测' }}</small></div><b :class="{ 'dd-running': client.running }">{{ client.running ? '运行中' : '未运行' }}</b></div><div class="dd-client-memory"><MemoryStick :size="13" /><span>进程驻留内存</span><strong>{{ client.memory }}</strong><span>{{ client.processes }} 个进程</span></div><p v-if="!client.account"><Info :size="12" />可读取本机运行状态与内存；账号额度和工作指标尚未接入。</p></article></template></template>
        </div>
        <div v-if="updateMessage" class="dd-toast" role="status">{{ updateMessage }}</div>
      </div>
      <div v-if="shareOpen" class="dd-sheet-backdrop" @click.self="closeShare">
        <section ref="shareSheet" class="dd-share-sheet" role="dialog" aria-modal="true" :aria-labelledby="shareTitleId" @keydown="shareKeydown">
          <div class="dd-share-heading"><div><h4 :id="shareTitleId">分享你的 AI 用量</h4><p>仅汇总数据 · 不含邮箱、项目名称或对话正文</p></div><button type="button" aria-label="关闭分享卡片" @click="closeShare"><X :size="16" /></button></div>
          <div class="dd-segments" role="group" aria-label="分享卡片时间范围"><button v-for="days in [1,7,30]" :key="days" type="button" :aria-pressed="shareRange === days" @click="shareRange = days; shareStatus = ''">{{ days === 1 ? '今日' : `${days} 天` }}</button></div>
          <svg ref="shareCard" class="dd-share-card" xmlns="http://www.w3.org/2000/svg" width="660" height="400" viewBox="0 0 660 400" role="img" aria-label="Donvis 固定演示用量分享卡片" font-family="-apple-system,BlinkMacSystemFont,PingFang SC,sans-serif">
            <rect width="660" height="400" rx="22" fill="#171717" />
            <rect x=".5" y=".5" width="659" height="399" rx="21.5" fill="none" stroke="#ffffff33" />
            <text x="30" y="51" fill="#67d9bc" font-size="21">✦</text><text x="58" y="49" fill="#ffffffcc" font-size="13" font-weight="600" letter-spacing="3">DONVIS</text>
            <rect x="518" y="30" width="112" height="28" rx="14" fill="#ffffff14" /><text x="574" y="48" text-anchor="middle" fill="#ffffffcc" font-size="10" letter-spacing="2">{{ shareRange === 1 ? 'TODAY' : `LAST ${shareRange} DAYS` }}</text>
            <text x="30" y="100" fill="#ffffffa6" font-size="15" font-weight="500">AI 与我的协作足迹</text>
            <text x="30" y="174" fill="#67d9bc" font-size="68" font-weight="600" letter-spacing="-3">{{ compactToken(shareUsage.total).value }}{{ compactToken(shareUsage.total).unit }}</text>
            <text x="31" y="200" fill="#ffffff73" font-size="10" letter-spacing="3">TOKENS</text>
            <text x="590" y="133" fill="white" text-anchor="end" font-size="29" font-weight="500">{{ shareUsage.sessions }}</text><text x="603" y="132" fill="#ffffff80" font-size="11">会话</text>
            <text x="590" y="182" fill="white" text-anchor="end" font-size="29" font-weight="500">{{ shareUsage.models }}</text><text x="603" y="181" fill="#ffffff80" font-size="11">模型</text>
            <rect v-for="(item,index) in shareCategories" :key="item.name" :x="30 + shareCategories.slice(0,index).reduce((total, category) => total + category.value / shareUsage.total * 594, 0) + index * 3" y="239" :width="item.value / shareUsage.total * 594" height="9" rx="4.5" :fill="item.color" />
            <g v-for="(item,index) in shareCategories" :key="item.name" :transform="`translate(${30 + index * 210} 0)`"><circle cx="3" cy="279" r="2.5" :fill="item.color" /><text x="13" y="283" fill="#ffffff8c" font-size="10">{{ item.name }}</text><text x="0" y="315" :fill="item.color" font-size="18" font-weight="500">{{ compactToken(item.value).value }}{{ compactToken(item.value).unit }}</text></g>
            <text x="30" y="371" fill="#ffffff73" font-size="9">此 Mac · Token 用量</text><text x="630" y="371" text-anchor="end" fill="#ffffff66" font-size="9">2026年11月6日</text>
          </svg>
          <div class="dd-share-actions"><span role="status"><ShieldCheck :size="12" />{{ shareStatus || '图片仅在本机生成，由你选择是否分享' }}</span><button type="button" @click="copyShare">复制图片</button><button class="dd-primary-button" type="button" @click="saveShare">保存 PNG…</button></div>
        </section>
      </div>
    </div>
  </div>
</template>

<style scoped>
.donvis-app-demo { --dd-accent:#087e70; --dd-secondary:#858585; --dd-border:#e6e6e6; position:relative; width:100%; overflow:hidden; border-radius:14px; color:#303030; background:#fff; font-family:-apple-system,BlinkMacSystemFont,'PingFang SC',sans-serif; text-align:left; isolation:isolate; color-scheme:light; line-height:1.2; }
.dd-canvas { position:absolute; inset:0 auto auto 0; width:1220px; min-height:840px; display:flex; transform:scale(var(--dd-canvas-scale)); transform-origin:0 0; background:linear-gradient(135deg,#fff,#fefefe); }
.donvis-app-demo :is(button,input,select) { font:inherit; }
.donvis-app-demo button { display:inline-flex; align-items:center; justify-content:center; gap:7px; border:1px solid #e5e5e5; border-radius:9px; padding:7px 11px; background:linear-gradient(#f8f8f8,#f5f5f5); color:#4566ae; font-size:11px; font-weight:600; cursor:pointer; white-space:nowrap; }
.donvis-app-demo button:hover { background:#ededed; }
.donvis-app-demo :is(button,a,input,select):focus-visible { outline:3px solid #087e70; outline-offset:3px; }
.dd-sidebar { flex:0 0 212px; position:relative; border-right:1px solid #ececec; padding-top:55px; background:#ffffffdb; }
.dd-brand { display:flex; align-items:center; gap:11px; padding-inline:24px; margin-bottom:34px; }
.dd-brand :deep(svg) { width:32px; height:38px; }
.dd-brand strong { display:block; font-size:23px; font-weight:600; letter-spacing:-.8px; }
.dd-brand small { display:block; margin-top:4px; font-size:10px; color:#929292; }
.dd-side-label { display:flex; justify-content:space-between; margin:0 24px 12px; font-size:10px; color:#8a8a8a; }
.dd-navigation { display:flex; flex-direction:column; gap:6px; padding-inline:12px; }
.dd-navigation > button { display:flex; justify-content:flex-start; gap:11px; height:42px; padding:0 13px; border:0; border-radius:12px; background:transparent; color:#555; font-size:12px; font-weight:500; text-align:left; }
.dd-navigation small { margin-left:auto; font-size:10px; }
.dd-navigation > button[aria-current='page'],.dd-provider-list button[aria-pressed='true'] { color:white; background:linear-gradient(120deg,#343434,#454545 60%,#333); box-shadow:0 3px 6px #00000014,inset 0 0 0 1px #ffffff29; }
.dd-connected-label { margin-top:32px; }
.dd-provider-list { display:flex; flex-direction:column; gap:5px; padding-inline:12px; }
.dd-provider-list button { display:flex; justify-content:flex-start; gap:10px; height:42px; padding:0 12px; border:0; border-radius:12px; background:transparent; color:#555; font-size:12px; font-weight:500; }
.dd-provider-list svg { width:16px; height:16px; fill:currentColor; }
.dd-provider-list small { margin-left:auto; font-size:9px; color:#929292; font-weight:400; }
.dd-provider-list i,.dd-toolbar i,.dd-side-bottom i { width:4px; height:4px; display:inline-block; border-radius:50%; background:var(--dd-accent); }
.dd-side-bottom { position:absolute; bottom:0; left:20px; right:20px; border-top:1px solid #eee; }
.dd-side-bottom > span { display:flex; gap:11px; align-items:center; padding:24px 5px; font-size:12px; color:#666; }
.dd-side-bottom p { display:flex; align-items:center; gap:6px; margin:0; padding:0 4px 17px; color:#999; font-size:9px; }
.dd-side-bottom p span { margin-left:auto; }
.dd-workspace { flex:1; min-width:0; position:relative; }
.dd-toolbar { height:48px; border-bottom:1px solid #ececec; padding:0 28px; display:flex; align-items:center; gap:9px; font-size:12px; }
.dd-toolbar > svg { color:var(--dd-accent); }
.dd-toolbar strong { font-weight:500; }
.dd-toolbar > span { margin-left:auto; color:#999; display:flex; align-items:center; gap:9px; }
.dd-toolbar-menu { position:relative; }
.dd-toolbar-menu > button { width:28px; height:28px; padding:0; background:transparent; border:0; color:var(--dd-accent); }
.dd-menu { position:absolute; right:0; top:33px; min-width:215px; border:1px solid #ddd; border-radius:10px; padding:15px; background:#fff; box-shadow:0 10px 35px #0002; z-index:10; font-size:12px; }
.dd-menu label { display:flex; align-items:center; gap:7px; white-space:nowrap; }
.dd-menu small { display:block; color:#888; margin-top:10px; font-size:10px; }
.dd-service-filter { height:46px; display:flex; align-items:center; gap:12px; padding-inline:24px; border-bottom:1px solid #f3f3f3; font-size:11px; color:#888; }
.dd-segments { display:inline-flex; align-items:center; gap:3px; padding:3px; border:1px solid #e5e5e5; border-radius:11px; background:#fafafa; }
.dd-segments button { min-height:30px; padding:0 13px; border:0; border-radius:10px; color:#888; background:transparent; font-size:12px; font-weight:500; }
.dd-segments button[aria-pressed='true'] { color:#fff; background:#353535; box-shadow:inset 0 0 0 1px #ffffff29; font-weight:600; }
.dd-body { padding:24px; }
.dd-page-heading { display:flex; align-items:center; justify-content:space-between; gap:16px; min-height:54px; margin-bottom:22px; }
.dd-page-heading h3 { margin:0; font-size:30px; font-weight:600; letter-spacing:-.9px; }
.dd-page-heading p { margin:6px 0 0; color:#929292; font-size:11px; }
.dd-heading-actions { text-align:right; }
.dd-heading-actions > small { display:block; margin-bottom:8px; color:#929292; font-size:11px; }
.dd-heading-actions > div { display:flex; gap:8px; }
.dd-section-heading { display:flex; align-items:center; gap:8px; min-height:26px; margin-bottom:14px; }
.dd-section-heading h4 { margin:0; font-size:16px; font-weight:600; }
.dd-section-heading .dd-segments { margin-left:auto; }
.dd-space-before { margin-top:30px; }
.dd-daily-metrics { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:14px; }
.dd-daily-metrics article { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:8px; padding:24px 12px; border:1px solid var(--dd-border); border-radius:14px; background:#fff; }
.dd-daily-metrics article > div { display:flex; flex-direction:column; justify-content:center; min-height:96px; min-width:0; text-align:center; }
.dd-daily-metrics article > div > span { display:flex; justify-content:center; align-items:center; gap:3px; height:16px; font-size:11px; color:#929292; white-space:nowrap; }
.dd-daily-metrics strong { display:block; margin-top:12px; font-size:30px; letter-spacing:-.75px; font-weight:600; font-variant-numeric:tabular-nums; white-space:nowrap; }
.dd-daily-metrics strong small { margin-left:1px; font-size:11px; letter-spacing:0; color:#888; font-weight:400; }
.dd-stat-date { margin:12px 0 0; text-align:right; color:#b8b8b8; font-size:9px; }
.dd-account-header { display:flex; align-items:center; gap:11px; min-height:36px; margin:20px 0 16px; }
.dd-account-header > svg { width:28px; height:28px; fill:currentColor; }
.dd-account-header strong { display:flex; align-items:center; gap:8px; font-size:15px; font-weight:600; }
.dd-account-header strong small { border:1px solid #c7b5df; border-radius:5px; padding:3px 7px; color:#8050d3; background:#f8f3ff; font-size:11px; }
.dd-account-header strong .dd-plan-gold { color:#c8a253; background:#292113; border-color:#a98c50; box-shadow:inset 0 0 0 1px #f3d39466; }
.dd-account-header > span > span { display:block; margin-top:5px; color:#929292; font-size:11px; }
.dd-quota-grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:24px 14px; }
.dd-card { padding:18px; border:1px solid var(--dd-border); border-radius:22px; background:#fff; }
.dd-card-title { display:flex; align-items:center; gap:8px; height:36px; font-size:13px; }
.dd-card-title strong { font-weight:600; }
.dd-quota-value { display:flex; align-items:baseline; gap:6px; margin-left:auto; font-size:30px; font-weight:600; letter-spacing:-.5px; font-variant-numeric:tabular-nums; }
.dd-quota-value small { font-size:11px; font-weight:400; color:#999; letter-spacing:0; }
.dd-track-slot,.dd-clock-slot { height:61px; display:flex; align-items:center; margin-top:8px; }
.dd-quota-track { display:block; width:100%; height:20px; border-radius:20px; overflow:hidden; background:#f0f0f0; }
.dd-quota-track i { display:block; height:100%; border-radius:inherit; }
.dd-card > p { display:flex; align-items:flex-end; min-height:28px; margin:10px 0 0; font-size:10px; color:#999; font-variant-numeric:tabular-nums; }
.dd-clock { display:flex; align-items:center; gap:16px; transform:scale(.875); transform-origin:0 50%; white-space:nowrap; }
.dd-clock-unit { display:flex; align-items:center; gap:8px; }
.dd-digits { display:flex; gap:4px; }
.dd-digits b { position:relative; display:grid; place-items:center; width:36px; height:61px; border-radius:6px; background:#333; font-size:42px; font-weight:600; color:#ccc; font-variant-numeric:tabular-nums; box-shadow:0 2px 3px #0002; }
.dd-digits b::after { content:''; position:absolute; inset:50% 0 auto; height:1px; background:#0006; box-shadow:0 1px #ffffff12; }
.dd-clock-unit small { font-size:13px; color:#888; }
.dd-panel { padding:20px; border:1px solid var(--dd-border); border-radius:14px; background:#fff; }
.dd-resources { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:14px; }
.dd-resource-heading { display:flex; align-items:center; gap:8px; min-height:32px; font-size:14px; }
.dd-resource-heading > strong { font-weight:600; }
.dd-resource-heading > span { margin-left:auto; color:#b69cd5; font-size:10px; }
.dd-resource-heading b { font-size:28px; font-weight:600; color:#8050d3; }
.dd-expiry { display:flex; align-items:center; gap:8px; margin:15px 0; color:#34b765; font-size:15px; }
.dd-expiry small { margin-left:auto; color:#999; font-size:11px; }
.dd-reset-detail { position:relative; display:flex; flex-direction:column; gap:8px; padding:12px 65px 12px 12px; margin-top:8px; border-radius:10px; background:#34c75910; font-size:12px; }
.dd-reset-detail > span { color:#2563eb; font-size:13px; }
.dd-reset-detail a { position:absolute; right:12px; top:22px; display:flex; align-items:center; gap:4px; color:#8050d3; font-size:11px; text-decoration:none; }
.dd-balance-numbers { display:flex; align-items:center; justify-content:space-around; min-height:170px; }
.dd-balance-numbers > span { display:flex; flex-direction:column; align-items:center; gap:8px; flex:1; }
.dd-balance-numbers small { color:#999; font-size:11px; }
.dd-balance-numbers strong { color:#087e70; font-size:32px; font-weight:600; font-variant-numeric:tabular-nums; }
.dd-balance-numbers > span:last-child strong { color:#2563eb; }
.dd-balance-numbers strong small { margin-left:4px; color:inherit; }
.dd-native-history { margin-top:20px; }
.dd-native-history > svg { width:100%; height:180px; display:block; margin-top:14px; }
.dd-native-history text,.dd-history-panel text,.dd-credit-history text,.dd-hourly-panel text { font-size:10px; fill:#8b8b96; }
.dd-detail-body .dd-page-heading { margin-bottom:20px; }
.dd-detail-body > .dd-space-before:first-of-type { margin-top:0; }
.dd-chart-heading { display:flex; align-items:center; gap:8px; font-size:12px; }
.dd-chart-heading strong { display:flex; align-items:center; gap:7px; font-weight:600; }
.dd-chart-heading > .dd-segments { margin-left:auto; }
.dd-chart-heading > div:first-child > small { display:block; margin-top:6px; font-size:11px; color:#999; }
.dd-provider-picker { margin-bottom:20px; }
.dd-pace-grid { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:14px; }
.dd-pace-grid > article { padding:20px; height:168px; }
.dd-pace-grid > article > strong { display:flex; align-items:center; gap:8px; font-size:12px; font-weight:600; }
.dd-pace-number { display:flex; justify-content:center; align-items:baseline; gap:6px; margin-top:22px; font-size:42px; line-height:1.1; font-weight:600; font-variant-numeric:tabular-nums; white-space:nowrap; }
.dd-pace-number small { font-size:11px; font-weight:400; color:#999; }
.dd-blue { color:#2563eb; }.dd-amber { color:#c07305; }.dd-cyan { color:#0086a8; }
.dd-pace-grid p { margin:13px -8px 0; color:#999; text-align:center; line-height:1.5; font-size:10px; }
.dd-model-advice { margin-top:33px; text-align:center; font-size:18px; font-weight:600; color:#0086a8; white-space:nowrap; }
.dd-model-advice > span { color:#8556d8; }
.dd-model-advice + p { margin-top:18px; }
.dd-text-button { border:0!important; background:transparent!important; color:var(--dd-accent)!important; font-size:12px!important; }
.dd-history-panel { padding:20px; }
.dd-history-value { display:flex; align-items:baseline; gap:10px; margin-top:20px; }
.dd-history-value > strong { font-size:54px; font-weight:600; letter-spacing:-2.5px; line-height:1; }
.dd-history-value > span { font-size:11px; font-weight:500; }
.dd-history-value > span small { display:block; margin-top:6px; font-size:10px; color:#999; }
.dd-history-value > small { margin-left:auto; color:#999; text-align:right; font-size:10px; line-height:1.9; }
.dd-chart-relative { position:relative; margin-top:18px; }
.dd-quota-chart { display:block; width:100%; height:290px; }
.dd-chart-tooltip { position:absolute; top:70px; padding:11px 14px; border:1px solid #e2e2e2; border-radius:8px; color:#444; background:#ffffffed; box-shadow:0 5px 15px #0001; font-size:12px; pointer-events:none; }
.dd-chart-tooltip small { display:block; margin-top:5px; font-size:10px; color:#999; }
.dd-range-metrics { display:flex; gap:20px; align-items:center; margin-top:3px; font-size:10px; color:#999; }
.dd-range-metrics > span { display:flex; align-items:center; gap:5px; }
.dd-range-metrics b { color:#087e70; font-size:11px; }
.dd-credit-history { margin-top:14px; }
.dd-credit-summary { margin-block:20px 6px; color:#999; font-size:11px; }
.dd-credit-summary strong { margin:0 4px 0 10px; color:#2563eb; font-size:30px; font-weight:600; }
.dd-credit-history > svg { display:block; width:100%; height:150px; }
.dd-range-row { display:flex; align-items:center; justify-content:space-between; margin-bottom:24px; }
.dd-primary-button { border-color:#444!important; color:#fff!important; background:#363636!important; box-shadow:0 4px 10px #0002; }
.dd-token-metrics { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:12px; }
.dd-token-metrics > article { min-height:132px; }
.dd-token-metrics strong { display:flex; align-items:center; gap:8px; font-size:12px; font-weight:600; }
.dd-token-metrics article > div { margin-top:15px; font-size:32px; font-weight:600; font-variant-numeric:tabular-nums; }
.dd-token-metrics article > div small { margin-left:7px; color:#999; font-size:10px; font-weight:400; }
.dd-hourly-panel { position:relative; margin-top:16px; }
.dd-hourly-panel > svg { display:block; width:100%; height:284px; margin-top:12px; }
.dd-daily-legend { display:flex; gap:24px; color:#999; font-size:10px; margin-top:7px; }.dd-daily-legend span { display:flex; align-items:center; gap:5px; }.dd-daily-legend i { width:5px; height:5px; border-radius:50%; }
.dd-calendar-panel { margin-top:16px; }.dd-calendar-year { margin-top:20px; color:#666; font-size:13px; }.dd-calendar-panel > svg { display:block; width:100%; height:190px; margin-top:12px; }.dd-calendar-metrics { display:flex; gap:120px; font-size:11px; color:#999; }.dd-calendar-metrics strong { margin-left:7px; color:#087e70; font-size:16px; font-weight:600; }
.dd-bar-readout { position:absolute; right:30px; top:20px; color:#777; font-size:10px; }
.dd-distribution-grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:16px; margin-top:16px; }
.dd-distribution-grid > article { min-height:250px; }
.dd-composition { display:flex; align-items:center; gap:22px; height:210px; }
.dd-donut { display:grid; place-items:center; flex-shrink:0; width:170px; height:170px; border-radius:50%; }
.dd-donut > span { display:flex; flex-direction:column; align-items:center; justify-content:center; width:112px; height:112px; border-radius:50%; background:#fff; color:#555; font-size:23px; font-weight:600; }
.dd-donut small { margin-top:5px; color:#999; font-size:10px; font-weight:400; }
.dd-legend { display:flex; flex:1; flex-direction:column; gap:18px; }
.dd-legend > span { display:flex; align-items:center; gap:6px; color:#999; font-size:12px; }
.dd-legend i { width:6px; height:6px; border-radius:50%; }
.dd-legend b { margin-left:auto; color:#444; font-weight:600; }
.dd-model-ranking { display:flex; flex-direction:column; justify-content:center; gap:24px; height:210px; }
.dd-model-ranking > div { position:relative; padding-left:107px; padding-right:50px; }
.dd-model-ranking span { position:absolute; left:0; top:2px; font-size:11px; color:#777; }
.dd-model-ranking i { display:block; height:18px; border-radius:2px; max-width:100%; }
.dd-model-ranking small { position:absolute; right:0; top:2px; color:#777; font-size:11px; }
.dd-multi-account { display:flex; align-items:center; gap:12px; min-height:66px; padding:16px; margin-bottom:22px; }
.dd-multi-account > svg { color:#8050d3; }
.dd-multi-account strong { display:block; font-size:13px; font-weight:600; }
.dd-multi-account small { display:block; margin-top:5px; color:#999; font-size:11px; }
.dd-multi-account select { margin-left:auto; max-width:245px; padding:7px; border:1px solid #e7e7e7; border-radius:8px; background:#fafafa; font-size:11px; color:#555; }
.dd-multi-account > span { color:#999; font-size:11px; white-space:nowrap; }
.dd-catalog-intro { padding:22px; border-radius:20px; }
.dd-catalog-heading { display:flex; align-items:center; gap:18px; }
.dd-catalog-heading > span { display:grid; place-items:center; width:56px; height:56px; flex-shrink:0; border-radius:17px; background:#fafafa; color:#345fd1; }
.dd-catalog-heading h4 { margin:0; font-size:21px; font-weight:700; }
.dd-catalog-heading p { margin:7px 0 0; color:#999; font-size:12px; }
.dd-catalog-counts { display:flex; margin:20px 0; }
.dd-catalog-counts > span { flex:1; padding:14px; color:#087e70; }
.dd-catalog-counts small { display:flex; gap:8px; align-items:center; font-size:10px; color:#999; }
.dd-catalog-counts strong { display:block; margin-top:10px; font-size:27px; font-weight:700; }
.dd-catalog-counts > span:nth-child(2) { color:#8050d3; }.dd-catalog-counts > span:nth-child(3) { color:#345fd1; }
.dd-catalog-actions { display:flex; gap:10px; align-items:center; margin-bottom:22px; }
.dd-catalog-actions > span { display:flex; align-items:center; gap:5px; color:#087e70; background:#f4f7f6; border-radius:10px; padding:7px 10px; font-size:10px; font-weight:600; margin-right:auto; }
.dd-catalog-actions i { width:4px; height:4px; border-radius:50%; background:#087e70; }
.dd-quick-title { color:#999; font-size:10px; }
.dd-quick-services { display:flex; flex-wrap:wrap; gap:8px; margin-top:10px; }
.dd-quick-services > button { min-width:108px; height:32px; flex:1; justify-content:flex-start; color:#333; font-size:11px; font-weight:500; border-radius:9px; background:#fafafa; }
.dd-quick-services > button:last-child { flex-grow:0; min-width:126px; }
.dd-quick-services i { width:4px; height:4px; border-radius:50%; }
.dd-quick-services svg { margin-left:auto; color:#999; }
.dd-service-search { display:flex; align-items:center; gap:12px; height:44px; margin-top:20px; padding:14px; border:1px solid #e8e8e8; border-radius:12px; background:#fafafa; color:#999; }
.dd-service-search input { width:100%; min-width:0; border:0; padding:0; outline:none; background:transparent; color:#555; font-size:13px; }
.dd-service-search > span { white-space:nowrap; font-size:11px; }
.dd-library-scope { display:flex; align-items:center; justify-content:space-between; margin-top:16px; }
.dd-library-scope > span { font-size:11px; color:#999; }
.dd-service-categories { display:flex; gap:8px; margin-top:15px; }
.dd-service-categories button { min-height:31px; border-radius:16px; color:#999; background:#fafafa; font-size:11px; font-weight:400; }
.dd-service-categories button[aria-pressed='true'] { color:#333; background:#f1f1f1; }
.dd-catalog-section-heading { display:flex; align-items:center; justify-content:space-between; margin:22px 0 16px; }
.dd-catalog-section-heading > strong { font-size:15px; font-weight:700; }
.dd-catalog-section-heading strong small { display:inline-block; padding:3px 7px; margin-left:7px; border-radius:12px; background:#f6f6f6; color:#999; font-size:11px; }
.dd-catalog-section-heading > span { color:#999; font-size:10px; }
.dd-service-cards { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:16px; }
.dd-service-card { padding:18px; border-radius:17px; }
.dd-service-card-heading { display:flex; align-items:center; gap:10px; }
.dd-service-monogram { display:grid; place-items:center; width:46px; height:46px; flex-shrink:0; border:1px solid #e9e9e9; border-radius:13px; color:#087e70; background:#fafafa; font-size:17px; }
.dd-service-monogram svg { width:25px; height:25px; fill:currentColor; }
.dd-service-card-heading strong { display:block; font-size:15px; font-weight:700; }
.dd-service-card-heading small { display:block; margin-top:5px; font-size:10px; color:#999; }
.dd-service-card-heading > svg { margin-left:auto; color:#087e70; }
.dd-service-card > p { margin:16px 0 9px; font-size:10px; color:#999; }
.dd-service-card > p.dd-service-connected { color:#087e70; }
.dd-service-card > small { display:block; min-height:30px; color:#999; font-size:11px; line-height:1.5; }
.dd-service-card-bottom { display:flex; justify-content:space-between; align-items:center; padding-top:12px; margin-top:9px; border-top:1px solid #eee; color:#999; font-size:11px; }
.dd-service-card-bottom b { margin-left:8px; font-weight:600; }
.dd-enable-service { display:flex; align-items:center; gap:7px; }
.dd-empty { display:flex; flex-direction:column; align-items:center; gap:12px; margin-top:20px; padding:36px; color:#888; }
.dd-empty strong { color:#555; font-size:15px; }.dd-empty p { font-size:12px; margin:0; }
.dd-clients-heading h3 { font-size:24px; letter-spacing:0; }
.dd-client-card { margin-top:20px; }
.dd-client-heading { display:flex; align-items:center; gap:12px; }
.dd-client-heading > span { display:grid; place-items:center; width:36px; height:36px; border-radius:10px; color:#087e70; background:#f0f7f5; }
.dd-client-heading strong { display:block; font-size:14px; font-weight:600; }
.dd-client-heading small { display:block; margin-top:6px; color:#999; font-size:12px; }
.dd-client-heading > b { margin-left:auto; padding:6px 10px; border-radius:16px; color:#999; background:#efefef; font-size:12px; font-weight:400; }
.dd-client-heading > b.dd-running { color:#087e70; }
.dd-client-memory { display:flex; align-items:center; gap:8px; margin-top:14px; font-size:12px; color:#999; }
.dd-client-memory svg { color:#087e70; }.dd-client-memory strong { margin-left:auto; color:#444; font-weight:600; }
.dd-client-card > p { display:flex; gap:8px; margin:12px 0 0; color:#999; font-size:11px; }
.dd-local-heading { font-size:14px; font-weight:600; margin:24px 0 0; }
.dd-toast { position:absolute; top:60px; left:50%; transform:translateX(-50%); z-index:20; padding:10px 18px; border:1px solid #ddd; border-radius:10px; background:#fffffff2; color:#087e70; box-shadow:0 5px 25px #0001; font-size:12px; white-space:nowrap; }
.dd-focus-quota .dd-quota-card,.dd-focus-reset .dd-reset-card { border-color:#b9ceca; box-shadow:0 0 0 1px #087e7012; }

.dd-sheet-backdrop { position:absolute; inset:0; z-index:30; display:flex; align-items:flex-start; justify-content:center; padding-top:82px; background:#00000025; }
.dd-share-sheet { width:708px; padding:24px; border:1px solid #e0e0e0; border-radius:18px; background:#fafafa; box-shadow:0 20px 70px #0003; }
.dd-share-heading { display:flex; align-items:center; justify-content:space-between; margin-bottom:18px; }
.dd-share-heading h4 { margin:0; font-size:23px; font-weight:600; }
.dd-share-heading p { margin:5px 0 0; font-size:11px; color:#888; }
.dd-share-heading > button { width:28px; height:28px; padding:0; color:#777; }
.dd-share-card { display:block; width:660px; height:400px; margin-top:18px; }
.dd-share-actions { display:flex; align-items:center; gap:8px; margin-top:18px; }
.dd-share-actions > span { display:flex; align-items:center; gap:5px; margin-right:auto; color:#888; font-size:11px; }

/* Preserve the entire workspace in the Studio shot while keeping the labels
   readable at presentation size. Zoom lays out text at its displayed scale. */
@supports (zoom: 1) {
  .dd-full-window .dd-canvas { zoom:var(--dd-canvas-scale); transform:none; }
}
.dd-full-window .dd-sidebar { flex-basis:192px; padding-top:36px; }
.dd-full-window .dd-brand { margin-bottom:24px; }
.dd-full-window .dd-navigation > button,
.dd-full-window .dd-provider-list button { height:37px; font-size:14px; }
.dd-full-window .dd-connected-label { margin-top:24px; }
.dd-full-window .dd-toolbar { font-size:15px; }
.dd-full-window .dd-service-filter { font-size:13px; }
.dd-full-window .dd-segments button { font-size:13px; }
.dd-full-window .dd-body { padding:16px 22px 20px; }
.dd-full-window .dd-page-heading { min-height:44px; margin-bottom:14px; }
.dd-full-window .dd-page-heading h3 { font-size:33px; }
.dd-full-window .dd-section-heading { margin-bottom:10px; }
.dd-full-window .dd-section-heading h4 { font-size:18px; }
.dd-full-window .dd-space-before { margin-top:18px; }
.dd-full-window .dd-panel { padding:14px 17px; }
.dd-full-window .dd-chart-heading,
.dd-full-window .dd-card-title,
.dd-full-window .dd-resource-heading,
.dd-full-window .dd-token-metrics strong,
.dd-full-window .dd-pace-grid > article > strong { font-size:15px; }
.dd-full-window :is(.dd-brand small,.dd-side-label,.dd-provider-list small,.dd-side-bottom p,.dd-page-heading p,.dd-heading-actions > small,.dd-stat-date,.dd-account-header > span > span,.dd-card > p,.dd-expiry small,.dd-balance-numbers small,.dd-pace-grid p,.dd-range-metrics,.dd-legend > span,.dd-model-ranking span,.dd-model-ranking small,.dd-catalog-heading p,.dd-multi-account small,.dd-client-heading small) {
  color:#636774;
  font-size:13px;
}
.dd-full-window .dd-provider-list button[aria-pressed='true'] small { color:#d4d8e1; }
.dd-full-window :is(.dd-native-history,.dd-history-panel,.dd-credit-history,.dd-hourly-panel) text {
  font-size:13px;
  font-weight:500;
  fill:#636774;
}
.dd-full-window .dd-quota-grid { gap:12px; }
.dd-full-window .dd-card { padding:11px 17px; }
.dd-full-window .dd-track-slot,.dd-full-window .dd-clock-slot { height:48px; margin-top:4px; }
.dd-full-window .dd-card > p { min-height:0; margin-top:8px; }
.dd-full-window .dd-clock { transform:none; gap:13px; }
.dd-full-window .dd-digits b { width:31px; height:45px; font-size:34px; }
.dd-full-window .dd-native-history { margin-top:13px; }
.dd-full-window .dd-native-history > svg { height:162px; margin-top:4px; }
.dd-full-window .dd-balance-numbers { min-height:138px; }
.dd-full-window .dd-provider-picker,.dd-full-window .dd-range-row { margin-bottom:12px; }
.dd-full-window .dd-pace-grid > article { height:137px; }
.dd-full-window .dd-pace-number { margin-top:13px; }
.dd-full-window .dd-model-advice { margin-top:20px; }
.dd-full-window .dd-model-advice + p { margin-top:12px; }
.dd-full-window .dd-history-value,.dd-full-window .dd-chart-relative { margin-top:9px; }
.dd-full-window .dd-quota-chart { height:222px; }
.dd-full-window .dd-credit-summary { margin-top:9px; }
.dd-full-window .dd-credit-history > svg { height:115px; }
.dd-full-window .dd-token-metrics > article { min-height:98px; }
.dd-full-window .dd-hourly-panel > svg { height:220px; margin-top:6px; }
.dd-full-window .dd-distribution-grid > article { min-height:0; }
.dd-full-window .dd-composition,.dd-full-window .dd-model-ranking { height:150px; }
.dd-full-window .dd-donut { width:130px; height:130px; }
.dd-full-window .dd-donut > span { width:90px; height:90px; }
.dd-full-window.dd-focus-quota .dd-quota-card,
.dd-full-window.dd-focus-reset .dd-reset-card {
  border-color:#91b7af;
  box-shadow:0 0 0 1px #087e7017;
  background:#f8fcfb;
}

@media (max-width:600px) {
  .dd-full-window .dd-canvas { width:1040px; }
  .dd-full-window .dd-sidebar { flex-basis:172px; }
  .dd-full-window .dd-brand { gap:8px; padding-inline:16px; }
  .dd-full-window .dd-provider-list button { gap:6px; padding-inline:7px; }
  .dd-full-window .dd-clock { gap:9px; }
  .dd-full-window .dd-clock-unit { gap:5px; }
  .dd-full-window .dd-digits b { width:27px; }
  .dd-full-window .dd-daily-metrics { gap:10px; }
  .dd-full-window .dd-daily-metrics article { gap:5px; padding-inline:8px; }
  .dd-full-window .dd-daily-metrics strong { font-size:26px; }
  .dd-full-window .dd-pace-number { font-size:34px; }
  .dd-full-window .dd-model-advice { font-size:16px; }
}

@media(prefers-reduced-motion:reduce) { .donvis-app-demo * { scroll-behavior:auto; } }
</style>
