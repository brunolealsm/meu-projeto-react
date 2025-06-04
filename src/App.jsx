import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <div className="container">
        <header className="header">
          <div className="logos">
            <a href="https://vitejs.dev" target="_blank" rel="noopener noreferrer">
              <img src={viteLogo} className="logo" alt="Vite logo" />
            </a>
            <a href="https://react.dev" target="_blank" rel="noopener noreferrer">
              <img src={reactLogo} className="logo react" alt="React logo" />
            </a>
          </div>
          <h1>Meu Projeto React</h1>
          <p className="subtitle">
            Desenvolvido com <span className="highlight">Vite</span> + <span className="highlight">React</span>
          </p>
        </header>

        <main className="main">
          <section className="counter-section">
            <h2>Contador Interativo</h2>
            <div className="card">
              <button onClick={() => setCount((count) => count + 1)} className="counter-btn">
                Count is {count}
              </button>
              <p className="hint">
                Edite <code>src/App.jsx</code> e salve para testar o HMR
              </p>
            </div>
          </section>

          <section className="features">
            <h2>Funcionalidades</h2>
            <div className="features-grid">
              <div className="feature-card">
                <div className="feature-icon">⚡</div>
                <h3>Vite</h3>
                <p>Build tool ultra-rápido com Hot Module Replacement</p>
              </div>
              <div className="feature-card">
                <div className="feature-icon">⚛️</div>
                <h3>React 18</h3>
                <p>Biblioteca mais popular para interfaces de usuário</p>
              </div>
              <div className="feature-card">
                <div className="feature-icon">🎨</div>
                <h3>CSS Moderno</h3>
                <p>Estilos responsivos e animações suaves</p>
              </div>
            </div>
          </section>
        </main>

        <footer className="footer">
          <p>&copy; 2024 Meu Projeto React. Criado com ❤️</p>
        </footer>
      </div>
    </>
  )
}

export default App 