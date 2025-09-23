<template>
  <div class="calendar-container" ref="calendarRef">
    <div class="cal-toolbar">
      <button @click="prevMonth" class="btn-nav" aria-label="Mês anterior"><Icon name="i-lucide-chevron-left" /></button>
      <div class="cal-title-container">
        <button @click="isMonthYearPickerOpen = !isMonthYearPickerOpen" class="title-button">
          {{ monthTitle }}
        </button>
        <div v-if="isMonthYearPickerOpen" class="month-year-picker" @click.stop>
          <div class="picker-toolbar">
            <button @click="pickerYear--" class="btn-nav" aria-label="Ano anterior"><Icon name="i-lucide-chevron-left" /></button>
            <span class="picker-year">{{ pickerYear }}</span>
            <button @click="pickerYear++" class="btn-nav" aria-label="Próximo ano"><Icon name="i-lucide-chevron-right" /></button>
          </div>
          <div class="months-grid">
            <button v-for="(month, i) in months" :key="month" @click="selectMonth(i)" class="month-button" :class="{ selected: isSelectedMonth(i), current: isCurrentMonth(i) }">{{ month }}</button>
          </div>
        </div>
      </div>
      <button @click="nextMonth" class="btn-nav" aria-label="Próximo mês"><Icon name="i-lucide-chevron-right" /></button>
    </div>

    <div class="calendar-grid">
      <div v-for="w in weekdays" :key="w" class="weekday">{{ w }}</div>
      <div
        v-for="cell in monthCells"
        :key="cell.key"
        class="day-cell"
        :class="{
          'selected': cell.isSelected,
          'disabled': cell.isDisabled,
          'other-month': !cell.inCurrentMonth,
          'today': cell.isToday,
          'tooltip-active': tooltipVisible === cell.key,
          'in-range': cell.inRange,
          'range-start': cell.isRangeStart,
          'range-end': cell.isRangeEnd
        }"
        @click="toggleDate(cell)"
      >
        <div class="day-content">
          <span class="day-number">{{ cell.date.getDate() }}</span>
          <div v-if="cell.schedules.length > 0" class="schedule-indicator-wrapper">
            <div
              class="schedule-indicator"
              @mouseenter="showTooltip(cell.key)"
              @mouseleave="hideTooltip"
              @click.stop="toggleTooltipMobile(cell.key)"
            ></div>
            <div
              v-if="tooltipVisible === cell.key"
              class="schedule-tooltip"
              @mouseenter="keepTooltipVisible"
              @mouseleave="hideTooltip"
            >
              <div class="tooltip-header">Horários Ocupados</div>
              <div class="tooltip-content">
                <div v-for="(schedule, i) in sortedSchedules(cell.schedules)" :key="i" class="tooltip-item">
                  Das {{ schedule.start }} às {{ schedule.end }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="mobileTooltipVisible" class="mobile-tooltip-overlay" @click="closeMobileTooltip">
      <div class="mobile-tooltip-content" @click.stop>
        <div class="mobile-tooltip-header">
          <span>Horários Ocupados</span>
          <button @click="closeMobileTooltip" class="close-btn">×</button>
        </div>
        <div class="mobile-tooltip-body">
          <div v-for="(schedule, i) in sortedSchedules(mobileTooltipSchedules)" :key="i" class="mobile-tooltip-item">
            Das {{ schedule.start }} às {{ schedule.end }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';

const props = defineProps({
  modelValue: { type: Array, default: () => [] },
  horariosOcupados: { type: Object, default: () => ({}) },
  range: { type: Boolean, default: false }
});
const emit = defineEmits(['update:modelValue']);

const calendarRef = ref(null);
const visibleMonth = ref(new Date());
const isMonthYearPickerOpen = ref(false);
const pickerYear = ref(new Date().getFullYear());
const tooltipVisible = ref(null);
const mobileTooltipVisible = ref(false);
const mobileTooltipSchedules = ref([]);
const isMobile = ref(false);
const hideTimer = ref(null);

const weekdays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

const keyFromDate = (d) => {
  if (!d || !(d instanceof Date)) return null;
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const monthTitle = computed(() => visibleMonth.value.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }));
const selectedKeys = computed(() => new Set(props.modelValue.map(d => keyFromDate(new Date(d)))));
const today = new Date();
today.setHours(0, 0, 0, 0);

const monthCells = computed(() => {
  const y = visibleMonth.value.getFullYear();
  const m = visibleMonth.value.getMonth();
  const firstDayOfMonth = new Date(y, m, 1);
  const startDayOfWeek = firstDayOfMonth.getDay();
  const daysInMonth = new Date(y, m + 1, 0).getDate();
  const cells = [];

  const createCell = (date) => {
    const key = keyFromDate(date);
    let inRange = false;
    let isRangeStart = false;
    let isRangeEnd = false;

    if (props.range && props.modelValue && props.modelValue.length === 2) {
      const start = new Date(props.modelValue[0]).setHours(0,0,0,0);
      const end = new Date(props.modelValue[1]).setHours(0,0,0,0);
      const current = date.getTime();
      if (current > start && current < end) {
        inRange = true;
      }
      if (current === start) isRangeStart = true;
      if (current === end) isRangeEnd = true;
    } else if (props.range && props.modelValue && props.modelValue.length === 1) {
        const start = new Date(props.modelValue[0]).setHours(0,0,0,0);
        if (date.getTime() === start) isRangeStart = true;
    }
    
    return {
      date, key,
      inCurrentMonth: date.getMonth() === m,
      isSelected: selectedKeys.value.has(key),
      isToday: date.getTime() === today.getTime(),
      isDisabled: date < today,
      schedules: props.horariosOcupados[key] || [],
      inRange, isRangeStart, isRangeEnd,
    };
  };

  for (let i = startDayOfWeek; i > 0; i--) {
    cells.push(createCell(new Date(y, m, 1 - i)));
  }
  for (let day = 1; day <= daysInMonth; day++) {
    cells.push(createCell(new Date(y, m, day)));
  }

  const totalCells = cells.length > 35 ? 42 : 35;
  while (cells.length < totalCells) {
    const last = cells[cells.length - 1].date;
    cells.push(createCell(new Date(last.getFullYear(), last.getMonth(), last.getDate() + 1)));
  }
  return cells;
});

const sortedSchedules = (schedules) => {
  return [...schedules].sort((a, b) => a.start.localeCompare(b.start));
};

const toggleDate = (cell) => {
  if (cell.isDisabled) return;

  if (!props.range) {
    const newSelection = new Set(props.modelValue.map(d => keyFromDate(new Date(d))));
    if (newSelection.has(cell.key)) {
      newSelection.delete(cell.key);
    } else {
      newSelection.add(cell.key);
    }
    const newDates = Array.from(newSelection).map(key => new Date(key + 'T00:00:00')).sort((a, b) => a - b);
    emit('update:modelValue', newDates);
  } else {
    let dates = props.modelValue ? [...props.modelValue] : [];
    if (dates.length >= 2 || dates.length === 0) {
        dates = [cell.date];
    } else { // length is 1
        dates.push(cell.date);
        dates.sort((a, b) => a - b);
    }
    emit('update:modelValue', dates);
  }
};

const showTooltip = (key) => {
  if (isMobile.value) return;
  if (hideTimer.value) clearTimeout(hideTimer.value);
  tooltipVisible.value = key;
};

const hideTooltip = () => {
  hideTimer.value = setTimeout(() => {
    tooltipVisible.value = null;
  }, 100);
};

const keepTooltipVisible = () => {
  if (hideTimer.value) {
    clearTimeout(hideTimer.value);
  }
};

const toggleTooltipMobile = (key) => {
  if (isMobile.value) {
    const cell = monthCells.value.find(c => c.key === key);
    if (cell && cell.schedules.length > 0) {
      mobileTooltipSchedules.value = cell.schedules;
      mobileTooltipVisible.value = true;
    }
  }
};

const closeMobileTooltip = () => {
  mobileTooltipVisible.value = false;
  mobileTooltipSchedules.value = [];
};

const checkMobile = () => {
  isMobile.value = window.innerWidth <= 768;
};

const prevMonth = () => visibleMonth.value = new Date(visibleMonth.value.getFullYear(), visibleMonth.value.getMonth() - 1, 1);
const nextMonth = () => visibleMonth.value = new Date(visibleMonth.value.getFullYear(), visibleMonth.value.getMonth() + 1, 1);
const selectMonth = (monthIndex) => {
  visibleMonth.value = new Date(pickerYear.value, monthIndex, 1);
  isMonthYearPickerOpen.value = false;
};
const isSelectedMonth = (monthIndex) => visibleMonth.value.getMonth() === monthIndex && visibleMonth.value.getFullYear() === pickerYear.value;
const isCurrentMonth = (monthIndex) => {
  const now = new Date();
  return now.getMonth() === monthIndex && pickerYear.value === now.getFullYear();
};

const handleClickOutside = (event) => {
  if (calendarRef.value && !calendarRef.value.contains(event.target)) {
    isMonthYearPickerOpen.value = false;
  }
};

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
  window.addEventListener('resize', checkMobile);
  checkMobile();
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
  window.removeEventListener('resize', checkMobile);
});

watch(visibleMonth, (newDate) => pickerYear.value = newDate.getFullYear());
</script>

<style scoped>
.calendar-container { width: 100%; height: 100%; display: flex; flex-direction: column; font-family: sans-serif; font-size: 1rem; position: relative; }
.cal-toolbar { display: flex; justify-content: space-between; align-items: center; padding: 0.5rem 0.25rem; margin-bottom: 0.5rem; flex-shrink: 0; }
.cal-title-container { position: relative; }
.title-button { background: none; border: none; font-size: 1.1em; font-weight: 600; color: #1f2937; cursor: pointer; padding: 0.25rem 0.5rem; border-radius: 6px; }
.title-button:hover { background-color: #f3f4f6; }
.btn-nav { background: none; border: none; color: #6b7280; border-radius: 50%; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: background-color 0.2s; }
.btn-nav:hover { background-color: #f3f4f6; }
.month-year-picker { position: absolute; top: calc(100% + 5px); left: 50%; transform: translateX(-50%); background: white; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); z-index: 20; width: 220px; padding: 0.75rem; }
.picker-toolbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem; }
.picker-year { font-weight: 600; }
.months-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.25rem; }
.month-button { background: none; border: none; padding: 0.5rem; border-radius: 4px; cursor: pointer; }
.month-button:hover { background-color: #f3f4f6; }
.month-button.selected { background-color: #3730a3; color: white; }
.month-button.current { background-color: #e0e7ff; color: #3730a3; }
.calendar-grid { flex-grow: 1; display: grid; grid-template-columns: repeat(7, 1fr); grid-auto-rows: minmax(0, 1fr); border-radius: 8px; border: 1px solid #e5e7eb; overflow: visible; }
.weekday { font-weight: 500; text-align: center; padding: 0.5rem 0; color: #6b7280; font-size: 0.75em; background-color: #f9fafb; border-bottom: 1px solid #e5e7eb; }
.day-cell { display: flex; align-items: center; justify-content: center; position: relative; transition: background-color 0.1s; border-right: 1px solid #e5e7eb; border-top: 1px solid #e5e7eb; overflow: visible; }
.day-cell.tooltip-active { z-index: 15; }
.day-cell:nth-child(7n) { border-right: none; }
.day-cell:not(.disabled) { cursor: pointer; }
.day-cell:not(.disabled):not(.selected):hover { background-color: #eff6ff; }
.day-content { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; position: relative; }
.day-number { position: relative; z-index: 1; width: 2.25em; height: 2.25em; display: flex; align-items: center; justify-content: center; border-radius: 50%; }
.other-month { background-color: #f9fafb; }
.other-month .day-number { color: #b8bcc4; }
.other-month.selected .day-number { color: #e5e7eb; }
.disabled { color: #d1d5db; cursor: not-allowed; background-color: #f9fafb; }
.selected { background-color: #2563eb; color: white; }
.selected.other-month { background-color: #60a5fa; }
.selected:hover { background-color: #1d4ed8; }
.selected.other-month:hover { background-color: #3b82f6; }
.today .day-number::after { content: ''; position: absolute; bottom: 0.15em; left: 50%; transform: translateX(-50%); width: 1.25em; height: 2px; background-color: #10b981; border-radius: 1px; }
.selected.today .day-number::after { background-color: white; }
.schedule-indicator-wrapper { position: absolute; top: 0; right: 0; width: 0.7rem; height: 0.7rem; z-index: 10; cursor: pointer; }
.schedule-indicator { width: 100%; height: 100%; background-color: #ef4444; border-bottom-left-radius: 1.1em; }
.schedule-tooltip { position: absolute; bottom: calc(100% - 5px); background: #374151; color: white; border-radius: 6px; padding: 0.75rem; font-size: 0.75rem; z-index: 9999; min-width: 200px; max-width: 280px; box-shadow: 0 4px 12px rgba(0,0,0,0.2); }
.day-cell:nth-child(7n + 5) .schedule-tooltip, .day-cell:nth-child(7n + 6) .schedule-tooltip, .day-cell:nth-child(7n) .schedule-tooltip { right: 0; }
.day-cell:nth-child(7n + 4) .schedule-tooltip { right: 50%; transform: translateX(50%); }
.day-cell:nth-child(7n + 1) .schedule-tooltip, .day-cell:nth-child(7n + 2) .schedule-tooltip, .day-cell:nth-child(7n + 3) .schedule-tooltip { left: 0; }
.tooltip-header { font-weight: bold; border-bottom: 1px solid #4b5563; margin-bottom: 0.5rem; padding-bottom: 0.5rem; }
.tooltip-content { max-height: 150px; overflow-y: auto; }
.tooltip-item { padding: 0.25rem 0; }
.mobile-tooltip-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 100; display: flex; align-items: center; justify-content: center; padding: 1rem; }
.mobile-tooltip-content { background: white; border-radius: 8px; width: 100%; max-width: 320px; max-height: 60vh; overflow: hidden; }
.mobile-tooltip-header { display: flex; justify-content: space-between; align-items: center; padding: 1rem; border-bottom: 1px solid #e5e7eb; font-weight: 600; }
.close-btn { background: none; border: none; font-size: 1.5rem; cursor: pointer; color: #6b7280; padding: 0; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; }
.mobile-tooltip-body { padding: 1rem; max-height: calc(60vh - 60px); overflow-y: auto; }
.mobile-tooltip-item { padding: 0.5rem 0; border-bottom: 1px solid #f3f4f6; }
.mobile-tooltip-item:last-child { border-bottom: none; }
.day-cell.in-range:not(.selected) { background-color: #eff6ff; border-radius: 0; }
.day-cell.range-start { background-color: #60a5fa; }
.day-cell.range-end { background-color: #60a5fa; }
.day-cell.range-start .day-number, .day-cell.range-end .day-number { color: white; }
.day-cell.range-start:not(.range-end) { border-top-right-radius: 0; border-bottom-right-radius: 0; }
.day-cell.range-end:not(.range-start) { border-top-left-radius: 0; border-bottom-left-radius: 0; }
.day-cell.selected.range-start, .day-cell.selected.range-end { background-color: #2563eb; }

@media (max-width: 1400px) and (min-width: 769px) {
  .calendar-container { font-size: 0.9rem; }
}
@media (max-width: 768px) {
  .schedule-tooltip { display: none; }
}
@media (max-width: 480px) {
  .schedule-indicator-wrapper { width: 1rem; height: 1rem; }
}
</style>