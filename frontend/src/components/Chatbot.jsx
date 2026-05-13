import { useState, useEffect, useRef } from 'react'
import {
  buildSystemPrompt,
  sendMessageStream,
  clearPromptCache,
  clearHistory,
  loadHistory,
  saveHistory,
  saveMemoryEntry,
  clearMemory
} from '../services/gemini'
import { buscarCartas, buscarEventos } from '../services/api'
import './Chatbot.css'

export default function Chatbot({ onClose }) {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [systemPrompt, setSystemPrompt] = useState(null)
  const [loadingContext, setLoadingContext] = useState(true)
  const [history, setHistory] = useState([])
  const bottomRef = useRef(null)
  const inputRef = useRef(null)
  const streamingIdRef = useRef(null)

  // carrega o contexto e o historico salvo toda vez que o chatbot é aberto
  useEffect(() => {
    setLoadingContext(true)
    setSystemPrompt(null)
    clearPromptCache()  // limpa o cache pra forcar o sistema a gerar o prompt com as infos mais recentes

    // tenta pegar alguma conversa que ficou salva no navegador pra continuar de onde parou
    const savedHistory = loadHistory()
    setHistory(savedHistory)

    // reconstroi a lista de mensagens na tela usando o que tava salvo
    if (savedHistory.length > 0) {
      const visibleMsgs = savedHistory.map((h, i) => ({
        role: h.role,
        text: h.text,
        id: i
      }))
      setMessages(visibleMsgs)
    } else {
      setMessages([])
    }

    Promise.all([
      buscarCartas().catch(() => []),
      buscarEventos().catch(() => [])
    ])
      .then(([cartas, eventos]) => buildSystemPrompt(cartas, eventos))
      .then(prompt => {
        setSystemPrompt(prompt)
        setLoadingContext(false)
      })
      .catch(e => {
        console.error('Erro contexto:', e)
        setLoadingContext(false)
      })
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  // salva um resumo da conversa so quando a pessoa fechar o chatbot
  // isso evita ficar salvando coisa incompleta no meio do papo
  const historyRef = useRef(history)
  useEffect(() => {
    historyRef.current = history
  }, [history])

  useEffect(() => {
    return () => {
      const currentHistory = historyRef.current
      if (currentHistory.length >= 4) {
        const lastExchanges = currentHistory.slice(-6)
        const summary = lastExchanges
          .map(h => `${h.role === 'user' ? 'perguntou' : 'respondeu'}: ${h.text.slice(0, 80)}`)
          .join(' | ')
        saveMemoryEntry({ summary })
      }
    }
  }, [])

  const handleSend = async () => {
    const text = input.trim()
    // bloqueia se tiver carregando o contexto, ja enviando alguma coisa, ou se nao tiver nada pra mandar
    if (!text || loading || loadingContext) return

    const userMsg = { role: 'user', text, id: Date.now() }
    const streamId = Date.now() + 1
    streamingIdRef.current = streamId

    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)

    // cria uma bolha vazia pro bot na tela enquanto a resposta vai chegando
    setMessages(prev => [...prev, { role: 'model', text: '', id: streamId, streaming: true }])

    try {
      const newHistory = [...history, { role: 'user', text }]

      await sendMessageStream(
        history,
        text,
        systemPrompt,
        // onChunk: vai recebendo as palavras aos poucos e atualizando a bolha pra dar o efeito de digitacao
        (partial) => {
          setMessages(prev => prev.map(m =>
            m.id === streamId ? { ...m, text: partial, streaming: true } : m
          ))
        },
        // onDone: terminou de gerar a resposta toda, entao salva no historico e tira o efeito de digitacao
        (fullText) => {
          setMessages(prev => prev.map(m =>
            m.id === streamId ? { ...m, text: fullText, streaming: false } : m
          ))
          const finalHistory = [...newHistory, { role: 'model', text: fullText }]
          setHistory(finalHistory)
          saveHistory(finalHistory)
          setLoading(false)
          inputRef.current?.focus()
        }
      )
    } catch (e) {
      console.error('Erro ao enviar:', e)
      // mostra o erro real pra facilitar o debug — quando tiver tudo funcionando pode trocar de volta pra mensagem amigavel
      const errorMsg = e.message || 'erro ao processar mensagem, tente novamente'
      setMessages(prev => prev.map(m =>
        m.id === streamId
          ? { ...m, text: errorMsg, streaming: false, isError: true }
          : m
      ))
      setLoading(false)
    }
  }

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleClearHistory = () => {
    clearHistory()
    setHistory([])
    setMessages([])
  }

  return (
    <div className="chatbot-overlay">
      <div className="chatbot-container">

        <div className="chatbot-header">
          <div className="chatbot-header-info">
            <div className="chatbot-avatar">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <div>
              <div className="chatbot-name">Joabe</div>
              <div className="chatbot-subtitle">
                {loadingContext ? 'carregando...' : `online`}
              </div>
            </div>
          </div>
          <div className="chatbot-header-actions">
            <button className="chatbot-clear-btn" onClick={handleClearHistory} title="Limpar conversa">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6" /><path d="M14 11v6" /><path d="M9 6V4h6v2" />
              </svg>
            </button>
            <button className="chatbot-close-btn" onClick={onClose}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        <div className="chatbot-messages">
          {loadingContext && messages.length === 0 && (
            <div className="chatbot-loading-context">
              <div className="chatbot-typing-dots"><span /><span /><span /></div>
            </div>
          )}

          {messages.map(msg => (
            <div
              key={msg.id}
              className={`chatbot-bubble ${msg.role === 'user' ? 'user' : 'bot'} ${msg.isError ? 'error' : ''} ${msg.streaming ? 'streaming' : ''}`}
            >
              <p>{msg.text || (msg.streaming && <span className="cursor-blink">|</span>)}</p>
            </div>
          ))}

          {loading && !messages.some(m => m.streaming) && (
            <div className="chatbot-bubble bot typing">
              <div className="chatbot-typing-dots"><span /><span /><span /></div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        <div className="chatbot-input-area">
          <textarea
            ref={inputRef}
            className="chatbot-input"
            placeholder="mensagem..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            rows={1}
            disabled={loading || loadingContext}
          />
          <button
            className="chatbot-send-btn"
            onClick={handleSend}
            disabled={loading || loadingContext || !input.trim()}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </div>

      </div>
    </div>
  )
}
