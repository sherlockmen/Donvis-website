export type DemoProvider = 'codex' | 'claude'
export type DemoDay = 'today' | 'yesterday'
export type DemoPage = 'dashboard' | 'quota' | 'reset' | 'trends' | 'sessions' | 'services' | 'clients'
export type ServiceCategory = 'all' | 'native' | 'coding' | 'models' | 'gateways' | 'apps'

// Fixed, public-safe fixtures. This module never reads the installed app or account files.
export const DEMO_ACCOUNT = 'demo@donvis.app'
export const DEMO_DATE = '11 月 6 日'
export const DEMO_UPDATED = '10:52'
export const DEMO_PROVIDERS = {
  codex: { name: 'Codex', shortName: 'Codex', plan: 'Pro 200', remaining: 31, windows: [{ title: '7 天窗口', remaining: 31, reset: ['02', '21', '40', '18'], date: '2026年11月9日 8:32' }], hasResources: true, credits: 120, usedCredits: 18.6 },
  claude: { name: 'Claude Code', shortName: 'Claude', plan: 'Pro', remaining: 64, windows: [{ title: '5 小时窗口', remaining: 76, reset: ['00', '02', '18', '42'], date: '2026年11月6日 13:10' }, { title: '7 天窗口', remaining: 64, reset: ['04', '12', '26', '10'], date: '2026年11月11日 23:18' }], hasResources: false, credits: 0, usedCredits: 0 },
} as const

const usage = {
  codex: { today: { total: 124800, input: 28600, output: 16800, cache: 79400, main: 90000, subagent: 34800, tools: 3, sessions: 8, models: 3 }, yesterday: { total: 98200, input: 21400, output: 12300, cache: 64500, main: 70000, subagent: 28200, tools: 3, sessions: 6, models: 3 } },
  claude: { today: { total: 82600, input: 19200, output: 12600, cache: 50800, main: 64000, subagent: 18600, tools: 3, sessions: 5, models: 3 }, yesterday: { total: 66300, input: 15800, output: 9200, cache: 41300, main: 50000, subagent: 16300, tools: 3, sessions: 4, models: 3 } },
} as const
export function demoUsage(provider: DemoProvider, day: DemoDay) { return usage[provider][day] }
export function demoRangeUsage(provider: DemoProvider, day: DemoDay, days: number) {
  const value = demoUsage(provider, day)
  const recordedDays = days === 365 ? 310 : days // 2026-11-06; future days have no records.
  return { ...value, total: value.total * recordedDays, input: value.input * recordedDays, output: value.output * recordedDays, cache: value.cache * recordedDays, main: value.main * recordedDays, subagent: value.subagent * recordedDays, sessions: value.sessions * recordedDays }
}
export function demoAnnualCells(provider: DemoProvider, day: DemoDay) {
  const base = demoUsage(provider, day).total
  return Array.from({ length: 365 }, (_, index) => {
    const date = new Date(Date.UTC(2026, 0, index + 1))
    return { label: `${date.getUTCMonth() + 1}月${date.getUTCDate()}日`, week: Math.floor((index + 3) / 7), weekday: (index + 3) % 7, value: index < 310 ? base : 0, firstOfMonth: date.getUTCDate() === 1 }
  })
}
export function demoUsageBars(provider: DemoProvider, day: DemoDay, days: number) {
  const count = days === 1 ? 24 : days === 365 ? 12 : days
  const weights = Array.from({ length: count }, (_, index) => days === 1 ? index === 9 ? .42 : index === 10 ? .58 : 0 : [.32, .56, .41, .68, .86, .65, 1][index % 7]!)
  const totalWeight = weights.reduce((total, weight) => total + weight, 0)
  const totalTokens = demoRangeUsage(provider, day, days).total
  let allocated = 0
  return weights.map((weight, index) => {
    const value = index === count - 1 ? totalTokens - allocated : Math.round(totalTokens * weight / totalWeight)
    allocated += value
    const date = new Date(Date.UTC(2026, 10, 7 - days + index))
    const label = days === 1 ? `${String(index).padStart(2, '0')}:00` : days === 365 ? `${index + 1}月` : `${date.getUTCMonth() + 1}/${date.getUTCDate()}`
    return { label, value }
  })
}
export function compactToken(value: number) { return value >= 1000000 ? { value: (value / 1000000).toFixed(1), unit: 'M' } : value >= 1000 ? { value: (value / 1000).toFixed(1), unit: 'K' } : { value: String(value), unit: '' } }
export function quotaColor(value: number) { return value < 20 ? '#ff3b30' : value < 50 ? '#ffcc00' : '#34c759' }

export function stepPath(values: readonly number[], width = 850, height = 220, maximum = 100) {
  if (!values.length || maximum <= 0 || values.some(value => !Number.isFinite(value))) return ''
  const y = (value: number) => Number((height * (1 - Math.min(maximum, Math.max(0, value)) / maximum)).toFixed(2))
  return values.reduce((path, value, index) => index ? `${path}H${Number((index * width / (values.length - 1)).toFixed(2))}V${y(value)}` : `M0 ${y(value)}`, '')
}
export function quotaSamples(provider: DemoProvider, range: number) {
  const end = DEMO_PROVIDERS[provider].windows[0].remaining
  const start = range === 1 ? end + 6 : range === 7 ? 90 : 96
  return Array.from({ length: 24 }, (_, index) => index < 17 && range === 1 ? start : Math.round(start - (start - end) * (range === 1 ? (index - 16) / 7 : index / 23)))
}

export const SERVICE_CATEGORIES: { id: ServiceCategory; title: string; color: string }[] = [
  { id: 'all', title: '全部类别', color: '#2563eb' }, { id: 'native', title: '原生服务', color: '#087e70' }, { id: 'coding', title: '编程工具', color: '#8050d3' }, { id: 'models', title: '模型与云平台', color: '#0086a8' }, { id: 'gateways', title: '聚合与网关', color: '#c07305' }, { id: 'apps', title: '应用与搜索', color: '#be3d6d' },
]
const codingIDs = new Set('clinepass cursor opencode opencodego factory antigravity copilot devin kimi kilo kiro augment jetbrains amp warp windsurf zed codebuff commandcode qoder ibmbob muse coderabbit pi v0 hyper gitkraken xkiro workbuddy helmcode'.split(' '))
const gatewayIDs = new Set('openrouter llmproxy litellm bifrost aixy clawrouter sub2api wayfinder zenmux aiand devpass vercel llmman typesafe synthetic'.split(' '))
const modelIDs = new Set('openai azureopenai alibaba alibabatokenplan qwencloud fireworks gemini zai minimax vertexai moonshot ollama elevenlabs mimo doubao sakana mistral deepseek deepinfra venice stepfun bedrock grok groq deepgram chutes neuralwatt longcat xai xapi nous replicate huggingface atlascloud lithosai fal claudeplatform munito'.split(' '))
const catalog = [
  ['openai','OpenAI'],['azureopenai','Azure OpenAI'],['clinepass','ClinePass'],['cursor','Cursor'],['opencode','OpenCode'],['opencodego','OpenCode Go'],['alibaba','Alibaba'],['alibabatokenplan','Alibaba Token Plan'],['qwencloud','Qwen Cloud'],['factory','Droid'],['fireworks','Fireworks'],['gemini','Gemini'],['antigravity','Antigravity'],['copilot','Copilot'],['devin','Devin'],['zai','z.ai / GLM'],['minimax','MiniMax'],['manus','Manus'],['kimi','Kimi Code'],['kilo','Kilo'],['kiro','Kiro'],['vertexai','Vertex AI'],['augment','Augment'],['jetbrains','JetBrains AI'],['moonshot','Moonshot / Kimi Open Platform'],['amp','Amp'],['t3chat','T3 Chat'],['langdock','Langdock'],['ollama','Ollama'],['synthetic','Synthetic'],['openrouter','OpenRouter'],['elevenlabs','ElevenLabs'],['warp','Warp'],['windsurf','Windsurf'],['zed','Zed'],['perplexity','Perplexity'],['mimo','Xiaomi MiMo'],['doubao','Doubao'],['sakana','Sakana AI'],['abacus','Abacus AI'],['mistral','Mistral'],['deepseek','DeepSeek'],['deepinfra','DeepInfra'],['codebuff','Codebuff'],['venice','Venice'],['commandcode','Command Code'],['qoder','Qoder'],['stepfun','StepFun'],['bedrock','AWS Bedrock'],['grok','Grok'],['groq','Groq'],['llmproxy','LLM Proxy'],['litellm','LiteLLM'],['bifrost','Bifrost'],['aixy','Aixy'],['deepgram','Deepgram'],['poe','Poe'],['chutes','Chutes'],['neuralwatt','Neuralwatt'],['helmcode','Helmcode'],['clawrouter','ClawRouter'],['longcat','LongCat'],['sub2api','sub2api'],['wayfinder','Wayfinder'],['zenmux','ZenMux'],['aiand','ai&'],['zoommate','ZoomMate'],['xai','xAI'],['xapi','X API'],['notion','Notion AI'],['ibmbob','IBM Bob'],['nous','Nous Portal'],['muse','Muse Code'],['coderabbit','CodeRabbit'],['replicate','Replicate'],['huggingface','Hugging Face'],['raycast','Raycast'],['pi','Pi'],['v0','v0'],['typesafe','TypeSafe'],['hyper','Charm Hyper'],['gitkraken','GitKraken AI'],['futureagi','Future AGI'],['devpass','DevPass'],['atlascloud','Atlas Cloud'],['vercel','Vercel AI Gateway'],['llmman','llmman'],['xkiro','xKiro'],['museai','Muse (muse.ai)'],['lithosai','LithosAI'],['workbuddy','WorkBuddy'],['tavily','Tavily'],['linkup','Linkup'],['tinyapi','TinyApi'],['exa','Exa'],['cosmic','Cosmic AI'],['aerostack','Aerostack'],['sailresearch','Sail Research'],['sofya','Sofya'],['fal','fal'],['flora','FLORA'],['parallel','Parallel'],['claudeplatform','Claude Platform'],['munito','Munito'],
] as const
export const DEMO_SERVICES = [
  { id: 'codex', name: 'Codex', category: 'native' as ServiceCategory, native: true },
  { id: 'claude', name: 'Claude Code', category: 'native' as ServiceCategory, native: true },
  ...catalog.map(([id, name]) => ({ id: String(id), name: String(name), category: (codingIDs.has(id) ? 'coding' : gatewayIDs.has(id) ? 'gateways' : modelIDs.has(id) ? 'models' : 'apps') as ServiceCategory, native: false })),
]
export function filterDemoServices(query: string, category: ServiceCategory, scope: string, enabled: readonly string[]) {
  return DEMO_SERVICES.filter(service => (category === 'all' || service.category === category) && service.name.toLowerCase().includes(query.trim().toLowerCase()) && (scope === '全部' || (scope === '已接入' ? service.native : scope === '已启用' ? service.native || enabled.includes(service.id) : !service.native)))
}

// Same provider SVG paths used by the macOS app's bundled MenuBarIcons.
export const PROVIDER_LOGOS = {
  codex: 'M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.872zm16.5963 3.8558L13.1038 8.364 15.1192 7.2a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.407-.667zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1638a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813zm1.0976-2.3654l2.602-1.4998 2.6069 1.4998v2.9994l-2.5974 1.4997-2.6067-1.4997Z',
  claude: 'm4.7144 15.9555 4.7174-2.6471.079-.2307-.079-.1275h-.2307l-.7893-.0486-2.6956-.0729-2.3375-.0971-2.2646-.1214-.5707-.1215-.5343-.7042.0546-.3522.4797-.3218.686.0608 1.5179.1032 2.2767.1578 1.6514.0972 2.4468.255h.3886l.0546-.1579-.1336-.0971-.1032-.0972L6.973 9.8356l-2.55-1.6879-1.3356-.9714-.7225-.4918-.3643-.4614-.1578-1.0078.6557-.7225.8803.0607.2246.0607.8925.686 1.9064 1.4754 2.4893 1.8336.3643.3035.1457-.1032.0182-.0728-.164-.2733-1.3539-2.4467-1.445-2.4893-.6435-1.032-.17-.6194c-.0607-.255-.1032-.4674-.1032-.7285L6.287.1335 6.6997 0l.9957.1336.419.3642.6192 1.4147 1.0018 2.2282 1.5543 3.0296.4553.8985.2429.8318.091.255h.1579v-.1457l.1275-1.706.2368-2.0947.2307-2.6957.0789-.7589.3764-.9107.7468-.4918.5828.2793.4797.686-.0668.4433-.2853 1.8517-.5586 2.9021-.3643 1.9429h.2125l.2429-.2429.9835-1.3053 1.6514-2.0643.7286-.8196.85-.9046.5464-.4311h1.0321l.759 1.1293-.34 1.1657-1.0625 1.3478-.8804 1.1414-1.2628 1.7-.7893 1.36.0729.1093.1882-.0183 2.8535-.607 1.5421-.2794 1.8396-.3157.8318.3886.091.3946-.3278.8075-1.967.4857-2.3072.4614-3.4364.8136-.0425.0304.0486.0607 1.5482.1457.6618.0364h1.621l3.0175.2247.7892.522.4736.6376-.079.4857-1.2142.6193-1.6393-.3886-3.825-.9107-1.3113-.3279h-.1822v.1093l1.0929 1.0686 2.0035 1.8092 2.5075 2.3314.1275.5768-.3218.4554-.34-.0486-2.2039-1.6575-.85-.7468-1.9246-1.621h-.1275v.17l.4432.6496 2.3436 3.5214.1214 1.0807-.17.3521-.6071.2125-.6679-.1214-1.3721-1.9246L14.38 17.959l-1.1414-1.9428-.1397.079-.674 7.2552-.3156.3703-.7286.2793-.6071-.4614-.3218-.7468.3218-1.4753.3886-1.9246.3157-1.53.2853-1.9004.17-.6314-.0121-.0425-.1397.0182-1.4328 1.9672-2.1796 2.9446-1.7243 1.8456-.4128.164-.7164-.3704.0667-.6618.4008-.5889 2.386-3.0357 1.4389-1.882.929-1.0868-.0062-.1579h-.0546l-6.3385 4.1164-1.1293.1457-.4857-.4554.0608-.7467.2307-.2429 1.9064-1.3114Z',
}
