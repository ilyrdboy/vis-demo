<script setup>
import { computed, ref } from 'vue'
import { withoutEllipsis } from '../utils/textFormat'

const props = defineProps({
  network: { type: Object, required: true },
  entities: { type: Object, required: true },
})

const selectedRouteKey = ref('')
const selectedPlaceId = ref('')

const placeMap = computed(() => Object.fromEntries(props.network.places.map((place) => [place.id, place])))
const maxRoute = computed(() => Math.max(...props.network.routes.map((route) => route.value), 1))
const maxPlace = computed(() => Math.max(...props.entities.places.map((place) => place.value), 1))
const visiblePlaces = computed(() =>
  props.entities.places.filter((place) => place.value > 0 || place.id === 'beijing'),
)

const selectedRoute = computed(() =>
  props.network.routes.find((route) => `${route.source}-${route.target}` === selectedRouteKey.value),
)
const selectedPlace = computed(() => props.entities.places.find((place) => place.id === selectedPlaceId.value))

const labelOffsets = {
  beijing: { x: 0, y: -11, anchor: 'middle' },
  datong: { x: -8, y: -6, anchor: 'end' },
  shangdu: { x: 0, y: -12, anchor: 'middle' },
  liaodong: { x: 9, y: -7, anchor: 'start' },
  tongzhou: { x: 8, y: -5, anchor: 'start' },
  tianjin: { x: 9, y: 1, anchor: 'start' },
  kaifeng: { x: 0, y: -11, anchor: 'middle' },
  jiangnan: { x: 0, y: -11, anchor: 'middle' },
}

function selectRoute(route) {
  selectedRouteKey.value = `${route.source}-${route.target}`
  selectedPlaceId.value = ''
}

function selectPlace(place) {
  selectedPlaceId.value = place.id
  selectedRouteKey.value = ''
}

function offsetFor(place) {
  return labelOffsets[place.id] || { x: 0, y: -9, anchor: 'middle' }
}

function routePath(route) {
  const source = placeMap.value[route.source]
  const target = placeMap.value[route.target]
  if (!source || !target) return ''
  const cx = (source.x + target.x) / 2
  const cy = Math.min(source.y, target.y) - 12
  return `M ${source.x} ${source.y} Q ${cx} ${cy} ${target.x} ${target.y}`
}
</script>

<template>
  <section class="panel geo-panel">
    <div class="panel-heading">
      <span>古今地名与交通网络</span>
      <strong>{{ network.routes.length }} 条线索</strong>
    </div>

    <div class="geo-layout">
      <div class="geo-map">
        <svg viewBox="0 0 100 100" role="img" aria-label="北京外部联系示意图">
          <path class="map-region" d="M15 18 C30 4, 63 2, 82 20 C98 36, 91 74, 70 90 C48 105, 20 91, 11 65 C4 43, 2 29, 15 18 Z" />

          <path
            v-for="route in network.routes"
            :key="`${route.source}-${route.target}`"
            class="route-line"
            :class="{ active: selectedRouteKey === `${route.source}-${route.target}` }"
            :d="routePath(route)"
            :stroke-width="1.2 + (route.value / maxRoute) * 4"
            tabindex="0"
            @click="selectRoute(route)"
            @keydown.enter="selectRoute(route)"
          />

          <g
            v-for="place in visiblePlaces"
            :key="place.id"
            class="place-node"
            :class="{ active: selectedPlaceId === place.id }"
            role="button"
            tabindex="0"
            :aria-label="`${place.name}，${place.value} 条证据`"
            @click="selectPlace(place)"
            @keydown.enter="selectPlace(place)"
          >
            <title>{{ place.name }}</title>
            <circle class="place-hit" :cx="place.x" :cy="place.y" r="8.8" />
            <circle
              class="place-halo"
              :cx="place.x"
              :cy="place.y"
              :r="4.8 + (place.value / maxPlace) * 2.1"
            />
            <circle
              class="place-core"
              :cx="place.x"
              :cy="place.y"
              :r="2.8 + (place.value / maxPlace) * 1.8"
            />
            <circle class="place-dot" :cx="place.x" :cy="place.y" :r="0.9 + (place.value / maxPlace) * 0.45" />
            <text
              class="place-label"
              :x="place.x + offsetFor(place).x"
              :y="place.y + offsetFor(place).y"
              :text-anchor="offsetFor(place).anchor"
            >
              {{ place.name }}
            </text>
          </g>
        </svg>
      </div>

      <div class="geo-side">
        <article v-if="selectedPlace" class="route-detail">
          <small>{{ selectedPlace.kind }} / {{ selectedPlace.value }} 条证据</small>
          <strong>{{ selectedPlace.name }} · {{ selectedPlace.modernName }}</strong>
          <p>{{ withoutEllipsis(selectedPlace.note) }}</p>
        </article>
        <article v-else-if="selectedRoute" class="route-detail">
          <small>{{ selectedRoute.label }} / {{ selectedRoute.value }} 条证据</small>
          <strong>{{ placeMap[selectedRoute.source]?.name }} → {{ placeMap[selectedRoute.target]?.name }}</strong>
          <p v-if="selectedRoute.sample">{{ withoutEllipsis(selectedRoute.sample.rawText) }}</p>
        </article>
        <article v-else class="route-detail">
          <small>空间解释</small>
          <strong>从北京看外部联系</strong>
          <p>根据交通、战争、水系和建制记录中的地名别名，抽取北京与燕云、通州、天津、江南等方向的关系强度。</p>
        </article>

        <div class="entity-cloud">
          <span v-for="person in entities.people.slice(0, 10)" :key="person.name">
            {{ person.name }} · {{ person.value }}
          </span>
        </div>
      </div>
    </div>
  </section>
</template>
