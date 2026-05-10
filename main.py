from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.routes import cartas, eventos, auth, galeria
from app.database import engine
from app import models
import os

# Cria as tabelas no banco de dados se não existirem
models.Base.metadata.create_all(bind=engine)

app = FastAPI()

# Permite que o frontend (React) converse com o backend (FastAPI) sem dar erro de CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Monta a pasta de uploads para servir os arquivos estáticos
if not os.path.exists("uploads"):
    os.makedirs("uploads")
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

app.include_router(auth.router)
app.include_router(cartas.router)
app.include_router(eventos.router)
app.include_router(galeria.router)