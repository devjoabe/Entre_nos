from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from datetime import datetime
from app.database import get_db
from app.models import CartaDB
from app.auth_middleware import verify_token

router = APIRouter(prefix="/cartas")

class CartaCreate(BaseModel):
    titulo: str
    conteudo: str

class Carta(CartaCreate):
    id: str
    data_criacao: datetime

    class Config:
        orm_mode = True
        from_attributes = True

@router.get("/", dependencies=[Depends(verify_token)])
def listar_cartas(db: Session = Depends(get_db)):
    return db.query(CartaDB).all()

@router.post("/", dependencies=[Depends(verify_token)])
def criar_carta(carta: CartaCreate, db: Session = Depends(get_db)):
    nova_carta = CartaDB(
        titulo=carta.titulo,
        conteudo=carta.conteudo,
        data_criacao=datetime.now()
    )
    db.add(nova_carta)
    db.commit()
    db.refresh(nova_carta)
    return {"msg": "Carta criada", "id": nova_carta.id}

@router.get("/{id}", dependencies=[Depends(verify_token)])
def ler_carta(id: str, db: Session = Depends(get_db)):
    carta = db.query(CartaDB).filter(CartaDB.id == id).first()
    if not carta:
        raise HTTPException(status_code=404, detail="Carta não encontrada")
    return carta

@router.put("/{id}", dependencies=[Depends(verify_token)])
def atualizar_carta(id: str, carta_update: CartaCreate, db: Session = Depends(get_db)):
    carta = db.query(CartaDB).filter(CartaDB.id == id).first()
    if not carta:
        raise HTTPException(status_code=404, detail="Carta não encontrada")
    carta.titulo = carta_update.titulo
    carta.conteudo = carta_update.conteudo
    db.commit()
    return {"msg": "Carta atualizada"}

@router.delete("/{id}", dependencies=[Depends(verify_token)])
def deletar_carta(id: str, db: Session = Depends(get_db)):
    carta = db.query(CartaDB).filter(CartaDB.id == id).first()
    if not carta:
        raise HTTPException(status_code=404, detail="Carta não encontrada")
    db.delete(carta)
    db.commit()
    return {"msg": "Carta deletada"}