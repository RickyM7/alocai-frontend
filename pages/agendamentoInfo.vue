<template>
  <div class="page-container">
    <div class="card">
      <div class="card-header">
        <h1 class="title">Informações Adicionais</h1>
      </div>

      <div class="card-content-grid">
        <div class="col-resumo">
          <h3>Resumo da Solicitação</h3>
          <div v-if="store.recursoSelecionado" class="resumo-item">
            <span class="label">Recurso:</span>
            <span class="value">{{ store.recursoSelecionado.nome_recurso }}</span>
          </div>
          <div class="resumo-item">
            <span class="label">Total de Datas:</span>
            <span class="value">{{ store.agendamentos.length }}</span>
          </div>
          <div v-if="store.agendamentos.length > 0" class="resumo-item">
            <span class="label">Período:</span>
            <span class="value">{{ resumoPeriodo }}</span>
          </div>
        </div>

        <div class="col-form">
          <form class="formulario">
            <div class="campo">
              <label for="finalidade">Finalidade do Agendamento</label>
              <input
                type="text"
                id="finalidade"
                v-model="finalidade"
                placeholder="Ex: Aula da disciplina de Programação I"
              />
            </div>

            <div class="campo">
              <label for="participantes">Número de Participantes (Máx: {{ maxParticipantes || 'N/A' }})</label>
              <input
                type="number"
                id="participantes"
                v-model="participantes"
                placeholder="Ex: 25"
                min="1"
                :max="maxParticipantes"
              />
            </div>

            <div class="campo">
              <label for="observacoes">Observações (Opcional)</label>
              <textarea
                id="observacoes"
                v-model="observacoes"
                placeholder="Ex: Necessário instalação do software X, projetor, etc."
              ></textarea>
            </div>
          </form>
        </div>
      </div>

      <div class="card-footer">
        <button type="button" class="botao-prosseguir" @click="irParaConclusao">Concluir Agendamento</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAgendamentoStore } from '~/stores/agendamento'

const finalidade = ref("");
const participantes = ref("");
const observacoes = ref("");

const router = useRouter();
const store = useAgendamentoStore();

const maxParticipantes = computed(() => store.recursoSelecionado?.capacidade);

const resumoPeriodo = computed(() => {
  if (store.agendamentos.length === 0) return '';
  const primeiraData = new Date(store.agendamentos[0].data);
  const ultimaData = new Date(store.agendamentos[store.agendamentos.length - 1].data);
  const formatar = (d) => d.toLocaleDateString('pt-BR');
  
  if (store.agendamentos.length === 1) return formatar(primeiraData);
  return `${formatar(primeiraData)} até ${formatar(ultimaData)}`;
});

function irParaConclusao() {
  if (!finalidade.value.trim()) {
    alert('Por favor, informe a finalidade do agendamento.');
    return;
  }
  
  if (participantes.value && maxParticipantes.value && parseInt(participantes.value) > maxParticipantes.value) {
    alert(`O número de participantes (${participantes.value}) excede a capacidade do recurso (${maxParticipantes.value}).`);
    return;
  }
  
  store.setInfo({
    finalidade: finalidade.value,
    participantes: participantes.value,
    observacoes: observacoes.value
  });

  router.push('/agendamentoConclusao');
}
</script>

<style scoped>
.page-container { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; }
.card { width: 100%; max-width: 900px; background-color: white; border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.1); }
.card-header { padding: 1.5rem 2rem; border-bottom: 1px solid #e5e7eb; }
.title { font-size: 1.75rem; font-weight: 700; margin: 0; }
.card-content-grid { display: grid; grid-template-columns: 300px 1fr; gap: 2rem; padding: 2rem; }
.col-resumo { background-color: #f9fafb; padding: 1.5rem; border-radius: 8px; }
.col-resumo h3 { margin-top: 0; border-bottom: 1px solid #e5e7eb; padding-bottom: 0.5rem; }
.resumo-item { margin-bottom: 1rem; }
.resumo-item .label { display: block; font-size: 0.9rem; color: #6b7280; }
.resumo-item .value { font-weight: 500; }
.formulario { display: flex; flex-direction: column; gap: 1.5rem; }
.campo label { font-weight: 500; margin-bottom: 0.5rem; display: block; }
.campo input, .campo textarea { width: 100%; padding: 0.75rem; border: 1px solid #d1d5db; border-radius: 6px; box-sizing: border-box; }
.campo textarea { min-height: 100px; resize: vertical; }
.card-footer { padding: 1rem 2rem; border-top: 1px solid #e5e7eb; text-align: right; }
.botao-prosseguir { background-color: #374151; color: white; padding: 0.75rem 2rem; border-radius: 0.5rem; border: none; cursor: pointer; }
</style>