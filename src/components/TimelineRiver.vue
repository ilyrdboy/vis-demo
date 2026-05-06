<script setup>
const props = defineProps({
  items: { type: Array, required: true },
  periods: { type: Array, required: true },
  selectedId: { type: String, required: true },
})

const emit = defineEmits(['select'])

const visiblePeriods = props.periods.filter((period) => period.end >= -221)
const slotWidth = 100 / visiblePeriods.length

function periodIndexFor(year) {
  const index = visiblePeriods.findIndex((period) => year >= period.start && year <= period.end)
  return index >= 0 ? index : visiblePeriods.length - 1
}

function nonlinearXFor(year) {
  const index = periodIndexFor(year)
  const period = visiblePeriods[index]
  const local = (year - period.start) / Math.max(period.end - period.start, 1)
  const eased = 0.12 + Math.min(Math.max(local, 0), 1) * 0.76
  return index * slotWidth + eased * slotWidth
}

function periodLeft(index) {
  return index * slotWidth
}
</script>

<template>
  <div class="timeline-river">
    <div class="period-band">
      <span
        v-for="(period, index) in visiblePeriods"
        :key="period.name"
        class="period-segment"
        :style="{ left: `${periodLeft(index)}%`, width: `${slotWidth}%` }"
      >
        {{ period.name }}
      </span>
    </div>

    <div class="river-track">
      <button
        v-for="item in props.items"
        :key="item.id"
        class="turning-dot"
        :class="{ active: item.id === props.selectedId }"
        :style="{ left: `${nonlinearXFor(item.year)}%` }"
        type="button"
        :title="`${item.year} ${item.title}：${item.summary}`"
        @click="emit('select', item.id)"
      >
        <span>{{ item.year }}</span>
      </button>
    </div>

    <div class="turning-list">
      <button
        v-for="item in props.items"
        :key="item.id"
        class="turning-card"
        :class="{ active: item.id === props.selectedId }"
        type="button"
        @click="emit('select', item.id)"
      >
        <small>{{ item.year }} / {{ item.type }}</small>
        <strong>{{ item.title }}</strong>
        <span>{{ item.summary }}</span>
      </button>
    </div>
  </div>
</template>
