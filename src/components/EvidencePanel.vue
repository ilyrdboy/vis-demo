<script setup>
import { computed, ref, watch } from 'vue'
import { withoutEllipsis } from '../utils/textFormat'

const props = defineProps({
  item: { type: Object, required: true },
  records: { type: Array, default: () => [] },
})

const selectedDataset = ref('全部')
const selectedKeyword = ref('全部')

const cleanRecords = computed(() => {
  const seen = new Set()
  return props.records.filter((record) => {
    if (!hasContent(record)) return false
    const signature = contentSignature(record)
    if (seen.has(signature)) return false
    seen.add(signature)
    return true
  })
})

const datasets = computed(() => ['全部', ...Array.from(new Set(cleanRecords.value.map((record) => record.datasetLabel)))])
const datasetRecords = computed(() =>
  cleanRecords.value.filter((record) => selectedDataset.value === '全部' || record.datasetLabel === selectedDataset.value),
)
const keywords = computed(() => {
  const keywordRecords = new Map()
  for (const record of datasetRecords.value) {
    for (const keyword of record.keywords || []) {
      const key = String(keyword || '').trim()
      if (!key) continue
      keywordRecords.set(key, [...(keywordRecords.get(key) || []), record])
    }
  }

  const seenResults = new Set([recordsSignature(datasetRecords.value)])
  const options = []
  for (const [keyword, records] of keywordRecords) {
    const signature = recordsSignature(records)
    if (!signature || seenResults.has(signature)) continue
    seenResults.add(signature)
    options.push(keyword)
    if (options.length >= 16) break
  }

  return ['全部', ...options]
})

const filteredRecords = computed(() =>
  datasetRecords.value
    .filter((record) => selectedKeyword.value === '全部' || record.keywords?.includes(selectedKeyword.value)),
)

function hasContent(record) {
  return Boolean(String(record.title || '').trim() || String(record.rawText || '').trim())
}

function contentSignature(record) {
  const body = String(record.rawText || record.title || '').replace(/\s+/g, '')
  const source = String(record.source || '').replace(/\s+/g, '')
  return `${body}|${source}`
}

function recordsSignature(records) {
  return Array.from(new Set(records.map(contentSignature))).sort().join('||')
}

function recordKey(record) {
  return `${record.dataset}-${record.row}-${record.title}`
}

function displayTitle(record) {
  const title = String(record.title || '').trim()
  const raw = String(record.rawText || '').trim()
  const isShortLabel = title && title.length <= 24 && title !== raw && !/。|；|，|：|\.{2,}|…|\n/.test(title)
  return isShortLabel ? withoutEllipsis(title) : ''
}

function displayBody(record) {
  if (displayTitle(record)) return withoutEllipsis(record.rawText)
  return withoutEllipsis([record.title, record.rawText].filter(Boolean).join('。'))
}

watch(
  () => props.item.id,
  () => {
    selectedDataset.value = '全部'
    selectedKeyword.value = '全部'
  },
)

watch(selectedDataset, () => {
  selectedKeyword.value = '全部'
})

watch(datasets, (options) => {
  if (!options.includes(selectedDataset.value)) {
    selectedDataset.value = '全部'
  }
})

watch(keywords, (options) => {
  if (!options.includes(selectedKeyword.value)) {
    selectedKeyword.value = '全部'
  }
})
</script>

<template>
  <div class="evidence-content">
    <div class="panel-heading">
      <span>真实证据</span>
      <strong>{{ filteredRecords.length }} / {{ cleanRecords.length }} 条</strong>
    </div>

    <h2>{{ withoutEllipsis(item.title) }}</h2>
    <p class="summary">{{ withoutEllipsis(item.summary) }}</p>

    <div class="evidence-filters">
      <label>
        <span>来源</span>
        <select v-model="selectedDataset">
          <option v-for="dataset in datasets" :key="dataset">{{ dataset }}</option>
        </select>
      </label>
      <label>
        <span>关键词</span>
        <select v-model="selectedKeyword">
          <option v-for="keyword in keywords" :key="keyword">{{ keyword }}</option>
        </select>
      </label>
    </div>

    <div class="evidence-list">
      <article v-for="record in filteredRecords" :key="recordKey(record)" class="evidence-card">
        <small>{{ record.datasetLabel }} · {{ record.period }} · {{ record.sheet }} 第 {{ record.row }} 行</small>
        <strong v-if="displayTitle(record)">{{ displayTitle(record) }}</strong>
        <div class="evidence-body">
          <p>{{ displayBody(record) }}</p>
        </div>
        <em v-if="record.source">{{ withoutEllipsis(record.source) }}</em>
        <div class="evidence-tags">
          <span v-for="keyword in record.keywords" :key="keyword">{{ keyword }}</span>
        </div>
      </article>
      <div v-if="!filteredRecords.length" class="empty-state">
        当前筛选下没有可展示记录
      </div>
    </div>

    <div class="next-work">
      <span>追溯方式</span>
      <p>每条证据都保留来源文件、工作表和行号，可回到原始 Excel 复核原文与出处。</p>
    </div>
  </div>
</template>
