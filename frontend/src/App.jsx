import { useState, useEffect, useRef } from 'react'
import CartasGrid from './components/CartasGrid'
import Timeline from './components/Timeline'
import Galeria from './components/Galeria'
import Login from './components/Login'
import { getToken, saveToken } from './services/api'
import './App.css'

const FAB_ICONS = {
  cartas: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 7V17C4 18.1046 4.89543 19 6 19H18C19.1046 19 20 18.1046 20 17V7" />
      <path d="M4 7L12 13L20 7" />
      <path d="M4 7C4 5.89543 4.89543 5 6 5H18C19.1046 5 20 5.89543 20 7" />
    </svg>
  ),
  timeline: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 3a2.83 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
      <path d="M15 5l4 4" />
    </svg>
  ),
  galeria: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  ),
}

const FAB_LABELS = {
  cartas: 'Escrever uma Carta',
  timeline: 'Adicionar Data Marcante',
  galeria: 'Adicionar foto',
}

function App() {
  const [activeTab, setActiveTab] = useState('cartas')
  const [introStage, setIntroStage] = useState(0)
  const [autenticado, setAutenticado] = useState(false)
  const [fabAberto, setFabAberto] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [fabIconKey, setFabIconKey] = useState('cartas')
  const [iconVisible, setIconVisible] = useState(true)
  const [createTrigger, setCreateTrigger] = useState(0)

  // Swipe logic states
  const [touchStart, setTouchStart] = useState(null)
  const [touchEnd, setTouchEnd] = useState(null)
  const minSwipeDistance = 50

  // FIX: guarda qual aba estava ativa quando o FAB foi aberto
  const fabAbaRef = useRef(null)

  useEffect(() => {
    const token = getToken()
    if (token) setAutenticado(true)
  }, [])

  useEffect(() => {
    if (!autenticado) return
    const t1 = setTimeout(() => setIntroStage(1), 2500)
    const t2 = setTimeout(() => setIntroStage(2), 3300)
    const t3 = setTimeout(() => setIntroStage(3), 6500)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
  }, [autenticado])

  // FIX: ao trocar de aba, fecha o FAB e limpa a aba salva no ref
  useEffect(() => {
    setFabAberto(false)
    fabAbaRef.current = null

    setIconVisible(false)
    const timer = setTimeout(() => {
      setFabIconKey(activeTab)
      setIconVisible(true)
    }, 100)
    return () => clearTimeout(timer)
  }, [activeTab])

  const onTouchStart = (e) => {
    setTouchEnd(null)
    setTouchStart(e.targetTouches[0].clientX)
  }

  const onTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX)
  }

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return
    const distance = touchStart - touchEnd
    const isLeftSwipe = distance > minSwipeDistance
    const isRightSwipe = distance < -minSwipeDistance

    const tabs = ['cartas', 'timeline', 'galeria']
    const currentIndex = tabs.indexOf(activeTab)

    if (isLeftSwipe && currentIndex < tabs.length - 1) {
      // Swiped left, go to next tab
      setActiveTab(tabs[currentIndex + 1])
    }
    if (isRightSwipe && currentIndex > 0) {
      // Swiped right, go to previous tab
      setActiveTab(tabs[currentIndex - 1])
    }
  }

  const handleLogin = (token) => {
    saveToken(token)
    setIntroStage(0)
    setAutenticado(true)
  }

  const handleFabClick = () => {
    if (fabAberto) {
      // FIX: só executa a ação se a aba não mudou desde que o FAB foi aberto
      if (fabAbaRef.current === activeTab) {
        setCreateTrigger(prev => prev + 1)
      }
      setFabAberto(false)
      fabAbaRef.current = null
    } else {
      // FIX: salva qual aba está ativa no momento em que o FAB é aberto
      fabAbaRef.current = activeTab
      setFabAberto(true)
    }
  }

  const handleFabBackdrop = () => {
    setFabAberto(false)
    fabAbaRef.current = null
  }

  if (!autenticado) {
    return <Login onLogin={handleLogin} />
  }

  const subtitulo = "Para guardar nossos sentimentos".split(" ")

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
    )
  }

  return (
    <div 
      className="app-root page-fade-in"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      <nav className="app-nav">
        <div className="nav-content">
          <button
            className={`nav-tab ${activeTab === 'cartas' ? 'active' : ''}`}
            onClick={() => setActiveTab('cartas')}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 7V17C4 18.1046 4.89543 19 6 19H18C19.1046 19 20 18.1046 20 17V7" />
              <path d="M4 7L12 13L20 7" />
              <path d="M4 7C4 5.89543 4.89543 5 6 5H18C19.1046 5 20 5.89543 20 7" />
            </svg>
            Cartas
          </button>
          <button
            className={`nav-tab ${activeTab === 'timeline' ? 'active' : ''}`}
            onClick={() => setActiveTab('timeline')}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 3a2.83 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
            </svg>
            Nossa História
          </button>
          <button
            className={`nav-tab ${activeTab === 'galeria' ? 'active' : ''}`}
            onClick={() => setActiveTab('galeria')}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
              <circle cx="12" cy="13" r="4" />
            </svg>
            Galeria
          </button>
        </div>
      </nav>

      <div className="app-container">
        <main className="app-main">
          {activeTab === 'cartas' && (
            <CartasGrid
              createTrigger={createTrigger}
              onCreateModeChange={setIsCreating}
              isActive={activeTab === 'cartas'}
            />
          )}
          {activeTab === 'timeline' && (
            <Timeline
              key="timeline"
              createTrigger={createTrigger}
              onCreateModeChange={setIsCreating}
            />
          )}
          {activeTab === 'galeria' && (
            <Galeria
              key="galeria"
              createTrigger={createTrigger}
              onCreateModeChange={setIsCreating}
            />
          )}
        </main>

        <footer className="app-footer">
          <div className="app-footer-glow" />
          <span className="app-footer-text">Feito com muito amor para você.</span>
        </footer>
      </div>

      {!isCreating && (
        <div className={`fab-container ${fabAberto ? 'open' : ''}`}>
          <button
            className={`fab-btn ${iconVisible ? 'icon-visible' : 'icon-hidden'}`}
            onClick={handleFabClick}
            title={FAB_LABELS[activeTab]}
          >
            {FAB_ICONS[fabIconKey]}
          </button>
          {fabAberto && (
            <button className="fab-label" onClick={handleFabClick}>
              {FAB_LABELS[activeTab]}
            </button>
          )}
        </div>
      )}

      {fabAberto && <div className="fab-backdrop" onClick={handleFabBackdrop} />}
    </div>
  )
}

export default App
