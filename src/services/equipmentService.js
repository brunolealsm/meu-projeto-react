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
 * @param {Array} filtrosMarcas - Array de marcas selecionadas para filtro
 * @param {Array} filtrosSubgrupos - Array de subgrupos selecionados para filtro
 */
export const getEquipamentosAguardandoEntrada = async (filtrosMarcas = [], filtrosSubgrupos = []) => {
  try {
    // Construir query string com filtros
    const params = new URLSearchParams();
    
    if (filtrosMarcas.length > 0) {
      params.append('marcas', filtrosMarcas.join(','));
    }
    
    if (filtrosSubgrupos.length > 0) {
      params.append('subgrupos', filtrosSubgrupos.join(','));
    }
    
    const queryString = params.toString();
    const url = queryString ? `/equipment/aguardando-entrada?${queryString}` : '/equipment/aguardando-entrada';
    
    const response = await fetchApi(url);
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
 * @param {Array} filtrosMarcas - Array de marcas selecionadas para filtro
 * @param {Array} filtrosSubgrupos - Array de subgrupos selecionados para filtro
 */
export const getEquipamentosAguardandoRevisao = async (filtrosMarcas = [], filtrosSubgrupos = []) => {
  try {
    // Construir query string com filtros
    const params = new URLSearchParams();
    
    if (filtrosMarcas.length > 0) {
      params.append('marcas', filtrosMarcas.join(','));
    }
    
    if (filtrosSubgrupos.length > 0) {
      params.append('subgrupos', filtrosSubgrupos.join(','));
    }
    
    const queryString = params.toString();
    const url = queryString ? `/equipment/aguardando-revisao?${queryString}` : '/equipment/aguardando-revisao';
    
    const response = await fetchApi(url);
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
 * Direcionar ordens de serviço para técnico
 */
export const direcionarOrdensServico = async (ordensServico, codigoTecnico) => {
  try {
    console.log('🚀 Enviando requisição para direcionar ordens:', { ordensServico, codigoTecnico });
    
    const response = await fetch('http://localhost:3001/api/equipment/direcionar-ordens-servico', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        ordensServico,
        codigoTecnico
      })
    });

    console.log('📡 Resposta recebida:', response.status, response.statusText);

    if (!response.ok) {
      // Se a resposta não for OK, tentar ler como texto primeiro para debug
      const errorText = await response.text();
      console.error('❌ Erro na resposta (texto):', errorText);
      
      // Tentar fazer parse do JSON se possível
      try {
        const errorData = JSON.parse(errorText);
        throw new Error(errorData.message || 'Erro ao direcionar ordens de serviço');
      } catch (parseError) {
        throw new Error(`Erro no servidor (${response.status}): ${errorText || response.statusText}`);
      }
    }

    const result = await response.json();
    console.log('✅ Resultado do direcionamento:', result);
    return result;
  } catch (error) {
    console.error('❌ Erro ao direcionar ordens de serviço:', error);
    throw error;
  }
};

/**
 * Buscar equipamentos em serviço agrupados por técnico
 */
export const getEquipamentosEmServico = async () => {
  try {
    const response = await fetch('http://localhost:3001/api/equipment/equipamentos-em-servico');
    
    if (!response.ok) {
      throw new Error('Erro ao buscar equipamentos em serviço');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Erro ao buscar equipamentos em serviço:', error);
    throw error;
  }
};

/**
 * Buscar pedidos pendentes (posição de peças)
 */
export const getPedidosPendentes = async () => {
  try {
    const response = await fetchApi('/equipment/pedidos-pendentes');
    return response.data || [];
  } catch (error) {
    console.error('Erro ao buscar pedidos pendentes:', error);
    throw error;
  }
};

/**
 * Buscar detalhes de um pedido específico
 * @param {string} codigo - Código do pedido
 */
export const getDetalhesPedido = async (codigo) => {
  try {
    const encodedCodigo = encodeURIComponent(codigo);
    const response = await fetchApi(`/equipment/pedidos-pendentes/${encodedCodigo}`);
    return response.data || [];
  } catch (error) {
    console.error(`Erro ao buscar detalhes do pedido ${codigo}:`, error);
    throw error;
  }
};

/**
 * Buscar pedidos liberados (posição de peças)
 */
export const getPedidosLiberados = async () => {
  try {
    const response = await fetchApi('/equipment/pedidos-liberados');
    return response.data || [];
  } catch (error) {
    console.error('Erro ao buscar pedidos liberados:', error);
    throw error;
  }
};

/**
 * Buscar detalhes de um pedido liberado específico
 * @param {string} codigo - Código do pedido liberado
 */
export const getDetalhesPedidoLiberado = async (codigo) => {
  try {
    const encodedCodigo = encodeURIComponent(codigo);
    const response = await fetchApi(`/equipment/pedidos-liberados/${encodedCodigo}`);
    return response.data || [];
  } catch (error) {
    console.error(`Erro ao buscar detalhes do pedido liberado ${codigo}:`, error);
    throw error;
  }
};

/**
 * Buscar dados de fechamento de OS agrupados por técnico
 */
export const getFechamentoOS = async () => {
  try {
    const response = await fetchApi('/equipment/fechamento-os');
    return response.data || [];
  } catch (error) {
    console.error('Erro ao buscar fechamentos de OS:', error);
    throw error;
  }
};

/**
 * Buscar detalhes de um fechamento de OS específico
 * @param {string} codigo - Código da OS de fechamento
 */
export const getDetalhesFechamentoOS = async (codigo) => {
  try {
    const encodedCodigo = encodeURIComponent(codigo);
    const response = await fetchApi(`/equipment/fechamento-os/${encodedCodigo}`);
    return response.data || null;
  } catch (error) {
    console.error(`Erro ao buscar detalhes do fechamento de OS ${codigo}:`, error);
    throw error;
  }
};

/**
 * Confirmar recebimento de pedido liberado
 * @param {string} codigo - Código do pedido liberado
 */
export const confirmarRecebimentoPedido = async (codigo) => {
  try {
    const encodedCodigo = encodeURIComponent(codigo);
    const response = await fetch(`http://localhost:3001/api/equipment/pedidos-liberados/${encodedCodigo}/confirmar-recebimento`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Erro ao confirmar recebimento do pedido');
    }

    return await response.json();
  } catch (error) {
    console.error(`Erro ao confirmar recebimento do pedido ${codigo}:`, error);
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
  direcionarOrdensServico,
  getEquipamentosEmServico,
  getPedidosPendentes,
  getDetalhesPedido,
  getPedidosLiberados,
  getDetalhesPedidoLiberado,
  getFechamentoOS,
  getDetalhesFechamentoOS,
  confirmarRecebimentoPedido
}; 