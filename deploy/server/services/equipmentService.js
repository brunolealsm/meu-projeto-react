import { executeQuery, testConnection, getConnection } from '../config/database.js';
import * as sql from 'mssql';

// Serviços para gerenciar equipamentos no banco de dados

/**
 * Buscar todos os equipamentos aguardando entrada
 * Baseado na query fornecida com filtro EntradaFin = 0
 */
export const getEquipamentosAguardandoEntrada = async (filtrosMarcas = [], filtrosSubgrupos = []) => {
  try {
    // Construir condições de filtro
    let condicoesFiltro = '';
    
    if (filtrosMarcas.length > 0 || filtrosSubgrupos.length > 0) {
      // Escapar aspas simples para evitar problemas de SQL injection
      const marcasEscapadas = filtrosMarcas.map(marca => marca.replace(/'/g, "''"));
      const subgruposEscapados = filtrosSubgrupos.map(subgrupo => subgrupo.replace(/'/g, "''"));
      
      const filtrosMarcasSQL = marcasEscapadas.length > 0 
        ? `TB01047_NOME IN ('${marcasEscapadas.join("','")}')`
        : '';
      
      const filtrosSubgruposSQL = subgruposEscapados.length > 0 
        ? `TB01018_NOME IN ('${subgruposEscapados.join("','")}')`
        : '';
      
      // Se ambos os filtros estão presentes, usar OR para incluir equipamentos que atendam qualquer um dos critérios
      // Se apenas um está presente, usar apenas esse filtro
      if (filtrosMarcasSQL && filtrosSubgruposSQL) {
        condicoesFiltro = `AND (${filtrosMarcasSQL} OR ${filtrosSubgruposSQL})`;
      } else if (filtrosMarcasSQL) {
        condicoesFiltro = `AND ${filtrosMarcasSQL}`;
      } else if (filtrosSubgruposSQL) {
        condicoesFiltro = `AND ${filtrosSubgruposSQL}`;
      }
      
      console.log('🔍 Condição de filtro SQL construída (Aguardando Entrada):', condicoesFiltro);
      console.log('🏷️ Marcas filtradas (Aguardando Entrada):', filtrosMarcas);
      console.log('📂 Subgrupos filtrados (Aguardando Entrada):', filtrosSubgrupos);
    }

    const query = `
      SELECT 
        TB01010_NOME as equipamento,
        COUNT(serie) as quantidade
      FROM [WP_OFICINA_RECEB1]
      LEFT JOIN TB01010 ON TB01010_CODIGO = REPLICATE('0',5-LEN(RTRIM(LTRIM(codprod))))+RTRIM(LTRIM(codprod))
      LEFT JOIN TB02030 ON TB02030_NTFISC = ntfisc AND TB02030_CODEMP = codemp
      LEFT JOIN TB02111 ON TB02111_CODIGO = TB02030_CONTRATO AND TB02111_CODEMP = TB02030_CODEMP
      LEFT JOIN TB01008 ON TB01008_CODIGO = TB02111_CODCLI
      LEFT JOIN TB01077 ON TB01077_CODIGO = motoajud
      LEFT JOIN users ON users.id = conferente
      LEFT JOIN TB01047 ON TB01047_CODIGO = TB01010_MARCA
      LEFT JOIN TB01018 ON TB01018_CODIGO = TB01010_SUBGRUPO
      WHERE CASE WHEN EXISTS (SELECT *
                                FROM TB02002
                               WHERE TB02002_CODPRE = [WP_OFICINA_RECEB1].pedido
                                 AND TB02002_CODEMP = [WP_OFICINA_RECEB1].codemp)
                             THEN 1
                             ELSE 0 END = 0
        AND TB01010_NOME IS NOT NULL
        ${condicoesFiltro}
      GROUP BY TB01010_NOME
      ORDER BY COUNT(serie) DESC
    `;
    
    console.log('🔍 Query SQL completa (Aguardando Entrada):', query);
    const result = await executeQuery(query);
    console.log('📊 Resultado da query (Aguardando Entrada):', result.recordset);
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
                               ELSE 0 END EntradaFin,
             TB01047_NOME, TB01018_NOME
        FROM [WP_OFICINA_RECEB1]
      LEFT JOIN TB01010 ON TB01010_CODIGO = REPLICATE('0',5-LEN(RTRIM(LTRIM(codprod))))+RTRIM(LTRIM(codprod))
      LEFT JOIN TB02030 ON TB02030_NTFISC = ntfisc AND TB02030_CODEMP = codemp
      LEFT JOIN TB02111 ON TB02111_CODIGO = TB02030_CONTRATO AND TB02111_CODEMP = TB02030_CODEMP
      LEFT JOIN TB01008 ON TB01008_CODIGO = TB02111_CODCLI
      LEFT JOIN TB01077 ON TB01077_CODIGO = motoajud
      LEFT JOIN users ON users.id = conferente
      LEFT JOIN TB01047 ON TB01047_CODIGO = TB01010_MARCA
      LEFT JOIN TB01018 ON TB01018_CODIGO = TB01010_SUBGRUPO
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
 * Buscar pedidos pendentes (posição de peças)
 * Baseado na query fornecida pelo usuário
 */
export const getPedidosPendentes = async () => {
  try {
    const query = `
      SELECT TB02018_CODIGO, TB02018_DTCAD, TB02019_PRODUTO, TB01010_REFERENCIA, TB01010_NOME, TB02019_QTPROD,
             TB01021_NOME
        FROM TB02019 LEFT JOIN TB02018 ON TB02018_CODIGO = TB02019_CODIGO
                     LEFT JOIN TB01009 ON TB01009_CODIGO = TB02018_TRANSP
                     LEFT JOIN TB01010 ON TB01010_CODIGO = TB02019_PRODUTO
                     LEFT JOIN TB01021 ON TB01021_CODIGO = TB02018_STATUS
       WHERE TB02018_SITUACAO = 'A' AND TB02018_TIPODESC = '05'
         AND TB01009_FANTASIA = 'OFICINA'
       ORDER BY TB02018_CODIGO, TB02019_PRODUTO
    `;
    
    console.log('🔍 Buscando pedidos pendentes...');
    const result = await executeQuery(query);
    console.log('📦 Pedidos pendentes encontrados:', result.recordset.length, 'registros');
    return result.recordset;
  } catch (error) {
    console.error('Erro ao buscar pedidos pendentes:', error);
    throw error;
  }
};

/**
 * Buscar detalhes de um pedido específico
 * Baseado na query fornecida pelo usuário, filtrando por código do pedido
 */
export const getDetalhesPedido = async (codigoPedido) => {
  try {
    const query = `
      SELECT TB02018_CODIGO, TB02018_DTCAD, TB02019_PRODUTO, TB01010_REFERENCIA, TB01010_NOME, TB02019_QTPROD,
             TB01021_NOME
        FROM TB02019 LEFT JOIN TB02018 ON TB02018_CODIGO = TB02019_CODIGO
                     LEFT JOIN TB01009 ON TB01009_CODIGO = TB02018_TRANSP
                     LEFT JOIN TB01010 ON TB01010_CODIGO = TB02019_PRODUTO
                     LEFT JOIN TB01021 ON TB01021_CODIGO = TB02018_STATUS
       WHERE TB02018_SITUACAO = 'A' AND TB02018_TIPODESC = '05'
         AND TB01009_FANTASIA = 'OFICINA'
         AND TB02018_CODIGO = '${codigoPedido.replace(/'/g, "''")}'
       ORDER BY TB02019_PRODUTO
    `;
    
    console.log(`🔍 Buscando detalhes do pedido: ${codigoPedido}`);
    const result = await executeQuery(query);
    console.log(`📦 Detalhes do pedido ${codigoPedido}:`, result.recordset.length, 'itens');
    return result.recordset;
  } catch (error) {
    console.error(`Erro ao buscar detalhes do pedido ${codigoPedido}:`, error);
    throw error;
  }
};

/**
 * Buscar pedidos liberados (posição de peças)
 * Baseado na query fornecida pelo usuário para pedidos liberados
 */
export const getPedidosLiberados = async () => {
  try {
    const query = `
      SELECT TB02021_NUMORC AS TB02021_CODIGO, TB02021_NUMORC, TB02022_PRODUTO, TB01010_REFERENCIA, TB01010_NOME, TB02022_QTPROD, TB01021_NOME
        FROM TB02022 LEFT JOIN TB02021 ON TB02021_CODIGO = TB02022_CODIGO
                     LEFT JOIN TB01009 ON TB01009_CODIGO = TB02021_TRANSP
                     LEFT JOIN TB01010 ON TB01010_CODIGO = TB02022_PRODUTO
                     LEFT JOIN TB01021 ON TB01021_CODIGO = TB02021_STATUS
       WHERE TB02021_SITUACAO = 'A' AND TB02021_TIPODESC = '05'
         AND TB02021_STATUS = 'L6'
         AND TB01009_FANTASIA = 'OFICINA'
         AND TB02021_DTCAD > '2025-06-10 08:39:33.320'
       ORDER BY TB02021_CODIGO, TB02022_PRODUTO
    `;
    
    console.log('🔍 Buscando pedidos liberados...');
    const result = await executeQuery(query);
    console.log('📦 Pedidos liberados encontrados:', result.recordset.length, 'registros');
    return result.recordset;
  } catch (error) {
    console.error('Erro ao buscar pedidos liberados:', error);
    throw error;
  }
};

/**
 * Buscar detalhes de um pedido liberado específico
 * Baseado na query fornecida pelo usuário, filtrando por código do pedido
 */
export const getDetalhesPedidoLiberado = async (codigoPedido) => {
  try {
    const query = `
      SELECT TB02021_NUMORC AS TB02021_CODIGO, TB02021_NUMORC, TB02022_PRODUTO, TB01010_REFERENCIA, TB01010_NOME, TB02022_QTPROD, TB01021_NOME
        FROM TB02022 LEFT JOIN TB02021 ON TB02021_CODIGO = TB02022_CODIGO
                     LEFT JOIN TB01009 ON TB01009_CODIGO = TB02021_TRANSP
                     LEFT JOIN TB01010 ON TB01010_CODIGO = TB02022_PRODUTO
                     LEFT JOIN TB01021 ON TB01021_CODIGO = TB02021_STATUS
       WHERE TB02021_SITUACAO = 'A' AND TB02021_TIPODESC = '05'
         AND TB02021_STATUS = 'L6'
         AND TB01009_FANTASIA = 'OFICINA'
         AND TB02021_DTCAD > '2025-06-10 08:39:33.320'
         AND TB02021_NUMORC = '${codigoPedido.replace(/'/g, "''")}'
       ORDER BY TB02022_PRODUTO
    `;
    
    console.log(`🔍 Buscando detalhes do pedido liberado: ${codigoPedido}`);
    const result = await executeQuery(query);
    console.log(`📦 Detalhes do pedido liberado ${codigoPedido}:`, result.recordset.length, 'itens');
    return result.recordset;
  } catch (error) {
    console.error(`Erro ao buscar detalhes do pedido liberado ${codigoPedido}:`, error);
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
 * @param {Array} filtrosMarcas - Array de marcas selecionadas para filtro
 * @param {Array} filtrosSubgrupos - Array de subgrupos selecionados para filtro
 */
export const getEquipamentosAguardandoRevisao = async (filtrosMarcas = [], filtrosSubgrupos = []) => {
  try {
    // Construir condições de filtro
    let condicoesFiltro = '';
    
    if (filtrosMarcas.length > 0 || filtrosSubgrupos.length > 0) {
      // Escapar aspas simples para evitar problemas de SQL injection
      const marcasEscapadas = filtrosMarcas.map(marca => marca.replace(/'/g, "''"));
      const subgruposEscapados = filtrosSubgrupos.map(subgrupo => subgrupo.replace(/'/g, "''"));
      
      const filtrosMarcasSQL = marcasEscapadas.length > 0 
        ? `TB01047_NOME IN ('${marcasEscapadas.join("','")}')`
        : '';
      
      const filtrosSubgruposSQL = subgruposEscapados.length > 0 
        ? `TB01018_NOME IN ('${subgruposEscapados.join("','")}')`
        : '';
      
      // Se ambos os filtros estão presentes, usar OR para incluir equipamentos que atendam qualquer um dos critérios
      // Se apenas um está presente, usar apenas esse filtro
      if (filtrosMarcasSQL && filtrosSubgruposSQL) {
        condicoesFiltro = `AND (${filtrosMarcasSQL} OR ${filtrosSubgruposSQL})`;
      } else if (filtrosMarcasSQL) {
        condicoesFiltro = `AND ${filtrosMarcasSQL}`;
      } else if (filtrosSubgruposSQL) {
        condicoesFiltro = `AND ${filtrosSubgruposSQL}`;
      }
      
      console.log('🔍 Condição de filtro SQL construída:', condicoesFiltro);
      console.log('🏷️ Marcas filtradas:', filtrosMarcas);
      console.log('📂 Subgrupos filtrados:', filtrosSubgrupos);
    }

    const query = `
      WITH DadosCompletos AS (
        SELECT codprod, TB01010_NOME, serie, motivoret,
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
          ${condicoesFiltro}
      )
      SELECT 
        TB01010_NOME as equipamento,
        COUNT(serie) as quantidade
      FROM DadosCompletos
      WHERE TB01010_NOME IS NOT NULL
      GROUP BY TB01010_NOME
      ORDER BY COUNT(serie) DESC
    `;
    
    console.log('🔍 Query SQL completa:', query);
    const result = await executeQuery(query);
    console.log('📊 Resultado da query:', result.recordset);
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
      SELECT codprod, TB01010_NOME, serie, TB01047_NOME, TB01018_NOME, motivoret,
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
      SELECT codprod, TB01010_NOME, serie, TB01047_NOME, TB01018_NOME, motivoret,
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
    
    // Query para buscar dados adicionais da WP_OFICINA_RECEB1 (conferente, cabo, data recebimento)
    const queryDadosOficina = `
      SELECT users.[name] as Conferente,
             CASE WHEN caboret = 1 THEN 'Sim' ELSE 'Não' END as Cabo,
             dtreceb as DataRecebimento
      FROM [WP_OFICINA_RECEB1]
      LEFT JOIN users ON users.id = conferente
      WHERE serie = '${serie}'
    `;
    
    const [resultHeader, resultHistorico, resultDadosOficina] = await Promise.all([
      executeQuery(queryHeader),
      executeQuery(queryHistorico),
      executeQuery(queryDadosOficina)
    ]);
    
    if (resultHistorico.recordset.length === 0) {
      return {
        equipamento: null,
        ultimoAtendimento: null,
        ultimaOS: null,
        ultimoTecnico: null,
        conferente: null,
        cabo: null,
        dataRecebimento: null,
        historico: []
      };
    }
    
    // Dados do equipamento do primeiro registro do histórico
    const primeiroRegistroHistorico = resultHistorico.recordset[0];
    
    // Dados do header (registro com data mais recente)
    const dadosHeader = resultHeader.recordset.length > 0 ? resultHeader.recordset[0] : null;
    
    // Dados adicionais da oficina
    const dadosOficina = resultDadosOficina.recordset.length > 0 ? resultDadosOficina.recordset[0] : null;
    
    return {
      equipamento: {
        serie: primeiroRegistroHistorico.TB02115_NUMSERIE,
        produto: primeiroRegistroHistorico.TB02115_PRODUTO
      },
      ultimoAtendimento: dadosHeader?.TB02122_DTFECHA || null,
      ultimaOS: dadosHeader?.TB02115_CODIGO || '',
      ultimoTecnico: dadosHeader?.TB01024_NOME || '',
      conferente: dadosOficina?.Conferente || null,
      cabo: dadosOficina?.Cabo || null,
      dataRecebimento: dadosOficina?.DataRecebimento || null,
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
  direcionarOrdensServico,
  getEquipamentosEmServico
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

/**
 * Buscar todos os equipamentos em serviço agrupados por técnico
 */
export async function getEquipamentosEmServico() {
  try {
    console.log('🔍 Buscando equipamentos em serviço agrupados por técnico...');
    
    const query = `
      SELECT TB02115_CODIGO, TB02115_DATA, TB02115_CODCLI, TB02115_CODEMP, 
             TB02115_NUMSERIE, TB02115_PRODUTO, TB01010_NOME, TB02115_CODTEC, TB01024_NOME,
             (SELECT TOP 1 TB02130_DATA FROM TB02130 
               WHERE TB02130_CODIGO = TB02115_CODIGO AND TB02130_TIPO = 'O'
                 AND TB02130_CODCAD = TB02115_CODCLI AND TB02130_STATUS = '9G'
              ORDER BY TB02130_DATA DESC) DATA_STATUS
      FROM TB02115 LEFT JOIN TB01024 ON TB01024_CODIGO = TB02115_CODTEC
                   LEFT JOIN TB01010 ON TB01010_CODIGO = TB02115_PRODUTO
      WHERE TB02115_SITUACAO = 'A' AND TB02115_STATUS = '9G'
        AND TB02115_DTFECHA IS NULL
    `;

    console.log('📋 Executando consulta:', query);
    const result = await executeQuery(query);
    
    console.log(`✅ Encontrados ${result.recordset.length} registros em serviço`);
    
    // Agrupar por técnico
    const tecnicos = {};
    
    result.recordset.forEach(record => {
      const codigoTecnico = record.TB02115_CODTEC;
      const nomeTecnico = record.TB01024_NOME || `Técnico ${codigoTecnico}`;
      
      if (!tecnicos[codigoTecnico]) {
        tecnicos[codigoTecnico] = {
          codigo: codigoTecnico,
          nome: nomeTecnico,
          ordens: [],
          totalOrdens: 0
        };
      }
      
      tecnicos[codigoTecnico].ordens.push({
        codigo: record.TB02115_CODIGO,
        equipamento: record.TB01010_NOME,
        serie: record.TB02115_NUMSERIE,
        data: record.TB02115_DATA,
        dataStatus: record.DATA_STATUS
      });
      
      tecnicos[codigoTecnico].totalOrdens++;
    });
    
    // Converter para array
    const tecnicosArray = Object.values(tecnicos);
    
    console.log(`📊 Dados agrupados em ${tecnicosArray.length} técnicos`);
    return tecnicosArray;
    
  } catch (error) {
    console.error('❌ Erro ao buscar equipamentos em serviço:', error);
    throw error;
  }
}

/**
 * Buscar dados de fechamento de OS
 * Baseado na query fornecida pelo usuário para fechamento de OS
 */
export async function getFechamentoOS() {
  try {
    console.log('🔍 Buscando dados de fechamento de OS...');
    console.log('🔍 Buscando fechamento de OS agrupados por técnico...');
    
    const query = `
      SELECT TB02115_CODIGO, TB01024_NOME, TB01010_NOME, TB02115_NUMSERIE,
       
          (SELECT TOP 1 TB02130_DATA FROM TB02130
            WHERE TB02130_CODIGO = TB02115_CODIGO AND TB02130_TIPO = 'O'
              AND TB02130_STATUS IN ('27', '05')
         ORDER BY TB02130_DATA DESC) FINALIZADO_EM,

          (SELECT TOP 1 TB02130_OBS FROM TB02130
            WHERE TB02130_CODIGO = TB02115_CODIGO AND TB02130_TIPO = 'O'
              AND TB02130_STATUS IN ('27', '05')
         ORDER BY TB02130_DATA DESC) FINALIZADO_LAUDO,
             
             TB01073_NOME
        FROM TB02115 LEFT JOIN TB01024 ON TB01024_CODIGO = TB02115_CODTEC
                     LEFT JOIN TB01010 ON TB01010_CODIGO = TB02115_PRODUTO
                     LEFT JOIN TB01073 ON TB01073_CODIGO = TB02115_STATUS
       WHERE TB02115_SITUACAO = 'A' AND TB02115_STATUS IN ('27', '05')
    `;
    
    console.log('📋 Executando consulta de fechamento:', query);
    const result = await executeQuery(query);
    
    console.log('✅ Encontrados', result.recordset.length, 'registros de fechamento');
    
    // Agrupar os dados por técnico
    const gruposPorTecnico = {};
    
    result.recordset.forEach(row => {
      const tecnicoNome = row.TB01024_NOME || 'Técnico não definido';
      
      if (!gruposPorTecnico[tecnicoNome]) {
        gruposPorTecnico[tecnicoNome] = {
          tecnico: tecnicoNome,
          ordensServico: []
        };
      }
      
      gruposPorTecnico[tecnicoNome].ordensServico.push({
        codigoOS: row.TB02115_CODIGO,
        tecnico: row.TB01024_NOME,
        equipamento: row.TB01010_NOME,
        numeroSerie: row.TB02115_NUMSERIE,
        finalizadoEm: row.FINALIZADO_EM,
        laudo: row.FINALIZADO_LAUDO,
        condicaoIntervencao: row.TB01073_NOME
      });
    });
    
    // Converter para array
    const tecnicos = Object.values(gruposPorTecnico);
    
    console.log('📊 Dados de fechamento agrupados em', tecnicos.length, 'técnicos');
    
    return tecnicos;
  } catch (error) {
    console.error('❌ Erro ao buscar dados de fechamento de OS:', error);
    throw error;
  }
}

/**
 * Buscar detalhes de uma OS específica de fechamento
 * Baseado na query fornecida pelo usuário, filtrando por código da OS
 */
export async function getDetalhesFechamentoOS(codigoOS) {
  try {
    console.log(`🔍 Buscando detalhes da OS de fechamento: ${codigoOS}`);
    
    const query = `
      SELECT TB02115_CODIGO, TB01024_NOME, TB01010_NOME, TB02115_NUMSERIE,
       
          (SELECT TOP 1 TB02130_DATA FROM TB02130
            WHERE TB02130_CODIGO = TB02115_CODIGO AND TB02130_TIPO = 'O'
              AND TB02130_STATUS IN ('27', '05')
         ORDER BY TB02130_DATA DESC) FINALIZADO_EM,

          (SELECT TOP 1 TB02130_OBS FROM TB02130
            WHERE TB02130_CODIGO = TB02115_CODIGO AND TB02130_TIPO = 'O'
              AND TB02130_STATUS IN ('27', '05')
         ORDER BY TB02130_DATA DESC) FINALIZADO_LAUDO,
             
             TB01073_NOME
        FROM TB02115 LEFT JOIN TB01024 ON TB01024_CODIGO = TB02115_CODTEC
                     LEFT JOIN TB01010 ON TB01010_CODIGO = TB02115_PRODUTO
                     LEFT JOIN TB01073 ON TB01073_CODIGO = TB02115_STATUS
       WHERE TB02115_SITUACAO = 'A' AND TB02115_STATUS IN ('27', '05')
         AND TB02115_CODIGO = '${codigoOS.replace(/'/g, "''")}'
    `;
    
    console.log(`📋 Executando consulta de detalhes para OS: ${codigoOS}`);
    const result = await executeQuery(query);
    
    console.log(`✅ Detalhes da OS ${codigoOS}:`, result.recordset.length, 'registros');
    
    return result.recordset.length > 0 ? result.recordset[0] : null;
  } catch (error) {
    console.error(`❌ Erro ao buscar detalhes da OS ${codigoOS}:`, error);
    throw error;
  }
}

/**
 * Confirmar recebimento de pedido liberado
 * Executa os 3 comandos SQL em sequência para atualizar status e histórico
 */
export async function confirmarRecebimentoPedido(numeroPedido) {
  try {
    console.log(`🔍 Iniciando confirmação de recebimento do pedido: ${numeroPedido}`);
    
    // Escapar aspas simples para evitar SQL injection
    const pedidoEscapado = numeroPedido.replace(/'/g, "''");
    
    // 1) Buscar código do cliente e código da empresa do pedido
    const queryBuscarDados = `
      SELECT TB02021_CODCLI, TB02021_CODEMP 
      FROM TB02021 
      WHERE TB02021_NUMORC = '${pedidoEscapado}'
    `;
    
    console.log(`📋 Executando consulta para buscar dados do pedido: ${numeroPedido}`);
    const resultDados = await executeQuery(queryBuscarDados);
    
    if (resultDados.recordset.length === 0) {
      throw new Error(`Pedido ${numeroPedido} não encontrado.`);
    }
    
    const dadosPedido = resultDados.recordset[0];
    const codigoCliente = dadosPedido.TB02021_CODCLI;
    const codigoEmpresa = dadosPedido.TB02021_CODEMP;
    
    console.log(`📊 Dados encontrados - Cliente: ${codigoCliente}, Empresa: ${codigoEmpresa}`);
    
    // 2) Atualizar o status do pedido para finalizado
    const queryAtualizarStatus = `
      UPDATE TB02021 
      SET TB02021_STATUS = '82' 
      WHERE TB02021_NUMORC = '${pedidoEscapado}'
    `;
    
    console.log(`📋 Atualizando status do pedido para '82'`);
    await executeQuery(queryAtualizarStatus);
    
    // 3) Inserir histórico do pedido com o novo status
    const queryInserirHistorico = `
      INSERT INTO TB02130 (TB02130_CODIGO, TB02130_DATA, TB02130_USER, TB02130_STATUS, TB02130_NOME,
                           TB02130_OBS, TB02130_CODTEC, TB02130_PREVISAO, TB02130_NOMETEC, TB02130_TIPO,
                           TB02130_CODCAD, TB02130_CODEMP, TB02130_DATAEXEC, TB02130_HORASCOM, TB02130_HORASFIM)
      VALUES ('${pedidoEscapado}', GETDATE(), 'OFICINA', '82', 
              (SELECT TB01021_NOME FROM TB01021 WHERE TB01021_CODIGO = '82'), 
              'Status modificado automaticamente através da confirmação de recebimento da oficina.', 
              NULL, NULL, NULL, 'V', '${codigoCliente.replace(/'/g, "''")}', '${codigoEmpresa.replace(/'/g, "''")}', 
              GETDATE(), '00:00', '00:00')
    `;
    
    console.log(`📋 Inserindo histórico do pedido`);
    await executeQuery(queryInserirHistorico);
    
    console.log(`✅ Recebimento do pedido ${numeroPedido} confirmado com sucesso`);
    
    return {
      sucesso: true,
      mensagem: `Pedido ${numeroPedido} foi confirmado como recebido e seu status foi atualizado para finalizado.`,
      dados: {
        numeroPedido,
        codigoCliente,
        codigoEmpresa,
        novoStatus: '82'
      }
    };
    
  } catch (error) {
    console.error(`❌ Erro ao confirmar recebimento do pedido ${numeroPedido}:`, error);
    return {
      sucesso: false,
      mensagem: `Erro ao confirmar recebimento do pedido ${numeroPedido}: ${error.message}`,
      erro: error.message
    };
  }
}