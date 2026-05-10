import { useState, useEffect } from 'react'
import CartasGrid from './components/CartasGrid'
import Timeline from './components/Timeline'
import Galeria from './components/Galeria'
import Login from './components/Login'
import { getToken, saveToken } from './services/api'
import './App.css'

function App() {
  const [activeTab, setActiveTab] = useState('cartas');
  const [introStage, setIntroStage] = useState(0);
  const [autenticado, setAutenticado] = useState(false);

  // Verifica se já tem token salvo ao carregar o app
  useEffect(() => {
    const token = getToken();
    if (token) setAutenticado(true);
  }, []);

  useEffect(() => {
    if (!autenticado) return;

    // Sequência de animação só roda após autenticação
    const t1 = setTimeout(() => setIntroStage(1), 2500);
    const t2 = setTimeout(() => setIntroStage(2), 3300);
    const t3 = setTimeout(() => setIntroStage(3), 6500);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [autenticado]);

  const handleLogin = (token) => {
    saveToken(token);
    setIntroStage(0); // reseta intro
    setAutenticado(true);
  };

  // Não autenticado → Tela de Login
  if (!autenticado) {
    return <Login onLogin={handleLogin} />;
  }

  const subtitulo = "Para guardar nossos sentimentos".split(" ");

  // Animação de intro (só na primeira vez após login)
  if (introStage < 3) {
    return (
      <div className="intro-container">
        {introStage === 0 && <h1 className="intro-text fade-in">Entre nós</h1>}
        {introStage === 1 && <h1 className="intro-text fade-out">Entre nós</h1>}
        {introStage === 2 && (
          <p className="intro-subtitle-anim">
            {subtitulo.map((word, index) => (
              <span
                key={index}
                className="word-reveal"
                style={{ animationDelay: `${index * 0.4}s` }}
              >
                {word}&nbsp;
              </span>
            ))}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="app-root page-fade-in">
      <nav className="app-nav">
        <div className="nav-content">
          <button
            className={`nav-tab ${activeTab === 'cartas' ? 'active' : ''}`}
            onClick={() => setActiveTab('cartas')}
          >
            ✉ Cartas
          </button>
          <button
            className={`nav-tab ${activeTab === 'timeline' ? 'active' : ''}`}
            onClick={() => setActiveTab('timeline')}
          >
            ✎ Nossa História
          </button>
          <button
            className={`nav-tab ${activeTab === 'galeria' ? 'active' : ''}`}
            onClick={() => setActiveTab('galeria')}
          >
            ✦ Galeria
          </button>
        </div>
      </nav>

      <div className="app-container">
        <header className="app-header">
          <h1 className="app-title">Entre Nós</h1>
        </header>

        <main className="app-main">
          {activeTab === 'cartas' && <CartasGrid />}
          {activeTab === 'timeline' && <Timeline />}
          {activeTab === 'galeria' && <Galeria />}
        </main>

        <footer className="app-footer">
          Feito com muito amor para você.
        </footer>
      </div>
    </div>
  )
}

export default App
