from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

# URL do banco de dados SQLite
# O arquivo entrenos.db será criado na raiz do projeto
SQLALCHEMY_DATABASE_URL = "sqlite:///./entrenos.db"

# O 'check_same_thread' é necessário apenas para o SQLite no FastAPI
engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

# Dependência do FastAPI para injetar a sessão do banco em cada requisição
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
