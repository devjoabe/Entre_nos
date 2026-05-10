from sqlalchemy import Column, String, Text, DateTime
from datetime import datetime
import uuid
from .database import Base

def generate_uuid():
    return str(uuid.uuid4())

class CartaDB(Base):
    __tablename__ = "cartas"

    id = Column(String, primary_key=True, index=True, default=generate_uuid)
    titulo = Column(String, index=True)
    conteudo = Column(Text)
    data_criacao = Column(DateTime, default=datetime.utcnow)

class EventoDB(Base):
    __tablename__ = "eventos"

    id = Column(String, primary_key=True, index=True, default=generate_uuid)
    texto = Column(Text)
    data_evento = Column(DateTime)
