<script setup>
import { computed, ref, watch } from 'vue'
import { withoutEllipsis } from '../utils/textFormat'

const props = defineProps({
  records: { type: Array, required: true },
  yearSeries: { type: Array, required: true },
})

const selectedType = ref('全部')
const selectedPeriod = ref('全部')
const currentPage = ref(1)
const pageSize = 6

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

const sortedRecords = computed(() =>
  matchingRecords.value
    .slice()
    .sort((a, b) => b.year - a.year),
)
const totalPages = computed(() => Math.max(1, Math.ceil(sortedRecords.value.length / pageSize)))
const pageRecords = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  return sortedRecords.value.slice(start, start + pageSize)
})

function changeType() {
  if (!periods.value.includes(selectedPeriod.value)) {
    selectedPeriod.value = '全部'
  }
}

function yearLabel(year) {
  return year < 0 ? `前${Math.abs(year)}` : year
}

function page(delta) {
  currentPage.value = Math.min(totalPages.value, Math.max(1, currentPage.value + delta))
}

watch([selectedType, selectedPeriod], () => {
  currentPage.value = 1
})

watch(totalPages, (pages) => {
  if (currentPage.value > pages) currentPage.value = pages
})
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

    <div class="event-pager">
      <span>显示 {{ pageRecords.length }} / {{ sortedRecords.length }} 条，页 {{ currentPage }} / {{ totalPages }}</span>
      <div>
        <button type="button" :disabled="currentPage === 1" @click="page(-1)">上一页</button>
        <button type="button" :disabled="currentPage === totalPages" @click="page(1)">下一页</button>
      </div>
    </div>

    <div class="event-list">
      <article v-for="record in pageRecords" :key="record.id" class="event-row">
        <small>{{ yearLabel(record.year) }} / {{ record.period }} / {{ record.type }} / {{ record.datasetLabel }}</small>
        <strong>{{ withoutEllipsis(record.title) }}</strong>
        <p>{{ withoutEllipsis(record.rawText) }}</p>
      </article>
      <div v-if="!pageRecords.length" class="empty-state">
        当前筛选下没有可展示记录
      </div>
    </div>
  </section>
</template>
