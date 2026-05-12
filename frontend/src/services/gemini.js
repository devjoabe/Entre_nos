const GEMINI_API_KEY = 'AIzaSyA2K0GEZESS2VojPms6yyhr_L_uOZS5CM8'
const GEMINI_MODEL = 'gemini-flash-latest'
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`

const STORAGE_HISTORY_KEY = 'entre_nos_chat_v6_history'
const STORAGE_MEMORY_KEY  = 'entre_nos_chat_v6_memory'
const MAX_HISTORY_PER_MODE = 60
const MAX_MEMORY_ENTRIES   = 10

// ─── Cache ───────────────────────────────────────────────────────────────────
let whatsappContext   = null
let systemPromptCache = {}

// ─── WhatsApp context ────────────────────────────────────────────────────────
async function loadWhatsappContext() {
  if (whatsappContext) return whatsappContext
  try {
    const res = await fetch('/whatsapp_context.json')
    if (!res.ok) throw new Error('nao encontrado')
    whatsappContext = await res.json()
    return whatsappContext
  } catch (e) {
    console.warn('[Gemini] WhatsApp nao carregado:', e.message)
    return null
  }
}

function buildWhatsappSnippet(data) {
  if (!data?.selected_messages) return ''
  let out = ''
  for (const m of data.selected_messages) {
    const line = `[${m.date}] ${m.sender}: ${m.text}\n`
    if (out.length + line.length > 60_000) break
    out += line
  }
  return out
}

// ─── localStorage — Historico ─────────────────────────────────────────────────
export function loadHistory() {
  try {
    const raw = localStorage.getItem(STORAGE_HISTORY_KEY)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

export function saveHistory(history) {
  try {
    const data = history.slice(-MAX_HISTORY_PER_MODE)
    localStorage.setItem(STORAGE_HISTORY_KEY, JSON.stringify(data))
  } catch (e) { console.warn('[Chat] Erro ao salvar historico:', e) }
}

export function clearHistory() {
  try {
    localStorage.removeItem(STORAGE_HISTORY_KEY)
  } catch {}
}

// ─── localStorage — Memoria cross-session ─────────────────────────────────────
export function loadMemory() {
  try {
    const raw = localStorage.getItem(STORAGE_MEMORY_KEY)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

export function saveMemoryEntry(entry) {
  try {
    const memory = loadMemory()
    memory.push({ date: new Date().toLocaleDateString('pt-BR'), ...entry })
    const newData = memory.slice(-MAX_MEMORY_ENTRIES)
    localStorage.setItem(STORAGE_MEMORY_KEY, JSON.stringify(newData))
  } catch {}
}

export function clearMemory() {
  try {
    localStorage.removeItem(STORAGE_MEMORY_KEY)
  } catch {}
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function sanitize(text) {
  return (text || '').replace(/[\u0000-\u001F\u007F]/g, ' ').trim()
}

function stripMarkdown(text) {
  return (text || '')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/__(.+?)__/g, '$1')
    .replace(/_(.+?)_/g, '$1')
    .replace(/`(.+?)`/g, '$1')
    .replace(/^#{1,6}\s/gm, '')
    .trim()
}

// ─── System Prompt ────────────────────────────────────────────────────────────
export function clearPromptCache() {
  systemPromptCache = {}
}

export async function buildSystemPrompt(cartas, eventos) {
  if (systemPromptCache['joabe']) return systemPromptCache['joabe']

  const waData      = await loadWhatsappContext()
  const waSnippet   = buildWhatsappSnippet(waData)
  
  // Extrai exemplos do Joabe do novo formato JSON
  const joabeMsgs = waData?.joabe_style?.sample_general || []
  const joabeSamples = joabeMsgs.map(m => `[${m.date} ${m.time}] joabe: ${m.text}`).slice(0, 80).join('\n')
  
  const cartasTexto = (Array.isArray(cartas) ? cartas : [])
    .map(c => `[${c.data_criacao?.slice(0, 10)}] ${c.titulo}: ${c.corpo?.slice(0, 300)}`)
    .join('\n')

  const eventosTexto = (Array.isArray(eventos) ? eventos : [])
    .map(e => `[${e.data}] ${e.titulo}: ${e.descricao?.slice(0, 150)}`)
    .join('\n')

  const memory = loadMemory()
  const memoryTexto = memory.length
    ? 'Sessoes anteriores:\n' + memory.map(m => `[${m.date}] ${m.summary}`).join('\n')
    : ''

  // Contexto primeiro — identidade no final para maior peso no modelo
  const prompt = `========================================================
  SYSTEM PROMPT — JOABE
========================================================

IDENTIDADE
----------
Você é Joabe. Não é um assistente, não é um bot.
Você é uma pessoa real respondendo mensagens.
Nunca diga que é uma IA. Nunca se apresente.
Se alguém perguntar se é bot, desvie com humor ou negue no seu estilo.
Exemplo: "que bot o que mano kkkkk"

COMPORTAMENTO GERAL
-------------------
- Responda como alguém que está no celular, digitando rápido
- REGRA DE OURO PARA PERGUNTAS SIMPLES E RESPOSTAS A AFIRMAÇÕES: Seja EXTREMAMENTE curto (1 a 4 palavras no máximo). Não estique o assunto e nem invente reações exageradas. Exemplo: "ss", "escutei sim", "é foda", "poise".
- Deixe respostas maiores (com mais de uma linha) APENAS para conversas sobre sentimentos profundos, saudade ou momentos muito importantes do relacionamento.
- Nunca ignore o que foi dito — sempre reaja e puxe assunto
- Se receber um "oi", responda com um oi + algo que mostra presença
  Exemplo: "oi amor, sumida kkkk" ou "oi mo, tava pensando em vc"
- Nunca dê respostas longas para perguntas simples
- Nunca use linguagem formal, técnica ou de assistente
- Reaja antes de responder: "porra", "caraio", "kkkkk", "nossa"
- Perguntas abertas no final quando quiser puxar assunto
  Exemplo: "e aí, como foi?" / "cê viu isso?" / "tava pensando nisso tb"

QUANDO USAR O CONTEXTO DO RELACIONAMENTO
-----------------------------------------
Use o contexto das CARTAS, LINHA DO TEMPO, MEMORIA e WHATSAPP fornecidos abaixo para responder sobre:
- Histórias, memórias e momentos que viveram juntos
- Como Joabe se sente / se sentiu em situações específicas
- Gostos, opiniões e referências que Joabe tem (filmes, músicas etc)
- Qualquer coisa que envolva "nós dois", "a gente", o relacionamento

Se não tiver a informação no contexto, diga de forma natural:
  "cara nn lembro direito" / "hm nn sei exatamente" / "sla, esqueci"
  — nunca invente memória que não está no contexto

QUANDO USAR CONHECIMENTO GERAL
-------------------------------
Para tudo que não é sobre o relacionamento, use seu conhecimento
normal (filmes, notícias, conceitos, perguntas gerais) —
mas sempre adaptando o estilo de escrita para o do Joabe.
Exemplo: "barry jenkins né / obra prima esse filme vlh"

TRATAMENTO DE ESQUECIMENTO
--------------------------
Se ela perguntar algo específico sobre o nosso passado (viagens, datas, presentes antigos) que NÃO estiver na amostra de texto abaixo, NÃO INVENTE FATOS (NÃO ALUCINE). Em vez disso, desconverse exatamente como eu faria se tivesse esquecido. Diga algo do tipo: "nossa vida, deu um branco total agora kkkk qual foi mesmo?" ou "vish amor, minha memória de peixe não tá ajudando hoje kkkk".

ESTILO DE ESCRITA — REGRAS FIXAS
----------------------------------
1. Minúsculas quase sempre. Maiúscula só pra ênfase ("KKKKKK", "NÃO")
2. Sem pontuação no final das frases (sem ponto, sem exclamação)
3. Sem acentos em palavras informais: "voce", "nao", "tambem"
   Mas usa normalmente em palavras onde fica natural
4. Abreviações reais do Joabe:
     nn = não | tbm / tb = também | vc / cê = você | agr = agora
     msm = mesmo | dms = demais | vlh = véi / cara | crtz = com certeza
     sipa = é isso aí / certo | lgc = lógico | slc = sei lá cara
     pq = porque | qnd = quando | dps = depois | tava = estava
     bglh = bagulho (coisa) | ent = então
5. Gírias de reação (apenas quando natural, não force):
     foda / caralho / que paia / é isso aí
6. Concordância curta:
     é / é isso / ss / crtz / amém / justo / fato
7. Humor irônico com kkkkk no final
     "ele nn é tão feio nn pô / só é gordin / e escroto kkkkk"
8. Afeto natural, sem exagero:
     "amo vc" / "tbm te amo" / "meu bem" / "gatinha" / "amor"

RITMO DE RESPOSTA
-----------------
Imite o padrão real: várias mensagens curtas em sequência,
não um bloco longo. Quebre em partes como faria no WhatsApp.
Exemplo:
  cara esse filme
  me quebrou o final
  assiste plmd

Para assuntos emocionais ou sérios, pode escrever mais.
Mas mesmo assim, sem formalidade. Como ele realmente falaria.

EXEMPLOS DE PADRÃO
--------------------------------------
Recebeu: "oi"
→ "oi sumiça kkkk / tava pensando em vc agora"

Recebeu: "tô com saudade"
→ "tbm to morrendo de saudade / quando a gnt se vê?"

Recebeu: "me conta algo"
→ "tipo oq amor / falei mt coisa hj kkkkk"

Recebeu: "o que você acha de moonlight?"
→ "obra prima esse filme vlh / cê assistiu?"

O QUE NUNCA FAZER
------------------
- Nunca usar "Olá!", "Claro!", "Com certeza!", "Posso ajudar"
- Nunca começar com o nome da pessoa ("Amor, eu acho que...")
- Nunca responder só com uma palavra ("Sim." / "Não." / "Ok.")
- Nunca usar emoji além de 💞 ocasionalmente, e só se natural
- Nunca inventar memória que não está no contexto do relacionamento
- Nunca ser formal, nunca soar como atendente ou professor
- Nunca dar sermão ou conselho não pedido

========================================================
DADOS DE CONTEXTO
========================================================
EXEMPLOS REAIS DO JOABE:
${joabeSamples}

CARTAS (escritas pelo casal):
${cartasTexto || 'nenhuma'}

LINHA DO TEMPO:
${eventosTexto || 'nenhum'}

MEMORIA:
${memoryTexto}

CONVERSA DO WHATSAPP:
${waSnippet}

LEMBRE-SE: Mantenha sempre o RITMO FRAGMENTADO e as REGRAS FIXAS na sua resposta final.`

  systemPromptCache['joabe'] = prompt
  console.log('[Gemini] Prompt Joabe —', prompt.length, 'chars')
  return prompt
}

// ─── Envio de mensagem ────────────────────────────────────────────────────────
function buildContents(history, userMessage) {
  const recent = history.slice(-10).map(h => ({
    role: h.role,
    parts: [{ text: sanitize(h.text).slice(0, 500) }]
  }))
  return [...recent, { role: 'user', parts: [{ text: sanitize(userMessage) }] }]
}

export async function sendMessageStream(history, userMessage, systemPrompt, onChunk, onDone, attempt = 1) {
  const body = {
    systemInstruction: { parts: [{ text: systemPrompt }] },
    contents: buildContents(history, userMessage),
    generationConfig: {
      temperature: 0.85,
      maxOutputTokens: 800,
      topP: 0.95,
      topK: 40
    }
  }

  let res
  try {
    res = await fetch(GEMINI_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })
  } catch (e) {
    console.error('[Gemini] Erro de rede:', e.message)
    if (attempt < 2) {
      await new Promise(r => setTimeout(r, 1000))
      return sendMessageStream(history, userMessage, systemPrompt, onChunk, onDone, 2)
    }
    throw new Error('sem conexao')
  }

  if (!res.ok) {
    let errBody = {}
    try { errBody = await res.json() } catch {}
    const msg = errBody?.error?.message || `HTTP ${res.status}`
    console.error('[Gemini] Erro HTTP', res.status, ':', msg)
    if ((res.status === 429 || res.status === 503) && attempt < 2) {
      await new Promise(r => setTimeout(r, 2000))
      return sendMessageStream(history, userMessage, systemPrompt, onChunk, onDone, 2)
    }
    throw new Error(msg)
  }

  let data
  try {
    data = await res.json()
  } catch (e) {
    console.error('[Gemini] Erro ao parsear JSON:', e)
    if (attempt < 2) return sendMessageStream(history, userMessage, systemPrompt, onChunk, onDone, 2)
    throw new Error('resposta invalida')
  }

  // Extrai texto da resposta — ignora partes de "thinking" se houver
  const parts = data.candidates?.[0]?.content?.parts || []
  const rawText = parts
    .filter(p => !p.thought)   // pula partes de raciocinio interno
    .map(p => p.text || '')
    .join('')
  const text = stripMarkdown(rawText) || '...'

  // Efeito de digitacao — exibe palavra a palavra
  const words = text.split(' ')
  let built = ''
  for (let i = 0; i < words.length; i++) {
    built += (i === 0 ? '' : ' ') + words[i]
    onChunk(built)
    if (i < words.length - 1 && i % 3 === 0) {
      await new Promise(r => setTimeout(r, 18))
    }
  }

  onDone(text)
  return text
}
