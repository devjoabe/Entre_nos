from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from datetime import datetime
import uuid

router = APIRouter(prefix="/cartas")

class CartaCreate(BaseModel):
    titulo: str
    conteudo: str

class Carta(CartaCreate):
    id: str
    data_criacao: datetime

cartas_db: list[Carta] = []

@router.get("/")
def listar_cartas():
    return cartas_db

@router.post("/")
def criar_carta(carta: CartaCreate):
    nova_carta = Carta(
        id=str(uuid.uuid4()),
        titulo=carta.titulo,
        conteudo=carta.conteudo,
        data_criacao=datetime.now()
    )
    cartas_db.append(nova_carta)
    return {"msg": "Carta criada", "id": nova_carta.id}

@router.get("/{id}")
def ler_carta(id: str):
    for carta in cartas_db:
        if carta.id == id:
            return carta
    raise HTTPException(status_code=404, detail="Carta não encontrada")

@router.put("/{id}")
def atualizar_carta(id: str, carta_update: CartaCreate):
    for i, carta in enumerate(cartas_db):
        if carta.id == id:
            cartas_db[i].titulo = carta_update.titulo
            cartas_db[i].conteudo = carta_update.conteudo
            return {"msg": "Carta atualizada"}
    raise HTTPException(status_code=404, detail="Carta não encontrada")

@router.delete("/{id}")
def deletar_carta(id: str):
    for i, carta in enumerate(cartas_db):
        if carta.id == id:
            cartas_db.pop(i)
            return {"msg": "Carta deletada"}
    raise HTTPException(status_code=404, detail="Carta não encontrada")