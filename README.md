<div align="center">
  <img src="frontend/public/icons.svg" alt="Entre Nos Logo" width="120" />
  <h1>Entre Nos </h1>
  <p>Uma capsula do tempo digital interativa, criada com muito amor para celebrar e guardar memorias inesqueciveis.</p>
</div>

<br>

## Sobre o Projeto
**Entre Nos** nao e apenas um projeto de software, e um presente. Desenvolvi esta aplicacao para ser um refugio seguro de sentimentos, permitindo registrar momentos marcantes em uma linha do tempo, escrever e guardar cartas virtuais, e ter uma galeria dedicada aos melhores momentos do casal.

A interface foi projetada para ser minimalista, elegante e focar no que realmente importa: a experiencia e a emocao de ler e reviver memorias. Toda a base de dados agora esta em producao, garantindo a persistencia e o historico do relacionamento de forma robusta e segura.

---

## Funcionalidades
- **Cartas com Amor:** Um sistema de cartas virtuais onde podemos escrever e ler textos longos com muito carinho. Apresentacao em formato de envelopes interativos.
- **Nossa Historia (Timeline):** Linha do tempo dinamica para registrar datas e acontecimentos importantes do relacionamento.
- **Galeria de Memorias:** Um espaco visual focado em destacar as melhores lembrancas em formato de fotos, com sistema de upload conectado ao servidor.
- **Interface Imersiva:** Animacoes fluidas, efeitos de revelacao (fade-in/fade-out) e design responsivo projetado primeiramente para dispositivos moveis (mobile-first).
- **Autenticacao Segura:** O acesso a aplicacao e restrito por senha e token JWT, protegendo as memorias de acessos nao autorizados.

---

## Implementacao do Chatbot e Inteligencia Artificial
A plataforma conta com um chatbot integrado que simula a minha personalidade utilizando inteligencia artificial generativa. Ele responde com base em todo o nosso historico de conversas do WhatsApp.

**Desafios e Arquitetura de IA:**
- **Modelo Utilizado:** Apos varios testes de estabilidade, limites de taxa (rate limits) e janelas de contexto, a solucao definitiva foi a adocao do modelo **Gemini 2.5 Flash**. Ele oferece grande velocidade e uma capacidade de contexto que suporta tranquilamente a nossa base de dados historica.
- **Seguranca da API e Contexto:** Anteriormente a logica ocorria no navegador do usuario, mas migrei toda a comunicacao do chatbot para o backend (FastAPI). Isso garante que o arquivo contendo nosso historico pessoal do WhatsApp (`whatsapp_context.json`) e a minha chave privada do Google fiquem guardados apenas no servidor (Render), nunca sendo expostos para a internet publica.
- **Engenharia de Prompt:** O cerebro do bot e alimentado por um JSON gerado via script Python que varreu mais de 117.000 mensagens reais. O algoritmo constroi no backend um *System Prompt* detalhado antes de cada resposta, incluindo as mensagens mais recentes, memorias antigas e as cartas que escrevemos no app, garantindo uma fidelidade impecavel na personalidade e bloqueando alucinacoes.

---

## Arquitetura e Tecnologias Utilizadas

O projeto foi construido com uma arquitetura moderna, dividindo as responsabilidades entre o Frontend (SPA) e o Backend (API). O codigo esta hospedado publicamente de forma segura.

### Frontend (Vercel)
- **React.js:** Biblioteca principal para construir a interface interativa.
- **Vite:** Ferramenta de build rapida e otimizada.
- **CSS Vanilla:** Estilizacao componentizada, com efeitos fluidos nativos e responsividade sem dependencia pesada de bibliotecas de terceiros.

### Backend (Render)
- **FastAPI:** Framework web em Python focado em alta performance. Responsavel por validar o login, gerenciar as cartas, eventos da linha do tempo, galeria de fotos e intermediar a seguranca do Chatbot.
- **PostgreSQL (Supabase):** Substituimos o banco de dados em memoria SQLite por uma solucao baseada em PostgreSQL na nuvem, garantindo a integridade dos dados, com ORM gerenciado pelo SQLAlchemy.

---

## Como rodar localmente

Se voce quiser rodar o projeto de forma local na sua maquina, siga as instrucoes abaixo.

### Pre-requisitos
- Node.js (v18+)
- Python (3.10+)

### 1. Clonar o repositorio
```bash
git clone https://github.com/devjoabe/Entre_nos.git
cd Entre_nos
```

### 2. Configurar e rodar o Backend (FastAPI)
Abra um terminal na pasta raiz do projeto:
```bash
# Crie e ative o ambiente virtual
python -m venv .venv
# No Windows:
.venv\Scripts\activate
# No Linux/Mac:
source .venv/bin/activate

# Instale as dependencias
pip install -r requirements.txt

# Crie um arquivo .env na raiz com as suas variaveis necessarias:
# DATABASE_URL, SECRET_PASSWORD, JWT_SECRET, e GEMINI_API_KEY.

# Inicie o servidor
uvicorn main:app --host 0.0.0.0 --port 8000
```
A API estara rodando em `http://localhost:8000`. Voce pode testar os endpoints documentados em `http://localhost:8000/docs`.

### 3. Rodar o Frontend (React + Vite)
Abra um **novo terminal** e va para a pasta `frontend`:
```bash
cd frontend

# Instale as dependencias
npm install

# Inicie o servidor de desenvolvimento
npm run dev
```
Acesse `http://localhost:5173` no seu navegador e o frontend passara a se comunicar com o backend local automaticamente.

---

## Estrutura do Projeto

```text
Entre_nos
 ┣  app              # Codigo do Backend (FastAPI, Modelos, Autenticacao)
 ┃ ┣  routes         # Endpoints da API (cartas, eventos, galeria, chat)
 ┃ ┣  data           # Onde o contexto de texto da IA fica armazenado localmente
 ┃ ┗  __init__.py
 ┣  frontend         # Codigo do Frontend (React + Vite)
 ┃ ┣  src            # Codigo-fonte principal (Componentes, Views, CSS)
 ┃ ┣  public         # Assets publicos e SVGs
 ┃ ┗  package.json   # Dependencias do Node.js
 ┣  main.py          # Arquivo de inicializacao do Backend
 ┣  render.yaml      # Configuracao de deploy para a nuvem
 ┗  requirements.txt # Dependencias do Backend Python
```

---

<div align="center">
  <p>Feito por <a href="https://github.com/devjoabe">Joabe</a></p>
</div>
