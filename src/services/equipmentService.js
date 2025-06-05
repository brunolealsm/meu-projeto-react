import { executeQuery, executeStoredProcedure, testConnection } from '../config/database.js';

// Serviços para gerenciar equipamentos no banco de dados

/**
 * Buscar todos os equipamentos aguardando entrada
 */
export const getEquipamentosAguardandoEntrada = async () => {
  try {
    const query = `
      SELECT 
        modelo,
        COUNT(*) as quantidade
      FROM equipamentos 
      WHERE status = 'AGUARDANDO_ENTRADA'
      GROUP BY modelo
      ORDER BY COUNT(*) DESC
    `;
    
    const result = await executeQuery(query);
    return result.recordset;
  } catch (error) {
    console.error('Erro ao buscar equipamentos aguardando entrada:', error);
    throw error;
  }
};

/**
 * Buscar equipamentos em revisão
 */
export const getEquipamentosEmRevisao = async () => {
  try {
    const query = `
      SELECT 
        codigo,
        modelo,
        descricao_problema,
        data_entrada,
        prioridade
      FROM equipamentos 
      WHERE status = 'EM_REVISAO'
      ORDER BY 
        CASE prioridade 
          WHEN 'URGENTE' THEN 1 
          WHEN 'NORMAL' THEN 2 
          WHEN 'BAIXA' THEN 3 
        END,
        data_entrada ASC
    `;
    
    const result = await executeQuery(query);
    return result.recordset;
  } catch (error) {
    console.error('Erro ao buscar equipamentos em revisão:', error);
    throw error;
  }
};

/**
 * Buscar equipamentos aguardando peças
 */
export const getEquipamentosAguardandoPecas = async () => {
  try {
    const query = `
      SELECT 
        e.codigo,
        e.modelo,
        e.descricao_problema,
        e.data_entrada,
        p.nome_peca,
        p.status_peca,
        p.data_previsao_chegada
      FROM equipamentos e
      INNER JOIN pecas_solicitadas p ON e.id = p.equipamento_id
      WHERE e.status = 'AGUARDANDO_PECAS'
      ORDER BY e.data_entrada ASC
    `;
    
    const result = await executeQuery(query);
    return result.recordset;
  } catch (error) {
    console.error('Erro ao buscar equipamentos aguardando peças:', error);
    throw error;
  }
};

/**
 * Buscar equipamentos prontos para fechamento
 */
export const getEquipamentosProntosFechamento = async () => {
  try {
    const query = `
      SELECT 
        codigo,
        modelo,
        descricao_servico,
        data_conclusao,
        tecnico_responsavel
      FROM equipamentos 
      WHERE status = 'PRONTO_FECHAMENTO'
      ORDER BY data_conclusao DESC
    `;
    
    const result = await executeQuery(query);
    return result.recordset;
  } catch (error) {
    console.error('Erro ao buscar equipamentos prontos para fechamento:', error);
    throw error;
  }
};

/**
 * Adicionar novo equipamento
 */
export const adicionarEquipamento = async (equipamento) => {
  try {
    const query = `
      INSERT INTO equipamentos (codigo, modelo, descricao_problema, status, prioridade, data_entrada)
      VALUES (@codigo, @modelo, @descricao, @status, @prioridade, GETDATE())
    `;
    
    const params = {
      codigo: equipamento.codigo,
      modelo: equipamento.modelo,
      descricao: equipamento.descricao_problema,
      status: equipamento.status || 'AGUARDANDO_ENTRADA',
      prioridade: equipamento.prioridade || 'NORMAL'
    };
    
    const result = await executeQuery(query, params);
    return result;
  } catch (error) {
    console.error('Erro ao adicionar equipamento:', error);
    throw error;
  }
};

/**
 * Atualizar status do equipamento
 */
export const atualizarStatusEquipamento = async (codigo, novoStatus) => {
  try {
    const query = `
      UPDATE equipamentos 
      SET status = @status, data_atualizacao = GETDATE()
      WHERE codigo = @codigo
    `;
    
    const params = {
      codigo: codigo,
      status: novoStatus
    };
    
    const result = await executeQuery(query, params);
    return result;
  } catch (error) {
    console.error('Erro ao atualizar status do equipamento:', error);
    throw error;
  }
};

/**
 * Buscar estatísticas gerais
 */
export const getEstatisticasGerais = async () => {
  try {
    const query = `
      SELECT 
        COUNT(CASE WHEN status = 'EM_MANUTENCAO' THEN 1 END) as em_manutencao,
        COUNT(CASE WHEN status = 'PRONTO' THEN 1 END) as prontos,
        COUNT(CASE WHEN status = 'AGUARDANDO_ENTRADA' THEN 1 END) as aguardando,
        COUNT(DISTINCT tecnico_responsavel) as tecnicos_ativos
      FROM equipamentos
      WHERE data_entrada >= DATEADD(month, -1, GETDATE())
    `;
    
    const result = await executeQuery(query);
    return result.recordset[0];
  } catch (error) {
    console.error('Erro ao buscar estatísticas gerais:', error);
    throw error;
  }
};

/**
 * Testar conexão com o banco
 */
export const testarConexaoBanco = async () => {
  try {
    const conexaoOk = await testConnection();
    return conexaoOk;
  } catch (error) {
    console.error('Erro no teste de conexão:', error);
    return false;
  }
};

export default {
  getEquipamentosAguardandoEntrada,
  getEquipamentosEmRevisao,
  getEquipamentosAguardandoPecas,
  getEquipamentosProntosFechamento,
  adicionarEquipamento,
  atualizarStatusEquipamento,
  getEstatisticasGerais,
  testarConexaoBanco
}; 