import { useState, useEffect } from 'react'
import './App.css'
import { getEquipamentosAguardandoEntrada, getDetalhesEquipamento, getHistoricoOrdemServico } from './services/equipmentService.js'
// import jsPDF from 'jspdf'
// import 'jspdf-autotable'

function App() {
  const [activeSection, setActiveSection] = useState('dashboard')
  const [equipamentosAguardandoEntrada, setEquipamentosAguardandoEntrada] = useState([])
  const [totalQuantidadeAguardando, setTotalQuantidadeAguardando] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  
  // Estados para o modal de detalhes
  const [modalAberto, setModalAberto] = useState(false)
  const [equipamentoSelecionado, setEquipamentoSelecionado] = useState('')
  const [detalhesEquipamento, setDetalhesEquipamento] = useState([])
  const [loadingDetalhes, setLoadingDetalhes] = useState(false)
  const [errorDetalhes, setErrorDetalhes] = useState(null)
  
  // Estado para filtro de busca no modal
  const [filtroModal, setFiltroModal] = useState('')
  
  // Estados para menu de contexto
  const [contextMenu, setContextMenu] = useState({
    visible: false,
    x: 0,
    y: 0,
    item: null
  })

  // Estado para ordenação da tabela
  const [ordenacao, setOrdenacao] = useState({
    campo: null,
    direcao: 'asc' // 'asc' ou 'desc'
  })

  // Estado para menu de opções de exportação
  const [menuOpcoes, setMenuOpcoes] = useState(false)

  // Estados para o modal de histórico de OS
  const [modalHistoricoAberto, setModalHistoricoAberto] = useState(false)
  const [historicoOS, setHistoricoOS] = useState(null)
  const [loadingHistorico, setLoadingHistorico] = useState(false)
  const [errorHistorico, setErrorHistorico] = useState(null)

  const menuItems = [
    { 
      id: 'dashboard', 
      label: 'Dashboard', 
      icon: 'bi-clipboard2-data-fill',
      description: 'Visão geral das operações'
    },
    { 
      id: 'fila', 
      label: 'Fila de Serviço', 
      icon: 'bi-wrench',
      description: 'Gerenciar fila de manutenção'
    },
    { 
      id: 'estoque', 
      label: 'Estoque', 
      icon: 'bi-box-seam-fill',
      description: 'Equipamentos revisados'
    },
    { 
      id: 'retornos', 
      label: 'Retornos', 
      icon: 'bi-truck',
      description: 'Processo de retorno'
    }
  ]

  const statusCards = [
    { title: 'Em Manutenção', value: '24', trend: '+3', status: 'warning' },
    { title: 'Prontos', value: '156', trend: '+12', status: 'success' },
    { title: 'Aguardando', value: '8', trend: '-2', status: 'pending' },
    { title: 'Técnicos', value: '6', trend: '0', status: 'neutral' }
  ]

  // Função para carregar dados dos equipamentos aguardando entrada
  const carregarEquipamentosAguardandoEntrada = async () => {
    try {
      setLoading(true)
      setError(null)
      const dados = await getEquipamentosAguardandoEntrada()
      setEquipamentosAguardandoEntrada(dados)
      
      // Calcular total das quantidades
      const total = dados.reduce((acc, item) => acc + (item.quantidade || 0), 0)
      setTotalQuantidadeAguardando(total)
    } catch (err) {
      console.error('Erro ao carregar equipamentos:', err)
      setError('Erro ao carregar dados dos equipamentos')
      setTotalQuantidadeAguardando(0)
    } finally {
      setLoading(false)
    }
  }

  // Função para abrir modal com detalhes do equipamento
  const abrirModalDetalhes = async (nomeEquipamento) => {
    try {
      setEquipamentoSelecionado(nomeEquipamento)
      setModalAberto(true)
      setLoadingDetalhes(true)
      setErrorDetalhes(null)
      
      const detalhes = await getDetalhesEquipamento(nomeEquipamento)
      setDetalhesEquipamento(detalhes)
    } catch (err) {
      console.error('Erro ao carregar detalhes:', err)
      setErrorDetalhes('Erro ao carregar detalhes do equipamento')
    } finally {
      setLoadingDetalhes(false)
    }
  }

  // Função para fechar modal
  const fecharModal = () => {
    setModalAberto(false)
    setEquipamentoSelecionado('')
    setDetalhesEquipamento([])
    setErrorDetalhes(null)
    setFiltroModal('')
    setOrdenacao({ campo: null, direcao: 'asc' })
    setMenuOpcoes(false)
    fecharContextMenu()
  }

  // Função para formatar data em PT-BR
  const formatarData = (data) => {
    if (!data) return 'N/A'
    try {
      const date = new Date(data)
      return date.toLocaleDateString('pt-BR')
    } catch {
      return 'Data inválida'
    }
  }

  // Função para filtrar os detalhes do equipamento
  const filtrarDetalhes = () => {
    if (!filtroModal.trim()) return detalhesEquipamento
    
    const termoBusca = filtroModal.toLowerCase().trim()
    return detalhesEquipamento.filter(item => 
      (item.ntfisc || '').toString().toLowerCase().includes(termoBusca) ||
      (item.pedido || '').toString().toLowerCase().includes(termoBusca) ||
      (item.serie || '').toString().toLowerCase().includes(termoBusca) ||
      (item.motivoret || '').toString().toLowerCase().includes(termoBusca) ||
      (item.Cabo || '').toString().toLowerCase().includes(termoBusca) ||
      (item.Conferente || '').toString().toLowerCase().includes(termoBusca)
    )
  }

  // Função para ordenar dados por data de recebimento
  const ordenarDados = (dados) => {
    if (ordenacao.campo !== 'dtreceb') return dados

    return [...dados].sort((a, b) => {
      const dataA = new Date(a.dtreceb || '1900-01-01')
      const dataB = new Date(b.dtreceb || '1900-01-01')
      
      if (ordenacao.direcao === 'asc') {
        return dataA - dataB
      } else {
        return dataB - dataA
      }
    })
  }

  // Função para alternar ordenação
  const alternarOrdenacao = () => {
    setOrdenacao(prev => ({
      campo: 'dtreceb',
      direcao: prev.campo === 'dtreceb' && prev.direcao === 'asc' ? 'desc' : 'asc'
    }))
  }

  // Função para obter dados filtrados e ordenados
  const obterDadosProcessados = () => {
    const dadosFiltrados = filtrarDetalhes()
    return ordenarDados(dadosFiltrados)
  }

  // Função para calcular total de equipamentos
  const calcularTotalEquipamentos = () => {
    return obterDadosProcessados().length
  }

  // Função para exportar XLS
  const exportarXLS = () => {
    try {
      const dados = obterDadosProcessados()
      
      // Preparar dados para exportação
      const dadosExportacao = dados.map(item => ({
        'Nota Fiscal': item.ntfisc || '',
        'Pedido': item.pedido || '',
        'Número de Série': item.serie || '',
        'Motivo': item.motivoret || '',
        'Recebimento': formatarData(item.dtreceb),
        'Cabo': item.Cabo || '',
        'Conferente': item.Conferente || ''
      }))

      // Função para escapar valores CSV
      const escapeCsv = (value) => {
        if (value === null || value === undefined) return ''
        const stringValue = String(value)
        if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
          return `"${stringValue.replace(/"/g, '""')}"`
        }
        return stringValue
      }

      // Gerar cabeçalhos
      const headers = Object.keys(dadosExportacao[0] || {})
      const csvHeaders = headers.map(escapeCsv).join(',')

      // Gerar linhas de dados
      const csvRows = dadosExportacao.map(item => 
        headers.map(header => escapeCsv(item[header])).join(',')
      ).join('\n')

      // Combinar cabeçalhos e dados
      const csvContent = csvHeaders + '\n' + csvRows

      // Criar Blob com BOM para compatibilidade com Excel
      const BOM = '\uFEFF'
      const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' })

      // Criar URL e link para download
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      
      // Gerar nome do arquivo com data/hora
      const agora = new Date()
      const dataHora = agora.toISOString().slice(0, 19).replace(/[:-]/g, '').replace('T', '_')
      const nomeArquivo = `equipamentos_aguardando_entrada_${dataHora}.csv`
      
      link.href = url
      link.download = nomeArquivo
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      // Limpar recursos
      URL.revokeObjectURL(url)
      
      setMenuOpcoes(false)
      
      // Feedback para o usuário
      console.log(`Arquivo ${nomeArquivo} exportado com sucesso! Total: ${dados.length} equipamentos`)
    } catch (error) {
      console.error('Erro ao exportar CSV:', error)
      alert('Erro ao exportar arquivo: ' + error.message)
    }
  }

  // Função para exportar PDF usando impressão nativa do navegador
  const exportarPDF = () => {
    try {
      const dados = obterDadosProcessados()
      const total = dados.length

      // Obter data/hora atual
      const agora = new Date()
      const dataExportacao = agora.toLocaleDateString('pt-BR')
      const horaExportacao = agora.toLocaleTimeString('pt-BR')

      // Criar HTML para impressão
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>Equipamentos retornados sem entrada de nota fiscal</title>
          <style>
            @page {
              size: A4 portrait;
              margin: 20mm;
            }
            
            * {
              box-sizing: border-box;
            }
            
            body {
              font-family: Arial, sans-serif;
              margin: 0;
              padding: 0;
              color: #1e293b;
              font-size: 12px;
              line-height: 1.4;
            }
            
            .header {
              text-align: center;
              margin-bottom: 20px;
              border-bottom: 2px solid #e2e8f0;
              padding-bottom: 15px;
            }
            
            .title {
              font-size: 18px;
              font-weight: bold;
              margin-bottom: 10px;
              color: #1e293b;
            }
            
            .subtitle {
              font-size: 14px;
              color: #475569;
              margin-bottom: 20px;
            }
            
            .table-container {
              width: 100%;
              margin-bottom: 20px;
            }
            
            table {
              width: 100%;
              border-collapse: collapse;
              font-size: 10px;
            }
            
            th, td {
              padding: 8px 6px;
              text-align: left;
              border: 1px solid #d1d5db;
              word-wrap: break-word;
            }
            
            th {
              background-color: #f1f5f9;
              font-weight: bold;
              color: #475569;
            }
            
            tr:nth-child(even) {
              background-color: #f8fafc;
            }
            
            .footer {
              margin-top: 20px;
              padding-top: 15px;
              border-top: 1px solid #e2e8f0;
            }
            
            .total {
              font-weight: bold;
              font-size: 12px;
              margin-bottom: 10px;
            }
            
            .export-info {
              font-size: 10px;
              color: #64748b;
            }
            
            @media print {
              body { margin: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="title">Equipamentos retornados sem entrada de nota fiscal</div>
            <div class="subtitle">Equipamento: ${equipamentoSelecionado}</div>
          </div>
          
          <div class="table-container">
            <table>
              <thead>
                <tr>
                  <th>Nota Fiscal</th>
                  <th>Pedido</th>
                  <th>Número de Série</th>
                  <th>Motivo</th>
                  <th>Recebimento</th>
                  <th>Cabo</th>
                  <th>Conferente</th>
                </tr>
              </thead>
              <tbody>
                ${dados.map(item => `
                  <tr>
                    <td>${item.ntfisc || ''}</td>
                    <td>${item.pedido || ''}</td>
                    <td>${item.serie || ''}</td>
                    <td>${item.motivoret || ''}</td>
                    <td>${formatarData(item.dtreceb)}</td>
                    <td>${item.Cabo || ''}</td>
                    <td>${item.Conferente || ''}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
          
          <div class="footer">
            <div class="total">Total de equipamentos: ${total}</div>
            <div class="export-info">Relatório exportado em ${dataExportacao} às ${horaExportacao}</div>
          </div>
        </body>
        </html>
      `

      // Abrir nova janela com o conteúdo para impressão
      const printWindow = window.open('', '_blank', 'width=800,height=600')
      printWindow.document.write(htmlContent)
      printWindow.document.close()
      
      // Aguardar carregamento e iniciar impressão
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print()
          
          // Fechar janela após impressão (opcional)
          printWindow.onafterprint = () => {
            printWindow.close()
          }
        }, 250)
      }
      
      setMenuOpcoes(false)
      
      // Feedback para o usuário
      console.log(`PDF exportado com sucesso! Total: ${total} equipamentos`)
    } catch (error) {
      console.error('Erro ao exportar PDF:', error)
      alert('Erro ao exportar arquivo PDF: ' + error.message)
    }
  }

  // Funções para menu de contexto
  const handleContextMenu = (e, item) => {
    e.preventDefault()
    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      item: item
    })
  }

  const fecharContextMenu = () => {
    setContextMenu({
      visible: false,
      x: 0,
      y: 0,
      item: null
    })
  }

  const handleHistoricoOrdens = async (item) => {
    try {
      setLoadingHistorico(true)
      setErrorHistorico(null)
      setModalHistoricoAberto(true)
      fecharContextMenu()
      
      const dados = await getHistoricoOrdemServico(item.serie)
      setHistoricoOS(dados)
    } catch (err) {
      console.error('Erro ao carregar histórico de OS:', err)
      setErrorHistorico('Erro ao carregar histórico de ordens de serviço')
    } finally {
      setLoadingHistorico(false)
    }
  }

  // Função para fechar modal de histórico
  const fecharModalHistorico = () => {
    setModalHistoricoAberto(false)
    setHistoricoOS(null)
    setErrorHistorico(null)
  }

  // Função para imprimir histórico de OS
  const imprimirHistorico = () => {
    if (!historicoOS || !historicoOS.historico.length) {
      alert('Não há dados para imprimir')
      return
    }

    const agora = new Date()
    const dataFormatada = agora.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })

    const conteudoHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Histórico de Ordens de Serviço</title>
        <style>
          @page { size: A4 portrait; margin: 20mm; }
          body { font-family: Arial, sans-serif; font-size: 10px; margin: 0; padding: 0; }
          .header { text-align: center; margin-bottom: 20px; }
          .header h1 { font-size: 16px; margin: 0; }
          .header h2 { font-size: 14px; margin: 5px 0; }
          .info-section { margin: 15px 0; }
          .info-row { margin: 5px 0; }
          .info-label { font-weight: bold; }
          table { width: 100%; border-collapse: collapse; margin: 10px 0; }
          th, td { border: 1px solid #000; padding: 4px; text-align: left; font-size: 9px; }
          th { background-color: #f0f0f0; font-weight: bold; }
          .footer { position: fixed; bottom: 10mm; width: 100%; text-align: center; font-size: 8px; }
          @media print {
            .no-print { display: none; }
            body { -webkit-print-color-adjust: exact; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Histórico de Ordens de Serviço</h1>
          <h2>Equipamento: ${historicoOS.equipamento?.produto || 'N/A'} - Série: ${historicoOS.equipamento?.serie || 'N/A'}</h2>
        </div>
        
        <div class="info-section">
          <div class="info-row">
            <span class="info-label">Último atendimento:</span> ${formatarData(historicoOS.ultimoAtendimento)}
          </div>
          <div class="info-row">
            <span class="info-label">Última OS:</span> ${historicoOS.ultimaOS || 'N/A'}
          </div>
          <div class="info-row">
            <span class="info-label">Última vez atendida por:</span> ${historicoOS.ultimoTecnico || 'N/A'}
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>OS</th>
              <th>Data</th>
              <th>Motivo</th>
              <th>Técnico</th>
              <th>Fechamento</th>
              <th>Condição</th>
              <th>Cont. PB</th>
              <th>Cont. Cor</th>
              <th>Laudo</th>
            </tr>
          </thead>
          <tbody>
            ${historicoOS.historico.map(item => `
              <tr>
                <td>${item.os || ''}</td>
                <td>${formatarData(item.data)}</td>
                <td>${item.motivo || ''}</td>
                <td>${item.tecnico || ''}</td>
                <td>${formatarData(item.fechamento)}</td>
                <td>${item.condicao || ''}</td>
                <td>${item.contadorPB || ''}</td>
                <td>${item.contadorCor || ''}</td>
                <td>${item.laudo || ''}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="footer">
          <p>Relatório emitido em ${dataFormatada} - Página <span id="pageNumber"></span></p>
        </div>

        <script>
          window.onload = function() {
            window.print();
          }
        </script>
      </body>
      </html>
    `

    const novaJanela = window.open('', '_blank')
    novaJanela.document.write(conteudoHTML)
    novaJanela.document.close()
  }

  // useEffect para carregar dados quando a seção 'fila' for ativada
  useEffect(() => {
    if (activeSection === 'fila') {
      carregarEquipamentosAguardandoEntrada()
    }
  }, [activeSection])

  // useEffect para fechar menu de contexto ao clicar fora
  useEffect(() => {
    const handleClickOutside = () => {
      if (contextMenu.visible) {
        fecharContextMenu()
      }
      if (menuOpcoes) {
        setMenuOpcoes(false)
      }
    }

    const handleEscapeKey = (e) => {
      if (e.key === 'Escape') {
        if (contextMenu.visible) {
          fecharContextMenu()
        }
        if (menuOpcoes) {
          setMenuOpcoes(false)
        }
      }
    }

    if (contextMenu.visible || menuOpcoes) {
      document.addEventListener('click', handleClickOutside)
      document.addEventListener('keydown', handleEscapeKey)
    }

    return () => {
      document.removeEventListener('click', handleClickOutside)
      document.removeEventListener('keydown', handleEscapeKey)
    }
  }, [contextMenu.visible, menuOpcoes])

  return (
    <div className="app-container">
      {/* Header with Logo */}
      <header className="app-header">
        <div className="logo">
          <h1>Gestão Técnica - Oficina</h1>
        </div>
        
        <div className="header-actions">
          <button className="notification-btn">
            <i className="bi bi-bell"></i>
          </button>
        </div>
      </header>

      {/* Horizontal Navigation */}
      <nav className="horizontal-nav">
        {menuItems.map(item => (
          <button 
            key={item.id}
            className={`nav-button ${activeSection === item.id ? 'active' : ''}`}
            onClick={() => setActiveSection(item.id)}
          >
            <i className={`nav-icon bi ${item.icon}`}></i>
            <span className="nav-label">{item.label}</span>
          </button>
        ))}
      </nav>

      {/* Main Content */}
      <main className="main-content">
        <div className="content-area">
          {activeSection === 'dashboard' && (
            <div className="dashboard">
              <div className="status-cards">
                {statusCards.map((card, index) => (
                  <div key={index} className={`status-card ${card.status}`}>
                    <div className="card-header">
                      <h3>{card.title}</h3>
                      <span className={`trend ${card.trend.startsWith('+') ? 'positive' : card.trend.startsWith('-') ? 'negative' : 'neutral'}`}>
                        {card.trend}
                      </span>
                    </div>
                    <div className="card-value">{card.value}</div>
                  </div>
                ))}
              </div>

              <div className="dashboard-widgets">
                <div className="widget">
                  <div className="widget-header">
                    <h3>Alertas</h3>
                    <i className="widget-icon bi bi-exclamation-triangle"></i>
                  </div>
                  <div className="alert-list">
                    <div className="alert-item urgent">
                      <div className="alert-indicator"></div>
                      <div className="alert-content">
                        <strong>Equipamento EQ-001</strong>
                        <p>Manutenção urgente necessária</p>
                      </div>
                    </div>
                    <div className="alert-item warning">
                      <div className="alert-indicator"></div>
                      <div className="alert-content">
                        <strong>Técnico João Silva</strong>
                        <p>Sobrecarga de serviços</p>
                      </div>
                    </div>
                    <div className="alert-item info">
                      <div className="alert-indicator"></div>
                      <div className="alert-content">
                        <strong>Estoque baixo</strong>
                        <p>Peças de reposição</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="widget">
                  <div className="widget-header">
                    <h3>Resumo</h3>
                    <i className="widget-icon bi bi-graph-up"></i>
                  </div>
                  <div className="summary-stats">
                    <div className="stat">
                      <span className="stat-label">Produtividade</span>
                      <span className="stat-value">87%</span>
                    </div>
                    <div className="stat">
                      <span className="stat-label">Tempo Médio</span>
                      <span className="stat-value">4.2h</span>
                    </div>
                    <div className="stat">
                      <span className="stat-label">Satisfação</span>
                      <span className="stat-value">94%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'fila' && (
            <div className="kanban-board">
              <div className="kanban-column">
                <div className="column-header">
                  <h3>Aguardando entrada</h3>
                  <span className="column-count"><strong>{totalQuantidadeAguardando}</strong></span>
                </div>
                <div className="column-content">
                  <div className="kanban-card inventory-card">
                    <div className="inventory-table-container">
                      {loading && (
                        <div className="loading-message">
                          <i className="bi bi-arrow-clockwise spin"></i> Carregando dados...
                        </div>
                      )}
                      
                      {error && (
                        <div className="error-message">
                          <i className="bi bi-exclamation-triangle"></i> {error}
                          <button onClick={carregarEquipamentosAguardandoEntrada} className="retry-button">
                            Tentar novamente
                          </button>
                        </div>
                      )}
                      
                      {!loading && !error && (
                        <table className="inventory-table">
                          <thead>
                            <tr>
                              <th>Equipamento</th>
                              <th>Qtde</th>
                            </tr>
                          </thead>
                          <tbody>
                            {equipamentosAguardandoEntrada.length > 0 ? (
                              equipamentosAguardandoEntrada.map((item, index) => (
                                <tr 
                                  key={index} 
                                  className="clickable-row"
                                  onClick={() => abrirModalDetalhes(item.equipamento)}
                                  title="Clique para ver detalhes"
                                >
                                  <td>{item.equipamento || 'N/A'}</td>
                                  <td><span className="quantity-badge">{item.quantidade}</span></td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td colSpan="2" className="no-data">
                                  <i className="bi bi-inbox"></i>
                                  <span>Nenhum equipamento aguardando entrada</span>
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="kanban-column">
                <div className="column-header">
                  <h3>Aguardando revisão</h3>
                  <span className="column-count">(2)</span>
                </div>
                <div className="column-content">
                  <div className="kanban-card">
                    <div className="card-title">EQ-008</div>
                    <div className="card-description">Smartphone - Bateria viciada</div>
                    <div className="card-meta">
                      <span className="card-date">1 dia atrás</span>
                      <span className="card-priority medium">Normal</span>
                    </div>
                  </div>
                  <div className="kanban-card">
                    <div className="card-title">EQ-012</div>
                    <div className="card-description">Tablet - Touch não funciona</div>
                    <div className="card-meta">
                      <span className="card-date">4 horas atrás</span>
                      <span className="card-priority high">Urgente</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="kanban-column">
                <div className="column-header">
                  <h3>Posição de peças</h3>
                  <span className="column-count">(4)</span>
                </div>
                <div className="column-content">
                  <div className="kanban-card">
                    <div className="card-title">EQ-005</div>
                    <div className="card-description">Notebook Lenovo - Troca de HD</div>
                    <div className="card-meta">
                      <span className="card-date">3 dias atrás</span>
                      <span className="card-status waiting">Aguardando peça</span>
                    </div>
                  </div>
                  <div className="kanban-card">
                    <div className="card-title">EQ-018</div>
                    <div className="card-description">Desktop - Fonte queimada</div>
                    <div className="card-meta">
                      <span className="card-date">2 dias atrás</span>
                      <span className="card-status waiting">Aguardando peça</span>
                    </div>
                  </div>
                  <div className="kanban-card">
                    <div className="card-title">EQ-021</div>
                    <div className="card-description">Impressora - Cabeçote</div>
                    <div className="card-meta">
                      <span className="card-date">5 dias atrás</span>
                      <span className="card-status waiting">Aguardando peça</span>
                    </div>
                  </div>
                  <div className="kanban-card">
                    <div className="card-title">EQ-029</div>
                    <div className="card-description">Monitor - Cabo de força</div>
                    <div className="card-meta">
                      <span className="card-date">1 dia atrás</span>
                      <span className="card-status arrived">Peça chegou</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="kanban-column">
                <div className="column-header">
                  <h3>Fechamento de OS</h3>
                  <span className="column-count">(2)</span>
                </div>
                <div className="column-content">
                  <div className="kanban-card">
                    <div className="card-title">EQ-003</div>
                    <div className="card-description">Notebook Acer - Limpeza completa</div>
                    <div className="card-meta">
                      <span className="card-date">Hoje</span>
                      <span className="card-status completed">Concluído</span>
                    </div>
                  </div>
                  <div className="kanban-card">
                    <div className="card-title">EQ-011</div>
                    <div className="card-description">Desktop - Formatação</div>
                    <div className="card-meta">
                      <span className="card-date">Hoje</span>
                      <span className="card-status completed">Concluído</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'estoque' && (
            <div className="section-placeholder">
              <div className="placeholder-content">
                <i className="placeholder-icon bi bi-box-seam-fill"></i>
                <h2>Controle de Estoque</h2>
                <p>Módulo para equipamentos revisados e prontos</p>
                <button className="cta-button">Configurar Módulo</button>
              </div>
            </div>
          )}

          {activeSection === 'retornos' && (
            <div className="section-placeholder">
              <div className="placeholder-content">
                <i className="placeholder-icon bi bi-truck"></i>
                <h2>Processo de Retornos</h2>
                <p>Módulo para retorno de equipamentos locados</p>
                <button className="cta-button">Configurar Módulo</button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Modal de Detalhes do Equipamento */}
      {modalAberto && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <div className="modal-header-content">
                <div className="modal-title-section">
                  <h2>Equipamentos retornados sem entrada de nota fiscal</h2>
                  <div className="modal-subtitle">
                    <strong>Equipamento:</strong> {equipamentoSelecionado}
                  </div>
                </div>
                <div className="modal-search-section">
                  <input
                    type="text"
                    placeholder="Buscar na tabela..."
                    value={filtroModal}
                    onChange={(e) => setFiltroModal(e.target.value)}
                    className="modal-search-input"
                  />
                  <i className="bi bi-search modal-search-icon"></i>
                  
                  {/* Botão de Opções */}
                  <div className="options-dropdown">
                    <button 
                      className="options-button"
                      onClick={(e) => {
                        e.stopPropagation()
                        setMenuOpcoes(!menuOpcoes)
                      }}
                      title="Opções de exportação"
                    >
                      <i className="bi bi-three-dots-vertical"></i>
                    </button>
                    
                    {menuOpcoes && (
                      <div className="options-menu">
                        <div className="options-menu-item" onClick={exportarXLS}>
                          <i className="bi bi-file-earmark-excel"></i>
                          Exportar CSV (Excel)
                        </div>
                        <div className="options-menu-item" onClick={exportarPDF}>
                          <i className="bi bi-file-earmark-pdf"></i>
                          Exportar PDF
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-body">
              {loadingDetalhes && (
                <div className="loading-message">
                  <i className="bi bi-arrow-clockwise spin"></i> Carregando detalhes...
                </div>
              )}

              {errorDetalhes && (
                <div className="error-message">
                  <i className="bi bi-exclamation-triangle"></i> {errorDetalhes}
                </div>
              )}

              {!loadingDetalhes && !errorDetalhes && (
                <div className="details-table-container">
                  <table className="details-table">
                    <thead>
                      <tr>
                        <th>Nota Fiscal</th>
                        <th>Pedido</th>
                        <th>Número de Série</th>
                        <th>Motivo</th>
                        <th 
                          className="sortable-header"
                          onClick={alternarOrdenacao}
                          title="Clique para ordenar por data"
                        >
                          Recebimento
                          {ordenacao.campo === 'dtreceb' && (
                            <i className={`bi ${ordenacao.direcao === 'asc' ? 'bi-arrow-up' : 'bi-arrow-down'} sort-icon`}></i>
                          )}
                        </th>
                        <th>Cabo</th>
                        <th>Conferente</th>
                      </tr>
                    </thead>
                    <tbody>
                      {obterDadosProcessados().length > 0 ? (
                        obterDadosProcessados().map((item, index) => (
                          <tr 
                            key={index}
                            onContextMenu={(e) => handleContextMenu(e, item)}
                            style={{ cursor: 'context-menu' }}
                          >
                            <td>{item.ntfisc || 'N/A'}</td>
                            <td>{item.pedido || 'N/A'}</td>
                            <td>{item.serie || 'N/A'}</td>
                            <td>{item.motivoret || 'N/A'}</td>
                            <td>{formatarData(item.dtreceb)}</td>
                            <td>{item.Cabo || 'N/A'}</td>
                            <td>{item.Conferente || 'N/A'}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="7" className="no-data">
                            <i className="bi bi-inbox"></i>
                            <span>
                              {filtroModal.trim() 
                                ? 'Nenhum resultado encontrado para a busca' 
                                : 'Nenhum detalhe encontrado'
                              }
                            </span>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <div className="modal-totalizador">
                <i className="bi bi-list-ol"></i>
                <span>Total de equipamentos: <strong>{calcularTotalEquipamentos()}</strong></span>
              </div>
              <button className="modal-close-btn" onClick={fecharModal}>
                <i className="bi bi-x-circle"></i> Sair
              </button>
            </div>
          </div>

          {/* Menu de Contexto */}
          {contextMenu.visible && (
            <div 
              className="context-menu"
              style={{
                position: 'fixed',
                top: contextMenu.y,
                left: contextMenu.x,
                zIndex: 1001
              }}
            >
              <div 
                className="context-menu-item"
                onClick={() => handleHistoricoOrdens(contextMenu.item)}
              >
                <i className="bi bi-clock-history"></i>
                Histórico de ordens de serviço
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal de Histórico de Ordens de Serviço */}
      {modalHistoricoAberto && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <div className="modal-header-content">
                <div className="modal-title-section">
                  <h2>Histórico de Ordens de Serviço</h2>
                  {historicoOS?.equipamento && (
                    <div className="modal-subtitle">
                      <strong>Equipamento:</strong> {historicoOS.equipamento.produto} - <strong>Série:</strong> {historicoOS.equipamento.serie}
                    </div>
                  )}
                  {!loadingHistorico && !errorHistorico && historicoOS && (
                    <div className="modal-info-line">
                      Último atendimento: {formatarData(historicoOS.ultimoAtendimento)} | Última OS: {historicoOS.ultimaOS || ''} | Última vez atendida por: {historicoOS.ultimoTecnico || ''}
                    </div>
                  )}
                </div>
                <div className="modal-actions-right">
                  <button 
                    className="modal-action-btn"
                    onClick={imprimirHistorico}
                    title="Imprimir histórico"
                    disabled={loadingHistorico || !historicoOS?.historico?.length}
                  >
                    <i className="bi bi-printer"></i>
                    Imprimir
                  </button>
                </div>
              </div>
            </div>

            <div className="modal-body">
              {loadingHistorico && (
                <div className="loading-message">
                  <i className="bi bi-arrow-clockwise spin"></i> Carregando histórico...
                </div>
              )}

              {errorHistorico && (
                <div className="error-message">
                  <i className="bi bi-exclamation-triangle"></i> {errorHistorico}
                </div>
              )}

              {!loadingHistorico && !errorHistorico && historicoOS && (
                <>
                  {/* Tabela de Histórico */}
                  <div className="historico-table-container">
                    <table className="historico-table">
                      <thead>
                        <tr>
                          <th>OS</th>
                          <th>Data</th>
                          <th>Motivo</th>
                          <th>Técnico</th>
                          <th>Fechamento</th>
                          <th>Condição</th>
                          <th>Cont. PB</th>
                          <th>Cont. Cor</th>
                          <th>Laudo</th>
                        </tr>
                      </thead>
                      <tbody>
                        {historicoOS.historico.length > 0 ? (
                          historicoOS.historico.map((item, index) => (
                            <tr key={index}>
                              <td>{item.os || ''}</td>
                              <td>{formatarData(item.data)}</td>
                              <td>{item.motivo || ''}</td>
                              <td>{item.tecnico || ''}</td>
                              <td>{formatarData(item.fechamento)}</td>
                              <td>{item.condicao || ''}</td>
                              <td>{item.contadorPB || ''}</td>
                              <td>{item.contadorCor || ''}</td>
                              <td style={{ maxWidth: '200px', wordBreak: 'break-word' }}>
                                {item.laudo || ''}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="9" className="no-data">
                              <i className="bi bi-inbox"></i>
                              <span>Nenhum histórico encontrado para esta série</span>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>

            <div className="modal-footer">
              <div className="modal-totalizador">
                <i className="bi bi-list-ol"></i>
                <span>Total de registros: <strong>{historicoOS?.historico?.length || 0}</strong></span>
              </div>
              <button className="modal-action-btn" onClick={fecharModalHistorico}>
                <i className="bi bi-x-circle"></i> Sair
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App 