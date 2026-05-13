from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from app.database import get_db
from app import models
from app.auth_middleware import verify_token
from dotenv import load_dotenv
import os
import uuid
import mimetypes

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
BUCKET_NAME = "uploads"

# Inicializa cliente Supabase apenas se as variáveis estiverem configuradas
supabase_client = None
if SUPABASE_URL and SUPABASE_KEY:
    from supabase import create_client
    supabase_client = create_client(SUPABASE_URL, SUPABASE_KEY)

router = APIRouter(prefix="/galeria", tags=["galeria"])

@router.post("/upload")
async def upload_foto(file: UploadFile = File(...), db: Session = Depends(get_db), token: str = Depends(verify_token)):
    file_extension = os.path.splitext(file.filename)[1]
    unique_filename = f"{uuid.uuid4()}{file_extension}"
    file_contents = await file.read()

    if supabase_client:
        # Envia para o Supabase Storage
        content_type, _ = mimetypes.guess_type(file.filename)
        if content_type is None:
            content_type = "application/octet-stream"

        supabase_client.storage.from_(BUCKET_NAME).upload(
            path=unique_filename,
            file=file_contents,
            file_options={"content-type": content_type, "upsert": "true"}
        )
        # URL pública permanente do Supabase
        public_url = f"{SUPABASE_URL}/storage/v1/object/public/{BUCKET_NAME}/{unique_filename}"
    else:
        # Fallback: salva no disco local (modo desenvolvimento)
        UPLOAD_DIR = "uploads"
        os.makedirs(UPLOAD_DIR, exist_ok=True)
        file_path = os.path.join(UPLOAD_DIR, unique_filename)
        with open(file_path, "wb") as buffer:
            buffer.write(file_contents)
        public_url = f"/uploads/{unique_filename}"

    db_foto = models.FotoDB(url=public_url)
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

    if supabase_client and "/storage/v1/object/public/" in db_foto.url:
        # Remove do Supabase Storage
        filename = db_foto.url.split(f"/{BUCKET_NAME}/")[-1]
        supabase_client.storage.from_(BUCKET_NAME).remove([filename])
    elif db_foto.url.startswith("/uploads/"):
        # Remove do disco local (fallback)
        filename = db_foto.url.replace("/uploads/", "")
        file_path = os.path.join("uploads", filename)
        if os.path.exists(file_path):
            os.remove(file_path)

    db.delete(db_foto)
    db.commit()

    return {"message": "Foto removida com sucesso"}

