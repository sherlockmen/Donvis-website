import { site } from './site'

export const downloads = [
  {
    id: 'apple-silicon',
    title: 'macOS Apple Silicon',
    subtitle: '适用于 M1 / M2 / M3 / M4',
    tag: '推荐',
    buttonText: '下载 .dmg',
    url: site.releaseUrl,
    chip: 'ARM',
  },
  {
    id: 'intel',
    title: 'macOS Intel',
    subtitle: '适用于 Intel 处理器',
    tag: '',
    buttonText: '下载 .dmg',
    url: site.releaseUrl,
    chip: 'x86',
  },
  {
    id: 'windows',
    title: 'Windows',
    subtitle: '即将推出',
    tag: '',
    buttonText: '敬请期待',
    url: '',
    disabled: true,
    chip: 'Win',
  },
]
