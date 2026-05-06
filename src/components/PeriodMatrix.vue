<script setup>
const props = defineProps({
  matrix: { type: Array, required: true },
  datasets: { type: Array, required: true },
})

const columns = ['water', 'disaster', 'governance', 'population', 'traffic', 'events', 'wars', 'people']
const labels = Object.fromEntries(props.datasets.map((item) => [item.key, item.label]))
const maxValue = Math.max(...props.matrix.flatMap((row) => columns.map((key) => row[key] || 0)), 1)

function alpha(value) {
  return 0.08 + (value / maxValue) * 0.84
}
</script>

<template>
  <section class="panel matrix-panel">
    <div class="panel-heading">
      <span>朝代密度矩阵</span>
      <strong>核心数据分布</strong>
    </div>

    <div class="matrix">
      <div class="matrix-head"></div>
      <div v-for="key in columns" :key="key" class="matrix-label">{{ labels[key] }}</div>

      <template v-for="row in matrix" :key="row.period">
        <div class="matrix-period">{{ row.period }}</div>
        <div
          v-for="key in columns"
          :key="`${row.period}-${key}`"
          class="matrix-cell"
          :title="`${row.period} / ${labels[key]}: ${row[key] || 0}`"
          :style="{ backgroundColor: `rgba(156, 91, 66, ${alpha(row[key] || 0)})` }"
        >
          {{ row[key] || 0 }}
        </div>
      </template>
    </div>
  </section>
</template>
