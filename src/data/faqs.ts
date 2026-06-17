export const faqs = [
  { question: 'Donvis 支持哪些客户端？', answer: '支持 Codex Desktop、Codex CLI、Codex VSCode 扩展、Claude Desktop 和 Claude Code CLI。' },
  { question: '需要登录或授权吗？', answer: 'Donvis 本身不提供账号登录系统，只读取本地官方客户端或命令行工具已有的状态信息。' },
  { question: '额度数据从哪里来？', answer: 'Donvis 从本地客户端和官方工具链可用的数据源中读取额度相关信息，并只在本机展示。' },
  { question: 'Claude 的数据多久更新一次？', answer: 'Claude Code 支持手动真实刷新。服务端暂未返回新额度时，会保留上次有效数据并明确提示。' },
  { question: '会影响系统性能吗？', answer: 'Donvis 是轻量级菜单栏工具，仅做必要状态读取和展示，对系统资源占用较低。' },
  { question: '数据会上传吗？', answer: '不会。Donvis 不上传额度、账号、本地配置、代码、Prompt、模型响应或文件内容。' },
  { question: '是否开源？', answer: '是，Donvis 使用 MIT License 开源，可在 GitHub 查看源码并参与贡献。' },
]
