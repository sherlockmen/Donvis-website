<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { ArrowDown, ArrowLeft, ArrowLeftRight, ArrowUp, ArrowUpRight, ChartNoAxesCombined, Check, ChevronRight, Cpu, Gauge, Grid2X2, Hash, Layers, MemoryStick, MessageSquare, Settings2, Terminal, UsersRound } from 'lucide-vue-next'
import DonvisMark from '../../components/DonvisMark.vue'
import { compactToken, DEMO_ACCOUNT, DEMO_PROVIDERS, DEMO_UPDATED, demoUsage, PROVIDER_LOGOS, quotaColor } from '../../components/donvisDemoData'
import type { DemoDay, DemoProvider } from '../../components/donvisDemoData'
import { CONTEXT_SAMPLES, contextBlock, contextSummary } from './context-story'

// Native structure: PopoverView.swift (410×650), ClientAccessView.swift, SettingsView.swift.
// Public-safe fixtures only. This component never reads an installed app or account directory.
export type ToolsPopoverView = 'overview' | 'clients' | 'accounts'
const provider = defineModel<DemoProvider>('provider', { default: 'codex' })
const view = defineModel<ToolsPopoverView>('view', { default: 'overview' })
const props = withDefaults(defineProps<{ activeClient?: string }>(), { activeClient: 'desktop' })
const box = ref<HTMLElement>()
const content = ref<HTMLElement>()
const scale = ref(1)
const day = ref<DemoDay>('today')
const contextSample = CONTEXT_SAMPLES[0]!
const contextUsage = contextSummary(contextSample)
const contextCells = Array.from({ length: 200 }, (_, index) => contextBlock(contextSample, index))
const used = defineModel<boolean>('used', { default: false })
const teamAccount = ref(false)
let resize: ResizeObserver | undefined
const info = computed(() => DEMO_PROVIDERS[provider.value])
const usage = computed(() => demoUsage(provider.value, day.value))
const cachePercent = computed(() => Math.round(usage.value.cache / usage.value.total * 100))
const codexAccount = computed(() => teamAccount.value ? 'team-demo@donvis.app' : DEMO_ACCOUNT)
const account = computed(() => provider.value === 'codex' ? codexAccount.value : 'claude-demo@donvis.app')
const clients = [
  { id: 'vscode', name: 'VSCode Codex', icon: Grid2X2, running: false, memory: '0.0 MiB', processes: 0 },
  { id: 'cli', name: 'Codex CLI', icon: Terminal, running: false, memory: '0.0 MiB', processes: 0 },
  { id: 'desktop', name: 'Codex Desktop', icon: Grid2X2, running: true, memory: '1.25 GiB', processes: 12 },
] as const
const token = (value: number) => { const result = compactToken(value); return `${result.value}${result.unit}` }
const shown = (value: number) => used.value ? 100 - value : value
const resetLabel = (digits: readonly string[]) => Number(digits[0]) ? `${Number(digits[0])} 天 ${Number(digits[1])} 小时后重置` : `${Number(digits[1])} 小时 ${Number(digits[2])} 分后重置`
function selectProvider(next: DemoProvider) { provider.value = next; view.value = 'overview' }
watch(view, async () => { await nextTick(); content.value?.focus({ preventScroll: true }) })
onMounted(() => {
  resize = new ResizeObserver(() => { scale.value = Math.min(1, (box.value?.clientWidth ?? 410) / 410) })
  resize.observe(box.value!)
  scale.value = Math.min(1, box.value!.clientWidth / 410)
})
onBeforeUnmount(() => { resize?.disconnect() })
</script>

<template>
  <div ref="box" class="tools-popup-size">
    <div class="tools-native-popup" :style="{ '--popup-scale': scale }" role="group" aria-label="Donvis 原生菜单栏弹窗，示例数据">
      <header class="pop-header"><DonvisMark compact /><strong>Donvis</strong><span>用量监控</span><button type="button" :aria-label="view === 'overview' ? '管理服务与显示' : '返回额度速览'" @click="view = view === 'overview' ? 'accounts' : 'overview'"><Settings2 v-if="view === 'overview'" :size="16" /><Grid2X2 v-else :size="16" /></button></header>
      <div v-if="view === 'overview'" ref="content" class="pop-scroll" tabindex="0" aria-label="菜单栏内容，可上下滚动">
        <h3 class="section-title"><Hash :size="13" />{{ day === 'today' ? '今日' : '昨日' }}用量</h3>
        <article class="native-card daily-card">
          <div class="daily-heading"><span><Hash :size="11" />全部用量</span><div class="native-segments" role="group" aria-label="用量日期"><button type="button" :aria-pressed="day === 'today'" @click="day = 'today'">今天</button><button type="button" :aria-pressed="day === 'yesterday'" @click="day = 'yesterday'">昨天</button></div></div>
          <div class="daily-primary"><div><a class="total-token" href="#usage">{{ token(usage.total) }}<small>Token</small></a><div class="role-tokens"><div><span><MessageSquare :size="11" />主会话</span><strong>{{ token(usage.main) }}<small>Token</small></strong></div><div><span><UsersRound :size="11" />子 Agent</span><strong>{{ token(usage.subagent) }}<small>Token</small></strong></div></div></div><a class="cache-ring" href="#usage" :style="{ '--cache': `${cachePercent}%` }" :aria-label="`缓存读取占比 ${cachePercent}%`"><span><strong>{{ cachePercent }}%</strong><small>缓存读取</small></span></a></div>
          <div class="token-details"><div><span><ArrowDown :size="10" />输入</span><strong>{{ token(usage.input) }}</strong></div><div><span><Layers :size="10" />缓存</span><strong>{{ token(usage.cache) }}</strong></div><div><span><ArrowUp :size="10" />输出</span><strong>{{ token(usage.output) }}</strong></div></div><div class="active-model"><span><Cpu :size="10" />{{ day === 'today' ? '今日' : '昨日' }}最活跃模型</span><strong>—</strong></div><p>统计截至 11月6日 {{ DEMO_UPDATED }} · 仅此 Mac</p>
        </article>
        <div class="native-segments provider-segments" role="group" aria-label="当前页面服务"><button v-for="key in (['codex', 'claude'] as const)" :key="key" type="button" :aria-pressed="provider === key" @click="selectProvider(key)">{{ DEMO_PROVIDERS[key].name }}</button></div>
        <div class="quota-heading"><h3 class="section-title"><Gauge :size="13" />服务额度 <small>1</small></h3><button type="button" @click="used = !used"><ArrowLeftRight :size="11" />查看{{ used ? '剩余' : '已用' }}</button></div>
        <article class="native-card service-card" :key="provider"><div class="service-header"><svg viewBox="0 0 24 24" aria-hidden="true"><path :d="PROVIDER_LOGOS[provider]" fill="currentColor" /></svg><div><strong>{{ info.name }} <small>{{ info.plan }}</small></strong><span>{{ account }}</span></div></div><div class="service-windows"><div v-for="window in info.windows" :key="window.title" class="compact-quota"><div><span>{{ window.title }}</span><strong :style="{ color: quotaColor(window.remaining) }">{{ shown(window.remaining) }}%</strong></div><i><em :style="{ '--quota-width': `${shown(window.remaining)}%`, background: quotaColor(window.remaining) }"></em></i><p><span>{{ used ? '已用' : '剩余' }}</span><span :title="`重置于 ${window.date}`">{{ resetLabel(window.reset) }}</span></p></div></div></article>
        <h3 v-if="provider === 'codex'" class="section-title local-heading"><Grid2X2 :size="13" />本机运行</h3><article v-if="provider === 'codex'" class="native-card context-card"><div><Grid2X2 :size="12" /><strong>上下文占用</strong><span>最近主会话</span></div><a class="context-reading" href="#context"><b :style="{ color: contextUsage.color }">{{ contextUsage.usedPercent.toFixed(1) }}%</b><span>{{ token(contextSample.usedTokens) }} / {{ token(contextSample.contextWindow) }}</span></a><div class="context-capacity" role="img" :aria-label="`上下文占用 ${contextUsage.usedPercent.toFixed(1)}%，200 格容量图`"><i v-for="cell in contextCells" :key="cell.index" :title="`第 ${cell.index + 1} 格 · 已占用 ${cell.occupied} · 空闲 ${cell.free} Token`"><em :style="{ transform: `scaleX(${cell.fill})`, background: contextUsage.color }"></em></i></div><div class="context-legend"><span>已占用 <b>{{ token(contextSample.usedTokens) }}</b></span><span>空闲 <b>{{ token(contextUsage.remainingTokens) }}</b></span></div><small>上次压缩 · {{ contextSample.lastCompactedAt }}</small></article>
      </div>
      <div v-else-if="view === 'clients'" ref="content" class="pop-scroll clients-page" tabindex="0" aria-label="已接入工具列表">
        <div class="subpage-heading"><button type="button" aria-label="返回额度速览" @click="view = 'overview'"><ArrowLeft :size="15" /></button><h3>已接入工具</h3></div>
        <article v-for="client in clients" :key="client.id" class="native-card client-card" :class="{ 'is-selected-client': props.activeClient === client.id }"><div class="client-heading"><component :is="client.icon" :size="19" /><div><strong>{{ client.name }}</strong><small>{{ codexAccount }}</small></div><span :class="{ 'is-running': client.running }">{{ client.running ? '运行中' : '未运行' }}</span></div><div class="client-memory"><MemoryStick :size="12" /><span>进程驻留内存</span><strong>{{ client.memory }}</strong><small>{{ client.processes }} 个进程</small></div></article>
      </div>
      <div v-else ref="content" class="pop-scroll accounts-page" tabindex="0" aria-label="服务与账号">
        <div class="subpage-heading"><button type="button" aria-label="返回额度速览" @click="view = 'overview'"><ArrowLeft :size="15" /></button><h3>服务与账号</h3></div>
        <h3 class="section-title"><Layers :size="13" />服务中心</h3><article class="native-card account-services"><button v-for="key in (['codex','claude'] as const)" :key="key" type="button" @click="selectProvider(key)"><svg viewBox="0 0 24 24" aria-hidden="true"><path :d="PROVIDER_LOGOS[key]" fill="currentColor" /></svg><span>{{ DEMO_PROVIDERS[key].name }}<small>原生读取 · 已接入</small></span><ChevronRight :size="14" /></button><p>104 个扩展选项<small>需按服务另行配置账号</small></p></article>
        <h3 class="section-title local-heading"><UsersRound :size="13" />Codex 账号</h3><article class="native-card account-list"><button v-for="team in [false,true]" :key="String(team)" type="button" :aria-pressed="teamAccount === team" @click="teamAccount = team"><span class="account-check"><Check v-if="teamAccount === team" :size="12" /></span><span>{{ team ? '团队演示' : '个人演示' }}<small>{{ team ? '独立配置目录' : '当前 Codex 配置' }}</small></span><span>{{ teamAccount === team ? '当前' : '切换' }}</span></button></article><button class="clients-link" type="button" @click="view = 'clients'">查看已接入工具 <ArrowUpRight :size="13" /></button>
      </div>
      <footer class="pop-dock"><div class="pop-quick"><a href="#history"><ChartNoAxesCombined :size="12" />额度趋势</a><a href="#usage"><Layers :size="12" />用量明细</a><button type="button" @click="view = 'accounts'"><UsersRound :size="12" />服务与账号</button></div><div class="pop-main-actions"><a href="#usage"><Grid2X2 :size="13" />打开工作台<ArrowUpRight :size="14" /></a></div></footer>
    </div>
  </div>
</template>

<style scoped>
.tools-popup-size { width: min(410px,100%); aspect-ratio: 410/650; position: relative; }
.tools-native-popup { width:410px;height:650px;position:absolute;inset:0 auto auto 0;transform:scale(var(--popup-scale,1));transform-origin:top left;display:flex;flex-direction:column;background:#f3f3f3;color:#202020;border-radius:12px;outline:1px solid #00000020;box-shadow:0 22px 50px #22221920;font-family:-apple-system,BlinkMacSystemFont,'PingFang SC',sans-serif;font-variant-numeric:tabular-nums; }
.tools-native-popup button,.tools-native-popup a { font-family:inherit;cursor:pointer;text-decoration:none; }
.tools-native-popup button:focus-visible,.tools-native-popup a:focus-visible { outline:2px solid #345fd1;outline-offset:3px; }
.pop-header { flex:none;height:50px;display:flex;align-items:center;padding:10px 18px;gap:8px; }
.pop-header :deep(.donvis-mark) { width:21px;height:21px; }.pop-header>strong { font-size:14px;font-weight:500;letter-spacing:-.3px; }.pop-header>span { font-size:10px;color:#777; }.pop-header>button { margin-left:auto;display:grid;place-items:center;width:30px;height:30px;padding:0;border:0;background:transparent;color:#345fd1; }
.pop-scroll { min-height:0;flex:1;overflow-y:auto;overscroll-behavior:contain;padding:14px 18px;scrollbar-width:thin;scrollbar-color:#00000020 transparent; }.pop-scroll:focus-visible { outline:2px solid #345fd1;outline-offset:-3px; }
.section-title { display:flex;align-items:center;gap:6px;min-height:26px;margin:0 0 14px;font-size:12px;font-weight:600; }.section-title>small { font-size:10px;color:#888; }
.native-card { padding:14px;border-radius:15px;background:#fff;outline:1px solid #00000006; }
.daily-heading { display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:14px; }.daily-heading>span { display:flex;gap:4px;align-items:center;font-size:10px;color:#777; }
.native-segments { display:flex;gap:2px;padding:2px;background:#00000008;border-radius:6px; }.native-segments button { min-height:23px;padding:4px 11px;border:0;border-radius:5px;background:transparent;color:#727272;font-size:10px; }.native-segments button[aria-pressed=true] { color:#222;background:#fff;box-shadow:0 1px 3px #00000012; }
.daily-primary { display:flex;align-items:center;justify-content:space-between;gap:18px; }.daily-primary>div { min-width:0;flex:1; }.total-token { display:inline-block;color:#345fd1;font-size:34px;font-weight:600;letter-spacing:-.8px;white-space:nowrap; }.total-token small,.role-tokens small { margin-left:3px;color:#888;font-size:9px;font-weight:400;letter-spacing:0; }
.role-tokens { display:flex;gap:16px;margin-top:14px; }.role-tokens>div { font-size:10px;color:#777; }.role-tokens span { display:flex;gap:4px;align-items:center; }.role-tokens strong { display:block;margin-top:7px;color:#345fd1;font-size:24px;font-weight:600;letter-spacing:-.8px;white-space:nowrap; }.role-tokens>div:last-child strong { color:#087f99; }
.cache-ring { display:grid;flex:none;width:84px;height:84px;padding:10px;border-radius:50%;background:conic-gradient(#16b8a6 0 var(--cache),#4277f5 var(--cache) 100%); }.cache-ring>span { display:grid;place-content:center;border-radius:50%;background:#fff;text-align:center; }.cache-ring strong { color:#087e70;font-size:20px;font-weight:600; }.cache-ring small { margin-top:3px;color:#777;font-size:8px; }
.token-details { display:flex;margin-top:14px;padding-top:14px;border-top:1px solid #0000000a; }.token-details>div { flex:1; }.token-details span { display:flex;align-items:center;gap:4px;color:#777;font-size:9px; }.token-details strong { display:block;margin-top:6px;color:#345fd1;font-size:14px; }.token-details>div:nth-child(2) strong { color:#087e70; }.token-details>div:last-child strong { color:#a86708; }
.active-model { display:flex;align-items:center;justify-content:space-between;gap:7px;margin-top:14px; }.active-model>span { display:flex;align-items:center;gap:4px;color:#777;font-size:9px; }.active-model strong { font-size:11px;font-weight:500; }.daily-card>p { margin:14px 0 0;color:#888;font-size:9px; }
.provider-segments { width:fit-content;margin-top:14px; }.provider-segments button { padding-inline:17px; }.quota-heading { display:flex;align-items:center;justify-content:space-between;gap:10px;margin-top:8px; }.quota-heading h3 { margin:0; }.quota-heading>button { display:flex;align-items:center;gap:4px;min-height:26px;padding:6px 8px;border:0;border-radius:20px;background:#00000008;color:#087e70;font-size:10px; }
.service-card { margin-top:14px; }.service-header { display:flex;align-items:center;gap:9px; }.service-header>svg { width:21px;height:21px;flex:none; }.service-header>div { min-width:0;display:grid;gap:3px; }.service-header strong { font-size:12px;font-weight:600; }.service-header strong small { margin-left:5px;padding:2px 5px;border-radius:5px;background:#b56b4310;color:#b56b43;font-size:9px;font-weight:500; }.service-header>div>span { overflow:hidden;color:#777;font-size:10px;text-overflow:ellipsis;white-space:nowrap; }
.service-windows { display:flex;gap:20px;margin-top:10px; }.compact-quota { flex:1;min-width:0; }.compact-quota>div { display:flex;justify-content:space-between;align-items:baseline;gap:4px; }.compact-quota>div>span { color:#555;font-size:10.5px; }.compact-quota strong { font-size:12.5px;font-weight:600; }.compact-quota>i { display:block;height:5px;margin-top:5px;border-radius:4px;overflow:hidden;background:#0000000f; }.compact-quota em { display:block;width:var(--quota-width);height:100%;transition:width 350ms cubic-bezier(.22,1,.36,1); }.compact-quota p { display:flex;justify-content:space-between;gap:4px;min-height:26px;margin:5px 0 0;color:#888;font-size:9px;line-height:1.5; }.compact-quota p>span:last-child { text-align:right; }
.local-heading { margin-top:22px; }.context-card>div { display:flex;align-items:center;gap:5px; }.context-card strong { font-size:11px; }.context-card div>span { margin-left:auto;color:#888;font-size:10px; }.context-card p { margin:12px 0 5px;color:#777;font-size:13px; }.context-card>small { color:#888;font-size:10px; }
.context-reading { display:flex;justify-content:space-between;align-items:baseline;gap:8px;margin-top:12px;color:#888;font-size:11px; }.context-reading>b { font-size:25px; }.context-card>.context-capacity { display:grid;grid-template-columns:repeat(25,minmax(0,1fr));gap:3px;margin:10px 0; }.context-capacity>i { height:7px;overflow:hidden;border-radius:2px;background:#8882; }.context-capacity em { display:block;width:100%;height:100%;transform-origin:left; }.context-card>.context-legend { justify-content:space-between;margin:10px 0; }.context-card .context-legend>span { margin:0; }.context-legend b { display:block;margin-top:3px;color:#333;font-size:11px;font-weight:500; }
.pop-dock { flex:none;padding:10px 18px;background:#f3f3f3;border-radius:0 0 12px 12px; }.pop-quick,.pop-main-actions { display:flex;gap:8px; }.pop-quick>a,.pop-quick>button { display:flex;align-items:center;justify-content:center;gap:4px;flex:1;min-width:0;height:30px;padding:0;border:0;border-radius:8px;background:#00000008;color:#087e70;font-size:10px;white-space:nowrap; }.pop-quick>a:nth-child(2) { color:#345fd1; }.pop-quick>button { color:#7951c7; }
.pop-main-actions { margin-top:9px; }.pop-main-actions>a { display:flex;align-items:center;gap:9px;flex:1;height:36px;padding:0 12px;border-radius:10px;background:#00000010;color:#242424;font-size:11px;font-weight:500; }.pop-main-actions>a>svg:first-child { color:#345fd1; }.pop-main-actions>a>svg:last-child { margin-left:auto;color:#087e70; }
.subpage-heading { display:flex;align-items:center;gap:9px;margin:0 0 20px; }.subpage-heading>h3 { margin:0;font-size:20px;font-weight:600;letter-spacing:-.5px; }.subpage-heading>button { display:grid;place-items:center;width:26px;height:30px;padding:0;border:0;background:transparent;color:#345fd1; }.subpage-heading>button:last-child:not(:first-child) { margin-left:auto; }.client-card { margin-bottom:14px;padding:16px; }.client-heading { display:flex;align-items:center;gap:9px; }.client-heading>svg { flex:none;color:#087e70; }.client-heading>div { display:grid;gap:5px;min-width:0; }.client-heading strong { font-size:12px;font-weight:600; }.client-heading small { color:#777;font-size:10px; }.client-heading>span { flex:none;margin-left:auto;padding:5px 8px;border-radius:20px;background:#00000005;color:#777;font-size:10px; }.client-heading>.is-running { color:#087e70; }.client-memory { display:flex;align-items:center;gap:6px;margin-top:18px;font-size:10px; }.client-memory>svg { color:#087e70; }.client-memory>span,.client-memory>small { color:#777; }.client-memory>strong { margin-left:auto;font-size:11px;font-weight:600; }.client-memory>small { font-size:10px; }.is-selected-client { outline:1px solid #087e7030; }
.account-services>button { display:flex;align-items:center;gap:10px;width:100%;padding:10px 0;border:0;background:transparent;text-align:left;font-size:12px; }.account-services>button>svg:first-child { width:20px;height:20px; }.account-services>button>svg:last-child { margin-left:auto;color:#888; }.account-services>button>span { display:grid;gap:4px; }.account-services small { display:block;color:#777;font-size:10px;font-weight:400; }.account-services>p { margin:14px 0 2px;padding-top:14px;border-top:1px solid #0000000a;font-size:12px;font-weight:600; }.account-services>p>small { margin-top:5px; }.account-list { padding:4px 14px; }.account-list>button { display:flex;align-items:center;gap:10px;width:100%;padding:13px 0;border:0;background:transparent;color:#222;text-align:left;font-size:12px; }.account-list>button+button { border-top:1px solid #00000008; }.account-check { display:grid;place-items:center;width:17px;height:17px;border-radius:50%;outline:1px solid #00000024;color:#087e70; }.account-list>button>span:nth-child(2) { display:grid;gap:4px; }.account-list small { color:#777;font-size:10px; }.account-list>button>span:last-child { margin-left:auto;color:#087e70;font-size:11px; }.clients-link { display:flex;align-items:center;gap:5px;margin-top:20px;padding:0;border:0;background:transparent;color:#345fd1;font-size:12px; }
@media(max-width:520px) {
 .tools-popup-size { width:100%;height:var(--tools-popup-height,clamp(480px,76svh,650px));aspect-ratio:auto; }
 .tools-native-popup { width:100%;height:100%;transform:none; }
 .pop-header,.pop-dock { padding-inline:12px; }.pop-scroll { padding:14px 12px;overflow-x:hidden; }.native-card { padding:12px; }
 .daily-heading>span,.pop-header>span,.token-details span,.active-model>span,.daily-card>p,.service-header>div>span,.service-header strong small,.compact-quota p,.context-card div>span,.context-card>small,.client-heading small,.client-heading>span,.client-memory,.client-memory>small,.account-services small,.account-list small { font-size:11px; }
 .native-segments button,.quota-heading>button,.compact-quota>div>span { font-size:12px; }.native-segments button { min-height:28px; }.compact-quota strong { font-size:14px; }
 .daily-primary { display:grid;grid-template-columns:minmax(0,1fr) 76px;gap:14px; }.daily-primary>div { display:contents; }.total-token { grid-column:1;grid-row:1;font-size:30px; }.total-token small,.role-tokens small { display:block;margin:4px 0 0;font-size:11px; }
 .role-tokens { grid-column:1/-1;grid-row:2;gap:18px;margin-top:0; }.role-tokens>div { flex:1;min-width:0;font-size:11px; }.role-tokens strong { font-size:22px; }
 .cache-ring { grid-column:2;grid-row:1;width:76px;height:76px;padding:8px; }.cache-ring small { font-size:11px; }
 .service-windows { flex-direction:column;gap:14px; }.compact-quota p { min-height:0; }.daily-card>p { line-height:1.5; }
 .client-heading small { overflow-wrap:anywhere; }.client-memory { flex-wrap:wrap;gap:5px; }.client-memory>strong { font-size:12px; }
 .pop-quick>a,.pop-quick>button { height:34px;font-size:11px; }.pop-main-actions>a { font-size:12px; }
}
@media(prefers-reduced-motion:reduce) { .compact-quota em { transition:none; } }
</style>
