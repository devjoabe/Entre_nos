from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from datetime import datetime
from app.database import get_db
from app.models import EventoDB
from app.auth_middleware import verify_token

router = APIRouter(prefix="/eventos")

class EventoCreate(BaseModel):
    texto: str
    data_evento: datetime

class Evento(EventoCreate):
    id: str

    class Config:
        orm_mode = True
        from_attributes = True

@router.get("/", dependencies=[Depends(verify_token)])
def listar_eventos(db: Session = Depends(get_db)):
    return db.query(EventoDB).all()

@router.post("/", dependencies=[Depends(verify_token)])
def criar_evento(evento: EventoCreate, db: Session = Depends(get_db)):
    novo_evento = EventoDB(
        texto=evento.texto,
        data_evento=evento.data_evento
    )
    db.add(novo_evento)
    db.commit()
    db.refresh(novo_evento)
    return {"msg": "Evento criado", "id": novo_evento.id}

@router.get("/{id}", dependencies=[Depends(verify_token)])
def ler_evento(id: str, db: Session = Depends(get_db)):
    evento = db.query(EventoDB).filter(EventoDB.id == id).first()
    if not evento:
        raise HTTPException(status_code=404, detail="Evento não encontrado")
    return evento

@router.put("/{id}", dependencies=[Depends(verify_token)])
def atualizar_evento(id: str, evento_update: EventoCreate, db: Session = Depends(get_db)):
    evento = db.query(EventoDB).filter(EventoDB.id == id).first()
    if not evento:
        raise HTTPException(status_code=404, detail="Evento não encontrado")
    evento.texto = evento_update.texto
    evento.data_evento = evento_update.data_evento
    db.commit()
    return {"msg": "Evento atualizado"}

@router.delete("/{id}", dependencies=[Depends(verify_token)])
def deletar_evento(id: str, db: Session = Depends(get_db)):
    evento = db.query(EventoDB).filter(EventoDB.id == id).first()
    if not evento:
        raise HTTPException(status_code=404, detail="Evento não encontrado")
    db.delete(evento)
    db.commit()
    return {"msg": "Evento deletado"}
