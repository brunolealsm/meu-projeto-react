# Configuração do Banco de Dados SQL Server

Este projeto utiliza SQL Server como banco de dados principal para armazenar informações sobre equipamentos, técnicos e processos da oficina.

## 🔐 Configurações de Conexão

### Dados de Conexão
- **Servidor**: 192.168.0.152
- **Banco de dados**: DATACLASSIC
- **Usuário**: maquinas-usuarios
- **Porta**: 1433
- **Senha**: *Criptografada por segurança*

### 🛡️ Segurança
A senha do banco de dados está **criptografada** usando AES-256 e não pode ser vista facilmente no código fonte.

## 📁 Estrutura dos Arquivos

```
src/
├── config/
│   └── database.js          # Configuração e conexão com SQL Server
├── services/
│   └── equipmentService.js  # Serviços para gerenciar equipamentos
└── docs/
    └── DATABASE.md          # Este arquivo de documentação
```

## 🚀 Como Usar

### 1. Importar a Conexão
```javascript
import { getConnection, executeQuery, testConnection } from '../config/database.js';
```

### 2. Executar Queries Simples
```javascript
import { executeQuery } from '../config/database.js';

const buscarEquipamentos = async () => {
  try {
    const query = 'SELECT * FROM equipamentos WHERE status = @status';
    const params = { status: 'ATIVO' };
    const result = await executeQuery(query, params);
    return result.recordset;
  } catch (error) {
    console.error('Erro:', error);
  }
};
```

### 3. Executar Stored Procedures
```javascript
import { executeStoredProcedure } from '../config/database.js';

const chamarProcedure = async () => {
  try {
    const params = { 
      equipamento_id: 123, 
      novo_status: 'PRONTO' 
    };
    const result = await executeStoredProcedure('sp_atualizar_status', params);
    return result;
  } catch (error) {
    console.error('Erro:', error);
  }
};
```

### 4. Testar Conexão
```javascript
import { testConnection } from '../config/database.js';

const verificarConexao = async () => {
  const conexaoOk = await testConnection();
  if (conexaoOk) {
    console.log('✅ Banco conectado com sucesso!');
  } else {
    console.log('❌ Falha na conexão com o banco');
  }
};
```

## 📋 Funções Disponíveis

### Principais Funções

| Função | Descrição | Retorno |
|--------|-----------|---------|
| `getConnection()` | Obtém conexão com o banco | Pool de conexões |
| `executeQuery(query, params)` | Executa query SQL | Resultado da query |
| `executeStoredProcedure(name, params)` | Executa stored procedure | Resultado da procedure |
| `testConnection()` | Testa conexão com o banco | Boolean |
| `closeConnection()` | Fecha conexão (quando necessário) | Void |

### Funções de Equipamentos

| Função | Descrição |
|--------|-----------|
| `getEquipamentosAguardandoEntrada()` | Busca equipamentos aguardando entrada |
| `getEquipamentosEmRevisao()` | Busca equipamentos em revisão |
| `getEquipamentosAguardandoPecas()` | Busca equipamentos aguardando peças |
| `getEquipamentosProntosFechamento()` | Busca equipamentos prontos para fechamento |
| `adicionarEquipamento(dados)` | Adiciona novo equipamento |
| `atualizarStatusEquipamento(codigo, status)` | Atualiza status do equipamento |
| `getEstatisticasGerais()` | Busca estatísticas gerais |

## 🔧 Exemplo de Uso Completo

```javascript
import { 
  getEquipamentosAguardandoEntrada,
  adicionarEquipamento,
  testarConexaoBanco 
} from '../services/equipmentService.js';

const exemploCompleto = async () => {
  try {
    // 1. Testar conexão
    const conexaoOk = await testarConexaoBanco();
    if (!conexaoOk) {
      throw new Error('Falha na conexão com o banco');
    }

    // 2. Buscar equipamentos
    const equipamentos = await getEquipamentosAguardandoEntrada();
    console.log('Equipamentos encontrados:', equipamentos);

    // 3. Adicionar novo equipamento
    const novoEquipamento = {
      codigo: 'EQ-999',
      modelo: 'Notebook Dell Inspiron',
      descricao_problema: 'Tela quebrada',
      prioridade: 'URGENTE'
    };
    
    await adicionarEquipamento(novoEquipamento);
    console.log('Equipamento adicionado com sucesso!');

  } catch (error) {
    console.error('Erro:', error.message);
  }
};
```

## ⚠️ Importantes

### Segurança
- **Nunca** exponha credenciais do banco em código
- A senha está criptografada com AES-256
- Em produção, use variáveis de ambiente

### Performance
- O sistema usa **pool de conexões** para melhor performance
- Conexões são reutilizadas automaticamente
- Timeout configurado para 30 segundos

### Tratamento de Erros
- Sempre use try/catch ao chamar funções do banco
- Logs detalhados são gerados automaticamente
- Conexões são gerenciadas automaticamente

## 🔍 Debug e Monitoramento

Para verificar informações da conexão (sem expor a senha):
```javascript
import { getDbInfo } from '../config/database.js';

console.log('Informações do banco:', getDbInfo());
// Retorna: { server, database, user, port, encrypted: true }
```

## 📚 Dependências

- **mssql**: Driver oficial para SQL Server
- **crypto-js**: Biblioteca para criptografia AES

```bash
npm install mssql crypto-js
```

---

**✅ Sistema configurado e pronto para uso!** 