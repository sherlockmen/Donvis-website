<script setup lang="ts">
import { computed, ref } from 'vue'
import { Copy, Download, ShieldCheck } from 'lucide-vue-next'
import { compactToken, demoRangeUsage } from '../../components/donvisDemoData'
import { demoSharePNG } from '../../components/demoShareImage'
const shareRange = ref(7), shareStatus = ref(''), busy = ref(false)
const shareCard = ref<SVGSVGElement>()
const shareUsage = computed(() => demoRangeUsage('codex','today',shareRange.value))
const shareCategories = computed(() => [{ name: '输入', value: shareUsage.value.input, color: '#92b7ff' }, { name: '缓存读取', value: shareUsage.value.cache, color: '#67d9bc' }, { name: '输出', value: shareUsage.value.output, color: '#f2c56b' }])
async function exportCard(copy: boolean) {
  if (!shareCard.value || busy.value) return
  const range = shareRange.value
  busy.value = true
  try {
    const image = demoSharePNG(shareCard.value)
    if (copy) { await navigator.clipboard.write([new ClipboardItem({ 'image/png': image })]); shareStatus.value = '示例卡片已复制' }
    else {
      const url = URL.createObjectURL(await image)
      const link = document.createElement('a')
      link.href = url; link.download = `Donvis-demo-${range}d.png`; link.click()
      setTimeout(() => URL.revokeObjectURL(url), 1000)
      shareStatus.value = '示例 PNG 已生成'
    }
  } catch { shareStatus.value = copy ? '浏览器未允许复制，请使用保存 PNG。' : '图片生成失败，请重试。' }
  finally { busy.value = false }
}
</script>
<template>
<section id="share" class="share-story" aria-labelledby="share-title">
  <div class="share-layout">
    <div class="share-visual"><div class="share-range" role="group" aria-label="分享卡片时间范围"><button v-for="days in [1,7,30]" :key="days" type="button" :disabled="busy" :aria-pressed="shareRange === days" @click="shareRange = days; shareStatus = ''">{{ days === 1 ? '今日' : `${days} 天` }}</button></div><div class="share-card-stage">          <svg ref="shareCard" class="share-preview-card" xmlns="http://www.w3.org/2000/svg" width="660" height="400" viewBox="0 0 660 400" role="img" aria-label="Donvis 固定演示用量分享卡片" font-family="-apple-system,BlinkMacSystemFont,PingFang SC,sans-serif">
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
          </svg></div><dl class="share-mobile-values"><div v-for="item in shareCategories" :key="item.name"><dt>{{ item.name }}</dt><dd>{{ compactToken(item.value).value }}<small>{{ compactToken(item.value).unit }}</small></dd></div></dl><div class="share-controls"><button type="button" :disabled="busy" @click="exportCard(true)"><Copy :size="14"/>复制图片</button><button type="button" :disabled="busy" @click="exportCard(false)"><Download :size="14"/>保存 PNG</button></div><p class="share-status" role="status">{{ shareStatus || '预览与导出均为示例数据' }}</p></div>
    <div class="share-copy"><h2 id="share-title">晒出战绩。<br>留住隐私。</h2><p>一天、一周、一个月的 AI 协作，<br>变成一张可以带走的用量卡片。</p><div class="share-privacy"><ShieldCheck :size="20"/><span>只分享汇总数据<small>不含邮箱、项目名称或对话正文</small></span></div><p class="share-detail">图片在本机生成。想继续分析，<a href="#analysis">还能导出 CSV / JSON 报表 ↗</a></p></div>
  </div>
</section>
</template>
<style scoped>
.share-mobile-values{display:none}.share-story{padding:105px max(5.5vw,24px);background:#f1eee7;color:#171717;scroll-margin-top:76px}.share-layout{max-width:1220px;margin:auto;display:grid;grid-template-columns:1.3fr .8fr;align-items:center;gap:7vw}.share-visual{min-width:0}.share-range{display:flex;gap:26px;margin-bottom:26px}.share-range button{border:0;border-bottom:2px solid transparent;padding:8px 0;background:none;color:#868079;font:inherit;font-size:12px;cursor:pointer}.share-range button[aria-pressed=true]{color:#222;border-color:#ed3326}.share-card-stage{perspective:1000px}.share-preview-card{display:block;width:100%;height:auto;box-shadow:0 25px 40px #29221c25;border-radius:22px;transform:rotateY(5deg) rotateX(3deg);transform-origin:left center;transition:transform 350ms cubic-bezier(.22,1,.36,1)}.share-card-stage:focus-within .share-preview-card{transform:none}.share-controls{display:flex;gap:12px;margin-top:32px}.share-controls button{display:flex;gap:9px;align-items:center;padding:11px 16px;min-height:42px;background:transparent;border:1px solid #d6d0c7;border-radius:5px;font:inherit;font-size:11px;cursor:pointer}.share-controls button:last-child{background:#171717;color:#f4f3ef;border-color:#171717}.share-controls button:disabled{opacity:.6;cursor:wait}.share-status{font-size:10px;color:#847b72;min-height:18px;margin-top:14px}.share-copy h2{font-size:clamp(40px,5.2vw,72px);font-weight:550;line-height:1.18;letter-spacing:-.06em;margin:0 0 30px}.share-copy>p{font-size:14px;color:#756e66;line-height:1.9}.share-privacy{display:flex;gap:14px;align-items:center;border-top:1px solid #d7d2c8;margin-top:35px;padding-top:30px;color:#3e5447}.share-privacy span{font-size:13px}.share-privacy small{display:block;font-size:10px;color:#8b8176;margin-top:8px}.share-copy .share-detail{font-size:11px;margin-top:28px}.share-detail a{display:block;color:#38352f}.share-story button:focus-visible{outline:2px solid #ed3326;outline-offset:5px}@media(hover:hover) and (pointer:fine){.share-card-stage:hover .share-preview-card{transform:none}}
@media(max-width:850px){.share-layout{grid-template-columns:1fr;gap:30px}.share-copy{grid-row:1}.share-copy h2{font-size:40px;margin-bottom:20px}.share-copy p br{display:none}.share-privacy{margin-top:20px;padding-top:20px}.share-story{padding-top:60px;padding-bottom:55px}.share-preview-card{transform:none}.share-copy .share-detail{margin-top:20px}.share-visual{max-width:660px;width:100%}}@media(max-width:600px){.share-mobile-values{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin:24px 0 0}.share-mobile-values dt{font-size:11px;color:#847b72}.share-mobile-values dd{margin:8px 0 0;font-size:20px;letter-spacing:-.04em}.share-mobile-values small{font-size:12px;margin-left:2px}}@media(prefers-reduced-motion:reduce){.share-preview-card{transform:none;transition:none}}
</style>