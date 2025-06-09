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
  direcionarOrdensServico
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
    const equipamentos = await getEquipamentosAguardandoEntrada();
    res.json({
      success: true,
      data: equipamentos,
      total: equipamentos.length
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
    const equipamentos = await getEquipamentosAguardandoRevisao();
    res.json({
      success: true,
      data: equipamentos,
      total: equipamentos.length
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
    
    // Usar função específica que já filtra na consulta SQL
    const equipamentosFiltrados = await getDetalhesEquipamentoAguardandoRevisao(equipamento);
    
    res.json({
      success: true,
      data: equipamentosFiltrados,
      total: equipamentosFiltrados.length,
      equipamento: equipamento
    });
  } catch (error) {
    console.error('Erro na rota /aguardando-revisao/detalhes/:equipamento:', error);
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

export default router; 