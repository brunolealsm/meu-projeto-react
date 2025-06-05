import sql from 'mssql';
import CryptoJS from 'crypto-js';

// Chave de criptografia (em produção, deve estar em variável de ambiente)
const ENCRYPTION_KEY = 'TechOffice2024@SecureKey';

// Função para criptografar dados
const encrypt = (text) => {
  return CryptoJS.AES.encrypt(text, ENCRYPTION_KEY).toString();
};

// Função para descriptografar dados
const decrypt = (ciphertext) => {
  const bytes = CryptoJS.AES.decrypt(ciphertext, ENCRYPTION_KEY);
  return bytes.toString(CryptoJS.enc.Utf8);
};

// Senha criptografada (sismic2010)
const encryptedPassword = encrypt('sismic2010');

// Configuração da conexão com o banco de dados
const dbConfig = {
  server: '192.168.0.152',
  database: 'DATACLASSIC',
  user: 'maquinas-usuarios',
  password: decrypt(encryptedPassword),
  port: 1433,
  options: {
    encrypt: false, // Para SQL Server local/interno
    trustServerCertificate: true,
    enableArithAbort: true,
    requestTimeout: 30000,
    connectionTimeout: 30000,
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
  }
};

// Pool de conexões
let poolPromise;

// Função para obter a conexão com o banco
export const getConnection = async () => {
  try {
    if (!poolPromise) {
      poolPromise = new sql.ConnectionPool(dbConfig).connect();
    }
    
    const pool = await poolPromise;
    console.log('✅ Conectado ao SQL Server com sucesso');
    return pool;
  } catch (error) {
    console.error('❌ Erro ao conectar com o banco de dados:', error.message);
    throw error;
  }
};

// Função para executar queries
export const executeQuery = async (query, params = {}) => {
  try {
    const pool = await getConnection();
    const request = pool.request();
    
    // Adicionar parâmetros se existirem
    for (const [key, value] of Object.entries(params)) {
      request.input(key, value);
    }
    
    const result = await request.query(query);
    return result;
  } catch (error) {
    console.error('❌ Erro ao executar query:', error.message);
    throw error;
  }
};

// Função para executar stored procedures
export const executeStoredProcedure = async (procedureName, params = {}) => {
  try {
    const pool = await getConnection();
    const request = pool.request();
    
    // Adicionar parâmetros se existirem
    for (const [key, value] of Object.entries(params)) {
      request.input(key, value);
    }
    
    const result = await request.execute(procedureName);
    return result;
  } catch (error) {
    console.error('❌ Erro ao executar stored procedure:', error.message);
    throw error;
  }
};

// Função para fechar a conexão (usar apenas quando necessário)
export const closeConnection = async () => {
  try {
    if (poolPromise) {
      const pool = await poolPromise;
      await pool.close();
      poolPromise = null;
      console.log('🔒 Conexão com o banco de dados fechada');
    }
  } catch (error) {
    console.error('❌ Erro ao fechar conexão:', error.message);
  }
};

// Função de teste de conexão
export const testConnection = async () => {
  try {
    const result = await executeQuery('SELECT GETDATE() as CurrentDateTime, @@VERSION as SQLVersion');
    console.log('🔍 Teste de conexão realizado com sucesso:', {
      dateTime: result.recordset[0].CurrentDateTime,
      version: result.recordset[0].SQLVersion.split('\n')[0]
    });
    return true;
  } catch (error) {
    console.error('❌ Falha no teste de conexão:', error.message);
    return false;
  }
};

// Configurações do banco (para debug - sem senha)
export const getDbInfo = () => {
  return {
    server: dbConfig.server,
    database: dbConfig.database,
    user: dbConfig.user,
    port: dbConfig.port,
    encrypted: true // Indica que a senha está criptografada
  };
};

export default {
  getConnection,
  executeQuery,
  executeStoredProcedure,
  closeConnection,
  testConnection,
  getDbInfo
}; 