<script setup lang="ts">
import cloudUrl from './assets/pixel-cloud.svg'
import AppHeader from './components/AppHeader.vue'
import HeroSection from './components/HeroSection.vue'
import PainPointSection from './components/PainPointSection.vue'
import FeatureGrid from './components/FeatureGrid.vue'
import PreviewSection from './components/PreviewSection.vue'
import PrivacySection from './components/PrivacySection.vue'
import DownloadSection from './components/DownloadSection.vue'
import FaqSection from './components/FaqSection.vue'
import FinalCta from './components/FinalCta.vue'
import AppFooter from './components/AppFooter.vue'
</script>

<template>
  <div class="page-shell">
    <img class="pixel-cloud cloud-a" :src="cloudUrl" alt="" aria-hidden="true" />
    <img class="pixel-cloud cloud-b" :src="cloudUrl" alt="" aria-hidden="true" />
    <img class="pixel-cloud cloud-c" :src="cloudUrl" alt="" aria-hidden="true" />
    <img class="pixel-cloud cloud-d" :src="cloudUrl" alt="" aria-hidden="true" />
    <AppHeader />
    <main>
      <HeroSection />
      <PainPointSection />
      <FeatureGrid />
      <PreviewSection />
      <PrivacySection />
      <DownloadSection />
      <FaqSection />
      <FinalCta />
    </main>
    <AppFooter />
  </div>
</template>
