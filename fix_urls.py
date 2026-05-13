import os
import sys
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from urllib.parse import urlparse
from app.models import FotoDB

load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")
SUPABASE_URL = os.getenv("SUPABASE_URL")

parsed = urlparse(DATABASE_URL)
db_host = parsed.hostname
db_port = parsed.port or 5432
db_name = parsed.path.lstrip("/")
db_user = parsed.username
db_pass = parsed.password

import psycopg2
def _get_pg_connection():
    return psycopg2.connect(
        host=db_host,
        port=db_port,
        dbname=db_name,
        user=db_user,
        password=db_pass,
        sslmode="require"
    )

engine = create_engine("postgresql+psycopg2://", creator=_get_pg_connection)
SessionLocal = sessionmaker(bind=engine)
db = SessionLocal()

fotos = db.query(FotoDB).all()
count = 0
for foto in fotos:
    if foto.url.startswith("/uploads/"):
        filename = foto.url.replace("/uploads/", "")
        foto.url = f"{SUPABASE_URL}/storage/v1/object/public/uploads/{filename}"
        count += 1

db.commit()
print(f"{count} fotos atualizadas com sucesso para a URL do Supabase Storage.")
