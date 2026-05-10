from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from datetime import datetime
import uuid

router = APIRouter(prefix="/eventos")

class EventoCreate(BaseModel):
    texto: str
    data_evento: datetime

class Evento(EventoCreate):
    id: str

eventos_db: list[Evento] = []

@router.get("/")
def listar_eventos():
    return eventos_db

@router.post("/")
def criar_evento(evento: EventoCreate):
    novo_evento = Evento(
        id=str(uuid.uuid4()),
        texto=evento.texto,
        data_evento=evento.data_evento
    )
    eventos_db.append(novo_evento)
    return {"msg": "Evento criado", "id": novo_evento.id}

@router.get("/{id}")
def ler_evento(id: str):
    for evento in eventos_db:
        if evento.id == id:
            return evento
    raise HTTPException(status_code=404, detail="Evento não encontrado")

@router.put("/{id}")
def atualizar_evento(id: str, evento_update: EventoCreate):
    for i, evento in enumerate(eventos_db):
        if evento.id == id:
            eventos_db[i].texto = evento_update.texto
            eventos_db[i].data_evento = evento_update.data_evento
            return {"msg": "Evento atualizado"}
    raise HTTPException(status_code=404, detail="Evento não encontrado")

@router.delete("/{id}")
def deletar_evento(id: str):
    for i, evento in enumerate(eventos_db):
        if evento.id == id:
            eventos_db.pop(i)
            return {"msg": "Evento deletado"}
    raise HTTPException(status_code=404, detail="Evento não encontrado")
