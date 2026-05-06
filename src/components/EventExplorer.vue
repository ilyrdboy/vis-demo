<script setup>
import { computed, ref } from 'vue'
import { withoutEllipsis } from '../utils/textFormat'

const props = defineProps({
  records: { type: Array, required: true },
  yearSeries: { type: Array, required: true },
})

const selectedType = ref('全部')
const selectedPeriod = ref('全部')

const types = computed(() =>
  ['全部', ...Array.from(new Set(props.records.map((record) => record.type)))].filter(Boolean),
)
const periods = computed(() => {
  const scoped = props.records.filter((record) => selectedType.value === '全部' || record.type === selectedType.value)
  return ['全部', ...Array.from(new Set(scoped.map((record) => record.period)))].filter(Boolean)
})
const maxTotal = computed(() => Math.max(...props.yearSeries.map((item) => item.total), 1))

const matchingRecords = computed(() =>
  props.records
    .filter((record) => selectedType.value === '全部' || record.type === selectedType.value)
    .filter((record) => selectedPeriod.value === '全部' || record.period === selectedPeriod.value),
)

const filteredRecords = computed(() =>
  matchingRecords.value
    .slice()
    .sort((a, b) => b.year - a.year)
    .slice(0, 18),
)

function changeType() {
  if (!periods.value.includes(selectedPeriod.value)) {
    selectedPeriod.value = '全部'
  }
}

function yearLabel(year) {
  return year < 0 ? `前${Math.abs(year)}` : year
}
</script>

<template>
  <section class="panel event-explorer">
    <div class="panel-heading">
      <span>事件级时间序列</span>
      <strong>{{ records.length }} 条代表事件</strong>
    </div>

    <div class="explorer-controls">
      <label>
        <span>类型</span>
        <select v-model="selectedType" @change="changeType">
          <option v-for="type in types" :key="type">{{ type }}</option>
        </select>
      </label>
      <label>
        <span>时期</span>
        <select v-model="selectedPeriod">
          <option v-for="period in periods" :key="period">{{ period }}</option>
        </select>
      </label>
    </div>

    <div class="series-bars" aria-label="事件数量时间序列">
      <div
        v-for="item in yearSeries"
        :key="item.year"
        class="series-bin"
        :title="`${item.label}: ${item.total} 条`"
      >
        <i :style="{ height: `${Math.max(8, (item.total / maxTotal) * 120)}px` }"></i>
        <span>{{ item.label }}</span>
      </div>
    </div>

    <div class="event-list">
      <article v-for="record in filteredRecords" :key="record.id" class="event-row">
        <small>{{ yearLabel(record.year) }} / {{ record.period }} / {{ record.type }} / {{ record.datasetLabel }}</small>
        <strong>{{ withoutEllipsis(record.title) }}</strong>
        <p>{{ withoutEllipsis(record.rawText) }}</p>
      </article>
      <div v-if="!filteredRecords.length" class="empty-state">
        当前筛选下没有可展示记录
      </div>
    </div>
  </section>
</template>
