from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import cartas, eventos, auth
from app.database import engine
from app import models

# Cria as tabelas no banco de dados se não existirem
models.Base.metadata.create_all(bind=engine)

app = FastAPI()

# Permite que o frontend (React) converse com o backend (FastAPI) sem dar erro de CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Para desenvolvimento, aceita requisições de qualquer origem
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(cartas.router)
app.include_router(eventos.router)