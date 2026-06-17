<script setup lang="ts">
import donkeyUrl from '../assets/donkey-mascot.svg'
import { site } from '../data/site'
</script>

<template>
  <section id="top" class="hero section">
    <div class="container hero-grid">
      <div class="hero-copy">
        <h1 class="pixel-text">
          一眼看清<br />
          <span>Codex 与 Claude Code</span><br />
          的账号额度
        </h1>
        <p>
          Donvis 是一款本地菜单栏额度监控工具，实时展示 Codex 与 Claude Code 的剩余额度、重置时间与使用进度，让你不用打开网页，也不用手动敲命令。
        </p>
        <div class="hero-actions">
          <a class="btn btn-primary" href="#download"> 下载 macOS 版</a>
          <a class="btn btn-secondary" :href="site.githubUrl" target="_blank" rel="noopener noreferrer">GitHub 查看源码</a>
        </div>
        <div class="version">{{ site.version }}</div>
        <ul class="hero-tags" aria-label="核心特性">
          <li>🔒 本地运行</li>
          <li>⚙ 自动检测客户端</li>
          <li>🪟 5 小时 & 7 天窗口</li>
          <li>🛡 隐私优先</li>
        </ul>
      </div>

      <div class="hero-preview" aria-label="Donvis 状态面板示意">
        <div class="menu-bar">
          <span>🐴</span><span>●</span><strong>Donvis</strong><span>🐴</span><span>◉</span><span>周五 16:20</span>
        </div>
        <div class="status-panel">
          <div class="panel-top">
            <span class="panel-brand"><img :src="donkeyUrl" alt="" /> Donvis</span>
            <span>⚙</span>
          </div>
          <div class="quota-card codex">
            <div class="quota-head"><strong>Codex</strong><em>在线</em></div>
            <QuotaRow label="5 小时窗口" value="72%" time="还剩 2h 18m" color="blue" />
            <QuotaRow label="7 天窗口" value="48%" time="还剩 3d 6h" color="blue" />
          </div>
          <div class="quota-card claude">
            <div class="quota-head"><strong>Claude Code</strong><em>在线</em></div>
            <QuotaRow label="5 小时窗口" value="61%" time="还剩 1h 42m" color="orange" />
            <QuotaRow label="7 天窗口" value="33%" time="还剩 4d 12h" color="orange" />
          </div>
          <div class="panel-footer">最后更新时间：16:20:30 <button aria-label="刷新">↻</button></div>
        </div>
        <img class="hero-donkey" :src="donkeyUrl" alt="Donvis 驴子吉祥物" />
      </div>
    </div>
  </section>
</template>

<script lang="ts">
export default {
  components: {
    QuotaRow: {
      props: {
        label: { type: String, required: true },
        value: { type: String, required: true },
        time: { type: String, required: true },
        color: { type: String, required: true },
      },
      template: `
        <div class="quota-row">
          <div class="quota-meta"><span>{{ label }}</span><strong>{{ value }}</strong></div>
          <div class="progress"><span :class="color" :style="{ width: value }"></span></div>
          <div class="quota-time">{{ time }}</div>
        </div>
      `,
    },
  },
}
</script>

<style scoped>
.hero {
  min-height: 720px;
  padding-top: 88px;
}

.hero-grid {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: 1fr 1fr;
  align-items: center;
  gap: 56px;
}

.hero-copy {
  text-align: center;
}

.hero h1 {
  margin: 0;
  font-size: clamp(42px, 6vw, 72px);
  line-height: 1.12;
}

.hero h1 span {
  color: var(--color-primary);
}

.hero p {
  max-width: 610px;
  margin: 26px auto 0;
  color: var(--color-text-muted);
  font-size: 17px;
  line-height: 1.9;
}

.hero-actions {
  display: flex;
  justify-content: center;
  gap: 18px;
  margin-top: 32px;
}

.version {
  margin-top: 12px;
  color: #8090a4;
  font-size: 12px;
  font-weight: 800;
}

.hero-tags {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 20px;
  padding: 0;
  margin: 30px 0 0;
  color: #48576b;
  font-size: 14px;
  font-weight: 800;
  list-style: none;
}

.hero-preview {
  position: relative;
  min-height: 520px;
}

.menu-bar {
  position: absolute;
  top: 10px;
  right: 4px;
  left: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  height: 38px;
  border-radius: 9px;
  color: #fff;
  background: #2f80ed;
  box-shadow: var(--shadow-soft);
  font-weight: 800;
}

.status-panel {
  position: absolute;
  top: 78px;
  right: 60px;
  width: min(390px, calc(100vw - 40px));
  padding: 20px;
  border: 1px solid var(--color-border);
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.96);
  box-shadow: var(--shadow-card);
  animation: float-panel 4s ease-in-out infinite;
}

@keyframes float-panel {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-6px); }
}

.panel-top,
.quota-head,
.quota-meta,
.panel-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.panel-brand {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-weight: 900;
}

.panel-brand img {
  width: 28px;
  height: 28px;
}

.quota-card {
  padding: 16px;
  margin-top: 16px;
  border-radius: 14px;
  background: #f8fbff;
}

.quota-card.claude {
  background: #fff7f2;
}

.quota-head strong {
  font-size: 18px;
}

.quota-head em {
  color: var(--color-green);
  font-style: normal;
  font-size: 13px;
  font-weight: 900;
}

:deep(.quota-row) {
  margin-top: 13px;
}

:deep(.quota-meta) {
  display: flex;
  justify-content: space-between;
  color: var(--color-text-muted);
  font-size: 13px;
  font-weight: 800;
}

:deep(.progress) {
  height: 12px;
  margin-top: 7px;
  overflow: hidden;
  border-radius: 999px;
  background: #e8edf3;
}

:deep(.progress span) {
  display: block;
  height: 100%;
  border-radius: inherit;
}

:deep(.progress .blue) {
  background: var(--color-blue);
}

:deep(.progress .orange) {
  background: var(--color-primary);
}

:deep(.quota-time) {
  margin-top: 5px;
  color: var(--color-text-muted);
  font-size: 12px;
  text-align: right;
}

.panel-footer {
  margin-top: 16px;
  color: var(--color-text-muted);
  font-size: 13px;
}

.panel-footer button {
  width: 32px;
  height: 32px;
  border: 0;
  border-radius: 50%;
  color: var(--color-blue);
  background: #edf5ff;
}

.hero-donkey {
  position: absolute;
  right: -4px;
  bottom: 8px;
  width: 128px;
  image-rendering: pixelated;
}

@media (max-width: 1020px) {
  .hero {
    padding-top: 58px;
  }

  .hero-grid {
    grid-template-columns: 1fr;
    gap: 30px;
  }

  .hero-preview {
    min-height: 500px;
  }

  .status-panel {
    left: 50%;
    right: auto;
    transform: translateX(-50%);
    animation-name: float-panel-centered;
  }

  @keyframes float-panel-centered {
    0%, 100% { transform: translateX(-50%) translateY(0); }
    50% { transform: translateX(-50%) translateY(-6px); }
  }
}

@media (max-width: 767px) {
  .hero {
    min-height: auto;
  }

  .hero-actions {
    flex-direction: column;
  }

  .hero-tags {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
    text-align: left;
  }

  .menu-bar {
    display: none;
  }

  .hero-preview {
    min-height: 450px;
  }

  .status-panel {
    top: 12px;
  }

  .hero-donkey {
    width: 92px;
  }
}
</style>
