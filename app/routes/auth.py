from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
from jose import jwt
from datetime import datetime, timedelta
from dotenv import load_dotenv
import os

load_dotenv()

router = APIRouter(prefix="/auth")

SECRET_PASSWORD = os.getenv("SECRET_PASSWORD", "StephenKing")
JWT_SECRET = os.getenv("JWT_SECRET", "entre-nos-segredo-super-secreto-e-longo-2024")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
JWT_EXPIRE_HOURS = int(os.getenv("JWT_EXPIRE_HOURS", "720"))


class LoginRequest(BaseModel):
    password: str


def create_token() -> str:
    expire = datetime.utcnow() + timedelta(hours=JWT_EXPIRE_HOURS)
    payload = {"sub": "entre-nos", "exp": expire}
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


@router.post("/login")
def login(data: LoginRequest):
    if data.password != SECRET_PASSWORD:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Senha incorreta"
        )
    token = create_token()
    return {"access_token": token, "token_type": "bearer"}
