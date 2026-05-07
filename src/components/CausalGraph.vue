<script setup>
import { computed, ref } from 'vue'

const props = defineProps({
  item: { type: Object, required: true },
})

const hoveredId = ref('')
const tooltip = ref({ visible: false, x: 0, y: 0 })

const colorMap = {
  shock: '#b55b4d',
  population: '#d2a94d',
  governance: '#597d75',
  function: '#7b6c9b',
  space: '#9a7859',
  water: '#477f9d',
}

const groupLabels = {
  shock: '外部冲击',
  population: '人口变化',
  governance: '制度治理',
  function: '城市功能',
  space: '空间营建',
  water: '水系交通',
}

const nodes = computed(() => {
  const count = props.item.chain.length
  return props.item.chain.map((node, index) => {
    const x = 90 + index * (520 / Math.max(count - 1, 1))
    const y = index % 2 === 0 ? 118 : 218
    return {
      ...node,
      x,
      y,
      color: colorMap[node.group] || '#8a8175',
      groupLabel: groupLabels[node.group] || '关键环节',
      labelLines: labelLines(node.label),
      explanation: node.explanation || `${node.label}是“${props.item.title}”转折链条中的${groupLabels[node.group] || '关键'}环节。`,
    }
  })
})

const hoveredNode = computed(() => nodes.value.find((node) => node.id === hoveredId.value))

const links = computed(() =>
  props.item.links.map(([sourceId, targetId]) => ({
    source: nodes.value.find((node) => node.id === sourceId),
    target: nodes.value.find((node) => node.id === targetId),
  })),
)

function showTooltip(node, event) {
  hoveredId.value = node.id
  moveTooltip(event)
  tooltip.value.visible = true
}

function moveTooltip(event) {
  tooltip.value = {
    visible: tooltip.value.visible,
    x: event.offsetX + 18,
    y: event.offsetY + 18,
  }
}

function hideTooltip() {
  hoveredId.value = ''
  tooltip.value.visible = false
}

function labelLines(label) {
  const text = String(label || '')
  if (text.length <= 4) return [text]
  if (text.length <= 6) return [text.slice(0, 3), text.slice(3)]
  return [text.slice(0, 4), text.slice(4, 8), text.slice(8)].filter(Boolean)
}
</script>

<template>
  <section class="panel causal-panel">
    <div class="panel-heading">
      <span>转折机制</span>
      <strong>{{ item.year }} {{ item.title }}</strong>
    </div>

    <p class="summary">{{ item.summary }}</p>

    <div class="causal-stage">
      <svg class="causal-svg" viewBox="0 0 700 320" role="img" aria-label="因果链视图">
        <defs>
          <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#a89b8c" />
          </marker>
        </defs>

        <path
          v-for="(link, index) in links"
          :key="index"
          class="causal-link"
          :class="{ muted: hoveredId && link.source.id !== hoveredId && link.target.id !== hoveredId }"
          :d="`M ${link.source.x + 66} ${link.source.y} C ${(link.source.x + link.target.x) / 2} ${link.source.y}, ${(link.source.x + link.target.x) / 2} ${link.target.y}, ${link.target.x - 66} ${link.target.y}`"
        />

        <g
          v-for="node in nodes"
          :key="node.id"
          class="causal-node"
          :class="{ active: node.id === hoveredId, muted: hoveredId && node.id !== hoveredId }"
          role="button"
          tabindex="0"
          @mouseenter="showTooltip(node, $event)"
          @mousemove="moveTooltip"
          @mouseleave="hideTooltip"
          @focus="hoveredId = node.id"
          @blur="hideTooltip"
        >
          <title>{{ node.groupLabel }}：{{ node.label }}</title>
          <rect class="node-hit" :x="node.x - 72" :y="node.y - 44" width="144" height="88" rx="10" />
          <rect class="node-card" :x="node.x - 62" :y="node.y - 36" width="124" height="72" rx="8" :fill="node.color" />
          <text class="node-group-label" :x="node.x" :y="node.y - 15" text-anchor="middle">{{ node.groupLabel }}</text>
          <text
            v-for="(line, lineIndex) in node.labelLines"
            :key="`${node.id}-${lineIndex}`"
            :x="node.x"
            :y="node.y + 10 + lineIndex * 17"
            text-anchor="middle"
          >
            {{ line }}
          </text>
        </g>
      </svg>

      <div
        v-if="tooltip.visible && hoveredNode"
        class="graph-tooltip"
        :style="{ left: `${tooltip.x}px`, top: `${tooltip.y}px` }"
      >
        <div class="tooltip-kicker">{{ hoveredNode.groupLabel }}</div>
        <strong>{{ hoveredNode.label }}</strong>
        <p>{{ hoveredNode.explanation }}</p>
      </div>
    </div>
  </section>
</template>
