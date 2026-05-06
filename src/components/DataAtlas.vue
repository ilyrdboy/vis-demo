<script setup>
defineProps({
  data: { type: Object, required: true },
  selectedKey: { type: String, default: '' },
})

defineEmits(['select'])
</script>

<template>
  <section class="panel atlas-panel">
    <div class="panel-heading">
      <span>数据图谱</span>
      <strong>{{ data.totals.datasets }} 类 / {{ data.totals.records }} 条</strong>
    </div>

    <div class="atlas-grid">
      <button
        v-for="dataset in data.datasets"
        :key="dataset.key"
        class="dataset-tile"
        :class="{ active: dataset.key === selectedKey }"
        type="button"
        @click="$emit('select', dataset.key)"
      >
        <div>
          <strong>{{ dataset.label }}</strong>
          <span>{{ dataset.records }} 条</span>
        </div>
        <div class="tile-bars">
          <i
            v-for="(count, period) in dataset.periodCounts"
            :key="period"
            :title="`${period}: ${count}`"
            :style="{ height: `${Math.max(8, Math.min(44, count / Math.max(dataset.records, 1) * 160))}px` }"
          ></i>
        </div>
      </button>
    </div>
  </section>
</template>
