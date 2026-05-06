<script setup>
import { computed, ref } from 'vue'
import TimelineRiver from './components/TimelineRiver.vue'
import CausalGraph from './components/CausalGraph.vue'
import EvidencePanel from './components/EvidencePanel.vue'
import MetricStrip from './components/MetricStrip.vue'
import DataAtlas from './components/DataAtlas.vue'
import DatasetDetail from './components/DatasetDetail.vue'
import PeriodMatrix from './components/PeriodMatrix.vue'
import MechanismBoard from './components/MechanismBoard.vue'
import EventExplorer from './components/EventExplorer.vue'
import GeoNetwork from './components/GeoNetwork.vue'
import { periods, turningPoints } from './data/demoData'
import { processedData } from './data/processedData'

const selectedId = ref(turningPoints[0].id)
const selectedDatasetKey = ref(processedData.datasets[0]?.key || '')

const selected = computed(() => turningPoints.find((item) => item.id === selectedId.value))
const selectedDataset = computed(() =>
  processedData.datasets.find((dataset) => dataset.key === selectedDatasetKey.value),
)

const evidenceRecords = computed(() => processedData.evidenceIndex?.[selectedId.value] || [])

const activePeriod = computed(() => {
  if (!selected.value) return periods[0]
  return periods.find((period) => selected.value.year >= period.start && selected.value.year <= period.end)
})
</script>

<template>
  <main class="app-shell">
    <header class="topbar">
      <div>
        <p class="kicker">ChinaVis 2025 / 赛道 1-I 析城观史</p>
        <h1>都城韧性：北京历史转折期的冲击、恢复与功能重组</h1>
      </div>
      <div class="period-chip" v-if="activePeriod">
        <span>当前时期</span>
        <strong>{{ activePeriod.name }} · {{ selected.year }}</strong>
      </div>
    </header>

    <section class="hero-grid">
      <aside class="panel timeline-panel">
        <div class="panel-heading">
          <span>历史转折</span>
          <strong>{{ turningPoints.length }} 个节点</strong>
        </div>
        <TimelineRiver
          :items="turningPoints"
          :periods="periods"
          :selected-id="selectedId"
          @select="selectedId = $event"
        />
      </aside>

      <section class="main-stack">
        <MetricStrip :item="selected" />
        <CausalGraph :item="selected" />
      </section>

      <aside class="panel evidence-panel">
        <EvidencePanel :item="selected" :records="evidenceRecords" />
      </aside>
    </section>

    <section class="analysis-grid">
      <DataAtlas
        :data="processedData"
        :selected-key="selectedDatasetKey"
        @select="selectedDatasetKey = $event"
      />
      <PeriodMatrix :matrix="processedData.periodMatrix" :datasets="processedData.datasets" />
    </section>

    <DatasetDetail v-if="selectedDataset" :dataset="selectedDataset" />

    <MechanismBoard :series="processedData.focusSeries" />

    <section class="expansion-grid">
      <EventExplorer :records="processedData.eventRecords" :year-series="processedData.yearSeries" />
      <GeoNetwork :network="processedData.geoNetwork" :entities="processedData.entityIndex" />
    </section>
  </main>
</template>
