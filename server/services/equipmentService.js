import { executeQuery, testConnection } from '../config/database.js';

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
                                    AND TB02002_CODEMP = [WP_OFICINA_RECEB1].codemp
                                    AND TB02002_NTFISC = [WP_OFICINA_RECEB1].ntfisc)
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
                                  AND TB02002_CODEMP = [WP_OFICINA_RECEB1].codemp
                                  AND TB02002_NTFISC = [WP_OFICINA_RECEB1].ntfisc)
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
                                 AND TB02002_CODEMP = [WP_OFICINA_RECEB1].codemp
                                 AND TB02002_NTFISC = [WP_OFICINA_RECEB1].ntfisc)
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
  testarConexaoBanco,
  getHistoricoOrdemServico
};