// Configuração da API
const API_BASE_URL = 'http://localhost:3001/api';

// Função auxiliar para fazer requisições HTTP
const fetchApi = async (endpoint, options = {}) => {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`Erro na API ${endpoint}:`, error);
    throw error;
  }
};

// Serviços para gerenciar equipamentos via API REST

/**
 * Buscar todos os equipamentos aguardando entrada
 * Consome a API REST do backend que executa a query SQL
 */
export const getEquipamentosAguardandoEntrada = async () => {
  try {
    const response = await fetchApi('/equipment/aguardando-entrada');
    return response.data || [];
  } catch (error) {
    console.error('Erro ao buscar equipamentos aguardando entrada:', error);
    throw error;
  }
};

/**
 * Buscar dados detalhados dos equipamentos aguardando entrada
 * Consome a API REST do backend
 */
export const getDadosDetalhadosAguardandoEntrada = async () => {
  try {
    const response = await fetchApi('/equipment/aguardando-entrada/detalhes');
    return response.data || [];
  } catch (error) {
    console.error('Erro ao buscar dados detalhados aguardando entrada:', error);
    throw error;
  }
};

// Outras funções serão implementadas conforme necessário
// Por enquanto, mantemos apenas as funções essenciais para evitar erros

/**
 * Buscar detalhes de um equipamento específico
 * @param {string} nomeEquipamento - Nome do equipamento para filtrar
 */
export const getDetalhesEquipamento = async (nomeEquipamento) => {
  try {
    const encodedName = encodeURIComponent(nomeEquipamento);
    const response = await fetchApi(`/equipment/aguardando-entrada/detalhes/${encodedName}`);
    return response.data || [];
  } catch (error) {
    console.error('Erro ao buscar detalhes do equipamento:', error);
    throw error;
  }
};

/**
 * Testar conexão com o banco via API
 */
export const testarConexaoBanco = async () => {
  try {
    const response = await fetchApi('/equipment/test-connection');
    return response.connected || false;
  } catch (error) {
    console.error('Erro no teste de conexão:', error);
    return false;
  }
};

/**
 * Buscar todos os equipamentos aguardando revisão
 * Consome a API REST do backend que executa a query SQL
 */
export const getEquipamentosAguardandoRevisao = async () => {
  try {
    const response = await fetchApi('/equipment/aguardando-revisao');
    return response.data || [];
  } catch (error) {
    console.error('Erro ao buscar equipamentos aguardando revisão:', error);
    throw error;
  }
};

/**
 * Buscar dados detalhados dos equipamentos aguardando revisão
 * Consome a API REST do backend
 */
export const getDadosDetalhadosAguardandoRevisao = async () => {
  try {
    const response = await fetchApi('/equipment/aguardando-revisao/detalhes');
    return response.data || [];
  } catch (error) {
    console.error('Erro ao buscar dados detalhados aguardando revisão:', error);
    throw error;
  }
};

/**
 * Buscar detalhes de um equipamento específico aguardando revisão
 * @param {string} nomeEquipamento - Nome do equipamento para filtrar
 */
export const getDetalhesEquipamentoRevisao = async (nomeEquipamento) => {
  try {
    const encodedName = encodeURIComponent(nomeEquipamento);
    const response = await fetchApi(`/equipment/aguardando-revisao/detalhes/${encodedName}`);
    return response.data || [];
  } catch (error) {
    console.error('Erro ao buscar detalhes do equipamento em revisão:', error);
    throw error;
  }
};

/**
 * Buscar histórico de ordens de serviço por série
 * @param {string} serie - Número de série do equipamento
 */
export const getHistoricoOrdemServico = async (serie) => {
  try {
    const encodedSerie = encodeURIComponent(serie);
    const response = await fetchApi(`/equipment/historico-os/${encodedSerie}`);
    return response.data || { historico: [] };
  } catch (error) {
    console.error('Erro ao buscar histórico de OS:', error);
    throw error;
  }
};

/**
 * Buscar técnicos de oficina
 */
export const getTecnicosOficina = async () => {
  try {
    const response = await fetchApi('/equipment/tecnicos-oficina');
    return response.data || [];
  } catch (error) {
    console.error('Erro ao buscar técnicos de oficina:', error);
    throw error;
  }
};

/**
 * Direcionar ordens de serviço para um técnico
 * @param {Array} ordensServico - Array com os números das ordens de serviço
 * @param {string} codigoTecnico - Código do técnico selecionado
 */
export const direcionarOrdensServico = async (ordensServico, codigoTecnico) => {
  try {
    const response = await fetchApi('/equipment/direcionar-ordens-servico', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ordensServico,
        codigoTecnico
      })
    });
    return response.data || response;
  } catch (error) {
    console.error('Erro ao direcionar ordens de serviço:', error);
    throw error;
  }
};

export default {
  getEquipamentosAguardandoEntrada,
  getDadosDetalhadosAguardandoEntrada,
  getEquipamentosAguardandoRevisao,
  getDadosDetalhadosAguardandoRevisao,
  getDetalhesEquipamento,
  getDetalhesEquipamentoRevisao,
  testarConexaoBanco,
  getHistoricoOrdemServico,
  getTecnicosOficina,
  direcionarOrdensServico
}; 