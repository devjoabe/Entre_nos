const STORAGE_HISTORY_KEY = 'entre_nos_chat_v7_history'
const STORAGE_MEMORY_KEY = 'entre_nos_chat_v7_memory'
const MAX_HISTORY_PER_MODE = 60
const MAX_MEMORY_ENTRIES = 10

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
  } catch { }
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
  } catch { }
}

export function clearMemory() {
  try {
    localStorage.removeItem(STORAGE_MEMORY_KEY)
  } catch { }
}

// O system prompt agora e montado no backend por seguranca
export function clearPromptCache() {
  // mantido por compatibilidade
}

export async function buildSystemPrompt(cartas, eventos) {
  // Retornamos os dados brutos para o componente enviar pro backend depois
  return { cartas, eventos }
}

// ─── Envio de mensagem (Backend API) ──────────────────────────────────────────
export async function sendMessageStream(history, userMessage, promptData, onChunk, onDone, attempt = 1) {
  const token = localStorage.getItem('entre_nos_token');
  const API_URL = import.meta.env.VITE_API_URL || \`http://\${window.location.hostname}:8000\`;

  const body = {
    history: history,
    userMessage: userMessage,
    cartas: promptData.cartas || [],
    eventos: promptData.eventos || [],
    memory: loadMemory()
  };

  let res;
  try {
    res = await fetch(\`\${API_URL}/chat\`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        ...(token ? { "Authorization": \`Bearer \${token}\` } : {})
      },
      body: JSON.stringify(body)
    });
  } catch (e) {
    console.error('[Chat] Erro de rede:', e.message);
    if (attempt < 2) {
      await new Promise(r => setTimeout(r, 1000));
      return sendMessageStream(history, userMessage, promptData, onChunk, onDone, 2);
    }
    throw new Error('sem conexao');
  }

  if (!res.ok) {
    let errBody = {};
    try { errBody = await res.json(); } catch { }
    const msg = errBody?.detail || \`HTTP \${res.status}\`;
    console.error('[Chat] Erro HTTP', res.status, ':', msg);
    if ((res.status === 429 || res.status === 503) && attempt < 2) {
      await new Promise(r => setTimeout(r, 2000));
      return sendMessageStream(history, userMessage, promptData, onChunk, onDone, 2);
    }
    throw new Error(msg);
  }

  let data;
  try {
    data = await res.json();
  } catch (e) {
    console.error('[Chat] Erro ao parsear JSON:', e);
    if (attempt < 2) return sendMessageStream(history, userMessage, promptData, onChunk, onDone, 2);
    throw new Error('resposta invalida');
  }

  const rawText = data.reply || '...';
  // funcoes pra limpar markdown
  const stripMarkdown = (t) => t.replace(/\\*\\*(.+?)\\*\\*/g, '$1').replace(/\\*(.+?)\\*/g, '$1').trim();
  const text = stripMarkdown(rawText);

  // quebra a frase em palavras pra mostrar uma por uma e parecer q tem alguem escrevendo
  const words = text.split(' ');
  let built = '';
  for (let i = 0; i < words.length; i++) {
    built += (i === 0 ? '' : ' ') + words[i];
    onChunk(built);
    if (i < words.length - 1 && i % 3 === 0) {
      await new Promise(r => setTimeout(r, 18));
    }
  }

  onDone(text);
  return text;
}
