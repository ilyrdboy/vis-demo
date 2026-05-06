<script setup>
import { computed, ref, watch } from 'vue'
import { withoutEllipsis } from '../utils/textFormat'

const props = defineProps({
  dataset: { type: Object, required: true },
})

const currentPage = ref(1)
const jumpPage = ref(1)
const pageSize = 6
const allRecords = ref([])
const recordsLoading = ref(false)
const recordsError = ref('')
const searchTerm = ref('')
const selectedPeriod = ref('全部')
const sourceFilter = ref('全部')

const fallbackRecords = computed(() => props.dataset.browseRecords?.length ? props.dataset.browseRecords : props.dataset.samples)
const sourceRecords = computed(() => allRecords.value.length ? allRecords.value : fallbackRecords.value)
const periods = computed(() => ['全部', ...Array.from(new Set(sourceRecords.value.map((record) => record.period).filter(Boolean)))])
const filteredRecords = computed(() => {
  const query = searchTerm.value.trim().toLowerCase()
  return sourceRecords.value
    .filter((record) => selectedPeriod.value === '全部' || record.period === selectedPeriod.value)
    .filter((record) => sourceFilter.value === '全部' || (sourceFilter.value === '有来源' ? record.source : !record.source))
    .filter((record) => {
      if (!query) return true
      const haystack = `${record.title || ''} ${record.rawText || ''} ${record.source || ''} ${(record.keywords || []).join(' ')}`
      return haystack.toLowerCase().includes(query)
    })
})
const records = computed(() => filteredRecords.value)
const totalPages = computed(() => Math.max(1, Math.ceil(records.value.length / pageSize)))
const pageRecords = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  return records.value.slice(start, start + pageSize)
})
const visibleSheets = computed(() => props.dataset.sheets.filter((sheet) => sheet.rows > 1).slice(0, 8))
const titleThreshold = 16

async function loadRecords(dataset) {
  allRecords.value = []
  recordsError.value = ''
  if (!dataset.recordsUrl) return

  recordsLoading.value = true
  try {
    const response = await fetch(dataset.recordsUrl)
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    allRecords.value = await response.json()
  } catch (error) {
    recordsError.value = '全量记录加载失败，当前显示摘要记录'
  } finally {
    recordsLoading.value = false
  }
}

function displayTitle(sample) {
  const title = (sample.title || '').trim()
  const raw = (sample.rawText || '').trim()
  const short = title && title.length <= titleThreshold && title !== raw && !/。|；|，|：|\.{2,}|\n/.test(title)
  return short ? title : ''
}

function displayBody(sample) {
  if (displayTitle(sample)) return withoutEllipsis(sample.rawText)
  return withoutEllipsis([sample.title, sample.rawText].filter(Boolean).join('。'))
}

watch(
  () => props.dataset.key,
  () => {
    currentPage.value = 1
    jumpPage.value = 1
    searchTerm.value = ''
    selectedPeriod.value = '全部'
    sourceFilter.value = '全部'
    loadRecords(props.dataset)
  },
  { immediate: true },
)

watch(
  [selectedPeriod, sourceFilter, searchTerm],
  () => {
    currentPage.value = 1
    jumpPage.value = 1
  },
)

watch(currentPage, (page) => {
  jumpPage.value = page
})

watch(totalPages, (pages) => {
  if (currentPage.value > pages) {
    currentPage.value = pages
  }
})

function page(delta) {
  currentPage.value = Math.min(totalPages.value, Math.max(1, currentPage.value + delta))
}

function jump() {
  const target = Number(jumpPage.value)
  if (!Number.isFinite(target)) {
    jumpPage.value = currentPage.value
    return
  }
  currentPage.value = Math.min(totalPages.value, Math.max(1, Math.round(target)))
}

function sheetLabel(sheet) {
  const compact = sheet.name.replace(/\s/g, '')
  const numberedTotal = new RegExp(`^\\d+${props.dataset.label}$`)
  if (compact === 'Sheet1' || compact === props.dataset.label || numberedTotal.test(compact)) {
    return `总${props.dataset.label}`
  }
  return sheet.name
}
</script>

<template>
  <section class="dataset-detail panel">
    <div class="panel-heading">
      <span>数据集详情</span>
      <strong>{{ dataset.label }}</strong>
    </div>

    <div class="detail-grid">
      <div>
        <h2>{{ dataset.label }}</h2>

        <div class="keyword-cloud">
          <span v-for="keyword in dataset.topKeywords" :key="keyword.name">
            {{ keyword.name }} · {{ keyword.value }}
          </span>
        </div>

        <div class="detail-controls">
          <label>
            <span>检索</span>
            <input v-model="searchTerm" type="search" placeholder="标题、正文、来源、关键词" />
          </label>
          <label>
            <span>时期</span>
            <select v-model="selectedPeriod">
              <option v-for="period in periods" :key="period">{{ period }}</option>
            </select>
          </label>
          <label>
            <span>来源</span>
            <select v-model="sourceFilter">
              <option>全部</option>
              <option>有来源</option>
              <option>无来源</option>
            </select>
          </label>
        </div>
      </div>

      <div class="sheet-list">
        <article v-for="sheet in visibleSheets" :key="sheet.name">
          <strong>{{ sheetLabel(sheet) }}</strong>
          <span>{{ sheet.rows }} 行 / {{ sheet.cols }} 列</span>
        </article>
      </div>
    </div>

    <div class="pager-row">
      <span>
        第 {{ currentPage }} / {{ totalPages }} 页，共 {{ records.length }} / {{ sourceRecords.length }} 条记录
        <template v-if="recordsLoading"> · 加载中</template>
        <template v-else-if="recordsError"> · {{ recordsError }}</template>
        <template v-else-if="allRecords.length"> · 全量</template>
      </span>
      <div class="page-actions">
        <label class="page-jump">
          <span>跳至</span>
          <input
            v-model.number="jumpPage"
            type="number"
            min="1"
            :max="totalPages"
            @keydown.enter="jump"
          />
          <button type="button" @click="jump">确定</button>
        </label>
        <button type="button" :disabled="currentPage === 1" @click="page(-1)">上一页</button>
        <button type="button" :disabled="currentPage === totalPages" @click="page(1)">下一页</button>
      </div>
    </div>

    <div class="sample-list">
      <article v-for="sample in pageRecords" :key="`${sample.sheet}-${sample.row}`" class="evidence-card">
        <small class="evidence-meta">{{ sample.period }} · {{ sample.sheet }} 第 {{ sample.row }} 行</small>
        <strong v-if="displayTitle(sample)" class="evidence-title">{{ withoutEllipsis(displayTitle(sample)) }}</strong>
        <div class="card-scroll evidence-body">
          <p>{{ displayBody(sample) }}</p>
        </div>
        <em class="evidence-source">{{ withoutEllipsis(sample.source) }}</em>
      </article>
      <div v-if="!pageRecords.length" class="empty-state">
        当前筛选下没有可展示记录
      </div>
    </div>
  </section>
</template>
