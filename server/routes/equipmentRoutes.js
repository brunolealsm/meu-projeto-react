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

// Rota para testar conexão com banco
router.get('/test-connection', async (req, res) => {
  try {
    await testarConexaoBanco();
    res.json({ 
      success: true, 
      message: 'Conexão com banco de dados estabelecida com sucesso' 
    });
  } catch (error) {
    console.error('Erro na conexão:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro ao conectar com banco de dados',
      error: error.message 
    });
  }
});

// Rota para buscar equipamentos aguardando entrada (resumo)
router.get('/aguardando-entrada', async (req, res) => {
  try {
    const equipamentos = await getEquipamentosAguardandoEntrada();
    res.json({ success: true, data: equipamentos });
  } catch (error) {
    console.error('Erro ao buscar equipamentos aguardando entrada:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro ao buscar dados',
      error: error.message 
    });
  }
});

// Rota para buscar dados detalhados dos equipamentos aguardando entrada
router.get('/aguardando-entrada/detalhes', async (req, res) => {
  try {
    const detalhes = await getDadosDetalhadosAguardandoEntrada();
    res.json({ success: true, data: detalhes });
  } catch (error) {
    console.error('Erro ao buscar detalhes aguardando entrada:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro ao buscar dados detalhados',
      error: error.message 
    });
  }
});

// Rota para buscar equipamentos aguardando revisão (resumo)
router.get('/aguardando-revisao', async (req, res) => {
  try {
    const equipamentos = await getEquipamentosAguardandoRevisao();
    res.json({ success: true, data: equipamentos });
  } catch (error) {
    console.error('Erro ao buscar equipamentos aguardando revisão:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro ao buscar dados',
      error: error.message 
    });
  }
});

// Rota para buscar dados detalhados dos equipamentos aguardando revisão
router.get('/aguardando-revisao/detalhes', async (req, res) => {
  try {
    const detalhes = await getDadosDetalhadosAguardandoRevisao();
    res.json({ success: true, data: detalhes });
  } catch (error) {
    console.error('Erro ao buscar detalhes aguardando revisão:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro ao buscar dados detalhados',
      error: error.message 
    });
  }
});

// Rota para buscar detalhes de um equipamento específico aguardando revisão
router.get('/aguardando-revisao/detalhes/:equipamento', async (req, res) => {
  try {
    const { equipamento } = req.params;
    const detalhes = await getDetalhesEquipamentoAguardandoRevisao(equipamento);
    res.json({ success: true, data: detalhes });
  } catch (error) {
    console.error('Erro ao buscar detalhes do equipamento:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro ao buscar dados do equipamento',
      error: error.message 
    });
  }
});

// Rota para buscar histórico de ordens de serviço por série
router.get('/historico-os/:serie', async (req, res) => {
  try {
    const { serie } = req.params;
    const historico = await getHistoricoOrdemServico(serie);
    res.json({ success: true, data: historico });
  } catch (error) {
    console.error('Erro ao buscar histórico de OS:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro ao buscar histórico',
      error: error.message 
    });
  }
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
    const { ordensServico, codigoTecnico } = req.body;
    
    if (!ordensServico || !Array.isArray(ordensServico) || ordensServico.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'É necessário informar pelo menos uma ordem de serviço'
      });
    }
    
    if (!codigoTecnico) {
      return res.status(400).json({
        success: false,
        message: 'É necessário informar o código do técnico'
      });
    }
    
    const resultado = await direcionarOrdensServico(ordensServico, codigoTecnico);
    
    if (resultado.sucesso) {
      res.json({ 
        success: true, 
        data: resultado,
        message: resultado.mensagem
      });
    } else {
      res.status(400).json({ 
        success: false, 
        data: resultado,
        message: resultado.mensagem
      });
    }
  } catch (error) {
    console.error('Erro ao direcionar ordens de serviço:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro interno do servidor',
      error: error.message 
    });
  }
});

export default router; 