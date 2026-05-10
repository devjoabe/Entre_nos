<div align="center">
  <img src="frontend/public/icons.svg" alt="Entre Nós Logo" width="120" />
  <h1>Entre Nós </h1>
  <p>Uma cápsula do tempo digital interativa, criada com muito amor para celebrar e guardar memórias inesquecíveis.</p>
  
  <p>
    <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React" />
    <img src="https://img.shields.io/badge/Vite-B73BFE?style=for-the-badge&logo=vite&logoColor=FFD62E" alt="Vite" />
    <img src="https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi" alt="FastAPI" />
    <img src="https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white" alt="Python" />
  </p>
</div>

<br>

##  Sobre o Projeto
**Entre Nós** não é apenas um projeto de software, é um presente. Desenvolvido para ser um refúgio seguro de sentimentos, ele permite registrar momentos marcantes em uma linha do tempo, escrever e guardar cartas virtuais, e ter uma galeria dedicada aos melhores momentos do casal.

A interface foi projetada para ser minimalista, elegante e focar no que realmente importa: a experiência e a emoção de ler e reviver memórias.

---

##  Funcionalidades (Features)

-  **Cartas com Amor:** Um sistema de cartas virtuais onde você pode escrever e ler textos longos com muito carinho. Apresentação em formato de envelopes interativos.
-  **Nossa História (Timeline):** Linha do tempo dinâmica para registrar datas e acontecimentos importantes do relacionamento.
-  **Galeria de Memórias:** Um espaço visual focado em destacar as melhores lembranças em formato de fotos.
-  **Interface Imersiva:** Animações fluidas, efeitos de revelação (fade-in/fade-out) e design responsivo moderno.

---

##  Tecnologias Utilizadas

O projeto foi construído usando uma arquitetura moderna separando o Frontend (SPA) do Backend (API).

### **Frontend**
- **[React.js](https://react.dev/):** Biblioteca principal para construir a interface.
- **[Vite](https://vitejs.dev/):** Ferramenta de build super rápida.
- **CSS Vanilla:** Estilização componentizada com variáveis e keyframes customizados.

### **Backend**
- **[FastAPI](https://fastapi.tiangolo.com/):** Framework web em Python moderno e de altíssimo desempenho para construir a API.
- **Python 3:** Linguagem base do backend.
- *(Atualmente rodando com banco de dados em memória para agilidade no desenvolvimento).*

---

##  Como rodar localmente (Getting Started)

Se você quiser rodar este projeto na sua máquina local, siga os passos abaixo:

### Pré-requisitos
- Node.js (v18+)
- Python (3.10+)

### 1. Clonar o repositório
```bash
git clone https://github.com/devjoabe/Entre_nos.git
cd Entre_nos
```

### 2. Rodar o Backend (FastAPI)
Abra um terminal na pasta raiz do projeto:
```bash
# Crie e ative o ambiente virtual
python -m venv .venv
# No Windows:
.venv\Scripts\activate
# No Linux/Mac:
source .venv/bin/activate

# Instale as dependências
pip install -r requirements.txt

# Inicie o servidor
python main.py
```
A API estará rodando em `http://localhost:8000`. Você pode ver a documentação interativa em `http://localhost:8000/docs`.

### 3. Rodar o Frontend (React + Vite)
Abra um **novo terminal** e vá para a pasta `frontend`:
```bash
cd frontend

# Instale as dependências
npm install

# Inicie o servidor de desenvolvimento
npm run dev
```
Acesse `http://localhost:5173` no seu navegador e aproveite a experiência!

---

##  Estrutura do Projeto

```text
 Entre_nos
 ┣  app              # Código do Backend (FastAPI)
 ┃ ┣  routes         # Endpoints da API (cartas, eventos)
 ┃ ┗  __init__.py
 ┣  frontend         # Código do Frontend (React + Vite)
 ┃ ┣  src            # Código-fonte principal (Componentes, Views, CSS)
 ┃ ┣  public         # Assets públicos
 ┃ ┗  package.json   # Dependências do frontend
 ┣  main.py          # Arquivo de inicialização do Backend
 ┗  requirements.txt # Dependências do Backend Python
```

---

<div align="center">
  <p>Feito com ❤️ por <a href="https://github.com/devjoabe">Joabe</a></p>
</div>
