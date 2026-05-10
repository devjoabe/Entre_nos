from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import cartas, eventos

app = FastAPI()

# Permite que o frontend (React) converse com o backend (FastAPI) sem dar erro de CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Para desenvolvimento, aceita requisições de qualquer origem
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(cartas.router)
app.include_router(eventos.router)