import { useState, useEffect } from 'react'
import CartasGrid from './components/CartasGrid'
import Timeline from './components/Timeline'
import Galeria from './components/Galeria'
import './App.css'

function App() {
  const [activeTab, setActiveTab] = useState('cartas'); 
  const [introStage, setIntroStage] = useState(0); 

  useEffect(() => {
    // Sequência de animação
    const t1 = setTimeout(() => setIntroStage(1), 2500); // 1. "Entre nós" some
    const t2 = setTimeout(() => setIntroStage(2), 3300); // 2. "Para guardar..." aparece
    const t3 = setTimeout(() => setIntroStage(3), 6500); // 3. Aplicação principal aparece

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, []);

  const subtitulo = "Para guardar nossos sentimentos".split(" ");

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
    <div className="app-container page-fade-in">
      <header className="app-header">
        <nav className="app-nav">
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
        </nav>
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
  )
}

export default App
