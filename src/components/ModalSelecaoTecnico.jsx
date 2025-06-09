import React, { useState, useEffect } from 'react';
import { getTecnicosOficina, direcionarOrdensServico } from '../services/equipmentService';
import './ModalSelecaoTecnico.css';

const ModalSelecaoTecnico = ({ 
  isOpen, 
  onClose, 
  ordensServico = [], 
  onSucesso 
}) => {
  const [tecnicos, setTecnicos] = useState([]);
  const [tecnicoSelecionado, setTecnicoSelecionado] = useState('');
  const [loading, setLoading] = useState(false);
  const [processando, setProcessando] = useState(false);
  const [progresso, setProgresso] = useState([]);
  const [showProgresso, setShowProgresso] = useState(false);
  const [erro, setErro] = useState('');

  useEffect(() => {
    if (isOpen) {
      carregarTecnicos();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      // Reset do estado quando modal é fechado
      setTecnicoSelecionado('');
      setProgresso([]);
      setShowProgresso(false);
      setErro('');
      setProcessando(false);
    }
  }, [isOpen]);

  const carregarTecnicos = async () => {
    setLoading(true);
    setErro('');
    
    try {
      const tecnicosData = await getTecnicosOficina();
      setTecnicos(tecnicosData);
    } catch (error) {
      setErro('Erro ao carregar técnicos de oficina');
      console.error('Erro ao carregar técnicos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDirecionar = async () => {
    if (!tecnicoSelecionado) {
      setErro('Por favor, selecione um técnico');
      return;
    }

    setProcessando(true);
    setShowProgresso(true);
    setErro('');
    setProgresso([]);

    try {
      // Atualizar progresso - Iniciando
      setProgresso(prev => [...prev, {
        tipo: 'info',
        mensagem: `Iniciando direcionamento de ${ordensServico.length} ordem(ns) de serviço...`
      }]);

      const tecnico = tecnicos.find(t => t.cotec === tecnicoSelecionado);
      
      setProgresso(prev => [...prev, {
        tipo: 'info', 
        mensagem: `Direcionando para: ${tecnico?.name || 'Técnico selecionado'}`
      }]);

      const resultado = await direcionarOrdensServico(ordensServico, tecnicoSelecionado);

      if (resultado.sucesso) {
        // Mostrar progresso de sucesso
        setProgresso(prev => [...prev, {
          tipo: 'sucesso',
          mensagem: resultado.mensagem
        }]);

        // Mostrar detalhes dos resultados
        resultado.resultados.forEach(res => {
          setProgresso(prev => [...prev, {
            tipo: res.status === 'sucesso' ? 'sucesso' : 'erro',
            mensagem: `OS ${res.ordemServico}: ${res.mensagem}`
          }]);
        });

        setTimeout(() => {
          onSucesso && onSucesso();
          onClose();
        }, 2000);

      } else {
        // Mostrar erros
        setProgresso(prev => [...prev, {
          tipo: 'erro',
          mensagem: resultado.mensagem
        }]);

        resultado.resultados.forEach(res => {
          setProgresso(prev => [...prev, {
            tipo: res.status === 'sucesso' ? 'sucesso' : 'erro',
            mensagem: `OS ${res.ordemServico}: ${res.mensagem}`
          }]);
        });
      }
    } catch (error) {
      setProgresso(prev => [...prev, {
        tipo: 'erro',
        mensagem: `Erro ao direcionar ordens de serviço: ${error.message}`
      }]);
    } finally {
      setProcessando(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-selecao-tecnico">
        <div className="modal-header">
          <h2>Direcionar Ordens de Serviço</h2>
          <button 
            className="close-button" 
            onClick={onClose}
            disabled={processando}
          >
            ×
          </button>
        </div>

        <div className="modal-body">
          {!showProgresso ? (
            <>
              <div className="info-section">
                <p>
                  <strong>Ordens de serviço selecionadas:</strong> {ordensServico.length}
                </p>
                <div className="ordens-lista">
                  {ordensServico.map((os, index) => (
                    <span key={index} className="ordem-tag">
                      {os}
                    </span>
                  ))}
                </div>
              </div>

              <div className="tecnico-section">
                <h3>Selecionar Técnico de Oficina</h3>
                
                {loading ? (
                  <div className="loading">
                    <div className="spinner"></div>
                    <span>Carregando técnicos...</span>
                  </div>
                ) : (
                  <div className="tecnicos-lista">
                    {tecnicos.length === 0 ? (
                      <p className="no-tecnicos">Nenhum técnico de oficina encontrado</p>
                    ) : (
                      tecnicos.map(tecnico => (
                        <label key={tecnico.id} className="tecnico-option">
                          <input
                            type="radio"
                            name="tecnico"
                            value={tecnico.cotec}
                            checked={tecnicoSelecionado === tecnico.cotec}
                            onChange={(e) => setTecnicoSelecionado(e.target.value)}
                          />
                          <span className="tecnico-info">
                            <strong>{tecnico.name}</strong>
                          </span>
                        </label>
                      ))
                    )}
                  </div>
                )}

                {erro && (
                  <div className="error-message">
                    {erro}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="progresso-section">
              <h3>Progresso do Direcionamento</h3>
              <div className="progresso-lista">
                {progresso.map((item, index) => (
                  <div 
                    key={index} 
                    className={`progresso-item ${item.tipo}`}
                  >
                    <div className="progresso-icon">
                      {item.tipo === 'sucesso' && '✓'}
                      {item.tipo === 'erro' && '✗'}
                      {item.tipo === 'info' && 'ℹ'}
                    </div>
                    <span>{item.mensagem}</span>
                  </div>
                ))}
              </div>
              
              {processando && (
                <div className="loading-progress">
                  <div className="spinner"></div>
                  <span>Processando...</span>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="modal-footer">
          {!showProgresso ? (
            <>
              <button 
                className="btn-secondary" 
                onClick={onClose}
                disabled={processando}
              >
                Cancelar
              </button>
              <button 
                className="btn-primary" 
                onClick={handleDirecionar}
                disabled={!tecnicoSelecionado || loading || processando}
              >
                Direcionar
              </button>
            </>
          ) : (
            <button 
              className="btn-primary" 
              onClick={onClose}
              disabled={processando}
            >
              {processando ? 'Processando...' : 'Confirmar'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ModalSelecaoTecnico; 