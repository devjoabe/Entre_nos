from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from dotenv import load_dotenv
from urllib.parse import urlparse
import os

load_dotenv()

SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./entrenos.db")

if SQLALCHEMY_DATABASE_URL.startswith("sqlite"):
    # SQLite para desenvolvimento local
    engine = create_engine(
        SQLALCHEMY_DATABASE_URL,
        connect_args={"check_same_thread": False}
    )
else:
    # PostgreSQL (Supabase) — usa creator para evitar bug de parsing de username com ponto
    import psycopg2

    parsed = urlparse(SQLALCHEMY_DATABASE_URL)
    db_host = parsed.hostname
    db_port = parsed.port or 5432
    db_name = parsed.path.lstrip("/")
    db_user = parsed.username  # preserva "postgres.PROJECT_REF" corretamente
    db_pass = parsed.password

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

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

# Dependência do FastAPI para injetar a sessão do banco em cada requisição
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
