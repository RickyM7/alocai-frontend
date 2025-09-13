<template>
  <div class="calendar-container" ref="containerRef">
    <div class="cal-toolbar">
      <div class="cal-toolbar-left">
        <button class="btn-nav" @click="prevMonth" aria-label="Mês anterior">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M15 18l-6-6 6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </button>
        <button class="btn-nav" @click="nextMonth" aria-label="Próximo mês">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M9 6l6 6-6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </button>
      </div>
      <div class="cal-title">{{ monthTitle }}</div>
      <div class="cal-toolbar-right"></div>
    </div>
    <div class="calendar-grid">
      <div v-for="(w,i) in weekdays" :key="'w-'+i" class="weekday">{{ w }}</div>
      <div v-for="cell in monthCells" :key="cell.key" class="day-cell" :class="{ 'other-month': !cell.inCurrentMonth, 'has-events': cell.count>0 }" @click="onDayClick(cell)">
        <div class="day-content"><span class="day-number">{{ cell.date.getDate() }}</span></div>
        <div v-if="cell.count>0" class="event-indicator" :title="`${cell.count} agendamento(s)`">{{ cell.count }}</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'

const props = defineProps({ resourceId: { type: Number, default: null } })
const emit = defineEmits(['date-clicked'])
const config = useRuntimeConfig()

const containerRef = ref(null)
const visibleMonth = ref(new Date())
const calendarEvents = ref([])

const pad = (n) => String(n).padStart(2, '0')
const keyFromDate = (d) => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`

const weekdays = ['dom.','seg.','ter.','qua.','qui.','sex.','sáb.']
const monthTitle = computed(() => visibleMonth.value.toLocaleDateString('pt-BR',{ month:'long', year:'numeric' }))

const eventsByDate = computed(() => {
  const map = new Map()
  for (const e of calendarEvents.value) {
    const key = (e.start||'').split('T')[0]
    if (!map.has(key)) map.set(key, [])
    map.get(key).push(e)
  }
  return map
})

const monthCells = computed(() => {
  const y = visibleMonth.value.getFullYear()
  const m = visibleMonth.value.getMonth()
  const first = new Date(y, m, 1)
  const start = first.getDay()
  const days = new Date(y, m+1, 0).getDate()
  const prevDays = new Date(y, m, 0).getDate()
  const cells = []
  for (let i=start-1;i>=0;i--) {
    const d = new Date(y, m-1, prevDays-i)
    const k = keyFromDate(d)
    const ev = eventsByDate.value.get(k) || []
    cells.push({ date:d, key:k, inCurrentMonth:false, events:ev, count:ev.length })
  }
  for (let day=1;day<=days;day++) {
    const d = new Date(y, m, day)
    const k = keyFromDate(d)
    const ev = eventsByDate.value.get(k) || []
    cells.push({ date:d, key:k, inCurrentMonth:true, events:ev, count:ev.length })
  }
  const rem = 42 - cells.length
  for (let i=1;i<=rem;i++) {
    const d = new Date(y, m+1, i)
    const k = keyFromDate(d)
    const ev = eventsByDate.value.get(k) || []
    cells.push({ date:d, key:k, inCurrentMonth:false, events:ev, count:ev.length })
  }
  return cells
})

const prevMonth = () => { const d = visibleMonth.value; visibleMonth.value = new Date(d.getFullYear(), d.getMonth()-1, 1) }
const nextMonth = () => { const d = visibleMonth.value; visibleMonth.value = new Date(d.getFullYear(), d.getMonth()+1, 1) }

const onDayClick = (cell) => { if (!cell.inCurrentMonth || cell.count===0) return; emit('date-clicked', { date:cell.date, events:cell.events }) }

const fetchCalendarData = async () => {
  let url = `${config.public.apiUrl}/api/dashboard/calendar/`
  if (props.resourceId) url = `${config.public.apiUrl}/api/admin/recursos/${props.resourceId}/agendamentos/`
  try {
    const r = await fetch(url)
    if (!r.ok) throw new Error('Falha ao carregar dados do calendário.')
    const data = await r.json()
    calendarEvents.value = data.map(a => ({
      id:a.id_agendamento,
      title:a.finalidade||'Agendamento',
      start:`${a.data_inicio}T${a.hora_inicio}`,
      end:`${a.data_fim}T${a.hora_fim}`,
      extendedProps:{ finalidade:a.finalidade, recurso:a.recurso }
    }))
  } catch (e) {
    console.error('Erro ao buscar dados do calendário:', e)
  }
}

let ro
const computeHeights = () => {
  const el = containerRef.value
  if (!el) return
  const toolbar = el.querySelector('.cal-toolbar')
  const grid = el.querySelector('.calendar-grid')
  const weekday = grid?.querySelector('.weekday')
  const H = el.clientHeight || 0
  const th = toolbar?.offsetHeight || 0
  const hh = weekday?.offsetHeight || 0
  const spacing = 8
  const avail = Math.max(0, H - th - hh - spacing)
  const minR = 42, maxR = 140
  const perRow = Math.min(maxR, Math.max(minR, Math.floor(avail / 6)))
  el.style.setProperty('--day-cell-height', `${perRow}px`)
}

onMounted(async () => {
  await nextTick()
  computeHeights()
  if ('ResizeObserver' in window) {
    ro = new ResizeObserver(() => computeHeights())
    ro.observe(containerRef.value)
  } else {
    window.addEventListener('resize', computeHeights)
  }
})
onBeforeUnmount(() => { if (ro) ro.disconnect(); else window.removeEventListener('resize', computeHeights) })
watch(visibleMonth, async () => { await nextTick(); computeHeights() })
watch(() => props.resourceId, fetchCalendarData, { immediate: true })
</script>

<style>
.calendar-container{height:100%;width:100%;min-width:0;display:flex;flex-direction:column;overflow:hidden;--day-cell-height:96px}
.calendar-container,.calendar-container *{box-sizing:border-box}
.cal-toolbar{display:grid;grid-template-columns:auto 1fr auto;align-items:center;gap:.5rem;margin-bottom:.5rem}
.cal-toolbar-left,.cal-toolbar-right{display:flex;align-items:center;gap:.5rem}
.cal-title{text-align:center;font-weight:800;font-size:1.6rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.btn-nav{background-color:#4f46e5;border:1px solid #4f46e5;color:#fff;padding:.5rem .6rem;border-radius:8px;cursor:pointer;display:inline-flex;align-items:center;justify-content:center}
.btn-nav:hover{background-color:#4338ca}
.calendar-grid{width:100%;max-width:100%;display:grid;grid-template-columns:repeat(7,minmax(0,1fr));grid-template-rows:auto repeat(6,var(--day-cell-height))}
.weekday{font-weight:700;text-align:center;padding:.45rem .25rem;background:#f9fafb;color:#374151;box-shadow:inset -1px 0 #e5e7eb,inset 0 -1px #e5e7eb}
.day-cell{position:relative;background:#fff;overflow:hidden;box-shadow:inset -1px 0 #e5e7eb,inset 0 -1px #e5e7eb}
.day-content{width:100%;height:100%;display:grid;place-items:center}
.day-number{font-weight:700;font-size:1.05rem;line-height:1;color:#111827}
.other-month .day-number{color:#9ca3af}
.has-events{cursor:pointer}
.has-events:hover{background:#f9fafb}
.event-indicator{position:absolute;top:6px;right:6px;background:#ef4444;color:#fff;border-radius:50%;width:20px;height:20px;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;z-index:1;pointer-events:none}
@media(max-width:48rem){.cal-toolbar{grid-template-columns:1fr auto;grid-template-areas:"title nav";row-gap:.5rem}.cal-title{grid-area:title;font-size:1.25rem;white-space:normal}.cal-toolbar-left{grid-area:nav;justify-self:end}.weekday{font-size:.78rem;padding:.3rem .15rem}.day-number{font-size:.9rem}.event-indicator{width:14px;height:14px;font-size:8px;top:4px;right:4px}.btn-nav{padding:.35rem .45rem;border-radius:7px}.calendar-grid{grid-template-columns:repeat(7,minmax(32px,1fr))}}
@media(max-width:22.5rem){.cal-title{font-size:1.1rem}.weekday{font-size:.7rem;padding:.25rem .12rem}.day-number{font-size:.85rem}.event-indicator{width:12px;height:12px;font-size:7px;top:3px;right:3px}.btn-nav{padding:.3rem .4rem;border-radius:6px}.calendar-grid{grid-template-columns:repeat(7,minmax(28px,1fr))}}
</style>