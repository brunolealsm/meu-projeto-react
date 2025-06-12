import express from 'express';
import cors from 'cors';

const app = express();
const PORT = 3001;

// Middleware básico
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true
}));

app.use(express.json());

// Rota de teste simples
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Servidor funcionando' });
});

// Rotas básicas da API
app.get('/api/equipment/aguardando-entrada', (req, res) => {
  res.json({
    success: true,
    data: [
      { equipamento: 'Teste Equipamento', quantidade: 1 }
    ]
  });
});

app.get('/api/equipment/aguardando-revisao', (req, res) => {
  res.json({
    success: true,
    data: [
      { equipamento: 'Teste Revisão', quantidade: 2 }
    ]
  });
});

app.get('/api/equipment/equipamentos-em-servico', (req, res) => {
  res.json([
    {
      codigo: 'TEST001',
      nome: 'Técnico Teste',
      ordens: [
        { codigo: '12345', equipamento: 'Impressora HP', serie: 'HP001', data: new Date() }
      ],
      totalOrdens: 1
    }
  ]);
});

app.get('/api/equipment/tecnicos-oficina', (req, res) => {
  res.json({
    success: true,
    data: [
      { id: 1, name: 'Técnico Teste', cotec: 'TEST001' }
    ]
  });
});

// Middleware de erro
app.use((err, req, res, next) => {
  console.error('Erro:', err);
  res.status(500).json({ error: 'Erro interno do servidor' });
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor debug rodando na porta ${PORT}`);
  console.log(`📡 API disponível em: http://localhost:${PORT}`);
}); 