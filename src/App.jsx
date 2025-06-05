import { useState } from 'react'
import './App.css'

function App() {
  const [activeSection, setActiveSection] = useState('dashboard')

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
            <div className="section-placeholder">
              <div className="placeholder-content">
                <i className="placeholder-icon bi bi-wrench"></i>
                <h2>Fila de Serviço</h2>
                <p>Módulo para gerenciamento da fila de manutenção</p>
                <button className="cta-button">Configurar Módulo</button>
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
    </div>
  )
}

export default App 