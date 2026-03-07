<template>
  <div class="flow-layout">
    <div class="panel flow-panel">
      <!-- Header do fluxo -->
      <div class="panel-head">
        <div class="head-left">
          <button @click="router.push('/')" class="btn-back">
            <Icon name="i-lucide-arrow-left" />
          </button>
          <div>
            <h2>Nova Reserva</h2>
            <p>Selecione um recurso para o agendamento</p>
          </div>
        </div>
      </div>

      <!-- Corpo com scroll (listagem de recursos) -->
      <div class="panel-scroll panel-padding">
        <div v-if="isLoading" class="center-msg">
          <Icon name="i-lucide-loader-2" class="spin" style="font-size: 2rem;" />
          <p>Carregando recursos...</p>
        </div>
        
        <div v-else-if="error" class="action-alert error">
          <Icon name="i-lucide-alert-circle" /> {{ error }}
        </div>
        
        <div v-else class="recursos-grid">
          <div 
            v-for="recurso in recursos" 
            :key="recurso.id_recurso" 
            class="recurso-card"
            :class="{ 'selected': recursoSelecionado?.id_recurso === recurso.id_recurso }"
            @click="selecionarRecurso(recurso)"
          >
            <div class="rec-card-header">
              <h3 class="recurso-nome" :title="recurso.nome_recurso">{{ recurso.nome_recurso }}</h3>
              <span class="status-badge" :class="getStatusClass(recurso.status_recurso)">
                {{ recurso.status_recurso }}
              </span>
            </div>
            
            <p class="recurso-descricao">{{ recurso.descricao }}</p>
            
            <div class="rec-card-meta">
              <span title="Capacidade"><Icon name="i-lucide-users" /> {{ recurso.capacidade || 'N/A' }}</span>
              <span title="Localização"><Icon name="i-lucide-map-pin" /> {{ recurso.localizacao }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer fixo -->
      <div class="panel-footer">
        <button 
          class="btn btn-primary btn-flow" 
          :disabled="!recursoSelecionado" 
          @click="irParaData"
        >
          <span>Prosseguir</span> <Icon name="i-lucide-arrow-right" />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useAgendamentoStore } from '~/stores/agendamento';
import { useRouter } from 'vue-router';
import { authenticatedFetch } from '~/utils/api';
import { getStatusClass } from '~/utils/formatters';
import type { Recurso } from '~/types/recurso';

definePageMeta({ middleware: 'auth' });

const store = useAgendamentoStore();
const router = useRouter();
const config = useRuntimeConfig();

const recursos = ref<Recurso[]>([]);
const recursoSelecionado = ref<Recurso | null>(null);
const isLoading = ref(true);
const error = ref('');

async function fetchRecursos() {
  try {
    const response = await authenticatedFetch(`${config.public.apiUrl}/api/recursos/`);
    if (!response.ok) throw new Error('Não foi possível buscar os recursos.');
    recursos.value = await response.json();
  } catch (err: unknown) {
    error.value = err instanceof Error ? err.message : 'Erro desconhecido';
  } finally {
    isLoading.value = false;
  }
}

function selecionarRecurso(recurso: Recurso) {
  recursoSelecionado.value = recurso;
}

function irParaData() {
  if (recursoSelecionado.value) {
    store.setRecurso(recursoSelecionado.value);
    router.push('/agendamentoData');
  }
}

onMounted(() => {
  store.limparStore();
  fetchRecursos();
});
</script>

<style scoped>
/* ALERTA DE ERRO */
.action-alert.error { background: #fef2f2; color: #b91c1c; border: 1px solid #fecaca; padding: 1rem; border-radius: 8px; display: flex; align-items: center; gap: 0.5rem; font-size: 0.9rem; }

/* GRADE DE RECURSOS */
.recursos-grid { display: grid; gap: 1rem; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); }

.recurso-card {
  background-color: #fff; border: 1px solid #e5e7eb; border-radius: 10px;
  padding: 1.25rem; cursor: pointer; transition: all 0.2s ease;
  display: flex; flex-direction: column; gap: 0.75rem;
  box-shadow: 0 1px 3px rgba(0,0,0,0.02);
}
.recurso-card:hover { transform: translateY(-2px); box-shadow: 0 6px 12px -2px rgba(0,0,0,0.05); border-color: #d1d5db; }
.recurso-card.selected { border-color: #2563eb; background: #eff6ff; box-shadow: 0 0 0 1px #2563eb; }

.rec-card-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 0.5rem; }
.recurso-nome { font-size: 1.05rem; font-weight: 600; margin: 0; color: #111827; line-height: 1.2; display: block; }

@media (min-width: 769px) {
  .recurso-nome { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100%; }
}

@media (max-width: 768px) {
  .recurso-nome { white-space: normal; word-break: break-word; }
}

.status-badge { font-size: 0.65rem; padding: 0.2rem 0.6rem; border-radius: 9999px; font-weight: 600; text-transform: uppercase; white-space: nowrap; flex-shrink: 0;}

.recurso-descricao { color: #6b7280; margin: 0; font-size: 0.85rem; line-height: 1.4; flex-grow: 1; display: -webkit-box; -webkit-line-clamp: 2; line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }

.rec-card-meta { display: flex; align-items: center; gap: 1rem; border-top: 1px dashed #e5e7eb; padding-top: 0.75rem; color: #4b5563; font-size: 0.8rem; font-weight: 500;}
.rec-card-meta span { display: flex; align-items: center; gap: 0.35rem; }

@media (max-width: 768px) {
  .panel-padding { flex: 1; min-height: 0; }
  .recursos-grid { grid-template-columns: 1fr; gap: 0.75rem; }
  .btn-flow { width: 100%; font-size: 1rem; padding: 1rem; justify-content: center; }
}
</style>