import express from 'express';
import { 
  getEquipamentosAguardandoEntrada, 
  getDadosDetalhadosAguardandoEntrada,
  testarConexaoBanco,
  getHistoricoOrdemServico
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

export default router; 