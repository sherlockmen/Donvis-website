<script setup lang="ts">
import { computed, getCurrentInstance } from 'vue'
import { GitBranch } from 'lucide-vue-next'
import DonvisAppDemo from '../../../components/DonvisAppDemo.vue'
import { PROVIDER_LOGOS, type DemoPage } from '../../../components/donvisDemoData'
import AnalysisStory from '../AnalysisStory.vue'
import PerformanceStory from '../PerformanceStory.vue'
import ContextStory from '../ContextStory.vue'
import ActivityStory from '../ActivityStory.vue'
import ToolsNativePopover from '../ToolsNativePopover.vue'
import ShareStory from '../ShareStory.vue'
import SignalStory from '../SignalStory.vue'

// Display-only reuse of the existing owning-code reconstructions. No new
// product behavior, data source, selector, or timer is implemented here.
// The native windows retain the complete app layout. The scroll stage
// controls how the full window enters and settles.
type PerformanceView = 'tools' | 'tasks' | 'parallel' | 'compaction'
const props = defineProps<{ view: string; caption?: string; performanceView?: PerformanceView; fullWindow?: boolean }>()
const performanceViews = computed<PerformanceView[]>(() => props.performanceView ? [props.performanceView] : ['tools', 'tasks', 'parallel', 'compaction'])
const uid = `native-showcase-${getCurrentInstance()?.uid ?? 0}`
const windows: readonly string[] = ['dashboard', 'quota', 'reset', 'sessions', 'trends', 'services', 'clients']
const parts: readonly string[] = ['analysis', 'valuation', 'performance', 'context', 'activity', 'storage', 'footprint', 'effort', 'menubar', 'accounts', 'settings', 'share']
const view = computed(() => windows.includes(props.view) || parts.includes(props.view) ? props.view : 'dashboard')
const windowMode = computed(() => windows.includes(view.value) ? view.value as DemoPage : null)
const labels: Record<string, string> = {
  dashboard: 'Donvis 用量总览', quota: 'Codex 额度、资源与观测轨迹', reset: 'Codex 重置倒计时与账号资源',
  sessions: '费用与会话中的 Token、时段和模型用量', trends: '额度趋势、消耗节奏与积分历史',
  services: '服务中心与 Codex 多账号', clients: '本机已接入工具与进程驻留内存',
  analysis: 'Codex 服务详情中的会话明细、主会话与子 Agent',
  valuation: '费用与会话中的 API 参考估值及按主会话数统计的项目分布，已主动启用示例参考价，非实际账单',
  performance: 'Codex 服务详情中的首Token等待、工具执行、任务耗时、Agent并行度与上下文压缩',
  context: '最近 Codex 主会话的上下文占用、200 格容量图与压缩采样记录',
  activity: 'Codex 已记录的工作与空闲时段', storage: 'Codex 只读磁盘空间分类统计',
  footprint: 'Codex 累计Token、峰值、连续天数与年度活动记录', effort: 'Codex 推理强度与更快用量分布',
  menubar: 'Donvis 菜单栏速览近景',
  accounts: 'Donvis 菜单栏内的服务与 Codex 账号目录', settings: '菜单栏显示偏好及额度提醒设置，默认阈值30%与15%',
  share: 'Donvis 用量分享图片',
}
const label = computed(() => `${props.fullWindow || !props.caption ? labels[view.value] : props.caption}；按原生界面重绘，固定示例数据`)
</script>

<template>
  <figure class="native-showcase-frame" :class="[`nsf-view-${view}`, { 'nsf-window': windowMode && !fullWindow, 'nsf-full-window': fullWindow }]" :data-native-view="view" role="img" :aria-label="label">
    <div class="nsf-image" inert aria-hidden="true">
      <DonvisAppDemo v-if="windowMode" :key="view" :mode="windowMode" :interactive="false" :full-window="fullWindow" :initial-service-library-open="!fullWindow" :focus="view === 'reset' ? 'reset' : view === 'quota' ? 'quota' : undefined"/>
      <div v-else-if="view === 'analysis'" class="nsf-analysis">
        <div class="nsf-fragment-heading"><svg viewBox="0 0 24 24"><path :d="PROVIDER_LOGOS.codex" fill="currentColor"/></svg><span>Codex</span><i/><GitBranch :size="14"/><strong>会话明细</strong></div>
        <AnalysisStory :id="`${uid}-analysis`"/>
      </div>
      <AnalysisStory v-else-if="view === 'valuation'" :id="`${uid}-valuation`"/>
      <div v-else-if="view === 'performance'" class="nsf-performance-stack">
        <PerformanceStory v-for="mode in performanceViews" :id="`${uid}-performance-${mode}`" :key="mode" :initial-view="mode" :class="`nsf-performance-${mode}`"/>
      </div>
      <ContextStory v-else-if="view === 'context'" :id="`${uid}-context`"/>
      <ActivityStory v-else-if="view === 'activity'" :id="`${uid}-activity`"/>
      <ActivityStory v-else-if="view === 'storage'" :id="`${uid}-storage`" initial-tab="storage"/>
      <ActivityStory v-else-if="view === 'footprint'" :id="`${uid}-footprint`" initial-tab="lifetime"/>
      <ActivityStory v-else-if="view === 'effort'" :id="`${uid}-effort`" initial-tab="effort"/>
      <ToolsNativePopover v-else-if="view === 'menubar'"/>
      <ToolsNativePopover v-else-if="view === 'accounts'" view="accounts"/>
      <SignalStory v-else-if="view === 'settings'" :id="`${uid}-settings`"/>
      <ShareStory v-else-if="view === 'share'" :id="`${uid}-share`"/>
    </div>
    <figcaption v-if="caption || view === 'valuation'">{{ caption || '参考估值已主动开启 · 使用示例单价，非账单 · 项目按主会话数统计' }}</figcaption>
  </figure>
</template>

<style scoped>
.native-showcase-frame{position:relative;width:100%;max-width:920px;min-width:0;margin:0;color:#29292b;font-family:-apple-system,BlinkMacSystemFont,'PingFang SC',sans-serif;isolation:isolate}.nsf-image{position:relative;min-width:0;width:100%;pointer-events:none;user-select:none}.nsf-image :deep(*){cursor:default!important;animation:none!important;transition:none!important;scroll-behavior:auto!important}.native-showcase-frame>figcaption{margin:12px 3px 0;font-size:11px;line-height:1.6;color:#8c8d87;text-align:center}.nsf-fragment-heading{display:flex;align-items:center;gap:9px;min-height:50px;padding:12px 22px;background:#fff;border:1px solid #e4e6eb;border-bottom:0;border-radius:14px 14px 0 0;font-size:12px;color:#767c88}.nsf-fragment-heading>svg:first-child{width:19px;height:19px;color:#272b31}.nsf-fragment-heading>i{height:12px;width:1px;background:#e2e4e9;margin-inline:3px}.nsf-fragment-heading>strong{font-size:13px;font-weight:600;color:#333843}
/* These are the original native fragments, not replacement summary cards.
   Family/performance belong to ProviderDetailView's Codex detail page;
   LocalUsage's Token/time/model page remains the full sessions window. */
.nsf-analysis :deep(.analysis-story){padding:0!important;background:none!important;overflow:visible!important}.nsf-analysis :deep(.analysis-inner){max-width:none;margin:0}.nsf-analysis :deep(.analysis-heading),.nsf-analysis :deep(.analysis-native>:not(.analysis-sessions)),.nsf-analysis :deep(.analysis-status),.nsf-analysis :deep(.analysis-pricing-dialog){display:none!important}.nsf-analysis :deep(.analysis-native){padding:0;border:0;background:none;border-radius:0;box-shadow:none}.nsf-analysis :deep(.analysis-sessions){margin:0;border-radius:0 0 14px 14px;padding:20px 22px}.nsf-analysis :deep(.analysis-family-list){max-height:none;overflow:visible;padding-right:0}.nsf-analysis :deep(.analysis-sessions-heading){gap:16px}
/* Same AppDemo DOM, now framed on the countdown and the actual resource
   cards. Full quota/window context is established in the preceding frame. */
.nsf-view-reset:not(.nsf-full-window) :deep(.donvis-app-demo) { aspect-ratio: auto !important; }
.nsf-view-reset:not(.nsf-full-window) :deep(.dd-canvas) { position: relative; inset: auto; width: 100%; min-height: 0; transform: none !important; }
.nsf-view-reset:not(.nsf-full-window) :deep(:is(.dd-sidebar, .dd-toolbar, .dd-service-filter, .dd-quota-card)),
.nsf-view-reset:not(.nsf-full-window) :deep(.dd-body > :not(.dd-account-header, .dd-quota-grid, .dd-resources)) { display: none !important; }
.nsf-view-reset:not(.nsf-full-window) :deep(.dd-body) { padding: 20px; }
.nsf-view-reset:not(.nsf-full-window) :deep(.dd-account-header) { margin-top: 0; }
.nsf-view-reset:not(.nsf-full-window) :deep(.dd-quota-grid) { grid-template-columns: 1fr; margin-bottom: 18px; }
/* Cost/project evidence belongs to LocalUsage (not Codex family details).
   Keep the original toolbar, range and two native panels, with explicit
   enabled-example/non-billing context in the caption. */
.nsf-view-valuation :deep(.analysis-story){padding:0!important;background:none!important;overflow:visible}.nsf-view-valuation :deep(.analysis-inner){max-width:none;margin:0}.nsf-view-valuation :deep(.analysis-heading),.nsf-view-valuation :deep(.analysis-native>:not(.analysis-toolbar):not(.analysis-range):not(.analysis-proof-grid)),.nsf-view-valuation :deep(.analysis-status),.nsf-view-valuation :deep(.analysis-pricing-dialog){display:none!important}.nsf-view-valuation :deep(.analysis-native){box-shadow:none}
.nsf-performance-stack{display:grid;gap:18px}.nsf-view-performance :deep(.nsf-performance-parallel .performance-metrics),.nsf-view-performance :deep(.nsf-performance-parallel .performance-metric-detail),.nsf-view-performance :deep(.nsf-performance-compaction .performance-metrics),.nsf-view-performance :deep(.nsf-performance-compaction .performance-metric-detail){display:none!important}
/* A hidden LightPillar host has zero area: its own ResizeObserver/IO gates
   WebGL initialization. Only the unchanged native performance block shows. */
.nsf-view-performance :deep(.performance-story){padding:0!important;background:none!important;overflow:visible}.nsf-view-performance :deep(.performance-light),.nsf-view-performance :deep(.performance-heading){display:none!important}.nsf-view-performance :deep(.performance-content){max-width:none;margin:0}.nsf-view-performance :deep(.performance-native){padding:23px;border:1px solid #e1e2e4;box-shadow:none}.nsf-view-performance:not(.nsf-full-window) :deep(.task-window){display:none}.nsf-view-performance :deep(.task-plot){height:210px}.nsf-view-performance :deep(.performance-native footer){line-height:1.7}
/* The original 200 cells are laid flat for this still product layer. The
   camera animation belongs solely to the enclosing scroll sequence. */
.nsf-view-context :deep(.context-story){padding:0!important;background:none!important;overflow:visible}.nsf-view-context :deep(.context-inner){max-width:none;margin:0}.nsf-view-context :deep(.context-heading),.nsf-view-context :deep(.context-samples),.nsf-view-context :deep(.context-reading),.nsf-view-context :deep(.context-footnote),.nsf-view-context :deep(.context-lens){display:none!important}.nsf-view-context :deep(.context-layout){display:block;margin:0}.nsf-view-context :deep(.context-native){margin:0;padding:25px;background:#fff;border:1px solid #e2e2e2;border-radius:14px;box-shadow:none}.nsf-view-context :deep(.context-capacity-grid){perspective:none;cursor:default}.nsf-view-context :deep(.context-strip){width:calc(20% - 2.4px)!important;transform:none!important}.nsf-view-context :deep(.context-strip:nth-child(1)){left:0!important}.nsf-view-context :deep(.context-strip:nth-child(2)){left:calc(20% + .6px)!important}.nsf-view-context :deep(.context-strip:nth-child(3)){left:calc(40% + 1.2px)!important}.nsf-view-context :deep(.context-strip:nth-child(4)){left:calc(60% + 1.8px)!important}.nsf-view-context :deep(.context-strip:nth-child(5)){left:calc(80% + 2.4px)!important}.nsf-view-context :deep(.context-pixel.is-selected){outline:0}.nsf-view-context :deep(.context-grid-shell){margin-block:22px}.nsf-view-context :deep(.context-native-times){line-height:1.6}
:is(.nsf-view-activity,.nsf-view-storage,.nsf-view-footprint,.nsf-view-effort) :deep(.activity-story){padding:0!important;background:none!important}:is(.nsf-view-activity,.nsf-view-storage,.nsf-view-footprint,.nsf-view-effort) :deep(.activity-tabs),:is(.nsf-view-activity,.nsf-view-storage,.nsf-view-footprint,.nsf-view-effort) :deep(.activity-copy),:is(.nsf-view-activity,.nsf-view-storage,.nsf-view-footprint,.nsf-view-effort) :deep(.activity-footnote){display:none!important}:is(.nsf-view-activity,.nsf-view-storage,.nsf-view-footprint,.nsf-view-effort) :deep(.activity-layout){display:block;max-width:none;margin:0}:is(.nsf-view-activity,.nsf-view-storage,.nsf-view-footprint,.nsf-view-effort) :deep(.activity-stage){perspective:none}:is(.nsf-view-activity,.nsf-view-storage,.nsf-view-footprint,.nsf-view-effort) :deep(.activity-native){min-height:0;box-shadow:none;background:#fff;padding:25px}:is(.nsf-view-activity,.nsf-view-storage,.nsf-view-footprint,.nsf-view-effort) :deep(.activity-native>footer){line-height:1.6}
.nsf-view-menubar,.nsf-view-accounts{max-width:410px}:is(.nsf-view-menubar,.nsf-view-accounts) :deep(.tools-popup-size){width:100%;aspect-ratio:auto;height:auto;--tools-popup-height:auto}:is(.nsf-view-menubar,.nsf-view-accounts) :deep(.tools-native-popup){position:relative;inset:auto;width:100%;height:auto;transform:none;box-shadow:none}:is(.nsf-view-menubar,.nsf-view-accounts) :deep(.pop-scroll){flex:none;height:auto;max-height:none;overflow:visible;scrollbar-width:none}
.nsf-view-share :deep(.share-story){padding:0!important;background:none!important}.nsf-view-share :deep(.share-layout){display:block;margin:0;max-width:none}.nsf-view-share :deep(.share-range),.nsf-view-share :deep(.share-controls),.nsf-view-share :deep(.share-status),.nsf-view-share :deep(.share-copy),.nsf-view-share :deep(.share-mobile-values){display:none!important}.nsf-view-share :deep(.share-card-stage){perspective:none}.nsf-view-share :deep(.share-preview-card){width:100%;height:auto;transform:none!important;box-shadow:none}
/* SignalStory owns the real 30/15 settings. Its hidden signal-stage is also
   its IO target, so the old rotating service/notification loop never starts. */
.nsf-view-settings :deep(.signal-story){padding:0!important;background:none!important;overflow:visible}.nsf-view-settings :deep(.signal-inner){max-width:none;margin:0}.nsf-view-settings :deep(.signal-heading),.nsf-view-settings :deep(.signal-stage){display:none!important}.nsf-view-settings :deep(.signal-settings){margin:0;gap:14px}.nsf-view-settings :deep(.signal-native-card){border:1px solid #e2e2df;box-shadow:none}.nsf-view-settings :deep(.signal-native-card h3){font-size:14px}.nsf-view-settings :deep(.signal-native-threshold output){font-variant-numeric:tabular-nums}
.nsf-view-footprint :deep(.activity-calendar-scroll){overflow:visible}.nsf-view-footprint :deep(.activity-heatmap){min-width:0;width:100%;grid-template-columns:repeat(53,minmax(0,1fr));grid-auto-columns:auto;gap:3px}.nsf-view-storage :deep(.storage-inspection){flex-wrap:wrap}

/* Keep the expanded session family and every other row visible while
   shortening the still frame to fit the scroll stage. */
.nsf-full-window .nsf-analysis :deep(.analysis-family-list) {
  display:grid;
  grid-template-columns:repeat(2,minmax(0,1fr));
  column-gap:16px;
}
.nsf-full-window .nsf-analysis :deep(.analysis-family:has(.analysis-family-details)) { grid-column:1 / -1; }
.nsf-full-window .nsf-analysis :deep(.analysis-family-toggle) { padding-block:7px; }
.nsf-full-window .nsf-analysis :deep(.analysis-family-toggle strong) { white-space:normal; overflow:visible; }
.nsf-full-window .nsf-analysis :deep(.analysis-session-label) { padding-block:4px; }
.nsf-full-window .nsf-analysis :deep(.analysis-session-label > span) { line-height:1.28; }
.nsf-full-window .nsf-analysis :deep(:is(.analysis-family-toggle > div > small,.analysis-session-label small,.analysis-session-subline > span)) { color:#687185; }

.nsf-full-window.nsf-view-performance :deep(.performance-native header) { margin-bottom:12px; }
.nsf-full-window.nsf-view-performance :deep(.task-controls) { gap:6px; margin-bottom:10px; }
.nsf-full-window.nsf-view-performance :deep(.task-summary) { margin-bottom:13px; }
.nsf-full-window.nsf-view-performance :deep(.task-summary dt) { margin-bottom:4px; }
.nsf-full-window.nsf-view-performance :deep(.task-chart-card) { padding-block:11px; }
.nsf-full-window.nsf-view-performance :deep(.task-chart-heading) { gap:6px; margin-bottom:8px; }
.nsf-full-window.nsf-view-performance :deep(.task-plot) { height:150px; }
.nsf-full-window.nsf-view-performance :deep(.task-window) { margin-top:3px; }
.nsf-full-window.nsf-view-performance :deep(.task-detail) { min-height:0; margin-top:7px; padding-top:6px; }
.nsf-full-window.nsf-view-performance :deep(.performance-native footer) { margin-top:9px; }
.nsf-full-window.nsf-view-performance :deep(:is(.task-summary dt,.task-y-axis,.task-plot > button > span,.task-detail,.performance-native footer)) { color:#656572; }

/* Lay the menu-bar popover's existing groups side by side in the scroll shot.
   Its header, all usage values, context grid, and footer remain visible. */
.nsf-full-window.nsf-view-menubar { max-width:620px; }
.nsf-full-window.nsf-view-menubar :deep(.pop-scroll) {
  display:grid;
  grid-template-columns:minmax(0,1.15fr) minmax(0,1fr);
  grid-template-areas:'usage-label picker' 'usage quota-label' 'usage quota' 'context-label context-label' 'context context';
  gap:6px 10px;
  padding-block:6px;
}
.nsf-full-window.nsf-view-menubar :deep(.pop-scroll > .section-title:first-child) { grid-area:usage-label; margin:0; }
.nsf-full-window.nsf-view-menubar :deep(.daily-card) { grid-area:usage; }
.nsf-full-window.nsf-view-menubar :deep(.provider-segments) { grid-area:picker; margin:0; }
.nsf-full-window.nsf-view-menubar :deep(.quota-heading) { grid-area:quota-label; margin:0; }
.nsf-full-window.nsf-view-menubar :deep(.service-card) { grid-area:quota; margin:0; }
.nsf-full-window.nsf-view-menubar :deep(.local-heading) { grid-area:context-label; margin:0; }
.nsf-full-window.nsf-view-menubar :deep(.context-card) { grid-area:context; }
.nsf-full-window.nsf-view-menubar :deep(.context-capacity) { grid-template-columns:repeat(40,minmax(0,1fr)); gap:2px; margin-block:7px; }
.nsf-full-window.nsf-view-menubar :deep(.context-capacity > i) { height:5px; }
.nsf-full-window.nsf-view-menubar :deep(:is(.active-model,.daily-card > p,.context-reading,.context-card p,.context-card > .context-legend)) { margin-block:7px 0; }
.nsf-full-window.nsf-view-menubar :deep(.token-details) { margin-top:7px; padding-top:7px; }
.nsf-full-window.nsf-view-menubar :deep(.daily-heading) { margin-bottom:7px; }
.nsf-full-window:is(.nsf-view-menubar,.nsf-view-accounts) :deep(.pop-header) { height:40px; }
.nsf-full-window:is(.nsf-view-menubar,.nsf-view-accounts) :deep(.pop-dock) { padding-block:7px; }
.nsf-full-window:is(.nsf-view-menubar,.nsf-view-accounts) :deep(.pop-main-actions) { margin-top:6px; }
.nsf-full-window.nsf-view-accounts :deep(.pop-scroll) { padding-block:8px; }
.nsf-full-window.nsf-view-accounts :deep(:is(.subpage-heading,.section-title)) { margin-bottom:7px; }
.nsf-full-window.nsf-view-accounts :deep(.local-heading) { margin-top:11px; }
.nsf-full-window.nsf-view-accounts :deep(.account-services > button) { padding-block:6px; }
.nsf-full-window.nsf-view-accounts :deep(.account-services > p) { margin-top:7px; padding-top:7px; }
.nsf-full-window.nsf-view-accounts :deep(.account-list > button) { padding-block:8px; }
.nsf-full-window.nsf-view-accounts :deep(.clients-link) { margin-top:10px; }

@media(max-width:600px){
 .nsf-view-footprint :deep(.activity-heatmap){grid-template-rows:repeat(7,6px);gap:2px}.nsf-view-footprint :deep(.activity-heatmap button){width:100%;height:6px;min-width:0}.nsf-view-footprint :deep(.lifetime-metrics){gap:16px 10px}.nsf-view-valuation :deep(.analysis-native){padding:13px}.nsf-performance-stack{gap:12px}
 .nsf-view-settings :deep(.signal-settings){grid-template-columns:1fr;gap:12px}.nsf-view-settings :deep(.signal-native-card){padding:15px 12px}.nsf-view-settings :deep(.signal-native-body){padding-inline:10px}.nsf-view-settings :deep(.signal-native-toggle),.nsf-view-settings :deep(.signal-picker-row),.nsf-view-settings :deep(.signal-native-threshold){font-size:11px;gap:10px}.nsf-view-settings :deep(.signal-native-toggle>span){line-height:1.6}
 .native-showcase-frame>figcaption{font-size:10px;margin-top:10px}.nsf-fragment-heading{padding-inline:15px;min-height:45px}.nsf-analysis :deep(.analysis-sessions){padding:15px}.nsf-analysis :deep(.analysis-sessions-heading){flex-wrap:wrap;gap:12px}.nsf-analysis :deep(.analysis-search){width:100%}.nsf-analysis :deep(.analysis-search input){width:100%}.nsf-analysis :deep(.analysis-activity){gap:12px;grid-template-columns:repeat(3,minmax(0,1fr))}.nsf-analysis :deep(.analysis-activity-scope){grid-column:1/-1}.nsf-analysis :deep(.analysis-family-details){padding-left:8px}.nsf-analysis :deep(.analysis-family-totals){gap:5px}.nsf-analysis :deep(.analysis-family-totals>div){padding:8px 3px}.nsf-analysis :deep(.analysis-family-toggle>span){font-size:12px}.nsf-analysis :deep(.analysis-session-subline){gap:8px;flex-wrap:wrap}
 .nsf-view-performance :deep(.performance-native){padding:16px 12px}.nsf-view-performance :deep(.performance-native header){flex-wrap:wrap;gap:10px}.nsf-view-performance :deep(.task-plot){height:170px}.nsf-view-context :deep(.context-native){padding:17px 14px}.nsf-view-context :deep(.context-native-value){gap:8px}.nsf-view-context :deep(.context-native-value>span){font-size:10px}.nsf-view-context :deep(.context-native-value>strong){font-size:28px}.nsf-view-context :deep(.context-native-times){font-size:10px}:is(.nsf-view-activity,.nsf-view-storage,.nsf-view-footprint,.nsf-view-effort) :deep(.activity-native){padding:18px 14px}:is(.nsf-view-activity,.nsf-view-storage,.nsf-view-footprint,.nsf-view-effort) :deep(.activity-metrics){gap:10px}:is(.nsf-view-activity,.nsf-view-storage,.nsf-view-footprint,.nsf-view-effort) :deep(.activity-metrics strong){font-size:26px}
 /* Retain the actual native blocks and values, composing a readable content
    close-up on narrow screens instead of a 0.23× desktop screenshot. */
 .nsf-window :deep(.donvis-app-demo){aspect-ratio:auto!important;overflow:visible;border:1px solid #e5e5e5}.nsf-window :deep(.dd-canvas){position:relative;inset:auto;width:100%;min-height:0;transform:none!important}.nsf-window :deep(.dd-sidebar){display:none}.nsf-window :deep(.dd-workspace){width:100%}.nsf-window :deep(.dd-toolbar){padding-inline:14px;gap:6px;height:42px;font-size:11px}.nsf-window :deep(.dd-toolbar>span){font-size:9px;gap:5px}.nsf-window :deep(.dd-toolbar-menu>button){width:23px}.nsf-window :deep(.dd-service-filter){padding-inline:12px;height:42px;gap:7px;font-size:10px}.nsf-window :deep(.dd-segments){gap:2px;padding:2px;border-radius:8px}.nsf-window :deep(.dd-segments button){padding-inline:9px;font-size:10px;min-height:25px;border-radius:6px}.nsf-window :deep(.dd-body){padding:16px 12px}.nsf-window :deep(.dd-page-heading){gap:10px;margin-bottom:17px;min-height:40px}.nsf-window :deep(.dd-page-heading h3){font-size:22px;letter-spacing:-.5px}.nsf-window :deep(.dd-page-heading p){font-size:10px}.nsf-window :deep(.dd-heading-actions){max-width:110px}.nsf-window :deep(.dd-heading-actions>small){font-size:9px}.nsf-window :deep(.dd-heading-actions>div){gap:5px;flex-wrap:wrap;justify-content:flex-end}.nsf-window :deep(button){font-size:9px;gap:4px;padding:6px}.nsf-window :deep(.dd-section-heading){gap:6px;margin-bottom:10px}.nsf-window :deep(.dd-section-heading h4){font-size:13px}.nsf-window :deep(.dd-section-heading>svg){width:14px;height:14px}.nsf-window :deep(.dd-daily-metrics){gap:5px}.nsf-window :deep(.dd-daily-metrics article){grid-template-columns:1fr;gap:9px;padding:10px 3px;border-radius:10px}.nsf-window :deep(.dd-daily-metrics article>div){min-height:43px}.nsf-window :deep(.dd-daily-metrics article>div>span){font-size:9px;gap:2px}.nsf-window :deep(.dd-daily-metrics strong){font-size:22px;margin-top:5px}.nsf-window :deep(.dd-daily-metrics strong small){font-size:9px}.nsf-window :deep(.dd-stat-date){font-size:8px}.nsf-window :deep(.dd-space-before){margin-top:21px}.nsf-window :deep(.dd-account-header){margin-block:14px;gap:8px}.nsf-window :deep(.dd-quota-grid),.nsf-window :deep(.dd-resources),.nsf-window :deep(.dd-distribution-grid),.nsf-window :deep(.dd-client-grid){grid-template-columns:1fr;gap:10px}.nsf-window :deep(.dd-card),.nsf-window :deep(.dd-panel){padding:14px;border-radius:13px}.nsf-window :deep(.dd-card-title){font-size:12px;height:30px;gap:6px}.nsf-window :deep(.dd-quota-value){font-size:28px}.nsf-window :deep(.dd-quota-value small){font-size:10px}.nsf-window :deep(.dd-track-slot),.nsf-window :deep(.dd-clock-slot){height:51px;margin-top:5px}.nsf-window :deep(.dd-card>p){min-height:20px;font-size:9px;margin-top:6px}.nsf-window :deep(.dd-clock){display:grid;width:100%;grid-template-columns:repeat(4,minmax(0,1fr));transform:none;gap:6px}.nsf-window :deep(.dd-clock-unit){display:grid;justify-items:center;gap:3px}.nsf-window :deep(.dd-digits){gap:2px}.nsf-window :deep(.dd-digits b){width:19px;height:36px;font-size:25px;border-radius:4px}.nsf-window :deep(.dd-clock-unit small){font-size:10px}.nsf-window :deep(.dd-native-history>svg){height:auto;min-height:120px}.nsf-window :deep(.dd-expiry){font-size:12px;gap:5px;flex-wrap:wrap}.nsf-window :deep(.dd-expiry small){font-size:9px}.nsf-window :deep(.dd-resource-heading){font-size:12px}.nsf-window :deep(.dd-reset-detail){padding:10px 58px 10px 10px;font-size:10px}.nsf-window :deep(.dd-reset-detail>span){font-size:11px}.nsf-window :deep(.dd-reset-detail a){font-size:9px;right:10px}.nsf-window :deep(.dd-balance-numbers){min-height:110px}.nsf-window :deep(.dd-balance-numbers strong){font-size:28px}.nsf-window :deep(.dd-token-metrics){grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.nsf-window :deep(.dd-token-metrics>article){min-height:100px}.nsf-window :deep(.dd-token-metrics>article>strong){font-size:10px;gap:4px}.nsf-window :deep(.dd-token-metrics>article>div){font-size:25px;margin-top:19px}.nsf-window :deep(.dd-token-metrics small){font-size:9px}.nsf-window :deep(.dd-hourly-panel>svg){height:auto;min-height:150px}.nsf-window :deep(.dd-chart-heading){gap:7px;font-size:11px;flex-wrap:wrap}.nsf-window :deep(.dd-pace-grid){grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.nsf-window :deep(.dd-pace-grid>article){height:151px;padding:12px 8px}.nsf-window :deep(.dd-pace-grid strong){font-size:10px}.nsf-window :deep(.dd-pace-number){font-size:30px;gap:3px;margin-top:21px}.nsf-window :deep(.dd-pace-number small){font-size:9px}.nsf-window :deep(.dd-pace-grid p){font-size:9px;margin-inline:0}.nsf-window :deep(.dd-model-advice){font-size:12px;white-space:normal;margin-top:26px}.nsf-window :deep(.dd-history-value>strong){font-size:42px}.nsf-window :deep(.dd-history-value>small){font-size:9px}.nsf-window :deep(.dd-quota-chart){height:auto;min-height:160px}.nsf-window :deep(.dd-credit-history>svg){height:auto;min-height:110px}.nsf-window :deep(.dd-composition){height:185px;gap:13px}.nsf-window :deep(.dd-donut){width:135px;height:135px}.nsf-window :deep(.dd-donut>span){width:90px;height:90px;font-size:20px}.nsf-window :deep(.dd-legend){font-size:9px}.nsf-window :deep(.dd-model-ranking){height:175px;gap:20px}.nsf-window :deep(.dd-multi-account){flex-wrap:wrap;gap:9px;padding:12px}.nsf-window :deep(.dd-multi-account select){max-width:100%;min-width:0;font-size:10px}.nsf-window :deep(.dd-catalog-heading){gap:12px}.nsf-window :deep(.dd-catalog-heading>span){width:40px;height:40px}.nsf-window :deep(.dd-catalog-heading h4){font-size:21px}.nsf-window :deep(.dd-catalog-actions){flex-wrap:wrap;justify-content:flex-start}.nsf-window :deep(.dd-quick-services){gap:5px;flex-wrap:wrap}.nsf-window :deep(.dd-quick-services>button){min-width:85px;font-size:9px}.nsf-window :deep(.dd-service-search){padding:10px;height:38px;gap:6px}.nsf-window :deep(.dd-service-search input){font-size:11px;min-width:0}.nsf-window :deep(.dd-library-scope){gap:8px;flex-wrap:wrap}.nsf-window :deep(.dd-library-scope>span){font-size:9px}.nsf-window :deep(.dd-service-categories){gap:5px;flex-wrap:wrap}.nsf-window :deep(.dd-service-categories button){font-size:9px;min-height:27px}.nsf-window :deep(.dd-service-cards){grid-template-columns:1fr;gap:10px}.nsf-window :deep(.dd-catalog-section-heading){gap:8px;flex-wrap:wrap}.nsf-window :deep(.dd-client-memory){flex-wrap:wrap;gap:6px}.nsf-window :deep(.dd-client-heading){gap:8px}.nsf-window :deep(.dd-client-heading>div){flex:1;min-width:0}.nsf-window :deep(.dd-client-heading>div>small){overflow-wrap:anywhere}.nsf-window :deep(.dd-client-heading>b){font-size:10px;padding:5px 7px}.nsf-window :deep(.dd-client-heading strong){font-size:13px}.nsf-window :deep(.dd-client-heading small){font-size:10px}
 :is(.nsf-view-menubar,.nsf-view-accounts) :deep(.tools-popup-size){aspect-ratio:auto;height:auto}:is(.nsf-view-menubar,.nsf-view-accounts) :deep(.tools-native-popup){height:auto}
 .nsf-full-window .nsf-analysis :deep(.analysis-sessions-heading>div) { width: auto; }
 .nsf-full-window .nsf-analysis :deep(.analysis-search) { width: 145px; }
 .nsf-full-window .nsf-analysis :deep(.analysis-family-toggle>span>small) { display: inline; margin-left: 3px; }
 .nsf-full-window .nsf-analysis :deep(.analysis-family:not(:has(.analysis-family-details)) .analysis-family-toggle) {
   display:grid; grid-template-columns:12px minmax(0,1fr); gap:2px 4px;
 }
 .nsf-full-window .nsf-analysis :deep(.analysis-family:not(:has(.analysis-family-details)) .analysis-family-toggle > span) { grid-column:2; }
 .nsf-full-window.nsf-view-performance :deep(.task-summary) { grid-template-columns: repeat(4, minmax(0, 1fr)); }
 .nsf-full-window.nsf-view-performance :deep(.task-plot) { height:125px; }
 .nsf-full-window.nsf-view-performance :deep(.task-summary dd) { font-size:20px; }
 .nsf-full-window.nsf-view-performance :deep(.task-summary small) { margin-left:2px; }
 .nsf-full-window.nsf-view-menubar :deep(.pop-scroll) { gap:5px 7px; padding-inline:8px; }
 .nsf-full-window.nsf-view-menubar :deep(.native-card) { padding:8px; }
 .nsf-full-window.nsf-view-menubar :deep(.native-segments button) { padding-inline:6px; font-size:10px; }
 .nsf-full-window.nsf-view-menubar :deep(.quota-heading > button) { padding-inline:4px; font-size:9px; }
 .nsf-full-window.nsf-view-menubar :deep(.daily-primary) { grid-template-columns:minmax(0,1fr) 40px; gap:5px; }
 .nsf-full-window.nsf-view-menubar :deep(.role-tokens) { gap:5px; }
 .nsf-full-window.nsf-view-menubar :deep(.cache-ring) { width:40px; height:40px; padding:4px; }
 .nsf-full-window.nsf-view-menubar :deep(.cache-ring strong) { font-size:12px; }
 .nsf-full-window.nsf-view-menubar :deep(.cache-ring small) { font-size:7px; margin-top:1px; }
 .nsf-full-window.nsf-view-menubar :deep(.total-token) { font-size:20px; }
 .nsf-full-window.nsf-view-menubar :deep(.role-tokens strong) { margin-top:3px; font-size:16px; }
 .nsf-full-window.nsf-view-menubar :deep(:is(.total-token small,.role-tokens small)) { display:inline; margin-left:2px; font-size:8px; }
}
</style>
