from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from app.database import get_db
from app import models
from app.auth_middleware import verify_token
import shutil
import os
import uuid

router = APIRouter(prefix="/galeria", tags=["galeria"])

UPLOAD_DIR = "uploads"
if not os.path.exists(UPLOAD_DIR):
    os.makedirs(UPLOAD_DIR)

@router.post("/upload")
async def upload_foto(file: UploadFile = File(...), db: Session = Depends(get_db), token: str = Depends(verify_token)):
    # Gera um nome único para o arquivo
    file_extension = os.path.splitext(file.filename)[1]
    unique_filename = f"{uuid.uuid4()}{file_extension}"
    file_path = os.path.join(UPLOAD_DIR, unique_filename)

    # Salva o arquivo no disco
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Salva o registro no banco de dados
    # Armazenamos o caminho relativo para ser servido como estático
    db_foto = models.FotoDB(url=f"/uploads/{unique_filename}")
    db.add(db_foto)
    db.commit()
    db.refresh(db_foto)
    
    return db_foto

@router.get("/")
async def listar_fotos(db: Session = Depends(get_db), token: str = Depends(verify_token)):
    return db.query(models.FotoDB).order_by(models.FotoDB.data_upload.desc()).all()

@router.delete("/{foto_id}")
async def deletar_foto(foto_id: str, db: Session = Depends(get_db), token: str = Depends(verify_token)):
    db_foto = db.query(models.FotoDB).filter(models.FotoDB.id == foto_id).first()
    if not db_foto:
        raise HTTPException(status_code=404, detail="Foto não encontrada")

    # Remove o arquivo do disco
    filename = db_foto.url.replace("/uploads/", "")
    file_path = os.path.join(UPLOAD_DIR, filename)
    if os.path.exists(file_path):
        os.remove(file_path)

    # Remove do banco
    db.delete(db_foto)
    db.commit()
    
    return {"message": "Foto removida com sucesso"}
