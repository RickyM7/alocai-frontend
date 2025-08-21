import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useAgendamentoStore = defineStore('agendamento', () => {
  const tipoAgendamento = ref('')
  const datasSelecionadas = ref([])
  const horariosSelecionados = ref({})
  const diaDaSemana = ref('')
  const horarioPeriodo = ref('')
  const dataInicio = ref('')
  const dataFim = ref('')
  const finalidade = ref('')
  const participantes = ref('')
  const observacoes = ref('')

  function setAgendamento(dados) {
    tipoAgendamento.value = dados.tipo || ''
    datasSelecionadas.value = dados.datas || []
    horariosSelecionados.value = dados.horarios || {}
    diaDaSemana.value = dados.diaSemana || ''
    horarioPeriodo.value = dados.horarioPeriodo || ''
    dataInicio.value = dados.inicio || ''
    dataFim.value = dados.fim || ''
  }

  function setInfo(dados) {
    finalidade.value = dados.finalidade || ''
    participantes.value = dados.participantes || ''
    observacoes.value = dados.observacoes || ''
  }

  return {
    tipoAgendamento,
    datasSelecionadas,
    horariosSelecionados,
    diaDaSemana,
    horarioPeriodo,
    dataInicio,
    dataFim,
    finalidade,
    participantes,
    observacoes,
    setAgendamento,
    setInfo
  }
})
