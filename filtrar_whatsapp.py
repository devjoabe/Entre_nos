"""
Filtro de conversa WhatsApp — calibrado para o histórico real de Joabe e amor 💞.
Período: abril/2022 → maio/2026 | 117.230 mensagens

Objetivo: extrair ~30k tokens de contexto útil, com foco em:
  1. Comportamento e estilo do Joabe (vocabulário real, jeito de escrever)
  2. Marcos do relacionamento (aniversários, beijos, declarações, início do namoro)
  3. Janelas de contexto ao redor de momentos importantes

Uso:
  python whatsapp_filter_v2.py
"""

import re
import json
from pathlib import Path
from collections import defaultdict, Counter

# ─────────────────────────────────────────────
# CONFIGURAÇÃO
# ─────────────────────────────────────────────

INPUT_FILE  = r"C:\Users\Joabe\OneDrive\Documentos\aniversarionam\whatsapp_raw.txt"
OUTPUT_FILE = r"C:\Users\Joabe\OneDrive\Documentos\aniversarionam\frontend\public\whatsapp_context.json"

MY_NAME = "joabe"          # nome exato no WhatsApp (case-insensitive)
TARGET_TOKENS = 60_000     # limite de tokens de saída (aumentado para tirar proveito da capacidade do Gemini)
CHARS_PER_TOKEN = 4        # estimativa conservadora: 1 token ≈ 4 chars
TARGET_CHARS = TARGET_TOKENS * CHARS_PER_TOKEN  # 120.000 chars

# ─────────────────────────────────────────────
# RUÍDO — blocos a ignorar por completo
# ─────────────────────────────────────────────

NOISE_PHRASES = [
    "mídia oculta", "mensagem apagada", "figurinha omitida",
    "áudio omitido", "vídeo omitido", "arquivo omitido",
    "video note omitted", "sticker omitted",
    # spam de promoções / grupos que apareceram na conversa
    "promoções carnaval", "não cobramos entrega", "ótimas festas",
    "processo seletivo", "algar tech", "aguardando",
    "temos novidades", "booking.com", "criptografia de ponta",
    "lista de confirmação", "vcf (arquivo", "barca de pren",
    "barca abacaxi", "o semestre ta voltando", "mexican night",
    "pren no 2$", "medprev.online", "agendamento.medprev",
]

# ─────────────────────────────────────────────
# PALAVRAS-CHAVE POR CATEGORIA E PESO
# ─────────────────────────────────────────────

# Peso 8 — marcos inequívocos do relacionamento
MILESTONE_KW = [
    "primeiro beijo", "primeira vez que a gente",
    "aniversário de namoro", "faz um ano de namoro",
    "faz dois anos de namoro", "faz meses de namoro",
    "meses de namoro", "anos de namoro",
    "quando a gente se conheceu", "de quando a gente se conheceu",
    "aquele beijo", "aquela noite no sofá",
    "pedido de namoro", "me pedir em namoro",
    "a gente começou", "primeira vez juntos",
    "nunca vou esquecer de vc", "nunca vou te esquecer",
    "nunca senti borboletas", "senti tanta coisa bel",
    "aquele bj me fez sentir", "senti tanto a tua falta",
    "morri de medo de nunca sentir", "tô mais pronto que da primeira vez",
    "declarar", "assumimos", "a gente ficou junto",
    "nossa história já tem", "dois namoros diferentes",
]

# Peso 5 — afeto direto e sentimentos do relacionamento
LOVE_KW = [
    "te amo", "amo vc", "amo você", "amo demais",
    "eu tbm te amo", "tbm amo vc", "tbm amo você",
    "eu te amo tanto", "amo ficar com vc",
    "saudade", "saudades",
    "meu amor",  # tratamento de casal
    "feliz demais", "tão feliz", "tô feliz",
    "me faz bem", "você me faz bem",
    "pra sempre", "para sempre",
    "quero passar o resto", "nunca imaginou",
    "amor da minha vida",
]

# Peso 3 — evolução da relação (de amigos a namorados)
EVOLUTION_KW = [
    "ficar com vc", "ficar com você",
    "namorar cmg", "namorar com vc",
    "quase namorada", "quase namorado",
    "ex namorado", "ex namorada",
    "a gente namorou", "quando a gente namorava",
    "nosso namoro de 2020", "primeiro namoro",
    "pós término", "quando terminou",
    "voltamos", "a gente voltou",
    "desde que a gente se beijou",
    "a gente ficou juntos na festa",
]

# Peso 2 — interesses comuns (filmes, músicas, séries)
INTEREST_KW = [
    "assisti", "assistiu", "vamos assistir", "assistir juntos",
    "assiste", "filme bom", "série",
    "questão de tempo", "moonlight", "normal people",
    "um sonho de liberdade", "black mirror", "tlou",
    "rubel", "lagum", "kanye", "frank ocean",
    "tyler", "lana", "gorillaz", "primavera",
    "letterboxd", "rave.watch",
    "boa essa", "bom pra crl", "amei essa",
    "recomendo", "precisa ver", "precisa ouvir",
]

# Peso 4 — Menções a amigos
FRIENDS_KW = [
    "peluca", "luma", "isabela", "lucao", "jp",
    "maumau", "mauma", "pebola", "gustavo", "japa",
    "sabrina", "xt", "blade", "malu", "vini"
]

# ─────────────────────────────────────────────
# ESTILO REAL DO JOABE (extraído da análise)
# ─────────────────────────────────────────────
# Vocabulário recorrente: uai, tabom, paia, vlh, dms, msm, agr,
#   tbm, nn, tava, acho, mano, crtz, sipa, ent, qnd, dps, bglh, sla,
#   lgc, caralho, puta, poha, irmao / mano, desgraça (afeto irônico)
# Expressão de concordância: "é", "é isso", "ss", "crtz", "amém", "justo"
# Reação a algo bom: "porra", "caraio", "taporra", "bom pra crl", "picas dms"
# Forma de carinho: "amo vc", "tbm te amo", "meu bem", "gatinha", "amor"
# Comprimento médio real: 19 chars (maioria são respostas curtas)
# Mensagens longas (>80 chars): 145 no total — ouro puro

JOABE_STYLE_KW = [
    "uai", "tabom", "paia", "vlh", "dms", "msm", "agr",
    "tbm", "nn", "tava", "acho", "mano", "crtz", "sipa",
    "lgc", "caralho", "taporra", "bom pra crl", "picas dms",
    "ent", "qnd", "dps", "bglh", "slc", "justo", "amém",
]

# ─────────────────────────────────────────────
# PARSING
# ─────────────────────────────────────────────

MSG_PATTERN = re.compile(r'^(\d{2}/\d{2}/\d{4}) (\d{2}:\d{2}) - ([^:]+): (.+)$')

def parse_messages(filepath):
    messages = []
    current = None
    with open(filepath, encoding='utf-8', errors='replace') as f:
        for line in f:
            line = line.rstrip()
            m = MSG_PATTERN.match(line)
            if m:
                if current:
                    messages.append(current)
                date, time, sender, text = m.groups()
                current = {
                    "date": date, "time": time,
                    "sender": sender.strip(), "text": text.strip()
                }
            elif current and line:
                current["text"] += " " + line.strip()
    if current:
        messages.append(current)
    return messages

def is_joabe(sender):
    return MY_NAME.lower() in sender.lower()

def is_noise(text):
    tl = text.lower()
    if len(text.strip()) < 3:
        return True
    return any(p in tl for p in NOISE_PHRASES)

# ─────────────────────────────────────────────
# SCORING
# ─────────────────────────────────────────────

def score_message(msg):
    text = msg["text"]
    tl   = text.lower()
    mine = is_joabe(msg["sender"])

    if is_noise(text):
        return -1

    score = 0

    # Base: mensagens do Joabe têm peso maior (objetivo principal)
    if mine:
        score += 3

    # Marcos do relacionamento — máxima prioridade
    for kw in MILESTONE_KW:
        if kw in tl:
            score += 8

    # Afeto e sentimentos
    for kw in LOVE_KW:
        if kw in tl:
            score += 5

    # Evolução da relação
    for kw in EVOLUTION_KW:
        if kw in tl:
            score += 3

    # Interesses comuns
    for kw in INTEREST_KW:
        if kw in tl:
            score += 2

    # Menções a amigos
    for kw in FRIENDS_KW:
        if kw in tl:
            score += 4

    # Estilo do Joabe (só pontua nas mensagens dele)
    if mine:
        for kw in JOABE_STYLE_KW:
            if kw in tl:
                score += 1

    # Mensagens longas têm mais substância
    if len(text) > 200:
        score += 5
    elif len(text) > 100:
        score += 3
    elif len(text) > 50:
        score += 1

    return score

# ─────────────────────────────────────────────
# ANÁLISE DE ESTILO DO JOABE
# ─────────────────────────────────────────────

def analyze_joabe_style(messages):
    joabe_msgs = [
        m for m in messages
        if is_joabe(m["sender"]) and not is_noise(m["text"])
    ]

    # Comprimento médio
    lens = [len(m["text"]) for m in joabe_msgs]
    avg_len = round(sum(lens) / len(lens), 1) if lens else 0

    # Emojis
    emoji_pat = re.compile(
        r'[\U0001F600-\U0001F64F\U0001F300-\U0001F5FF'
        r'\U0001F680-\U0001F6FF\U0001F1E0-\U0001F1FF'
        r'\u2702-\u27B0\u24C2-\U0001F251]+',
        flags=re.UNICODE
    )
    emoji_count = Counter()
    for m in joabe_msgs:
        for em in emoji_pat.findall(m["text"]):
            for c in em:
                emoji_count[c] += 1
    top_emojis = [{"emoji": e, "count": c} for e, c in emoji_count.most_common(15)]

    # Palavras mais usadas (stopwords removidas)
    stopwords = {
        "de","a","o","que","e","do","da","em","um","para","com","uma","os","no",
        "se","na","por","mais","as","dos","como","mas","foi","ao","ele","das",
        "tem","seu","sua","ou","ser","quando","muito","nos","já","está","eu",
        "também","só","pelo","pela","até","isso","ela","entre","era","depois",
        "sem","mesmo","ter","seus","quem","nas","me","esse","eles","você","vc",
        "não","sim","né","tá","tb","pq","q","vou","vai","faz","to","tô","mim",
        "si","lá","aqui","nn","so","ss","aí","ai","oq","cê","num","ace"
    }
    word_count = Counter()
    for m in joabe_msgs:
        words = re.findall(r"\b[a-záéíóúãõâêîôûàèìòùç]{3,}\b", m["text"].lower())
        for w in words:
            if w not in stopwords:
                word_count[w] += 1
    top_words = [{"word": w, "count": c} for w, c in word_count.most_common(60)]

    # Mensagens expressivas longas (> 80 chars, maior score)
    expressive = sorted(
        [m for m in joabe_msgs if len(m["text"]) > 80],
        key=score_message,
        reverse=True
    )[:60]

    # Amostra geral: primeiras + últimas + melhores
    top_scored = sorted(joabe_msgs, key=score_message, reverse=True)[:150]
    sample = joabe_msgs[:80] + joabe_msgs[-80:]

    return {
        "total_messages": len(joabe_msgs),
        "avg_message_length": avg_len,
        "top_emojis": top_emojis,
        "top_words": top_words,
        "expressive_messages": [
            {"date": m["date"], "time": m["time"], "text": m["text"]}
            for m in expressive
        ],
        "top_scored_messages": [
            {"date": m["date"], "time": m["time"], "text": m["text"]}
            for m in top_scored
        ],
        "sample_general": [
            {"date": m["date"], "time": m["time"], "text": m["text"]}
            for m in sample
        ],
    }

# ─────────────────────────────────────────────
# DETECÇÃO DE MARCOS
# ─────────────────────────────────────────────

MILESTONE_DETECT_KW = MILESTONE_KW + [
    "primeiro beijo", "primeira vez", "aniversário de namoro",
    "feliz aniversário", "faz um ano", "faz dois anos",
    "faz meses", "meses de namoro", "anos de namoro",
    "pedido de namoro", "me pedir em namoro",
    "namorado", "namorada",          # captura declarações
    "quando a gente se conheceu",
    "aquele beijo", "borboletas no estômago",
    "senti tanta coisa", "senti tanto a tua falta",
    "nossa história",
]

def detect_milestones(messages):
    seen = set()
    milestones = []
    for i, m in enumerate(messages):
        tl = m["text"].lower()
        for kw in MILESTONE_DETECT_KW:
            if kw in tl and i not in seen:
                milestones.append({
                    "index": i,
                    "date": m["date"],
                    "time": m["time"],
                    "sender": m["sender"],
                    "text": m["text"],
                    "trigger": kw,
                    "is_joabe": is_joabe(m["sender"]),
                })
                seen.add(i)
                break
    return milestones

# ─────────────────────────────────────────────
# EXTRAÇÃO DE CONTEXTO
# ─────────────────────────────────────────────

def extract_context(messages, target_chars):
    # Pontua todas as mensagens
    scored = []
    for i, m in enumerate(messages):
        s = score_message(m)
        if s >= 0:
            scored.append((i, s))

    scored_sorted = sorted(scored, key=lambda x: -x[1])
    selected = set()

    # 1. Últimas 2000 mensagens — base prioritária (contexto mais recente)
    for i in range(max(0, len(messages) - 2000), len(messages)):
        if not is_noise(messages[i]["text"]):
            selected.add(i)

    # 2. Janela grande (±12) ao redor de marcos do relacionamento (score ≥ 8)
    for idx, s in scored_sorted:
        if s < 8:
            break
        for offset in range(-12, 13):
            ni = idx + offset
            if 0 <= ni < len(messages) and not is_noise(messages[ni]["text"]):
                selected.add(ni)

    # 3. Janela média (±5) ao redor de mensagens muito relevantes (score ≥ 5)
    for idx, s in scored_sorted:
        if s < 5:
            break
        for offset in range(-5, 6):
            ni = idx + offset
            if 0 <= ni < len(messages) and not is_noise(messages[ni]["text"]):
                selected.add(ni)

    # 4. Todas as mensagens longas do Joabe (> 80 chars) — estilo expressivo
    for i, m in enumerate(messages):
        if is_joabe(m["sender"]) and len(m["text"]) > 80 and not is_noise(m["text"]):
            selected.add(i)
            # Janela pequena ao redor para contexto
            for offset in range(-3, 4):
                ni = i + offset
                if 0 <= ni < len(messages) and not is_noise(messages[ni]["text"]):
                    selected.add(ni)

    # Constrói output ordenado e controla o limite de chars
    selected_sorted = sorted(selected)
    result = []
    total_chars = 0

    for i in selected_sorted:
        m = messages[i]
        line = f"[{m['date']} {m['time']}] {m['sender']}: {m['text']}"
        if total_chars + len(line) + 1 > target_chars:
            break
        result.append({"idx": i, "line": line, "msg": m})
        total_chars += len(line) + 1

    # Preenchimento sequencial se ainda tiver espaço
    if total_chars < target_chars:
        used = {r["idx"] for r in result}
        for i, m in enumerate(messages):
            if i not in used and not is_noise(m["text"]):
                line = f"[{m['date']} {m['time']}] {m['sender']}: {m['text']}"
                if total_chars + len(line) + 1 > target_chars:
                    break
                result.append({"idx": i, "line": line, "msg": m})
                total_chars += len(line) + 1
                used.add(i)
        result.sort(key=lambda x: x["idx"])

    estimated_tokens = total_chars // CHARS_PER_TOKEN
    print(f"  → Mensagens selecionadas: {len(result):,}")
    print(f"  → Chars: {total_chars:,} | Tokens estimados: ~{estimated_tokens:,}")

    return result, total_chars

# ─────────────────────────────────────────────
# MAIN
# ─────────────────────────────────────────────

def main():
    sep = "=" * 55
    print(sep)
    print("Lendo arquivo...")
    messages = parse_messages(INPUT_FILE)
    print(f"  → Total de mensagens: {len(messages):,}")
    print(f"  → Período: {messages[0]['date']} → {messages[-1]['date']}")

    print("\nAnalisando estilo do Joabe...")
    joabe_style = analyze_joabe_style(messages)
    print(f"  → Mensagens do Joabe (sem spam): {joabe_style['total_messages']:,}")
    print(f"  → Comprimento médio: {joabe_style['avg_message_length']} chars")
    print(f"  → Top palavras: {[w['word'] for w in joabe_style['top_words'][:12]]}")
    print(f"  → Top emojis: {[e['emoji'] for e in joabe_style['top_emojis'][:8]]}")
    print(f"  → Mensagens expressivas (>80 chars): {len(joabe_style['expressive_messages'])}")

    print("\nDetectando marcos do relacionamento...")
    milestones = detect_milestones(messages)
    print(f"  → Marcos detectados: {len(milestones)}")

    print(f"\nExtraindo contexto (alvo: ~{TARGET_TOKENS:,} tokens)...")
    result_lines, total_chars = extract_context(messages, TARGET_CHARS)

    participants = list({m["sender"] for m in messages})

    selected_msgs = [
        {
            "date":      r["msg"]["date"],
            "time":      r["msg"]["time"],
            "sender":    r["msg"]["sender"],
            "text":      r["msg"]["text"],
            "is_joabe":  is_joabe(r["msg"]["sender"]),
        }
        for r in result_lines
    ]

    output = {
        "meta": {
            "total_messages":   len(messages),
            "selected_count":   len(selected_msgs),
            "total_chars":      total_chars,
            "estimated_tokens": total_chars // CHARS_PER_TOKEN,
            "joabe_name":       MY_NAME,
            "participants":     participants,
            "date_range": {
                "start": messages[0]["date"] if messages else None,
                "end":   messages[-1]["date"] if messages else None,
            },
        },
        "joabe_style":     joabe_style,
        "milestones":      milestones,
        "selected_messages": selected_msgs,
    }

    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(output, f, ensure_ascii=False, indent=2)

    size_kb = Path(OUTPUT_FILE).stat().st_size / 1024
    print(f"\n{sep}")
    print(f"[OK] {OUTPUT_FILE}")
    print(f"     Tamanho: {size_kb:.1f} KB ({size_kb/1024:.2f} MB)")
    print(f"     Mensagens: {len(selected_msgs):,}")
    print(f"     Tokens estimados: ~{total_chars // CHARS_PER_TOKEN:,}")
    print(f"     Marcos: {len(milestones)}")

if __name__ == "__main__":
    main()