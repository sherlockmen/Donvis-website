export type FeatureAnchor = '#quota' | '#usage' | '#history' | '#context' | '#tools' | '#signals' | '#services' | '#analysis' | '#activity' | '#share' | '#performance'
export type DirectoryFeature = { id: string; label: string; detail: string; keywords: string; evidence: string }
export type FeatureCategory = {
  id: string
  title: string
  benefit: string
  items: readonly DirectoryFeature[]
  links: readonly { href: FeatureAnchor; label: string }[]
}
const item = (id: string, label: string, detail: string, keywords: string, evidence: string): DirectoryFeature => ({ id, label, detail, keywords, evidence })

// Current owning-code audit: design/preproduction/motionvideo-campaign/feature-audit.md.
// Evidence paths are relative to Donvis/macOS/Sources/Donvis; they are metadata,
// never user-visible implementation copy. Conditional and unavailable capabilities
// retain their actual boundary. Unverified iPhone/iCloud/LAN promotion is excluded.
export const FEATURE_CATEGORIES: readonly FeatureCategory[] = [
  {
    id: 'quota-accounts', title: '额度与账号', benefit: '多几个账号，也不用来回翻后台。',
    links: [{ href: '#quota', label: '看清额度与重置' }, { href: '#services', label: '查看账号接入' }],
    items: [
      item('quota-windows', '短期与周期额度', '按服务查看可读取的额度窗口、账号与套餐。', '5h 7天 周限额 配额 剩余额度', 'UI/ProviderDetailView.swift:90'),
      item('quota-membership', 'Codex 会员标识', '账号卡片为 Go、Plus 和各档 Pro 显示独立图形或数字标识。', '会员 订阅 套餐 Pro 100 200 500 5倍 20倍', 'UI/MembershipBadgeView.swift:20'),
      item('quota-reset', '重置倒计时与时刻', '查看逐位翻动的重置倒计时，也可将菜单栏设为显示官方重置时刻。', 'reset 倒计时 到点 时间', 'UI/ProviderCardView.swift:424'),
      item('quota-freshness', '采样与读取状态', '区分已更新、未提供和暂时无法读取的额度。', '同步 样本 错误 缺失 刷新时间', 'UI/ProviderDetailView.swift:224'),
      item('quota-filter', '当前服务筛选', '集中看全部服务，或只看当前关心的一项。', 'Codex Claude 切换 服务选择 总览', 'UI/DashboardView.swift:54'),
      item('quota-refresh', '手动同步', '在总览同步额度和本机用量，按需重新读取。', '刷新 更新 Cmd R', 'UI/DashboardView.swift:271'),
      item('quota-auto-refresh', '按活跃状态自动刷新', '后台按活跃情况与额度窗口调整查询节奏，锁屏期间暂停自动查询额度。', '轮询 锁屏 自动刷新 后台', 'Core/UsageMonitorService.swift:452'),
      item('profile-associate', '关联已登录 Codex 目录', '添加已单独登录的 CODEX_HOME，集中查看已有账号。', '多账号 配置目录 关联 登录', 'UI/SettingsView.swift:236'),
      item('profile-select', '选择查看账号', '切换 Donvis 当前查看的 Codex 账号，保留 CLI 默认登录。', '切换账号 个人 团队 profile', 'UI/SettingsView.swift:111'),
      item('profile-refresh', '刷新全部账号', '一次更新已关联的 Codex 账号信息。', '批量刷新 多账户', 'UI/SettingsView.swift:135'),
      item('profile-remove', '移除目录关联', '移除 Donvis 中的关联，保留原配置文件。', '删除账号 取消关联 CODEX_HOME', 'UI/SettingsView.swift:126'),
    ],
  },
  {
    id: 'tokens-cost', title: 'Token 与费用', benefit: '从总消耗，看到模型、构成与项目分布。',
    links: [{ href: '#usage', label: '拆开 Token 构成' }, { href: '#analysis', label: '查看参考估值与项目' }],
    items: [
      item('usage-days', '今天与昨天', '在总览切换当天与前一天的本机用量。', '今日 昨日 日期', 'UI/DashboardView.swift:285'),
      item('usage-ranges', '今日、7 天、30 天与全年', '在费用与会话中按时间范围复盘用量。', '统计范围 年度 年份', 'UI/LocalUsageView.swift:87'),
      item('token-composition', '输入、缓存与输出', '分清未缓存输入、缓存读取、缓存写入和输出；推理已含在输出内。', 'cache token 构成 环图 推理', 'UI/LocalUsageView.swift:147'),
      item('usage-time', '小时与多日分布', '看消耗集中在哪一小时、哪一天。', '柱图 小时图 日图 时间', 'UI/LocalUsageView.swift:217'),
      item('usage-heatmap', '年度热图与点日筛选', '翻年查看活动，点一天筛选对应统计与会话，再清除筛选返回范围。', '日历 热力图 全年 年度 日期', 'UI/LocalUsageView.swift:701'),
      item('usage-calendar-modes', '每日、每周与累计用量', '年度活动图可按当天、本周或年内累计用量查看。', '每天 每周 累计总量 年度 活动日历', 'UI/LocalUsageView.swift:885'),
      item('model-ranking', '模型用量排行', '按模型看 Token 用量与构成。', '模型排行 model 排名 分布', 'UI/DesktopUsageCharts.swift:14'),
      item('project-distribution', '项目会话分布', '按主会话数看项目分布，并查看关联项目与模型数量。', '项目 归属 project 饼图', 'UI/DesktopUsageCharts.swift:49'),
      item('api-estimate', '可选 API 参考估值', '主动开启后，按保存的单价换算参考价值；默认关闭，非实际账单。', '费用 成本 价格 USD 估价 金额', 'UI/SettingsView.swift:253'),
      item('model-pricing', '自定模型参考价', '分别设置各模型输入、缓存读写与输出的每百万 Token 单价。', 'pricing 编辑价格 USD 缺价 未计价', 'UI/LocalUsageView.swift:987'),
      item('reference-budget', '本月参考预算', '对照本月参考估值与自设预算，使用自己的费用口径。', '预算 月度预算 budget', 'UI/SettingsView.swift:266'),
    ],
  },
  {
    id: 'sessions-agents', title: '会话与 Agent', benefit: '追到具体会话，分清主线与并行消耗。',
    links: [{ href: '#analysis', label: '追到会话与 Agent' }, { href: '#usage', label: '对照主子会话消耗' }],
    items: [
      item('session-search', '会话标题搜索', '按展示标题找回工作，结合范围或选中日期筛选。', '搜索聊天 搜索会话 query', 'UI/LocalUsageView.swift:258'),
      item('session-detail', '展开会话明细', '继续查看 Token 分类、模型、推理强度与最后活动时间。', '详情 metadata 明细 模型 effort', 'UI/LocalUsageView.swift:302'),
      item('session-pagination', '继续查阅更多会话', '逐次显示更多会话，保留当前范围与搜索条件。', '分页 30项 更多会话 列表', 'UI/LocalUsageView.swift:298'),
      item('session-period', '主会话与子 Agent 分析', '切换主会话或子 Agent，并在 1、7、30 天及前后周期之间查看。', '子代理 子智能体 主子会话 时间范围', 'UI/ProviderDetailView.swift:166'),
      item('session-family', '会话家族归属', '对照主会话自身、子 Agent 合计与含子总计，沿归属展开。', '家族 父子 调用 树 总计', 'UI/ProviderDetailView.swift:496'),
      item('session-exec', '辅助 exec 独立列出', '把辅助执行会话与主会话、子 Agent 分开查看。', 'exec 辅助 执行', 'UI/ProviderDetailView.swift:594'),
      item('session-counts', '消息、响应与调用', '查看消息数、模型响应数、工具调用及各自构成。', '消息统计 响应次数 工具调用 次数', 'UI/ProviderDetailView.swift:176'),
      item('session-activity-breakdown', '按模型或使用端对照活动', '主会话看用户消息，子 Agent 看模型响应，可按模型或使用端切换排行与趋势。', 'Desktop CLI VSCode 活动 统计 构成 排行', 'UI/ProviderDetailView.swift:450'),
      item('session-configuration', '推理强度与更快用量', '两种维度分别统计已结束任务时长；无法准确归属的记录单列为未确认。', 'fast faster 推理强度 模型分布 未确认', 'UI/CodexInsightsView.swift:165'),
      item('skill-reads', '技能读取排行', '看哪些技能被读取过，以及对应的读取请求次数。', 'skill SKILL.md 技能 读取 排行', 'UI/CodexInsightsView.swift:35'),
      item('session-open', '返回 Codex 聊天', '有合法线程标识的 Codex 会话，可打开原聊天继续查看。', '打开聊天 thread UUID deep link 深链', 'UI/ProviderDetailView.swift:653'),
    ],
  },
  {
    id: 'trends-review', title: '趋势与复盘', benefit: '知道额度怎样变化，再决定何时继续。',
    links: [{ href: '#history', label: '查看额度变化' }, { href: '#quota', label: '对照消耗节奏' }],
    items: [
      item('quota-history', '额度历史与样本', '按服务与今天、7 天、30 天查看短期和周期额度轨迹。', '配额趋势 历史 采样 样本 曲线', 'UI/UsageHistoryView.swift:44'),
      item('quota-range-details', '曲线选点与区间摘要', '查看某次采样的准确值，对照区间最高、最低剩余和最近采样时间。', '浮层 悬停 图表 最高 最低 选点', 'UI/UsageHistoryView.swift:489'),
      item('quota-events', '恢复事件与原因', '区分周期重置、用卡重置与原因未确认的恢复记录。', '恢复 事件 额度上涨 重置原因', 'Core/UsageHistory.swift:4'),
      item('usage-pace', '消耗速度与预计可用', '在样本有效时，查看每小时消耗和不计重置补充的预计可用时长。', '预测 估时 速率 每小时 还能用多久', 'UI/UsageHistoryView.swift:207'),
      item('quota-allocation', '均摊节奏与使用建议', '对照官方重置前的每小时额度，以及模型与强度使用建议。', '均摊 均匀 配额建议 模型建议', 'UI/UsageHistoryView.swift:664'),
      item('reset-resources', '重置卡与到期明细', '查看可用卡数量、逐张到期时间与同步状态。满足样本条件时可参考用卡后的预计续用时长。', '卡库存 资源 权益 有效期 到期 用卡后预测', 'UI/AccountResourcesView.swift:90'),
      item('reset-official', '打开官方重置页', '从“去重置”进入官方页面，由你决定是否使用重置卡。', '去重置 官方用量 用卡', 'UI/AccountResourcesView.swift:186'),
      item('reset-confirmation', '标注已使用重置卡', '手动确认已在官方使用的卡，为恢复历史补上原因。', '我已使用重置卡 手动确认 标记', 'UI/UsageHistoryView.swift:752'),
      item('balance-history', '余额与积分历史', '查看服务返回的当前可用、累计使用，以及今天、7 天、30 天记录。', '充值 credit 余额 积分 消耗', 'UI/AccountResourcesView.swift:240'),
    ],
  },
  {
    id: 'model-performance', title: 'Codex 模型性能', benefit: '看见等待、执行与并行，把耗时分清。',
    links: [{ href: '#performance', label: '拆开模型与工具耗时' }],
    items: [
      item('codex-latency', 'Codex 等待与耗时', '查看首 Token 等待、轮耗时、工具总耗时、异常结束与任务停止。', '性能 TTFT 延迟 latency 错误 停止', 'UI/CodexPerformanceSection.swift:54'),
      item('codex-duration', '任务趋势与长尾', '今天逐任务查看并可拖动范围滑块。7 天和 30 天可切换每日总耗时与每任务平均耗时，结合中位数和 p95 看长尾。', '性能 趋势 分位数 耗时 平均值 滑块', 'UI/CodexPerformanceSection.swift:632'),
      item('codex-tools', '工具执行与命令族', '分页查看工具执行记录，按命令族对照耗时构成。', '性能 工具命令 执行列表 分页', 'UI/CodexPerformanceSection.swift:402'),
      item('codex-compression', '推理与上下文压缩', '对照推理输出占比、压缩记录与可读取的压缩耗时。', '性能 压缩 compaction reasoning 推理占比', 'UI/CodexPerformanceSection.swift:226'),
      item('codex-parallel', 'Agent 执行与重叠', '在有效采样下查看正在执行数量、并行峰值与重叠时长。', '性能 并发 并行 活跃 Agent 运行峰值', 'UI/CodexPerformanceSection.swift:287'),
    ],
  },
  {
    id: 'service-access', title: '服务接入', benefit: '把需要的服务，收进同一处。',
    links: [{ href: '#services', label: '浏览服务与账号' }],
    items: [
      item('service-catalog', 'Codex 与扩展服务目录', '当前公开版本聚焦 Codex。服务目录另列 Claude Code 和 104 个扩展选项，实际可用范围取决于版本与配置。', '106 服务目录 原生读取 供应商 provider', 'Core/CodexBarCatalog.swift:3'),
      item('service-search', '搜索、分类与快捷筛选', '按名称、分类与接入状态缩小服务范围。', 'catalog 服务搜索 已接入 可用范围 分类', 'UI/ServiceCatalogView.swift:76'),
      item('service-enable', '按需启用扩展', '扩展默认关闭，为需要的服务开启读取；账号登录与凭据另行配置。', '开关 enable 已启用 扩展', 'UI/ServiceCatalogView.swift:144'),
      item('service-instructions', '官方入口与接入说明', '查看服务对应的官方页面与配置说明。', '文档 教程 官方网站 配置', 'UI/ServiceCatalogView.swift:144'),
      item('service-credentials', '使用已有账号配置', '在 macOS 14+ 且扩展组件可用时，按服务读取既有登录或凭据。', 'helper OAuth API key 浏览器登录 账号配置', 'Providers/CodexBarProvider.swift:25'),
      item('service-fields', '按服务呈现可读字段', '额度窗口、余额与服务报告费用，依对应服务实际返回展示。', '服务费用 余额 未提供 支持字段', 'Providers/CodexBarProvider.swift:81'),
      item('service-status', '读取状态与刷新', '查看缺少组件、暂不支持或未完成配置的原因，再按需刷新。', '配置错误 读取失败 错误诊断 同步 刷新', 'Providers/CodexBarProvider.swift:93'),
    ],
  },
  {
    id: 'tools-resources', title: '工具与资源', benefit: '工具在不在跑、占了多少，随时有据。',
    links: [{ href: '#tools', label: '查看本机工具' }, { href: '#context', label: '看本轮上下文' }, { href: '#activity', label: '复盘工作与资源' }],
    items: [
      item('client-detection', '桌面、CLI 与 IDE 检测', '识别已安装的 Codex、Claude、VS Code 插件、Trae 与 DeepSeek Harness 等工具。', 'Desktop Code CLI Trae IDE 工具 扫描', 'Core/ClientAccess.swift:317'),
      item('client-running', '安装与运行状态', '刷新扫描后，区分已安装、正在运行及暂未检测到的工具。', '运行 在线 安装 活跃 扫描 刷新', 'UI/ClientAccessView.swift:17'),
      item('client-processes', '进程数量与驻留内存', '查看本机工具的进程数量和内存占用。', 'process RAM memory 内存 性能', 'UI/ClientAccessView.swift:64'),
      item('client-visibility', '账号与活动可见性', '区分账号级额度和仅活动状态；同账号工具共享额度。', '工具额度 可见性 共享账号 共享配额', 'UI/ClientAccessView.swift:64'),
      item('work-calendar', '工作与空闲日历', '按已记录的任务生命周期，看今天、7 天、30 天的工作与空闲时长。', '日历 工作时长 活动 时间格 占比', 'UI/CodexWorkTimeView.swift:40'),
      item('context-capacity', '当前 Codex 上下文', '200 格显示最近主会话占用，每格 0.5%；同时查看容量、采样与上次压缩时间。', 'context 上下文 剩余 窗口 200格 压缩', 'UI/UsageOverviewCharts.swift:42'),
      item('local-disk', 'Codex 本机空间构成', '只读查看聊天、子 Agent、归档、工作树及其他占用，可重新统计并查看测量时间。', '磁盘 存储 空间 worktree archived 本地资源', 'UI/CodexLocalResourcesView.swift:12'),
      item('lifetime-activity', '长期协作足迹', '看累计 Token、单日峰值、最长任务与最长、当前连续天数。', '累计 历史 活动 连续天 峰值 streak', 'UI/LifetimeActivityView.swift:8'),
    ],
  },
  {
    id: 'menubar-notices', title: '菜单栏与提醒', benefit: '少盯一个窗口，关键变化仍看得到。',
    links: [{ href: '#tools', label: '打开菜单栏速览' }, { href: '#signals', label: '查看提醒与展示方式' }],
    items: [
      item('menubar-popover', '菜单栏速览', '点开看服务、今日昨日用量、工具与账号，再进入工作台或分析。', 'popup popover 弹窗 快捷入口 刷新', 'UI/PopoverView.swift:410'),
      item('menubar-metrics', '额度与上下文轮换', '菜单栏在固定宽度里轮换可用的额度窗口与 Codex 上下文占用。', '菜单栏 4秒 指标 上下文 配额', 'App/StatusBarController.swift:170'),
      item('menubar-activity', 'Codex 工作状态图标', '主会话工作时，图标随已识别的推理强度变化。Ultra 与更快用量同时开启时有独立黑金样式。', '运行 动态 动画 GIF 黑金 Ultra faster 推理', 'Core/CodexContextMonitor.swift:25'),
      item('notice-menu', '工作台通知菜单', '快速开关额度与重置提醒，查看当前阈值，再进入设置调整。', '铃铛 通知菜单 bell', 'UI/DashboardView.swift:235'),
      item('menubar-compact', '精简菜单栏', '在紧凑展示与完整状态之间选择。', '图标 compact 精简', 'UI/SettingsView.swift:55'),
      item('menubar-selection', '自动、轮播与固定服务', '自动选择、轮播已接入服务，或固定显示已接入的原生服务。', '轮播 展示对象 自动选择 固定', 'UI/SettingsView.swift:57'),
      item('menubar-interval', '自定轮播间隔', '选择 5、10、30 或 60 秒的服务轮播节奏。', '切换间隔 秒 轮换', 'UI/SettingsView.swift:64'),
      item('menubar-values', '剩余、已用与重置时刻', '选择额度显示口径，也可把重置时间显示为时钟。', '菜单栏 数值 used remaining 时钟', 'UI/SettingsView.swift:70'),
      item('notice-thresholds', '低额度与耗尽提醒', '设置低额度、严重不足阈值；获得通知许可后，在有效额度样本下提醒。', 'notification 30% 15% 耗尽 阈值 严重不足', 'Core/NotificationService.swift:48'),
      item('notice-recovery', '额度恢复与官方新窗口', '在满足账号与窗口条件后提醒恢复，或官方确认的新周期。', '恢复 重置通知 新窗口 通知', 'Core/UsageNotificationDescriptor.swift:8'),
      item('notice-card-expiry', '重置卡到期提醒', '在有效卡状态下，关注未来 72 小时、24 小时内到期的卡。', '卡片 到期 提醒 过期 资源', 'Core/NotificationService.swift:48'),
    ],
  },
  {
    id: 'exports-preferences', title: '导出与偏好', benefit: '留下可复盘的记录，按自己的习惯常驻。',
    links: [{ href: '#share', label: '查看用量分享与导出' }, { href: '#signals', label: '调整展示偏好' }],
    items: [
      item('share-card', '生成用量卡片', '选择今日、7 天、30 天，生成不含邮箱、项目名与对话正文的汇总卡。', '分享 card 图片 脱敏', 'UI/UsageShareView.swift:24'),
      item('share-image', '复制图片与保存 PNG', '把本机生成的用量卡复制或保存，再由你决定如何分享。', '导出 图片 PNG 剪贴板 下载 分享', 'UI/UsageShareView.swift:43'),
      item('usage-export', '导出 CSV 与 JSON', '导出当前范围或选中日的模型、项目名、匿名会话 ID、Token 与可选参考估值。', '表格 账本 数据导出 CSV JSON', 'UI/LocalUsageView.swift:327'),
      item('history-export', '导出额度历史', '把采样与恢复记录另存为历史 JSON。', '备份 历史导出 JSON', 'UI/UsageHistoryView.swift:48'),
      item('history-clear', '管理历史记录', '确认后清除已保存的额度历史，保留当前额度与客户端设置。', '删除 清除 数据管理', 'UI/UsageHistoryView.swift:84'),
      item('diagnostics-export', '脱敏诊断导出', '主动保存诊断 JSON，排查读取与同步问题。', '诊断 日志 debug 导出', 'UI/SettingsView.swift:154'),
      item('window-preferences', '启动、Dock 与窗口置顶', '设置登录启动、Dock 图标与主窗口始终置顶。', '开机 常驻 launch top 置顶', 'UI/SettingsView.swift:39'),
      item('appearance-accessibility', '跟随系统外观与辅助选项', '支持系统明暗外观，卡片和图表会遵循减少透明度、减少动态效果的相应设置。', '浅色 深色 无障碍 透明度 Reduce Motion', 'UI/DonvisStyle.swift:301'),
      item('global-shortcut', '自定全局开窗快捷键', '用自己的快捷键显示或隐藏 Donvis 主窗口。', '全局快捷键 热键 keyboard shortcut 开窗', 'UI/SettingsView.swift:50'),
      item('navigation-shortcuts', '工作台导航与刷新快捷键', 'Cmd+1…5 切换页面，Cmd+, 打开设置，Cmd+R 同步总览。', '键盘 快捷键 command navigation', 'UI/DashboardView.swift:119'),
      item('quit-confirmation', '退出确认', '退出常驻的 Donvis 前，保留一步确认。', '退出 关闭 常驻 确认', 'UI/DashboardView.swift:235'),
      item('service-order', '服务显示与排序', '隐藏暂不关心的服务，并调整显示顺序。', '偏好 排序 隐藏 展示顺序', 'UI/SettingsView.swift:90'),
      item('cli-doctor', '命令行缓存诊断', '通过 --doctor 检查默认 Codex、Claude 缓存健康；不启动窗口、不读取实时用量。', 'CLI doctor 终端 无界面 诊断 JSON', 'Core/UsageDiagnostics.swift:138'),
      item('cli-export', '命令行额度导出', '用 --export-json / --export-csv 导出默认服务缓存及最多 30 天匿名合并额度历史；不含额外账号配置。', 'CLI 命令行 自动化 缓存 export JSON CSV', 'Core/UsageDiagnostics.swift:161'),
      item('component-licenses', '查看组件许可', '在设置查看界面与服务扩展组件的许可、依赖声明。', '开源 license 版权 依赖', 'UI/SettingsView.swift:170'),
    ],
  },
]

export function normalizeFeatureQuery(value: string) {
  return value.normalize('NFKC').toLocaleLowerCase('zh-CN').trim().split(/\s+/).filter(Boolean)
}
export function searchFeatures(query: string): FeatureCategory[] {
  const terms = normalizeFeatureQuery(query)
  return FEATURE_CATEGORIES.map(category => ({
    ...category,
    items: category.items.filter(feature => {
      const text = `${category.title} ${category.benefit} ${feature.label} ${feature.detail} ${feature.keywords}`.normalize('NFKC').toLocaleLowerCase('zh-CN').replace(/\s+/g, '')
      return terms.every(term => text.includes(term))
    }),
  })).filter(category => category.items.length > 0)
}
