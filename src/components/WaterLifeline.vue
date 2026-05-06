<script setup>
import { computed, ref } from 'vue'

const props = defineProps({
  lifelines: { type: Array, required: true },
})

const selectedId = ref(props.lifelines[0]?.id || '')

const selected = computed(() => props.lifelines.find((item) => item.id === selectedId.value) || props.lifelines[0])
const allEvents = computed(() => props.lifelines.flatMap((item) => item.events || []))
const minYear = computed(() => Math.min(...allEvents.value.map((event) => event.year), 900))
const maxYear = computed(() => Math.max(...allEvents.value.map((event) => event.year), 1949))
const statusList = ['开凿', '改道', '淤积', '治理', '废弃', '漕运', '灾害', '记载']
const currentPage = ref(1)
const jumpPage = ref(1)
const pageSize = 6
const titleThreshold = 16

const positionedEvents = computed(() => {
  const events = selected.value?.events || []
  const labelStep = Math.max(1, Math.ceil(events.length / 18))
  return events.map((event, index) => {
    return {
      ...event,
      x: events.length <= 1 ? 50 : 4 + (index / (events.length - 1)) * 92,
      lane: index % 4,
      index,
      showLabel: index % labelStep === 0 || index === events.length - 1,
    }
  })
})

const totalPages = computed(() => Math.max(1, Math.ceil(positionedEvents.value.length / pageSize)))
const pageEvents = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  return positionedEvents.value.slice(start, start + pageSize)
})

function eventX(year) {
  const min = minYear.value
  const max = maxYear.value
  const span = Math.max(max - min, 1)
  const normalized = (year - min) / span
  const eased = Math.log1p(normalized * 10) / Math.log1p(10)
  return 5 + eased * 90
}

function yearLabel(year) {
  return year < 0 ? `前${Math.abs(year)}` : year
}

function page(delta) {
  currentPage.value = Math.min(totalPages.value, Math.max(1, currentPage.value + delta))
  jumpPage.value = currentPage.value
}

function selectWater(id) {
  selectedId.value = id
  currentPage.value = 1
  jumpPage.value = 1
}

function jumpToEvent(event) {
  currentPage.value = Math.floor(event.index / pageSize) + 1
  jumpPage.value = currentPage.value
}

function jump() {
  const target = Number(jumpPage.value)
  if (!Number.isFinite(target)) {
    jumpPage.value = currentPage.value
    return
  }
  currentPage.value = Math.min(totalPages.value, Math.max(1, Math.round(target)))
  jumpPage.value = currentPage.value
}

function displayTitle(event) {
  const title = (event.title || '').trim()
  const raw = (event.rawText || '').trim()
  const short = title && title.length <= titleThreshold && title !== raw && !/。|；|，|：|\.{2,}|\n/.test(title)
  return short ? title : ''
}
</script>

<template>
  <section class="panel water-panel">
    <div class="panel-heading">
      <span>水系生命线</span>
      <strong>{{ lifelines.length }} 条河道</strong>
    </div>

    <div class="water-layout">
      <div class="water-list">
        <button
          v-for="item in lifelines"
          :key="item.id"
          type="button"
          class="water-tab"
          :class="{ active: item.id === selected?.id }"
          @click="selectWater(item.id)"
        >
          <strong>{{ item.name }}</strong>
          <span>{{ item.records }} 条记录</span>
        </button>
      </div>

      <div class="lifeline-stage" v-if="selected">
        <div class="lifeline-head">
          <div>
            <h2>{{ selected.name }}</h2>
            <p>{{ selected.source }} / {{ selected.function }}</p>
          </div>
          <div class="status-stack">
            <span v-for="status in statusList" :key="status">
              {{ status }} {{ selected.statusCounts?.[status] || 0 }}
            </span>
          </div>
        </div>

        <div class="lifeline-axis">
          <div
            v-for="event in positionedEvents"
            :key="`${event.row}-${event.year}`"
            class="water-event"
            :class="`status-${event.status}`"
            :style="{ left: `${event.x}%`, top: `${-12 + event.lane * 24}px` }"
            :title="`${yearLabel(event.year)} ${event.title}`"
            @click="jumpToEvent(event)"
          >
            <i></i>
            <span v-if="event.showLabel">{{ yearLabel(event.year) }}</span>
          </div>
        </div>

        <div class="pager-row">
          <span>第 {{ currentPage }} / {{ totalPages }} 页，共 {{ positionedEvents.length }} 条水系记录</span>
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

        <div class="water-event-list">
          <article v-for="event in pageEvents" :key="`${event.row}-${event.title}`">
            <small class="water-meta">{{ yearLabel(event.year) }} / {{ event.period }} / {{ event.status }}</small>
            <strong v-if="displayTitle(event)" class="water-title">{{ displayTitle(event) }}</strong>
            <div class="card-scroll water-body">
              <p>{{ displayTitle(event) ? event.rawText : `${event.title ? event.title + '。' : ''}${event.rawText}` }}</p>
            </div>
            <em v-if="event.source" class="water-source">{{ event.source }}</em>
          </article>
        </div>
      </div>
    </div>
  </section>
</template>
