<script setup>
import { computed } from 'vue'

const props = defineProps({
  series: { type: Array, required: true },
})

const mechanisms = [
  {
    title: '外部冲击',
    label: '触发源',
    keys: ['disaster', 'wars', 'events'],
    text: '用灾害、战争与大事件识别城市变迁的触发点，寻找人口离散与制度重组的前因。',
    accent: '#a95d41',
  },
  {
    title: '内部重组',
    label: '组织力',
    keys: ['governance', 'people', 'population'],
    text: '把建制沿革、人物网络与人口变化连起来，观察权力结构如何嵌入城市空间。',
    accent: '#597d75',
  },
  {
    title: '空间支撑',
    label: '承载面',
    keys: ['water', 'traffic'],
    text: '以水系治理和交通通达性解释城市功能从军事重镇到全国枢纽的转换。',
    accent: '#477f9d',
  },
]

const cards = computed(() => mechanisms.map((mechanism) => {
  const datasets = props.series.filter((item) => mechanism.keys.includes(item.key))
  const total = datasets.reduce((sum, item) => sum + item.total, 0)
  const keywords = datasets
    .flatMap((dataset) => dataset.topKeywords || [])
    .sort((a, b) => b.value - a.value)
    .slice(0, 8)

  return {
    ...mechanism,
    datasets,
    total,
    keywords,
  }
}))

const maxTotal = computed(() => Math.max(...cards.value.map((card) => card.total), 1))

function percent(value, total) {
  if (!total) return '0%'
  return `${Math.max(5, Math.round((value / total) * 100))}%`
}
</script>

<template>
  <section class="mechanism-grid">
    <article
      v-for="mechanism in cards"
      :key="mechanism.title"
      class="panel mechanism-card"
      :style="{ '--mechanism-accent': mechanism.accent, '--mechanism-share': percent(mechanism.total, maxTotal) }"
    >
      <div class="panel-heading">
        <span>{{ mechanism.title }}</span>
        <strong>{{ mechanism.total }} 条</strong>
      </div>
      <div class="mechanism-meter" aria-hidden="true">
        <i></i>
      </div>
      <div class="mechanism-lead">
        <small>{{ mechanism.label }}</small>
        <p>{{ mechanism.text }}</p>
      </div>
      <div class="mechanism-datasets">
        <div v-for="dataset in mechanism.datasets" :key="dataset.key" class="mechanism-dataset">
          <span>{{ dataset.label }}</span>
          <b>{{ dataset.total }}</b>
          <i :style="{ width: percent(dataset.total, mechanism.total) }"></i>
        </div>
      </div>
      <div class="mechanism-keywords">
        <span v-for="keyword in mechanism.keywords" :key="`${mechanism.title}-${keyword.name}`">
          {{ keyword.name }}
        </span>
      </div>
    </article>
  </section>
</template>
