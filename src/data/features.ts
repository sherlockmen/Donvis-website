export const features = [
  { title: '智能客户端检测', description: '自动发现并识别当前活跃客户端，无需复杂配置。', icon: 'search', meta: ['Codex Desktop', 'Codex CLI', 'Codex VSCode', 'Claude Desktop', 'Claude Code CLI'] },
  { title: '5 小时 & 7 天窗口', description: '同时展示短周期与周周期额度，包含百分比、剩余时间和重置时间。', icon: 'hourglass' },
  { title: '共享账号合并', description: '同一账号在多个客户端登录时，自动标记共享额度，避免重复计算。', icon: 'users' },
  { title: '分组展示', description: 'Codex 系与 Claude 系分组排列，信息清晰，不互相干扰。', icon: 'layers' },
  { title: '多客户端标题轮播', description: '多个客户端同时在线时，菜单栏标题自动轮播显示每个客户端状态。', icon: 'carousel' },
  { title: 'Claude 真实刷新', description: '点击立即刷新后，真实请求 Claude Code 账号用量，并保留上次有效数据。', icon: 'refresh' },
  { title: '隐私优先', description: '只读取展示额度所需的最小信息，不读取代码、Prompt、模型响应或文件内容。', icon: 'lock' },
  { title: 'Dock 备用入口', description: '菜单栏空间不足时，可通过 Dock 打开同款状态窗口。', icon: 'dock' },
  { title: '多屏一致体验', description: '在主屏、副屏、多显示器环境下，弹窗展示保持一致。', icon: 'monitor' },
]

export const painPoints = [
  { title: '告别网页查询', description: '无需反复打开网页后台，菜单栏一点即看。', icon: 'browser' },
  { title: '告别手动命令', description: '不用再敲命令查看状态，额度变化自动呈现。', icon: 'terminal' },
  { title: '告别错过重置', description: '清晰展示重置时间，合理安排使用节奏。', icon: 'clock' },
  { title: '更专注编码', description: '少切换、少打断，把注意力留给创造。', icon: 'heart' },
]

export const previews = [
  { title: '菜单栏轮播', description: '多客户端标题自动轮播，额度状态随时可见。', image: '/screenshots/toolbar.svg' },
  { title: '弹出面板总览', description: '额度进度、剩余时间、重置时间，一屏看全。', image: '/screenshots/popover.svg' },
  { title: '设置', description: '自定义刷新间隔、显示模式、开机自启与额度预警。', image: '/screenshots/settings.svg' },
  { title: 'Dock 窗口', description: '菜单栏被系统挤掉时，也能从 Dock 快速打开。', image: '/screenshots/dock.svg' },
]

export const privacyItems = [
  { title: '本地读取', description: '仅从本地配置与官方客户端读取必要信息。', icon: 'shield' },
  { title: '绝不上传', description: '不会将额度、账号或本地配置上传到任何服务器。', icon: 'offline' },
  { title: '不读取代码内容', description: '不处理、不访问、更不会收集你的代码、Prompt、模型响应或文件内容。', icon: 'code' },
  { title: '开源透明', description: '代码公开，接受社区监督。', icon: 'open' },
]
