import { useState, useEffect } from 'react'
import './App.css'
import { getEquipamentosAguardandoEntrada, getDetalhesEquipamento, getHistoricoOrdemServico, getEquipamentosAguardandoRevisao, getDetalhesEquipamentoRevisao } from './services/equipmentService.js'
import ModalSelecaoTecnico from './components/ModalSelecaoTecnico.jsx'
// import jsPDF from 'jspdf'
// import 'jspdf-autotable'

function App() {
  const [activeSection, setActiveSection] = useState('dashboard')
  const [equipamentosAguardandoEntrada, setEquipamentosAguardandoEntrada] = useState([])
  const [totalQuantidadeAguardando, setTotalQuantidadeAguardando] = useState(0)
  const [equipamentosAguardandoRevisao, setEquipamentosAguardandoRevisao] = useState([])
  const [totalQuantidadeRevisao, setTotalQuantidadeRevisao] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  
  // Estado para o botão de atualização do menu
  const [atualizandoDados, setAtualizandoDados] = useState(false)
  
  // Estados para o modal de detalhes
  const [modalAberto, setModalAberto] = useState(false)
  const [equipamentoSelecionado, setEquipamentoSelecionado] = useState('')
  const [detalhesEquipamento, setDetalhesEquipamento] = useState([])
  const [loadingDetalhes, setLoadingDetalhes] = useState(false)
  const [errorDetalhes, setErrorDetalhes] = useState(null)
  const [modalTeste, setModalTeste] = useState(false) // Flag para indicar se o modal está em modo teste
  
  // Estado para filtro de busca no modal
  const [filtroModal, setFiltroModal] = useState('')
  
  // Estados para menu de contexto
  const [contextMenu, setContextMenu] = useState({
    visible: false,
    x: 0,
    y: 0,
    item: null,
    isTeste: false // Flag para identificar se é dados de teste
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

  // Estados para seleção de registros no modal de revisão
  const [registrosSelecionados, setRegistrosSelecionados] = useState(new Set())
  const [selecionarTodos, setSelecionarTodos] = useState(false)
  const [modoSelecaoAtivo, setModoSelecaoAtivo] = useState(false)

  // Estados para modal de seleção de técnico
  const [modalTecnicoAberto, setModalTecnicoAberto] = useState(false)

  // Estados para o filtro hierárquico
  const [filtroHierarquicoAberto, setFiltroHierarquicoAberto] = useState(false)
  const [filtrosMarcaSelecionadas, setFiltrosMarcaSelecionadas] = useState(new Set())
  const [filtrosSubgrupoSelecionados, setFiltrosSubgrupoSelecionados] = useState(new Set())
  const [filtroAtivo, setFiltroAtivo] = useState(false)
  const [dadosFiltro, setDadosFiltro] = useState({ marcas: [], subgrupos: [] })



  // Dados de exemplo para detalhes de equipamentos em revisão
  const detalhesExemploRevisao = [
    {
      id: 1,
      ntfisc: '12345',
      pedido: 'PED001',
      serie: 'HP001234',
      motivoret: 'Revisão preventiva',
      dtreceb: '2024-01-15',
      Cabo: 'Sim',
      Conferente: 'João Silva'
    },
    {
      id: 2,
      ntfisc: '12346',
      pedido: 'PED002',
      serie: 'CN005678',
      motivoret: 'Manutenção corretiva',
      dtreceb: '2024-01-16',
      Cabo: 'Não',
      Conferente: 'Maria Santos'
    },
    {
      id: 3,
      ntfisc: '12347',
      pedido: 'PED003',
      serie: 'EP009012',
      motivoret: 'Limpeza e revisão',
      dtreceb: '2024-01-17',
      Cabo: 'Sim',
      Conferente: 'Pedro Costa'
    },
    {
      id: 4,
      ntfisc: '12348',
      pedido: 'PED004',
      serie: 'FJ003456',
      motivoret: 'Calibração',
      dtreceb: '2024-01-18',
      Cabo: 'Sim',
      Conferente: 'Ana Oliveira'
    }
  ]

  // Dados de exemplo para histórico de OS
  const historicoExemplo = {
    equipamento: {
      serie: 'HP001234',
      produto: 'IMPRESSORA HP LASERJET'
    },
    ultimoAtendimento: '2024-01-10',
    ultimaOS: '12345',
    ultimoTecnico: 'Carlos Mendes',
    historico: [
      {
        os: '12345',
        data: '2024-01-05',
        motivo: 'Revisão preventiva',
        tecnico: 'Carlos Mendes',
        fechamento: '2024-01-10',
        condicao: '1-BOM',
        contadorPB: 15000,
        contadorCor: 5000,
        laudo: 'Equipamento revisado completamente. Substituído toner e kit de manutenção.'
      },
      {
        os: '11234',
        data: '2023-12-15',
        motivo: 'Manutenção corretiva',
        tecnico: 'Ana Ferreira',
        fechamento: '2023-12-20',
        condicao: '2-REGULAR',
        contadorPB: 14500,
        contadorCor: 4800,
        laudo: 'Reparo no sistema de alimentação de papel.'
      },
      {
        os: '10123',
        data: '2023-11-20',
        motivo: 'Limpeza geral',
        tecnico: 'Roberto Lima',
        fechamento: '2023-11-22',
        condicao: '1-BOM',
        contadorPB: 14000,
        contadorCor: 4500,
        laudo: 'Limpeza completa realizada. Equipamento funcionando perfeitamente.'
      }
    ]
  }

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

  // Função para carregar dados dos equipamentos aguardando revisão
  const carregarEquipamentosAguardandoRevisao = async () => {
    try {
      // Se há filtro ativo, buscar dados detalhados e agrupar
      if (filtroAtivo && filtrosSubgrupoSelecionados.size > 0) {
        const response = await fetch('http://localhost:3001/api/equipment/aguardando-revisao/detalhes')
        if (!response.ok) {
          throw new Error(`Erro HTTP: ${response.status}`)
        }
        
        const result = await response.json()
        const dadosDetalhados = result.data || result
        
        // Filtrar dados baseado nas seleções hierárquicas
        const dadosFiltrados = dadosDetalhados.filter(item => {
          const marca = item.TB01047_NOME || 'Sem marca'
          const subgrupo = item.TB01018_NOME || 'Sem subgrupo'
          const chave = `${marca}|${subgrupo}`
          return filtrosSubgrupoSelecionados.has(chave)
        })
        
        // Agrupar por equipamento
        const equipamentosAgrupados = dadosFiltrados.reduce((acc, item) => {
          const nomeEquipamento = item.TB01010_NOME
          if (!acc[nomeEquipamento]) {
            acc[nomeEquipamento] = 0
          }
          acc[nomeEquipamento]++
          return acc
        }, {})
        
        // Converter para formato esperado
        const equipamentosFiltrados = Object.entries(equipamentosAgrupados).map(([equipamento, quantidade]) => ({
          equipamento,
          quantidade: quantidade
        }))
        
        setEquipamentosAguardandoRevisao(equipamentosFiltrados)
        
        // Calcular total de quantidade
        const total = equipamentosFiltrados.reduce((acc, item) => acc + (item.quantidade || 0), 0)
        setTotalQuantidadeRevisao(total)
        
      } else {
        // Carregar dados normais sem filtro
        const dados = await getEquipamentosAguardandoRevisao()
        setEquipamentosAguardandoRevisao(dados)
        
        // Calcular total das quantidades
        const total = dados.reduce((acc, item) => acc + (item.quantidade || 0), 0)
        setTotalQuantidadeRevisao(total)
      }
      
    } catch (err) {
      console.error('Erro ao carregar equipamentos em revisão:', err)
      setTotalQuantidadeRevisao(0)
    }
  }

  // Função para abrir modal com detalhes do equipamento
  const abrirModalDetalhes = async (nomeEquipamento) => {
    try {
      setEquipamentoSelecionado(nomeEquipamento)
      setModalAberto(true)
      setModalTeste(false)
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

  // Função para abrir modal com dados reais (Aguardando Revisão)
  const abrirModalDetalhesRevisao = async (nomeEquipamento) => {
    try {
      setEquipamentoSelecionado(nomeEquipamento)
      setModalAberto(true)
      setModalTeste(true)
      setLoadingDetalhes(true)
      setErrorDetalhes(null)
      
      const detalhes = await getDetalhesEquipamentoRevisao(nomeEquipamento)
      setDetalhesEquipamento(detalhes)
    } catch (err) {
      console.error('Erro ao carregar detalhes do equipamento em revisão:', err)
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
    setModalTeste(false)
    setFiltroModal('')
    setOrdenacao({ campo: null, direcao: 'asc' })
    setMenuOpcoes(false)
    setRegistrosSelecionados(new Set())
    setSelecionarTodos(false)
    setModoSelecaoAtivo(false)
    fecharContextMenu()
  }

  // Funções para gerenciar seleção de registros
  const toggleSelecionarTodos = () => {
    const dadosProcessados = obterDadosProcessados()
    if (selecionarTodos) {
      // Desmarcar todos
      setRegistrosSelecionados(new Set())
      setSelecionarTodos(false)
    } else {
      // Marcar todos
      const todosIds = new Set(dadosProcessados.map((_, index) => index))
      setRegistrosSelecionados(todosIds)
      setSelecionarTodos(true)
    }
  }

  const toggleSelecionarRegistro = (index) => {
    const novaSelecao = new Set(registrosSelecionados)
    if (novaSelecao.has(index)) {
      novaSelecao.delete(index)
    } else {
      novaSelecao.add(index)
    }
    setRegistrosSelecionados(novaSelecao)
    
    // Atualizar estado do "selecionar todos"
    const dadosProcessados = obterDadosProcessados()
    setSelecionarTodos(novaSelecao.size === dadosProcessados.length && dadosProcessados.length > 0)
  }

  const obterRegistrosSelecionados = () => {
    const dadosProcessados = obterDadosProcessados()
    return Array.from(registrosSelecionados).map(index => dadosProcessados[index]).filter(Boolean)
  }

  const ativarModoSelecao = () => {
    setModoSelecaoAtivo(true)
    setMenuOpcoes(false)
  }

  // Função para abrir modal de seleção de técnico
  const abrirModalTecnico = () => {
    const registros = obterRegistrosSelecionados()
    if (registros.length === 0) return
    
    setModalTecnicoAberto(true)
  }

  // Função para fechar modal de técnico
  const fecharModalTecnico = () => {
    setModalTecnicoAberto(false)
  }

  // Função para lidar com sucesso do direcionamento
  const handleSucessoDirecionamento = async () => {
    // Atualizar dados do modal
    if (modalTeste && equipamentoSelecionado) {
      await abrirModalDetalhesRevisao(equipamentoSelecionado)
    }
    
    // Atualizar dados da coluna
    await carregarEquipamentosAguardandoRevisao()
    
    // Resetar seleções
    setRegistrosSelecionados(new Set())
    setSelecionarTodos(false)
    setModoSelecaoAtivo(false)
    
    // Fechar modal de técnico
    setModalTecnicoAberto(false)
  }

  // Funções para o filtro hierárquico
  const prepararDadosFiltro = (dados) => {
    const marcas = new Map()
    
    dados.forEach(item => {
      const marca = item.TB01047_NOME || 'Sem marca'
      const subgrupo = item.TB01018_NOME || 'Sem subgrupo'
      
      if (!marcas.has(marca)) {
        marcas.set(marca, new Set())
      }
      marcas.get(marca).add(subgrupo)
    })
    
    const dadosEstruturados = {
      marcas: Array.from(marcas.keys()).map(marca => ({
        nome: marca,
        subgrupos: Array.from(marcas.get(marca)).map(sub => ({ nome: sub }))
      }))
    }
    
    setDadosFiltro(dadosEstruturados)
  }

  const abrirFiltroHierarquico = async () => {
    if (filtroHierarquicoAberto) {
      setFiltroHierarquicoAberto(false)
      return
    }
    
    try {
      // Buscar todos os dados da coluna para preparar o filtro
      const response = await fetch('http://localhost:3001/api/equipment/aguardando-revisao/detalhes')
      if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status}`)
      }
      const result = await response.json()
      const dados = result.data || result // Acessar propriedade 'data' ou usar resultado direto
      prepararDadosFiltro(dados)
      setFiltroHierarquicoAberto(true)
    } catch (error) {
      console.error('Erro ao carregar dados para filtro:', error)
      // Se falhar na API, usar dados de teste
      const dadosTesteTemp = {
        marcas: [
          {
            nome: 'BROTHER',
            subgrupos: [
              { nome: 'IMPRESSORA' },
              { nome: 'MULTIFUNCIONAL' }
            ]
          },
          {
            nome: 'HP',
            subgrupos: [
              { nome: 'IMPRESSORA' },
              { nome: 'SCANNER' }
            ]
          }
        ]
      }
      setDadosFiltro(dadosTesteTemp)
      setFiltroHierarquicoAberto(true)
    }
  }

  const fecharFiltroHierarquico = () => {
    setFiltroHierarquicoAberto(false)
  }

  const toggleMarcaFiltro = (marca) => {
    const novasMarcas = new Set(filtrosMarcaSelecionadas)
    const novosSubgrupos = new Set(filtrosSubgrupoSelecionados)
    
    if (novasMarcas.has(marca)) {
      // Desmarcar marca e todos os subgrupos dela
      novasMarcas.delete(marca)
      const marcaObj = dadosFiltro.marcas.find(m => m.nome === marca)
      if (marcaObj) {
        marcaObj.subgrupos.forEach(sub => {
          novosSubgrupos.delete(`${marca}|${sub.nome}`)
        })
      }
    } else {
      // Marcar marca e todos os subgrupos dela
      novasMarcas.add(marca)
      const marcaObj = dadosFiltro.marcas.find(m => m.nome === marca)
      if (marcaObj) {
        marcaObj.subgrupos.forEach(sub => {
          novosSubgrupos.add(`${marca}|${sub.nome}`)
        })
      }
    }
    
    setFiltrosMarcaSelecionadas(novasMarcas)
    setFiltrosSubgrupoSelecionados(novosSubgrupos)
  }

  const toggleSubgrupoFiltro = (marca, subgrupo) => {
    const chave = `${marca}|${subgrupo}`
    const novosSubgrupos = new Set(filtrosSubgrupoSelecionados)
    const novasMarcas = new Set(filtrosMarcaSelecionadas)
    
    if (novosSubgrupos.has(chave)) {
      novosSubgrupos.delete(chave)
      // Verificar se ainda tem outros subgrupos da marca selecionados
      const marcaObj = dadosFiltro.marcas.find(m => m.nome === marca)
      if (marcaObj) {
        const temOutrosSubgrupos = marcaObj.subgrupos.some(sub => 
          sub.nome !== subgrupo && novosSubgrupos.has(`${marca}|${sub.nome}`)
        )
        if (!temOutrosSubgrupos) {
          novasMarcas.delete(marca)
        }
      }
    } else {
      novosSubgrupos.add(chave)
      // Verificar se todos os subgrupos da marca estão selecionados
      const marcaObj = dadosFiltro.marcas.find(m => m.nome === marca)
      if (marcaObj) {
        const todosSubgruposSelecionados = marcaObj.subgrupos.every(sub => 
          novosSubgrupos.has(`${marca}|${sub.nome}`)
        )
        if (todosSubgruposSelecionados) {
          novasMarcas.add(marca)
        }
      }
    }
    
    setFiltrosSubgrupoSelecionados(novosSubgrupos)
    setFiltrosMarcaSelecionadas(novasMarcas)
  }

  const aplicarFiltroHierarquico = async () => {
    setFiltroAtivo(filtrosSubgrupoSelecionados.size > 0)
    setFiltroHierarquicoAberto(false)
    
    // Recarregar dados da coluna com filtro aplicado
    await carregarEquipamentosAguardandoRevisao()
  }

  const limparFiltroHierarquico = async () => {
    setFiltrosMarcaSelecionadas(new Set())
    setFiltrosSubgrupoSelecionados(new Set())
    setFiltroAtivo(false)
    setFiltroHierarquicoAberto(false)
    
    // Recarregar dados da coluna sem filtro
    await carregarEquipamentosAguardandoRevisao()
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

  // Função para formatar data e hora em PT-BR (dd/MM/yyyy hh:mm)
  const formatarDataHora = (data) => {
    if (!data) return 'N/A'
    try {
      const date = new Date(data)
      return date.toLocaleDateString('pt-BR') + ' ' + date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    } catch {
      return 'Data inválida'
    }
  }

  // Função para formatar números com pontuação de milhar
  const formatarNumero = (numero) => {
    if (!numero || numero === 0 || numero === '0') return ''
    try {
      return parseInt(numero).toLocaleString('pt-BR')
    } catch {
      return ''
    }
  }

  // Função para filtrar os detalhes do equipamento
  const filtrarDetalhes = () => {
    if (!filtroModal.trim()) return detalhesEquipamento
    
    const termoBusca = filtroModal.toLowerCase().trim()
    
    if (modalTeste) {
      // Filtro para dados de Aguardando Revisão
      return detalhesEquipamento.filter(item => 
        (item.codprod || '').toString().toLowerCase().includes(termoBusca) ||
        (item.serie || '').toString().toLowerCase().includes(termoBusca) ||
        (item.OS_REVISAO || '').toString().toLowerCase().includes(termoBusca) ||
        (item.OS_REVISAO_DIAS || '').toString().toLowerCase().includes(termoBusca)
      )
    } else {
      // Filtro para dados de Aguardando Entrada
      return detalhesEquipamento.filter(item => 
        (item.ntfisc || '').toString().toLowerCase().includes(termoBusca) ||
        (item.pedido || '').toString().toLowerCase().includes(termoBusca) ||
        (item.serie || '').toString().toLowerCase().includes(termoBusca) ||
        (item.motivoret || '').toString().toLowerCase().includes(termoBusca) ||
        (item.Cabo || '').toString().toLowerCase().includes(termoBusca) ||
        (item.Conferente || '').toString().toLowerCase().includes(termoBusca)
      )
    }
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
      
      // Preparar dados para exportação baseado no tipo de modal
      let dadosExportacao
      
      if (modalTeste) {
        // Dados para Aguardando Revisão
        dadosExportacao = dados.map(item => ({
          'Código': item.codprod || '',
          'Número de Série': item.serie || '',
          'Ordem de Serviço': item.OS_REVISAO || '',
          'Data de Abertura': formatarDataHora(item.OS_REVISAO_DATA),
          'Últ. Cont. PB': formatarNumero(item.ULT_CONTADOR_PB),
          'Últ. Cont. Cor': formatarNumero(item.ULT_CONTADOR_COR),
          'Fech. c/ peça': item.QTDE_OS_PECA || '',
          'Fech. c/ troca': item.QTDE_OS_TROCA || ''
        }))
      } else {
        // Dados para Aguardando Entrada
        dadosExportacao = dados.map(item => ({
          'Nota Fiscal': item.ntfisc || '',
          'Pedido': item.pedido || '',
          'Número de Série': item.serie || '',
          'Motivo': item.motivoret || '',
          'Recebimento': formatarData(item.dtreceb),
          'Cabo': item.Cabo || '',
          'Conferente': item.Conferente || ''
        }))
      }

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
      const tipoRelatorio = modalTeste ? 'aguardando_revisao' : 'aguardando_entrada'
      const nomeArquivo = `equipamentos_${tipoRelatorio}_${dataHora}.csv`
      
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
      const tituloRelatorio = modalTeste ? 'Equipamentos aguardando revisão técnica' : 'Equipamentos retornados sem entrada de nota fiscal'
      
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>${tituloRelatorio}</title>
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
            
            .center {
              text-align: center;
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
            <div class="title">${tituloRelatorio}</div>
            <div class="subtitle">Equipamento: ${equipamentoSelecionado}</div>
          </div>
          
          <div class="table-container">
            <table>
              <thead>
                <tr>
                  ${modalTeste ? `
                    <th>Código</th>
                    <th>Número de Série</th>
                    <th>Ordem de Serviço</th>
                    <th>Data de Abertura</th>
                    <th class="center">Últ. Cont. PB</th>
                    <th class="center">Últ. Cont. Cor</th>
                    <th class="center">Fech. c/ peça</th>
                    <th class="center">Fech. c/ troca</th>
                  ` : `
                    <th>Nota Fiscal</th>
                    <th>Pedido</th>
                    <th>Número de Série</th>
                    <th>Motivo</th>
                    <th>Recebimento</th>
                    <th>Cabo</th>
                    <th>Conferente</th>
                  `}
                </tr>
              </thead>
              <tbody>
                ${dados.map(item => modalTeste ? `
                  <tr>
                    <td>${item.codprod || ''}</td>
                    <td>${item.serie || ''}</td>
                    <td>${item.OS_REVISAO || ''}</td>
                    <td>${formatarDataHora(item.OS_REVISAO_DATA)}</td>
                    <td class="center">${formatarNumero(item.ULT_CONTADOR_PB)}</td>
                    <td class="center">${formatarNumero(item.ULT_CONTADOR_COR)}</td>
                    <td class="center">${item.QTDE_OS_PECA || ''}</td>
                    <td class="center">${item.QTDE_OS_TROCA || ''}</td>
                  </tr>
                ` : `
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
  const handleContextMenu = (e, item, isTeste = false) => {
    e.preventDefault()
    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      item: item,
      isTeste: isTeste
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

  // Função para histórico de OS com dados de teste
  const handleHistoricoOrdensRevisao = (item) => {
    fecharContextMenu()
    setLoadingHistorico(false)
    setErrorHistorico(null)
    setModalHistoricoAberto(true)
    
    // Personalizar dados de exemplo com base no item
    const historicoPersonalizado = {
      ...historicoExemplo,
      equipamento: {
        serie: item.serie,
        produto: equipamentoSelecionado
      }
    }
    
    setHistoricoOS(historicoPersonalizado)
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
      carregarEquipamentosAguardandoRevisao()
    }
  }, [activeSection])

  // useEffect para fechar menu de contexto e dropdown de filtro ao clicar fora
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (contextMenu.visible && !e.target.closest('.context-menu')) {
        fecharContextMenu()
      }
      if (menuOpcoes && !e.target.closest('.options-dropdown')) {
        setMenuOpcoes(false)
      }
      if (filtroHierarquicoAberto && !e.target.closest('.filter-dropdown') && !e.target.closest('.filter-hierarchy-button')) {
        setFiltroHierarquicoAberto(false)
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
        if (filtroHierarquicoAberto) {
          setFiltroHierarquicoAberto(false)
        }
      }
    }

    if (contextMenu.visible || menuOpcoes || filtroHierarquicoAberto) {
      document.addEventListener('click', handleClickOutside)
      document.addEventListener('keydown', handleEscapeKey)
    }

    return () => {
      document.removeEventListener('click', handleClickOutside)
      document.removeEventListener('keydown', handleEscapeKey)
    }
  }, [contextMenu.visible, menuOpcoes, filtroHierarquicoAberto])

  // Função para atualizar dados da seção atual
  const atualizarDadosSecaoAtual = async () => {
    try {
      setAtualizandoDados(true)
      setError(null)
      
      switch (activeSection) {
        case 'fila':
          await Promise.all([
            carregarEquipamentosAguardandoEntrada(),
            carregarEquipamentosAguardandoRevisao()
          ])
          break
        case 'dashboard':
          // Para dashboard, podemos recarregar os dados dos cards ou outras informações
          console.log('Atualizando dados do dashboard...')
          // Aqui você pode adicionar funções específicas do dashboard no futuro
          break
        case 'estoque':
          // Placeholder para futuras funcionalidades de estoque
          console.log('Atualizando dados do estoque...')
          break
        case 'retornos':
          // Placeholder para futuras funcionalidades de retornos
          console.log('Atualizando dados dos retornos...')
          break
        default:
          console.log('Seção não implementada para atualização')
      }
      
    } catch (err) {
      console.error('Erro ao atualizar dados:', err)
      setError(`Erro ao atualizar dados da seção ${activeSection}`)
    } finally {
      setAtualizandoDados(false)
    }
  }

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
        
        {/* Botão de Atualização */}
        <button
          className="nav-button refresh-nav-button"
          onClick={atualizarDadosSecaoAtual}
          disabled={atualizandoDados}
          title={atualizandoDados ? "Atualizando dados..." : "Atualizar dados da seção atual"}
        >
          <i className={`nav-icon bi bi-arrow-clockwise ${atualizandoDados ? 'spin' : ''}`}></i>
          <span className="nav-label">Atualizar</span>
        </button>
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
                  <div className="header-left">
                    <h3>Aguardando revisão</h3>
                    <div className="filter-button-wrapper">
                      <button 
                        className={`filter-hierarchy-button ${filtroAtivo ? 'active' : ''}`}
                        onClick={abrirFiltroHierarquico}
                        title="Filtrar por marca e subgrupo"
                      >
                        <i className="bi bi-funnel"></i>
                        {filtroAtivo && <span className="filter-indicator"></span>}
                      </button>
                      
                      {/* Dropdown de Filtro Hierárquico */}
                      {filtroHierarquicoAberto && (
                        <div className="filter-dropdown">
                          <div className="filter-dropdown-header">
                            <i className="bi bi-funnel"></i>
                            Filtrar por Marca e Subgrupo
                          </div>

                          <div className="filter-dropdown-body">
                            <div className="filter-tree">
                              {dadosFiltro.marcas.length > 0 ? (
                                dadosFiltro.marcas.map((marca, indexMarca) => (
                                  <div key={indexMarca} className="filter-group">
                                    {/* Checkbox da Marca (Nível 1) */}
                                    <div className="filter-level-1">
                                      <label className="filter-checkbox-label">
                                        <input
                                          type="checkbox"
                                          checked={filtrosMarcaSelecionadas.has(marca.nome)}
                                          onChange={() => toggleMarcaFiltro(marca.nome)}
                                          className="filter-checkbox"
                                        />
                                        <i className="bi bi-bookmark-fill"></i>
                                        <span className="filter-text">{marca.nome}</span>
                                        <span className="filter-count">({marca.subgrupos.length})</span>
                                      </label>
                                    </div>

                                    {/* Subgrupos (Nível 2) */}
                                    <div className="filter-level-2">
                                      {marca.subgrupos.map((subgrupo, indexSub) => (
                                        <label key={indexSub} className="filter-checkbox-label subgroup">
                                          <input
                                            type="checkbox"
                                            checked={filtrosSubgrupoSelecionados.has(`${marca.nome}|${subgrupo.nome}`)}
                                            onChange={() => toggleSubgrupoFiltro(marca.nome, subgrupo.nome)}
                                            className="filter-checkbox"
                                          />
                                          <i className="bi bi-tag-fill"></i>
                                          <span className="filter-text">{subgrupo.nome}</span>
                                        </label>
                                      ))}
                                    </div>
                                  </div>
                                ))
                              ) : (
                                <div className="no-data">
                                  <i className="bi bi-funnel-x"></i>
                                  <span>Nenhum dado disponível para filtrar</span>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="filter-dropdown-footer">
                            <button 
                              className="clear"
                              onClick={limparFiltroHierarquico}
                            >
                              Limpar
                            </button>
                            <button 
                              className="primary"
                              onClick={aplicarFiltroHierarquico}
                            >
                              Aplicar
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  <span className="column-count"><strong>{totalQuantidadeRevisao}</strong></span>
                </div>
                <div className="column-content">
                  <div className="kanban-card inventory-card">
                    <div className="inventory-table-container">
                      <table className="inventory-table">
                        <tbody>
                          {equipamentosAguardandoRevisao.length > 0 ? (
                            equipamentosAguardandoRevisao.map((item, index) => (
                              <tr 
                                key={index} 
                                className="clickable-row"
                                onClick={() => abrirModalDetalhesRevisao(item.equipamento)}
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
                                <span>Nenhum equipamento aguardando revisão</span>
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
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
                  <h2>{modalTeste ? 'Equipamentos aguardando revisão técnica' : 'Equipamentos retornados sem entrada de nota fiscal'}</h2>
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
                        {modalTeste && (
                          <div className="options-menu-item" onClick={ativarModoSelecao}>
                            <i className="bi bi-arrow-right-circle"></i>
                            Direcionar ordem de serviço
                          </div>
                        )}
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
                        {modalTeste ? (
                          // Cabeçalhos para Aguardando Revisão
                          <>
                            {modoSelecaoAtivo && (
                              <th style={{ width: '40px', textAlign: 'center' }}>
                                <input
                                  type="checkbox"
                                  checked={selecionarTodos}
                                  onChange={toggleSelecionarTodos}
                                  title="Selecionar todos"
                                />
                              </th>
                            )}
                            <th>Código</th>
                            <th>Número de Série</th>
                            <th>Ordem de Serviço</th>
                            <th>Data de Abertura</th>
                            <th style={{ textAlign: 'center' }}>Últ. Cont. PB</th>
                            <th style={{ textAlign: 'center' }}>Últ. Cont. Cor</th>
                            <th style={{ textAlign: 'center' }}>Fech. c/ peça</th>
                            <th style={{ textAlign: 'center' }}>Fech. c/ troca</th>
                          </>
                        ) : (
                          // Cabeçalhos para Aguardando Entrada
                          <>
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
                          </>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {obterDadosProcessados().length > 0 ? (
                        obterDadosProcessados().map((item, index) => (
                          <tr 
                            key={index}
                            onContextMenu={(e) => handleContextMenu(e, item, modalTeste)}
                            style={{ cursor: 'context-menu' }}
                          >
                            {modalTeste ? (
                              // Dados para Aguardando Revisão
                              <>
                                {modoSelecaoAtivo && (
                                  <td style={{ textAlign: 'center' }}>
                                    <input
                                      type="checkbox"
                                      checked={registrosSelecionados.has(index)}
                                      onChange={() => toggleSelecionarRegistro(index)}
                                    />
                                  </td>
                                )}
                                <td>{item.codprod || ''}</td>
                                <td>{item.serie || ''}</td>
                                <td>{item.OS_REVISAO || ''}</td>
                                <td>{formatarDataHora(item.OS_REVISAO_DATA)}</td>
                                <td style={{ textAlign: 'center' }}>{formatarNumero(item.ULT_CONTADOR_PB)}</td>
                                <td style={{ textAlign: 'center' }}>{formatarNumero(item.ULT_CONTADOR_COR)}</td>
                                <td style={{ textAlign: 'center' }}>{item.QTDE_OS_PECA || ''}</td>
                                <td style={{ textAlign: 'center' }}>{item.QTDE_OS_TROCA || ''}</td>
                              </>
                            ) : (
                              // Dados para Aguardando Entrada
                              <>
                                <td>{item.ntfisc || 'N/A'}</td>
                                <td>{item.pedido || 'N/A'}</td>
                                <td>{item.serie || 'N/A'}</td>
                                <td>{item.motivoret || 'N/A'}</td>
                                <td>{formatarData(item.dtreceb)}</td>
                                <td>{item.Cabo || 'N/A'}</td>
                                <td>{item.Conferente || 'N/A'}</td>
                              </>
                            )}
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={modalTeste ? (modoSelecaoAtivo ? "9" : "8") : "7"} className="no-data">
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
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                {modalTeste && modoSelecaoAtivo && registrosSelecionados.size > 0 && (
                  <button 
                    className="modal-close-btn modal-direcionar-btn"
                    style={{ backgroundColor: '#e9ffdb', color: '#007f66', border: '1px solid #007f66' }}
                    title="Direcionar ordens de serviço selecionadas"
                    onClick={abrirModalTecnico}
                  >
                    <i className="bi bi-arrow-right-circle"></i>
                    Direcionar ordens de serviço ({registrosSelecionados.size})
                  </button>
                )}
                <button className="modal-close-btn" onClick={fecharModal}>
                  <i className="bi bi-x-circle"></i> Sair
                </button>
              </div>
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
                onClick={() => contextMenu.isTeste ? handleHistoricoOrdensRevisao(contextMenu.item) : handleHistoricoOrdens(contextMenu.item)}
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

      {/* Modal de Seleção de Técnico */}
      {modalTecnicoAberto && (
        <ModalSelecaoTecnico
          isOpen={modalTecnicoAberto}
          onClose={fecharModalTecnico}
          ordensServico={obterRegistrosSelecionados().map(item => item.OS_REVISAO).filter(Boolean)}
          onSucesso={handleSucessoDirecionamento}
        />
      )}

    </div>
  )
}

export default App 