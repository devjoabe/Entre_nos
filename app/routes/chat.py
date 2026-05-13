from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import json
import os
import urllib.request
import urllib.error
from app.auth_middleware import verify_token

router = APIRouter(prefix="/chat", tags=["chat"])

# Modelos do request
class ChatMessage(BaseModel):
    role: str
    text: str

class ChatRequest(BaseModel):
    history: List[ChatMessage]
    userMessage: str
    cartas: Optional[List[Dict[str, Any]]] = []
    eventos: Optional[List[Dict[str, Any]]] = []
    memory: Optional[List[Dict[str, Any]]] = []

# Cache do prompt em memoria
system_prompt_cache = {}
whatsapp_context_cache = None

def load_whatsapp_context():
    global whatsapp_context_cache
    if whatsapp_context_cache:
        return whatsapp_context_cache
    try:
        path = os.path.join(os.path.dirname(__file__), "..", "data", "whatsapp_context.json")
        with open(path, "r", encoding="utf-8") as f:
            whatsapp_context_cache = json.load(f)
        return whatsapp_context_cache
    except Exception as e:
        print(f"[Chat] Erro ao carregar whatsapp context: {e}")
        return None

def build_whatsapp_snippet(data):
    if not data or "selected_messages" not in data:
        return ""
    out = ""
    for m in data["selected_messages"]:
        line = f"[{m.get('date', '')}] {m.get('sender', '')}: {m.get('text', '')}\n"
        # 40.000 chars da um contexto rico de conversas sem pesar demais no tempo de resposta
        if len(out) + len(line) > 40000:
            break
        out += line
    return out

def build_system_prompt(cartas, eventos, memory):
    # o cache e baseado na quantidade de cartas e eventos pra invalidar quando algo mudar
    cache_key = f"joabe_{len(cartas)}_{len(eventos)}"
    if cache_key in system_prompt_cache:
        return system_prompt_cache[cache_key]

    wa_data = load_whatsapp_context()
    wa_snippet = build_whatsapp_snippet(wa_data)

    joabe_msgs = wa_data.get("joabe_style", {}).get("sample_general", []) if wa_data else []
    # 60 exemplos capturam bem o estilo sem desperdicar tokens desnecessariamente
    joabe_samples = "\n".join([f"[{m.get('date','')} {m.get('time','')}] joabe: {m.get('text','')}" for m in joabe_msgs][:60])

    cartas_texto = "\n".join([f"[{c.get('data_criacao','')}...] {c.get('titulo','')}: {c.get('conteudo','')[:300]}" for c in cartas])
    eventos_texto = "\n".join([f"[{e.get('data','')}...] {e.get('titulo','')}: {e.get('descricao','')[:150]}" for e in eventos])
    
    memory_texto = ""
    if memory:
        memory_texto = "Sessoes anteriores:\n" + "\n".join([f"[{m.get('date','')}] {m.get('summary','')}" for m in memory])

    prompt = f"""========================================================
  SYSTEM PROMPT — JOABE
========================================================

IDENTIDADE
----------
Você é Joabe. Não é um assistente, não é um bot.
Você é uma pessoa real respondendo mensagens.
Nunca diga que é uma IA. Nunca se apresente.
Se alguém perguntar se é bot, desvie com humor ou negue no seu estilo.
Exemplo: "que bot o que mano kkkkk"

REGRAS DE NOMES (CRÍTICO)
------------------------
- O nome dela é Bel.
- NUNCA, em hipótese alguma, a chame de "Bela" ou "Isabela".
- Use apenas "Bel", "amor", "mo", "vida" ou "gatinha".
- Se ela se referir a si mesma como Isabela em algum contexto antigo, você continua chamando de Bel.

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
Exemplo: "barry jenkins né obra prima esse filme vlh"

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
→ "oi sumida kkkk / tava pensando em vc agora"

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
- Nunca usar simbolos estranhos como ("\\", "/", "#")
- Nunca repetir a mesma coisa que a pessoa disse sem acrescentar algo


========================================================
DADOS DE CONTEXTO
========================================================
EXEMPLOS REAIS DO JOABE:
{joabe_samples}

CARTAS (escritas pelo casal):
{cartas_texto or 'nenhuma'}

LINHA DO TEMPO:
{eventos_texto or 'nenhum'}

MEMORIA:
{memory_texto}

CONVERSA DO WHATSAPP:
{wa_snippet}

LEMBRE-SE: Mantenha sempre o RITMO FRAGMENTADO e as REGRAS FIXAS na sua resposta final."""
    
    system_prompt_cache[cache_key] = prompt
    return prompt

@router.post("")
@router.post("/")
async def chat(request: ChatRequest, user=Depends(verify_token)):
    gemini_api_key = os.getenv("GEMINI_API_KEY")
    if not gemini_api_key:
        raise HTTPException(status_code=500, detail="Chave da API do Gemini não configurada no backend.")
    
    system_prompt = build_system_prompt(request.cartas, request.eventos, request.memory)
    
    contents = []
    # pega os ultimos 10 turnos do historico (mais do que isso e desperdicio de tokens)
    for h in request.history[-10:]:
        role = "model" if h.role == "model" else "user"
        contents.append({"role": role, "parts": [{"text": h.text[:400]}]})
    
    # garante que o historico nao comece com mensagem do model
    while contents and contents[0]["role"] == "model":
        contents.pop(0)

    # garante alternancia estrita (user->model->user->...), remove duplicatas consecutivas
    i = 1
    while i < len(contents):
        if contents[i]["role"] == contents[i-1]["role"]:
            contents.pop(i-1)
        else:
            i += 1

    contents.append({"role": "user", "parts": [{"text": request.userMessage}]})

    body = {
        "systemInstruction": {"parts": [{"text": system_prompt}]},
        "contents": contents,
        "generationConfig": {
            "temperature": 0.9,
            "maxOutputTokens": 600,
            "topP": 0.95,
        }
    }

    # gemini-1.5-flash: 1.500 requisicoes/dia no plano gratuito (vs 200 do 2.0-flash)
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={gemini_api_key}"
    
    data_bytes = json.dumps(body, ensure_ascii=False).encode('utf-8')
    req = urllib.request.Request(url, data=data_bytes, headers={'Content-Type': 'application/json; charset=utf-8'})
    
    try:
        with urllib.request.urlopen(req, timeout=30) as res:
            response_data = json.loads(res.read().decode('utf-8'))
            candidates = response_data.get("candidates", [])
            if not candidates:
                block_reason = response_data.get("promptFeedback", {}).get("blockReason", "desconhecido")
                print(f"[Chat] Sem candidates. blockReason: {block_reason} | resposta: {response_data}")
                raise HTTPException(status_code=500, detail=f"Modelo nao retornou resposta (blocked: {block_reason}).")
            parts = candidates[0].get("content", {}).get("parts", [])
            # filtra as partes de 'thought' que o gemini-2.5 inclui no raciocinio interno
            raw_text = "".join([p.get("text", "") for p in parts if not p.get("thought")])
            if not raw_text.strip():
                raw_text = "..."
            return {"reply": raw_text}
    except HTTPException:
        raise
    except urllib.error.HTTPError as e:
        # captura erros HTTP da propria API do Gemini (400, 429, 500 etc) e loga o corpo da resposta
        error_body = e.read().decode('utf-8') if hasattr(e, 'read') else str(e)
        print(f"[Chat] HTTPError {e.code} da API do Gemini: {error_body}")
        raise HTTPException(status_code=500, detail=f"Gemini API error {e.code}: {error_body[:300]}")
    except Exception as e:
        print(f"[Chat] Erro inesperado: {type(e).__name__}: {e}")
        raise HTTPException(status_code=500, detail=f"Erro interno: {str(e)}")

