<script setup>
defineProps({
  item: { type: Object, required: true },
})
</script>

<template>
  <section class="metric-strip">
    <article v-for="metric in item.metrics" :key="metric.label" class="metric-card">
      <span>{{ metric.label }}</span>
      <strong>{{ metric.value }}</strong>
      <div class="meter">
        <i :style="{ width: `${metric.value}%` }"></i>
      </div>
    </article>
  </section>
</template>
