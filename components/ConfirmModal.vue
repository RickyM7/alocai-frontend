<template>
  <div v-if="isOpen" class="modal-overlay">
    <div class="modal-container">
      <div class="modal-header">
        <h3>{{ title }}</h3>
        <button @click="emit('cancel')" class="ibtn ghost"><Icon name="i-lucide-x" /></button>
      </div>
      <div class="modal-body">
        <p>{{ message }}</p>
      </div>
      <div class="modal-footer">
        <button class="btn btn-outline" @click="emit('cancel')">Cancelar</button>
        <button class="btn btn-danger" @click="emit('confirm')">{{ confirmText }}</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps({
  isOpen: { type: Boolean, required: true },
  title: { type: String, default: 'Confirmar Ação' },
  message: { type: String, required: true },
  confirmText: { type: String, default: 'Confirmar' }
});

const emit = defineEmits(['cancel', 'confirm']);
</script>

<style scoped>
.modal-overlay {
  position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
  background: rgba(0,0,0,0.5); z-index: 1000;
  display: flex; align-items: center; justify-content: center;
  padding: 1rem; box-sizing: border-box;
}
.modal-container {
  background: #fff; width: 100%; max-width: 450px;
  border-radius: 12px; display: flex; flex-direction: column;
  box-shadow: 0 20px 25px -5px rgba(0,0,0,0.2), 0 10px 10px -5px rgba(0,0,0,0.04);
}
.modal-header {
  display: flex; justify-content: space-between; align-items: center;
  padding: 1rem 1.25rem; border-bottom: 1px solid #e5e7eb; background: #f9fafb;
  border-radius: 12px 12px 0 0;
}
.modal-header h3 { margin: 0; font-size: 1.1rem; color: #111827; }
.ibtn { display: inline-flex; align-items: center; justify-content: center; width: 32px; height: 32px; border-radius: 6px; border: none; cursor: pointer; transition: 0.1s; }
.ibtn.ghost { background: transparent; color: #6b7280; }
.ibtn.ghost:hover { background: #f3f4f6; color: #111827; }

.modal-body { padding: 1.5rem 1.25rem; color: #374151; font-size: 0.95rem; line-height: 1.5; }

.modal-footer {
  padding: 1rem 1.25rem; border-top: 1px solid #e5e7eb; display: flex; justify-content: flex-end; gap: 0.5rem; background: #f9fafb;
  border-radius: 0 0 12px 12px;
}
.btn { display: inline-flex; align-items: center; gap: 0.4rem; padding: 0.55rem 1rem; border-radius: 6px; cursor: pointer; font-size: 0.85rem; font-weight: 500; border: 1px solid transparent; transition: 0.15s; }
.btn-outline { background: transparent; border-color: #d1d5db; color: #374151; }
.btn-outline:hover { background: #f3f4f6; }
.btn-danger { background: #ef4444; color: #fff; }
.btn-danger:hover { background: #dc2626; }
</style>
