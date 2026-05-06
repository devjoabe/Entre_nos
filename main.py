from fastapi import FastAPI
from app.routes import cartas

app = FastAPI()

app.include_router(cartas.router)