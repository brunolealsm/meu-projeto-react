import express from 'express';
import { 
  getEquipamentosAguardandoEntrada, 
  getDadosDetalhadosAguardandoEntrada,
  getEquipamentosAguardandoRevisao,
  getDadosDetalhadosAguardandoRevisao,
  getDetalhesEquipamentoAguardandoRevisao,
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
} from '../services/equipmentService.js';

const router = express.Router();

// PRIORIDADE: Novo endpoint para histórico de ordens de serviço
router.get('/historico-os/:serie', async (req, res) => {
  console.log('🔍 ROTA HISTÓRICO OS CHAMADA:', req.params);
  try {
    const { serie } = req.params;
    console.log(`${new Date().toISOString()} - GET /api/equipment/historico-os/${serie}`);
    console.log('📞 Chamando função getHistoricoOrdemServico...');
    
    const historico = await getHistoricoOrdemServico(serie);
    console.log('✅ Histórico recuperado:', historico);
    
    res.json({
      success: true,
      data: historico,
      message: 'Histórico de ordens de serviço recuperado com sucesso'
    });
  } catch (error) {
    console.error('❌ Erro ao buscar histórico de OS:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor ao buscar histórico de ordens de serviço',
      error: error.message
    });
  }
});

// GET /api/equipment/aguardando-entrada
// Retorna lista agrupada de equipamentos aguardando entrada
router.get('/aguardando-entrada', async (req, res) => {
  try {
    // Extrair parâmetros de filtro da query string
    const { marcas, subgrupos } = req.query;
    
    // Converter strings em arrays se fornecidas
    const filtrosMarcas = marcas ? marcas.split(',').filter(m => m.trim()) : [];
    const filtrosSubgrupos = subgrupos ? subgrupos.split(',').filter(s => s.trim()) : [];
    
    console.log('🔍 Filtros aplicados (Aguardando Entrada):', { 
      marcas: filtrosMarcas, 
      subgrupos: filtrosSubgrupos 
    });
    
    const equipamentos = await getEquipamentosAguardandoEntrada(filtrosMarcas, filtrosSubgrupos);
    res.json({
      success: true,
      data: equipamentos,
      total: equipamentos.length,
      filtrosAplicados: {
        marcas: filtrosMarcas,
        subgrupos: filtrosSubgrupos
      }
    });
  } catch (error) {
    console.error('Erro na rota /aguardando-entrada:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// GET /api/equipment/aguardando-entrada/detalhes
// Retorna dados detalhados dos equipamentos aguardando entrada
router.get('/aguardando-entrada/detalhes', async (req, res) => {
  try {
    const equipamentos = await getDadosDetalhadosAguardandoEntrada();
    res.json({
      success: true,
      data: equipamentos,
      total: equipamentos.length
    });
  } catch (error) {
    console.error('Erro na rota /aguardando-entrada/detalhes:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// GET /api/equipment/aguardando-entrada/detalhes/:equipamento
// Retorna dados detalhados de um equipamento específico
router.get('/aguardando-entrada/detalhes/:equipamento', async (req, res) => {
  try {
    const { equipamento } = req.params;
    const equipamentos = await getDadosDetalhadosAguardandoEntrada();
    
    // Filtrar apenas o equipamento solicitado
    const equipamentosFiltrados = equipamentos.filter(item => 
      item.TB01010_NOME === equipamento
    );
    
    res.json({
      success: true,
      data: equipamentosFiltrados,
      total: equipamentosFiltrados.length,
      equipamento: equipamento
    });
  } catch (error) {
    console.error('Erro na rota /aguardando-entrada/detalhes/:equipamento:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// GET /api/equipment/aguardando-revisao
// Retorna lista agrupada de equipamentos aguardando revisão
router.get('/aguardando-revisao', async (req, res) => {
  try {
    // Extrair parâmetros de filtro da query string
    const { marcas, subgrupos } = req.query;
    
    // Converter strings em arrays se fornecidas
    const filtrosMarcas = marcas ? marcas.split(',').filter(m => m.trim()) : [];
    const filtrosSubgrupos = subgrupos ? subgrupos.split(',').filter(s => s.trim()) : [];
    
    console.log('🔍 Filtros aplicados:', { 
      marcas: filtrosMarcas, 
      subgrupos: filtrosSubgrupos 
    });
    
    const equipamentos = await getEquipamentosAguardandoRevisao(filtrosMarcas, filtrosSubgrupos);
    res.json({
      success: true,
      data: equipamentos,
      total: equipamentos.length,
      filtrosAplicados: {
        marcas: filtrosMarcas,
        subgrupos: filtrosSubgrupos
      }
    });
  } catch (error) {
    console.error('Erro na rota /aguardando-revisao:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// GET /api/equipment/aguardando-revisao/detalhes
// Retorna dados detalhados dos equipamentos aguardando revisão
router.get('/aguardando-revisao/detalhes', async (req, res) => {
  try {
    const equipamentos = await getDadosDetalhadosAguardandoRevisao();
    res.json({
      success: true,
      data: equipamentos,
      total: equipamentos.length
    });
  } catch (error) {
    console.error('Erro na rota /aguardando-revisao/detalhes:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// GET /api/equipment/aguardando-revisao/detalhes/:equipamento
// Retorna dados detalhados de um equipamento específico aguardando revisão
router.get('/aguardando-revisao/detalhes/:equipamento', async (req, res) => {
  try {
    const { equipamento } = req.params;
    console.log(`🔍 Buscando detalhes do equipamento aguardando revisão: ${equipamento}`);
    
    const detalhes = await getDetalhesEquipamentoAguardandoRevisao(equipamento);
    
    console.log(`✅ Detalhes encontrados para: ${equipamento} - ${detalhes.length} registros`);
    res.json({
      success: true,
      data: detalhes,
      total: detalhes.length,
      equipamento: equipamento
    });
  } catch (error) {
    console.error('❌ Erro ao buscar detalhes do equipamento aguardando revisão:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro interno do servidor',
      error: error.message 
    });
  }
});

// GET /api/equipment/test-connection
// Testa a conexão com o banco de dados
router.get('/test-connection', async (req, res) => {
  try {
    const conexaoOk = await testarConexaoBanco();
    res.json({
      success: true,
      connected: conexaoOk,
      message: conexaoOk ? 'Conexão com banco de dados OK' : 'Falha na conexão com banco de dados'
    });
  } catch (error) {
    console.error('Erro na rota /test-connection:', error);
    res.status(500).json({
      success: false,
      connected: false,
      message: 'Erro ao testar conexão',
      error: error.message
    });
  }
});

// Rota de teste para verificar se o servidor está atualizando
router.get('/teste', (req, res) => {
  console.log('🎯 ROTA DE TESTE FUNCIONANDO!');
  res.json({ message: 'Servidor atualizado com sucesso!', timestamp: new Date() });
});

// Rota para buscar técnicos de oficina
router.get('/tecnicos-oficina', async (req, res) => {
  try {
    const tecnicos = await getTecnicosOficina();
    res.json({ success: true, data: tecnicos });
  } catch (error) {
    console.error('Erro ao buscar técnicos de oficina:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro ao buscar técnicos',
      error: error.message 
    });
  }
});

// Rota para direcionar ordens de serviço
router.post('/direcionar-ordens-servico', async (req, res) => {
  try {
    console.log('🚀 Recebida requisição para direcionar ordens de serviço');
    console.log('📋 Body da requisição:', req.body);
    
    const { ordensServico, codigoTecnico } = req.body;
    
    if (!ordensServico || !Array.isArray(ordensServico) || ordensServico.length === 0) {
      console.log('❌ Erro de validação: ordens de serviço inválidas');
      return res.status(400).json({
        success: false,
        message: 'É necessário informar pelo menos uma ordem de serviço'
      });
    }
    
    if (!codigoTecnico) {
      console.log('❌ Erro de validação: código do técnico não informado');
      return res.status(400).json({
        success: false,
        message: 'É necessário informar o código do técnico'
      });
    }
    
    console.log(`✅ Validações OK. Processando ${ordensServico.length} ordens para técnico ${codigoTecnico}`);
    
    const resultado = await direcionarOrdensServico(ordensServico, codigoTecnico);
    
    if (resultado.sucesso) {
      console.log('✅ Direcionamento concluído com sucesso');
      res.json({ 
        success: true, 
        data: resultado,
        message: resultado.mensagem
      });
    } else {
      console.log('⚠️ Direcionamento concluído com erros');
      res.status(400).json({ 
        success: false, 
        data: resultado,
        message: resultado.mensagem
      });
    }
  } catch (error) {
    console.error('❌ Erro na rota de direcionamento:', error);
    console.error('Stack trace:', error.stack);
    res.status(500).json({ 
      success: false, 
      message: 'Erro interno do servidor',
      error: error.message 
    });
  }
});

// Retorna equipamentos em serviço agrupados por técnico
router.get('/equipamentos-em-servico', async (req, res) => {
  try {
    console.log('🔍 Buscando equipamentos em serviço...');
    
    const equipamentos = await getEquipamentosEmServico();
    
    console.log(`✅ Equipamentos em serviço encontrados: ${equipamentos.length} técnicos`);
    res.json(equipamentos);
  } catch (error) {
    console.error('❌ Erro ao buscar equipamentos em serviço:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro interno do servidor',
      error: error.message 
    });
  }
});

// GET /api/equipment/pedidos-pendentes
// Retorna lista de pedidos pendentes (posição de peças)
router.get('/pedidos-pendentes', async (req, res) => {
  try {
    console.log('🔍 Buscando pedidos pendentes...');
    
    const pedidos = await getPedidosPendentes();
    
    console.log(`✅ Pedidos pendentes encontrados: ${pedidos.length} registros`);
    res.json({
      success: true,
      data: pedidos,
      total: pedidos.length
    });
  } catch (error) {
    console.error('❌ Erro ao buscar pedidos pendentes:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro interno do servidor',
      error: error.message 
    });
  }
});

// GET /api/equipment/pedidos-pendentes/:codigo
// Retorna detalhes de um pedido específico
router.get('/pedidos-pendentes/:codigo', async (req, res) => {
  try {
    const { codigo } = req.params;
    console.log(`🔍 Buscando detalhes do pedido: ${codigo}`);
    
    const detalhes = await getDetalhesPedido(codigo);
    
    console.log(`✅ Detalhes do pedido ${codigo}: ${detalhes.length} itens`);
    res.json({
      success: true,
      data: detalhes,
      total: detalhes.length,
      codigo: codigo
    });
  } catch (error) {
    console.error(`❌ Erro ao buscar detalhes do pedido ${req.params.codigo}:`, error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro interno do servidor',
      error: error.message 
    });
  }
});

// GET /api/equipment/pedidos-liberados
// Retorna lista de pedidos liberados (posição de peças)
router.get('/pedidos-liberados', async (req, res) => {
  try {
    console.log('🔍 Buscando pedidos liberados...');
    
    const pedidos = await getPedidosLiberados();
    
    console.log(`✅ Pedidos liberados encontrados: ${pedidos.length} registros`);
    res.json({
      success: true,
      data: pedidos,
      total: pedidos.length
    });
  } catch (error) {
    console.error('❌ Erro ao buscar pedidos liberados:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro interno do servidor',
      error: error.message 
    });
  }
});

// GET /api/equipment/pedidos-liberados/:codigo
// Retorna detalhes de um pedido liberado específico
router.get('/pedidos-liberados/:codigo', async (req, res) => {
  try {
    const { codigo } = req.params;
    console.log(`🔍 Buscando detalhes do pedido liberado: ${codigo}`);
    
    const detalhes = await getDetalhesPedidoLiberado(codigo);
    
    console.log(`✅ Detalhes do pedido liberado ${codigo}: ${detalhes.length} itens`);
    res.json({
      success: true,
      data: detalhes,
      total: detalhes.length,
      codigo: codigo
    });
  } catch (error) {
    console.error(`❌ Erro ao buscar detalhes do pedido liberado ${req.params.codigo}:`, error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro interno do servidor',
      error: error.message 
    });
  }
});

// GET /api/equipment/fechamento-os
// Retorna lista de ordens de serviço de fechamento agrupadas por técnico
router.get('/fechamento-os', async (req, res) => {
  try {
    console.log('🔍 Buscando dados de fechamento de OS...');
    
    const fechamentos = await getFechamentoOS();
    
    console.log(`✅ Fechamentos de OS encontrados: ${fechamentos.length} técnicos`);
    res.json({
      success: true,
      data: fechamentos,
      total: fechamentos.length
    });
  } catch (error) {
    console.error('❌ Erro ao buscar fechamentos de OS:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro interno do servidor',
      error: error.message 
    });
  }
});

// GET /api/equipment/fechamento-os/:codigo
// Retorna detalhes de uma OS específica de fechamento
router.get('/fechamento-os/:codigo', async (req, res) => {
  try {
    const { codigo } = req.params;
    console.log(`🔍 Buscando detalhes do fechamento de OS: ${codigo}`);
    
    const detalhes = await getDetalhesFechamentoOS(codigo);
    
    if (detalhes) {
      console.log(`✅ Detalhes do fechamento de OS ${codigo} encontrados`);
      res.json({
        success: true,
        data: detalhes,
        codigo: codigo
      });
    } else {
      console.log(`⚠️ Fechamento de OS ${codigo} não encontrado`);
      res.status(404).json({
        success: false,
        message: 'Fechamento de OS não encontrado',
        codigo: codigo
      });
    }
  } catch (error) {
    console.error(`❌ Erro ao buscar detalhes do fechamento de OS ${req.params.codigo}:`, error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro interno do servidor',
      error: error.message 
    });
  }
});

// POST /api/equipment/pedidos-liberados/:codigo/confirmar-recebimento
// Confirma o recebimento de um pedido liberado
router.post('/pedidos-liberados/:codigo/confirmar-recebimento', async (req, res) => {
  try {
    const { codigo } = req.params;
    console.log(`🔍 Confirmando recebimento do pedido: ${codigo}`);
    
    const resultado = await confirmarRecebimentoPedido(codigo);
    
    if (resultado.sucesso) {
      console.log(`✅ Recebimento do pedido ${codigo} confirmado com sucesso`);
      res.json({
        success: true,
        data: resultado.dados,
        message: resultado.mensagem
      });
    } else {
      console.log(`⚠️ Erro ao confirmar recebimento do pedido ${codigo}`);
      res.status(400).json({
        success: false,
        message: resultado.mensagem,
        error: resultado.erro
      });
    }
  } catch (error) {
    console.error(`❌ Erro na rota de confirmação de recebimento do pedido ${req.params.codigo}:`, error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro interno do servidor',
      error: error.message 
    });
  }
});

export default router; 