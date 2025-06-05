import { useState } from 'react'
import './App.css'

function App() {
  const [activeSection, setActiveSection] = useState('dashboard')

  const menuItems = [
    { 
      id: 'fila', 
      label: 'Fila de Serviço', 
      icon: '🔧',
      color: '#10b981',
      description: 'Gerenciar fila de manutenção'
    },
    { 
      id: 'estoque', 
      label: 'Estoque', 
      icon: '📦',
      color: '#f59e0b',
      description: 'Equipamentos revisados'
    },
    { 
      id: 'retornos', 
      label: 'Retornos', 
      icon: '↩️',
      color: '#ef4444',
      description: 'Processo de retorno'
    }
  ]

  const statusCards = [
    { title: 'Equipamentos em Manutenção', value: '24', trend: '+3', color: '#3b82f6' },
    { title: 'Prontos para Locação', value: '156', trend: '+12', color: '#10b981' },
    { title: 'Aguardando Retorno', value: '8', trend: '-2', color: '#f59e0b' },
    { title: 'Técnicos Ativos', value: '6', trend: '0', color: '#8b5cf6' }
  ]

  return (
    <div className="app-container">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="logo">
            <span className="logo-icon">🏭</span>
            <h1>TechOffice</h1>
          </div>
          <p className="subtitle">Sistema de Gestão</p>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section">
            <h3>Menu Principal</h3>
            <button 
              className={`nav-item ${activeSection === 'dashboard' ? 'active' : ''}`}
              onClick={() => setActiveSection('dashboard')}
            >
              <span className="nav-icon">📊</span>
              <span>Dashboard</span>
            </button>
          </div>

          <div className="nav-section">
            <h3>Operações</h3>
            {menuItems.map(item => (
              <button 
                key={item.id}
                className={`nav-item ${activeSection === item.id ? 'active' : ''}`}
                onClick={() => setActiveSection(item.id)}
                style={{ '--accent-color': item.color }}
              >
                <span className="nav-icon">{item.icon}</span>
                <span>{item.label}</span>
                <span className="nav-badge">•</span>
              </button>
            ))}
          </div>
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar">👤</div>
            <div>
              <div className="user-name">Técnico Admin</div>
              <div className="user-role">Gerente</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <header className="main-header">
          <div className="header-left">
            <h1>
              {activeSection === 'dashboard' && '📊 Dashboard'}
              {activeSection === 'fila' && '🔧 Fila de Serviço'}
              {activeSection === 'estoque' && '📦 Estoque'}
              {activeSection === 'retornos' && '↩️ Retornos'}
            </h1>
            <p className="header-subtitle">
              {activeSection === 'dashboard' && 'Visão geral das operações'}
              {activeSection === 'fila' && 'Gerencie a fila de manutenção'}
              {activeSection === 'estoque' && 'Equipamentos prontos para locação'}
              {activeSection === 'retornos' && 'Processo de retorno de equipamentos'}
            </p>
          </div>
          <div className="header-right">
            <button className="notification-btn">🔔</button>
            <div className="date-time">{new Date().toLocaleDateString('pt-BR')}</div>
          </div>
        </header>

        <div className="content-area">
          {activeSection === 'dashboard' && (
            <div className="dashboard">
              <div className="status-cards">
                {statusCards.map((card, index) => (
                  <div key={index} className="status-card" style={{ '--card-color': card.color }}>
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
                  <h3>🚨 Alertas Importantes</h3>
                  <ul className="alert-list">
                    <li className="alert-item urgent">
                      <span>⚠️</span>
                      <div>
                        <strong>Equipamento #EQ-001</strong>
                        <p>Manutenção urgente necessária</p>
                      </div>
                    </li>
                    <li className="alert-item warning">
                      <span>🔧</span>
                      <div>
                        <strong>Técnico João</strong>
                        <p>Sobrecarga de serviços</p>
                      </div>
                    </li>
                    <li className="alert-item info">
                      <span>📦</span>
                      <div>
                        <strong>Estoque baixo</strong>
                        <p>Peças de reposição</p>
                      </div>
                    </li>
                  </ul>
                </div>

                <div className="widget">
                  <h3>📈 Resumo Operacional</h3>
                  <div className="summary-stats">
                    <div className="stat">
                      <span className="stat-label">Produtividade Hoje</span>
                      <span className="stat-value">87%</span>
                    </div>
                    <div className="stat">
                      <span className="stat-label">Tempo Médio Reparo</span>
                      <span className="stat-value">4.2h</span>
                    </div>
                    <div className="stat">
                      <span className="stat-label">Satisfação Cliente</span>
                      <span className="stat-value">94%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'fila' && (
            <div className="section-placeholder">
              <div className="placeholder-icon">🔧</div>
              <h2>Fila de Serviço</h2>
              <p>Aqui será implementado o gerenciamento da fila de manutenção</p>
              <button className="cta-button">Configurar Módulo</button>
            </div>
          )}

          {activeSection === 'estoque' && (
            <div className="section-placeholder">
              <div className="placeholder-icon">📦</div>
              <h2>Controle de Estoque</h2>
              <p>Módulo para gerenciar equipamentos revisados e prontos para locação</p>
              <button className="cta-button">Configurar Módulo</button>
            </div>
          )}

          {activeSection === 'retornos' && (
            <div className="section-placeholder">
              <div className="placeholder-icon">↩️</div>
              <h2>Processo de Retornos</h2>
              <p>Gerenciamento do processo de retorno de equipamentos locados</p>
              <button className="cta-button">Configurar Módulo</button>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

export default App 