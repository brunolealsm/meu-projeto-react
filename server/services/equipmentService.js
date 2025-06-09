import { executeQuery, testConnection, getConnection } from '../config/database.js';
import * as sql from 'mssql';

// Serviços para gerenciar equipamentos no banco de dados

/**
 * Buscar todos os equipamentos aguardando entrada
 * Baseado na query fornecida com filtro EntradaFin = 0
 */
export const getEquipamentosAguardandoEntrada = async () => {
  try {
    const query = `
      WITH DadosCompletos AS (
        SELECT [WP_OFICINA_RECEB1].id, dtcad, ntfisc,
               TB01008_NOME + ' ' + ISNULL(TB02111_NOME, '') Cliente,
               motoajud, TB01077_NOME,
               motivoret, dtreceb,
               codprod, TB01010_NOME, serie,
               CASE WHEN caboret = 1 THEN 'Sim' ELSE 'Não' END Cabo,
               users.[name] Conferente,
               CASE WHEN entradapend = 1 THEN 'Sim' ELSE 'Não' END EntradaPendente,
               pedido,
               CASE WHEN EXISTS (SELECT *
                                   FROM TB02002
                                  WHERE TB02002_CODPRE = [WP_OFICINA_RECEB1].pedido
                                    AND TB02002_CODEMP = [WP_OFICINA_RECEB1].codemp)
                                THEN 1
                                ELSE 0 END EntradaFin
          FROM [WP_OFICINA_RECEB1]
        LEFT JOIN TB01010 ON TB01010_CODIGO = REPLICATE('0',5-LEN(RTRIM(LTRIM(codprod))))+RTRIM(LTRIM(codprod))
        LEFT JOIN TB02030 ON TB02030_NTFISC = ntfisc AND TB02030_CODEMP = codemp
        LEFT JOIN TB02111 ON TB02111_CODIGO = TB02030_CONTRATO AND TB02111_CODEMP = TB02030_CODEMP
        LEFT JOIN TB01008 ON TB01008_CODIGO = TB02111_CODCLI
        LEFT JOIN TB01077 ON TB01077_CODIGO = motoajud
        LEFT JOIN users ON users.id = conferente
      )
      SELECT 
        TB01010_NOME as equipamento,
        COUNT(serie) as quantidade
      FROM DadosCompletos
      WHERE EntradaFin = 0
        AND TB01010_NOME IS NOT NULL
      GROUP BY TB01010_NOME
      ORDER BY COUNT(serie) DESC
    `;
    
    const result = await executeQuery(query);
    return result.recordset;
  } catch (error) {
    console.error('Erro ao buscar equipamentos aguardando entrada:', error);
    throw error;
  }
};

/**
 * Buscar dados detalhados dos equipamentos aguardando entrada
 * Retorna todos os campos da query original filtrados por EntradaFin = 0
 */
export const getDadosDetalhadosAguardandoEntrada = async () => {
  try {
    const query = `
      SELECT [WP_OFICINA_RECEB1].id, dtcad, ntfisc,
             TB01008_NOME + ' ' + ISNULL(TB02111_NOME, '') Cliente,
             motoajud, TB01077_NOME,
             motivoret, dtreceb,
             codprod, TB01010_NOME, serie,
             CASE WHEN caboret = 1 THEN 'Sim' ELSE 'Não' END Cabo,
             users.[name] Conferente,
             CASE WHEN entradapend = 1 THEN 'Sim' ELSE 'Não' END EntradaPendente,
             pedido,
             CASE WHEN EXISTS (SELECT *
                                 FROM TB02002
                                WHERE TB02002_CODPRE = [WP_OFICINA_RECEB1].pedido
                                  AND TB02002_CODEMP = [WP_OFICINA_RECEB1].codemp)
                               THEN 1
                               ELSE 0 END EntradaFin
        FROM [WP_OFICINA_RECEB1]
      LEFT JOIN TB01010 ON TB01010_CODIGO = REPLICATE('0',5-LEN(RTRIM(LTRIM(codprod))))+RTRIM(LTRIM(codprod))
      LEFT JOIN TB02030 ON TB02030_NTFISC = ntfisc AND TB02030_CODEMP = codemp
      LEFT JOIN TB02111 ON TB02111_CODIGO = TB02030_CONTRATO AND TB02111_CODEMP = TB02030_CODEMP
      LEFT JOIN TB01008 ON TB01008_CODIGO = TB02111_CODCLI
      LEFT JOIN TB01077 ON TB01077_CODIGO = motoajud
      LEFT JOIN users ON users.id = conferente
      WHERE CASE WHEN EXISTS (SELECT *
                                FROM TB02002
                               WHERE TB02002_CODPRE = [WP_OFICINA_RECEB1].pedido
                                 AND TB02002_CODEMP = [WP_OFICINA_RECEB1].codemp)
                             THEN 1
                             ELSE 0 END = 0
      ORDER BY TB01010_NOME, dtcad DESC
    `;
    
    const result = await executeQuery(query);
    return result.recordset;
  } catch (error) {
    console.error('Erro ao buscar dados detalhados aguardando entrada:', error);
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

/**
 * Buscar todos os equipamentos aguardando revisão
 * Baseado na query fornecida com filtro EntradaFin = 1
 */
export const getEquipamentosAguardandoRevisao = async () => {
  try {
    const query = `
      WITH DadosCompletos AS (
        SELECT codprod, TB01010_NOME, serie,
               (SELECT TOP 1 TB02115_CODIGO FROM TB02115
                 WHERE TB02115_CODCLI = '00000000' 
                   AND TB02115_NUMSERIE = serie AND TB02115_PRODUTO = codprod
                   AND TB02115_DTFECHA IS NULL AND TB02115_STATUS = '9F') OS_REVISAO,
               (SELECT TOP 1 TB02115_DATA FROM TB02115
                 WHERE TB02115_CODCLI = '00000000' 
                   AND TB02115_NUMSERIE = serie AND TB02115_PRODUTO = codprod
                   AND TB02115_DTFECHA IS NULL AND TB02115_STATUS = '9F') OS_REVISAO_DATA,
               datediff(DD, (SELECT TOP 1 TB02115_DATA FROM TB02115
                               WHERE TB02115_CODCLI = '00000000' 
                                 AND TB02115_NUMSERIE = serie AND TB02115_PRODUTO = codprod
                                 AND TB02115_DTFECHA IS NULL AND TB02115_STATUS = '9F'), GETDATE()) OS_REVISAO_DIAS,
               (SELECT TOP 1 TB02122_CONTADOR FROM TB02122
                 WHERE TB02122_NUMSERIE = serie AND TB02122_PRODUTO = codprod
                 ORDER BY TB02122_DTFECHA DESC) ULT_CONTADOR_PB,
               (SELECT TOP 1 TB02122_CONTADORC FROM TB02122
                 WHERE TB02122_NUMSERIE = serie AND TB02122_PRODUTO = codprod
                 ORDER BY TB02122_DTFECHA DESC) ULT_CONTADOR_COR,
               (SELECT COUNT(TB02122_NUMOS) FROM TB02122
                 WHERE TB02122_NUMSERIE = serie AND TB02122_PRODUTO = codprod
                   AND TB02122_CONDICAO IN ('0018', '0039')) QTDE_OS_PECA,
               (SELECT COUNT(TB02122_NUMOS) FROM TB02122
                 WHERE TB02122_NUMSERIE = serie AND TB02122_PRODUTO = codprod
                   AND TB02122_CONDICAO = '0031') QTDE_OS_TROCA
          FROM [WP_OFICINA_RECEB1]
        LEFT JOIN TB01010 ON TB01010_CODIGO = REPLICATE('0',5-LEN(RTRIM(LTRIM(codprod))))+RTRIM(LTRIM(codprod))
        LEFT JOIN TB02030 ON TB02030_NTFISC = ntfisc AND TB02030_CODEMP = codemp
        LEFT JOIN TB02111 ON TB02111_CODIGO = TB02030_CONTRATO AND TB02111_CODEMP = TB02030_CODEMP
        LEFT JOIN TB01008 ON TB01008_CODIGO = TB02111_CODCLI
        LEFT JOIN TB01077 ON TB01077_CODIGO = motoajud
        LEFT JOIN users ON users.id = conferente
        WHERE CASE WHEN EXISTS (SELECT *
                                  FROM TB02002
                                 WHERE TB02002_CODPRE = [WP_OFICINA_RECEB1].pedido
                                   AND TB02002_CODEMP = [WP_OFICINA_RECEB1].codemp)
                               THEN 1
                               ELSE 0 END = 1
          AND EXISTS (SELECT TOP 1 TB02115_CODIGO FROM TB02115
                       WHERE TB02115_CODCLI = '00000000' 
                         AND TB02115_NUMSERIE = serie AND TB02115_PRODUTO = codprod
                         AND TB02115_DTFECHA IS NULL AND TB02115_STATUS = '9F')
      )
      SELECT 
        TB01010_NOME as equipamento,
        COUNT(serie) as quantidade
      FROM DadosCompletos
      WHERE TB01010_NOME IS NOT NULL
      GROUP BY TB01010_NOME
      ORDER BY COUNT(serie) DESC
    `;
    
    const result = await executeQuery(query);
    return result.recordset;
  } catch (error) {
    console.error('Erro ao buscar equipamentos aguardando revisão:', error);
    throw error;
  }
};

/**
 * Buscar dados detalhados dos equipamentos aguardando revisão
 * Retorna todos os campos da query original filtrados por EntradaFin = 1
 */
export const getDadosDetalhadosAguardandoRevisao = async () => {
  try {
    const query = `
      SELECT codprod, TB01010_NOME, serie, TB01047_NOME, TB01018_NOME,
             (SELECT TOP 1 TB02115_CODIGO FROM TB02115
               WHERE TB02115_CODCLI = '00000000' 
                 AND TB02115_NUMSERIE = serie AND TB02115_PRODUTO = codprod
                 AND TB02115_DTFECHA IS NULL AND TB02115_STATUS = '9F') OS_REVISAO,
             (SELECT TOP 1 TB02115_DATA FROM TB02115
               WHERE TB02115_CODCLI = '00000000' 
                 AND TB02115_NUMSERIE = serie AND TB02115_PRODUTO = codprod
                 AND TB02115_DTFECHA IS NULL AND TB02115_STATUS = '9F') OS_REVISAO_DATA,
             datediff(DD, (SELECT TOP 1 TB02115_DATA FROM TB02115
                             WHERE TB02115_CODCLI = '00000000' 
                               AND TB02115_NUMSERIE = serie AND TB02115_PRODUTO = codprod
                               AND TB02115_DTFECHA IS NULL AND TB02115_STATUS = '9F'), GETDATE()) OS_REVISAO_DIAS,
             (SELECT TOP 1 TB02122_CONTADOR FROM TB02122
               WHERE TB02122_NUMSERIE = serie AND TB02122_PRODUTO = codprod
               ORDER BY TB02122_DTFECHA DESC) ULT_CONTADOR_PB,
             (SELECT TOP 1 TB02122_CONTADORC FROM TB02122
               WHERE TB02122_NUMSERIE = serie AND TB02122_PRODUTO = codprod
               ORDER BY TB02122_DTFECHA DESC) ULT_CONTADOR_COR,
             (SELECT COUNT(TB02122_NUMOS) FROM TB02122
               WHERE TB02122_NUMSERIE = serie AND TB02122_PRODUTO = codprod
                 AND TB02122_CONDICAO IN ('0018', '0039')) QTDE_OS_PECA,
             (SELECT COUNT(TB02122_NUMOS) FROM TB02122
               WHERE TB02122_NUMSERIE = serie AND TB02122_PRODUTO = codprod
                 AND TB02122_CONDICAO = '0031') QTDE_OS_TROCA
        FROM [WP_OFICINA_RECEB1]
      LEFT JOIN TB01010 ON TB01010_CODIGO = REPLICATE('0',5-LEN(RTRIM(LTRIM(codprod))))+RTRIM(LTRIM(codprod))
      LEFT JOIN TB01047 ON TB01047_CODIGO = TB01010_MARCA
      LEFT JOIN TB01018 ON TB01018_CODIGO = TB01010_SUBGRUPO
      LEFT JOIN TB02030 ON TB02030_NTFISC = ntfisc AND TB02030_CODEMP = codemp
      LEFT JOIN TB02111 ON TB02111_CODIGO = TB02030_CONTRATO AND TB02111_CODEMP = TB02030_CODEMP
      LEFT JOIN TB01008 ON TB01008_CODIGO = TB02111_CODCLI
      LEFT JOIN TB01077 ON TB01077_CODIGO = motoajud
      LEFT JOIN users ON users.id = conferente
      WHERE CASE WHEN EXISTS (SELECT *
                                FROM TB02002
                               WHERE TB02002_CODPRE = [WP_OFICINA_RECEB1].pedido
                                 AND TB02002_CODEMP = [WP_OFICINA_RECEB1].codemp)
                             THEN 1
                             ELSE 0 END = 1
        AND EXISTS (SELECT TOP 1 TB02115_CODIGO FROM TB02115
                     WHERE TB02115_CODCLI = '00000000' 
                       AND TB02115_NUMSERIE = serie AND TB02115_PRODUTO = codprod
                       AND TB02115_DTFECHA IS NULL AND TB02115_STATUS = '9F')
      ORDER BY TB01010_NOME, OS_REVISAO_DATA DESC
    `;
    
    const result = await executeQuery(query);
    return result.recordset;
  } catch (error) {
    console.error('Erro ao buscar dados detalhados aguardando revisão:', error);
    throw error;
  }
};

/**
 * Buscar dados detalhados de um equipamento específico aguardando revisão
 * Filtra diretamente na consulta SQL pelo nome do equipamento
 */
export const getDetalhesEquipamentoAguardandoRevisao = async (nomeEquipamento) => {
  try {
    const query = `
      SELECT codprod, TB01010_NOME, serie, TB01047_NOME, TB01018_NOME,
             (SELECT TOP 1 TB02115_CODIGO FROM TB02115
               WHERE TB02115_CODCLI = '00000000' 
                 AND TB02115_NUMSERIE = serie AND TB02115_PRODUTO = codprod
                 AND TB02115_DTFECHA IS NULL AND TB02115_STATUS = '9F') OS_REVISAO,
             (SELECT TOP 1 TB02115_DATA FROM TB02115
               WHERE TB02115_CODCLI = '00000000' 
                 AND TB02115_NUMSERIE = serie AND TB02115_PRODUTO = codprod
                 AND TB02115_DTFECHA IS NULL AND TB02115_STATUS = '9F') OS_REVISAO_DATA,
             datediff(DD, (SELECT TOP 1 TB02115_DATA FROM TB02115
                             WHERE TB02115_CODCLI = '00000000' 
                               AND TB02115_NUMSERIE = serie AND TB02115_PRODUTO = codprod
                               AND TB02115_DTFECHA IS NULL AND TB02115_STATUS = '9F'), GETDATE()) OS_REVISAO_DIAS,
             (SELECT TOP 1 TB02122_CONTADOR FROM TB02122
               WHERE TB02122_NUMSERIE = serie AND TB02122_PRODUTO = codprod
               ORDER BY TB02122_DTFECHA DESC) ULT_CONTADOR_PB,
             (SELECT TOP 1 TB02122_CONTADORC FROM TB02122
               WHERE TB02122_NUMSERIE = serie AND TB02122_PRODUTO = codprod
               ORDER BY TB02122_DTFECHA DESC) ULT_CONTADOR_COR,
             (SELECT COUNT(TB02122_NUMOS) FROM TB02122
               WHERE TB02122_NUMSERIE = serie AND TB02122_PRODUTO = codprod
                 AND TB02122_CONDICAO IN ('0018', '0039')) QTDE_OS_PECA,
             (SELECT COUNT(TB02122_NUMOS) FROM TB02122
               WHERE TB02122_NUMSERIE = serie AND TB02122_PRODUTO = codprod
                 AND TB02122_CONDICAO = '0031') QTDE_OS_TROCA
        FROM [WP_OFICINA_RECEB1]
      LEFT JOIN TB01010 ON TB01010_CODIGO = REPLICATE('0',5-LEN(RTRIM(LTRIM(codprod))))+RTRIM(LTRIM(codprod))
      LEFT JOIN TB01047 ON TB01047_CODIGO = TB01010_MARCA
      LEFT JOIN TB01018 ON TB01018_CODIGO = TB01010_SUBGRUPO
      LEFT JOIN TB02030 ON TB02030_NTFISC = ntfisc AND TB02030_CODEMP = codemp
      LEFT JOIN TB02111 ON TB02111_CODIGO = TB02030_CONTRATO AND TB02111_CODEMP = TB02030_CODEMP
      LEFT JOIN TB01008 ON TB01008_CODIGO = TB02111_CODCLI
      LEFT JOIN TB01077 ON TB01077_CODIGO = motoajud
      LEFT JOIN users ON users.id = conferente
      WHERE CASE WHEN EXISTS (SELECT *
                                FROM TB02002
                               WHERE TB02002_CODPRE = [WP_OFICINA_RECEB1].pedido
                                 AND TB02002_CODEMP = [WP_OFICINA_RECEB1].codemp)
                             THEN 1
                             ELSE 0 END = 1
        AND EXISTS (SELECT TOP 1 TB02115_CODIGO FROM TB02115
                     WHERE TB02115_CODCLI = '00000000' 
                       AND TB02115_NUMSERIE = serie AND TB02115_PRODUTO = codprod
                       AND TB02115_DTFECHA IS NULL AND TB02115_STATUS = '9F')
        AND TB01010_NOME = '${nomeEquipamento}'
      ORDER BY OS_REVISAO_DATA DESC
    `;
    
    const result = await executeQuery(query);
    return result.recordset;
  } catch (error) {
    console.error('Erro ao buscar detalhes do equipamento específico aguardando revisão:', error);
    throw error;
  }
};

export async function getHistoricoOrdemServico(serie) {
  try {
    console.log('🔍 Executando query de histórico para série:', serie);
    
    // Query para buscar dados do header (TOP 1 com data mais recente)
    const queryHeader = `
      SELECT TOP 1 TB02115_NUMSERIE, TB02115_PRODUTO, TB02122_DTFECHA, TB02115_CODIGO, TB01024_NOME
      FROM TB02115
      LEFT JOIN TB02122 ON TB02122_NUMOS = TB02115_CODIGO AND TB02122_NUMSERIE = TB02115_NUMSERIE
      LEFT JOIN TB01024 ON TB01024_CODIGO = TB02122_CODTEC
      WHERE TB02115_DTFECHA IS NOT NULL AND TB02115_STATUS = '21'
        AND EXISTS (SELECT * FROM [WP_OFICINA_RECEB1] WHERE codprod = TB02115_PRODUTO AND serie = TB02115_NUMSERIE)
        AND TB02115_NUMSERIE = '${serie}'
        AND TB02122_DTFECHA IS NOT NULL
      ORDER BY TB02122_DTFECHA DESC
    `;
    
    // Query para buscar histórico completo
    const queryHistorico = `
      SELECT TB02115_CODIGO, TB02115_DATA, TB02115_NOME, TB02122_DTFECHA, TB01024_NOME, TB02122_OBS,
             TB02115_NUMSERIE, TB02115_PRODUTO, TB02122_CONTADOR, TB02122_CONTADORC, TB02122_CONDICAO +'-'+ TB01055_NOME AS TB01055_NOME
      FROM TB02115
      LEFT JOIN TB02122 ON TB02122_NUMOS = TB02115_CODIGO AND TB02122_NUMSERIE = TB02115_NUMSERIE
      LEFT JOIN TB01024 ON TB01024_CODIGO = TB02122_CODTEC
      LEFT JOIN TB01055 ON TB01055_CODIGO = TB02122_CONDICAO
      WHERE TB02115_DTFECHA IS NOT NULL AND TB02115_STATUS = '21'
        AND EXISTS (SELECT * FROM [WP_OFICINA_RECEB1] WHERE codprod = TB02115_PRODUTO AND serie = TB02115_NUMSERIE)
        AND TB02115_NUMSERIE = '${serie}'
      ORDER BY TB02122_DTFECHA DESC, TB02115_CODIGO DESC
    `;
    
    const [resultHeader, resultHistorico] = await Promise.all([
      executeQuery(queryHeader),
      executeQuery(queryHistorico)
    ]);
    
    if (resultHistorico.recordset.length === 0) {
      return {
        equipamento: null,
        ultimoAtendimento: null,
        ultimaOS: null,
        ultimoTecnico: null,
        historico: []
      };
    }
    
    // Dados do equipamento do primeiro registro do histórico
    const primeiroRegistroHistorico = resultHistorico.recordset[0];
    
    // Dados do header (registro com data mais recente)
    const dadosHeader = resultHeader.recordset.length > 0 ? resultHeader.recordset[0] : null;
    
    return {
      equipamento: {
        serie: primeiroRegistroHistorico.TB02115_NUMSERIE,
        produto: primeiroRegistroHistorico.TB02115_PRODUTO
      },
      ultimoAtendimento: dadosHeader?.TB02122_DTFECHA || null,
      ultimaOS: dadosHeader?.TB02115_CODIGO || '',
      ultimoTecnico: dadosHeader?.TB01024_NOME || '',
      historico: resultHistorico.recordset.map(row => ({
        os: row.TB02115_CODIGO,
        data: row.TB02115_DATA,
        motivo: row.TB02115_NOME,
        tecnico: row.TB01024_NOME || '',
        fechamento: row.TB02122_DTFECHA,
        condicao: row.TB01055_NOME || '',
        contadorPB: row.TB02122_CONTADOR || 0,
        contadorCor: row.TB02122_CONTADORC || 0,
        laudo: row.TB02122_OBS || ''
      }))
    };
  } catch (error) {
    console.error('Erro ao buscar histórico de ordens de serviço:', error);
    throw error;
  }
}

export default {
  getEquipamentosAguardandoEntrada,
  getDadosDetalhadosAguardandoEntrada,
  getEquipamentosAguardandoRevisao,
  getDadosDetalhadosAguardandoRevisao,
  getDetalhesEquipamentoAguardandoRevisao,
  testarConexaoBanco,
  getHistoricoOrdemServico,
  getTecnicosOficina,
  direcionarOrdensServico
};

/**
 * Buscar técnicos de oficina
 */
export async function getTecnicosOficina() {
  try {
    const query = `
      SELECT id, [name], cotec 
      FROM users 
      WHERE type = 'ASSISTENCIA TECNICA' 
        AND email LIKE '%oficina%' 
      ORDER BY [name] asc
    `;
    
    const result = await executeQuery(query);
    return result.recordset;
  } catch (error) {
    console.error('Erro ao buscar técnicos de oficina:', error);
    throw error;
  }
}

/**
 * Direcionar ordens de serviço para técnico
 */
export async function direcionarOrdensServico(ordensServico, codigoTecnico) {
  try {
    console.log('🔄 Iniciando direcionamento de ordens de serviço:', { ordensServico, codigoTecnico });
    
    // Validação básica de entrada
    if (!ordensServico || !Array.isArray(ordensServico) || ordensServico.length === 0) {
      throw new Error('Array de ordens de serviço é inválido ou vazio');
    }
    
    if (!codigoTecnico) {
      throw new Error('Código do técnico não foi fornecido');
    }
    
    const resultados = [];
    
    // Processar cada ordem de serviço individualmente (sem transação por enquanto para debug)
    for (const ordemServico of ordensServico) {
      try {
        console.log(`🔍 Processando ordem de serviço: ${ordemServico}`);
        
        // Comando 1: Encontrar código do cliente e código da empresa
        const queryBuscarDados = `
          SELECT TB02115_CODCLI, TB02115_CODEMP 
          FROM TB02115 
          WHERE TB02115_CODIGO = '${ordemServico}'
        `;
        
        const resultBuscar = await executeQuery(queryBuscarDados);
        
        if (resultBuscar.recordset.length === 0) {
          throw new Error(`Ordem de serviço ${ordemServico} não encontrada`);
        }
        
        const { TB02115_CODCLI: codcli, TB02115_CODEMP: codemp } = resultBuscar.recordset[0];
        console.log(`📋 Dados encontrados para OS ${ordemServico}:`, { codcli, codemp });
        
        // Comando 2: Atualizar o status e técnico da ordem de serviço
        const queryUpdate = `
          UPDATE TB02115 
          SET TB02115_STATUS = '9G', TB02115_CODTEC = '${codigoTecnico}' 
          WHERE TB02115_CODIGO = '${ordemServico}'
        `;
        
        const updateResult = await executeQuery(queryUpdate);
        console.log(`✅ OS ${ordemServico} atualizada. Linhas afetadas:`, updateResult.rowsAffected);
        
        // Comando 3: Inserir histórico da ordem de serviço
        const queryHistorico = `
          INSERT INTO TB02130 (TB02130_CODIGO, TB02130_DATA, TB02130_USER, TB02130_STATUS, TB02130_NOME,
                               TB02130_OBS, TB02130_CODTEC, TB02130_PREVISAO, TB02130_NOMETEC, TB02130_TIPO,
                               TB02130_CODCAD, TB02130_CODEMP, TB02130_DATAEXEC, TB02130_HORASCOM, TB02130_HORASFIM)
          VALUES ('${ordemServico}', GETDATE(), 'S.INTERNO', '9G', 
                  (SELECT TB01073_NOME FROM TB01073 WHERE TB01073_CODIGO = '9G'), 
                  'Status modificado automaticamente pelo direcionamento das ordens de serviço no sistema interno.', 
                  '${codigoTecnico}', NULL, NULL, 'O', '${codcli}', '${codemp}', GETDATE(), '00:00', '00:00')
        `;
        
        const historicoResult = await executeQuery(queryHistorico);
        console.log(`📝 Histórico inserido para OS ${ordemServico}. Linhas inseridas:`, historicoResult.rowsAffected);
        
        resultados.push({
          ordemServico,
          status: 'sucesso',
          mensagem: 'Ordem de serviço direcionada com sucesso'
        });
        
      } catch (error) {
        console.error(`❌ Erro ao processar ordem de serviço ${ordemServico}:`, error);
        resultados.push({
          ordemServico,
          status: 'erro',
          mensagem: error.message
        });
      }
    }
    
    // Verificar se houve algum erro
    const erros = resultados.filter(r => r.status === 'erro');
    if (erros.length > 0) {
      console.log(`⚠️ ${erros.length} erro(s) encontrado(s) de ${resultados.length} ordens processadas`);
      return {
        sucesso: false,
        resultados,
        mensagem: `Erro ao processar ${erros.length} de ${resultados.length} ordem(ns) de serviço.`
      };
    }
    
    console.log('✅ Todas as ordens processadas com sucesso');
    
    return {
      sucesso: true,
      resultados,
      mensagem: `${resultados.length} ordem(ns) de serviço direcionada(s) com sucesso!`
    };
    
  } catch (error) {
    console.error('❌ Erro geral ao direcionar ordens de serviço:', error);
    throw error;
  }
}